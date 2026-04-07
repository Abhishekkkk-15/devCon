package main

import (
	"github.com/abhishekkkk-15/devcon/agent/internal/app"
	"github.com/abhishekkkk-15/devcon/agent/internal/core/service"
	"github.com/abhishekkkk-15/devcon/agent/internal/core/util"
	"github.com/abhishekkkk-15/devcon/agent/internal/infra/docker"
	"github.com/abhishekkkk-15/devcon/agent/internal/infra/system"
	"github.com/abhishekkkk-15/devcon/agent/internal/transport/cli"
	"github.com/abhishekkkk-15/devcon/agent/internal/transport/cli/commands"
)

func main() {
	util.InitializeEnv()

	// --- Infrastructure ---
	dockerDaemon, err := docker.NewDaemon()
	if err != nil {
		panic(err)
	}
	systemRepo := system.NewSystemRepo()

	// --- Core Services ---
	containerService := service.NewContainerService(dockerDaemon)
	systemService := service.NewSystemService(systemRepo)

	// --- Application Layer ---
	containerApp := app.NewContainerApp(*containerService)
	systemApp := app.NewSystemApp(systemService)

	// --- CLI Transport ---
	rootCmd := cli.NewRootCmd()
	rootCmd.AddCommand(commands.NewListCmd(containerApp))
	rootCmd.AddCommand(commands.NewDevconCommand(containerApp))
	rootCmd.AddCommand(commands.NewStartServer(containerApp, systemApp))

	if err := rootCmd.Execute(); err != nil {
		panic(err)
	}
}
