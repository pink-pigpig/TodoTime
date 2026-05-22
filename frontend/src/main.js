import './app.css'

async function getLabels() {
    return window['go']['controllers']['LabelController']['GetLabels']()
}
async function createLabel(name, color) {
    return window['go']['controllers']['LabelController']['CreateLabel'](name, color)
}
async function updateLabel(id, name, color) {
    return window['go']['controllers']['LabelController']['UpdateLabel'](id, name, color)
}
async function deleteLabel(id) {
    return window['go']['controllers']['LabelController']['DeleteLabel'](id)
}
async function startTimer(seconds, labelId) {
    return window['go']['controllers']['TimerController']['StartTimer'](seconds, labelId)
}
async function pauseTimer() {
    return window['go']['controllers']['TimerController']['PauseTimer']()
}
async function resumeTimer() {
    return window['go']['controllers']['TimerController']['ResumeTimer']()
}
async function resetTimer() {
    return window['go']['controllers']['TimerController']['ResetTimer']()
}
async function stopTimer() {
    return window['go']['controllers']['TimerController']['StopTimer']()
}
async function getTimerState() {
    return window['go']['controllers']['TimerController']['GetTimerState']()
}
async function getSavedTimer() {
    return window['go']['controllers']['TimerController']['GetSavedTimer']()
}
async function restoreTimer() {
    return window['go']['controllers']['TimerController']['RestoreTimer']()
}

const TIMER_STATE = { IDLE: 0, RUNNING: 1, PAUSED: 2, COMPLETED: 3 }

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

