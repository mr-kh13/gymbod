import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createWorkout, deleteWorkout, discardSession, duplicateWorkout, finishSession, historyItems, recordSet, sessionDetail, startSession, updateWorkout } from "../src/domain.js";
import { createDefaultState } from "../src/storage.js";
import { renderApp } from "../src/ui.js";

function withWorkout() {
  return createWorkout(createDefaultState(), {
    name: "Push day",
    exercises: [
      { exerciseId: "bench-press", sets: 2, targetReps: 8 },
      { exerciseId: "overhead-press", sets: 1, targetReps: 10 }
    ]
  }, { id: "w1", now: "2026-07-13T10:00:00.000Z" }).state;
}

test("starts one active session with an immutable workout snapshot", () => {
  const started = startSession(withWorkout(), "w1", { id: "s1", now: "2026-07-13T11:00:00.000Z" });
  assert.equal(started.activeSession.workoutName, "Push day");
  assert.equal(started.activeSession.results.length, 3);
  assert.deepEqual(started.activeSession.plannedExercises.map((item) => item.exerciseName), ["Bench press", "Overhead press"]);
  assert.throws(() => startSession(started, "w1"), /already active/i);
});

test("records a completed set without mutating the prior state", () => {
  const started = startSession(withWorkout(), "w1", { id: "s1", now: "2026-07-13T11:00:00.000Z" });
  const updated = recordSet(started, "bench-press", 1, { completed: true, actualWeightKg: 80, actualReps: 8 });
  assert.equal(started.activeSession.results[0].completed, false);
  assert.deepEqual(updated.activeSession.results[0], { exerciseId: "bench-press", setNumber: 1, completed: true, actualWeightKg: 80, actualReps: 8 });
});

test("rejects invalid actual results", () => {
  const started = startSession(withWorkout(), "w1", { id: "s1", now: "2026-07-13T11:00:00.000Z" });
  assert.throws(() => recordSet(started, "bench-press", 1, { completed: true, actualWeightKg: -1, actualReps: 101 }), /weight/i);
});

test("finishes a partial session and archives its completion summary", () => {
  const started = startSession(withWorkout(), "w1", { id: "s1", now: "2026-07-13T11:00:00.000Z" });
  const recorded = recordSet(started, "bench-press", 1, { completed: true, actualWeightKg: 80, actualReps: 8 });
  const result = finishSession(recorded, { now: "2026-07-13T11:30:00.000Z" });
  assert.equal(result.state.activeSession, null);
  assert.equal(result.state.history[0].status, "completed");
  assert.deepEqual(result.summary, { completedSets: 1, plannedSets: 3 });
});

test("requires one completed set before finishing", () => {
  const started = startSession(withWorkout(), "w1", { id: "s1", now: "2026-07-13T11:00:00.000Z" });
  assert.throws(() => finishSession(started), /at least one set/i);
});

test("discards an active session without creating history", () => {
  const started = startSession(withWorkout(), "w1", { id: "s1", now: "2026-07-13T11:00:00.000Z" });
  const discarded = discardSession(started);
  assert.equal(discarded.activeSession, null);
  assert.equal(discarded.history.length, 0);
});

test("lists completed history newest first with completion ratios", () => {
  const base = withWorkout();
  const older = { id: "older", workoutName: "Push day", startedAt: "2026-07-11T10:00:00.000Z", finishedAt: "2026-07-11T11:00:00.000Z", status: "completed", plannedExercises: [], results: [{ completed: true }] };
  const newer = { ...older, id: "newer", finishedAt: "2026-07-12T11:00:00.000Z", results: [{ completed: true }, { completed: false }] };
  const items = historyItems({ ...base, history: [older, newer] });
  assert.deepEqual(items.map((item) => item.id), ["newer", "older"]);
  assert.deepEqual(items[0].summary, { completedSets: 1, plannedSets: 2 });
});

test("retains only the latest 20 completed sessions", () => {
  let state = withWorkout();
  for (let index = 0; index < 21; index += 1) {
    state = startSession(state, "w1", { id: `s${index}`, now: new Date(Date.UTC(2026, 6, 1, index)).toISOString() });
    state = recordSet(state, "bench-press", 1, { completed: true });
    state = finishSession(state, { now: new Date(Date.UTC(2026, 6, 1, index, 30)).toISOString() }).state;
  }
  assert.equal(state.history.length, 20);
  assert.equal(state.history[0].id, "s20");
  assert.equal(state.history.at(-1).id, "s1");
});

