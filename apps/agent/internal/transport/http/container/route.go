package container

import (
	"github.com/gin-gonic/gin"
)

type ContainerRouter struct {
	handler *ContainerHandler
}

func NewContainerRouter(handler *ContainerHandler) *ContainerRouter {
	return &ContainerRouter{
		handler: handler,
	}
}

func (r *ContainerRouter) SetupContainerRouter(router *gin.RouterGroup) {
	api := router.Group("/containers")
	{
		api.GET("", r.handler.ListHandler)
		api.GET("/resources", r.handler.ResourceListHandler)
		api.GET("/:id", r.handler.DetailsHandler)
		api.GET("/:id/logs", r.handler.LogsHandler)
		api.POST("", r.handler.CreateHandler)
		api.POST("/start/:id", r.handler.StartHandler)
		api.POST("/restart/:id", r.handler.RestartHandler)
		api.POST("/stop/:id", r.handler.StopHandler)
		api.DELETE("/:id", r.handler.DeleteHandler)
		api.POST("/devcon", r.handler.StartDevconHandler)
	}
}
