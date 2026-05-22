package services

import (
	"TodoTime/models"
	"database/sql"
	"os"
	"path/filepath"

	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	_ "modernc.org/sqlite"
)

var DB *gorm.DB

func InitDatabase() error {
	exe, err := os.Executable()
	if err != nil {
		exe, _ = os.Getwd()
	}
	dir := filepath.Dir(exe)
	dbPath := filepath.Join(dir, "todotime.db")

	sqlDB, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return err
	}

	db, err := gorm.Open(sqlite.New(sqlite.Config{
		Conn: sqlDB,
	}), &gorm.Config{
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
