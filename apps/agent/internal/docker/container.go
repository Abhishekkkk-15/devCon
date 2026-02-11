package docker

import (
	"context"

	"github.com/abhishekkkk-15/devcon/agent/internal/app"
	dockerclient "github.com/moby/moby/client"
)

type ContainerCfg struct {
	Image string
}

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

func (d *Daemon) CreateContainers(cfg *ContainerCfg) (*dockerclient.ContainerCreateResult, error) {
	res, err := d.client.ContainerCreate(context.Background(), dockerclient.ContainerCreateOptions{
		Image: cfg.Image,
	})
	return &res, err
}
