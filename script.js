
// ========================================
// TASKFLOW - TODO LIST APPLICATION
// ========================================

// DOM ELEMENTS
const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priority");
const taskList = document.getElementById("taskList");
const searchInput = document.getElementById("searchInput");
const submitBtn = document.getElementById("submitBtn");
const emptyMessage = document.getElementById("emptyMessage");

const totalTasksElement = document.getElementById("totalTasks");
const pendingTasksElement = document.getElementById("pendingTasks");
const completedTasksElement = document.getElementById("completedTasks");

const progressBar = document.getElementById("progressBar");
const progressPercent = document.getElementById("progressPercent");
const currentDate = document.getElementById("currentDate");

// ========================================
// APPLICATION DATA
// ========================================

function loadTasks() {
    try {
        const storedTasks = JSON.parse(localStorage.getItem("tasks"));

        if (!Array.isArray(storedTasks)) return [];

        return storedTasks.filter(task =>
            task &&
            typeof task.id === "string" &&
            typeof task.title === "string"
        ).map(task => ({
            id: task.id,
            title: task.title,
            priority: ["Low", "Medium", "High"].includes(task.priority)
                ? task.priority
                : "Medium",
            completed: task.completed === true
        }));

    } catch (error) {
        console.error("Unable to load tasks:", error);
        return [];
    }
}

let tasks = loadTasks();
let currentFilter = "all";
let editingId = null;

// ========================================
// SAVE TASKS
// ========================================

function saveTasks() {
    try {
        localStorage.setItem("tasks", JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error("Unable to save tasks:", error);
        alert("Unable to save tasks. Your browser storage may be full.");
        return false;
    }
}

// ========================================
// DISPLAY CURRENT DATE
// ========================================

function displayDate() {
    const today = new Date();

    currentDate.textContent = today.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

// ========================================
// UPDATE STATISTICS & PROGRESS
// ========================================

function updateStats() {

    const total = tasks.length;

    const completed = tasks.filter(task => task.completed).length;

    const pending = total - completed;

    totalTasksElement.textContent = total;
    completedTasksElement.textContent = completed;
    pendingTasksElement.textContent = pending;

    const percentage = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    progressPercent.textContent = percentage + "%";

    progressBar.style.width = percentage + "%";

    progressBar.setAttribute("aria-valuenow", percentage);
}

// ========================================
// DISPLAY TASKS
// ========================================

function displayTasks() {

    taskList.innerHTML = "";

    const searchText = searchInput.value.trim().toLowerCase();

    const filteredTasks = tasks.filter(task => {

        const matchesSearch = task.title
            .toLowerCase()
            .includes(searchText);

        const matchesFilter =
            currentFilter === "all" ||
            (currentFilter === "pending" && !task.completed) ||
            (currentFilter === "completed" && task.completed);

        return matchesSearch && matchesFilter;
    });

    // EMPTY MESSAGE

    if (filteredTasks.length === 0) {

        emptyMessage.style.display = "block";

        if (searchText) {
            emptyMessage.textContent = "No matching tasks found!";
        } else if (currentFilter === "completed") {
            emptyMessage.textContent = "No completed tasks yet!";
        } else if (currentFilter === "pending") {
            emptyMessage.textContent = "No pending tasks!";
        } else {
            emptyMessage.textContent = "No tasks yet. Add your first task!";
        }

    } else {
        emptyMessage.style.display = "none";
    }

    // CREATE TASK CARDS

    filteredTasks.forEach(task => {

        const item = document.createElement("div");

        item.className = `task-item ${task.completed ? "completed" : ""}`;

        // CHECKBOX

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute("aria-label", `Mark ${task.title} as completed`);

        checkbox.addEventListener("change", () => {
            toggleTask(task.id);
        });

        // TASK INFORMATION

        const info = document.createElement("div");
        info.className = "task-info";

        const title = document.createElement("h3");
        title.textContent = task.title;

        const priority = document.createElement("small");

        priority.textContent = task.priority;
        priority.className = `priority ${task.priority}`;

        info.append(title, priority);

        // ACTION BUTTONS

        const actions = document.createElement("div");
        actions.className = "task-actions";

        // EDIT BUTTON

        const editButton = document.createElement("button");

        editButton.type = "button";
        editButton.textContent = "✏️";
        editButton.className = "edit-btn";
        editButton.setAttribute("aria-label", `Edit ${task.title}`);

        editButton.addEventListener("click", () => {
            editTask(task.id);
        });

        // DELETE BUTTON

        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.textContent = "🗑️";
        deleteButton.className = "delete-btn";
        deleteButton.setAttribute("aria-label", `Delete ${task.title}`);

        deleteButton.addEventListener("click", () => {
            deleteTask(task.id);
        });

        actions.append(editButton, deleteButton);

        item.append(checkbox, info, actions);

        taskList.appendChild(item);
    });

    updateStats();
}

// ========================================
// ADD OR UPDATE TASK
// ========================================

taskForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const title = taskInput.value.trim();

    if (!title) {
        alert("Please enter a task!");
        taskInput.focus();
        return;
    }

    if (editingId !== null) {

        const previousTasks = tasks;

        tasks = tasks.map(task =>
            task.id === editingId
                ? {
                    ...task,
                    title: title,
                    priority: priorityInput.value
                }
                : task
        );

        if (!saveTasks()) {
            tasks = previousTasks;
            return;
        }

        editingId = null;

        submitBtn.textContent = "+ Add Task";

    } else {

        const newTask = {
            id: crypto.randomUUID
                ? crypto.randomUUID()
                : Date.now().toString() + Math.random().toString(36).slice(2),
            title: title,
            priority: priorityInput.value,
            completed: false
        };

        tasks.unshift(newTask);

        if (!saveTasks()) {
            tasks.shift();
            return;
        }
    }

    taskForm.reset();

    priorityInput.value = "Medium";

    taskInput.focus();

    displayTasks();
});

