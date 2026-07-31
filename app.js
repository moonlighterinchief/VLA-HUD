const STORAGE_KEY = "vla-hud-v2";
const OLD_STORAGE_KEY = "vla-hud-v1";
const DAY_MS = 86400000;
const CYCLE = ["W","W","W","W","W","W","O","O","W","W","W","W","W","W","W","W","W","O","O","O","O"];

const modeTemplates = {
  Workday: [
    ["EARN","Cybersecurity — 45–60 focused minutes"],
    ["TRAIN","Scheduled session, abbreviated if needed"],
    ["CREATE","Optional music, stream, or art"],
    ["LEARN","10–20 minutes of reading or language"],
    ["LIVE","Game, girlfriend, family, or recovery"]
  ],
  "Recovery Day": [
    ["RESET","Laundry, meals, environment, and planning"],
    ["EARN","Cybersecurity — 60 minute minimum"],
    ["TRAIN","Mobility, walking, or easy technique"],
    ["CREATE","Optional music or stream"],
    ["LIVE","Game, girlfriend, family, or movie"]
  ],
  "Growth Day": [
    ["EARN","Cybersecurity — 2–3 focused hours"],
    ["TRAIN","Full combat-athlete session"],
    ["CREATE","Music or stream — 90–120 minutes"],
    ["LEARN","Language, reading, art, or film analysis"],
    ["LIVE","Gaming, cars, fashion, date, or family"]
  ],
  "Open Day": [
    ["LIVE","Enjoy the life being built"],
    ["TRAIN","Optional movement or recovery"],
    ["CREATE","Optional music, stream, or art"],
    ["LEARN","Movie, anime, reading, or language"],
    ["PLAY","Game without turning it into work"]
  ],
  Vacation: [
    ["ITINERARY","Complete today’s planned experiences"],
    ["EARN","Optional or reduced cybersecurity"],
    ["TRAIN","Light workout, mobility, walking, or rest"],
    ["CREATE","Optional music, photography, notes, or stream"],
    ["LIVE","Gaming, exploration, girlfriend/family, or rest"]
  ]
};

const workouts = [
  {day:0,title:"Recovery + Mobility",tag:"Recovery",items:["30–45 min walk","Hip mobility","Shoulder mobility","Foam rolling","Light core"]},
  {day:1,title:"Upper Body Strength",tag:"Strength",items:["Bench press","Weighted pull-ups","Overhead press","Barbell row","Farmer carries","Neck + core"]},
  {day:2,title:"Boxing",tag:"Combat",items:["Jump rope","Footwork","Shadowboxing","Heavy bag","Double-end bag","Sprints"]},
  {day:3,title:"Lower Body Strength",tag:"Strength",items:["Squats","Romanian deadlifts","Bulgarian split squats","Lunges","Calves","Core"]},
  {day:4,title:"Wrestling / BJJ",tag:"Combat",items:["Sprawls","Shot entries","Clinch work","Carries","Grip training","Crawls"]},
  {day:5,title:"Athletic Conditioning",tag:"Conditioning",items:["Assault bike","Hill sprints","Sled pushes","Kettlebell swings","Battle ropes"]},
  {day:6,title:"Combat Integration",tag:"Mixed",items:["Boxing rounds","Bodyweight circuit","Grip work","Neck work","Carries","Mobility cooldown"]}
];

const defaults = {
  version:"0.2.0",
  settings:{anchorDate:"2026-07-29",vacationStart:"2026-08-07",vacationEnd:"2026-08-13",cyberTarget:12,trainingTarget:5,creativeTarget:8,learningTarget:5},
  dayKey:"",weekKey:"",energy:"Standard",mission:"",nextAction:"",modeOverride:"",dailyTasks:[],
  progress:{Cybersecurity:0,Training:0,Creative:0,Learning:0},
  generalTasks:[],inbox:[],activeTaskTab:"todo"
};

let state = loadState();

