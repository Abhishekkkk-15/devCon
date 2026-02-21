package http

import (
	"github.com/abhishekkkk-15/devcon/agent/internal/app"
	systemRouter "github.com/abhishekkkk-15/devcon/agent/internal/http/system"
	"github.com/abhishekkkk-15/devcon/agent/internal/util"
	"github.com/gin-gonic/gin"
)

func SetupRouter(app *app.SystemApp) *gin.Engine {
	sysHandler := systemRouter.NewSystemHandler(app)
	env := util.GodotEnv("ENV")

	if env == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else if env == "test" {
		gin.SetMode(gin.TestMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	router := gin.Default()

	sysRouter := systemRouter.NewSystemRouter(sysHandler)
	sysRouter.SetupSysterRouter(router)
	return router
}
