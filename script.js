/* ==========================================================
   Gera D. Portfolio - shared script
   Modules: navigation, planner, contact form, footer year.
   Each module only runs if its elements exist on the page.
   ========================================================== */
"use strict";

/* ---------- 1. Mobile navigation ---------- */
function initNavigation() {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (!toggle || !links) return;

  toggle.addEventListener("click", () => {
    const isOpen = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
  });
}

/* ---------- 2. Footer year ---------- */
function initFooterYear() {
  const yearEl = document.querySelector("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
}

/* ---------- 3. Avatar fallback (shows initials if image is missing) ---------- */
function initAvatarFallback() {
  const img = document.querySelector("img.avatar");
  if (!img) return;
  img.addEventListener("error", () => {
    const fallback = document.createElement("div");
    fallback.className = "avatar";
    fallback.setAttribute("role", "img");
    fallback.setAttribute("aria-label", "Gera D. initials");
    fallback.textContent = "GD";
    img.replaceWith(fallback);
  });
}

/* ---------- 4. Academic planner ---------- */
function initPlanner() {
  const form = document.querySelector("#task-form");
  const body = document.querySelector("#task-body");
  if (!form || !body) return;

  const nameInput = document.querySelector("#task-name");
  const dateInput = document.querySelector("#task-date");
  const priorityInput = document.querySelector("#task-priority");
  const nameError = document.querySelector("#task-name-error");
  const dateError = document.querySelector("#task-date-error");
  const totalEl = document.querySelector("#stat-total");
  const doneEl = document.querySelector("#stat-done");
  const pendingEl = document.querySelector("#stat-pending");

  const STORAGE_KEY = "gera-planner-tasks";
  const priorityRank = { High: 0, Medium: 1, Low: 2 };

  // The array that holds all task objects
  let tasks = loadTasks();
  let nextId = tasks.reduce((max, t) => Math.max(max, t.id), 0) + 1;

  function loadTasks() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (Array.isArray(saved)) return saved;
    } catch (e) { /* ignore and fall back to sample data */ }
    return [
      { id: 1, name: "Finish COS 106 practical term project", due: "", priority: "High", completed: false },
      { id: 2, name: "Revise HTML and CSS lecture notes", due: "", priority: "Medium", completed: false },
    ];
  }

  function saveTasks() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch (e) { /* storage unavailable */ }
  }

  function formatDate(value) {
    if (!value) return "No due date";
    const d = new Date(value + "T00:00:00");
    return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  }

  // Build the table from the array
  function render() {
    body.innerHTML = "";

    if (tasks.length === 0) {
      const row = document.createElement("tr");
      row.className = "empty-row";
      row.innerHTML = '<td colspan="5">No tasks yet. Add your first task above.</td>';
      body.appendChild(row);
    }

    tasks.forEach((task) => {
      const row = document.createElement("tr");
      row.dataset.id = task.id;
      if (task.completed) row.classList.add("done");

      row.innerHTML = `
        <td class="task-name"></td>
        <td></td>
        <td><span class="badge badge--${task.priority.toLowerCase()}">${task.priority}</span></td>
        <td>${task.completed ? "Completed" : "Pending"}</td>
        <td>
          <div class="row-actions">
            <button type="button" class="mini" data-action="toggle">${task.completed ? "Undo" : "Complete"}</button>
            <button type="button" class="mini mini--danger" data-action="delete" aria-label="Delete task">Delete</button>
          </div>
        </td>`;

      // textContent keeps user input safe from HTML injection
      row.children[0].textContent = task.name;
      row.children[1].textContent = formatDate(task.due);
      body.appendChild(row);
    });

    updateStats();
  }

  function updateStats() {
    const done = tasks.filter((t) => t.completed).length;
    totalEl.textContent = tasks.length;
    doneEl.textContent = done;
    pendingEl.textContent = tasks.length - done;
  }

  function sortTasks() {
    tasks.sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      return priorityRank[a.priority] - priorityRank[b.priority];
    });
  }

  function setFieldError(input, errorEl, message) {
    errorEl.textContent = message;
    input.closest(".field").classList.toggle("invalid", Boolean(message));
  }

  // Add task
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const name = nameInput.value.trim();
    const due = dateInput.value;

    setFieldError(nameInput, nameError, name ? "" : "Enter a task name.");
    setFieldError(dateInput, dateError, due ? "" : "Choose a due date.");
    if (!name || !due) return;

    tasks.push({ id: nextId++, name, due, priority: priorityInput.value, completed: false });
    sortTasks();
    saveTasks();
    render();
    form.reset();
    nameInput.focus();
  });

  // Toggle complete / delete (event delegation on the table body)
  body.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const id = Number(button.closest("tr").dataset.id);

    if (button.dataset.action === "toggle") {
      tasks = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
      sortTasks();
    } else if (button.dataset.action === "delete") {
      tasks = tasks.filter((t) => t.id !== id);
    }

    saveTasks();
    render();
  });

  sortTasks();
  render();
}

/* ---------- 5. Contact form validation ---------- */
function initContactForm() {
  const form = document.querySelector("#contact-form");
  if (!form) return;

  const success = document.querySelector("#form-success");

  const fields = {
    name: document.querySelector("#name"),
    email: document.querySelector("#email"),
    phone: document.querySelector("#phone"),
    message: document.querySelector("#message"),
  };

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const digitsOnly = /^\d+$/;

  // Each validator returns an error message, or "" if the value is fine
  const validators = {
    name: (v) => (v ? "" : "Enter your name."),
    email: (v) => {
      if (!v) return "Enter your email address.";
      return emailPattern.test(v) ? "" : "Enter a valid email, like name@example.com.";
    },
    phone: (v) => {
      if (!v) return "Enter your phone number.";
      return digitsOnly.test(v) ? "" : "Use digits only, with no spaces, dashes or +.";
    },
    message: (v) => (v ? "" : "Write a message."),
  };

  function validateField(key) {
    const input = fields[key];
    const message = validators[key](input.value.trim());
    const field = input.closest(".field");
    field.classList.toggle("invalid", Boolean(message));
    field.querySelector(".error-msg").textContent = message;
    input.setAttribute("aria-invalid", String(Boolean(message)));
    return !message;
  }

  // Clear errors as the user fixes a field
  Object.keys(fields).forEach((key) => {
    fields[key].addEventListener("input", () => {
      if (fields[key].closest(".field").classList.contains("invalid")) validateField(key);
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    success.classList.remove("show");

    // Validate every field (don't stop at the first failure)
    const results = Object.keys(fields).map(validateField);
    const allValid = results.every(Boolean);

    if (!allValid) {
      const firstBad = form.querySelector(".invalid input, .invalid textarea");
      if (firstBad) firstBad.focus();
      return;
    }

    success.textContent = `Thanks, ${fields.name.value.trim()}. Your message has been sent. I'll reply soon.`;
    success.classList.add("show");
    form.reset();
  });
}

/* ---------- Start everything once the DOM is ready ---------- */
document.addEventListener("DOMContentLoaded", () => {
  initNavigation();
  initFooterYear();
  initAvatarFallback();
  initPlanner();
  initContactForm();
});
