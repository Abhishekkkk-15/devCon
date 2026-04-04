package system

import (
	"github.com/gin-gonic/gin"
)

type SystemRouter struct {
	handler *SystemHandler
}

func NewSystemRouter(handler *SystemHandler) *SystemRouter {
	return &SystemRouter{handler: handler}

}

func (h *SystemRouter) SetupSystemRouter(router *gin.RouterGroup) {
	router.GET("/system/stats", h.handler.SystemStatsHandler)
}
