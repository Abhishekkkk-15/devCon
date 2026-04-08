package container

import (
	"context"
	"net/http"
	"strconv"

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

func (h *ContainerHandler) ResourceListHandler(c *gin.Context) {
	ctx := context.Background()
	resources, err := h.app.ListResources(ctx)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"resources": resources})
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

func (h *ContainerHandler) RestartHandler(c *gin.Context) {
	id := c.Param("id")
	ctx := context.Background()
	if err := h.app.Restart(ctx, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Container restarted"})
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

func (h *ContainerHandler) DeleteHandler(c *gin.Context) {
	id := c.Param("id")
	ctx := context.Background()
	if err := h.app.Delete(ctx, id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "Container deleted"})
}

func (h *ContainerHandler) DetailsHandler(c *gin.Context) {
	id := c.Param("id")
	ctx := context.Background()
	details, err := h.app.GetResourceDetails(ctx, id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"resource": details})
}

func (h *ContainerHandler) LogsHandler(c *gin.Context) {
	id := c.Param("id")
	tail, err := strconv.Atoi(c.DefaultQuery("tail", "200"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "tail must be a number"})
		return
	}

	ctx := context.Background()
	logs, err := h.app.GetResourceLogs(ctx, id, tail)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"logs": logs})
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

func (h *ContainerHandler) CreateHandler(c *gin.Context) {
	var cfg domain.ContainerCfg
	if err := c.ShouldBindJSON(&cfg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	ctx := context.Background()
	created, err := h.app.StartDevconWeb(ctx, &cfg)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusAccepted, created)
}