// ========================================
// COMPLETE / UNCOMPLETE TASK
// ========================================

function toggleTask(id) {

    const previousTasks = tasks;

    tasks = tasks.map(task =>
        task.id === id
            ? { ...task, completed: !task.completed }
            : task
    );

    if (!saveTasks()) {
        tasks = previousTasks;
    }

    displayTasks();
}

// ========================================
// DELETE TASK
// ========================================

function deleteTask(id) {

    const task = tasks.find(task => task.id === id);

    if (!task) return;

    const confirmDelete = confirm(
        `Are you sure you want to delete "${task.title}"?`
    );

    if (!confirmDelete) return;

    const previousTasks = tasks;

    tasks = tasks.filter(task => task.id !== id);

    if (editingId === id) {
        editingId = null;
        taskForm.reset();
        priorityInput.value = "Medium";
        submitBtn.textContent = "+ Add Task";
    }

    if (!saveTasks()) {
        tasks = previousTasks;
        return;
    }

    displayTasks();
}

// ========================================
// EDIT TASK
// ========================================

function editTask(id) {

    const task = tasks.find(task => task.id === id);

    if (!task) return;

    taskInput.value = task.title;

    priorityInput.value = task.priority;

    editingId = id;

    submitBtn.textContent = "Update Task";

    taskInput.focus();

    taskForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

// ========================================
// CANCEL EDITING
// ========================================

function cancelEditing() {

    editingId = null;

    taskForm.reset();

    priorityInput.value = "Medium";

    submitBtn.textContent = "+ Add Task";

    taskInput.focus();
}

// ========================================
// SEARCH TASKS
// ========================================

searchInput.addEventListener("input", function() {

    displayTasks();

});

// ========================================
// FILTER TASKS
// ========================================

document.querySelectorAll(".filter").forEach(button => {

    button.addEventListener("click", function() {

        document.querySelector(".filter.active")
            ?.classList.remove("active");

        this.classList.add("active");

        currentFilter = this.dataset.filter;

        displayTasks();

    });

});

// ========================================
// INITIALIZE APPLICATION
// ========================================

displayDate();

displayTasks();