const app = {
    currentPage: 'timer',
    selectedLabelId: null,
    labels: [],
    timerState: TIMER_STATE.IDLE,
    timerRemaining: 0,
    timerTotal: 0,

    async init() {
        this.setupNavigation()
        this.setupTimerEvents()
        await this.loadLabels()
        await this.checkSavedTimer()
        this.navigate('timer')
    },

    setupTimerEvents() {
        window.runtime.EventsOn('timer:tick', (data) => {
            this.timerState = data.state
            this.timerRemaining = data.remaining
            this.timerTotal = data.total
            this.updateTimerDisplay()
        })
        window.runtime.EventsOn('timer:complete', (data) => {
            this.timerState = TIMER_STATE.COMPLETED
            this.selectedLabelId = null
            this.updateTimerDisplay()
            this.showCompletionNotification(data)
        })
    },

    async checkSavedTimer() {
        try {
            const [remaining, total, labelId] = await getSavedTimer()
            if (total > 0 && remaining > 0) {
                await restoreTimer()
                this.timerState = TIMER_STATE.PAUSED
                this.timerRemaining = remaining
                this.timerTotal = total
                this.selectedLabelId = labelId
            }
        } catch (e) {
            console.error('检查恢复状态失败:', e)
        }
    },

    showCompletionNotification(data) {
        const label = this.labels.find(l => l.ID === this.selectedLabelId)
        const labelName = label ? label.Name : '未分类'
        const display = document.getElementById('timer-display')
        if (display) {
            display.textContent = '✅ 完成!'
            display.classList.add('text-green-500')
        }

        const minutes = Math.floor(data.duration / 60)
        const msg = `专注 ${labelName} ${minutes} 分钟！`

        if (Notification.permission === 'granted') {
            new Notification('TodoTime - 倒计时结束', { body: msg })
        }

        const notification = document.getElementById('completion-notification')
        if (notification) {
            notification.classList.remove('hidden')
            notification.querySelector('.notif-msg').textContent = msg
            setTimeout(() => notification.classList.add('hidden'), 5000)
        }
    },

    async loadLabels() {
        try {
            this.labels = await getLabels()
        } catch (e) {
            console.error('加载标签失败:', e)
            this.labels = []
        }
    },

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault()
                this.navigate(item.dataset.page)
            })
        })
    },

    async navigate(page) {
        this.currentPage = page
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page)
        })
        const content = document.getElementById('page-content')
        const pages = {
            timer: () => this.renderTimer(),
            pomodoro: () => this.renderPomodoro(),
            stats: () => this.renderStats(),
            todos: () => this.renderTodos(),
            backlog: () => this.renderBacklog(),
            labels: () => this.renderLabels(),
            settings: () => this.renderSettings(),
        }
        content.innerHTML = (pages[page] || (() => '<p>开发中...</p>'))()
        if (page === 'labels') {
            await this.loadLabels()
            this.renderLabelList()
            this.setupLabelDialogEvents()
        } else if (page === 'timer') {
            this.renderLabelSelector()
            this.setupTimerButtons()
        }
    },

    setupTimerButtons() {
        const startBtn = document.getElementById('btn-start')
        const pauseBtn = document.getElementById('btn-pause')
        const resetBtn = document.getElementById('btn-reset')

        if (startBtn) startBtn.onclick = () => this.handleStart()
        if (pauseBtn) pauseBtn.onclick = () => this.handlePause()
        if (resetBtn) resetBtn.onclick = () => this.handleReset()

        this.updateTimerDisplay()
    },

    async handleStart() {
        if (this.timerState === TIMER_STATE.PAUSED) {
            await resumeTimer()
            return
        }
        if (this.timerState === TIMER_STATE.RUNNING) return

        const input = document.getElementById('timer-input')
        if (!input) return
        const minutes = parseInt(input.value) || 25
        const seconds = minutes * 60

        if (seconds <= 0) return
        if (Notification.permission === 'default') {
            Notification.requestPermission()
        }

        try {
            const labelId = this.selectedLabelId || null
            await startTimer(seconds, labelId)
        } catch (e) {
            console.error('启动倒计时失败:', e)
        }
    },

    async handlePause() {
        if (this.timerState === TIMER_STATE.RUNNING) {
            await pauseTimer()
        } else if (this.timerState === TIMER_STATE.PAUSED) {
            await resumeTimer()
        }
    },

    async handleReset() {
        await resetTimer()
        this.timerState = TIMER_STATE.IDLE
        this.timerRemaining = 0
        this.timerTotal = 0

        const display = document.getElementById('timer-display')
        if (display) {
            display.textContent = '00:00:00'
            display.classList.remove('text-green-500')
        }

        const labelEl = document.getElementById('timer-label')
        if (labelEl) labelEl.textContent = '未开始'

        const startBtn = document.getElementById('btn-start')
        const pauseBtn = document.getElementById('btn-pause')
        const resetBtn = document.getElementById('btn-reset')
        const timePicker = document.getElementById('timer-time-picker')

        if (startBtn) { startBtn.classList.remove('hidden'); startBtn.textContent = '开始' }
        if (pauseBtn) pauseBtn.classList.add('hidden')
        if (resetBtn) resetBtn.classList.add('hidden')
        if (timePicker) timePicker.classList.remove('hidden')
    },

    updateTimerDisplay() {
        const display = document.getElementById('timer-display')
        const labelEl = document.getElementById('timer-label')
        const startBtn = document.getElementById('btn-start')
        const pauseBtn = document.getElementById('btn-pause')
        const resetBtn = document.getElementById('btn-reset')
        const timePicker = document.getElementById('timer-time-picker')

        if (!display) return

        if (this.timerState === TIMER_STATE.COMPLETED) {
            if (startBtn) startBtn.classList.add('hidden')
            if (pauseBtn) pauseBtn.classList.add('hidden')
            if (resetBtn) resetBtn.classList.remove('hidden')
            if (timePicker) timePicker.classList.add('hidden')
            return
        }

        if (this.timerState === TIMER_STATE.IDLE) {
            display.textContent = '00:00:00'
            if (labelEl) labelEl.textContent = '未开始'
            if (startBtn) { startBtn.classList.remove('hidden'); startBtn.textContent = '开始' }
            if (pauseBtn) pauseBtn.classList.add('hidden')
            if (resetBtn) resetBtn.classList.add('hidden')
            if (timePicker) timePicker.classList.remove('hidden')
            return
        }

        display.textContent = formatTime(this.timerRemaining)
        display.classList.remove('text-green-500')
        if (labelEl) {
            const label = this.labels.find(l => l.ID === this.selectedLabelId)
            labelEl.textContent = label ? `当前标签: ${label.Name}` : '未分类'
        }
        if (startBtn) startBtn.classList.add('hidden')
        if (pauseBtn) {
            pauseBtn.classList.remove('hidden')
            pauseBtn.textContent = this.timerState === TIMER_STATE.PAUSED ? '继续' : '暂停'
        }
        if (resetBtn) resetBtn.classList.remove('hidden')
        if (timePicker) timePicker.classList.add('hidden')
    },

    showTimePicker() {
        const overlay = document.getElementById('time-picker-overlay')
        if (overlay) overlay.classList.remove('hidden')
    },

    hideTimePicker() {
        const overlay = document.getElementById('time-picker-overlay')
        if (overlay) overlay.classList.add('hidden')
    },

    setTimerPreset(minutes) {
        const input = document.getElementById('timer-input')
        if (input) input.value = minutes
        this.hideTimePicker()
    },

    setupLabelDialogEvents() {
        const addBtn = document.getElementById('add-label-btn')
        if (addBtn) addBtn.onclick = () => this.showLabelEditDialog(null)

        const cancelBtn = document.getElementById('cancel-label')
        if (cancelBtn) cancelBtn.onclick = () => this.closeLabelDialog()

        const saveBtn = document.getElementById('save-label')
        if (saveBtn) saveBtn.onclick = () => this.saveLabel()

        const colorInput = document.getElementById('label-color')
        if (colorInput) {
            colorInput.oninput = (e) => {
                const preview = document.getElementById('label-color-preview')
                if (preview) preview.style.background = e.target.value
            }
        }

        document.querySelectorAll('.preset-colors button').forEach(btn => {
            btn.onclick = () => {
                const color = btn.dataset.color
                const input = document.getElementById('label-color')
                const preview = document.getElementById('label-color-preview')
                if (input) input.value = color
                if (preview) preview.style.background = color
            }
        })
    },

    renderLabelSelector() {
        const container = document.getElementById('label-selector')
        if (!container) return
        if (this.labels.length === 0) {
            container.innerHTML = '<span class="text-xs text-gray-400">暂无标签</span>'
            return
        }
        container.innerHTML = this.labels.map(l =>
            `<button class="label-btn px-3 py-1 rounded-full text-sm text-white transition" style="background:${l.Color}" data-id="${l.ID}">${l.Name}</button>`
        ).join('')
        container.querySelectorAll('.label-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.label-btn').forEach(b => {
                    b.style.opacity = '0.5'
                    b.style.boxShadow = 'none'
                })
                this.selectedLabelId = parseInt(btn.dataset.id)
                btn.style.opacity = '1'
                btn.style.boxShadow = '0 0 0 3px rgba(0,0,0,0.2)'
            })
        })
    },

    renderLabelList() {
        const list = document.getElementById('label-list')
        if (!list) return
        if (this.labels.length === 0) {
            list.innerHTML = '<p class="text-gray-400 text-center py-8">暂无标签，请添加</p>'
            return
        }
        list.innerHTML = this.labels.map(l => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                <div class="flex items-center gap-3">
                    <span class="w-4 h-4 rounded-full" style="background:${l.Color}"></span>
                    <span class="text-gray-700 font-medium">${l.Name}</span>
                    <span class="text-xs text-gray-400 font-mono">${l.Color}</span>
                </div>
                <div class="flex gap-2">
                    <button class="edit-label text-blue-500 hover:text-blue-700 text-sm font-medium">编辑</button>
                    <button class="delete-label text-red-500 hover:text-red-700 text-sm font-medium">删除</button>
                </div>
            </div>
        `).join('')
        list.querySelectorAll('.edit-label').forEach((btn, i) => {
            btn.onclick = () => this.showLabelEditDialog(this.labels[i])
        })
        list.querySelectorAll('.delete-label').forEach((btn, i) => {
            btn.onclick = () => this.deleteLabelHandler(this.labels[i].ID)
        })
    },

    showLabelEditDialog(label) {
        document.getElementById('label-form-title').textContent = label ? '编辑标签' : '新建标签'
        document.getElementById('label-name').value = label ? label.Name : ''
        document.getElementById('label-color').value = label ? label.Color : '#3B82F6'
        document.getElementById('label-color-preview').style.background = label ? label.Color : '#3B82F6'
        document.getElementById('label-dialog').classList.remove('hidden')
        document.getElementById('label-dialog').dataset.editId = label ? label.ID : ''
    },

    closeLabelDialog() {
        document.getElementById('label-dialog').classList.add('hidden')
    },

    async saveLabel() {
        const name = document.getElementById('label-name').value.trim()
        const color = document.getElementById('label-color').value
        if (!name) { alert('请输入标签名称'); return }
        const editId = document.getElementById('label-dialog').dataset.editId
        try {
            if (editId) {
                await updateLabel(parseInt(editId), name, color)
            } else {
                await createLabel(name, color)
            }
            this.closeLabelDialog()
            await this.loadLabels()
            this.renderLabelList()
        } catch (e) {
            alert('保存失败: ' + e)
        }
    },

    async deleteLabelHandler(id) {
        if (!confirm('确定删除此标签？')) return
        try {
            await deleteLabel(id)
            await this.loadLabels()
            this.renderLabelList()
        } catch (e) {
            alert('删除失败: ' + e)
        }
    },

    renderTimer() {
        return `
            <div class="max-w-2xl mx-auto text-center">
                <h2 class="text-2xl font-bold text-gray-800 mb-8">倒计时</h2>
                <div id="timer-display" class="text-8xl font-mono font-bold text-primary-600 mb-6 tabular-nums leading-none">${this.timerState === TIMER_STATE.PAUSED ? formatTime(this.timerRemaining) : '00:00:00'}</div>
                <div id="timer-label" class="text-sm text-gray-500 mb-6">${this.timerState === TIMER_STATE.PAUSED ? '已从上次状态恢复' : '未开始'}</div>
                <div id="timer-time-picker" class="${this.timerState !== TIMER_STATE.IDLE ? 'hidden' : ''}">
                    <div class="flex justify-center items-center gap-3 mb-6">
                        <input id="timer-input" type="number" min="1" max="999" value="25" class="w-20 px-3 py-2 text-center text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none">
                        <span class="text-gray-500">分钟</span>
                        <button id="btn-set-time" class="px-4 py-2 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">预设</button>
                    </div>
                </div>
                <div class="flex justify-center gap-4 mb-8">
                    <button id="btn-start" class="px-8 py-3 ${this.timerState === TIMER_STATE.PAUSED ? 'hidden' : ''} bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 transition shadow-lg">${this.timerState === TIMER_STATE.PAUSED ? '继续' : '开始'}</button>
                    <button id="btn-pause" class="px-8 py-3 bg-yellow-500 text-white rounded-full font-semibold hover:bg-yellow-600 transition shadow-lg ${this.timerState === TIMER_STATE.PAUSED ? '' : 'hidden'}">继续</button>
                    <button id="btn-reset" class="px-8 py-3 bg-gray-500 text-white rounded-full font-semibold hover:bg-gray-600 transition shadow-lg ${this.timerState === TIMER_STATE.IDLE ? 'hidden' : ''}">重置</button>
                </div>
                <div class="flex justify-center gap-2 flex-wrap" id="label-selector"></div>

                <div id="completion-notification" class="hidden fixed top-6 right-6 bg-green-50 border border-green-200 rounded-xl p-5 shadow-lg z-50 max-w-sm">
                    <div class="flex items-start gap-3">
                        <span class="text-2xl">🎉</span>
                        <div>
                            <p class="font-semibold text-green-800">倒计时完成!</p>
                            <p class="notif-msg text-sm text-green-600 mt-1"></p>
                        </div>
                    </div>
                </div>

                <div id="time-picker-overlay" class="hidden fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div class="bg-white rounded-xl p-6 w-80 shadow-2xl">
                        <h3 class="text-lg font-bold mb-4">选择时长</h3>
                        <div class="grid grid-cols-3 gap-3">
                            ${[5,10,15,25,30,45,60,90,120].map(m =>
                                `<button class="preset-time px-4 py-3 bg-gray-100 rounded-lg hover:bg-primary-100 hover:text-primary-600 transition font-medium text-sm" data-minutes="${m}">${m < 60 ? m + ' 分钟' : (m/60) + ' 小时'}</button>`
                            ).join('')}
                        </div>
                        <button id="close-time-picker" class="mt-4 w-full px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg transition text-sm">取消</button>
                    </div>
                </div>
            </div>
        `
    },

    renderPomodoro() {
        return `<div class="max-w-2xl mx-auto text-center"><h2 class="text-2xl font-bold text-gray-800 mb-4">番茄钟</h2><p class="text-gray-500">开发中...</p></div>`
    },

    renderStats() {
        return `<div class="max-w-4xl mx-auto"><h2 class="text-2xl font-bold text-gray-800 mb-4">统计</h2><p class="text-gray-500">开发中...</p></div>`
    },

    renderTodos() {
        return `<div class="max-w-3xl mx-auto"><h2 class="text-2xl font-bold text-gray-800 mb-4">待办事项</h2><p class="text-gray-500">开发中...</p></div>`
    },

    renderBacklog() {
        return `<div class="max-w-3xl mx-auto"><h2 class="text-2xl font-bold text-gray-800 mb-4">堆积代办</h2><p class="text-gray-500">开发中...</p></div>`
    },

    renderLabels() {
        return `
            <div class="max-w-2xl mx-auto">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-gray-800">标签管理</h2>
                    <button id="add-label-btn" class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition text-sm">+ 新建标签</button>
                </div>
                <div id="label-list"></div>
                <div id="label-dialog" class="hidden fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div class="bg-white rounded-xl p-6 w-96 shadow-2xl">
                        <h3 id="label-form-title" class="text-lg font-bold mb-4">新建标签</h3>
                        <div class="mb-4">
                            <label class="block text-sm text-gray-600 mb-1">名称</label>
                            <input id="label-name" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none" placeholder="输入标签名称" maxlength="20">
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm text-gray-600 mb-1">颜色</label>
                            <div class="flex gap-3 items-center">
                                <input id="label-color" type="color" class="w-10 h-10 rounded cursor-pointer border border-gray-300" value="#3B82F6">
                                <span id="label-color-preview" class="w-8 h-8 rounded-full border-2 border-gray-300" style="background:#3B82F6"></span>
                            </div>
                        </div>
                        <div class="preset-colors flex gap-2 flex-wrap mb-4">
                            ${['#3B82F6','#EF4444','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4','#6B7280'].map(c =>
                                `<button class="w-7 h-7 rounded-full border-2 border-transparent hover:border-gray-400 transition" style="background:${c}" data-color="${c}"></button>`
                            ).join('')}
                        </div>
                        <div class="flex justify-end gap-3">
                            <button id="cancel-label" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition text-sm">取消</button>
                            <button id="save-label" class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition text-sm">保存</button>
                        </div>
                    </div>
                </div>
            </div>
        `
    },

    renderSettings() {
        return `<div class="max-w-2xl mx-auto"><h2 class="text-2xl font-bold text-gray-800 mb-4">设置</h2><p class="text-gray-500">开发中...</p></div>`
    }
}

document.addEventListener('DOMContentLoaded', () => {
    app.init()
    setTimeout(() => {
        const pickerOverlay = document.getElementById('time-picker-overlay')
        if (pickerOverlay) {
            document.querySelectorAll('.preset-time').forEach(btn => {
                btn.onclick = () => app.setTimerPreset(parseInt(btn.dataset.minutes))
            })
            document.getElementById('close-time-picker').onclick = () => app.hideTimePicker()
            pickerOverlay.onclick = (e) => {
                if (e.target === pickerOverlay) app.hideTimePicker()
            }
        }
    }, 100)
})
