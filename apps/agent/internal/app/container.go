package app

import (
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"regexp"
	"strings"
	"time"

	"github.com/abhishekkkk-15/devcon/agent/internal/core/domain"
	"github.com/abhishekkkk-15/devcon/agent/internal/core/service"
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

func (a *ContainerApp) ListResources(ctx context.Context) ([]domain.Resource, error) {
	containers, err := a.containerService.ListContainers(ctx)
	if err != nil {
		return nil, err
	}

	resources := make([]domain.Resource, 0, len(containers.Items))
	for _, container := range containers.Items {
		resourceType := inferResourceType(container.Image)
		if container.Labels != nil {
			if val, ok := container.Labels["devcon.resource_type"]; ok && val != "" {
				resourceType = val
			} else if _, ok := container.Labels["com.docker.compose.project"]; ok {
				resourceType = "custom"
			}
		}

		resource := domain.Resource{
			ID:        container.ID,
			Name:      firstContainerName(container.Names),
			Image:     container.Image,
			Type:      resourceType,
			Status:    strings.ToUpper(string(container.State)),
			CreatedAt: container.Created,
		}

		for _, port := range container.Ports {
			if port.PublicPort != 0 {
				resource.HostPorts = append(resource.HostPorts, fmt.Sprintf("%d", port.PublicPort))
			}
			if port.PrivatePort != 0 {
				resource.ContainerPort = append(resource.ContainerPort, fmt.Sprintf("%d", port.PrivatePort))
			}
		}

		resources = append(resources, resource)
	}

	return resources, nil
}

func (a *ContainerApp) Start(ctx context.Context, id string) error {
	if id == "" {
		return fmt.Errorf("container id cannot be empty")
	}

	return a.containerService.StartContainer(ctx, id)
}

func (a *ContainerApp) Restart(ctx context.Context, id string) error {
	if id == "" {
		return fmt.Errorf("container id cannot be empty")
	}

	return a.containerService.RestartContainer(ctx, id)
}

func (a *ContainerApp) Stop(ctx context.Context, id string) error {
	if id == "" {
		return fmt.Errorf("container id cannot be empty")
	}

	return a.containerService.StopContainer(ctx, id)
}

func (a *ContainerApp) Delete(ctx context.Context, id string) error {
	if id == "" {
		return fmt.Errorf("container id cannot be empty")
	}

	return a.containerService.DeleteContainer(ctx, id)
}

func (a *ContainerApp) GetResourceDetails(ctx context.Context, id string) (*domain.ResourceDetails, error) {
	if id == "" {
		return nil, fmt.Errorf("container id cannot be empty")
	}

	inspect, err := a.containerService.InsepectContainer(ctx, id)
	if err != nil {
		return nil, err
	}

	resourceType := inferResourceType(inspect.Container.Config.Image)
	if inspect.Container.Config.Labels != nil {
		if val, ok := inspect.Container.Config.Labels["devcon.resource_type"]; ok && val != "" {
			resourceType = val
		} else if _, ok := inspect.Container.Config.Labels["com.docker.compose.project"]; ok {
			resourceType = "custom"
		}
	}

	details := &domain.ResourceDetails{
		ID:             inspect.Container.ID,
		Name:           strings.TrimPrefix(inspect.Container.Name, "/"),
		Image:          inspect.Container.Config.Image,
		Type:           resourceType,
		Status:         strings.ToUpper(string(inspect.Container.State.Status)),
		CreatedAt:      0,
		Command:        inspect.Container.Config.Cmd,
		Env:            inspect.Container.Config.Env,
		Labels:         inspect.Container.Config.Labels,
		HostPorts:      make([]string, 0),
		ContainerPorts: make([]string, 0),
		Networks:       make([]string, 0),
		Mounts:         make([]string, 0),
	}

	for port, bindings := range inspect.Container.NetworkSettings.Ports {
		details.ContainerPorts = append(details.ContainerPorts, fmt.Sprintf("%d", port.Num()))
		if len(bindings) > 0 {
			details.HostPorts = append(details.HostPorts, bindings[0].HostPort)
		}
	}

	for networkName := range inspect.Container.NetworkSettings.Networks {
		details.Networks = append(details.Networks, networkName)
	}

	for _, mount := range inspect.Container.Mounts {
		if mount.Source != "" && mount.Destination != "" {
			details.Mounts = append(details.Mounts, fmt.Sprintf("%s:%s", mount.Source, mount.Destination))
		}
	}

	if createdAt, err := time.Parse(time.RFC3339Nano, inspect.Container.Created); err == nil {
		details.CreatedAt = createdAt.Unix()
	}

	return details, nil
}

func (a *ContainerApp) GetResourceLogs(ctx context.Context, id string, tail int) (string, error) {
	if id == "" {
		return "", fmt.Errorf("container id cannot be empty")
	}
	if tail <= 0 {
		tail = 200
	}

	return a.containerService.GetContainerLogs(ctx, id, tail)
}

func (a *ContainerApp) StartDevconWeb(
	ctx context.Context,
	cfg *domain.ContainerCfg,
) (*domain.DevconStatus, error) {

	if err := a.containerService.PingDaemon(ctx); err != nil {
		return nil, err
	}

	cfg.Name = strings.TrimSpace(cfg.Name)
	if strings.TrimSpace(cfg.Compose) != "" {
		return a.startComposeStack(ctx, cfg)
	}
	if cfg.Type == "" {
		cfg.Type = "compute"
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

func (a *ContainerApp) startComposeStack(ctx context.Context, cfg *domain.ContainerCfg) (*domain.DevconStatus, error) {
	composeContent := strings.TrimSpace(cfg.Compose)
	if composeContent == "" {
		return nil, fmt.Errorf("compose payload cannot be empty")
	}

	project := composeProjectName(cfg.Name)

	tmpFile, err := os.CreateTemp("", fmt.Sprintf("devcon-compose-%s-*.yml", project))
	if err != nil {
		return nil, err
	}
	defer os.Remove(tmpFile.Name())

	if _, err := tmpFile.WriteString(composeContent); err != nil {
		tmpFile.Close()
		return nil, err
	}

	if err := tmpFile.Close(); err != nil {
		return nil, err
	}

	alreadyRunning, err := isComposeProjectRunning(ctx, tmpFile.Name(), project)
	if err != nil {
		return nil, err
	}

	cmd := exec.CommandContext(ctx, "docker", "compose", "-f", tmpFile.Name(), "-p", project, "up", "-d")
	output, err := cmd.CombinedOutput()
	if err != nil {
		return nil, fmt.Errorf("failed to start compose stack: %w - %s", err, string(output))
	}

	return &domain.DevconStatus{
		ID:             project,
		Name:           cfg.Name,
		Image:          "docker-compose stack",
		State:          "running",
		AlreadyExisted: alreadyRunning,
	}, nil
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

func firstContainerName(names []string) string {
	for _, name := range names {
		if name != "" {
			return strings.TrimPrefix(name, "/")
		}
	}
	return ""
}

var composeProjectRegexp = regexp.MustCompile(`[^a-z0-9]+`)

func isComposeProjectRunning(ctx context.Context, composeFile, project string) (bool, error) {
	cmd := exec.CommandContext(ctx, "docker", "compose", "-f", composeFile, "-p", project, "ps", "-q")
	output, err := cmd.Output()
	if err != nil {
		return false, fmt.Errorf("failed to inspect compose stack: %w", err)
	}

	return len(bytes.TrimSpace(output)) > 0, nil
}

func composeProjectName(name string) string {
	base := strings.ToLower(strings.TrimSpace(name))
	if base == "" {
		base = "custom-stack"
	}
	sanitized := composeProjectRegexp.ReplaceAllString(base, "-")
	sanitized = strings.Trim(sanitized, "-")
	if sanitized == "" {
		return "custom-stack"
	}
	return sanitized
}

func inferResourceType(image string) string {
	normalized := strings.ToLower(image)

	switch {
	case strings.Contains(normalized, "postgres"):
		return "postgres"
	case strings.Contains(normalized, "redis"):
		return "redis"
	default:
		return "compute"
	}
}
