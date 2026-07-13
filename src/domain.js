import { EXERCISES, exerciseById } from "./catalog.js";

const integerInRange = (value, min, max) => Number.isInteger(Number(value)) && Number(value) >= min && Number(value) <= max;
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function validateWorkout(draft, catalog = EXERCISES) {
  const errors = [];
  if (!String(draft?.name ?? "").trim()) errors.push({ field: "name", message: "Enter a workout name." });
  else if (String(draft.name).trim().length > 50) errors.push({ field: "name", message: "Use 50 characters or fewer." });

  const exercises = Array.isArray(draft?.exercises) ? draft.exercises : [];
  if (exercises.length === 0) errors.push({ field: "exercises", message: "Add at least one exercise." });
  const seen = new Set();
  exercises.forEach((item, index) => {
    const path = `exercises.${index}`;
    if (!catalog.some((exercise) => exercise.id === item.exerciseId)) {
      errors.push({ field: `${path}.exerciseId`, message: "Choose an exercise from the catalogue." });
    }
    if (seen.has(item.exerciseId)) {
      errors.push({ field: `${path}.exerciseId`, message: "Use each exercise only once." });
    }
    seen.add(item.exerciseId);
    if (!integerInRange(item.sets, 1, 10)) errors.push({ field: `${path}.sets`, message: "Sets must be from 1 to 10." });
    if (!integerInRange(item.targetReps, 1, 100)) errors.push({ field: `${path}.targetReps`, message: "Repetitions must be from 1 to 100." });
  });
  return errors;
}

export function createWorkout(state, draft, options = {}) {
  const errors = validateWorkout(draft);
  if (errors.length) return { state, workout: null, errors };
  const now = options.now ?? new Date().toISOString();
  const workout = {
    id: options.id ?? makeId(),
    name: draft.name.trim(),
    exercises: draft.exercises.map((item) => ({ exerciseId: item.exerciseId, sets: Number(item.sets), targetReps: Number(item.targetReps) })),
    createdAt: now,
    updatedAt: now
  };
  return { state: { ...state, workouts: [...state.workouts, workout] }, workout, errors: [] };
}

export function updateWorkout(state, workoutId, draft, options = {}) {
  const existing = state.workouts.find((workout) => workout.id === workoutId);
  if (!existing) throw new Error("Workout not found.");
  const errors = validateWorkout(draft);
  if (errors.length) return { state, workout: null, errors };
  const workout = {
    ...existing,
    name: draft.name.trim(),
    exercises: draft.exercises.map((item) => ({ exerciseId: item.exerciseId, sets: Number(item.sets), targetReps: Number(item.targetReps) })),
    updatedAt: options.now ?? new Date().toISOString()
  };
  return { state: { ...state, workouts: state.workouts.map((item) => item.id === workoutId ? workout : item) }, workout, errors: [] };
}

export function deleteWorkout(state, workoutId) {
  if (state.activeSession?.workoutId === workoutId) throw new Error("Finish or discard the active session before deleting this workout.");
  return { ...state, workouts: state.workouts.filter((workout) => workout.id !== workoutId) };
}

export function duplicateWorkout(state, workoutId, options = {}) {
  const source = state.workouts.find((w) => w.id === workoutId);
  if (!source) throw new Error("Workout not found.");
  const existing = new Set(state.workouts.map((w) => w.name));
  const base = `Copy of ${source.name}`;
  let name = base.slice(0, 50);
  if (existing.has(name)) {
    for (let n = 2; ; n++) {
      const candidate = `${base} (${n})`.slice(0, 50);
      if (!existing.has(candidate)) { name = candidate; break; }
    }
  }
  const now = options.now ?? new Date().toISOString();
  const workout = {
    id: options.id ?? makeId(),
    name,
    exercises: source.exercises.map((item) => ({ ...item })),
    createdAt: now,
    updatedAt: now
  };
  return { state: { ...state, workouts: [...state.workouts, workout] }, workout };
}

export function workoutSummary(workout) {
  return {
    exerciseCount: workout.exercises.length,
    totalSets: workout.exercises.reduce((sum, exercise) => sum + exercise.sets, 0)
  };
}

export function exerciseName(id) {
  return exerciseById(id)?.name ?? "Unknown exercise";
}

export function startSession(state, workoutId, options = {}) {
  if (state.activeSession) throw new Error("A session is already active.");
  const workout = state.workouts.find((item) => item.id === workoutId);
  if (!workout) throw new Error("Workout not found.");
  const plannedExercises = workout.exercises.map((item) => ({ ...item, exerciseName: exerciseName(item.exerciseId) }));
  const results = plannedExercises.flatMap((item) => Array.from({ length: item.sets }, (_, index) => ({
    exerciseId: item.exerciseId,
    setNumber: index + 1,
    completed: false,
    actualWeightKg: null,
    actualReps: null
  })));
  return {
    ...state,
    activeSession: {
      id: options.id ?? makeId(),
      workoutId,
      workoutName: workout.name,
      plannedExercises,
      results,
      startedAt: options.now ?? new Date().toISOString(),
      status: "active"
    }
  };
}

function optionalNumber(value, { integer = false, max, label }) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > max || (integer && !Number.isInteger(number))) {
    throw new Error(`${label} must be between 0 and ${max}.`);
  }
  return number;
}

export function recordSet(state, exerciseId, setNumber, values) {
  if (!state.activeSession) throw new Error("No session is active.");
  const found = state.activeSession.results.some((item) => item.exerciseId === exerciseId && item.setNumber === Number(setNumber));
  if (!found) throw new Error("Planned set not found.");
  const actualWeightKg = optionalNumber(values.actualWeightKg, { max: 1000, label: "Weight" });
  const actualReps = optionalNumber(values.actualReps, { integer: true, max: 100, label: "Repetitions" });
  const results = state.activeSession.results.map((item) => item.exerciseId === exerciseId && item.setNumber === Number(setNumber)
    ? { ...item, completed: Boolean(values.completed), actualWeightKg, actualReps }
    : item);
  return { ...state, activeSession: { ...state.activeSession, results } };
}

export function sessionSummary(session) {
  return {
    completedSets: session.results.filter((result) => result.completed).length,
    plannedSets: session.results.length
  };
}

export function finishSession(state, options = {}) {
  if (!state.activeSession) throw new Error("No session is active.");
  const summary = sessionSummary(state.activeSession);
  if (summary.completedSets === 0) throw new Error("Complete at least one set before finishing.");
  const completed = { ...state.activeSession, status: "completed", finishedAt: options.now ?? new Date().toISOString() };
  return { state: { ...state, activeSession: null, history: [completed, ...state.history].slice(0, 20) }, summary };
}

export function discardSession(state) {
  if (!state.activeSession) throw new Error("No session is active.");
  return { ...state, activeSession: null };
}

export function historyItems(state) {
  return [...state.history]
    .sort((left, right) => new Date(right.finishedAt) - new Date(left.finishedAt))
    .slice(0, 20)
    .map((session) => ({
      id: session.id,
      workoutName: session.workoutName,
      finishedAt: session.finishedAt,
      summary: sessionSummary(session)
    }));
}

export function sessionDetail(state, sessionId) {
  const session = state.history.find((item) => item.id === sessionId);
  return session ? structuredClone(session) : null;
}
