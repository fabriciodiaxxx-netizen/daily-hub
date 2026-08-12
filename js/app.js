const CONFIG = window.DAILY_HUB_CONFIG;

const supabaseClient =
  window.supabase.createClient(
    CONFIG.SUPABASE_URL,
    CONFIG.SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  );


const CHECKLIST_KEY =
  "dailyHubChecklistV3";

const MIGRATION_KEY =
  "dailyHubMigratedToSupabaseV1";

const OLD_TASK_KEYS = [
  "dailyHubTasksV3",
  "dailyHubTasksV2",
  "dailyHubTasks"
];


const els = {

  authScreen:
    document.getElementById(
      "auth-screen"
    ),

  appShell:
    document.getElementById(
      "app-shell"
    ),

  loginForm:
    document.getElementById(
      "login-form"
    ),

  loginEmail:
    document.getElementById(
      "login-email"
    ),

  loginPassword:
    document.getElementById(
      "login-password"
    ),

  loginButton:
    document.getElementById(
      "login-button"
    ),

  loginError:
    document.getElementById(
      "login-error"
    ),

  accountButton:
    document.getElementById(
      "account-button"
    ),

  syncStatus:
    document.getElementById(
      "sync-status"
    ),

  taskList:
    document.getElementById(
      "task-list"
    ),

  emptyState:
    document.getElementById(
      "empty-state"
    ),

  emptyStateText:
    document.getElementById(
      "empty-state-text"
    ),

  pendingCount:
    document.getElementById(
      "pending-count"
    ),

  viewHeading:
    document.getElementById(
      "view-heading"
    ),

  navAccount:
    document.getElementById(
      "nav-account"
    ),

  modal:
    document.getElementById(
      "task-modal"
    ),

  modalTitle:
    document.getElementById(
      "modal-title"
    ),

  addTaskButton:
    document.getElementById(
      "add-task"
    ),

  floatingAdd:
    document.getElementById(
      "floating-add"
    ),

  closeModalButton:
    document.getElementById(
      "close-modal"
    ),

  modalBackground:
    document.getElementById(
      "modal-background"
    ),

  taskForm:
    document.getElementById(
      "task-form"
    ),

  taskId:
    document.getElementById(
      "task-id"
    ),

  taskTitle:
    document.getElementById(
      "task-title"
    ),

  taskDate:
    document.getElementById(
      "task-date"
    ),

  taskTime:
    document.getElementById(
      "task-time"
    ),

  taskPriority:
    document.getElementById(
      "task-priority"
    ),

  taskReminder:
    document.getElementById(
      "task-reminder"
    ),

  taskRepeat:
    document.getElementById(
      "task-repeat"
    ),

  taskNote:
    document.getElementById(
      "task-note"
    ),

  customRepeatBox:
    document.getElementById(
      "custom-repeat-box"
    ),

  repeatEndBox:
    document.getElementById(
      "repeat-end-box"
    ),

  repeatHasEnd:
    document.getElementById(
      "repeat-has-end"
    ),

  repeatEndDateLabel:
    document.getElementById(
      "repeat-end-date-label"
    ),

  repeatEndDate:
    document.getElementById(
      "repeat-end-date"
    ),

  currentDate:
    document.getElementById(
      "current-date"
    ),

  greeting:
    document.getElementById(
      "greeting"
    ),

  greetingEmoji:
    document.getElementById(
      "greeting-emoji"
    ),

  notificationButton:
    document.getElementById(
      "notification-button"
    ),

  toast:
    document.getElementById(
      "toast"
    ),

  checklist:
    document.getElementById(
      "checklist"
    ),

  resetChecklist:
    document.getElementById(
      "reset-checklist"
    ),

  carModeCard:
    document.getElementById(
      "car-mode-card"
    ),

  carModeSummary:
    document.getElementById(
      "car-mode-summary"
    )

};


let tasks = [];

let currentView =
  "today";

let currentUser =
  null;


// ========================================
// AUTENTICACIÓN
// ========================================

async function initializeAuth() {

  const {
    data,
    error
  } =
    await supabaseClient
      .auth
      .getSession();


  if (
    error
  ) {

    showAuthScreen();

    return;

  }


  const session =
    data.session;


  if (
    session?.user
  ) {

    currentUser =
      session.user;

    await enterApp();

  }

  else {

    showAuthScreen();

  }


  supabaseClient
    .auth
    .onAuthStateChange(
      async (
        event,
        session
      ) => {

        if (
          event === "SIGNED_OUT"
          ||
          !session?.user
        ) {

          currentUser =
            null;

          tasks = [];

          showAuthScreen();

          return;

        }


        currentUser =
          session.user;

      }
    );

}


