package http

import (
	"github.com/abhishekkkk-15/devcon/agent/internal/util"
	"github.com/gin-gonic/gin"
)

func SetupRouter() *gin.Engine {

	env := util.GodotEnv("ENV")

	if env == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else if env == "test" {
		gin.SetMode(gin.TestMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	router := gin.Default()

	return router
}
