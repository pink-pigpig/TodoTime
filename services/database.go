package services

import (
	"TodoTime/models"
	"os"
	"path/filepath"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var DB *gorm.DB

func InitDatabase() error {
	exe, err := os.Executable()
	if err != nil {
		exe, _ = os.Getwd()
	}
	dir := filepath.Dir(exe)
	dbPath := filepath.Join(dir, "todotime.db")

	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Warn),
	})
	if err != nil {
		return err
	}

	DB = db
	return db.AutoMigrate(&models.Label{}, &models.TimerRecord{}, &models.Todo{})
}

func GetDB() *gorm.DB {
	return DB
}
