import { create } from 'zustand';
import { Plan, Week, Day, Exercise, PhaseType, Objective, makeWeek, makeDay, makeExercise, makePlan } from '@/types/plan';

const STORAGE_KEY = 'planpal.currentPlan';

interface PlanStore {
  plan: Plan | null;
  isSaving: boolean;
  
  // Meta
  setPlanName: (name: string) => void;
  setObjective: (objective: Objective) => void;
  setDurationWeeks: (n: number) => void;
  
  // Weeks
  addWeek: () => void;
  duplicateWeek: (weekId: string) => void;
  deleteWeek: (weekId: string) => void;
  
  // Days
  addDay: (weekId: string) => void;
  updateDayTitle: (weekId: string, dayId: string, title: string) => void;
  duplicateDay: (weekId: string, dayId: string) => void;
  deleteDay: (weekId: string, dayId: string) => void;
  
  // Exercises
  addExercise: (weekId: string, dayId: string, phaseType: PhaseType) => void;
  updateExercise: (weekId: string, dayId: string, phaseType: PhaseType, exerciseId: string, patch: Partial<Exercise>) => void;
  duplicateExercise: (weekId: string, dayId: string, phaseType: PhaseType, exerciseId: string) => void;
  deleteExercise: (weekId: string, dayId: string, phaseType: PhaseType, exerciseId: string) => void;
  
  // System
  loadPlan: (planId: string) => Promise<void>;
  save: () => void;
  reset: () => void;
}