test("returns an immutable history detail projection", () => {
  let state = startSession(withWorkout(), "w1", { id: "s1", now: "2026-07-13T11:00:00.000Z" });
  state = recordSet(state, "bench-press", 1, { completed: true, actualWeightKg: 80, actualReps: 8 });
  state = finishSession(state, { now: "2026-07-13T11:30:00.000Z" }).state;
  const detail = sessionDetail(state, "s1");
  detail.results[0].actualWeightKg = 999;
  assert.equal(state.history[0].results[0].actualWeightKg, 80);
  assert.equal(detail.workoutName, "Push day");
});

test("history is empty when no sessions have been completed", () => {
  assert.deepEqual(historyItems(createDefaultState()), []);
});

test("application shell exposes navigation, main content, and polite status semantics", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.match(html, /<nav aria-label="Primary">/);
  assert.match(html, /<main id="main-content" tabindex="-1">/);
  assert.match(html, /role="status" aria-live="polite"/);
});

test("rendered empty states route users back to the next useful action", () => {
  const state = createDefaultState();
  assert.match(renderApp({ state, view: "plans" }), /Create workout/);
  assert.match(renderApp({ state, view: "session" }), /View plans/);
  assert.match(renderApp({ state, view: "history" }), /Finish a session/);
});

test("corrupted data renders an explicit recovery action", () => {
  const output = renderApp({ state: null, view: "plans", recoveryError: new Error("bad data") });
  assert.match(output, /data-action="reset-data"/);
  assert.match(output, /left the unreadable data untouched/);
});

test("duplicating a workout adds an independent copy with a default name and matching exercises", () => {
  const state = withWorkout();
  const { state: next, workout: copy } = duplicateWorkout(state, "w1", { id: "w2" });
  assert.equal(next.workouts.length, 2);
  assert.equal(copy.name, "Copy of Push day");
  assert.deepEqual(
    copy.exercises.map((e) => e.exerciseId),
    state.workouts[0].exercises.map((e) => e.exerciseId)
  );
  assert.doesNotThrow(() => startSession(next, "w2"));
});

test("renders a Duplicate button for each saved workout card", () => {
  const state = withWorkout();
  const html = renderApp({ state, view: "plans" });
  assert.match(html, /data-action="duplicate-workout"/);
});

test("renders inline rename input when renamingId matches a workout", () => {
  const state = withWorkout();
  const { state: duped, workout: copy } = duplicateWorkout(state, "w1", { id: "w2" });
  const html = renderApp({ state: duped, view: "plans", renamingId: copy.id });
  assert.match(html, /data-rename-input/);
  assert.match(html, /data-action="confirm-rename"/);
  assert.match(html, /data-action="cancel-rename"/);
  assert.doesNotMatch(html, new RegExp(`data-action="duplicate-workout"[^>]*data-id="${copy.id}"`));
});

test("rename with a valid custom name updates the duplicate without affecting the source", () => {
  const state = withWorkout();
  const { state: duped, workout: copy } = duplicateWorkout(state, "w1", { id: "w2" });
  const { state: renamed, errors } = updateWorkout(duped, copy.id, { name: "Heavy push", exercises: copy.exercises });
  assert.equal(errors.length, 0);
  assert.equal(renamed.workouts.find((w) => w.id === copy.id).name, "Heavy push");
  assert.equal(renamed.workouts.find((w) => w.id === "w1").name, "Push day");
});

test("rename rejects an empty name and leaves the duplicate unchanged", () => {
  const state = withWorkout();
  const { state: duped, workout: copy } = duplicateWorkout(state, "w1", { id: "w2" });
  const { errors } = updateWorkout(duped, copy.id, { name: "", exercises: copy.exercises });
  assert.ok(errors.length > 0);
  assert.equal(duped.workouts.find((w) => w.id === copy.id).name, copy.name);
});

test("editing the duplicate and deleting the source leaves the duplicate intact and startable", () => {
  const state = withWorkout();
  const { state: duped, workout: copy } = duplicateWorkout(state, "w1", { id: "w2" });
  const { state: edited } = updateWorkout(duped, copy.id, {
    name: copy.name,
    exercises: [{ exerciseId: "bench-press", sets: 5, targetReps: 3 }]
  });
  assert.equal(edited.workouts.find((w) => w.id === "w1").exercises[0].sets, 2);
  const afterDelete = deleteWorkout(edited, "w1");
  const remaining = afterDelete.workouts.find((w) => w.id === copy.id);
  assert.ok(remaining);
  assert.equal(remaining.exercises[0].sets, 5);
  assert.doesNotThrow(() => startSession(afterDelete, copy.id));
});
