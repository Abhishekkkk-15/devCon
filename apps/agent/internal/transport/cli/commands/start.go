package commands

import (
	"log"

	"github.com/abhishekkkk-15/devcon/agent/internal/app"
	"github.com/abhishekkkk-15/devcon/agent/internal/transport/http"
	"github.com/abhishekkkk-15/devcon/agent/internal/core/util"
	"github.com/spf13/cobra"
)

func NewStartServer(containerApp *app.ContainerApp, systemApp *app.SystemApp) *cobra.Command {
	var daemon bool

	cmd := &cobra.Command{
		Use:   "server",
		Short: "Start Backend server",
		RunE: func(cmd *cobra.Command, args []string) error {
			port := util.GodotEnv("PORT")
			if port == "" {
				port = "8080"
			}

			router := http.SetupRouter(systemApp, containerApp)

			if daemon {
				go func() {
					if err := router.Run(":" + port); err != nil {
						log.Println("Server error:", err)
					}
				}()
				log.Println("Server started in background on port", port)
				return nil
			}

			log.Println("Server running on port", port)
			return router.Run(":" + port)
		},
	}

	cmd.Flags().BoolVarP(&daemon, "daemon", "d", false, "Run server in background")
	return cmd
}