function clone(v){return JSON.parse(JSON.stringify(v));}
function loadState(){
  try{
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEY)||"null");
    if(existing) return deepMerge(clone(defaults),existing);
    const old = JSON.parse(localStorage.getItem(OLD_STORAGE_KEY)||"null");
    if(old){
      const migrated=clone(defaults);
      migrated.energy=old.energy||"Standard"; migrated.mission=old.mission||""; migrated.nextAction=old.nextAction||"";
      migrated.progress=old.progress||migrated.progress; migrated.inbox=old.inbox||[];
      if(old.settings){migrated.settings.cyberTarget=old.settings.cyberTarget||12;migrated.settings.trainingTarget=old.settings.trainingTarget||5;migrated.settings.creativeTarget=old.settings.creativeTarget||8;migrated.settings.learningTarget=old.settings.learningTarget||5;}
      return migrated;
    }
  }catch(e){console.warn("State load failed",e)}
  return clone(defaults);
}
function deepMerge(base,extra){Object.keys(extra||{}).forEach(k=>{if(extra[k]&&typeof extra[k]==="object"&&!Array.isArray(extra[k])&&base[k]&&typeof base[k]==="object"&&!Array.isArray(base[k]))base[k]=deepMerge(base[k],extra[k]);else base[k]=extra[k];});return base;}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function parseDate(s){const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d);}
function dateKey(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function diffDays(a,b){return Math.round((new Date(a.getFullYear(),a.getMonth(),a.getDate())-new Date(b.getFullYear(),b.getMonth(),b.getDate()))/DAY_MS);}
function cycleInfo(d=new Date()){
  const anchor=parseDate(state.settings.anchorDate); const offset=((diffDays(d,anchor)%21)+21)%21; const marker=CYCLE[offset];
  let phase=""; if(offset<=5)phase="Six-Day Work Block";else if(offset<=7)phase="Two-Day Break";else if(offset<=16)phase="Nine-Day Work Block";else phase="Four-Day Break";
  return {day:offset+1,index:offset,marker,phase};
}
function isVacation(d=new Date()){const k=dateKey(d);return k>=state.settings.vacationStart&&k<=state.settings.vacationEnd;}
function vacationInfo(d=new Date()){if(!isVacation(d))return null;const start=parseDate(state.settings.vacationStart);const end=parseDate(state.settings.vacationEnd);return {day:diffDays(d,start)+1,total:diffDays(end,start)+1};}
function daysUntilVacation(d=new Date()){return diffDays(parseDate(state.settings.vacationStart),d);}
function daysUntilOff(d=new Date()){
  for(let i=0;i<22;i++){const test=new Date(d);test.setDate(test.getDate()+i);if(cycleInfo(test).marker==="O")return i;}return null;
}
function automaticMode(d=new Date()){
  if(isVacation(d))return "Vacation";
  const info=cycleInfo(d);
  if(info.marker==="W")return "Workday";
  const previous=new Date(d);previous.setDate(previous.getDate()-1);
  const next=new Date(d);next.setDate(next.getDate()+1);
  if(cycleInfo(previous).marker==="W")return "Recovery Day";
  if(cycleInfo(next).marker==="W")return "Open Day";
  return "Growth Day";
}
function currentMode(){return state.modeOverride||automaticMode(new Date());}
function weekKey(){const d=new Date();const utc=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const n=utc.getUTCDay()||7;utc.setUTCDate(utc.getUTCDate()+4-n);const start=new Date(Date.UTC(utc.getUTCFullYear(),0,1));return `${utc.getUTCFullYear()}-W${Math.ceil((((utc-start)/DAY_MS)+1)/7)}`;}
function freshDailyTasks(mode){return modeTemplates[mode].map(([lane,text],i)=>({id:`d-${Date.now()}-${i}`,lane,text,done:false}));}
function rollover(){
  const today=dateKey();const wk=weekKey();
  if(state.weekKey!==wk){state.weekKey=wk;state.progress={Cybersecurity:0,Training:0,Creative:0,Learning:0};}
  if(state.dayKey!==today){state.dayKey=today;state.energy="Standard";state.mission="";state.nextAction="";state.modeOverride="";state.dailyTasks=freshDailyTasks(automaticMode(new Date()));}
  if(!state.dailyTasks.length)state.dailyTasks=freshDailyTasks(currentMode());
  saveState();
}
function fmtDate(d,opts={weekday:"short",month:"short",day:"numeric"}){return d.toLocaleDateString(undefined,opts);}
function escapeHtml(v){return String(v).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));}