async function handleLogin(
  event
) {

  event.preventDefault();


  els.loginError
    .classList
    .add(
      "hidden"
    );


  els.loginButton.disabled =
    true;

  els.loginButton.textContent =
    "Entrando...";


  const email =
    els.loginEmail
      .value
      .trim();


  const password =
    els.loginPassword
      .value;


  const {
    data,
    error
  } =
    await supabaseClient
      .auth
      .signInWithPassword({
        email,
        password
      });


  els.loginButton.disabled =
    false;

  els.loginButton.textContent =
    "Iniciar sesión";


  if (
    error
  ) {

    els.loginError.textContent =
      "No se pudo iniciar sesión. Revisá el correo y la contraseña.";

    els.loginError
      .classList
      .remove(
        "hidden"
      );

    return;

  }


  currentUser =
    data.user;


  await enterApp();

}


async function logout() {

  const confirmed =
    window.confirm(
      "¿Cerrar sesión en Daily Hub?"
    );


  if (
    !confirmed
  ) {
    return;
  }


  await supabaseClient
    .auth
    .signOut();

}


function showAuthScreen() {

  els.authScreen
    .classList
    .remove(
      "hidden"
    );


  els.appShell
    .classList
    .add(
      "hidden"
    );

}


function showAppScreen() {

  els.authScreen
    .classList
    .add(
      "hidden"
    );


  els.appShell
    .classList
    .remove(
      "hidden"
    );

}


async function enterApp() {

  showAppScreen();

  setSyncStatus(
    "☁️ Sincronizando..."
  );


  updateHeader();

  loadChecklist();

  setupCarMode();


  await migrateLocalTasksIfNeeded();

  await loadReminders();


  registerServiceWorker();

  setSyncStatus(
    "☁️ Sincronizado"
  );

}


// ========================================
// SUPABASE - RECORDATORIOS
// ========================================

function dbRowToTask(
  row
) {

  return {

    id:
      row.id,

    title:
      row.title,

    date:
      row.reminder_date,

    time:
      normalizeTime(
        row.reminder_time
      ),

    priority:
      row.priority,

    reminder:
      row.reminder_minutes
      ?? 0,

    repeat: {

      type:
        row.repeat_type
        === "never"
          ? "none"
          : row.repeat_type,

      days:
        row.repeat_days
        || [],

      endDate:
        row.repeat_end_date
        || ""

    },

    note:
      row.note
      || "",

    completed:
      Boolean(
        row.completed
      ),

    completedDates:
      row.completed_dates
      || [],

    createdAt:
      row.created_at

  };

}


function taskToDbPayload(
  task
) {

  return {

    title:
      task.title,

    reminder_date:
      task.date,

    reminder_time:
      task.time
      || null,

    priority:
      task.priority,

    reminder_minutes:
      Number(
        task.reminder
        ?? 0
      ),

    repeat_type:
      task.repeat?.type
      === "none"
        ? "never"
        : (
            task.repeat?.type
            || "never"
          ),

    repeat_days:
      task.repeat?.days
      || [],

    repeat_end_date:
      task.repeat?.endDate
      || null,

    note:
      task.note
      || null,

    completed:
      Boolean(
        task.completed
      ),

    completed_dates:
      task.completedDates
      || [],

    user_id:
      currentUser.id

  };

}


async function loadReminders() {

  if (
    !currentUser
  ) {
    return;
  }


  setSyncStatus(
    "☁️ Sincronizando..."
  );


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "reminders"
      )
      .select("*")
      .order(
        "created_at",
        {
          ascending: true
        }
      );


  if (
    error
  ) {

    console.error(
      error
    );

    setSyncStatus(
      "⚠️ Error de sincronización"
    );

    showToast(
      "No se pudieron cargar los recordatorios."
    );

    return;

  }


  tasks =
    data.map(
      dbRowToTask
    );


  renderTasks();


  setSyncStatus(
    "☁️ Sincronizado"
  );

}


async function insertReminder(
  task
) {

  const payload =
    taskToDbPayload(
      task
    );


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "reminders"
      )
      .insert(
        payload
      )
      .select()
      .single();


  if (
    error
  ) {
    throw error;
  }


  return dbRowToTask(
    data
  );

}


async function updateReminder(
  task
) {

  const payload =
    taskToDbPayload(
      task
    );


  const {
    data,
    error
  } =
    await supabaseClient
      .from(
        "reminders"
      )
      .update(
        payload
      )
      .eq(
        "id",
        task.id
      )
      .select()
      .single();


  if (
    error
  ) {
    throw error;
  }


  return dbRowToTask(
    data
  );

}


