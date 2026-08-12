const STORAGE_KEY = "dailyHubTasksV3";
const CHECKLIST_KEY = "dailyHubChecklistV2";
const NOTIFIED_KEY = "dailyHubNotifiedV2";

const els = {
  taskList: document.getElementById("task-list"),
  emptyState: document.getElementById("empty-state"),
  emptyStateText: document.getElementById("empty-state-text"),
  pendingCount: document.getElementById("pending-count"),

  modal: document.getElementById("task-modal"),
  modalTitle: document.getElementById("modal-title"),

  addTaskButton: document.getElementById("add-task"),
  floatingAdd: document.getElementById("floating-add"),

  closeModalButton: document.getElementById("close-modal"),
  modalBackground: document.getElementById("modal-background"),

  taskForm: document.getElementById("task-form"),

  taskId: document.getElementById("task-id"),
  taskTitle: document.getElementById("task-title"),
  taskDate: document.getElementById("task-date"),
  taskTime: document.getElementById("task-time"),
  taskPriority: document.getElementById("task-priority"),
  taskReminder: document.getElementById("task-reminder"),
  taskRepeat: document.getElementById("task-repeat"),
  taskNote: document.getElementById("task-note"),

  customRepeatBox: document.getElementById("custom-repeat-box"),
  repeatEndBox: document.getElementById("repeat-end-box"),
  repeatHasEnd: document.getElementById("repeat-has-end"),
  repeatEndDateLabel: document.getElementById("repeat-end-date-label"),
  repeatEndDate: document.getElementById("repeat-end-date"),

  currentDate: document.getElementById("current-date"),
  greeting: document.getElementById("greeting"),
  greetingEmoji: document.getElementById("greeting-emoji"),

  notificationButton: document.getElementById("notification-button"),

  toast: document.getElementById("toast"),

  checklist: document.getElementById("checklist"),
  resetChecklist: document.getElementById("reset-checklist"),

  carModeCard: document.getElementById("car-mode-card"),
  carModeSummary: document.getElementById("car-mode-summary")
};


let tasks =
  loadJSON(
    STORAGE_KEY,
    []
  );


let currentView =
  "today";


let notified =
  new Set(
    loadJSON(
      NOTIFIED_KEY,
      []
    )
  );


// ========================================
// ALMACENAMIENTO
// ========================================

function loadJSON(
  key,
  fallback
) {

  try {

    const value =
      JSON.parse(
        localStorage.getItem(
          key
        )
      );

    return value ?? fallback;

  }

  catch {

    return fallback;

  }

}


function saveJSON(
  key,
  value
) {

  localStorage.setItem(
    key,
    JSON.stringify(
      value
    )
  );

}


function saveTasks() {

  saveJSON(
    STORAGE_KEY,
    tasks
  );

}


// ========================================
// FECHAS
// ========================================

function getLocalDateString(
  date = new Date()
) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );

  return `${year}-${month}-${day}`;

}


function dateFromString(
  dateString
) {

  const [
    year,
    month,
    day
  ] =
    dateString
      .split("-")
      .map(Number);

  return new Date(
    year,
    month - 1,
    day,
    12,
    0,
    0,
    0
  );

}


function addDays(
  date,
  amount
) {

  const result =
    new Date(date);

  result.setDate(
    result.getDate()
    + amount
  );

  return result;

}


function parseOccurrenceDateTime(
  task,
  occurrenceDate
) {

  if (
    !occurrenceDate
    || !task.time
  ) {
    return null;
  }


  const [
    year,
    month,
    day
  ] =
    occurrenceDate
      .split("-")
      .map(Number);


  const [
    hour,
    minute
  ] =
    task.time
      .split(":")
      .map(Number);


  return new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    0,
    0
  );

}


function formatDateLabel(
  dateString
) {

  const today =
    getLocalDateString();


  const tomorrow =
    getLocalDateString(
      addDays(
        new Date(),
        1
      )
    );


  if (
    dateString === today
  ) {
    return "Hoy";
  }


  if (
    dateString === tomorrow
  ) {
    return "Mañana";
  }


  return new Intl.DateTimeFormat(
    "es-PY",
    {
      weekday: "short",
      day: "numeric",
      month: "short"
    }
  ).format(
    dateFromString(
      dateString
    )
  );

}


