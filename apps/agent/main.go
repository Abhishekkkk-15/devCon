package main

import (
	"context"
	"fmt"

	"github.com/moby/moby/client"
)

func main() {
	// Create a new client that handles common environment variables
	// for configuration (DOCKER_HOST, DOCKER_API_VERSION), and does
	// API-version negotiation to allow downgrading the API version
	// when connecting with an older daemon version.
	apiClient, err := client.New(client.FromEnv)
	// fmt.Print(apiClient.Ping(context.Background(), )
	if err != nil {
		panic(err)
	}
	_, err = apiClient.Ping(context.Background(), client.PingOptions{})
	if err != nil {
		fmt.Print("docker is not running")
		return
	}
	defer apiClient.Close()

	// List all containers (both stopped and running).
	result, err := apiClient.ContainerList(context.Background(), client.ContainerListOptions{
		All: true,
	})
	if err != nil {
		panic(err)
	}

	// Print each container's ID, status and the image it was created from.
	fmt.Printf("%s  %-22s  %s\n", "ID", "STATUS", "IMAGE")
	for _, ctr := range result.Items {
		fmt.Printf("%s  %-22s  %s\n", ctr.ID, ctr.Status, ctr.Image)
	}
}
