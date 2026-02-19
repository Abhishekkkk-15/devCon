package main

import (
	"github.com/abhishekkkk-15/devcon/agent/internal/app"
	"github.com/abhishekkkk-15/devcon/agent/internal/cli"
	"github.com/abhishekkkk-15/devcon/agent/internal/cli/commands"
	"github.com/abhishekkkk-15/devcon/agent/internal/docker"
	"github.com/abhishekkkk-15/devcon/agent/internal/service"
	"github.com/abhishekkkk-15/devcon/agent/internal/util"
)

func main() {
	util.InitializeEnv()
	dockerDaemon, err := docker.NewDaemon()
	if err != nil {
		panic(err)
	}

	containerRepo := dockerDaemon

	containerService := service.NewContainerService(containerRepo)
	containerApp := app.NewContainerApp(*containerService)

	rootCmd := cli.NewRootCmd()
	rootCmd.AddCommand(commands.NewListCmd(containerApp))
	rootCmd.AddCommand(commands.NewDevconCommand(containerApp))
	rootCmd.AddCommand(commands.NewStartServer(containerApp))
	if err := rootCmd.Execute(); err != nil {
		panic(err)
	}

}
