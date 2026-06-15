/* app.js — lógica e renderização das telas */
(() => {
  const DAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  const COLORS = ["#4f6df5", "#e8a13a", "#1fa971", "#e25563", "#9b59f5", "#16b5c4", "#f0667e", "#7b8794"];
  const PRIORITIES = { alta: "Alta", media: "Média", baixa: "Baixa" };

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- Utilidades ----------
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => (t.hidden = true), 2200);
  }

  function subjectById(id) {
    return Store.get().subjects.find((s) => s.id === id);
  }

  function todayISO() {
    return new Date().toISOString().slice(0, 10);
  }

  function fmtDate(iso) {
    if (!iso) return "";
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y.slice(2)}`;
  }

  // ---------- Modal ----------
  const modal = {
    open(title, bodyHTML, onMount) {
      $("#modalTitle").textContent = title;
      $("#modalBody").innerHTML = bodyHTML;
      $("#modal").hidden = false;
      if (onMount) onMount($("#modalBody"));
    },
    close() {
      $("#modal").hidden = true;
      $("#modalBody").innerHTML = "";
    },
  };
  $("#modalClose").onclick = modal.close;
  $("#modal").addEventListener("click", (e) => { if (e.target.id === "modal") modal.close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") modal.close(); });

  function subjectOptions(selectedId) {
    const opts = Store.get().subjects.map((s) =>
      `<option value="${s.id}" ${s.id === selectedId ? "selected" : ""}>${esc(s.name)}</option>`
    ).join("");
    return `<option value="">— Sem matéria —</option>${opts}`;
  }

  // ============================================================
  //  PAINEL (Dashboard)
  // ============================================================
  function renderDashboard() {
    const { subjects, tasks, goals } = Store.get();
    const done = tasks.filter((t) => t.done).length;
    const pct = tasks.length ? Math.round((done / tasks.length) * 100) : 0;
    const pending = tasks.filter((t) => !t.done);
    const overdue = pending.filter((t) => t.due && t.due < todayISO()).length;
    const nextUp = pending
      .filter((t) => t.due)
      .sort((a, b) => a.due.localeCompare(b.due))
      .slice(0, 5);

    $("#view-dashboard").innerHTML = `
      <div class="view-head">
        <div><h2>📊 Painel</h2><p>Seu progresso de estudos num relance</p></div>
      </div>

      <div class="cards">
        <div class="card stat-card">
          <span class="stat-label">📘 Matérias</span>
          <span class="stat-value">${subjects.length}</span>
          <span class="stat-sub">cadastradas</span>
        </div>
        <div class="card stat-card">
          <span class="stat-label">✅ Tarefas concluídas</span>
          <span class="stat-value">${done}/${tasks.length}</span>
          <span class="stat-sub">${pct}% do total</span>
        </div>
        <div class="card stat-card">
          <span class="stat-label">⏳ Pendentes</span>
          <span class="stat-value">${pending.length}</span>
          <span class="stat-sub">${overdue > 0 ? `<span class="overdue">${overdue} atrasada(s)</span>` : "em dia 🎉"}</span>
        </div>
        <div class="card stat-card">
          <span class="stat-label">🎯 Metas ativas</span>
          <span class="stat-value">${goals.length}</span>
          <span class="stat-sub">acompanhe na aba Metas</span>
        </div>
      </div>

      <div class="card" style="margin-top:24px">
        <div style="display:flex;justify-content:space-between;margin-bottom:10px">
          <strong>Progresso geral das tarefas</strong><span style="color:var(--text-soft)">${pct}%</span>
        </div>
        <div class="progress"><span style="width:${pct}%"></span></div>
      </div>

      <div class="section-title">📅 Próximos prazos</div>
      ${nextUp.length ? `<div class="task-list">${nextUp.map(taskRow).join("")}</div>`
        : `<div class="empty"><div class="emoji">🌿</div><p>Nenhum prazo próximo. Aproveite para adiantar a matéria!</p></div>`}
    `;
    bindTaskRows($("#view-dashboard"));
  }

  // ============================================================
  //  MATÉRIAS
  // ============================================================
  function renderSubjects() {
    const { subjects, tasks } = Store.get();
    $("#view-subjects").innerHTML = `
      <div class="view-head">
        <div><h2>📘 Matérias</h2><p>Organize suas disciplinas</p></div>
        <button class="btn btn-primary" id="addSubject">＋ Nova matéria</button>
      </div>
      ${subjects.length ? `<div class="cards">${subjects.map((s) => {
        const st = tasks.filter((t) => t.subjectId === s.id);
        const done = st.filter((t) => t.done).length;
        return `
          <div class="card subject-card" style="border-left-color:${s.color}">
            <div class="card-actions">
              <button class="icon-btn" data-edit="${s.id}" title="Editar">✏️</button>
              <button class="icon-btn" data-del="${s.id}" title="Excluir">🗑️</button>
            </div>
            <h3>${esc(s.name)}</h3>
            <div class="muted">${s.teacher ? "Prof. " + esc(s.teacher) : "&nbsp;"}</div>
            <div class="progress"><span style="width:${st.length ? (done / st.length) * 100 : 0}%;background:${s.color}"></span></div>
            <div class="mini-stat"><span>${done}/${st.length} tarefas</span><span>${st.length ? Math.round((done / st.length) * 100) : 0}%</span></div>
          </div>`;
      }).join("")}</div>`
      : `<div class="empty"><div class="emoji">📭</div><p>Nenhuma matéria ainda. Clique em “Nova matéria” para começar!</p></div>`}
    `;

    $("#addSubject").onclick = () => subjectForm();
    $$("[data-edit]", $("#view-subjects")).forEach((b) => (b.onclick = () => subjectForm(b.dataset.edit)));
    $$("[data-del]", $("#view-subjects")).forEach((b) => (b.onclick = () => {
      if (confirm("Excluir esta matéria? As tarefas e notas dela ficarão sem matéria.")) {
        Store.set((s) => {
          s.subjects = s.subjects.filter((x) => x.id !== b.dataset.del);
          s.tasks.forEach((t) => { if (t.subjectId === b.dataset.del) t.subjectId = null; });
          s.grades = s.grades.filter((g) => g.subjectId !== b.dataset.del);
          s.slots = s.slots.filter((sl) => sl.subjectId !== b.dataset.del);
        });
        renderAll();
        toast("Matéria excluída");
      }
    }));
  }

  function subjectForm(id) {
    const s = id ? subjectById(id) : { name: "", teacher: "", color: COLORS[0] };
    modal.open(id ? "Editar matéria" : "Nova matéria", `
      <div class="form-grid">
        <div class="field"><label>Nome</label><input id="f-name" value="${esc(s.name)}" placeholder="Ex.: Biologia" /></div>
        <div class="field"><label>Professor(a) (opcional)</label><input id="f-teacher" value="${esc(s.teacher)}" placeholder="Ex.: Ana" /></div>
        <div class="field"><label>Cor</label><div class="color-row" id="f-colors">
          ${COLORS.map((c) => `<div class="color-dot ${c === s.color ? "sel" : ""}" data-color="${c}" style="background:${c}"></div>`).join("")}
        </div></div>
        <div class="modal-actions">
          <button class="btn btn-light" id="f-cancel">Cancelar</button>
          <button class="btn btn-primary" id="f-save">Salvar</button>
        </div>
      </div>
    `, (body) => {
      let color = s.color;
      $$(".color-dot", body).forEach((d) => (d.onclick = () => {
        $$(".color-dot", body).forEach((x) => x.classList.remove("sel"));
        d.classList.add("sel");
        color = d.dataset.color;
      }));
      $("#f-cancel", body).onclick = modal.close;
      $("#f-save", body).onclick = () => {
        const name = $("#f-name", body).value.trim();
        if (!name) return toast("Dê um nome à matéria");
        const teacher = $("#f-teacher", body).value.trim();
        Store.set((st) => {
          if (id) Object.assign(subjectById(id), { name, teacher, color });
          else st.subjects.push({ id: Store.uid(), name, teacher, color });
        });
        modal.close(); renderAll(); toast(id ? "Matéria atualizada" : "Matéria criada");
      };
    });
  }

  // ============================================================
  //  TAREFAS
  // ============================================================
  let taskFilter = "todas";

  function taskRow(t) {
    const sub = subjectById(t.subjectId);
    const over = !t.done && t.due && t.due < todayISO();
    return `
      <div class="task ${t.done ? "done" : ""}" data-id="${t.id}">
        <div class="check ${t.done ? "on" : ""}" data-check="${t.id}">${t.done ? "✓" : ""}</div>
        <div class="task-main">
          <div class="task-title">${esc(t.title)}</div>
          <div class="task-meta">
            ${sub ? `<span class="tag-dot" style="--c:${sub.color}">${esc(sub.name)}</span>` : ""}
            <span class="tag prio-${t.priority}">${PRIORITIES[t.priority]}</span>
            ${t.due ? `<span class="${over ? "overdue" : ""}">📅 ${fmtDate(t.due)}${over ? " (atrasada)" : ""}</span>` : ""}
          </div>
        </div>
        <button class="icon-btn" data-edit="${t.id}" title="Editar">✏️</button>
        <button class="icon-btn" data-del="${t.id}" title="Excluir">🗑️</button>
      </div>`;
  }

  function bindTaskRows(ctx) {
    $$("[data-check]", ctx).forEach((el) => (el.onclick = () => {
      Store.set((s) => { const t = s.tasks.find((x) => x.id === el.dataset.check); t.done = !t.done; });
      renderAll();
    }));
    $$("[data-edit]", ctx).forEach((el) => (el.onclick = () => taskForm(el.dataset.edit)));
    $$("[data-del]", ctx).forEach((el) => (el.onclick = () => {
      Store.set((s) => { s.tasks = s.tasks.filter((x) => x.id !== el.dataset.del); });
      renderAll(); toast("Tarefa excluída");
    }));
  }

  function renderTasks() {
    const { tasks } = Store.get();
    let list = tasks;
    if (taskFilter === "pendentes") list = tasks.filter((t) => !t.done);
    else if (taskFilter === "concluidas") list = tasks.filter((t) => t.done);
    else if (taskFilter === "atrasadas") list = tasks.filter((t) => !t.done && t.due && t.due < todayISO());

    list = [...list].sort((a, b) => Number(a.done) - Number(b.done) || (a.due || "9").localeCompare(b.due || "9"));

    $("#view-tasks").innerHTML = `
      <div class="view-head">
        <div><h2>✅ Tarefas</h2><p>Marque o que já estudou e acompanhe o que falta</p></div>
        <button class="btn btn-primary" id="addTask">＋ Nova tarefa</button>
      </div>
      <div class="filters">
        ${[["todas", "Todas"], ["pendentes", "Pendentes"], ["concluidas", "Concluídas"], ["atrasadas", "Atrasadas"]].map(([f, label]) =>
          `<button class="chip ${taskFilter === f ? "active" : ""}" data-filter="${f}">${label}</button>`
        ).join("")}
      </div>
      ${list.length ? `<div class="task-list">${list.map(taskRow).join("")}</div>`
        : `<div class="empty"><div class="emoji">🎉</div><p>Nada por aqui. Tudo certo!</p></div>`}
    `;

    $("#addTask").onclick = () => taskForm();
    $$("[data-filter]", $("#view-tasks")).forEach((c) => (c.onclick = () => { taskFilter = c.dataset.filter; renderTasks(); }));
    bindTaskRows($("#view-tasks"));
  }

  function taskForm(id) {
    const t = id ? Store.get().tasks.find((x) => x.id === id) : { title: "", subjectId: null, due: "", priority: "media", done: false };
    modal.open(id ? "Editar tarefa" : "Nova tarefa", `
      <div class="form-grid">
        <div class="field"><label>O que estudar?</label><input id="f-title" value="${esc(t.title)}" placeholder="Ex.: Revisar capítulo 3" /></div>
        <div class="field"><label>Matéria</label><select id="f-subject">${subjectOptions(t.subjectId)}</select></div>
        <div class="field-row">
          <div class="field"><label>Prazo</label><input type="date" id="f-due" value="${t.due || ""}" /></div>
          <div class="field"><label>Prioridade</label><select id="f-prio">
            ${Object.entries(PRIORITIES).map(([k, v]) => `<option value="${k}" ${t.priority === k ? "selected" : ""}>${v}</option>`).join("")}
          </select></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-light" id="f-cancel">Cancelar</button>
          <button class="btn btn-primary" id="f-save">Salvar</button>
        </div>
      </div>
    `, (body) => {
      $("#f-cancel", body).onclick = modal.close;
      $("#f-save", body).onclick = () => {
        const title = $("#f-title", body).value.trim();
        if (!title) return toast("Descreva a tarefa");
        const data = {
          title,
          subjectId: $("#f-subject", body).value || null,
          due: $("#f-due", body).value,
          priority: $("#f-prio", body).value,
        };
        Store.set((s) => {
          if (id) Object.assign(s.tasks.find((x) => x.id === id), data);
          else s.tasks.push({ id: Store.uid(), ...data, done: false });
        });
        modal.close(); renderAll(); toast(id ? "Tarefa atualizada" : "Tarefa criada");
      };
    });
  }

  // ============================================================
  //  CRONOGRAMA
  // ============================================================
  function renderSchedule() {
    const { slots } = Store.get();
    $("#view-schedule").innerHTML = `
      <div class="view-head">
        <div><h2>🗓️ Cronograma</h2><p>Monte sua rotina semanal de estudos</p></div>
      </div>
      <div class="schedule-grid">
        ${DAYS.map((day, i) => {
          const daySlots = slots.filter((s) => s.day === i).sort((a, b) => (a.time || "").localeCompare(b.time || ""));
          return `
            <div class="day-col">
              <h4>${day.slice(0, 3)}</h4>
              ${daySlots.map((s) => {
                const sub = subjectById(s.subjectId);
                return `<div class="slot" style="border-left-color:${sub ? sub.color : "var(--primary)"}">
                  <span class="slot-x" data-del="${s.id}">✕</span>
                  <div class="slot-time">${s.time || ""}</div>
                  ${esc(sub ? sub.name : s.label || "Estudo")}
                </div>`;
              }).join("")}
              <button class="add-slot" data-add="${i}">＋ adicionar</button>
            </div>`;
        }).join("")}
      </div>
    `;
    $$("[data-add]", $("#view-schedule")).forEach((b) => (b.onclick = () => slotForm(Number(b.dataset.add))));
    $$("[data-del]", $("#view-schedule")).forEach((b) => (b.onclick = () => {
      Store.set((s) => { s.slots = s.slots.filter((x) => x.id !== b.dataset.del); });
      renderSchedule(); toast("Horário removido");
    }));
  }

  function slotForm(day) {
    modal.open(`Novo horário — ${DAYS[day]}`, `
      <div class="form-grid">
        <div class="field-row">
          <div class="field"><label>Horário</label><input type="time" id="f-time" /></div>
          <div class="field"><label>Matéria</label><select id="f-subject">${subjectOptions(null)}</select></div>
        </div>
        <div class="field"><label>Observação (opcional)</label><input id="f-label" placeholder="Ex.: Resolver exercícios" /></div>
        <div class="modal-actions">
          <button class="btn btn-light" id="f-cancel">Cancelar</button>
          <button class="btn btn-primary" id="f-save">Adicionar</button>
        </div>
      </div>
    `, (body) => {
      $("#f-cancel", body).onclick = modal.close;
      $("#f-save", body).onclick = () => {
        Store.set((s) => s.slots.push({
          id: Store.uid(), day,
          time: $("#f-time", body).value,
          subjectId: $("#f-subject", body).value || null,
          label: $("#f-label", body).value.trim(),
        }));
        modal.close(); renderSchedule(); toast("Horário adicionado");
      };
    });
  }

  // ============================================================
  //  NOTAS (planilha)
  // ============================================================
  function renderGrades() {
    const { grades, subjects } = Store.get();
    const rows = grades.map((g) => {
      const sub = subjectById(g.subjectId);
      const max = g.max || 10;
      const ok = Number(g.grade) >= max / 2;
      return `
        <tr data-id="${g.id}">
          <td><span class="tag-dot" style="--c:${sub ? sub.color : "var(--primary)"}">${esc(sub ? sub.name : "—")}</span></td>
          <td>${esc(g.name)}</td>
          <td><input type="number" step="0.1" min="0" data-field="grade" value="${g.grade ?? ""}" /></td>
          <td><input type="number" step="0.1" min="0" data-field="max" value="${max}" /></td>
          <td><input type="number" step="0.1" min="0" data-field="weight" value="${g.weight ?? 1}" /></td>
          <td>${g.grade !== "" && g.grade != null ? `<span class="grade-pill ${ok ? "grade-ok" : "grade-bad"}">${ok ? "✓" : "✗"}</span>` : "—"}</td>
          <td><button class="icon-btn" data-del="${g.id}">🗑️</button></td>
        </tr>`;
    }).join("");

    // média ponderada geral
    const valid = grades.filter((g) => g.grade !== "" && g.grade != null);
    let avg = "—";
    if (valid.length) {
      const tw = valid.reduce((a, g) => a + (Number(g.weight) || 1), 0);
      const sum = valid.reduce((a, g) => a + Number(g.grade) * (Number(g.weight) || 1) * (10 / (g.max || 10)), 0);
      avg = (sum / tw).toFixed(2);
    }

    $("#view-grades").innerHTML = `
      <div class="view-head">
        <div><h2>📈 Notas</h2><p>Sua planilha de avaliações com média ponderada (base 10)</p></div>
        <button class="btn btn-primary" id="addGrade" ${subjects.length ? "" : "disabled"}>＋ Nova nota</button>
      </div>
      ${!subjects.length ? `<div class="empty"><div class="emoji">📘</div><p>Cadastre uma matéria primeiro para lançar notas.</p></div>`
      : grades.length ? `
        <div class="card stat-card" style="max-width:240px;margin-bottom:18px">
          <span class="stat-label">📊 Média geral ponderada</span>
          <span class="stat-value">${avg}</span>
          <span class="stat-sub">base 10</span>
        </div>
        <div class="table-wrap"><table>
          <thead><tr><th>Matéria</th><th>Avaliação</th><th>Nota</th><th>Máx.</th><th>Peso</th><th>Status</th><th></th></tr></thead>
          <tbody>${rows}</tbody>
        </table></div>`
      : `<div class="empty"><div class="emoji">📝</div><p>Nenhuma nota lançada. Clique em “Nova nota”.</p></div>`}
    `;

    $("#addGrade")?.addEventListener("click", () => gradeForm());
    $$("input[data-field]", $("#view-grades")).forEach((inp) => (inp.onchange = () => {
      const id = inp.closest("tr").dataset.id;
      Store.set((s) => {
        const g = s.grades.find((x) => x.id === id);
        const v = inp.value === "" ? "" : Number(inp.value);
        g[inp.dataset.field] = v;
      });
      renderGrades();
    }));
    $$("[data-del]", $("#view-grades")).forEach((b) => (b.onclick = () => {
      Store.set((s) => { s.grades = s.grades.filter((x) => x.id !== b.dataset.del); });
      renderGrades(); toast("Nota removida");
    }));
  }

  function gradeForm() {
    modal.open("Nova nota", `
      <div class="form-grid">
        <div class="field"><label>Matéria</label><select id="f-subject">${Store.get().subjects.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select></div>
        <div class="field"><label>Avaliação</label><input id="f-name" placeholder="Ex.: Prova 1" /></div>
        <div class="field-row">
          <div class="field"><label>Nota</label><input type="number" step="0.1" id="f-grade" placeholder="8.5" /></div>
          <div class="field"><label>Nota máxima</label><input type="number" step="0.1" id="f-max" value="10" /></div>
          <div class="field"><label>Peso</label><input type="number" step="0.1" id="f-weight" value="1" /></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-light" id="f-cancel">Cancelar</button>
          <button class="btn btn-primary" id="f-save">Salvar</button>
        </div>
      </div>
    `, (body) => {
      $("#f-cancel", body).onclick = modal.close;
      $("#f-save", body).onclick = () => {
        const name = $("#f-name", body).value.trim();
        if (!name) return toast("Dê um nome à avaliação");
        Store.set((s) => s.grades.push({
          id: Store.uid(),
          subjectId: $("#f-subject", body).value,
          name,
          grade: $("#f-grade", body).value === "" ? "" : Number($("#f-grade", body).value),
          max: Number($("#f-max", body).value) || 10,
          weight: Number($("#f-weight", body).value) || 1,
        }));
        modal.close(); renderGrades(); toast("Nota lançada");
      };
    });
  }

  // ============================================================
  //  METAS
  // ============================================================
  function renderGoals() {
    const { goals } = Store.get();
    $("#view-goals").innerHTML = `
      <div class="view-head">
        <div><h2>🎯 Metas</h2><p>Defina objetivos e acompanhe a evolução</p></div>
        <button class="btn btn-primary" id="addGoal">＋ Nova meta</button>
      </div>
      ${goals.length ? goals.map((g) => {
        const pct = g.target ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
        return `
          <div class="goal">
            <div class="goal-head">
              <h3>${esc(g.title)} ${pct >= 100 ? "✅" : ""}</h3>
              <button class="icon-btn" data-del="${g.id}">🗑️</button>
            </div>
            <div class="progress"><span style="width:${pct}%"></span></div>
            <div class="goal-foot">
              <span>${g.current} / ${g.target} ${esc(g.unit || "")} • ${pct}%</span>
              <div class="stepper">
                <button data-dec="${g.id}">−</button>
                <button data-inc="${g.id}">＋</button>
              </div>
            </div>
          </div>`;
      }).join("")
      : `<div class="empty"><div class="emoji">🎯</div><p>Sem metas ainda. Que tal “Estudar 10h por semana”?</p></div>`}
    `;
    $("#addGoal").onclick = () => goalForm();
    const step = (id, d) => { Store.set((s) => { const g = s.goals.find((x) => x.id === id); g.current = Math.max(0, g.current + d); }); renderGoals(); };
    $$("[data-inc]", $("#view-goals")).forEach((b) => (b.onclick = () => step(b.dataset.inc, 1)));
    $$("[data-dec]", $("#view-goals")).forEach((b) => (b.onclick = () => step(b.dataset.dec, -1)));
    $$("[data-del]", $("#view-goals")).forEach((b) => (b.onclick = () => {
      Store.set((s) => { s.goals = s.goals.filter((x) => x.id !== b.dataset.del); });
      renderGoals(); toast("Meta removida");
    }));
  }

  function goalForm() {
    modal.open("Nova meta", `
      <div class="form-grid">
        <div class="field"><label>Objetivo</label><input id="f-title" placeholder="Ex.: Ler 5 livros" /></div>
        <div class="field-row">
          <div class="field"><label>Alvo</label><input type="number" id="f-target" value="10" /></div>
          <div class="field"><label>Unidade</label><input id="f-unit" placeholder="h, páginas, exercícios..." /></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-light" id="f-cancel">Cancelar</button>
          <button class="btn btn-primary" id="f-save">Salvar</button>
        </div>
      </div>
    `, (body) => {
      $("#f-cancel", body).onclick = modal.close;
      $("#f-save", body).onclick = () => {
        const title = $("#f-title", body).value.trim();
        if (!title) return toast("Descreva a meta");
        Store.set((s) => s.goals.push({
          id: Store.uid(), title,
          current: 0,
          target: Number($("#f-target", body).value) || 1,
          unit: $("#f-unit", body).value.trim(),
        }));
        modal.close(); renderGoals(); toast("Meta criada");
      };
    });
  }

  // ============================================================
  //  Navegação / tema / dados
  // ============================================================
  const renderers = {
    dashboard: renderDashboard, subjects: renderSubjects, tasks: renderTasks,
    schedule: renderSchedule, grades: renderGrades, goals: renderGoals,
  };
  let current = "dashboard";

  function renderAll() {
    renderers[current]();
  }

  function navTo(view) {
    current = view;
    $$(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    $$(".view").forEach((v) => v.classList.toggle("active", v.id === `view-${view}`));
    renderers[view]();
  }
  $$(".nav-item").forEach((b) => (b.onclick = () => navTo(b.dataset.view)));

  // Tema
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    $("#themeToggle").textContent = theme === "dark" ? "☀️ Tema" : "🌙 Tema";
  }
  applyTheme(Store.get().settings.theme);
  $("#themeToggle").onclick = () => {
    const next = Store.get().settings.theme === "dark" ? "light" : "dark";
    Store.set((s) => (s.settings.theme = next));
    applyTheme(next);
  };

  // Exportar / Importar
  $("#exportBtn").onclick = () => {
    const blob = new Blob([Store.export()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `guia-estudos-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast("Dados exportados ⬇️");
  };
  $("#importBtn").onclick = () => $("#importFile").click();
  $("#importFile").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.subjects || !data.tasks) throw new Error("formato");
        Store.replace(data);
        applyTheme(Store.get().settings.theme);
        navTo(current);
        toast("Dados importados ⬆️");
      } catch {
        toast("Arquivo inválido");
      }
      e.target.value = "";
    };
    reader.readAsText(file);
  };

  // Inicializa
  navTo("dashboard");
})();
