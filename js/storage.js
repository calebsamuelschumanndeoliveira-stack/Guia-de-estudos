/* storage.js — guarda os dados no navegador (localStorage) ou na nuvem (Supabase).
   A leitura é assíncrona só no início (init); o resto da app usa get/set normais. */
const Store = (() => {
  const KEY = "guia-estudos-v1";

  const seed = {
    subjects: [
      { id: uid(), name: "Matemática", teacher: "", color: "#4f6df5" },
      { id: uid(), name: "História", teacher: "", color: "#e8a13a" },
    ],
    tasks: [
      { id: uid(), title: "Revisar funções do 2º grau", subjectId: null, due: "", priority: "alta", done: false },
      { id: uid(), title: "Ler capítulo 4 — Revolução Industrial", subjectId: null, due: "", priority: "media", done: false },
      { id: uid(), title: "Fazer lista de exercícios 1", subjectId: null, due: "", priority: "baixa", done: true },
    ],
    slots: [],
    grades: [],
    goals: [
      { id: uid(), title: "Estudar 20h esta semana", current: 6, target: 20, unit: "h" },
    ],
    settings: { theme: "light" },
  };

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  let state = structuredClone(seed);
  let backend = { mode: "local" };   // ou { mode: "cloud", client, userId }
  let saveTimer = null;

  function mergeSeed(data) {
    return { ...structuredClone(seed), ...data, settings: { ...seed.settings, ...(data.settings || {}) } };
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(seed);
      return mergeSeed(JSON.parse(raw));
    } catch (e) {
      console.error("Erro ao carregar dados locais:", e);
      return structuredClone(seed);
    }
  }

  // Carrega o estado do backend ativo (chamado uma vez, no início)
  async function init() {
    if (backend.mode === "cloud") {
      try {
        const { data, error } = await backend.client
          .from("user_data").select("data").eq("user_id", backend.userId).maybeSingle();
        if (error) throw error;
        if (data && data.data) {
          state = mergeSeed(data.data);
        } else {
          // primeiro acesso deste usuário: cria a linha com dados de exemplo
          state = structuredClone(seed);
          await backend.client.from("user_data").insert({ user_id: backend.userId, data: state });
        }
      } catch (e) {
        console.error("Erro ao carregar da nuvem:", e);
        state = structuredClone(seed);
      }
    } else {
      state = loadLocal();
    }
  }

  // Salva (com pequeno atraso na nuvem para não disparar a cada tecla)
  function persist() {
    if (backend.mode === "cloud") {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        try {
          const { error } = await backend.client.from("user_data").upsert(
            { user_id: backend.userId, data: state, updated_at: new Date().toISOString() },
            { onConflict: "user_id" }
          );
          if (error) throw error;
        } catch (e) {
          console.error("Erro ao salvar na nuvem:", e);
        }
      }, 600);
    } else {
      localStorage.setItem(KEY, JSON.stringify(state));
    }
  }

  return {
    uid,
    init,
    setLocal: () => { backend = { mode: "local" }; },
    setCloud: (client, userId) => { backend = { mode: "cloud", client, userId }; },
    isCloud: () => backend.mode === "cloud",
    get: () => state,
    set: (mutator) => { mutator(state); persist(); },
    replace: (newState) => { state = mergeSeed(newState); persist(); },
    export: () => JSON.stringify(state, null, 2),
    reset: () => { state = structuredClone(seed); persist(); },
  };
})();
