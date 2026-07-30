const STORAGE_KEY = "vla-hud-v1";

const modes = {
  "Long Workday": {
    tasks: [
      ["EARN", "Cybersecurity — 45–60 minutes"],
      ["TRAIN", "Mobility, walk, or short conditioning"],
      ["CREATE", "Optional music, stream, or art"],
      ["LEARN", "10–20 minutes of reading or language"],
      ["LIVE", "Game, girlfriend, family, or recovery"]
    ]
  },
  "Short Workday": {
    tasks: [
      ["EARN", "Cybersecurity — 75–90 minutes"],
      ["TRAIN", "Full training session"],
      ["CREATE", "Music or stream — 45–90 minutes"],
      ["LEARN", "Optional reading, language, or film notes"],
      ["LIVE", "Game, girlfriend, or family"]
    ]
  },
  "Recovery Day": {
    tasks: [
      ["RESET", "Laundry, room, meals, and weekly planning"],
      ["EARN", "Cybersecurity — 60 minute minimum"],
      ["TRAIN", "Mobility, walking, or easy technique"],
      ["CREATE", "Optional music or stream"],
      ["LIVE", "Game, girlfriend, family, or movie"]
    ]
  },
  "Growth Day": {
    tasks: [
      ["EARN", "Cybersecurity — 2–3 focused hours"],
      ["TRAIN", "Full combat-athlete session"],
      ["CREATE", "Music or stream — 2 hours"],
      ["LEARN", "Language, reading, or film analysis"],
      ["LIVE", "Gaming, cars, fashion, date, or family"]
    ]
  },
  "Open Day": {
    tasks: [
      ["LIVE", "Enjoy the life being built"],
      ["TRAIN", "Optional movement or recovery"],
      ["CREATE", "Optional music, stream, or art"],
      ["LEARN", "Movie, anime, reading, or language"],
      ["PLAY", "Game without turning it into work"]
    ]
  }
};

const workouts = [
  { day: 0, title: "Recovery + Mobility", tag: "Recovery", items: ["30–45 min walk", "Hip mobility", "Shoulder mobility", "Foam rolling", "Light core"] },
  { day: 1, title: "Upper Body Strength", tag: "Strength", items: ["Bench press", "Weighted pull-ups", "Overhead press", "Barbell row", "Farmer carries", "Neck + core"] },
  { day: 2, title: "Boxing", tag: "Combat", items: ["Jump rope", "Footwork", "Shadowboxing", "Heavy bag", "Double-end bag", "Sprints"] },
  { day: 3, title: "Lower Body Strength", tag: "Strength", items: ["Squats", "Romanian deadlifts", "Bulgarian split squats", "Lunges", "Calves", "Core"] },
  { day: 4, title: "Wrestling / BJJ", tag: "Combat", items: ["Sprawls", "Shot entries", "Clinch work", "Carries", "Grip training", "Crawls"] },
  { day: 5, title: "Athletic Conditioning", tag: "Conditioning", items: ["Assault bike", "Hill sprints", "Sled pushes", "Kettlebell swings", "Battle ropes"] },
  { day: 6, title: "Combat Integration", tag: "Mixed", items: ["Boxing rounds", "Bodyweight circuit", "Grip work", "Neck work", "Carries", "Mobility cooldown"] }
];

const defaults = {
  settings: { defaultMode: "Growth Day", cyberTarget: 12, trainingTarget: 5, creativeTarget: 8, learningTarget: 5 },
  dayKey: "",
  mode: "Growth Day",
  energy: "Standard",
  mission: "",
  nextAction: "",
  tasks: [],
  progress: { Cybersecurity: 0, Training: 0, Creative: 0, Learning: 0 },
  weekKey: "",
  inbox: []
};

let state = loadState();

