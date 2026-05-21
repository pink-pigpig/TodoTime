package models

import "time"

type TimerRecord struct {
	ID          uint      `gorm:"primarykey"`
	Duration    int64     `gorm:"not null"`
	LabelID     *uint     `gorm:"index"`
	Label       *Label    `gorm:"foreignKey:LabelID"`
	StartedAt   time.Time `gorm:"not null"`
	EndedAt     time.Time `gorm:"not null"`
	IsCompleted bool      `gorm:"default:true"`
}
