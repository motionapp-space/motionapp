import { create } from "zustand";
import { supabase } from "@/integrations/supabase/client";
import type { Client, ClientTag, ClientStatus, ClientWithTags, ClientWithDetails, PlanStatus, ActivityType } from "@/types/client";
import { toast } from "sonner";

interface ClientFilters {
  search: string;
  status?: ClientStatus;
  tagId?: string;
  sortBy: "name_asc" | "name_desc" | "created_asc" | "created_desc" | "updated_asc" | "updated_desc";
}

interface ClientStore {
  clients: ClientWithTags[];
  currentClient: ClientWithDetails | null;
  tags: ClientTag[];
  filters: ClientFilters;
  isLoading: boolean;
  isSaving: boolean;
  
  // List operations
  loadClients: () => Promise<void>;
  setFilters: (filters: Partial<ClientFilters>) => void;
  
  // CRUD operations
  loadClient: (id: string) => Promise<void>;
  createClient: (data: Partial<Client>) => Promise<string | null>;
  updateClient: (id: string, data: Partial<Client>) => Promise<void>;
  archiveClient: (id: string) => Promise<void>;
  
  // Tag operations
  loadTags: () => Promise<void>;
  addTagToClient: (clientId: string, tagLabel: string, color?: string) => Promise<void>;
  removeTagFromClient: (clientId: string, tagId: string) => Promise<void>;
  
  // Assignment operations
  assignPlan: (clientId: string, planId: string, note?: string) => Promise<void>;
  updateAssignment: (assignmentId: string, status: string) => Promise<void>;
  
  // Activity logging
  logActivity: (clientId: string, type: string, message: string) => Promise<void>;
  
  reset: () => void;
}

const defaultFilters: ClientFilters = {
  search: "",
  sortBy: "updated_desc",
};

