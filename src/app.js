import { EXERCISES } from "./catalog.js";
import { createWorkout, deleteWorkout, discardSession, finishSession, recordSet, startSession, updateWorkout } from "./domain.js";
import { createPlannerRepository, StorageCorruptionError } from "./storage.js";
import { renderApp } from "./ui.js";

const repository = createPlannerRepository(window.localStorage);
const app = document.querySelector("#app");
const status = document.querySelector("#status");
let state;
let recoveryError = null;
let editor = null;
let errors = [];
let lastSummary = null;
let selectedHistory = null;

try { state = repository.load(); }
catch (error) { if (!(error instanceof StorageCorruptionError)) throw error; recoveryError = error; state = null; }

const currentView = () => ["plans", "session", "history"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "plans";
const newDraft = () => ({ id: null, name: "", exercises: [{ exerciseId: EXERCISES[0].id, sets: 3, targetReps: 8 }] });
const cloneWorkout = (workout) => ({ id: workout.id, name: workout.name, exercises: workout.exercises.map((item) => ({ ...item })) });

function announce(message) { status.textContent = ""; requestAnimationFrame(() => { status.textContent = message; }); }
function persist(message) { repository.save(state); if (message) announce(message); }
function render() {
  const view = currentView();
  app.innerHTML = renderApp({ state, view, recoveryError, editor, errors, lastSummary, selectedHistory });
  app.setAttribute("aria-busy", "false");
  document.querySelectorAll("[data-nav]").forEach((link) => link.dataset.nav === view ? link.setAttribute("aria-current", "page") : link.removeAttribute("aria-current"));
  if (errors.length) app.querySelector("[data-error-summary]")?.focus();
}

function readDraft(form) {
  return {
    id: editor?.id ?? null,
    name: form.elements.name.value,
    exercises: [...form.querySelectorAll("[data-exercise-row]")].map((row, index) => ({
      exerciseId: form.elements[`exerciseId-${index}`].value,
      sets: form.elements[`sets-${index}`].value,
      targetReps: form.elements[`reps-${index}`].value
    }))
  };
}

function syncEditorFromForm() {
  const form = app.querySelector("[data-workout-form]");
  if (form && editor) editor = readDraft(form);
}

app.addEventListener("submit", (event) => {
  if (!event.target.matches("[data-workout-form]")) return;
  event.preventDefault();
  editor = readDraft(event.target);
  const result = editor.id ? updateWorkout(state, editor.id, editor) : createWorkout(state, editor);
  errors = result.errors;
  if (errors.length) { render(); return; }
  state = result.state; editor = null; persist("Workout saved."); render();
});

app.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-action]");
  if (!trigger) return;
  const { action, id, index, direction } = trigger.dataset;
  if (action === "reset-data" && window.confirm("Reset all Form planner data on this device?")) { repository.reset(); state = repository.load(); recoveryError = null; announce("Planner data reset."); render(); }
  if (action === "new-workout") { editor = newDraft(); errors = []; render(); }
  if (action === "cancel-editor") { editor = null; errors = []; render(); }
  if (action === "edit-workout") { editor = cloneWorkout(state.workouts.find((workout) => workout.id === id)); errors = []; render(); }
  if (action === "delete-workout" && window.confirm("Delete this workout?")) { try { state = deleteWorkout(state, id); persist("Workout deleted."); render(); } catch (error) { announce(error.message); } }
  if (action === "add-exercise") { syncEditorFromForm(); const used = new Set(editor.exercises.map((item) => item.exerciseId)); const exercise = EXERCISES.find((item) => !used.has(item.id)); if (exercise) editor.exercises.push({ exerciseId: exercise.id, sets: 3, targetReps: 8 }); render(); }
  if (action === "remove-exercise") { syncEditorFromForm(); editor.exercises.splice(Number(index), 1); render(); }
  if (action === "move-exercise") { syncEditorFromForm(); const from = Number(index); const to = direction === "up" ? from - 1 : from + 1; [editor.exercises[from], editor.exercises[to]] = [editor.exercises[to], editor.exercises[from]]; render(); }
  if (action === "start-workout") { try { state = startSession(state, id); persist("Session started."); lastSummary = null; location.hash = "session"; render(); } catch (error) { announce(error.message); if (state.activeSession) location.hash = "session"; } }
  if (action === "finish-session") { try { const result = finishSession(state); state = result.state; lastSummary = result.summary; persist("Session finished and added to history."); render(); } catch (error) { announce(error.message); } }
  if (action === "discard-session" && window.confirm("Discard this session? Recorded progress will be lost.")) { state = discardSession(state); lastSummary = null; persist("Session discarded."); render(); }
  if (action === "view-history") { selectedHistory = id; render(); }
  if (action === "back-history") { selectedHistory = null; render(); }
});

app.addEventListener("change", (event) => {
  const field = event.target.closest("[data-set-field]");
  if (!field) return;
  const row = field.closest("[data-set-row]");
  try {
    state = recordSet(state, row.dataset.exerciseId, Number(row.dataset.setNumber), {
      completed: row.querySelector('[data-set-field="completed"]').checked,
      actualWeightKg: row.querySelector('[data-set-field="weight"]').value,
      actualReps: row.querySelector('[data-set-field="reps"]').value
    });
    persist(`Set ${row.dataset.setNumber} saved.`);
    render();
  } catch (error) { announce(error.message); field.focus(); }
});

window.addEventListener("hashchange", () => { editor = null; errors = []; selectedHistory = null; if (currentView() !== "session") lastSummary = null; render(); });
render();