// ========================================
// SALUDO
// ========================================

function updateHeader() {

  const now =
    new Date();


  els.currentDate.textContent =
    new Intl.DateTimeFormat(
      "es-PY",
      {
        weekday: "long",
        day: "numeric",
        month: "long"
      }
    )
      .format(now)
      .replace(
        /^./,
        character =>
          character.toUpperCase()
      );


  const hour =
    now.getHours();


  if (
    hour < 12
  ) {

    els.greeting.textContent =
      "Buenos días";

    els.greetingEmoji.textContent =
      "☀️";

  }

  else if (
    hour < 19
  ) {

    els.greeting.textContent =
      "Buenas tardes";

    els.greetingEmoji.textContent =
      "🌤️";

  }

  else {

    els.greeting.textContent =
      "Buenas noches";

    els.greetingEmoji.textContent =
      "🌙";

  }

}


// ========================================
// REPETICIONES
// ========================================

function isRecurring(
  task
) {

  return (
    task.repeat
    && task.repeat.type
    && task.repeat.type !== "none"
  );

}


function matchesRepeatRule(
  task,
  dateString
) {

  if (
    dateString < task.date
  ) {
    return false;
  }


  if (
    task.repeat?.endDate
    && dateString
      > task.repeat.endDate
  ) {
    return false;
  }


  const date =
    dateFromString(
      dateString
    );


  const weekday =
    date.getDay();


  const type =
    task.repeat?.type
    || "none";


  if (
    type === "none"
  ) {

    return (
      dateString
      === task.date
    );

  }


  if (
    type === "daily"
  ) {

    return true;

  }


  if (
    type === "weekdays"
  ) {

    return (
      weekday >= 1
      && weekday <= 5
    );

  }


  if (
    type === "weekends"
  ) {

    return (
      weekday === 0
      || weekday === 6
    );

  }


  if (
    type === "weekly"
  ) {

    const originalWeekday =
      dateFromString(
        task.date
      ).getDay();


    return (
      weekday
      === originalWeekday
    );

  }


  if (
    type === "custom"
  ) {

    const days =
      task.repeat?.days
      || [];


    return days.includes(
      weekday
    );

  }


  return false;

}


function isOccurrenceCompleted(
  task,
  dateString
) {

  if (
    isRecurring(task)
  ) {

    return (
      task.completedDates
      || []
    ).includes(
      dateString
    );

  }


  return Boolean(
    task.completed
  );

}


function makeOccurrence(
  task,
  occurrenceDate
) {

  return {
    task,
    occurrenceDate,
    completed:
      isOccurrenceCompleted(
        task,
        occurrenceDate
      )
  };

}


function getTodayOccurrences() {

  const today =
    getLocalDateString();


  return tasks
    .filter(
      task =>
        matchesRepeatRule(
          task,
          today
        )
    )
    .map(
      task =>
        makeOccurrence(
          task,
          today
        )
    )
    .filter(
      item =>
        !item.completed
    )
    .sort(
      sortOccurrences
    );

}


function getUpcomingOccurrences(
  daysAhead = 30
) {

  const today =
    new Date();


  const occurrences =
    [];


  for (
    let offset = 1;
    offset <= daysAhead;
    offset++
  ) {

    const date =
      addDays(
        today,
        offset
      );


    const dateString =
      getLocalDateString(
        date
      );


    for (
      const task of tasks
    ) {

      if (
        !matchesRepeatRule(
          task,
          dateString
        )
      ) {
        continue;
      }


      if (
        isOccurrenceCompleted(
          task,
          dateString
        )
      ) {
        continue;
      }


      occurrences.push(
        makeOccurrence(
          task,
          dateString
        )
      );

    }

  }


  return occurrences
    .sort(
      sortOccurrences
    );

}