async function deleteReminder(
  id
) {

  const {
    error
  } =
    await supabaseClient
      .from(
        "reminders"
      )
      .delete()
      .eq(
        "id",
        id
      );


  if (
    error
  ) {
    throw error;
  }

}


// ========================================
// MIGRACIÓN DE LOCALSTORAGE
// ========================================

function getOldLocalTasks() {

  for (
    const key
    of OLD_TASK_KEYS
  ) {

    try {

      const raw =
        localStorage.getItem(
          key
        );


      if (
        !raw
      ) {
        continue;
      }


      const parsed =
        JSON.parse(
          raw
        );


      if (
        Array.isArray(parsed)
        &&
        parsed.length > 0
      ) {

        return parsed;

      }

    }

    catch {

      // ignorar

    }

  }


  return [];

}


function normalizeOldTask(
  task
) {

  return {

    title:
      task.title
      || "Recordatorio",

    date:
      task.date
      || getLocalDateString(),

    time:
      task.time
      || "",

    priority:
      task.priority
      || "normal",

    reminder:
      Number(
        task.reminder
        ?? 0
      ),

    repeat:
      task.repeat
      || {
        type: "none",
        days: [],
        endDate: ""
      },

    note:
      task.note
      || "",

    completed:
      Boolean(
        task.completed
      ),

    completedDates:
      task.completedDates
      || []

  };

}


async function migrateLocalTasksIfNeeded() {

  if (
    localStorage.getItem(
      MIGRATION_KEY
    )
    === "done"
  ) {
    return;
  }


  const localTasks =
    getOldLocalTasks();


  if (
    localTasks.length === 0
  ) {

    localStorage.setItem(
      MIGRATION_KEY,
      "done"
    );

    return;

  }


  const {
    count,
    error
  } =
    await supabaseClient
      .from(
        "reminders"
      )
      .select(
        "*",
        {
          count: "exact",
          head: true
        }
      );


  if (
    error
  ) {
    return;
  }


  if (
    count > 0
  ) {

    localStorage.setItem(
      MIGRATION_KEY,
      "done"
    );

    return;

  }


  const payload =
    localTasks
      .map(
        normalizeOldTask
      )
      .map(
        task =>
          taskToDbPayload(
            task
          )
      );


  const {
    error:
      insertError
  } =
    await supabaseClient
      .from(
        "reminders"
      )
      .insert(
        payload
      );


  if (
    insertError
  ) {

    console.error(
      insertError
    );

    return;

  }


  localStorage.setItem(
    MIGRATION_KEY,
    "done"
  );


  showToast(
    "Tus recordatorios locales se sincronizaron ☁️"
  );

}


// ========================================
// FECHAS
// ========================================

function normalizeTime(
  value
) {

  if (
    !value
  ) {
    return "";
  }


  return value
    .slice(
      0,
      5
    );

}


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
    dateString
    === today
  ) {
    return "Hoy";
  }


  if (
    dateString
    === tomorrow
  ) {
    return "Mañana";
  }


  return new Intl
    .DateTimeFormat(
      "es-PY",
      {
        weekday: "short",
        day: "numeric",
        month: "short"
      }
    )
    .format(
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
    new Intl
      .DateTimeFormat(
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
        char =>
          char.toUpperCase()
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
    &&
    task.repeat.type
    &&
    task.repeat.type
    !== "none"
  );

}


