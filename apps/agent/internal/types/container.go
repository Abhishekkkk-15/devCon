package types

type ContainerCfg struct {
	Image         string
	Name          string
	ContainerPort string // "3000"
	HostPort      string // "3000"
}