function getCompletedOccurrences(
  daysBack = 60
) {

  const occurrences =
    [];


  for (
    const task of tasks
  ) {

    if (
      isRecurring(task)
    ) {

      const completedDates =
        task.completedDates
        || [];


      for (
        const dateString
        of completedDates
      ) {

        occurrences.push({
          task,
          occurrenceDate:
            dateString,
          completed: true
        });

      }

    }

    else if (
      task.completed
    ) {

      occurrences.push({
        task,
        occurrenceDate:
          task.date,
        completed: true
      });

    }

  }


  return occurrences
    .sort(
      (
        a,
        b
      ) =>
        b.occurrenceDate
          .localeCompare(
            a.occurrenceDate
          )
    )
    .slice(
      0,
      daysBack
    );

}


function sortOccurrences(
  a,
  b
) {

  if (
    a.occurrenceDate
    !== b.occurrenceDate
  ) {

    return (
      a.occurrenceDate
        .localeCompare(
          b.occurrenceDate
        )
    );

  }


  const priorityScore = {
    important: 0,
    normal: 1
  };


  const priorityDifference =
    (
      priorityScore[
        a.task.priority
      ]
      ?? 1
    )
    -
    (
      priorityScore[
        b.task.priority
      ]
      ?? 1
    );


  if (
    priorityDifference
    !== 0
  ) {
    return priorityDifference;
  }


  const aTime =
    a.task.time
    || "99:99";


  const bTime =
    b.task.time
    || "99:99";


  return aTime
    .localeCompare(
      bTime
    );

}


function repeatLabel(
  task
) {

  const type =
    task.repeat?.type
    || "none";


  if (
    type === "none"
  ) {
    return "";
  }


  if (
    type === "daily"
  ) {
    return "Todos los días";
  }


  if (
    type === "weekdays"
  ) {
    return "Lun–Vie";
  }


  if (
    type === "weekends"
  ) {
    return "Fines de semana";
  }


  if (
    type === "weekly"
  ) {
    return "Semanal";
  }


  if (
    type === "custom"
  ) {

    const names = {
      0: "D",
      1: "L",
      2: "M",
      3: "X",
      4: "J",
      5: "V",
      6: "S"
    };


    return (
      task.repeat.days
        .map(
          day =>
            names[day]
        )
        .join(" · ")
    );

  }


  return "";
}


// ========================================
// RENDERIZADO
// ========================================

function getVisibleOccurrences() {

  if (
    currentView === "today"
  ) {

    return getTodayOccurrences();

  }


  if (
    currentView
    === "upcoming"
  ) {

    return getUpcomingOccurrences();

  }


  return getCompletedOccurrences();

}


function updatePendingCount() {

  const total =
    getTodayOccurrences()
      .length;


  els.pendingCount.textContent =
    total;


  els.carModeSummary.textContent =
    total === 0
      ? "No tenés pendientes para hoy."
      : total === 1
        ? "Tenés 1 pendiente para hoy."
        : `Tenés ${total} pendientes para hoy.`;

}


