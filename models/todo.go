package models

import (
	"gorm.io/gorm"
)

type Todo struct {
	gorm.Model
	Title       string `gorm:"size:200;not null"`
	Description string `gorm:"size:500"`
	Status      string `gorm:"size:20;not null;default:'todo'"`
	Priority    string `gorm:"size:10;not null;default:'medium'"`
	GoalType    string `gorm:"size:10;not null;default:'today'"`
	SortOrder   int    `gorm:"default:0"`
	CompletedAt *int64
}

const (
	StatusTodo       = "todo"
	StatusInProgress = "in_progress"
	StatusDone       = "done"

	PriorityHigh   = "high"
	PriorityMedium = "medium"
	PriorityLow    = "low"

	GoalTypeToday  = "today"
	GoalTypeWeek   = "week"
	GoalTypeMonth  = "month"
	GoalTypeYear   = "year"
)
