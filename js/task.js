$(document).ready(function () {
    // Load Groups for Dropdown
    function loadUserGroups() {
        const userEmail = localStorage.getItem("userEmail");
        const $groupSelect = $("#group-select");
        const $modalGroupSelect = $("#task-group-select");

        $groupSelect.html(`<option value="">-- Select Group --</option>`);
        $modalGroupSelect.html(`<option value="">-- Select Group --</option>`);

        db.collection("groups")
            .where("members", "array-contains", userEmail)
            .get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    const group = doc.data();
                    const option = `<option value="${doc.id}">${group.name}</option>`;
                    $groupSelect.append(option);
                    $modalGroupSelect.append(option);
                });
            })
            .catch(err => console.error("Error loading user groups:", err));
    }

    // Load Tasks for Selected Group
    function loadTasks(groupId) {
        const $taskList = $("#task-list");
        $taskList.empty();

        db.collection("tasks")
            .where("groupId", "==", groupId)
            .get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    const task = doc.data();
                    renderTask(task, doc.id);
                });
            })
            .catch(err => console.error("Error loading tasks:", err));
    }

    // Render a Task Item
    function renderTask(task, id) {
        const members = task.members.join(", ");
        const $item = $(`
            <li class="task-item">
                <div class="task-header">
                    <span class="task-name">${task.name}</span>
                    <span class="delete-task" data-id="${id}">🗑️</span>
                </div>
                <div class="task-meta">Members: ${members}</div>
                <div class="task-actions">
                    <label>
                        <input type="checkbox" class="toggle-status" data-id="${id}" ${task.status === 'done' ? 'checked' : ''}>
                        ${task.status === 'done' ? 'Done' : 'Pending'}
                    </label>
                </div>
            </li>
        `);
        $("#task-list").append($item);
    }

    // Add Task with Offline Sync
    async function addTask(taskData) {
        if (navigator.onLine) {
            await db.collection("tasks").add(taskData);
        } else {
            const localDB = await dbPromise;
            await localDB.add("sync-tasks", taskData);
            navigator.serviceWorker.ready.then(sw => {
                sw.sync.register("sync-tasks");
            });
        }

        if ('Notification' in window && Notification.permission === "granted") {
            new Notification("Hive Update", {
                body: "New task added!",
                icon: "assets/icons/web-app-manifest-192x192.png"
            });
        }
    }

    // Dropdown Change to Load Tasks
    $("#group-select").on("change", function () {
        const groupId = $(this).val();
        if (groupId) loadTasks(groupId);
    });

    // Modal Group Change to Load Members
    $("#task-group-select").on("change", function () {
        const groupId = $(this).val();
        const $memberSelect = $("#task-members").prop("disabled", true).empty();

        db.collection("groups").doc(groupId).get().then(doc => {
            const members = doc.data().members;
            members.forEach(email => {
                $memberSelect.append(`<option value="${email}">${email}</option>`);
            });
            $memberSelect.prop("disabled", false);
        });
    });

    // Submit Add Task Modal
    $("#task-form").on("submit", async function (e) {
        e.preventDefault();

        const name = $("#task-name").val();
        const groupId = $("#task-group-select").val();
        const members = $("#task-members").val() || [];
        const status = $("#task-status").val();

        const taskData = { name, groupId, members, status, timestamp: Date.now() };
        await addTask(taskData);

        // Close and reset modal
        $("#task-modal").addClass("hidden");
        this.reset();

        if ($("#group-select").val() === groupId) {
            loadTasks(groupId);
        }
    });

    // Toggle Task Status
    $("#task-list").on("change", ".toggle-status", async function () {
        const id = $(this).data("id");
        const newStatus = $(this).is(":checked") ? "done" : "pending";
        await db.collection("tasks").doc(id).update({ status: newStatus });
    });

    // Delete Task
    $("#task-list").on("click", ".delete-task", async function () {
        const id = $(this).data("id");
        await db.collection("tasks").doc(id).delete();
        $(this).closest(".task-item").remove();
    });

    // Modal Controls
    $("#open-add-task-modal").on("click", function () {
        $("#task-modal").removeClass("hidden");
    });
    $("#cancel-task-modal").on("click", function () {
        $("#task-modal").addClass("hidden");
    });

    // Initial Load (Safe only if this script is run after the DOM is available)
    loadUserGroups();
});
