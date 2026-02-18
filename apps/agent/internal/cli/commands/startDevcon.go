package commands

import (
	"context"
	"fmt"

	"github.com/abhishekkkk-15/devcon/agent/internal/app"
	"github.com/abhishekkkk-15/devcon/agent/internal/domain"
	"github.com/spf13/cobra"
)

func NewDevconCommand(containerApp *app.ContainerApp) *cobra.Command {

	image := "abhishekkkk-15/devcon:latest"
	var hostPort string
	var containerPort string = "3000"
	var name string = "devcon"

	cmd := &cobra.Command{
		Use:   "start",
		Short: "Start devcon local agent",
		RunE: func(cmd *cobra.Command, args []string) error {

			ctx := context.Background()

			cfg := &domain.ContainerCfg{
				Image:         image,
				Name:          name,
				ContainerPort: containerPort,
				HostPort:      hostPort,
			}

			info, err := containerApp.StartDevconWeb(ctx, cfg)
			if err != nil {
				return fmt.Errorf("failed to start devcon: %w", err)
			}

			if info.AlreadyExisted {
				fmt.Println("ℹ️  Devcon already existed. Showing current state:")
			} else {
				fmt.Println("🚀 Devcon container created successfully.")
			}

			fmt.Printf(`
Name:         %s
Container ID: %s
Image:        %s
State:        %s
Port:         http://localhost:%s
`,
				info.Name,
				info.ID[:12],
				info.Image,
				info.State,
				info.HostPort,
			)
			return nil
		},
	}

	cmd.Flags().StringVar(&hostPort, "p", "3000", "Host port")

	return cmd
}
