package models

import "gorm.io/gorm"

type Label struct {
	gorm.Model
	Name  string `gorm:"size:50;not null;unique"`
	Color string `gorm:"size:7;not null;default:'#3B82F6'"`
}
