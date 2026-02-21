# PLANS FEATURE KNOWLEDGE BASE

## OVERVIEW
Manages the creation and editing of training plans. Plans are stored as complex JSON structures rather than normalized relational tables to allow flexible, nested hierarchy (Days -> Phases -> Groups -> Exercises).

## STRUCTURE
- **Editor**: `PlanEditor` (page) -> `DayList` -> `DayCard` -> `PhaseList` -> `ExerciseList`.
- **State**: `usePlanStore` (Zustand) manages the draft plan state in memory during editing.
- **Persistence**: Saves to `client_plans` table (`content_json` column).

## KEY CONCEPTS
- **JSON Structure**:
  ```json
  {
    "days": [
      {
        "phases": [
          {
            "groups": [
              {
                "exercises": [{ "exercise_id": "...", "sets": [], "notes": "..." }]
              }
            ]
          }
        ]
      }
    ]
  }
  ```
- **Templates vs Plans**: `plan_templates` are reusable blueprints; `client_plans` are assigned instances.
- **Validation**: Zod schemas used to validate the JSON structure before save.
