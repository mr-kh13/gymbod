import { EXERCISES } from "./catalog.js";
import { exerciseName, historyItems, sessionDetail, sessionSummary, workoutSummary } from "./domain.js";

export function escapeHtml(value = "") {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

const errorFor = (errors, field) => errors.find((error) => error.field === field)?.message ?? "";
const errorId = (field) => `error-${field.replaceAll(".", "-")}`;

function exerciseOptions(selected, used) {
  return EXERCISES.map((exercise) => `<option value="${exercise.id}" ${exercise.id === selected ? "selected" : ""} ${used.has(exercise.id) && exercise.id !== selected ? "disabled" : ""}>${escapeHtml(exercise.name)} · ${exercise.category}</option>`).join("");
}

function renderEditor(editor, errors) {
  const used = new Set(editor.exercises.map((item) => item.exerciseId));
  const summary = errors.length ? `<div class="error-summary" role="alert" tabindex="-1" data-error-summary><strong>Review ${errors.length} ${errors.length === 1 ? "problem" : "problems"}</strong><ul>${errors.map((error) => `<li>${escapeHtml(error.message)}</li>`).join("")}</ul></div>` : "";
  const rows = editor.exercises.map((item, index) => {
    const exerciseError = errorFor(errors, `exercises.${index}.exerciseId`);
    const setsError = errorFor(errors, `exercises.${index}.sets`);
    const repsError = errorFor(errors, `exercises.${index}.targetReps`);
    return `<fieldset class="exercise-row" data-exercise-row data-index="${index}">
      <legend>Exercise ${index + 1}</legend>
      <label class="field exercise-field"><span>Exercise</span><select name="exerciseId-${index}" ${exerciseError ? `aria-invalid="true" aria-describedby="${errorId(`exercises.${index}.exerciseId`)}"` : ""}>${exerciseOptions(item.exerciseId, used)}</select>${exerciseError ? `<small class="field-error" id="${errorId(`exercises.${index}.exerciseId`)}">${escapeHtml(exerciseError)}</small>` : ""}</label>
      <label class="field"><span>Sets</span><input name="sets-${index}" inputmode="numeric" type="number" min="1" max="10" value="${escapeHtml(item.sets)}" ${setsError ? `aria-invalid="true" aria-describedby="${errorId(`exercises.${index}.sets`)}"` : ""}>${setsError ? `<small class="field-error" id="${errorId(`exercises.${index}.sets`)}">${escapeHtml(setsError)}</small>` : ""}</label>
      <label class="field"><span>Target reps</span><input name="reps-${index}" inputmode="numeric" type="number" min="1" max="100" value="${escapeHtml(item.targetReps)}" ${repsError ? `aria-invalid="true" aria-describedby="${errorId(`exercises.${index}.targetReps`)}"` : ""}>${repsError ? `<small class="field-error" id="${errorId(`exercises.${index}.targetReps`)}">${escapeHtml(repsError)}</small>` : ""}</label>
      <div class="row-actions" aria-label="Reorder exercise ${index + 1}"><button type="button" class="icon-button" data-action="move-exercise" data-direction="up" data-index="${index}" ${index === 0 ? "disabled" : ""} aria-label="Move exercise ${index + 1} up">↑</button><button type="button" class="icon-button" data-action="move-exercise" data-direction="down" data-index="${index}" ${index === editor.exercises.length - 1 ? "disabled" : ""} aria-label="Move exercise ${index + 1} down">↓</button><button type="button" class="text-button danger-text" data-action="remove-exercise" data-index="${index}">Remove</button></div>
    </fieldset>`;
  }).join("");
  const nameError = errorFor(errors, "name");
  const exercisesError = errorFor(errors, "exercises");
  return `<section class="editor panel" aria-labelledby="editor-title"><div class="section-heading"><div><p class="eyebrow">Workout builder</p><h2 id="editor-title">${editor.id ? "Edit" : "Create"} workout</h2></div><button type="button" class="secondary" data-action="cancel-editor">Cancel</button></div>${summary}<form data-workout-form novalidate><label class="field"><span>Workout name</span><input name="name" maxlength="60" value="${escapeHtml(editor.name)}" placeholder="e.g. Push day" ${nameError ? `aria-invalid="true" aria-describedby="${errorId("name")}"` : ""}>${nameError ? `<small class="field-error" id="${errorId("name")}">${escapeHtml(nameError)}</small>` : ""}</label><div class="exercise-list">${rows}</div>${exercisesError ? `<p class="field-error" id="${errorId("exercises")}">${escapeHtml(exercisesError)}</p>` : ""}<div class="form-actions"><button type="button" class="secondary" data-action="add-exercise" ${editor.exercises.length >= EXERCISES.length ? "disabled" : ""}>+ Add exercise</button><button type="submit">Save workout</button></div></form></section>`;
}

function renderPlans({ state, editor, errors }) {
  const cards = state.workouts.map((workout) => {
    const summary = workoutSummary(workout);
    return `<article class="workout-card"><div><p class="eyebrow">${summary.exerciseCount} exercises · ${summary.totalSets} sets</p><h2>${escapeHtml(workout.name)}</h2><p>${workout.exercises.map((item) => escapeHtml(exerciseName(item.exerciseId))).join(" · ")}</p></div><div class="card-actions"><button type="button" data-action="start-workout" data-id="${workout.id}">Start</button><button type="button" class="secondary" data-action="edit-workout" data-id="${workout.id}">Edit</button><button type="button" class="text-button danger-text" data-action="delete-workout" data-id="${workout.id}">Delete</button></div></article>`;
  }).join("");
  const content = state.workouts.length ? `<div class="card-grid">${cards}</div>` : `<div class="empty-state panel"><span class="empty-icon" aria-hidden="true">↗</span><h2>Build your first session</h2><p>Create a reusable workout once, then take it to the gym without an account or connection.</p><button type="button" data-action="new-workout">Create workout</button></div>`;
  return `<section class="page-heading"><div><p class="eyebrow">Local-first training</p><h1>Plans that get out of your way.</h1><p class="lede">Build a repeatable session, record the work, and keep momentum on this device.</p></div>${state.workouts.length && !editor ? `<button type="button" data-action="new-workout">+ New workout</button>` : ""}</section>${editor ? renderEditor(editor, errors) : content}`;
}

function renderSession({ state, lastSummary }) {
  const session = state.activeSession;
  if (!session) {
    const summary = lastSummary ? `<div class="summary-banner panel" role="status"><p class="eyebrow">Session saved</p><h2>${lastSummary.completedSets} of ${lastSummary.plannedSets} sets completed</h2><p>Your results are now available in History.</p><a class="button" href="#history">View history</a></div>` : "";
    return `<section class="page-heading"><div><p class="eyebrow">Active session</p><h1>${lastSummary ? "Nice work." : "Start a workout from Plans"}</h1><p class="lede">Your set progress stays on this device—even after a refresh.</p></div></section>${summary || `<div class="empty-state panel"><a class="button" href="#plans">View plans</a></div>`}`;
  }
  const summary = sessionSummary(session);
  const groups = session.plannedExercises.map((exercise) => {
    const sets = session.results.filter((result) => result.exerciseId === exercise.exerciseId).map((result) => `<div class="set-row" data-set-row data-exercise-id="${exercise.exerciseId}" data-set-number="${result.setNumber}"><label class="set-check"><input type="checkbox" data-set-field="completed" ${result.completed ? "checked" : ""}><span>Set ${result.setNumber}</span></label><span class="target">Target ${exercise.targetReps} reps</span><label class="compact-field"><span>kg</span><input type="number" min="0" max="1000" step="0.5" inputmode="decimal" data-set-field="weight" value="${result.actualWeightKg ?? ""}"></label><label class="compact-field"><span>reps</span><input type="number" min="0" max="100" inputmode="numeric" data-set-field="reps" value="${result.actualReps ?? ""}"></label></div>`).join("");
    return `<section class="session-exercise"><div><p class="eyebrow">${exercise.sets} sets · ${exercise.targetReps} target reps</p><h2>${escapeHtml(exercise.exerciseName)}</h2></div><div class="set-list">${sets}</div></section>`;
  }).join("");
  return `<section class="page-heading"><div><p class="eyebrow">Active session</p><h1>${escapeHtml(session.workoutName)}</h1><p class="lede">${summary.completedSets} of ${summary.plannedSets} sets complete. Changes save immediately.</p></div><div class="session-actions"><button type="button" data-action="finish-session" ${summary.completedSets === 0 ? "disabled" : ""}>Finish session</button><button type="button" class="text-button danger-text" data-action="discard-session">Discard</button></div></section><div class="session-stack">${groups}</div>`;
}

function formatDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function renderHistory({ state, selectedHistory }) {
  const items = historyItems(state);
  if (!items.length) return `<section class="page-heading"><div><p class="eyebrow">Training history</p><h1>Nothing logged yet</h1><p class="lede">Finish a session and it will appear here.</p></div></section><div class="empty-state panel"><a class="button" href="#plans">View plans</a></div>`;
  if (selectedHistory) {
    const detail = sessionDetail(state, selectedHistory);
    if (detail) {
      const summary = sessionSummary(detail);
      const groups = detail.plannedExercises.map((exercise) => `<section class="history-exercise"><h2>${escapeHtml(exercise.exerciseName)}</h2><ul>${detail.results.filter((result) => result.exerciseId === exercise.exerciseId).map((result) => `<li><span>Set ${result.setNumber}</span><strong>${result.completed ? `${result.actualWeightKg ?? "—"} kg · ${result.actualReps ?? "—"} reps` : "Not completed"}</strong></li>`).join("")}</ul></section>`).join("");
      return `<button type="button" class="secondary back-button" data-action="back-history">← All sessions</button><section class="page-heading"><div><p class="eyebrow">${formatDate(detail.finishedAt)}</p><h1>${escapeHtml(detail.workoutName)}</h1><p class="lede">${summary.completedSets} of ${summary.plannedSets} planned sets completed.</p></div></section><div class="history-detail">${groups}</div>`;
    }
  }
  return `<section class="page-heading"><div><p class="eyebrow">Training history</p><h1>Recent work.</h1><p class="lede">Your latest ${items.length} completed ${items.length === 1 ? "session" : "sessions"}, stored only on this device.</p></div></section><div class="history-list">${items.map((item) => `<button type="button" class="history-item" data-action="view-history" data-id="${item.id}"><span><strong>${escapeHtml(item.workoutName)}</strong><small>${formatDate(item.finishedAt)}</small></span><span class="completion-badge">${item.summary.completedSets}/${item.summary.plannedSets} sets</span><span aria-hidden="true">→</span></button>`).join("")}</div>`;
}

export function renderApp({ state, view, recoveryError, editor = null, errors = [], lastSummary = null, selectedHistory = null }) {
  if (recoveryError) return `<section class="panel recovery"><p class="eyebrow">Recovery needed</p><h1>Your saved data could not be read</h1><p>Form has left the unreadable data untouched. Reset only this planner's local data to continue.</p><button type="button" data-action="reset-data" class="danger">Reset planner data</button></section>`;
  if (view === "plans") return renderPlans({ state, editor, errors });
  if (view === "session") return renderSession({ state, lastSummary });
  return renderHistory({ state, selectedHistory });
}
