package app

import (
	"context"
	"fmt"
	"strings"

	"github.com/abhishekkkk-15/devcon/agent/internal/domain"
	"github.com/abhishekkkk-15/devcon/agent/internal/service"
	dockerclient "github.com/moby/moby/client"
)

type ContainerApp struct {
	containerService service.ContainerService
}

func NewContainerApp(c service.ContainerService) *ContainerApp {
	return &ContainerApp{
		containerService: c,
	}
}

func (a *ContainerApp) List(ctx context.Context) (dockerclient.ContainerListResult, error) {
	return a.containerService.ListContainers(ctx)
}

func (a *ContainerApp) Start(ctx context.Context, id string) error {
	if id == "" {
		return fmt.Errorf("container id cannot be empty")
	}

	return a.containerService.StartContainer(ctx, id)
}

func (a *ContainerApp) Stop(ctx context.Context, id string) error {
	if id == "" {
		return fmt.Errorf("container id cannot be empty")
	}

	return a.containerService.StopContainer(ctx, id)
}

func (a *ContainerApp) StartDevconWeb(
	ctx context.Context,
	cfg *domain.ContainerCfg,
) (*domain.DevconStatus, error) {

	if err := a.containerService.PingDaemon(ctx); err != nil {
		return nil, err
	}

	container, err := a.containerService.FindContainer(ctx, cfg.Name)
	if err != nil {
		return nil, err
	}

	if container.ID != "" {

		if container.State != "running" {
			if err := a.containerService.StartContainer(ctx, container.ID); err != nil {
				return nil, err
			}
		}

		inspect, err := a.containerService.InsepectContainer(ctx, container.ID)
		if err != nil {
			return nil, err
		}

		return buildDevconStatus(inspect, true), nil
	}

	created, err := a.containerService.CreateContainer(ctx, cfg)
	if err != nil {
		return nil, err
	}

	if err := a.containerService.StartContainer(ctx, created.ID); err != nil {
		return nil, err
	}

	inspect, err := a.containerService.InsepectContainer(ctx, created.ID)
	if err != nil {
		return nil, err
	}

	return buildDevconStatus(inspect, false), nil
}

func (a *ContainerApp) EnsureRunning(ctx context.Context, identifier string) error {
	running, err := a.containerService.IsContainerRunning(ctx, identifier)
	if err != nil {
		return err
	}

	if running.ID != "" {
		return nil
	}

	return fmt.Errorf("container %s is not running", identifier)
}
func buildDevconStatus(
	inspect dockerclient.ContainerInspectResult,
	existed bool,
) *domain.DevconStatus {

	c := inspect.Container

	status := &domain.DevconStatus{
		ID:             c.ID,
		Name:           strings.TrimPrefix(c.Name, "/"),
		Image:          c.Config.Image,
		State:          string(c.State.Status),
		AlreadyExisted: existed,
	}

	for port, bindings := range c.NetworkSettings.Ports {
		if len(bindings) > 0 {
			status.ContainerPort = string(port.String())
			status.HostPort = bindings[0].HostPort
			break
		}
	}

	return status
}
