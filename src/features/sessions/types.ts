export type SessionStatus = "in_progress" | "completed" | "cancelled";
export type SessionSource = "with_coach" | "autonomous";

export interface ExerciseRef {
  dayId: string;
  sectionId: string;
  groupId?: string;
  exerciseId: string;
}

export interface ExerciseActual {
  id: string;
  session_id: string;
  day_id: string;
  section_id: string;
  group_id?: string;
  exercise_id: string;
  set_index: number;
  reps: string;
  load?: string;
  rest?: string;
  rpe?: number;
  note?: string;
  timestamp: string;
  created_at: string;
}

export interface TrainingSession {
  id: string;
  coach_client_id: string;
  plan_id?: string;
  day_id?: string;
  event_id?: string;
  scheduled_at?: string;
  started_at?: string;
  ended_at?: string;
  status: SessionStatus;
  notes?: string;
  source: SessionSource;
  created_at: string;
  updated_at: string;
}

export interface TrainingSessionWithClient extends TrainingSession {
  client_name: string;
}

export interface CreateSessionInput {
  coach_client_id: string;
  plan_id?: string;
  day_id?: string;
  event_id?: string;
  scheduled_at?: string;
  source?: SessionSource;
}

export interface UpdateSessionInput {
  status?: SessionStatus;
  notes?: string;
  ended_at?: string;
}

export interface CreateActualInput {
  day_id: string;
  section_id: string;
  group_id?: string;
  exercise_id: string;
  set_index: number;
  reps: string;
  load?: string;
  rest?: string;
  rpe?: number;
  note?: string;
}

export interface SessionsFilters {
  coach_client_id?: string;
  status?: SessionStatus;
  start_date?: string;
  end_date?: string;
}

export interface ExerciseHistory {
  exercise_id: string;
  exercise_name: string;
  performances: ExerciseActual[];
}