function loadState() {
  try { return { ...structuredClone(defaults), ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; }
  catch { return structuredClone(defaults); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function todayKey() { return new Date().toISOString().slice(0,10); }
function weekKey() {
  const d = new Date();
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return `${date.getUTCFullYear()}-W${Math.ceil((((date-yearStart)/86400000)+1)/7)}`;
}
function freshTasks(mode) { return modes[mode].tasks.map(([lane,text], i) => ({ id: `${Date.now()}-${i}`, lane, text, done:false })); }

function rollover() {
  const t = todayKey();
  const w = weekKey();
  if (state.weekKey !== w) { state.weekKey = w; state.progress = { Cybersecurity:0, Training:0, Creative:0, Learning:0 }; }
  if (state.dayKey !== t) {
    state.dayKey = t;
    state.mode = state.settings.defaultMode;
    state.energy = "Standard";
    state.mission = "";
    state.nextAction = "";
    state.tasks = freshTasks(state.mode);
  }
  if (!state.tasks?.length) state.tasks = freshTasks(state.mode);
  saveState();
}

function render() {
  rollover();
  const now = new Date();
  document.getElementById("dateLabel").textContent = now.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});
  document.getElementById("modeLabel").textContent = state.mode;
  document.getElementById("energySelect").value = state.energy;
  document.getElementById("missionInput").value = state.mission;
  document.getElementById("nextActionInput").value = state.nextAction;
  renderTasks();
  renderWorkout();
  renderProgress();
  document.getElementById("captureCount").textContent = `${state.inbox.length} item${state.inbox.length === 1 ? "" : "s"} saved in inbox`;
}

function renderTasks() {
  const list = document.getElementById("taskList");
  const template = document.getElementById("taskTemplate");
  list.innerHTML = "";
  state.tasks.forEach(task => {
    const node = template.content.cloneNode(true);
    const check = node.querySelector("input");
    check.checked = task.done;
    check.addEventListener("change", () => { task.done = check.checked; saveState(); renderProgress(); });
    node.querySelector("strong").textContent = task.lane;
    node.querySelector("small").textContent = task.text;
    node.querySelector(".delete-task").addEventListener("click", () => { state.tasks = state.tasks.filter(t => t.id !== task.id); saveState(); renderTasks(); });
    list.appendChild(node);
  });
}

function renderWorkout() {
  const workout = workouts.find(w => w.day === new Date().getDay());
  document.getElementById("workoutTitle").textContent = workout.title;
  document.getElementById("workoutTag").textContent = workout.tag;
  const list = document.getElementById("workoutList");
  list.innerHTML = workout.items.map(item => `<div class="workout-item">${item}</div>`).join("");
}

function progressTargets() {
  return {
    Cybersecurity: state.settings.cyberTarget,
    Training: state.settings.trainingTarget,
    Creative: state.settings.creativeTarget,
    Learning: state.settings.learningTarget
  };
}
function renderProgress() {
  const list = document.getElementById("progressList");
  const targets = progressTargets();
  list.innerHTML = "";
  Object.keys(targets).forEach(name => {
    const current = Number(state.progress[name] || 0);
    const target = Number(targets[name]);
    const pct = Math.min(100, Math.round((current/target)*100));
    const row = document.createElement("div");
    row.className = "progress-row";
    row.innerHTML = `<div class="progress-top"><strong>${name}</strong><span>${current}/${target}</span></div><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div><div class="progress-controls"><button data-delta="-1">−</button><button data-delta="1">+</button></div>`;
    row.querySelectorAll("button").forEach(btn => btn.addEventListener("click", () => {
      state.progress[name] = Math.max(0, current + Number(btn.dataset.delta));
      saveState(); renderProgress();
    }));
    list.appendChild(row);
  });
}

function openModeDialog() {
  const dialog = document.getElementById("modeDialog");
  const wrap = document.getElementById("modeButtons");
  wrap.innerHTML = "";
  Object.keys(modes).forEach(mode => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.innerHTML = `<strong>${mode}</strong><small>${modes[mode].tasks[0][1]}</small>`;
    btn.addEventListener("click", () => { state.mode = mode; state.tasks = freshTasks(mode); saveState(); dialog.close(); render(); });
    wrap.appendChild(btn);
  });
  dialog.showModal();
}

document.getElementById("modeLabel").addEventListener("click", openModeDialog);
document.getElementById("energySelect").addEventListener("change", e => { state.energy = e.target.value; saveState(); });
document.getElementById("missionInput").addEventListener("input", e => { state.mission = e.target.value; saveState(); });
document.getElementById("nextActionInput").addEventListener("input", e => { state.nextAction = e.target.value; saveState(); });
document.getElementById("resetTodayBtn").addEventListener("click", () => { state.tasks = freshTasks(state.mode); saveState(); renderTasks(); });
document.getElementById("resetWeekBtn").addEventListener("click", () => { state.progress = { Cybersecurity:0, Training:0, Creative:0, Learning:0 }; saveState(); renderProgress(); });
document.getElementById("addTaskBtn").addEventListener("click", () => {
  const lane = prompt("Lane name (Earn, Train, Create, Learn, Live):", "LIVE");
  if (!lane) return;
  const text = prompt("Task:");
  if (!text) return;
  state.tasks.push({ id:String(Date.now()), lane:lane.toUpperCase(), text, done:false }); saveState(); renderTasks();
});
document.getElementById("saveCaptureBtn").addEventListener("click", () => {
  const input = document.getElementById("captureInput");
  const text = input.value.trim();
  if (!text) return;
  state.inbox.unshift({ text, createdAt:new Date().toISOString() });
  input.value = ""; saveState(); render();
});

document.getElementById("settingsBtn").addEventListener("click", () => {
  document.getElementById("defaultModeSelect").value = state.settings.defaultMode;
  document.getElementById("cyberTargetInput").value = state.settings.cyberTarget;
  document.getElementById("trainingTargetInput").value = state.settings.trainingTarget;
  document.getElementById("creativeTargetInput").value = state.settings.creativeTarget;
  document.getElementById("learningTargetInput").value = state.settings.learningTarget;
  document.getElementById("settingsDialog").showModal();
});
document.getElementById("saveSettingsBtn").addEventListener("click", () => {
  state.settings = {
    defaultMode: document.getElementById("defaultModeSelect").value,
    cyberTarget: Number(document.getElementById("cyberTargetInput").value),
    trainingTarget: Number(document.getElementById("trainingTargetInput").value),
    creativeTarget: Number(document.getElementById("creativeTargetInput").value),
    learningTarget: Number(document.getElementById("learningTargetInput").value)
  };
  saveState(); render();
});

document.querySelectorAll(".nav-item").forEach(btn => btn.addEventListener("click", () => {
  document.querySelectorAll(".nav-item").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  const view = btn.dataset.view;
  if (view === "today") window.scrollTo({top:0, behavior:"smooth"});
  if (view === "schedule") openModeDialog();
  if (view === "progress") document.querySelector(".progress-list").scrollIntoView({behavior:"smooth"});
  if (view === "hq") alert(`HQ inbox: ${state.inbox.length} saved item(s).\n\nA later version can add full pages for music, cars, fashion, reading, film, languages, and cybersecurity.`);
}));

if ("serviceWorker" in navigator) navigator.serviceWorker.register("service-worker.js");
render();
