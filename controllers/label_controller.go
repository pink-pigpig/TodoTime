package controllers

import (
	"TodoTime/models"
	"TodoTime/services"
)

type LabelController struct {
	svc *services.LabelService
}

func NewLabelController() *LabelController {
	return &LabelController{svc: services.NewLabelService()}
}

func (c *LabelController) GetLabels() ([]models.Label, error) {
	return c.svc.GetAll()
}

func (c *LabelController) CreateLabel(name, color string) (*models.Label, error) {
	return c.svc.Create(name, color)
}

func (c *LabelController) UpdateLabel(id uint, name, color string) (*models.Label, error) {
	return c.svc.Update(id, name, color)
}

func (c *LabelController) DeleteLabel(id uint) error {
	return c.svc.Delete(id)
}
