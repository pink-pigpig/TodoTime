package services

import (
	"TodoTime/models"
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"sync"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type TimerState int

const (
	TimerIdle TimerState = iota
	TimerRunning
	TimerPaused
	TimerCompleted
)

const (
	EventTick     = "timer:tick"
	EventComplete = "timer:complete"
)

type savedState struct {
	Remaining    int64 `json:"remaining"`
	TotalSeconds int64 `json:"total_seconds"`
	Elapsed      int64 `json:"elapsed"`
	LabelID      *uint `json:"label_id"`
	StartedAt    int64 `json:"started_at"`
}

type TimerService struct {
	mu           sync.Mutex
	state        TimerState
	totalSeconds int64
	remaining    int64
	elapsed      int64
	labelID      *uint
	ticker       *time.Ticker
	done         chan struct{}
	startedAt    time.Time
	ctx          context.Context
	statePath    string
}

func NewTimerService() *TimerService {
	exe, _ := os.Executable()
	dir := filepath.Dir(exe)
	return &TimerService{
		state:     TimerIdle,
		done:      make(chan struct{}),
		statePath: filepath.Join(dir, "timer_state.json"),
	}
}

func (s *TimerService) SetContext(ctx context.Context) {
	s.ctx = ctx
}

func (s *TimerService) Start(seconds int64, labelID *uint) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.state == TimerRunning {
		return nil
	}

	s.state = TimerRunning
	s.totalSeconds = seconds
	s.remaining = seconds
	s.elapsed = 0
	s.labelID = labelID
	s.startedAt = time.Now()
	s.done = make(chan struct{})
	s.ticker = time.NewTicker(1 * time.Second)

	s.saveStateLocked()
	go s.run()
	return nil
}

func (s *TimerService) Pause() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.state != TimerRunning {
		return
	}
	s.state = TimerPaused
	s.stopTickerLocked()
	s.saveStateLocked()
}

func (s *TimerService) Resume() {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.state != TimerPaused {
		return
	}
	s.state = TimerRunning
	s.done = make(chan struct{})
	s.ticker = time.NewTicker(1 * time.Second)

	s.saveStateLocked()
	go s.run()
}

func (s *TimerService) Reset() {
	s.mu.Lock()
	defer s.mu.Unlock()

	s.state = TimerIdle
	s.stopTickerLocked()
	s.remaining = 0
	s.totalSeconds = 0
	s.elapsed = 0
	s.labelID = nil
	s.clearStateFile()
}

func (s *TimerService) Stop() (int64, *models.TimerRecord, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.state == TimerIdle || s.state == TimerCompleted {
		return 0, nil, nil
	}

	s.stopTickerLocked()
	record := s.saveRecordLocked(false)
	elapsed := s.elapsed
	s.state = TimerIdle
	s.remaining = 0
	s.totalSeconds = 0
	s.elapsed = 0
	s.clearStateFile()

	return elapsed, record, nil
}

func (s *TimerService) GetState() (TimerState, int64, int64, *uint) {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.state, s.remaining, s.totalSeconds, s.labelID
}

func (s *TimerService) GetSavedStateInfo() (int64, int64, *uint) {
	data, err := os.ReadFile(s.statePath)
	if err != nil {
		return 0, 0, nil
	}
	var ss savedState
	if err := json.Unmarshal(data, &ss); err != nil {
		return 0, 0, nil
	}
	return ss.Remaining, ss.TotalSeconds, ss.LabelID
}

func (s *TimerService) RestoreFromSaved() error {
	data, err := os.ReadFile(s.statePath)
	if err != nil {
		return err
	}
	var ss savedState
	if err := json.Unmarshal(data, &ss); err != nil {
		return err
	}
	if ss.TotalSeconds <= 0 || ss.Remaining <= 0 {
		return nil
	}

	s.mu.Lock()
	defer s.mu.Unlock()

	s.state = TimerPaused
	s.totalSeconds = ss.TotalSeconds
	s.remaining = ss.Remaining
	s.elapsed = ss.Elapsed
	s.labelID = ss.LabelID
	s.startedAt = time.Unix(ss.StartedAt, 0)
	return nil
}

func (s *TimerService) stopTickerLocked() {
	if s.ticker != nil {
		s.ticker.Stop()
		s.ticker = nil
	}
	select {
	case s.done <- struct{}{}:
	default:
	}
}

func (s *TimerService) saveStateLocked() {
	ss := savedState{
		Remaining:    s.remaining,
		TotalSeconds: s.totalSeconds,
		Elapsed:      s.elapsed,
		LabelID:      s.labelID,
		StartedAt:    s.startedAt.Unix(),
	}
	data, _ := json.Marshal(ss)
	os.WriteFile(s.statePath, data, 0644)
}

func (s *TimerService) clearStateFile() {
	os.Remove(s.statePath)
}

func (s *TimerService) run() {
	for {
		select {
		case <-s.ticker.C:
			s.mu.Lock()
			if s.state != TimerRunning {
				s.mu.Unlock()
				return
			}
			s.remaining--
			s.elapsed++
			remaining := s.remaining
			total := s.totalSeconds
			state := int(s.state)

			if s.remaining <= 0 {
				s.state = TimerCompleted
				s.stopTickerLocked()
				s.clearStateFile()
				record := s.saveRecordLocked(true)
				s.mu.Unlock()
				s.emitComplete(record)
				return
			}
			s.mu.Unlock()

			s.emitTick(state, total, remaining)
		case <-s.done:
			return
		}
	}
}

func (s *TimerService) saveRecordLocked(completed bool) *models.TimerRecord {
	now := time.Now()
	record := &models.TimerRecord{
		Duration:    s.elapsed,
		LabelID:     s.labelID,
		StartedAt:   s.startedAt,
		EndedAt:     now,
		IsCompleted: completed,
	}
	DB.Create(record)
	return record
}

func (s *TimerService) emitTick(state int, total, remaining int64) {
	if s.ctx != nil {
		runtime.EventsEmit(s.ctx, EventTick, map[string]interface{}{
			"state":     state,
			"total":     total,
			"remaining": remaining,
		})
	}
}

func (s *TimerService) emitComplete(record *models.TimerRecord) {
	if s.ctx != nil {
		runtime.EventsEmit(s.ctx, EventComplete, map[string]interface{}{
			"recordId":  record.ID,
			"duration":  record.Duration,
			"completed": record.IsCompleted,
		})
	}
}
