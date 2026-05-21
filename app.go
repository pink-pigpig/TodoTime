package main

import (
	"TodoTime/controllers"
	"TodoTime/services"
	"context"
)

type App struct {
	ctx             context.Context
	LabelController *controllers.LabelController
}

func NewApp() *App {
	return &App{
		LabelController: controllers.NewLabelController(),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	if err := services.InitDatabase(); err != nil {
		panic("数据库初始化失败: " + err.Error())
	}
	initDefaultLabels()
}

func initDefaultLabels() {
	defaults := []struct {
		name  string
		color string
	}{
		{"学习", "#3B82F6"},
		{"工作", "#EF4444"},
		{"运动", "#10B981"},
		{"阅读", "#8B5CF6"},
		{"娱乐", "#F59E0B"},
		{"其他", "#6B7280"},
	}
	svc := services.NewLabelService()
	existing, _ := svc.GetAll()
	if len(existing) > 0 {
		return
	}
	for _, d := range defaults {
		svc.Create(d.name, d.color)
	}
}
