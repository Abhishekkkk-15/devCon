package docker

import (
	"context"
	"net/netip"

	"github.com/abhishekkkk-15/devcon/agent/internal/app"
	"github.com/abhishekkkk-15/devcon/agent/internal/types"
	"github.com/moby/moby/api/types/container"
	"github.com/moby/moby/api/types/network"
	dockerclient "github.com/moby/moby/client"
)

func (d *Daemon) ListContainers() ([]app.Container, error) {
	containers, err := d.client.ContainerList(context.Background(), dockerclient.ContainerListOptions{
		All: true,
	})
	if err != nil {
		return nil, err
	}

	var result []app.Container
	for _, c := range containers.Items {
		result = append(result, app.Container{
			ID:     c.ID,
			Image:  c.Image,
			Status: c.Status,
		})
	}
	return result, nil
}

func (d *Daemon) StartContainers(id string) error {
	_, err := d.client.ContainerStart(context.Background(), id, dockerclient.ContainerStartOptions{})
	if err != nil {
		return err
	}
	return nil
}

func (d *Daemon) StopContainers(id string) error {
	_, err := d.client.ContainerStop(context.Background(), id, dockerclient.ContainerStopOptions{})
	if err != nil {
		return err
	}
	return nil
}

func (d *Daemon) CreateContaiers(cfg *types.ContainerCfg) (*dockerclient.ContainerCreateResult, error) {

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

	res, err := d.client.ContainerCreate(context.Background(), dockerclient.ContainerCreateOptions{
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