function renderTasks() {

  const visible =
    getVisibleOccurrences();


  els.taskList.innerHTML =
    "";


  for (
    const occurrence
    of visible
  ) {

    const task =
      occurrence.task;


    const item =
      document.createElement(
        "article"
      );


    item.className =
      `task ${
        occurrence.completed
          ? "completed"
          : ""
      }`;


    const meta =
      [];


    if (
      currentView !== "today"
    ) {

      meta.push(
        `
          <span>
            📅
            ${escapeHTML(
              formatDateLabel(
                occurrence
                  .occurrenceDate
              )
            )}
          </span>
        `
      );

    }


    if (
      task.time
    ) {

      meta.push(
        `
          <span>
            ⏰
            ${escapeHTML(
              task.time
            )}
          </span>
        `
      );

    }


    if (
      task.priority
      === "important"
    ) {

      meta.push(
        `
          <span class="important">
            Importante
          </span>
        `
      );

    }

    else {

      meta.push(
        "<span>Normal</span>"
      );

    }


    if (
      task.time
    ) {

      meta.push(
        `
          <span>
            🔔
            ${reminderLabel(
              Number(
                task.reminder
                ?? 15
              )
            )}
          </span>
        `
      );

    }


    const repeat =
      repeatLabel(
        task
      );


    if (
      repeat
    ) {

      meta.push(
        `
          <span class="repeat-pill">
            ↻
            ${escapeHTML(
              repeat
            )}
          </span>
        `
      );

    }


    item.innerHTML = `

      <button
        class="task-check"
        data-action="complete"
        data-id="${task.id}"
        data-date="${occurrence.occurrenceDate}"
        aria-label="Cambiar estado">
      </button>


      <div class="task-info">

        <p class="task-title">
          ${escapeHTML(
            task.title
          )}
        </p>


        <div class="task-meta">
          ${meta.join("")}
        </div>


        ${
          task.note
            ? `
              <p class="task-note">
                ${escapeHTML(
                  task.note
                )}
              </p>
            `
            : ""
        }

      </div>


      <div class="task-actions">

        <button
          class="task-action"
          data-action="edit"
          data-id="${task.id}"
          data-date="${occurrence.occurrenceDate}"
          aria-label="Editar">
          ✎
        </button>


        <button
          class="task-action"
          data-action="delete"
          data-id="${task.id}"
          data-date="${occurrence.occurrenceDate}"
          aria-label="Eliminar">
          ✕
        </button>

      </div>

    `;


    els.taskList.appendChild(
      item
    );

  }


  els.emptyState.classList.toggle(
    "hidden",
    visible.length > 0
  );


  const emptyTexts = {

    today:
      "No tenés pendientes para hoy.",

    upcoming:
      "No tenés próximos recordatorios.",

    completed:
      "Todavía no completaste ninguna tarea."

  };


  els.emptyStateText.textContent =
    emptyTexts[
      currentView
    ];


  updatePendingCount();

}


// ========================================
// MODAL
// ========================================

function selectedCustomDays() {

  return [
    ...document.querySelectorAll(
      ".weekday-picker button.selected"
    )
  ].map(
    button =>
      Number(
        button.dataset.day
      )
  );

}


function setCustomDays(
  days = []
) {

  document
    .querySelectorAll(
      ".weekday-picker button"
    )
    .forEach(
      button => {

        button.classList.toggle(
          "selected",
          days.includes(
            Number(
              button.dataset.day
            )
          )
        );

      }
    );

}


function updateRepeatUI() {

  const repeatType =
    els.taskRepeat.value;


  const isRepeating =
    repeatType !== "none";


  els.customRepeatBox
    .classList
    .toggle(
      "hidden",
      repeatType !== "custom"
    );


  els.repeatEndBox
    .classList
    .toggle(
      "hidden",
      !isRepeating
    );


  if (
    !isRepeating
  ) {

    els.repeatHasEnd.checked =
      false;

    els.repeatEndDate.value =
      "";

  }


  els.repeatEndDateLabel
    .classList
    .toggle(
      "hidden",
      !els.repeatHasEnd.checked
    );

}


function openModal(
  task = null
) {

  els.modal.classList.remove(
    "hidden"
  );


  els.modal.setAttribute(
    "aria-hidden",
    "false"
  );


  els.taskForm.reset();


  setCustomDays([]);


  if (
    task
  ) {

    els.modalTitle.textContent =
      "Editar recordatorio";


    els.taskId.value =
      task.id;


    els.taskTitle.value =
      task.title;


    els.taskDate.value =
      task.date;


    els.taskTime.value =
      task.time
      || "";


    els.taskPriority.value =
      task.priority
      || "normal";


    els.taskReminder.value =
      String(
        task.reminder
        ?? 15
      );


    els.taskRepeat.value =
      task.repeat?.type
      || "none";


    els.taskNote.value =
      task.note
      || "";


    setCustomDays(
      task.repeat?.days
      || []
    );


    if (
      task.repeat?.endDate
    ) {

      els.repeatHasEnd.checked =
        true;


      els.repeatEndDate.value =
        task.repeat.endDate;

    }

    else {

      els.repeatHasEnd.checked =
        false;


      els.repeatEndDate.value =
        "";

    }

  }

  else {

    els.modalTitle.textContent =
      "Nuevo recordatorio";


    els.taskId.value =
      "";


    els.taskDate.value =
      getLocalDateString();


    els.taskReminder.value =
      "15";


    els.taskRepeat.value =
      "none";

  }


  updateRepeatUI();


  setTimeout(
    () =>
      els.taskTitle.focus(),
    120
  );

}


