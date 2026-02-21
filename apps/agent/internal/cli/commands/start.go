package commands

import (
	"log"

	"github.com/abhishekkkk-15/devcon/agent/internal/app"
	"github.com/abhishekkkk-15/devcon/agent/internal/http"
	"github.com/abhishekkkk-15/devcon/agent/internal/service"
	"github.com/abhishekkkk-15/devcon/agent/internal/system"
	"github.com/abhishekkkk-15/devcon/agent/internal/util"
	"github.com/spf13/cobra"
)

func NewStartServer(containerApp *app.ContainerApp) *cobra.Command {

	cmd := &cobra.Command{
		Use:   "server",
		Short: "Start Backend server",
		RunE: func(cmd *cobra.Command, args []string) error {
			port := util.GodotEnv("PORT")
			if port == "" {
				port = "8080"
			}
			systemRepo := system.NewSystemRepo()
			systemService := service.NewSystemService(systemRepo)
			systemApp := app.NewSystemApp(systemService)
			router := http.SetupRouter(systemApp)
			log.Fatal(router.Run(":" + port))
			return nil
		},
	}

	return cmd
}
