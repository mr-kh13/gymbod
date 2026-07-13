import test from "node:test";
import assert from "node:assert/strict";
import { createDefaultState, createPlannerRepository, StorageCorruptionError } from "../src/storage.js";

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key) => data.has(key) ? data.get(key) : null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key)
  };
}

test("loads a fresh versioned planner state", () => {
  const repository = createPlannerRepository(memoryStorage());
  assert.deepEqual(repository.load(), createDefaultState());
});

test("round-trips saved planner state", () => {
  const repository = createPlannerRepository(memoryStorage());
  const state = { ...createDefaultState(), workouts: [{ id: "w1" }] };
  repository.save(state);
  assert.deepEqual(repository.load(), state);
});

test("reports malformed stored data without silently deleting it", () => {
  const repository = createPlannerRepository(memoryStorage({ "form.planner.v1": "{" }));
  assert.throws(() => repository.load(), StorageCorruptionError);
});

test("reset removes malformed data and returns a fresh state", () => {
  const storage = memoryStorage({ "form.planner.v1": "{" });
  const repository = createPlannerRepository(storage);
  repository.reset();
  assert.deepEqual(repository.load(), createDefaultState());
});