function closeModal() {

  els.modal.classList.add(
    "hidden"
  );


  els.modal.setAttribute(
    "aria-hidden",
    "true"
  );


  els.taskForm.reset();


  els.taskId.value =
    "";


  setCustomDays([]);

}


function handleSubmit(
  event
) {

  event.preventDefault();


  const title =
    els.taskTitle
      .value
      .trim();


  if (
    !title
  ) {
    return;
  }


  const repeatType =
    els.taskRepeat.value;


  const customDays =
    selectedCustomDays();


  if (
    repeatType === "custom"
    && customDays.length === 0
  ) {

    showToast(
      "Elegí al menos un día para repetir."
    );

    return;

  }


  const repeatEndDate =
    (
      repeatType !== "none"
      && els.repeatHasEnd.checked
    )
      ? els.repeatEndDate.value
      : "";


  if (
    repeatEndDate
    && repeatEndDate
      < els.taskDate.value
  ) {

    showToast(
      "La fecha de finalización no puede ser anterior al inicio."
    );

    return;

  }


  const data = {

    title,

    date:
      els.taskDate.value,

    time:
      els.taskTime.value,

    priority:
      els.taskPriority.value,

    reminder:
      Number(
        els.taskReminder.value
      ),

    repeat: {
      type:
        repeatType,

      days:
        repeatType === "custom"
          ? customDays
          : [],

      endDate:
        repeatEndDate
    },

    note:
      els.taskNote
        .value
        .trim()

  };


  const id =
    els.taskId.value;


  if (
    id
  ) {

    const task =
      tasks.find(
        item =>
          String(item.id)
          === String(id)
      );


    if (
      task
    ) {

      Object.assign(
        task,
        data
      );

    }


    showToast(
      "Recordatorio actualizado"
    );

  }

  else {

    tasks.push({

      id:
        crypto.randomUUID
          ? crypto.randomUUID()
          : String(
              Date.now()
            ),

      ...data,

      completed:
        false,

      completedAt:
        null,

      completedDates:
        [],

      createdAt:
        Date.now()

    });


    showToast(
      "Recordatorio guardado"
    );

  }


  saveTasks();

  renderTasks();

  closeModal();

  checkReminders();

}


// ========================================
// COMPLETAR / EDITAR / ELIMINAR
// ========================================

function toggleOccurrenceComplete(
  task,
  occurrenceDate
) {

  if (
    isRecurring(task)
  ) {

    task.completedDates =
      task.completedDates
      || [];


    const exists =
      task.completedDates.includes(
        occurrenceDate
      );


    if (
      exists
    ) {

      task.completedDates =
        task.completedDates.filter(
          date =>
            date !== occurrenceDate
        );

    }

    else {

      task.completedDates.push(
        occurrenceDate
      );

    }


    return !exists;

  }


  task.completed =
    !task.completed;


  task.completedAt =
    task.completed
      ? Date.now()
      : null;


  return task.completed;

}


function handleTaskClick(
  event
) {

  const button =
    event.target.closest(
      "button[data-action]"
    );


  if (
    !button
  ) {
    return;
  }


  const id =
    button.dataset.id;


  const occurrenceDate =
    button.dataset.date;


  const task =
    tasks.find(
      item =>
        String(item.id)
        === String(id)
    );


  if (
    !task
  ) {
    return;
  }


  const action =
    button.dataset.action;


  if (
    action === "complete"
  ) {

    const completed =
      toggleOccurrenceComplete(
        task,
        occurrenceDate
      );


    saveTasks();

    renderTasks();


    showToast(
      completed
        ? "Tarea completada ✓"
        : "Tarea reabierta"
    );


    return;

  }


  if (
    action === "edit"
  ) {

    openModal(
      task
    );


    return;

  }


  if (
    action === "delete"
  ) {

    const description =
      isRecurring(task)
        ? `"${task.title}" y todas sus repeticiones`
        : `"${task.title}"`;


    const confirmed =
      window.confirm(
        `¿Eliminar ${description}?`
      );


    if (
      !confirmed
    ) {
      return;
    }


    tasks =
      tasks.filter(
        item =>
          String(item.id)
          !== String(id)
      );


    saveTasks();

    renderTasks();


    showToast(
      "Recordatorio eliminado"
    );

  }

}


