package services

import (
	"TodoTime/models"
	"time"

	"gorm.io/gorm"
)

type TimerRecordService struct{}

func NewTimerRecordService() *TimerRecordService {
	return &TimerRecordService{}
}

func (s *TimerRecordService) GetRecords(start, end time.Time) ([]models.TimerRecord, error) {
	var records []models.TimerRecord
	result := DB.Where("started_at >= ? AND ended_at <= ?", start, end).
		Preload("Label").Order("started_at desc").Find(&records)
	return records, result.Error
}

func (s *TimerRecordService) GetTodayRecords() ([]models.TimerRecord, error) {
	now := time.Now()
	start := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	return s.GetRecords(start, now)
}

func (s *TimerRecordService) GetWeekRecords() ([]models.TimerRecord, error) {
	now := time.Now()
	weekday := int(now.Weekday())
	if weekday == 0 {
		weekday = 7
	}
	start := time.Date(now.Year(), now.Month(), now.Day()-weekday+1, 0, 0, 0, 0, now.Location())
	return s.GetRecords(start, now)
}

func (s *TimerRecordService) DeleteAll() error {
	return DB.Session(&gorm.Session{AllowGlobalUpdate: true}).Delete(&models.TimerRecord{}).Error
}
