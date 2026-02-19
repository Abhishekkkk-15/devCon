package http

import (
	"context"

	"github.com/abhishekkkk-15/devcon/agent/internal/domain"
	"github.com/abhishekkkk-15/devcon/agent/internal/system"
)

type SystemService interface {
	GetHostStats() (*domain.SystemStats, error)
}

type SystemController struct {
	repo *system.LocalSystemRepository
}

func (r SystemController) GetHostStats(ctx context.Context) (*domain.SystemStats, error) {
	return r.repo.GetSystemStats(ctx)
}
