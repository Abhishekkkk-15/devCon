package commands

import (
	"context"
	"fmt"

	"github.com/abhishekkkk-15/devcon/agent/internal/app"
	"github.com/spf13/cobra"
)

func NewListCmd(containerApp *app.ContainerApp) *cobra.Command {
	return &cobra.Command{
		Use:   "list",
		Short: "List containers",
		RunE: func(cmd *cobra.Command, args []string) error {
			ctx := context.Background()

			containers, err := containerApp.List(ctx)
			if err != nil {
				return err
			}

			for i, c := range containers.Items {
				fmt.Printf(`
================ CONTAINER %d ================
ID:            %s
Short ID:      %s
Image:         %s
Status:        %s
Created:       %s
Ports:         %v
Names:         %v
==============================================

`, i+1,
					c.ID,
					c.ID[:12],
					c.Image,
					c.Status,
					c.Created,
					c.Ports,
					c.Names,
				)
			}

			return nil
		},
	}
}
