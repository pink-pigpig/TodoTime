package controllers

import (
	"TodoTime/services"
	"errors"
)

type TimerController struct {
	svc *services.TimerService
}

func NewTimerController(svc *services.TimerService) *TimerController {
	return &TimerController{svc: svc}
}

func (c *TimerController) StartTimer(seconds int64, labelID *uint) error {
	if seconds <= 0 {
		return errors.New("时长必须大于0")
	}
	return c.svc.Start(seconds, labelID)
}

func (c *TimerController) PauseTimer() {
	c.svc.Pause()
}

func (c *TimerController) ResumeTimer() {
	c.svc.Resume()
}

func (c *TimerController) ResetTimer() {
	c.svc.Reset()
}

func (c *TimerController) StopTimer() (int64, interface{}, error) {
	elapsed, record, err := c.svc.Stop()
	if err != nil {
		return 0, nil, err
	}
	if record == nil {
		return 0, nil, nil
	}
	return elapsed, map[string]interface{}{
		"id":        record.ID,
		"duration":  record.Duration,
		"label_id":  record.LabelID,
		"started_at": record.StartedAt.Format("2006-01-02 15:04:05"),
		"ended_at":  record.EndedAt.Format("2006-01-02 15:04:05"),
		"completed": record.IsCompleted,
	}, nil
}

func (c *TimerController) GetTimerState() (int, int64, int64) {
	state, remaining, total, _ := c.svc.GetState()
	return int(state), remaining, total
}

func (c *TimerController) GetSavedTimer() (int64, int64, *uint) {
	return c.svc.GetSavedStateInfo()
}

func (c *TimerController) RestoreTimer() error {
	return c.svc.RestoreFromSaved()
}
