package util

import (
	"os"

	"github.com/joho/godotenv"
)

func GodotEnv(key string) string {

	if os.Getenv("GO_ENV") != "production" {
		return os.Getenv(key)
	} else {
		return os.Getenv(key)
	}

}

func InitializeEnv() {
	godotenv.Load(".env")
}
