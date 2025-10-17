import { create } from 'zustand';
import { Plan, Day, Exercise, PhaseType, Objective, makeDay, makeExercise, makePlan } from '@/types/plan';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const STORAGE_KEY = 'planpal.currentPlan';
let saveTimeout: NodeJS.Timeout | null = null;

interface PlanStore {
  plan: Plan | null;
  plans: Plan[];
  isSaving: boolean;
  
  // Meta
  setPlanName: (name: string) => void;
  setObjective: (objective: Objective) => void;
  setDurationWeeks: (n: number) => void;
  
  // Days
  addDay: () => void;
  updateDayTitle: (dayId: string, title: string) => void;
  duplicateDay: (dayId: string) => void;
  deleteDay: (dayId: string) => void;
  
  // Exercises
  addExercise: (dayId: string, phaseType: PhaseType) => void;
  updateExercise: (dayId: string, phaseType: PhaseType, exerciseId: string, patch: Partial<Exercise>) => void;
  duplicateExercise: (dayId: string, phaseType: PhaseType, exerciseId: string) => void;
  deleteExercise: (dayId: string, phaseType: PhaseType, exerciseId: string) => void;
  
  // System
  loadPlan: (planId: string) => Promise<void>;
  loadPlans: () => Promise<void>;
  save: () => void;
  reset: () => void;
}