function matchesRepeatRule(
  task,
  dateString
) {

  if (
    dateString
    < task.date
  ) {
    return false;
  }


  if (
    task.repeat?.endDate
    &&
    dateString
    > task.repeat.endDate
  ) {
    return false;
  }


  const weekday =
    dateFromString(
      dateString
    ).getDay();


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
      &&
      weekday <= 5
    );

  }


  if (
    type === "weekends"
  ) {

    return (
      weekday === 0
      ||
      weekday === 6
    );

  }


  if (
    type === "weekly"
  ) {

    return (
      weekday
      ===
      dateFromString(
        task.date
      ).getDay()
    );

  }


  if (
    type === "custom"
  ) {

    return (
      task.repeat?.days
      || []
    ).includes(
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

  const occurrences =
    [];


  for (
    let offset = 1;
    offset <= daysAhead;
    offset++
  ) {

    const dateString =
      getLocalDateString(
        addDays(
          new Date(),
          offset
        )
      );


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


  return occurrences
    .sort(
      sortOccurrences
    );

}


function getCompletedOccurrences() {

  const occurrences =
    [];


  for (
    const task
    of tasks
  ) {

    if (
      isRecurring(task)
    ) {

      for (
        const dateString
        of (
          task.completedDates
          || []
        )
      ) {

        occurrences.push({

          task,

          occurrenceDate:
            dateString,

          completed:
            true

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

        completed:
          true

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

    return a.occurrenceDate
      .localeCompare(
        b.occurrenceDate
      );

  }


  const priorityScore = {
    important: 0,
    normal: 1
  };


  const difference =
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
    difference !== 0
  ) {
    return difference;
  }


  return (
    a.task.time
    || "99:99"
  ).localeCompare(
    b.task.time
    || "99:99"
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
      || []
    )
      .map(
        day =>
          names[day]
      )
      .join(" · ");

  }


  return "";

}


// ========================================
// RENDER
// ========================================

function getVisibleOccurrences() {

  if (
    currentView
    === "today"
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
      currentView
      !== "today"
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
                ?? 0
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


    els.taskList
      .appendChild(
        item
      );

  }


  els.emptyState
    .classList
    .toggle(
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
// MODAL / FORM
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


  const repeating =
    repeatType
    !== "none";


  els.customRepeatBox
    .classList
    .toggle(
      "hidden",
      repeatType
      !== "custom"
    );


  els.repeatEndBox
    .classList
    .toggle(
      "hidden",
      !repeating
    );


  if (
    !repeating
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

  els.modal
    .classList
    .remove(
      "hidden"
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
        ?? 0
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

  }

  else {

    els.modalTitle.textContent =
      "Nuevo recordatorio";


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

  els.modal
    .classList
    .add(
      "hidden"
    );


  els.taskForm.reset();

  els.taskId.value =
    "";

  setCustomDays([]);

}


async function handleSubmit(
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
    repeatType
    === "custom"
    &&
    customDays.length
    === 0
  ) {

    showToast(
      "Elegí al menos un día."
    );

    return;

  }


  const endDate =
    (
      repeatType !== "none"
      &&
      els.repeatHasEnd.checked
    )
      ? els.repeatEndDate.value
      : "";


  if (
    endDate
    &&
    endDate
    < els.taskDate.value
  ) {

    showToast(
      "La fecha final no puede ser anterior al inicio."
    );

    return;

  }


  const existingTask =
    tasks.find(
      task =>
        task.id
        === els.taskId.value
    );


  const task = {

    id:
      els.taskId.value
      || undefined,

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
        repeatType
        === "custom"
          ? customDays
          : [],

      endDate

    },

    note:
      els.taskNote
        .value
        .trim(),

    completed:
      existingTask?.completed
      || false,

    completedDates:
      existingTask?.completedDates
      || []

  };


  try {

    setSyncStatus(
      "☁️ Guardando..."
    );


    if (
      existingTask
    ) {

      const updated =
        await updateReminder(
          task
        );


      tasks =
        tasks.map(
          item =>
            item.id
            === updated.id
              ? updated
              : item
        );


      showToast(
        "Recordatorio actualizado"
      );

    }

    else {

      const inserted =
        await insertReminder(
          task
        );


      tasks.push(
        inserted
      );


      showToast(
        "Recordatorio guardado"
      );

    }


    closeModal();

    renderTasks();


    setSyncStatus(
      "☁️ Sincronizado"
    );

  }

  catch (
    error
  ) {

    console.error(
      error
    );


    setSyncStatus(
      "⚠️ Error de sincronización"
    );


    showToast(
      "No se pudo guardar el recordatorio."
    );

  }

}


// ========================================
// ACCIONES TAREA
// ========================================

async function handleTaskClick(
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


  const task =
    tasks.find(
      item =>
        item.id
        === button.dataset.id
    );


  if (
    !task
  ) {
    return;
  }


  const action =
    button.dataset.action;


  const occurrenceDate =
    button.dataset.date;


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

    const confirmed =
      window.confirm(
        isRecurring(task)
          ? `¿Eliminar "${task.title}" y todas sus repeticiones?`
          : `¿Eliminar "${task.title}"?`
      );


    if (
      !confirmed
    ) {
      return;
    }


    try {

      setSyncStatus(
        "☁️ Eliminando..."
      );


      await deleteReminder(
        task.id
      );


      tasks =
        tasks.filter(
          item =>
            item.id
            !== task.id
        );


      renderTasks();


      setSyncStatus(
        "☁️ Sincronizado"
      );


      showToast(
        "Recordatorio eliminado"
      );

    }

    catch (
      error
    ) {

      console.error(
        error
      );


      showToast(
        "No se pudo eliminar."
      );

    }


    return;

  }


  if (
    action === "complete"
  ) {

    const copy =
      structuredClone
        ? structuredClone(task)
        : JSON.parse(
            JSON.stringify(task)
          );


    if (
      isRecurring(copy)
    ) {

      copy.completedDates =
        copy.completedDates
        || [];


      const exists =
        copy.completedDates
          .includes(
            occurrenceDate
          );


      copy.completedDates =
        exists
          ? copy.completedDates
              .filter(
                date =>
                  date
                  !== occurrenceDate
              )
          : [
              ...copy.completedDates,
              occurrenceDate
            ];

    }

    else {

      copy.completed =
        !copy.completed;

    }


    try {

      const updated =
        await updateReminder(
          copy
        );


      tasks =
        tasks.map(
          item =>
            item.id
            === updated.id
              ? updated
              : item
        );


      renderTasks();


      showToast(
        "Tarea actualizada ✓"
      );

    }

    catch (
      error
    ) {

      console.error(
        error
      );


      showToast(
        "No se pudo actualizar."
      );

    }

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


  const headings = {
    today: "Recordatorios de hoy",
    upcoming: "Próximos recordatorios",
    completed: "Completados"
  };


  if (els.viewHeading) {
    els.viewHeading.textContent =
      headings[view] || "Recordatorios";
  }


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
// CHECKLIST LOCAL
// ========================================

function loadChecklist() {

  const today =
    getLocalDateString();


  let saved = {
    date: today,
    values: {}
  };


  try {

    saved =
      JSON.parse(
        localStorage.getItem(
          CHECKLIST_KEY
        )
      )
      || saved;

  }

  catch {
    // ignorar
  }


  const values =
    saved.date
    === today
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

  const values = {};


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


  localStorage.setItem(
    CHECKLIST_KEY,
    JSON.stringify({
      date:
        getLocalDateString(),
      values
    })
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
// NOTIFICACIONES LOCALES
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
    minutes === 60
  ) {
    return "1 h antes";
  }


  if (
    minutes === 1440
  ) {
    return "1 día antes";
  }


  return `${minutes} min antes`;

}


async function requestNotificationPermission() {

  if (
    !("Notification" in window)
    || !("serviceWorker" in navigator)
    || !("PushManager" in window)
  ) {

    showToast(
      "Este dispositivo no admite Web Push."
    );

    return;

  }


  const permission =
    await Notification
      .requestPermission();


  if (
    permission !== "granted"
  ) {

    showToast(
      "No se concedió permiso."
    );

    return;

  }


  try {

    showToast(
      "Activando notificaciones..."
    );


    const registration =
      await navigator
        .serviceWorker
        .ready;


    let subscription =
      await registration
        .pushManager
        .getSubscription();


    if (
      !subscription
    ) {

      subscription =
        await registration
          .pushManager
          .subscribe({
            userVisibleOnly: true,
            applicationServerKey:
              urlBase64ToUint8Array(
                CONFIG.VAPID_PUBLIC_KEY
              )
          });

    }


    const json =
      subscription.toJSON();


    const {
      error
    } =
      await supabaseClient
        .from(
          "push_subscriptions"
        )
        .upsert(
          {
            user_id:
              currentUser.id,

            endpoint:
              json.endpoint,

            p256dh:
              json.keys.p256dh,

            auth:
              json.keys.auth
          },
          {
            onConflict:
              "endpoint"
          }
        );


    if (
      error
    ) {
      throw error;
    }


    showToast(
      "Notificaciones Push activadas 🔔"
    );

  }

  catch (
    error
  ) {

    console.error(
      error
    );


    showToast(
      "No se pudo registrar este iPhone."
    );

  }

}


function urlBase64ToUint8Array(
  base64String
) {

  const padding =
    "=".repeat(
      (4 - base64String.length % 4)
      % 4
    );


  const base64 =
    (
      base64String
      + padding
    )
      .replace(
        /-/g,
        "+"
      )
      .replace(
        /_/g,
        "/"
      );


  const rawData =
    window.atob(
      base64
    );


  return Uint8Array.from(
    [...rawData].map(
      character =>
        character.charCodeAt(0)
    )
  );

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
        error =>
          console.warn(
            error
          )
      );

  }

}


// ========================================
// UTILIDADES
// ========================================

function setSyncStatus(
  text
) {

  els.syncStatus.textContent =
    text;

}


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

els.loginForm
  .addEventListener(
    "submit",
    handleLogin
  );


els.accountButton
  .addEventListener(
    "click",
    logout
  );


if (els.navAccount) {
  els.navAccount
    .addEventListener(
      "click",
      logout
    );
}


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


// ========================================
// INICIO
// ========================================

initializeAuth();