function render(){
  rollover(); const now=new Date(); const info=cycleInfo(now); const mode=currentMode();
  byId("dateLabel").textContent=fmtDate(now,{weekday:"long",month:"long",day:"numeric"});
  byId("modeLabel").textContent=mode; byId("energySelect").value=state.energy;byId("missionInput").value=state.mission;byId("nextActionInput").value=state.nextAction;
  byId("cycleSummary").textContent=`Cycle Day ${info.day} of 21 · ${info.marker==="W"?"Underlying workday":"Underlying off day"} · ${info.phase}`;
  renderBanner(now);renderDailyTasks();renderDueToday();renderWorkout(now,mode);renderProgress("progressList");renderProgress("progressListFull");renderSchedule();renderGeneralTasks();renderItineraryToday();renderHQ();
  byId("captureCount").textContent=`${state.inbox.length} item${state.inbox.length===1?"":"s"} saved in inbox`;
}
function byId(id){return document.getElementById(id);}
function renderBanner(now){
  const el=byId("upcomingBanner");const vac=vacationInfo(now);const until=daysUntilVacation(now);
  if(vac){el.innerHTML=`<strong>Vacation day ${vac.day} of ${vac.total}</strong><br><span class="muted">The 21-day work cycle continues underneath this overlay.</span>`;el.classList.remove("hidden");}
  else if(until>=0&&until<=14){el.innerHTML=`<strong>Vacation begins in ${until} day${until===1?"":"s"}</strong><br><span class="muted">August 7–13 · preparation lists are available under Tasks.</span>`;el.classList.remove("hidden");}
  else{const off=daysUntilOff(now);el.innerHTML=`<strong>${off===0?"Off day":"Next off day in "+off+" day"+(off===1?"":"s")}</strong>`;el.classList.remove("hidden");}
}
function renderDailyTasks(){const list=byId("taskList"),tpl=byId("taskTemplate");list.innerHTML="";state.dailyTasks.forEach(task=>{const node=tpl.content.cloneNode(true),check=node.querySelector("input");check.checked=task.done;check.onchange=()=>{task.done=check.checked;saveState();};node.querySelector("strong").textContent=task.lane;node.querySelector("small").textContent=task.text;node.querySelector(".delete-task").onclick=()=>{state.dailyTasks=state.dailyTasks.filter(t=>t.id!==task.id);saveState();renderDailyTasks();};list.appendChild(node);});}
function taskDue(task,nowKey){return !task.done&&task.date&&task.date<=nowKey;}
function renderDueToday(){const items=state.generalTasks.filter(t=>t.category!=="itinerary"&&taskDue(t,dateKey()));const card=byId("dueTodayCard"),list=byId("dueTodayList");if(!items.length){card.classList.add("hidden");return;}card.classList.remove("hidden");byId("dueCount").textContent=String(items.length);list.innerHTML="";items.forEach(t=>list.appendChild(taskNode(t,true)));}
function renderWorkout(now,mode){const workout=workouts.find(w=>w.day===now.getDay());byId("workoutTitle").textContent=workout.title;byId("workoutTag").textContent=workout.tag;byId("workoutNote").textContent=mode==="Vacation"?"Vacation adjustment: reduce volume, prioritize walking, mobility, and recovery.":mode==="Workday"?"Workday adjustment: shorten the session when sleep or recovery would suffer.":"";byId("workoutList").innerHTML=workout.items.map(x=>`<div class="workout-item">${escapeHtml(x)}</div>`).join("");}
function targets(){return {Cybersecurity:state.settings.cyberTarget,Training:state.settings.trainingTarget,Creative:state.settings.creativeTarget,Learning:state.settings.learningTarget};}
function renderProgress(id){const list=byId(id);if(!list)return;list.innerHTML="";Object.entries(targets()).forEach(([name,target])=>{const current=Number(state.progress[name]||0),pct=Math.min(100,Math.round(current/target*100));const row=document.createElement("div");row.className="progress-row";row.innerHTML=`<div class="progress-top"><strong>${name}</strong><span>${current}/${target}</span></div><div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div><div class="progress-controls"><button data-delta="-1">−</button><button data-delta="1">+</button></div>`;row.querySelectorAll("button").forEach(btn=>btn.onclick=()=>{state.progress[name]=Math.max(0,Number(state.progress[name]||0)+Number(btn.dataset.delta));saveState();renderProgress("progressList");renderProgress("progressListFull");});list.appendChild(row);});}
function renderSchedule(){const now=new Date(),info=cycleInfo(now);byId("scheduleHeading").textContent=`Cycle Day ${info.day} · ${info.marker==="W"?"Work":"Off"}`;byId("scheduleSubheading").textContent=`${info.phase}. Anchor: July 29, 2026. Vacation overlays do not alter the cycle.`;const strip=byId("cycleStrip");strip.innerHTML=CYCLE.map((m,i)=>`<div class="cycle-cell ${m==="O"?"off":""} ${i===info.index?"current":""}">${i+1}<br>${m}</div>`).join("");const list=byId("scheduleList");list.innerHTML="";for(let i=0;i<21;i++){const d=new Date(now);d.setDate(d.getDate()+i);const ci=cycleInfo(d),vac=isVacation(d);const row=document.createElement("div");row.className=`schedule-row ${i===0?"today":""}`;row.innerHTML=`<div class="date">${escapeHtml(fmtDate(d,{month:"short",day:"numeric"}))}</div><div><strong>${vac?"Vacation":ci.marker==="W"?"Workday":automaticMode(d)}</strong><small>Cycle day ${ci.day} · ${ci.phase}</small>${vac?'<span class="vacation-pill">VACATION OVERLAY</span>':""}</div><span class="tag">${ci.marker}</span>`;list.appendChild(row);}}
function taskNode(task,compact=false){const tpl=byId("taskTemplate"),node=tpl.content.cloneNode(true),row=node.querySelector(".task-row"),check=node.querySelector("input");row.classList.add(`priority-${task.priority||"standard"}`);check.checked=task.done;check.onchange=()=>{task.done=check.checked;saveState();renderGeneralTasks();renderDueToday();renderItineraryToday();};node.querySelector("strong").textContent=task.text;const details=[task.category.toUpperCase(),task.date?fmtDate(parseDate(task.date),{month:"short",day:"numeric"}):"No date",task.notes].filter(Boolean).join(" · ");node.querySelector("small").textContent=details;node.querySelector(".delete-task").onclick=()=>{state.generalTasks=state.generalTasks.filter(t=>t.id!==task.id);saveState();renderGeneralTasks();renderDueToday();renderItineraryToday();};return node;}
function renderGeneralTasks(){document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===state.activeTaskTab));const labels={todo:"To Do",acquire:"Acquire",packing:"Packing",itinerary:"Itinerary"};byId("taskListHeading").textContent=labels[state.activeTaskTab];const items=state.generalTasks.filter(t=>t.category===state.activeTaskTab).sort((a,b)=>Number(a.done)-Number(b.done)||(a.date||"9999").localeCompare(b.date||"9999"));byId("generalTaskCount").textContent=String(items.length);const list=byId("generalTaskList");list.innerHTML="";if(!items.length){list.innerHTML='<div class="simple-item muted">No items yet.</div>';return;}items.forEach(t=>list.appendChild(taskNode(t)));}
function renderItineraryToday(){const today=dateKey();const items=state.generalTasks.filter(t=>t.category==="itinerary"&&t.date===today&&!t.done);const card=byId("itineraryTodayCard"),list=byId("itineraryTodayList");if(!isVacation(new Date())&&!items.length){card.classList.add("hidden");return;}card.classList.remove("hidden");list.innerHTML=items.length?items.map(t=>`<div class="simple-item"><strong>${escapeHtml(t.text)}</strong>${t.notes?`<div class="muted">${escapeHtml(t.notes)}</div>`:""}</div>`).join(""):'<div class="simple-item muted">No itinerary items added for today.</div>';}
function renderHQ(){const list=byId("hqInbox");list.innerHTML=state.inbox.length?state.inbox.map(i=>`<div class="simple-item">${escapeHtml(i.text)}<div class="muted">${new Date(i.createdAt).toLocaleString()}</div></div>`).join(""):'<div class="simple-item muted">Inbox is empty.</div>';}
function showView(name){document.querySelectorAll(".view").forEach(v=>v.classList.remove("active-view"));byId(`${name}View`).classList.add("active-view");document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===name));window.scrollTo({top:0,behavior:"smooth"});}
function openModeDialog(){const wrap=byId("modeButtons");wrap.innerHTML="";Object.keys(modeTemplates).forEach(mode=>{const b=document.createElement("button");b.type="button";b.innerHTML=`<strong>${mode}</strong><small>${modeTemplates[mode][0][1]}</small>`;b.onclick=()=>{state.modeOverride=mode;state.dailyTasks=freshDailyTasks(mode);saveState();byId("modeDialog").close();render();};wrap.appendChild(b);});byId("modeDialog").showModal();}

