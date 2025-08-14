class Task {
    constructor(id, text, deadline = null) {
        this.id = id;
        this.text = text;
        this.completed = false;
        this.createdAt = new Date();
        this.deadline = deadline ? new Date(deadline) : null;
    }

    toggle() {
        this.completed = !this.completed;
    }

    isOverdue() {
        if (!this.deadline || this.completed) return false;
        return new Date() > this.deadline;
    }

    isDueSoon() {
        if (!this.deadline || this.completed) return false;
        const now = new Date();
        const timeDiff = this.deadline - now;
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        return hoursDiff > 0 && hoursDiff <= 24; 
    }

    getFormattedCreatedDate() {
        return this.createdAt.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    getFormattedDeadline() {
        if (!this.deadline) return null;
        return this.deadline.toLocaleString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}


class TaskManager {
    constructor() {
        this.tasks = [];
        this.nextId = 1;
    }

    addTask(text, deadline = null) {
        if (!text.trim()) {
            throw new Error('Task text cannot be empty');
        }
        
        const task = new Task(this.nextId++, text.trim(), deadline);
        this.tasks.push(task);
        return task;
    }

    deleteTask(id) {
        this.tasks = this.tasks.filter(task => task.id !== id);
    }

    toggleTask(id) {
        const task = this.tasks.find(task => task.id === id);
        if (task) {
            task.toggle();
        }
    }

    clearCompleted() {
        this.tasks = this.tasks.filter(task => !task.completed);
    }

    getStats() {
        const total = this.tasks.length;
        const completed = this.tasks.filter(task => task.completed).length;
        const remaining = total - completed;
        const overdue = this.tasks.filter(task => task.isOverdue()).length;
        const dueSoon = this.tasks.filter(task => task.isDueSoon()).length;
        
        return { total, completed, remaining, overdue, dueSoon };
    }

    getAllTasks() {
        return [...this.tasks];
    }
}

// UI Controller
class UIController {
    constructor(taskManager) {
        this.taskManager = taskManager;
        this.initElements();
        this.bindEvents();
        this.updateUI();
    }

    initElements() {
        this.taskInput = document.getElementById('taskInput');
        this.deadlineInput = document.getElementById('deadlineInput');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.emptyState = document.getElementById('emptyState');
        this.clearCompleted = document.getElementById('clearCompleted');
        this.totalTasks = document.getElementById('totalTasks');
        this.completedTasks = document.getElementById('completedTasks');
        this.remainingTasks = document.getElementById('remainingTasks');
    }

    bindEvents() {
        this.addBtn.addEventListener('click', () => this.handleAddTask());
        this.taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleAddTask();
        });
        this.clearCompleted.addEventListener('click', () => this.handleClearCompleted());
    }

    handleAddTask() {
        const text = this.taskInput.value;
        const deadline = this.deadlineInput.value;
        
        try {
            this.taskManager.addTask(text, deadline || null);
            this.taskInput.value = '';
            this.deadlineInput.value = '';
            this.updateUI();
            this.taskInput.focus();
        } catch (error) {
            alert('Vui lòng nhập nội dung công việc!');
        }
    }

    handleDeleteTask(id) {
        this.taskManager.deleteTask(id);
        this.updateUI();
    }

    handleToggleTask(id) {
        this.taskManager.toggleTask(id);
        this.updateUI();
    }

    handleClearCompleted() {
        if (confirm('Bạn có chắc muốn xóa tất cả các công việc đã hoàn thành?')) {
            this.taskManager.clearCompleted();
            this.updateUI();
        }
    }

    updateUI() {
        this.renderTasks();
        this.updateStats();
        this.updateEmptyState();
    }

    renderTasks() {
        this.todoList.innerHTML = '';
        const tasks = this.taskManager.getAllTasks();

        tasks.forEach(task => {
            const li = this.createTaskElement(task);
            this.todoList.appendChild(li);
        });
    }

    createTaskElement(task) {
        const li = document.createElement('li');
        let itemClass = 'todo-item';
        
        if (task.completed) {
            itemClass += ' completed';
        } else if (task.isOverdue()) {
            itemClass += ' overdue';
        } else if (task.isDueSoon()) {
            itemClass += ' due-soon';
        }
        
        li.className = itemClass;
        
        const deadlineHtml = task.deadline ? 
            `<span class="task-deadline ${task.isOverdue() ? 'overdue' : task.isDueSoon() ? 'due-soon' : ''}">
                Đến: ${task.getFormattedDeadline()}
            </span>` : '';
        
        li.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}
                   onchange="app.handleToggleTask(${task.id})">
            <div class="task-content">
                <div class="task-text">${this.escapeHtml(task.text)}</div>
                <div class="task-meta">
                    <span class="task-created"> Từ: ${task.getFormattedCreatedDate()}</span>
                    ${deadlineHtml}
                </div>
            </div>
            <button class="delete-btn" onclick="app.handleDeleteTask(${task.id})">Xóa</button>
        `;
        
        return li;
    }

    updateStats() {
        const stats = this.taskManager.getStats();
        
        this.totalTasks.textContent = stats.total;
        this.completedTasks.textContent = stats.completed;
        this.remainingTasks.textContent = stats.remaining;
        
        this.clearCompleted.disabled = stats.completed === 0;
    }

    updateEmptyState() {
        const hasTasks = this.taskManager.getAllTasks().length > 0;
        
        this.emptyState.style.display = hasTasks ? 'none' : 'block';
        this.todoList.style.display = hasTasks ? 'block' : 'none';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Application Initialization
class TodoApp {
    constructor() {
        this.taskManager = new TaskManager();
        this.uiController = new UIController(this.taskManager);
    }

    // Public methods for global access (used by onclick handlers)
    handleDeleteTask(id) {
        this.uiController.handleDeleteTask(id);
    }

    handleToggleTask(id) {
        this.uiController.handleToggleTask(id);
    }
}

// Initialize the application
const app = new TodoApp();

// Focus input when page loads
window.addEventListener('load', () => {
    document.getElementById('taskInput').focus();
});


// Cấu hình Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCb16o28Z3s1bISOSkm6clx1FTmrdQXP2o",
  authDomain: "to-do-list-93409.firebaseapp.com",
  projectId: "to-do-list-93409",
  storageBucket: "to-do-list-93409.firebasestorage.app",
  messagingSenderId: "195729285009",
  appId: "1:195729285009:web:daf8b3079a93b34cb38430"
};

// Khởi tạo Firebase
firebase.initializeApp(firebaseConfig);

// Lấy Firestore
const db = firebase.firestore();

// Test ghi dữ liệu
db.collection("tasks").add({
  text: "Test task",
  done: false,
  timestamp: firebase.firestore.FieldValue.serverTimestamp()
});
