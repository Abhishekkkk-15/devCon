package container

import (
	"context"
	"net/http"

	"github.com/abhishekkkk-15/devcon/agent/internal/app"
	"github.com/abhishekkkk-15/devcon/agent/internal/core/domain"
	"github.com/gin-gonic/gin"
)

type ContainerHandler struct {
	app *app.ContainerApp
}

func NewContainerHandler(app *app.ContainerApp) *ContainerHandler {
	return &ContainerHandler{
		app: app,
	}
}

func (h *ContainerHandler) ListHandler(c *gin.Context) {
	ctx := context.Background()
	containers, err := h.app.List(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, containers)
}

func (h *ContainerHandler) StartHandler(c *gin.Context) {
	id := c.Param("id")
	ctx := context.Background()
	if err := h.app.Start(ctx, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Container started"})
}

func (h *ContainerHandler) StopHandler(c *gin.Context) {
	id := c.Param("id")
	ctx := context.Background()
	if err := h.app.Stop(ctx, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Container stopped"})
}

func (h *ContainerHandler) StartDevconHandler(c *gin.Context) {
	var cfg domain.ContainerCfg
	if err := c.ShouldBindJSON(&cfg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := context.Background()
	status, err := h.app.StartDevconWeb(ctx, &cfg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusAccepted, status)
}
