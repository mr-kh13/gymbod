import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createWorkout, discardSession, finishSession, historyItems, recordSet, sessionDetail, startSession } from "../src/domain.js";
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
