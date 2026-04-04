package app

import (
	"context"

	"github.com/abhishekkkk-15/devcon/agent/internal/core/domain"
	"github.com/abhishekkkk-15/devcon/agent/internal/core/service"
)

type SystemApp struct {
	service *service.SystemService
}

func NewSystemApp(service *service.SystemService) *SystemApp {
	return &SystemApp{
		service: service,
	}
}

func (s *SystemApp) GetSystemStats(ctx *context.Context) (*domain.SystemStats, error) {
	stats, err := s.service.GetSystemStats(*ctx)
	if err != nil {
		return nil, err
	}
	return stats, nil
}
