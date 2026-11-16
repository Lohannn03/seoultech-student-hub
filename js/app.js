/**
 * SeoulTech Student Hub – Week 3
 * Vanilla JS + DOM manipulation + form events.
 * Data is stored in memory only for this milestone.
 * Persistence with Web Storage is planned for Week 4.
 */
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const classes = [];
  const tasks = [];
  let nextId = 1;

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
    renderTasks();
  });

  classList.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button || button.dataset.action !== "delete-class") return;
    const index = classes.findIndex(item => item.id === Number(button.dataset.id));
    if (index !== -1) classes.splice(index, 1);
    renderClasses();
  });

  taskList.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const index = tasks.findIndex(item => item.id === Number(button.dataset.id));
    if (index < 0) return;
    if (button.dataset.action === "delete-task") tasks.splice(index, 1);
    if (button.dataset.action === "toggle-task") tasks[index].done = !tasks[index].done;
    renderTasks();
  });

  renderClasses();
  renderTasks();
});
