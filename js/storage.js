/* storage.js — persistência simples no navegador (localStorage) */
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
    slots: [], // { id, day (0-6), time, subjectId, label }
    grades: [], // { id, subjectId, name, grade, weight, max }
    goals: [
      { id: uid(), title: "Estudar 20h esta semana", current: 6, target: 20, unit: "h" },
    ],
    settings: { theme: "light" },
  };

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return structuredClone(seed);
      const data = JSON.parse(raw);
      // garante todas as chaves
      return { ...structuredClone(seed), ...data, settings: { ...seed.settings, ...(data.settings || {}) } };
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
      return structuredClone(seed);
    }
  }

  let state = load();

  function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  return {
    uid,
    get: () => state,
    set: (mutator) => { mutator(state); save(); },
    replace: (newState) => { state = newState; save(); },
    export: () => JSON.stringify(state, null, 2),
    reset: () => { state = structuredClone(seed); save(); },
  };
})();