export const usePlanStore = create<PlanStore>((set, get) => ({
  plan: null,
  plans: [],
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
    set({ plan: { ...plan, durationWeeks: n, updatedAt: new Date().toISOString() } });
    get().save();
  },

  addDay: () => {
    const plan = get().plan;
    if (!plan) return;
    
    // Ensure days array exists
    const days = Array.isArray(plan.days) ? [...plan.days] : [];
    
    // Create new day with next sequential number
    const nextOrder = days.length + 1;
    const newDay = makeDay(nextOrder);
    days.push(newDay);
    
    // Reindex orders (defensive)
    days.forEach((d, i) => (d.order = i + 1));
    
    set({ plan: { ...plan, days, updatedAt: new Date().toISOString() } });
    get().save();
    
    // Show success feedback
    toast.success("Giorno aggiunto");
  },

  updateDayTitle: (dayId, title) => {
    const plan = get().plan;
    if (!plan) return;
    
    const newDays = plan.days.map(day => 
      day.id === dayId ? { ...day, title } : day
    );
    
    set({ plan: { ...plan, days: newDays, updatedAt: new Date().toISOString() } });
    get().save();
  },

  duplicateDay: (dayId) => {
    const plan = get().plan;
    if (!plan) return;
    
    const dayIndex = plan.days.findIndex(d => d.id === dayId);
    if (dayIndex === -1) return;
    
    const originalDay = plan.days[dayIndex];
    const totalDays = plan.days.length;
    
    const newDay: Day = {
      id: crypto.randomUUID(),
      title: `Giorno ${totalDays + 1}`,
      order: totalDays + 1,
      phases: originalDay.phases.map(phase => ({
        ...phase,
        id: crypto.randomUUID(),
        exercises: phase.exercises.map(ex => ({ ...ex, id: crypto.randomUUID() }))
      })),
      focusMuscle: originalDay.focusMuscle
    };
    
    const newDays = [...plan.days, newDay];
    set({ plan: { ...plan, days: newDays, updatedAt: new Date().toISOString() } });
    get().save();
  },

  deleteDay: (dayId) => {
    const plan = get().plan;
    if (!plan) return;
    
    // Prevent deletion if it's the last day
    if (plan.days.length <= 1) {
      toast.error("Non puoi eliminare l'unico giorno del piano.");
      return;
    }
    
    const newDays = plan.days
      .filter(d => d.id !== dayId)
      .map((d, i) => ({ ...d, order: i + 1 }));
    
    set({ plan: { ...plan, days: newDays, updatedAt: new Date().toISOString() } });
    get().save();
  },

  addExercise: (dayId, phaseType) => {
    const plan = get().plan;
    if (!plan) return;
    
    const newDays = plan.days.map(day => {
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
    });
    
    set({ plan: { ...plan, days: newDays, updatedAt: new Date().toISOString() } });
    get().save();
  },

  updateExercise: (dayId, phaseType, exerciseId, patch) => {
    const plan = get().plan;
    if (!plan) return;
    
    const newDays = plan.days.map(day => {
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
    });
    
    set({ plan: { ...plan, days: newDays, updatedAt: new Date().toISOString() } });
    get().save();
  },

  duplicateExercise: (dayId, phaseType, exerciseId) => {
    const plan = get().plan;
    if (!plan) return;
    
    const newDays = plan.days.map(day => {
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
    });
    
    set({ plan: { ...plan, days: newDays, updatedAt: new Date().toISOString() } });
    get().save();
  },

  deleteExercise: (dayId, phaseType, exerciseId) => {
    const plan = get().plan;
    if (!plan) return;
    
    const newDays = plan.days.map(day => {
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
    });
    
    set({ plan: { ...plan, days: newDays, updatedAt: new Date().toISOString() } });
    get().save();
  },

  loadPlan: async (planId) => {
    try {
      // Load from Supabase database
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("id", planId)
        .single();

      if (error) throw error;

      if (data) {
        // Convert database format to internal Plan format
        const contentJson = data.content_json as any;
        const plan: Plan = {
          id: data.id,
          name: data.name,
          objective: data.goal as Objective || "Strength",
          durationWeeks: data.duration_weeks || 4,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          days: contentJson?.days || [],
        };
        set({ plan });
        
        // Also cache in localStorage for offline access
        localStorage.setItem(`${STORAGE_KEY}.${planId}`, JSON.stringify(plan));
        return;
      }
    } catch (e) {
      console.error('Failed to load plan from database:', e);
      
      // Try localStorage as fallback
      const stored = localStorage.getItem(`${STORAGE_KEY}.${planId}`);
      if (stored) {
        try {
          const plan = JSON.parse(stored);
          set({ plan });
          return;
        } catch (parseError) {
          console.error('Failed to parse stored plan:', parseError);
        }
      }
    }
    
    // Create new plan if nothing found
    const newPlan = makePlan();
    newPlan.id = planId;
    set({ plan: newPlan });
    get().save();
  },

  loadPlans: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .eq("coach_id", user.id)
        .eq("is_template", false)
        .order("updated_at", { ascending: false });

      if (error) throw error;

      // Transform content_json to match Plan interface
      const plans: Plan[] = (data || []).map(row => ({
        id: row.id,
        name: row.name,
        objective: row.goal as Objective,
        durationWeeks: row.duration_weeks,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        days: (row.content_json as any)?.days || [],
      }));

      set({ plans });
    } catch (error) {
      console.error('Error loading plans:', error);
    }
  },

  save: () => {
    const { plan, isSaving } = get();
    if (!plan) return;
    
    // Clear any existing timeout
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Don't set isSaving immediately to avoid flickering
    saveTimeout = setTimeout(async () => {
      if (isSaving) return; // Prevent concurrent saves
      
      set({ isSaving: true });
      
      try {
        // Save to localStorage for offline access
        localStorage.setItem(`${STORAGE_KEY}.${plan.id}`, JSON.stringify(plan));
        
        // Save to Supabase database
        const { error } = await supabase
          .from("plans")
          .update({
            name: plan.name, // Preserve exact casing
            goal: plan.objective,
            duration_weeks: plan.durationWeeks,
            content_json: { days: plan.days } as any,
            updated_at: new Date().toISOString(),
          })
          .eq("id", plan.id);

        if (error) throw error;
        
        // Show saved state for a moment
        setTimeout(() => {
          set({ isSaving: false });
        }, 300);
      } catch (e) {
        console.error('Failed to save plan:', e);
        set({ isSaving: false });
        toast.error("Errore nel salvataggio del piano");
      }
    }, 1000); // 1 second debounce
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
