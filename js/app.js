/**
 * SeoulTech Student Hub – Week 3
 * Vanilla JS + DOM manipulation + form events.
 * Data is stored in memory only for this milestone.
 * Persistence with Web Storage is planned for Week 4.
 */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const KEY = "seoultech-hub-week4-v1";
  let storageAvailable = true;
  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      console.warn("저장 데이터를 읽을 수 없습니다.", error);
      return {};
    }
  }
  const saved = loadState();
  const validText = value => typeof value === "string" && value.trim().length > 0;
  const validDate = value => typeof value === "string" && /^\\d{4}-\\d{2}-\\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + "T00:00:00"));
  const classes = Array.isArray(saved.classes) ? saved.classes.filter(x => x && Number.isInteger(x.id) && validText(x.subject) && Number.isInteger(x.day) && x.day >= 0 && x.day <= 6 && /^\\d{2}:\\d{2}$/.test(x.start) && /^\\d{2}:\\d{2}$/.test(x.end) && x.start < x.end) : [];
  const tasks = Array.isArray(saved.tasks) ? saved.tasks.filter(x => x && Number.isInteger(x.id) && validText(x.title) && validText(x.subject) && validDate(x.due) && typeof x.done === "boolean") : [];
  const sessions = Array.isArray(saved.sessions) ? saved.sessions.filter(x => x && Number.isInteger(x.id) && validText(x.subject) && validDate(x.date) && Number.isInteger(x.minutes) && x.minutes >= 1 && x.minutes <= 1440) : [];
  let nextId = Math.max(0, ...[...classes,...tasks,...sessions].map(x => x.id)) + 1;
  function saveState() {
    try {
      localStorage.setItem(KEY, JSON.stringify({ classes, tasks, sessions }));
      storageAvailable = true;
    } catch (error) {
      console.warn("데이터를 저장할 수 없습니다.", error);
      storageAvailable = false;
      const note = document.querySelector("#storage-notice");
      if (note) note.textContent = "브라우저 저장소에 데이터를 저장할 수 없습니다. 새로고침 시 내용이 사라질 수 있습니다.";
    }
  }

  const classForm = document.querySelector("#class-form");
  const taskForm = document.querySelector("#task-form");
  const classList = document.querySelector("#class-list");
  const taskList = document.querySelector("#task-list");
  const classCount = document.querySelector("#class-count");
  const taskCount = document.querySelector("#task-count");

  const weekday = ["일", "월", "화", "수", "목", "금", "토"];
  const newId = () => nextId++;
  const make = (tag, className, value) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (value !== undefined) node.textContent = value;
    return node;
  };

  function navigate() {
    const hash = window.location.hash || "#dashboard";
    const active = document.querySelector('.main-nav a[href="' + CSS.escape(hash) + '"]');
    document.querySelectorAll(".main-nav a").forEach(link => {
      const selected = link === active;
      link.classList.toggle("active", selected);
      if (selected) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    const target = document.getElementById(hash.slice(1));
    if (target && hash !== "#dashboard") target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  window.addEventListener("hashchange", navigate);
  navigate();

  function emptyList(list, message) {
    list.replaceChildren(make("li", "list-empty", message));
  }
  function actionButton(label, action, id) {
    const button = make("button", "action-button", label);
    button.type = "button";
    button.dataset.action = action;
    button.dataset.id = String(id);
    return button;
  }
  function renderClasses() {
    classCount.textContent = String(classes.length);
    classList.replaceChildren();
    if (!classes.length) return emptyList(classList, "아직 등록된 수업이 없습니다.");
    const sorted = [...classes].sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));
    for (const item of sorted) {
      const li = make("li", "item-row");
      const detail = make("div", "item-detail");
      detail.append(
        make("strong", "", item.subject),
        make("small", "", weekday[item.day] + "요일 · " + item.start + "–" + item.end)
      );
      const actions = make("div", "item-actions");
      actions.append(actionButton("삭제", "delete-class", item.id));
      li.append(detail, actions);
      classList.append(li);
    }
  }
  function formatDue(value) {
    const [year, month, day] = value.split("-");
    return year + "." + month + "." + day;
  }
  function renderTasks() {
    taskCount.textContent = String(tasks.filter(item => !item.done).length);
    taskList.replaceChildren();
    if (!tasks.length) return emptyList(taskList, "등록된 과제가 없습니다.");
    const sorted = [...tasks].sort((a, b) => Number(a.done) - Number(b.done) || a.due.localeCompare(b.due));
    for (const item of sorted) {
      const li = make("li", "item-row" + (item.done ? " item-done" : ""));
      const detail = make("div", "item-detail");
      detail.append(
        make("strong", "", item.title),
        make("small", "", item.subject + " · 마감 " + formatDue(item.due))
      );
      const actions = make("div", "item-actions");
      actions.append(
        actionButton(item.done ? "취소" : "완료", "toggle-task", item.id),
        actionButton("삭제", "delete-task", item.id)
      );
      li.append(detail, actions);
      taskList.append(li);
    }
  }

  classForm.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(classForm);
    const subject = String(data.get("subject") || "").trim();
    const day = Number(data.get("day"));
    const start = String(data.get("start") || "");
    const end = String(data.get("end") || "");
    const feedback = document.querySelector("#class-feedback");
    if (!subject || !start || !end || !Number.isInteger(day) || day < 0 || day > 6) {
      feedback.textContent = "모든 정보를 입력해 주세요.";
      return;
    }
    if (start >= end) {
      feedback.textContent = "종료 시간은 시작 시간보다 늦어야 합니다.";
      return;
    }
    if (classes.some(item => item.day === day && start < item.end && end > item.start)) {
      feedback.textContent = "같은 요일에 시간이 겹치는 수업이 있습니다.";
      return;
    }
    classes.push({ id: newId(), subject, day, start, end });
    classForm.reset();
    feedback.textContent = "";
    saveState();
    renderClasses();
  });

  taskForm.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(taskForm);
    const title = String(data.get("title") || "").trim();
    const subject = String(data.get("subject") || "").trim();
    const due = String(data.get("due") || "");
    const feedback = document.querySelector("#task-feedback");
    if (!title || !subject || !/^\d{4}-\d{2}-\d{2}$/.test(due)) {
      feedback.textContent = "과제명, 과목명, 제출 마감일을 확인해 주세요.";
      return;
    }
    tasks.push({ id: newId(), title, subject, due, done: false });
    taskForm.reset();
    feedback.textContent = "";
    saveState();
    renderTasks();
  });

  classList.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button || button.dataset.action !== "delete-class") return;
    const index = classes.findIndex(item => item.id === Number(button.dataset.id));
    if (index !== -1) classes.splice(index, 1);
    saveState();
    renderClasses();
  });

  taskList.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const index = tasks.findIndex(item => item.id === Number(button.dataset.id));
    if (index < 0) return;
    if (button.dataset.action === "delete-task") tasks.splice(index, 1);
    if (button.dataset.action === "toggle-task") tasks[index].done = !tasks[index].done;
    saveState();
    renderTasks();
  });

  renderClasses();
  renderTasks();

  // Week 4: study records, stored locally and summarized by calendar week.
  const studyForm = document.querySelector("#study-form");
  const studyList = document.querySelector("#study-list");
  const dateInput = studyForm.elements.namedItem("date");
  function localDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
  }
  dateInput.value = localDateString(new Date());

  function weekStart(date) {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    start.setDate(start.getDate() - (start.getDay() + 6) % 7);
    return start;
  }
  function renderStudies() {
    studyList.replaceChildren();
    if (!sessions.length) emptyList(studyList, "등록된 학습 기록이 없습니다.");
    const sorted = [...sessions].sort((a,b) => b.date.localeCompare(a.date) || b.id - a.id);
    for (const item of sorted) {
      const li = make("li","item-row");
      const detail = make("div","item-detail");
      detail.append(make("strong","",item.subject),make("small","",item.date + " · " + item.minutes + "분"));
      const actions = make("div","item-actions");
      actions.append(actionButton("삭제","delete-study",item.id));
      li.append(detail,actions);
      studyList.append(li);
    }
    const monday = weekStart(new Date());
    const start = localDateString(monday);
    const next = new Date(monday);
    next.setDate(next.getDate()+7);
    const end = localDateString(next);
    const weekly = sessions.filter(x => x.date >= start && x.date < end);
    const totalMinutes = weekly.reduce((sum,x) => sum+x.minutes,0);
    const hours = (totalMinutes/60).toFixed(1).replace(/\\.0$/,"");
    document.querySelector("#study-hours").textContent = hours;
    document.querySelector("#weekly-study").replaceChildren(document.createTextNode(hours), make("small","","시간"));
    const days = Array.from({length:7},(_,index)=>{
      const date = new Date(monday); date.setDate(date.getDate()+index);
      const key = localDateString(date);
      return weekly.filter(x=>x.date===key).reduce((sum,x)=>sum+x.minutes,0);
    });
    const peak = Math.max(1,...days);
    document.querySelectorAll("#week-bars span").forEach((bar,index)=>{
      bar.style.height = Math.max(8,Math.round(days[index]/peak*45))+"px";
      bar.title = days[index]+"분";
    });
  }

  studyForm.addEventListener("submit",event=>{
    event.preventDefault();
    const data = new FormData(studyForm);
    const subject = String(data.get("subject")||"").trim();
    const date = String(data.get("date")||"");
    const minutes = Number(data.get("minutes"));
    const feedback = document.querySelector("#study-feedback");
    if (!subject || !validDate(date) || !Number.isInteger(minutes) || minutes<1 || minutes>1440) {
      feedback.textContent = "과목, 날짜 및 1~1440분의 학습 시간을 확인해 주세요.";
      return;
    }
    sessions.push({id:newId(),subject,date,minutes});
    saveState();
    studyForm.reset();
    dateInput.value = localDateString(new Date());
    feedback.textContent = "";
    renderStudies();
  });

  studyList.addEventListener("click",event=>{
    const button = event.target.closest("button[data-action]");
    if (!button || button.dataset.action !== "delete-study") return;
    const index = sessions.findIndex(x=>x.id===Number(button.dataset.id));
    if (index===-1) return;
    sessions.splice(index,1);
    saveState();
    renderStudies();
  });

  // Public weather data: Seoul coordinates, without an API key.
  async function fetchWeather() {
    const value = document.querySelector("#weather-value");
    const description = document.querySelector("#weather-description");
    value.textContent = "조회 중...";
    description.textContent = "날씨 정보를 불러오고 있습니다.";
    const url = "https://api.open-meteo.com/v1/forecast?latitude=37.5665&longitude=126.9780&current=temperature_2m,relative_humidity_2m,weather_code&timezone=Asia%2FSeoul";
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("HTTP " + response.status);
      const result = await response.json();
      const current = result.current;
      if (!current || !Number.isFinite(current.temperature_2m)) throw new Error("Invalid weather data");
      const weatherMap = {0:"맑음",1:"대체로 맑음",2:"구름 조금",3:"흐림",45:"안개",48:"안개",51:"이슬비",53:"이슬비",55:"이슬비",61:"비",63:"비",65:"강한 비",71:"눈",73:"눈",75:"강한 눈",80:"소나기",81:"소나기",82:"강한 소나기",95:"뇌우"};
      const label = weatherMap[current.weather_code] || "날씨 정보";
      value.textContent = current.temperature_2m + "°C · " + label;
      description.textContent = "습도 " + current.relative_humidity_2m + "% · 관측 기준 " + (current.time || "정보 없음");
    } catch (error) {
      console.warn("날씨 정보를 불러오지 못했습니다.",error);
      value.textContent = "조회 실패";
      description.textContent = "네트워크 상태를 확인하고 다시 시도해 주세요.";
    }
  }
  document.querySelector("#weather-refresh").addEventListener("click",fetchWeather);
  fetchWeather();
  renderStudies();

});
