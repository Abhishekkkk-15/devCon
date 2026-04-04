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
		api.POST("/start/:id", r.handler.StartHandler)
		api.POST("/stop/:id", r.handler.StopHandler)
		api.POST("/devcon", r.handler.StartDevconHandler)
	}
}
