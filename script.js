window.addEventListener("DOMContentLoaded", () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const isDashboard = document.body.classList.contains("dashboard");
  
    if (!user && isDashboard) {
      window.location.href = "index.html";
      return;
    }
  
    if (isDashboard) {
      // Set user name and avatar
      const name = user.name || "User";
      document.querySelector(".user-label").textContent = name.split(" ")[0];
      const initials = name.split(" ").map(n => n[0]).join("").toUpperCase();
      document.getElementById("avatar").textContent = initials;
  
      let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
  
      const taskInput = document.getElementById("taskInput");
      const prioritySelect = document.getElementById("priority");
      const addBtn = document.getElementById("addTask");
      const taskContainer = document.getElementById("taskContainer");
      const searchInput = document.getElementById("search");
      const filterPriority = document.getElementById("filterPriority");
  
      const tabButtons = document.querySelectorAll(".tab");
      let activeTab = "todo";
  
      function saveTasks() {
        localStorage.setItem("tasks", JSON.stringify(tasks));
      }
  
      function renderTasks() {
        taskContainer.innerHTML = "";
  
        const filtered = tasks
          .filter(t => t.stage === activeTab)
          .filter(t =>
            t.title.toLowerCase().includes(searchInput.value.toLowerCase())
          )
          .filter(t =>
            filterPriority.value ? t.priority === filterPriority.value : true
          );
  
        updateCounts();
  
        filtered.forEach(task => {
          const div = document.createElement("div");
          div.className = "task";
  
          const taskHeader = document.createElement("div");
          taskHeader.className = "task-header";
  
          const dot = document.createElement("span");
          dot.className = "priority-dot";
          dot.style.background = getPriorityColor(task.priority);
  
          const title = document.createElement("span");
          title.textContent = task.title;
  
          const time = document.createElement("div");
          time.className = "task-meta";
          time.textContent = `Last modified: ${task.modified}`;
  
          const actions = document.createElement("div");
          actions.className = "task-actions";
  
          if (task.stage === "todo") {
            actions.appendChild(createActionBtn("✔ Complete", "complete", () =>
              moveTask(task.id, "completed")
            ));
            actions.appendChild(createActionBtn("🗂 Archive", "archive", () =>
              moveTask(task.id, "archived")
            ));
          } else if (task.stage === "completed") {
            actions.appendChild(createActionBtn("🔁 Todo", "todo", () =>
              moveTask(task.id, "todo")
            ));
            actions.appendChild(createActionBtn("🗂 Archive", "archive", () =>
              moveTask(task.id, "archived")
            ));
          } else {
            actions.appendChild(createActionBtn("🔁 Todo", "todo", () =>
              moveTask(task.id, "todo")
            ));
            actions.appendChild(createActionBtn("✔ Complete", "complete", () =>
              moveTask(task.id, "completed")
            ));
          }
  
          taskHeader.append(dot, title);
          div.append(taskHeader, time, actions);
          taskContainer.appendChild(div);
        });
      }
  
      function updateCounts() {
        const counts = {
          todo: 0,
          completed: 0,
          archived: 0
        };
        tasks.forEach(t => counts[t.stage]++);
        document.getElementById("todo-count").textContent = counts.todo;
        document.getElementById("completed-count").textContent = counts.completed;
        document.getElementById("archived-count").textContent = counts.archived;
      }
  
      function createActionBtn(label, className, handler) {
        const btn = document.createElement("button");
        btn.textContent = label;
        btn.classList.add(className);
        btn.onclick = handler;
        return btn;
      }
  
      function moveTask(id, stage) {
        const task = tasks.find(t => t.id === id);
        task.stage = stage;
        task.modified = new Date().toLocaleString();
        saveTasks();
        renderTasks();
      }
  
      function getPriorityColor(priority) {
        switch (priority) {
          case "high": return "#ef4444";
          case "medium": return "#facc15";
          case "low": return "#22c55e";
          default: return "#cbd5e1";
        }
      }
  
      addBtn.addEventListener("click", () => {
        const title = taskInput.value.trim();
        const priority = prioritySelect.value;
        if (!title || !priority) return;
  
        tasks.push({
          id: Date.now(),
          title,
          priority,
          stage: "todo",
          modified: new Date().toLocaleString()
        });
  
        taskInput.value = "";
        prioritySelect.value = "";
        saveTasks();
        renderTasks();
      });
  
      tabButtons.forEach(btn => {
        btn.addEventListener("click", () => {
          tabButtons.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          activeTab = btn.dataset.tab;
          renderTasks();
        });
      });
  
      searchInput.addEventListener("input", renderTasks);
      filterPriority.addEventListener("change", renderTasks);
  
      // Export
      document.getElementById("export").addEventListener("click", () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(tasks));
        const dl = document.createElement("a");
        dl.setAttribute("href", dataStr);
        dl.setAttribute("download", "taskflow_tasks.json");
        dl.click();
      });
  
      // Import
      document.getElementById("import").addEventListener("click", () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = e => {
          const file = e.target.files[0];
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const imported = JSON.parse(reader.result);
              if (Array.isArray(imported)) {
                tasks = imported;
                saveTasks();
                renderTasks();
              }
            } catch {
              alert("Invalid file format.");
            }
          };
          reader.readAsText(file);
        };
        input.click();
      });
  
      document.getElementById("signout").addEventListener("click", () => {
        localStorage.clear();
        location.href = "index.html";
      });
  
      // Initial fetch
      if (tasks.length === 0) {
        fetch("https://dummyjson.com/todos")
          .then(res => res.json())
          .then(data => {
            tasks = data.todos.slice(0, 5).map(t => ({
              id: Date.now() + Math.random(),
              title: t.todo,
              stage: "todo",
              priority: ["low", "medium", "high"][Math.floor(Math.random() * 3)],
              modified: new Date().toLocaleString()
            }));
            saveTasks();
            renderTasks();
          });
      } else {
        renderTasks();
      }
    }
  });
  