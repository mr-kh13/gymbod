import test from "node:test";
import assert from "node:assert/strict";
import { EXERCISES } from "../src/catalog.js";
import { createWorkout, deleteWorkout, updateWorkout, validateWorkout } from "../src/domain.js";
import { createDefaultState } from "../src/storage.js";

const validDraft = {
  name: "Push day",
  exercises: [
    { exerciseId: "bench-press", sets: 3, targetReps: 8 },
    { exerciseId: "overhead-press", sets: 3, targetReps: 10 }
  ]
};

test("creates a trimmed workout while preserving exercise order", () => {
  const result = createWorkout(createDefaultState(), { ...validDraft, name: "  Push day  " }, { id: "w1", now: "2026-07-13T10:00:00.000Z" });
  assert.equal(result.errors.length, 0);
  assert.equal(result.workout.name, "Push day");
  assert.deepEqual(result.workout.exercises.map((item) => item.exerciseId), ["bench-press", "overhead-press"]);
  assert.equal(result.state.workouts.length, 1);
});

test("reports all invalid workout fields together", () => {
  const errors = validateWorkout({
    name: " ",
    exercises: [
      { exerciseId: "missing", sets: 0, targetReps: 101 },
      { exerciseId: "missing", sets: "x", targetReps: "" }
    ]
  }, EXERCISES);
  assert.deepEqual(new Set(errors.map((error) => error.field)), new Set([
    "name", "exercises.0.exerciseId", "exercises.0.sets", "exercises.0.targetReps",
    "exercises.1.exerciseId", "exercises.1.sets", "exercises.1.targetReps"
  ]));
  assert.ok(errors.some((error) => error.message.includes("only once")));
});

test("requires at least one exercise", () => {
  const errors = validateWorkout({ name: "Leg day", exercises: [] }, EXERCISES);
  assert.ok(errors.some((error) => error.field === "exercises"));
});

test("updates a workout without changing its identity or creation time", () => {
  const created = createWorkout(createDefaultState(), validDraft, { id: "w1", now: "2026-07-13T10:00:00.000Z" });
  const reordered = { ...validDraft, exercises: [...validDraft.exercises].reverse() };
  const updated = updateWorkout(created.state, "w1", reordered, { now: "2026-07-13T11:00:00.000Z" });
  assert.equal(updated.workout.id, "w1");
  assert.equal(updated.workout.createdAt, "2026-07-13T10:00:00.000Z");
  assert.equal(updated.workout.updatedAt, "2026-07-13T11:00:00.000Z");
  assert.equal(updated.workout.exercises[0].exerciseId, "overhead-press");
});

test("blocks deletion while an active session references the workout", () => {
  const created = createWorkout(createDefaultState(), validDraft, { id: "w1", now: "2026-07-13T10:00:00.000Z" });
  const state = { ...created.state, activeSession: { workoutId: "w1" } };
  assert.throws(() => deleteWorkout(state, "w1"), /active session/i);
});

test("deletes an unused workout", () => {
  const created = createWorkout(createDefaultState(), validDraft, { id: "w1", now: "2026-07-13T10:00:00.000Z" });
  assert.equal(deleteWorkout(created.state, "w1").workouts.length, 0);
});
