package cli

import (
	"github.com/spf13/cobra"
)

func NewRootCmd() *cobra.Command {
	cmd := &cobra.Command{
		Use:     "devcon",
		Short:   "Local/cloud dev control panel for docker",
		Version: "0.1.0",
	}

	return cmd
}