export const usePlanStore = create<PlanStore>((set, get) => ({
  plan: null,
  isSaving: false,

  setPlanName: (name) => {
    const plan = get().plan;
    if (!plan) return;
    set({ plan: { ...plan, name, updatedAt: new Date().toISOString() } });
    get().save();
  },

  setObjective: (objective) => {
    const plan = get().plan;
    if (!plan) return;
    set({ plan: { ...plan, objective, updatedAt: new Date().toISOString() } });
    get().save();
  },

  setDurationWeeks: (n) => {
    const plan = get().plan;
    if (!plan || n < 1 || n > 52) return;
    
    const currentWeeks = plan.weeks.length;
    let newWeeks = [...plan.weeks];
    
    if (n > currentWeeks) {
      // Add weeks
      for (let i = currentWeeks; i < n; i++) {
        newWeeks.push(makeWeek(i + 1));
      }
    } else if (n < currentWeeks) {
      // Remove weeks
      newWeeks = newWeeks.slice(0, n);
    }
    
    set({ plan: { ...plan, durationWeeks: n, weeks: newWeeks, updatedAt: new Date().toISOString() } });
    get().save();
  },

  addWeek: () => {
    const plan = get().plan;
    if (!plan) return;
    
    const newWeek = makeWeek(plan.weeks.length + 1);
    set({ plan: { ...plan, weeks: [...plan.weeks, newWeek], updatedAt: new Date().toISOString() } });
    get().save();
  },

  duplicateWeek: (weekId) => {
    const plan = get().plan;
    if (!plan) return;
    
    const weekIndex = plan.weeks.findIndex(w => w.id === weekId);
    if (weekIndex === -1) return;
    
    const originalWeek = plan.weeks[weekIndex];
    const newWeek: Week = {
      id: crypto.randomUUID(),
      index: plan.weeks.length + 1,
      days: originalWeek.days.map(day => ({
        ...day,
        id: crypto.randomUUID(),
        phases: day.phases.map(phase => ({
          ...phase,
          id: crypto.randomUUID(),
          exercises: phase.exercises.map(ex => ({ ...ex, id: crypto.randomUUID() }))
        }))
      }))
    };
    
    set({ plan: { ...plan, weeks: [...plan.weeks, newWeek], updatedAt: new Date().toISOString() } });
    get().save();
  },

  deleteWeek: (weekId) => {
    const plan = get().plan;
    if (!plan || plan.weeks.length <= 1) return;
    
    const newWeeks = plan.weeks.filter(w => w.id !== weekId).map((w, i) => ({ ...w, index: i + 1 }));
    set({ plan: { ...plan, weeks: newWeeks, updatedAt: new Date().toISOString() } });
    get().save();
  },

  addDay: (weekId) => {
    const plan = get().plan;
    if (!plan) return;
    
    const newWeeks = plan.weeks.map(week => {
      if (week.id === weekId) {
        const newDay = makeDay(week.days.length + 1);
        return { ...week, days: [...week.days, newDay] };
      }
      return week;
    });
    
    set({ plan: { ...plan, weeks: newWeeks, updatedAt: new Date().toISOString() } });
    get().save();
  },

  updateDayTitle: (weekId, dayId, title) => {
    const plan = get().plan;
    if (!plan) return;
    
    const newWeeks = plan.weeks.map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: week.days.map(day => 
            day.id === dayId ? { ...day, title } : day
          )
        };
      }
      return week;
    });
    
    set({ plan: { ...plan, weeks: newWeeks, updatedAt: new Date().toISOString() } });
    get().save();
  },

  duplicateDay: (weekId, dayId) => {
    const plan = get().plan;
    if (!plan) return;
    
    const newWeeks = plan.weeks.map(week => {
      if (week.id === weekId) {
        const dayIndex = week.days.findIndex(d => d.id === dayId);
        if (dayIndex === -1) return week;
        
        const originalDay = week.days[dayIndex];
        const newDay: Day = {
          id: crypto.randomUUID(),
          title: `${originalDay.title} (copia)`,
          order: week.days.length + 1,
          phases: originalDay.phases.map(phase => ({
            ...phase,
            id: crypto.randomUUID(),
            exercises: phase.exercises.map(ex => ({ ...ex, id: crypto.randomUUID() }))
          }))
        };
        
        return { ...week, days: [...week.days, newDay] };
      }
      return week;
    });
    
    set({ plan: { ...plan, weeks: newWeeks, updatedAt: new Date().toISOString() } });
    get().save();
  },

  deleteDay: (weekId, dayId) => {
    const plan = get().plan;
    if (!plan) return;
    
    const newWeeks = plan.weeks.map(week => {
      if (week.id === weekId && week.days.length > 1) {
        const newDays = week.days.filter(d => d.id !== dayId).map((d, i) => ({ ...d, order: i + 1 }));
        return { ...week, days: newDays };
      }
      return week;
    });
    
    set({ plan: { ...plan, weeks: newWeeks, updatedAt: new Date().toISOString() } });
    get().save();
  },

  addExercise: (weekId, dayId, phaseType) => {
    const plan = get().plan;
    if (!plan) return;
    
    const newWeeks = plan.weeks.map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: week.days.map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                phases: day.phases.map(phase => {
                  if (phase.type === phaseType) {
                    const newExercise = makeExercise(phase.exercises.length + 1);
                    return { ...phase, exercises: [...phase.exercises, newExercise] };
                  }
                  return phase;
                })
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    
    set({ plan: { ...plan, weeks: newWeeks, updatedAt: new Date().toISOString() } });
    get().save();
  },

  updateExercise: (weekId, dayId, phaseType, exerciseId, patch) => {
    const plan = get().plan;
    if (!plan) return;
    
    const newWeeks = plan.weeks.map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: week.days.map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                phases: day.phases.map(phase => {
                  if (phase.type === phaseType) {
                    return {
                      ...phase,
                      exercises: phase.exercises.map(ex => 
                        ex.id === exerciseId ? { ...ex, ...patch } : ex
                      )
                    };
                  }
                  return phase;
                })
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    
    set({ plan: { ...plan, weeks: newWeeks, updatedAt: new Date().toISOString() } });
    get().save();
  },

  duplicateExercise: (weekId, dayId, phaseType, exerciseId) => {
    const plan = get().plan;
    if (!plan) return;
    
    const newWeeks = plan.weeks.map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: week.days.map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                phases: day.phases.map(phase => {
                  if (phase.type === phaseType) {
                    const exIndex = phase.exercises.findIndex(ex => ex.id === exerciseId);
                    if (exIndex === -1) return phase;
                    
                    const original = phase.exercises[exIndex];
                    const duplicate = { ...original, id: crypto.randomUUID(), order: phase.exercises.length + 1 };
                    return { ...phase, exercises: [...phase.exercises, duplicate] };
                  }
                  return phase;
                })
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    
    set({ plan: { ...plan, weeks: newWeeks, updatedAt: new Date().toISOString() } });
    get().save();
  },

  deleteExercise: (weekId, dayId, phaseType, exerciseId) => {
    const plan = get().plan;
    if (!plan) return;
    
    const newWeeks = plan.weeks.map(week => {
      if (week.id === weekId) {
        return {
          ...week,
          days: week.days.map(day => {
            if (day.id === dayId) {
              return {
                ...day,
                phases: day.phases.map(phase => {
                  if (phase.type === phaseType) {
                    const newExercises = phase.exercises
                      .filter(ex => ex.id !== exerciseId)
                      .map((ex, i) => ({ ...ex, order: i + 1 }));
                    return { ...phase, exercises: newExercises };
                  }
                  return phase;
                })
              };
            }
            return day;
          })
        };
      }
      return week;
    });
    
    set({ plan: { ...plan, weeks: newWeeks, updatedAt: new Date().toISOString() } });
    get().save();
  },

  loadPlan: async (planId) => {
    // Try localStorage first
    const stored = localStorage.getItem(`${STORAGE_KEY}.${planId}`);
    if (stored) {
      try {
        const plan = JSON.parse(stored);
        set({ plan });
        return;
      } catch (e) {
        console.error('Failed to parse stored plan:', e);
      }
    }
    
    // Create new plan if nothing found
    const newPlan = makePlan();
    newPlan.id = planId;
    set({ plan: newPlan });
    get().save();
  },

  save: () => {
    const { plan, isSaving } = get();
    if (!plan || isSaving) return;
    
    set({ isSaving: true });
    
    setTimeout(() => {
      try {
        localStorage.setItem(`${STORAGE_KEY}.${plan.id}`, JSON.stringify(plan));
        set({ isSaving: false });
      } catch (e) {
        console.error('Failed to save plan:', e);
        set({ isSaving: false });
      }
    }, 500);
  },

  reset: () => {
    const plan = get().plan;
    if (!plan) return;
    
    const newPlan = makePlan();
    newPlan.id = plan.id;
    set({ plan: newPlan });
    get().save();
  }
}));
