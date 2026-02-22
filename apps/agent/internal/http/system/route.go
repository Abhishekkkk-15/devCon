package systemRouter

import (
	"context"

	"github.com/abhishekkkk-15/devcon/agent/internal/app"
	"github.com/gin-gonic/gin"
)

type SystemRouter struct {
	handler *SystemHandler
}

type SystemHandler struct {
	app *app.SystemApp
}

func NewSystemRouter(handler *SystemHandler) *SystemRouter {
	return &SystemRouter{handler: handler}

}

func (h *SystemRouter) SetupSysterRouter(router *gin.Engine) {
	router.GET("/stats", h.handler.SystemStatsHandler)
}

func NewSystemHandler(app *app.SystemApp) *SystemHandler {
	return &SystemHandler{
		app: app,
	}
}

func (a *SystemHandler) SystemStatsHandler(c *gin.Context) {
	ctx := context.Background()
	stats, err := a.app.GetSystemStats(&ctx)
	if err != nil {
		c.JSON(400, gin.H{
			"message": "Bad request",
		})
	}
	c.JSON(200, gin.H{
		"stats": stats,
	})
}
