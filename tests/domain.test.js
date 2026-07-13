import test from "node:test";
import assert from "node:assert/strict";
import { EXERCISES } from "../src/catalog.js";
import { createWorkout, deleteWorkout, duplicateWorkout, updateWorkout, validateWorkout } from "../src/domain.js";
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

test("duplicateWorkout creates an independent copy with identical exercises in the same order", () => {
  const state = createWorkout(createDefaultState(), validDraft, { id: "w1", now: "2026-07-13T10:00:00.000Z" }).state;
  const { state: next, workout } = duplicateWorkout(state, "w1", { id: "w2", now: "2026-07-13T11:00:00.000Z" });
  assert.equal(next.workouts.length, 2);
  assert.equal(workout.id, "w2");
  assert.equal(workout.name, "Copy of Push day");
  assert.deepEqual(workout.exercises, [
    { exerciseId: "bench-press", sets: 3, targetReps: 8 },
    { exerciseId: "overhead-press", sets: 3, targetReps: 10 }
  ]);
  assert.equal(workout.createdAt, "2026-07-13T11:00:00.000Z");
});

test("duplicateWorkout appends a uniqueness suffix when the default name already exists", () => {
  let state = createWorkout(createDefaultState(), validDraft, { id: "w1" }).state;
  state = duplicateWorkout(state, "w1", { id: "w2" }).state;
  const { workout: second } = duplicateWorkout(state, "w1", { id: "w3" });
  assert.equal(second.name, "Copy of Push day (2)");
});

test("duplicateWorkout truncates the candidate name to 50 characters", () => {
  const longName = "A".repeat(44);
  const state = createWorkout(createDefaultState(), {
    name: longName,
    exercises: [{ exerciseId: "bench-press", sets: 1, targetReps: 5 }]
  }, { id: "w1" }).state;
  const { workout } = duplicateWorkout(state, "w1", { id: "w2" });
  assert.equal(workout.name.length, 50);
  assert.ok(workout.name.startsWith("Copy of A"));
});

test("duplicateWorkout throws when the source workout does not exist", () => {
  assert.throws(() => duplicateWorkout(createDefaultState(), "missing"), /not found/i);
});

test("duplicateWorkout leaves the source workout unmodified", () => {
  const state = createWorkout(createDefaultState(), validDraft, { id: "w1", now: "2026-07-13T10:00:00.000Z" }).state;
  const { state: next } = duplicateWorkout(state, "w1", { id: "w2" });
  const source = next.workouts.find((w) => w.id === "w1");
  assert.equal(source.name, "Push day");
  assert.equal(source.exercises.length, 2);
  assert.equal(source.updatedAt, "2026-07-13T10:00:00.000Z");
});

test("duplicateWorkout succeeds when the source workout is referenced by an active session", () => {
  const state = createWorkout(createDefaultState(), validDraft, { id: "w1" }).state;
  const withSession = { ...state, activeSession: { workoutId: "w1" } };
  const { state: next } = duplicateWorkout(withSession, "w1", { id: "w2" });
  assert.equal(next.workouts.length, 2);
  assert.equal(next.activeSession.workoutId, "w1");
});

test("editing the duplicate via updateWorkout does not alter the source workout", () => {
  const state = createWorkout(createDefaultState(), validDraft, { id: "w1" }).state;
  const { state: duped } = duplicateWorkout(state, "w1", { id: "w2" });
  const { state: edited } = updateWorkout(duped, "w2", {
    name: "Modified copy",
    exercises: [{ exerciseId: "bench-press", sets: 5, targetReps: 3 }]
  });
  const source = edited.workouts.find((w) => w.id === "w1");
  assert.equal(source.exercises.length, 2);
  assert.equal(source.exercises[0].sets, 3);
});

test("editing the source via updateWorkout does not alter the duplicate", () => {
  const state = createWorkout(createDefaultState(), validDraft, { id: "w1" }).state;
  const { state: duped } = duplicateWorkout(state, "w1", { id: "w2" });
  const { state: sourceEdited } = updateWorkout(duped, "w1", {
    name: "Push day v2",
    exercises: [{ exerciseId: "squat", sets: 4, targetReps: 5 }]
  });
  const duplicate = sourceEdited.workouts.find((w) => w.id === "w2");
  assert.equal(duplicate.exercises[0].exerciseId, "bench-press");
  assert.equal(duplicate.exercises[0].sets, 3);
});

test("deleting the source workout does not remove the duplicate", () => {
  const state = createWorkout(createDefaultState(), validDraft, { id: "w1" }).state;
  const { state: duped, workout: copy } = duplicateWorkout(state, "w1", { id: "w2" });
  const afterDelete = deleteWorkout(duped, "w1");
  assert.ok(afterDelete.workouts.some((w) => w.id === copy.id));
  assert.equal(afterDelete.workouts.length, 1);
});