export const useClientStore = create<ClientStore>((set, get) => ({
  clients: [],
  currentClient: null,
  tags: [],
  filters: defaultFilters,
  isLoading: false,
  isSaving: false,

  loadClients: async () => {
    set({ isLoading: true });
    try {
      const { user } = (await supabase.auth.getUser()).data;
      if (!user) throw new Error("Not authenticated");

      let query = supabase
        .from("clients")
        .select(`
          *,
          client_tag_on_client!inner(
            tag:client_tags(*)
          )
        `)
        .eq("coach_id", user.id);

      const { filters } = get();

      // Apply filters
      if (filters.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`);
      }

      if (filters.status) {
        query = query.eq("status", filters.status);
      } else {
        // Default: exclude archived
        query = query.neq("status", "ARCHIVIATO");
      }

      // Apply sorting
      switch (filters.sortBy) {
        case "name_asc":
          query = query.order("last_name").order("first_name");
          break;
        case "name_desc":
          query = query.order("last_name", { ascending: false }).order("first_name", { ascending: false });
          break;
        case "created_asc":
          query = query.order("created_at");
          break;
        case "created_desc":
          query = query.order("created_at", { ascending: false });
          break;
        case "updated_asc":
          query = query.order("updated_at");
          break;
        case "updated_desc":
          query = query.order("updated_at", { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to include tags
      const clientsWithTags = (data || []).map((client: any) => ({
        ...client,
        tags: client.client_tag_on_client?.map((ctc: any) => ctc.tag).filter(Boolean) || [],
      }));

      set({ clients: clientsWithTags });
    } catch (error: any) {
      console.error("Error loading clients:", error);
      toast.error("Errore nel caricamento dei clienti");
    } finally {
      set({ isLoading: false });
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }));
    get().loadClients();
  },

  loadClient: async (id: string) => {
    set({ isLoading: true, currentClient: null });
    try {
      // Load client with all related data
      const [clientRes, tagsRes, measurementsRes, activitiesRes] = await Promise.all([
        supabase.from("clients").select("*").eq("id", id).single(),
        supabase
          .from("client_tag_on_client")
          .select("tag:client_tags(*)")
          .eq("client_id", id),
        supabase
          .from("measurements")
          .select("*")
          .eq("client_id", id)
          .order("date", { ascending: false })
          .limit(10),
        supabase
          .from("client_activities")
          .select("*")
          .eq("client_id", id)
          .order("created_at", { ascending: false })
          .limit(20),
      ]);

      if (clientRes.error) throw clientRes.error;

      const client: ClientWithDetails = {
        ...clientRes.data,
        tags: tagsRes.data?.map((ctc: any) => ctc.tag).filter(Boolean) || [],
        measurements: measurementsRes.data || [],
        activities: activitiesRes.data || [],
      };

      set({ currentClient: client });
    } catch (error: any) {
      console.error("Error loading client:", error);
      toast.error("Errore nel caricamento del cliente");
    } finally {
      set({ isLoading: false });
    }
  },

  createClient: async (data) => {
    set({ isSaving: true });
    try {
      const { user } = (await supabase.auth.getUser()).data;
      if (!user) throw new Error("Not authenticated");

      const { data: newClient, error } = await supabase
        .from("clients")
        .insert([{
          coach_id: user.id,
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email,
          phone: data.phone,
          birth_date: data.birth_date,
          sex: data.sex,
          status: data.status || "POTENZIALE",
          notes: data.notes,
        }])
        .select()
        .single();

      if (error) throw error;

      // Log activity
      await get().logActivity(newClient.id, "CREATED", `Cliente creato: ${data.first_name} ${data.last_name}`);

      toast.success("Cliente creato con successo");
      await get().loadClients();
      
      return newClient.id;
    } catch (error: any) {
      console.error("Error creating client:", error);
      toast.error("Errore nella creazione del cliente");
      return null;
    } finally {
      set({ isSaving: false });
    }
  },

  updateClient: async (id, data) => {
    set({ isSaving: true });
    try {
      const { error } = await supabase
        .from("clients")
        .update(data)
        .eq("id", id);

      if (error) throw error;

      // Log activity
      await get().logActivity(id, "UPDATED", "Cliente aggiornato");

      toast.success("Cliente aggiornato con successo");
      await get().loadClients();
      if (get().currentClient?.id === id) {
        await get().loadClient(id);
      }
    } catch (error: any) {
      console.error("Error updating client:", error);
      toast.error("Errore nell'aggiornamento del cliente");
    } finally {
      set({ isSaving: false });
    }
  },

  archiveClient: async (id) => {
    set({ isSaving: true });
    try {
      const { error } = await supabase
        .from("clients")
        .update({ status: "ARCHIVIATO" })
        .eq("id", id);

      if (error) throw error;

      // Log activity
      await get().logActivity(id, "ARCHIVED", "Cliente archiviato");

      toast.success("Cliente archiviato");
      await get().loadClients();
    } catch (error: any) {
      console.error("Error archiving client:", error);
      toast.error("Errore nell'archiviazione del cliente");
    } finally {
      set({ isSaving: false });
    }
  },

  loadTags: async () => {
    try {
      const { user } = (await supabase.auth.getUser()).data;
      if (!user) return;

      const { data, error } = await supabase
        .from("client_tags")
        .select("*")
        .eq("coach_id", user.id)
        .order("label");

      if (error) throw error;

      set({ tags: data || [] });
    } catch (error) {
      console.error("Error loading tags:", error);
    }
  },

  addTagToClient: async (clientId, tagLabel, color) => {
    try {
      const { user } = (await supabase.auth.getUser()).data;
      if (!user) throw new Error("Not authenticated");

      // Find or create tag
      let tag = get().tags.find((t) => t.label === tagLabel);
      
      if (!tag) {
        const { data: newTag, error: tagError } = await supabase
          .from("client_tags")
          .insert({ coach_id: user.id, label: tagLabel, color })
          .select()
          .single();

        if (tagError) throw tagError;
        tag = newTag;
        await get().loadTags();
      }

      // Add tag to client
      const { error } = await supabase
        .from("client_tag_on_client")
        .insert({ client_id: clientId, tag_id: tag.id });

      if (error) throw error;

      // Log activity
      await get().logActivity(clientId, "TAGGED", `Tag aggiunto: ${tagLabel}`);

      toast.success("Tag aggiunto");
      await get().loadClient(clientId);
    } catch (error: any) {
      console.error("Error adding tag:", error);
      toast.error("Errore nell'aggiunta del tag");
    }
  },

  removeTagFromClient: async (clientId, tagId) => {
    try {
      const { error } = await supabase
        .from("client_tag_on_client")
        .delete()
        .eq("client_id", clientId)
        .eq("tag_id", tagId);

      if (error) throw error;

      toast.success("Tag rimosso");
      await get().loadClient(clientId);
    } catch (error: any) {
      console.error("Error removing tag:", error);
      toast.error("Errore nella rimozione del tag");
    }
  },

  assignPlan: async (clientId, planId, note) => {
    try {
      // This method is deprecated - use FSM API instead
      toast.error("Usare FSM API per assegnare piani");
    } catch (error: any) {
      console.error("Error assigning plan:", error);
      toast.error("Errore nell'assegnazione del piano");
    }
  },

  updateAssignment: async (assignmentId, status) => {
    try {
      // This method is deprecated - use FSM API instead
      toast.error("Usare FSM API per aggiornare lo stato");
    } catch (error: any) {
      console.error("Error updating assignment:", error);
      toast.error("Errore nell'aggiornamento");
    }
  },

  logActivity: async (clientId, type, message) => {
    try {
      await supabase
        .from("client_activities")
        .insert([{
          client_id: clientId,
          type: type as any,
          message,
        }]);
    } catch (error) {
      console.error("Error logging activity:", error);
    }
  },

  reset: () => {
    set({
      clients: [],
      currentClient: null,
      tags: [],
      filters: defaultFilters,
      isLoading: false,
      isSaving: false,
    });
  },
}));
