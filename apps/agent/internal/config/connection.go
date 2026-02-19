package config

import (
	"fmt"
	"os"

	"github.com/abhishekkkk-15/devcon/agent/internal/util"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func Connection() *gorm.DB {
	databaseURI := make(chan string, 1)

	if os.Getenv("GO_ENV") != "production" {
		databaseURI <- util.GodotEnv("DATABASE_URI_DEV")
	} else {
		databaseURI <- os.Getenv("DATABASE_URI_PROD")
	}

	db, err := gorm.Open(postgres.Open(<-databaseURI), &gorm.Config{})

	if err != nil {
		fmt.Println("Connection to Databse Failed")
		return nil
	}

	if os.Getenv("GO_ENV") != "production" {
		fmt.Println("Connection to Database Successfully")
		return nil
	}

	return db
}
