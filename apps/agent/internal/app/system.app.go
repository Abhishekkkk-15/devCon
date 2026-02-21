package app

import (
	"context"

	"github.com/abhishekkkk-15/devcon/agent/internal/domain"
	"github.com/abhishekkkk-15/devcon/agent/internal/service"
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
