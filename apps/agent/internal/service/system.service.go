package service

import (
	"context"

	"github.com/abhishekkkk-15/devcon/agent/internal/domain"
	"github.com/abhishekkkk-15/devcon/agent/internal/system"
)

type SystemService struct {
	repo *system.SystemRepository
}

func NewSystemService(repo *system.SystemRepository) *SystemService {
	return &SystemService{
		repo: repo,
	}
}

func (r *SystemService) GetSystemStats(ctx context.Context) (*domain.SystemStats, error) {
	stats, err := r.repo.GetSystemStats(ctx)
	if err != nil {
		return nil, err
	}
	return stats, nil
}
