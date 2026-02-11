package main

import (
	"github.com/abhishekkkk-15/devcon/agent/internal/app"
	"github.com/abhishekkkk-15/devcon/agent/internal/docker"
)

func main() {
	daemon, _ := docker.NewDaemon()
	dockerApp := app.NewContainerApp(daemon)
	dockerApp.List()
}
