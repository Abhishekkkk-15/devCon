package domain

import "context"

type SystemRepository interface {
	GetSystemStats(ctx context.Context) (*SystemStats, error)
}

type CPUInfo struct {
	Model string  `json:"model"`
	Cores int32   `json:"cores"`
	Mhz   float64 `json:"mhz"`
	Usage float64 `json:"usage_percent"`
}

type MemoryInfo struct {
	TotalGB     float64 `json:"total_gb"`
	UsedGB      float64 `json:"used_gb"`
	UsedPercent float64 `json:"used_percent"`
}

type DiskInfo struct {
	TotalGB     float64 `json:"total_gb"`
	UsedGB      float64 `json:"used_gb"`
	FreeGB      float64 `json:"free_gb"`
	UsedPercent float64 `json:"used_percent"`
}

type HostInfo struct {
	Hostname string `json:"hostname"`
	OS       string `json:"os"`
	Platform string `json:"platform"`
	Version  string `json:"version"`
}

type SystemStats struct {
	CPU    CPUInfo    `json:"cpu"`
	Memory MemoryInfo `json:"memory"`
	Disk   DiskInfo   `json:"disk"`
	Host   HostInfo   `json:"host"`
}
