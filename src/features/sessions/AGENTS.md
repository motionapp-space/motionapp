# SESSIONS FEATURE KNOWLEDGE BASE

## OVERVIEW
Handles the execution of training sessions by clients. Tracks real-time progress, timer state, and exercise completion.

## STRUCTURE
- **Runner**: `SessionRunner` component orchestrates the workout flow.
- **State**: `useSessionStore` (Zustand) persists active session state (current exercise, set completion, rest timer).
- **Data**: Writes to `training_sessions` (metadata) and `exercise_log` (sets/reps).

## KEY CONCEPTS
- **State Machine**:
  - `idle` -> `active` (timer running) -> `paused` -> `completed`.
- **Interaction**:
  - Updates `training_sessions.status` ('started', 'completed').
  - Real-time RPE and Weight logging per set.
- **Recovery**: Logic to resume a session if the browser is refreshed (local storage + DB sync).
