package commands

import (
	"log"

	"github.com/abhishekkkk-15/devcon/agent/internal/app"
	"github.com/abhishekkkk-15/devcon/agent/internal/http"
	"github.com/abhishekkkk-15/devcon/agent/internal/util"
	"github.com/spf13/cobra"
)

func NewStartServer(containerApp *app.ContainerApp) *cobra.Command {

	cmd := &cobra.Command{
		Use:   "server",
		Short: "Start Backend server",
		RunE: func(cmd *cobra.Command, args []string) error {
			router := http.SetupRouter()
			port := util.GodotEnv("PORT")
			if port == "" {
				port = "8080"
			}

			log.Fatal(router.Run(":" + port))
			return nil
		},
	}

	return cmd
}
