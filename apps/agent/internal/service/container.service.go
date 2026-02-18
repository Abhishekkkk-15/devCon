package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/abhishekkkk-15/devcon/agent/internal/domain"
	"github.com/moby/moby/api/types/container"
	dockerclient "github.com/moby/moby/client"
)

type ContainerService struct {
	repo domain.ContainerRepository
}

func NewContainerService(repo domain.ContainerRepository) *ContainerService {
	return &ContainerService{repo: repo}
}

func (c *ContainerService) PingDaemon(ctx context.Context) error {
	return c.repo.Ping(ctx)
}

func (c *ContainerService) ListContainers(ctx context.Context) (dockerclient.ContainerListResult, error) {
	return c.repo.ListContainers(ctx)
}

func (c *ContainerService) StartContainer(ctx context.Context, id string) error {
	return c.repo.StartContainer(ctx, id)
}
func (c *ContainerService) StopContainer(ctx context.Context, id string) error {
	return c.repo.StopContainer(ctx, id)
}

func (c *ContainerService) CreateContainer(ctx context.Context, cfg *domain.ContainerCfg) (*dockerclient.ContainerCreateResult, error) {
	res, err := c.repo.CreateContainer(ctx, cfg)
	if err != nil {
		return nil, err
	}

	return res, nil
}

func (c *ContainerService) InsepectContainer(ctx context.Context, ID string) (dockerclient.ContainerInspectResult, error) {
	container, err := c.repo.InsepectContainer(ctx, ID)
	if err != nil {
		return dockerclient.ContainerInspectResult{}, err
	}
	return container, nil
}

func (c *ContainerService) IsContainerRunning(ctx context.Context, identifier string) (container.Summary, error) {
	containers, err := c.repo.ListContainers(ctx)
	if err != nil {
		return container.Summary{}, err
	}
	for _, cont := range containers.Items {
		if cont.Image == identifier || cont.ID == identifier || cont.Names[0] == identifier {
			return cont, nil
		}
	}
	return container.Summary{}, nil
}
func (c *ContainerService) FindContainer(
	ctx context.Context,
	identifier string,
) (container.Summary, error) {

	containers, err := c.repo.ListContainers(ctx)
	if err != nil {
		return container.Summary{}, err
	}

	for _, cont := range containers.Items {

		if cont.ID == identifier {
			return cont, nil
		}

		if cont.Image == identifier {
			return cont, nil
		}

		for _, name := range cont.Names {
			if strings.TrimPrefix(name, "/") == identifier {
				return cont, nil
			}
		}
	}

	return container.Summary{}, nil
}

func (s *ContainerService) StartDevconIfNotRunning(
	ctx context.Context,
	cfg *domain.ContainerCfg,
) (string, error) {

	container, err := s.IsContainerRunning(ctx, cfg.Image)
	if err != nil {
		return "", err
	}

	if container.ID != "" {
		return "", fmt.Errorf("devcon container is already running")
	}

	res, err := s.repo.CreateContainer(ctx, cfg)
	if err != nil {
		return "", err
	}

	return res.ID, nil
}
