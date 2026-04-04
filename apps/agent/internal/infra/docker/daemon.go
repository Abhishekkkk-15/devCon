package docker

import (
	"context"
	"fmt"

	dockerclient "github.com/moby/moby/client"
)

type Daemon struct {
	client *dockerclient.Client
}

func NewDaemon() (*Daemon, error) {
	cli, err := dockerclient.New(dockerclient.FromEnv)
	if err != nil {
		return nil, fmt.Errorf("failed to create docker client: %w", err)
	}

	_, err = cli.Ping(context.Background(), dockerclient.PingOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to ping docker daemon: %w", err)
	}

	return &Daemon{client: cli}, nil
}
