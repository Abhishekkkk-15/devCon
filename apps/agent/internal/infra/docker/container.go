package docker

import (
	"bytes"
	"context"
	"encoding/binary"
	"io"
	"net/netip"
	"strconv"

	"github.com/abhishekkkk-15/devcon/agent/internal/core/domain"
	containertypes "github.com/moby/moby/api/types/container"
	"github.com/moby/moby/api/types/network"
	dockerclient "github.com/moby/moby/client"
)

func (d *Daemon) EnsureImage(ctx context.Context, image string) error {
	if image == "" {
		return nil
	}

	response, err := d.client.ImagePull(ctx, image, dockerclient.ImagePullOptions{})
	if err != nil {
		return err
	}
	defer response.Close()

	_, err = io.Copy(io.Discard, response)
	return err
}

func (d *Daemon) Ping(ctx context.Context) error {

	_, err := d.client.Ping(ctx, dockerclient.PingOptions{})
	if err != nil {

		return err
	}
	return nil
}

func (d *Daemon) ListContainers(ctx context.Context) (dockerclient.ContainerListResult, error) {
	containers, err := d.client.ContainerList(ctx, dockerclient.ContainerListOptions{
		All: true,
	})
	if err != nil {
		return dockerclient.ContainerListResult{}, err
	}

	return containers, nil
}

func (d *Daemon) StartContainer(ctx context.Context, id string) error {
	_, err := d.client.ContainerStart(ctx, id, dockerclient.ContainerStartOptions{})
	if err != nil {
		return err
	}
	return nil
}

func (d *Daemon) RestartContainer(ctx context.Context, id string) error {
	_, err := d.client.ContainerRestart(ctx, id, dockerclient.ContainerRestartOptions{})
	if err != nil {
		return err
	}
	return nil
}

func (d *Daemon) StopContainer(ctx context.Context, id string) error {
	_, err := d.client.ContainerStop(ctx, id, dockerclient.ContainerStopOptions{})
	if err != nil {
		return err
	}
	return nil
}

func (d *Daemon) DeleteContainer(ctx context.Context, id string) error {
	_, err := d.client.ContainerRemove(ctx, id, dockerclient.ContainerRemoveOptions{
		Force: true,
	})
	return err
}

func (d *Daemon) CreateContainer(ctx context.Context, cfg *domain.ContainerCfg) (*dockerclient.ContainerCreateResult, error) {

	port, err := network.ParsePort(cfg.ContainerPort + "/tcp")
	if err != nil {
		return nil, err
	}
	ip, err := netip.ParseAddr("0.0.0.0")
	if err != nil {
		return nil, err
	}
	// **Imp**
	// 	Container world  â† Config
	// Host world       â† HostConfig

	labels := map[string]string{
		"devcon.resource_name": cfg.Name,
	}
	if cfg.Type != "" {
		labels["devcon.resource_type"] = cfg.Type
	}

	res, err := d.client.ContainerCreate(ctx, dockerclient.ContainerCreateOptions{
		Name: cfg.Name,
		Config: &containertypes.Config{
			Image:  cfg.Image,
			Env:    cfg.Env,
			Labels: labels,
			ExposedPorts: network.PortSet{
				port: struct{}{},
			},
		},
		HostConfig: &containertypes.HostConfig{
			PortBindings: network.PortMap{
				port: []network.PortBinding{
					{
						HostIP:   ip,
						HostPort: cfg.HostPort,
					},
				},
			},
		},
	})

	if err != nil {
		return nil, err
	}

	return &res, nil
}

func (d *Daemon) InsepectContainer(ctx context.Context, ID string) (dockerclient.ContainerInspectResult, error) {
	return d.client.ContainerInspect(ctx, ID, dockerclient.ContainerInspectOptions{})
}

func (d *Daemon) GetContainerLogs(ctx context.Context, ID string, tail int) (string, error) {
	reader, err := d.client.ContainerLogs(ctx, ID, dockerclient.ContainerLogsOptions{
		ShowStdout: true,
		ShowStderr: true,
		Tail:       strconv.Itoa(tail),
		Timestamps: true,
	})
	if err != nil {
		return "", err
	}
	defer reader.Close()

	var stdout bytes.Buffer
	if err := copyDockerLogStream(&stdout, reader); err != nil {
		return "", err
	}

	logs, err := io.ReadAll(&stdout)
	if err != nil {
		return "", err
	}

	return string(logs), nil
}

func copyDockerLogStream(dst io.Writer, src io.Reader) error {
	header := make([]byte, 8)

	for {
		if _, err := io.ReadFull(src, header); err != nil {
			if err == io.EOF || err == io.ErrUnexpectedEOF {
				return nil
			}
			return err
		}

		frameSize := binary.BigEndian.Uint32(header[4:])
		if frameSize == 0 {
			continue
		}

		if _, err := io.CopyN(dst, src, int64(frameSize)); err != nil {
			if err == io.EOF || err == io.ErrUnexpectedEOF {
				return nil
			}
			return err
		}
	}
}
