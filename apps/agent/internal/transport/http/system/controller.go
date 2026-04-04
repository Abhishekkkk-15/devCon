package system

import (
	"context"

	"github.com/abhishekkkk-15/devcon/agent/internal/app"
	"github.com/gin-gonic/gin"
)

type SystemHandler struct {
	app *app.SystemApp
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
