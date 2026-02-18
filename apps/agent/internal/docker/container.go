package docker

import (
	"context"
	"net/netip"

	"github.com/abhishekkkk-15/devcon/agent/internal/domain"
	"github.com/moby/moby/api/types/container"
	"github.com/moby/moby/api/types/network"
	dockerclient "github.com/moby/moby/client"
)

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

func (d *Daemon) StopContainer(ctx context.Context, id string) error {
	_, err := d.client.ContainerStop(ctx, id, dockerclient.ContainerStopOptions{})
	if err != nil {
		return err
	}
	return nil
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
	// 	Container world  ← Config
	// Host world       ← HostConfig

	res, err := d.client.ContainerCreate(ctx, dockerclient.ContainerCreateOptions{
		Name: cfg.Name,
		Config: &container.Config{
			Image: cfg.Image,
			ExposedPorts: network.PortSet{
				port: struct{}{},
			},
		},
		HostConfig: &container.HostConfig{
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
