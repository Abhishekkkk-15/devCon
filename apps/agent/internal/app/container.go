package app

import (
	"fmt"

	"github.com/abhishekkkk-15/devcon/agent/internal/types"
	dockerclient "github.com/moby/moby/client"
)

type Container struct {
	ID     string
	Image  string
	Status string
}

type DockerManager interface {
	ListContainers() ([]Container, error)
	StartContainers(id string) error
	StopContainers(id string) error
	CreateContaiers(cfg *types.ContainerCfg) (*dockerclient.ContainerCreateResult, error)
}

type ContainerApp struct {
	docker DockerManager
}

func NewContainerApp(d DockerManager) *ContainerApp {
	return &ContainerApp{
		docker: d,
	}
}

func (d *ContainerApp) List() ([]Container, error) {
	container, err := d.docker.ListContainers()
	if err != nil {
		return nil, err
	}
	fmt.Print(container)
	return container, nil
}

func (d *ContainerApp) Start(id string) error {
	if id == "" {
		return fmt.Errorf("container id cannot be empty")
	}

	return d.docker.StartContainers(id)
}

func (d *ContainerApp) Stop(id string) error {
	if id == "" {
		return fmt.Errorf("container id cannot be empty")
	}
	return d.docker.StopContainers(id)
}

func (d *ContainerApp) StartDevconWeb(cfg *types.ContainerCfg) (string, error) {
	cont, err := d.docker.CreateContaiers(cfg)
	if err != nil {
		return "", err
	}
	return cont.ID, nil
}