// ========================================
// VISTAS
// ========================================

function setView(
  view
) {

  currentView =
    view;


  document
    .querySelectorAll(
      ".tab"
    )
    .forEach(
      tab => {

        tab.classList.toggle(
          "active",
          tab.dataset.view
          === view
        );

      }
    );


  renderTasks();

}


// ========================================
// CHECKLIST
// ========================================

function loadChecklist() {

  const today =
    getLocalDateString();


  const saved =
    loadJSON(
      CHECKLIST_KEY,
      {
        date:
          today,

        values: {}
      }
    );


  const values =
    saved.date === today
      ? saved.values
      : {};


  els.checklist
    .querySelectorAll(
      "input[data-check]"
    )
    .forEach(
      input => {

        input.checked =
          Boolean(
            values[
              input.dataset.check
            ]
          );

      }
    );

}


function saveChecklist() {

  const values =
    {};


  els.checklist
    .querySelectorAll(
      "input[data-check]"
    )
    .forEach(
      input => {

        values[
          input.dataset.check
        ] =
          input.checked;

      }
    );


  saveJSON(
    CHECKLIST_KEY,
    {
      date:
        getLocalDateString(),

      values
    }
  );

}


function resetChecklist() {

  els.checklist
    .querySelectorAll(
      "input[data-check]"
    )
    .forEach(
      input => {

        input.checked =
          false;

      }
    );


  saveChecklist();


  showToast(
    "Checklist reiniciado"
  );

}


// ========================================
// NOTIFICACIONES
// ========================================

function reminderLabel(
  minutes
) {

  if (
    minutes === 0
  ) {
    return "A la hora";
  }


  if (
    minutes === 1440
  ) {
    return "1 día antes";
  }


  if (
    minutes === 60
  ) {
    return "1 h antes";
  }


  return `${minutes} min antes`;

}


async function requestNotificationPermission() {

  if (
    !(
      "Notification"
      in window
    )
  ) {

    showToast(
      "Este navegador no admite notificaciones web."
    );

    return;

  }


  if (
    Notification.permission
    === "granted"
  ) {

    showToast(
      "Las notificaciones ya están activadas."
    );

    return;

  }


  const permission =
    await Notification
      .requestPermission();


  if (
    permission === "granted"
  ) {

    showToast(
      "Notificaciones activadas 🔔"
    );


    checkReminders();

  }

  else {

    showToast(
      "No se concedió permiso para notificaciones."
    );

  }

}


function getOccurrencesForReminderWindow() {

  const today =
    getLocalDateString();


  const tomorrow =
    getLocalDateString(
      addDays(
        new Date(),
        1
      )
    );


  const occurrences =
    [];


  for (
    const dateString
    of [
      today,
      tomorrow
    ]
  ) {

    for (
      const task
      of tasks
    ) {

      if (
        !matchesRepeatRule(
          task,
          dateString
        )
      ) {
        continue;
      }


      if (
        isOccurrenceCompleted(
          task,
          dateString
        )
      ) {
        continue;
      }


      occurrences.push(
        makeOccurrence(
          task,
          dateString
        )
      );

    }

  }


  return occurrences;

}


