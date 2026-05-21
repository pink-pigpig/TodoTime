import './app.css'

const app = {
    currentPage: 'timer',

    init() {
        this.setupNavigation()
        this.navigate('timer')
    },

    setupNavigation() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault()
                const page = item.dataset.page
                this.navigate(page)
            })
        })
    },

    navigate(page) {
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
        const render = pages[page] || (() => '<p>开发中...</p>')
        content.innerHTML = render()
    },

    renderTimer() {
        return `
            <div class="max-w-2xl mx-auto text-center">
                <h2 class="text-2xl font-bold text-gray-800 mb-8">倒计时</h2>
                <div id="timer-display" class="text-8xl font-mono font-bold text-primary-600 mb-10 tabular-nums">00:00:00</div>
                <div id="timer-label" class="text-sm text-gray-500 mb-6">未开始</div>
                <div class="flex justify-center gap-4 mb-8">
                    <button id="btn-start" class="px-8 py-3 bg-primary-500 text-white rounded-full font-semibold hover:bg-primary-600 transition shadow-lg">开始</button>
                    <button id="btn-pause" class="px-8 py-3 bg-yellow-500 text-white rounded-full font-semibold hover:bg-yellow-600 transition shadow-lg hidden">暂停</button>
                    <button id="btn-reset" class="px-8 py-3 bg-gray-500 text-white rounded-full font-semibold hover:bg-gray-600 transition shadow-lg">重置</button>
                </div>
                <div class="flex justify-center gap-2 flex-wrap" id="label-selector"></div>
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
        return `<div class="max-w-2xl mx-auto"><h2 class="text-2xl font-bold text-gray-800 mb-4">标签管理</h2><p class="text-gray-500">开发中...</p></div>`
    },

    renderSettings() {
        return `<div class="max-w-2xl mx-auto"><h2 class="text-2xl font-bold text-gray-800 mb-4">设置</h2><p class="text-gray-500">开发中...</p></div>`
    }
}

document.addEventListener('DOMContentLoaded', () => app.init())