byId("modeLabel").onclick=openModeDialog;
byId("energySelect").onchange=e=>{state.energy=e.target.value;saveState();};
byId("missionInput").oninput=e=>{state.mission=e.target.value;saveState();};
byId("nextActionInput").oninput=e=>{state.nextAction=e.target.value;saveState();};
byId("resetTodayBtn").onclick=()=>{state.dailyTasks=freshDailyTasks(currentMode());saveState();renderDailyTasks();};
byId("resetWeekBtn").onclick=()=>{state.progress={Cybersecurity:0,Training:0,Creative:0,Learning:0};saveState();renderProgress("progressList");renderProgress("progressListFull");};
byId("addDailyTaskBtn").onclick=()=>{const lane=prompt("Lane name:","LIVE");if(!lane)return;const text=prompt("Task:");if(!text)return;state.dailyTasks.push({id:`d-${Date.now()}`,lane:lane.toUpperCase(),text,done:false});saveState();renderDailyTasks();};
byId("saveCaptureBtn").onclick=()=>{const input=byId("captureInput"),text=input.value.trim();if(!text)return;state.inbox.unshift({text,createdAt:new Date().toISOString()});input.value="";saveState();renderHQ();byId("captureCount").textContent=`${state.inbox.length} items saved in inbox`;};
byId("addGeneralTaskBtn").onclick=()=>{const text=byId("generalTaskText").value.trim();if(!text)return;state.generalTasks.push({id:`g-${Date.now()}`,category:state.activeTaskTab,text,date:byId("generalTaskDate").value,priority:byId("generalTaskPriority").value,notes:byId("generalTaskNotes").value.trim(),done:false});byId("generalTaskText").value="";byId("generalTaskNotes").value="";saveState();renderGeneralTasks();renderDueToday();renderItineraryToday();};
document.querySelectorAll(".tab").forEach(b=>b.onclick=()=>{state.activeTaskTab=b.dataset.tab;saveState();renderGeneralTasks();});
document.querySelectorAll(".nav-item").forEach(b=>b.onclick=()=>showView(b.dataset.view));
document.querySelectorAll("[data-go]").forEach(b=>b.onclick=()=>showView(b.dataset.go));
byId("todayScheduleBtn").onclick=()=>renderSchedule();
byId("settingsBtn").onclick=()=>{byId("anchorDateInput").value=state.settings.anchorDate;byId("vacationStartInput").value=state.settings.vacationStart;byId("vacationEndInput").value=state.settings.vacationEnd;byId("cyberTargetInput").value=state.settings.cyberTarget;byId("trainingTargetInput").value=state.settings.trainingTarget;byId("creativeTargetInput").value=state.settings.creativeTarget;byId("learningTargetInput").value=state.settings.learningTarget;byId("settingsDialog").showModal();};
byId("saveSettingsBtn").onclick=()=>{state.settings={anchorDate:byId("anchorDateInput").value||"2026-07-29",vacationStart:byId("vacationStartInput").value||"2026-08-07",vacationEnd:byId("vacationEndInput").value||"2026-08-13",cyberTarget:Number(byId("cyberTargetInput").value)||12,trainingTarget:Number(byId("trainingTargetInput").value)||5,creativeTarget:Number(byId("creativeTargetInput").value)||8,learningTarget:Number(byId("learningTargetInput").value)||5};state.modeOverride="";state.dailyTasks=freshDailyTasks(automaticMode(new Date()));saveState();setTimeout(render,0);};
byId("clearOverrideBtn").onclick=()=>{state.modeOverride="";state.dailyTasks=freshDailyTasks(automaticMode(new Date()));saveState();byId("modeDialog").close();render();};
byId("clearInboxBtn").onclick=()=>{if(confirm("Clear every inbox item?")){state.inbox=[];saveState();renderHQ();}};
byId("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`vla-hud-backup-${dateKey()}.json`;a.click();URL.revokeObjectURL(a.href);};
byId("importInput").onchange=e=>{const file=e.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{state=deepMerge(clone(defaults),JSON.parse(reader.result));saveState();render();alert("Backup imported.");}catch{alert("That backup file could not be read.");}};reader.readAsText(file);};

if("serviceWorker" in navigator)navigator.serviceWorker.register("service-worker.js");
render();
