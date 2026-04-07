package http

import (
	"github.com/abhishekkkk-15/devcon/agent/internal/app"
	"github.com/abhishekkkk-15/devcon/agent/internal/core/util"
	containerRouter "github.com/abhishekkkk-15/devcon/agent/internal/transport/http/container"
	systemRouter "github.com/abhishekkkk-15/devcon/agent/internal/transport/http/system"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func SetupRouter(systemApp *app.SystemApp, containerApp *app.ContainerApp) *gin.Engine {
	sysHandler := systemRouter.NewSystemHandler(systemApp)
	conHandler := containerRouter.NewContainerHandler(containerApp)

	env := util.GodotEnv("ENV")

	if env == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else if env == "test" {
		gin.SetMode(gin.TestMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	router := gin.Default()
	router.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	// Register Routers
	api := router.Group("/api/v1")
	sysRouter := systemRouter.NewSystemRouter(sysHandler)
	sysRouter.SetupSystemRouter(api)

	conRouter := containerRouter.NewContainerRouter(conHandler)
	conRouter.SetupContainerRouter(api)

	return router
}
