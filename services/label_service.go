package services

import (
	"TodoTime/models"
	"errors"

	"gorm.io/gorm"
)

type LabelService struct{}

func NewLabelService() *LabelService {
	return &LabelService{}
}

func (s *LabelService) GetAll() ([]models.Label, error) {
	var labels []models.Label
	result := DB.Order("id asc").Find(&labels)
	return labels, result.Error
}

func (s *LabelService) Create(name, color string) (*models.Label, error) {
	label := &models.Label{Name: name, Color: color}
	result := DB.Create(label)
	if result.Error != nil {
		return nil, result.Error
	}
	return label, nil
}

func (s *LabelService) Update(id uint, name, color string) (*models.Label, error) {
	label := &models.Label{}
	if err := DB.First(label, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("标签不存在")
		}
		return nil, err
	}
	label.Name = name
	label.Color = color
	DB.Save(label)
	return label, nil
}

func (s *LabelService) Delete(id uint) error {
	return DB.Delete(&models.Label{}, id).Error
}