function checkReminders() {

  if (
    !(
      "Notification"
      in window
    )
    ||
    Notification.permission
      !== "granted"
  ) {
    return;
  }


  const now =
    new Date();


  const occurrences =
    getOccurrencesForReminderWindow();


  for (
    const occurrence
    of occurrences
  ) {

    const task =
      occurrence.task;


    if (
      !task.time
    ) {
      continue;
    }


    const taskDate =
      parseOccurrenceDateTime(
        task,
        occurrence
          .occurrenceDate
      );


    if (
      !taskDate
    ) {
      continue;
    }


    const reminderMinutes =
      Number(
        task.reminder
        ?? 15
      );


    const remindAt =
      new Date(
        taskDate.getTime()
        -
        reminderMinutes
        * 60_000
      );


    const delta =
      now.getTime()
      -
      remindAt.getTime();


    const notificationId =
      `${task.id}:${
        occurrence
          .occurrenceDate
      }:${
        task.time
      }:${
        reminderMinutes
      }`;


    const dueNow =
      delta >= 0
      &&
      delta < 60_000
      &&
      !notified.has(
        notificationId
      );


    if (
      !dueNow
    ) {
      continue;
    }


    new Notification(
      "Daily Hub",
      {
        body:
          task.title,

        icon:
          "assets/icons/icon-192.png",

        badge:
          "assets/icons/icon-192.png",

        tag:
          `daily-hub-${
            task.id
          }-${
            occurrence
              .occurrenceDate
          }`
      }
    );


    notified.add(
      notificationId
    );


    saveJSON(
      NOTIFIED_KEY,
      [
        ...notified
      ]
    );

  }

}


// ========================================
// MODO VEHÍCULO
// ========================================

function setupCarMode() {

  const params =
    new URLSearchParams(
      window.location.search
    );


  const isCarMode =
    params.get(
      "modo"
    )
    === "auto";


  els.carModeCard
    .classList
    .toggle(
      "hidden",
      !isCarMode
    );


  if (
    isCarMode
  ) {

    currentView =
      "today";


    document
      .querySelectorAll(
        ".tab"
      )
      .forEach(
        tab => {

          tab.classList.toggle(
            "active",
            tab.dataset.view
            === "today"
          );

        }
      );

  }

}


// ========================================
// PWA
// ========================================

function registerServiceWorker() {

  if (
    "serviceWorker"
    in navigator
  ) {

    navigator
      .serviceWorker
      .register(
        "service-worker.js"
      )
      .catch(
        () => {

          // La app sigue funcionando
          // aunque falle en local.

        }
      );

  }

}


// ========================================
// UTILIDADES
// ========================================

function escapeHTML(
  text
) {

  const div =
    document.createElement(
      "div"
    );


  div.textContent =
    text
    ?? "";


  return div.innerHTML;

}


let toastTimer;


function showToast(
  message
) {

  clearTimeout(
    toastTimer
  );


  els.toast.textContent =
    message;


  els.toast
    .classList
    .remove(
      "hidden"
    );


  toastTimer =
    setTimeout(
      () => {

        els.toast
          .classList
          .add(
            "hidden"
          );

      },
      2400
    );

}


// ========================================
// EVENTOS
// ========================================

els.addTaskButton
  .addEventListener(
    "click",
    () =>
      openModal()
  );


els.floatingAdd
  .addEventListener(
    "click",
    () =>
      openModal()
  );


els.closeModalButton
  .addEventListener(
    "click",
    closeModal
  );


els.modalBackground
  .addEventListener(
    "click",
    closeModal
  );


els.taskForm
  .addEventListener(
    "submit",
    handleSubmit
  );


els.taskList
  .addEventListener(
    "click",
    handleTaskClick
  );


els.notificationButton
  .addEventListener(
    "click",
    requestNotificationPermission
  );


els.checklist
  .addEventListener(
    "change",
    saveChecklist
  );


els.resetChecklist
  .addEventListener(
    "click",
    resetChecklist
  );


els.taskRepeat
  .addEventListener(
    "change",
    updateRepeatUI
  );


els.repeatHasEnd
  .addEventListener(
    "change",
    updateRepeatUI
  );


document
  .querySelectorAll(
    ".weekday-picker button"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          button
            .classList
            .toggle(
              "selected"
            );

        }
      );

    }
  );


document
  .querySelectorAll(
    ".tab"
  )
  .forEach(
    tab => {

      tab.addEventListener(
        "click",
        () =>
          setView(
            tab.dataset.view
          )
      );

    }
  );


document
  .addEventListener(
    "keydown",
    event => {

      if (
        event.key === "Escape"
        &&
        !els.modal
          .classList
          .contains(
            "hidden"
          )
      ) {

        closeModal();

      }

    }
  );


// ========================================
// INICIAR
// ========================================

updateHeader();

loadChecklist();

setupCarMode();

renderTasks();

registerServiceWorker();

checkReminders();


setInterval(
  checkReminders,
  30_000
);
