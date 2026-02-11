package app

import (
	"fmt"
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
