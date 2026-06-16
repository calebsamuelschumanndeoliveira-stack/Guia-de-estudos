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
  // Formata segundos em relógio (HH:MM:SS) e em duração legível (Xh Ymin)
  function fmtClock(totalSec) {
    const s = Math.max(0, Math.floor(totalSec));
    const h = String(Math.floor(s / 3600)).padStart(2, "0");
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
    const ss = String(s % 60).padStart(2, "0");
    return `${h}:${m}:${ss}`;
  }
  function fmtDur(totalSec) {
    const s = Math.max(0, Math.floor(totalSec));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    if (h && m) return `${h}h ${m}min`;
    if (h) return `${h}h`;
    if (m) return `${m}min`;
    return s ? `${s}s` : "0min";
  }
  function timerElapsed() {
    const t = Store.get().timer;
    let e = t.accumulated || 0;
    if (t.running && t.startedAt) e += (Date.now() - t.startedAt) / 1000;
    return e;
  }

  function renderDashboard() {
    const { subjects, tasks, goals, sessions, plan, timer } = Store.get();
    const today = isoLocal(new Date());
    const ym = today.slice(0, 7);
    const monthSec = sessions.filter((s) => s.date && s.date.slice(0, 7) === ym).reduce((a, s) => a + s.seconds, 0);
    const todaySec = sessions.filter((s) => s.date === today).reduce((a, s) => a + s.seconds, 0);
    const totalSec = sessions.reduce((a, s) => a + s.seconds, 0);
    const monthName = MONTHS[new Date().getMonth()];

    const pending = tasks.filter((t) => !t.done);
    const overdue = pending.filter((t) => t.due && t.due < today).length;
    const doneCount = tasks.length - pending.length;

    const todayPlan = plan.filter((p) => p.date === today);
    const todayTasks = pending.filter((t) => t.due === today);
    const nextUp = pending.filter((t) => t.due && t.due >= today).sort((a, b) => a.due.localeCompare(b.due)).slice(0, 4);

    const greeting = window.GuiaUser ? `Olá, ${esc(window.GuiaUser)}! 👋` : "Olá! 👋";

    $("#view-dashboard").innerHTML = `
      <div class="view-head">
        <div><h2>📊 Painel</h2><p>${greeting} Aqui está o seu resumo.</p></div>
      </div>

      <div class="card hours-hero">
        <div class="hours-main">
          <span class="hours-label">⏱️ Horas estudadas em ${monthName}</span>
          <span class="hours-big">${fmtDur(monthSec)}</span>
          ${timer.running ? `<span class="hours-live">🔴 cronômetro rodando agora</span>` : `<span class="hours-hint">registre seu tempo na aba ⏱️ Cronômetro</span>`}
        </div>
        <div class="hours-side">
          <div><strong>${fmtDur(todaySec)}</strong><span>hoje</span></div>
          <div><strong>${fmtDur(totalSec)}</strong><span>no total</span></div>
        </div>
      </div>

      <div class="section-title">🎯 Para hoje</div>
      ${(todayPlan.length || todayTasks.length) ? `
        <div class="today-grid">
          ${todayPlan.length ? `
            <div class="card">
              <strong>📅 Estudos planejados</strong>
              <ul class="mini-list">${todayPlan.map((p) => {
                const sub = subjectById(p.subjectId);
                return `<li class="${p.done ? "done" : ""}"><span class="tag-dot" style="--c:${sub ? sub.color : "var(--primary)"}">${esc(p.title)}</span></li>`;
              }).join("")}</ul>
            </div>` : ""}
          ${todayTasks.length ? `
            <div class="card">
              <strong>✅ Tarefas para hoje</strong>
              <ul class="mini-list">${todayTasks.map((t) => `<li>${esc(t.title)}</li>`).join("")}</ul>
            </div>` : ""}
        </div>`
        : `<div class="empty small"><p>Nada marcado para hoje. Planeje no 🗓️ Calendário ou comece uma sessão no ⏱️ Cronômetro!</p></div>`}

      <div class="section-title">📌 Resumo</div>
      <div class="cards">
        <div class="card stat-card">
          <span class="stat-label">⏳ Tarefas pendentes</span>
          <span class="stat-value">${pending.length}</span>
          <span class="stat-sub">${overdue > 0 ? `<span class="overdue">${overdue} atrasada(s)</span>` : "em dia 🎉"}</span>
        </div>
        <div class="card stat-card">
          <span class="stat-label">✅ Concluídas</span>
          <span class="stat-value">${doneCount}</span>
          <span class="stat-sub">de ${tasks.length} tarefas</span>
        </div>
        <div class="card stat-card">
          <span class="stat-label">📘 Matérias</span>
          <span class="stat-value">${subjects.length}</span>
          <span class="stat-sub">cadastradas</span>
        </div>
        <div class="card stat-card">
          <span class="stat-label">🎯 Metas ativas</span>
          <span class="stat-value">${goals.length}</span>
          <span class="stat-sub">veja em Metas</span>
        </div>
      </div>

      ${nextUp.length ? `<div class="section-title">📅 Próximos prazos</div><div class="task-list">${nextUp.map(taskRow).join("")}</div>` : ""}
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
  //  CALENDÁRIO (planejamento por dia)
  // ============================================================
  const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  let calRef = new Date();
  calRef.setDate(1);

  const isoLocal = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const addDaysISO = (iso, n) => {
    const [y, m, d] = iso.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + n);
    return isoLocal(dt);
  };

  function renderSchedule() {
    const { plan } = Store.get();
    const year = calRef.getFullYear();
    const month = calRef.getMonth();
    const todayStr = isoLocal(new Date());
    const startWeekday = new Date(year, month, 1).getDay();
    const gridStart = new Date(year, month, 1 - startWeekday);

    let cells = "";
    for (let i = 0; i < 42; i++) {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      const iso = isoLocal(d);
      const items = plan.filter((p) => p.date === iso);
      const chips = items.slice(0, 3).map((p) => {
        const sub = subjectById(p.subjectId);
        return `<span class="cal-chip ${p.done ? "done" : ""}" style="--c:${sub ? sub.color : "var(--primary)"}">${esc(p.title)}</span>`;
      }).join("");
      const more = items.length > 3 ? `<span class="cal-more">+${items.length - 3} mais</span>` : "";
      cells += `
        <div class="cal-cell ${d.getMonth() === month ? "" : "out"} ${iso === todayStr ? "today" : ""}" data-date="${iso}">
          <div class="cal-daynum">${d.getDate()}</div>
          <div class="cal-items">${chips}${more}</div>
        </div>`;
    }

    $("#view-schedule").innerHTML = `
      <div class="view-head">
        <div><h2>🗓️ Calendário</h2><p>Planeje o que estudar em cada dia. Clique num dia para editar.</p></div>
        <button class="btn btn-light" id="shiftPlan" title="Atrasou? Empurre tudo para frente">⏩ Adiei? Empurrar plano</button>
      </div>
      <div class="cal-toolbar">
        <button class="icon-btn" id="calPrev">‹</button>
        <strong class="cal-title">${MONTHS[month]} ${year}</strong>
        <button class="icon-btn" id="calNext">›</button>
        <button class="btn btn-light cal-today-btn" id="calToday">Hoje</button>
      </div>
      <div class="cal-grid">
        ${WEEKDAYS_SHORT.map((w) => `<div class="cal-weekday">${w}</div>`).join("")}
        ${cells}
      </div>
    `;

    $("#calPrev").onclick = () => { calRef.setMonth(calRef.getMonth() - 1); renderSchedule(); };
    $("#calNext").onclick = () => { calRef.setMonth(calRef.getMonth() + 1); renderSchedule(); };
    $("#calToday").onclick = () => { calRef = new Date(); calRef.setDate(1); renderSchedule(); };
    $("#shiftPlan").onclick = () => shiftPlanForm();
    $$(".cal-cell", $("#view-schedule")).forEach((c) => (c.onclick = () => dayModal(c.dataset.date)));
  }

  function dayModal(date) {
    const [y, m, d] = date.split("-");
    const title = `${DAYS[new Date(Number(y), Number(m) - 1, Number(d)).getDay()]}, ${d}/${m}`;

    const render = () => {
      const items = Store.get().plan.filter((p) => p.date === date);
      const list = items.length ? items.map((p) => {
        const sub = subjectById(p.subjectId);
        return `
          <div class="day-item ${p.done ? "done" : ""}" data-id="${p.id}">
            <div class="check ${p.done ? "on" : ""}" data-check="${p.id}">${p.done ? "✓" : ""}</div>
            <div class="day-item-main">
              <div class="day-item-title">${esc(p.title)}</div>
              ${sub ? `<div class="day-item-sub"><span class="tag-dot" style="--c:${sub.color}">${esc(sub.name)}</span></div>` : ""}
            </div>
            <button class="icon-btn" data-post="${p.id}" title="Adiar 1 dia">⏩</button>
            <button class="icon-btn" data-del="${p.id}" title="Excluir">🗑️</button>
          </div>`;
      }).join("") : `<p class="muted-note">Nada planejado para este dia ainda. Adicione abaixo. 👇</p>`;

      const hasPend = items.some((p) => !p.done);
      modal.open(title, `
        <div class="day-list">${list}</div>
        <div class="day-add">
          <input id="day-new" placeholder="O que estudar? Ex.: 2ª Guerra Mundial" />
          <select id="day-sub">${subjectOptions(null)}</select>
          <button class="btn btn-primary" id="day-add-btn">Adicionar</button>
        </div>
        ${hasPend ? `<button class="btn btn-light" id="day-push" style="width:100%;justify-content:center;margin-top:10px">⏩ Mover pendentes para amanhã</button>` : ""}
      `, (body) => {
        const refresh = () => { renderSchedule(); render(); };

        $$("[data-check]", body).forEach((el) => (el.onclick = () => {
          Store.set((s) => { const p = s.plan.find((x) => x.id === el.dataset.check); p.done = !p.done; });
          refresh();
        }));
        $$("[data-post]", body).forEach((el) => (el.onclick = () => {
          Store.set((s) => { const p = s.plan.find((x) => x.id === el.dataset.post); p.date = addDaysISO(p.date, 1); });
          refresh(); toast("Adiado para o dia seguinte");
        }));
        $$("[data-del]", body).forEach((el) => (el.onclick = () => {
          Store.set((s) => { s.plan = s.plan.filter((x) => x.id !== el.dataset.del); });
          refresh();
        }));

        const doAdd = () => {
          const t = $("#day-new", body).value.trim();
          if (!t) return;
          const subId = $("#day-sub", body).value || null;
          Store.set((s) => s.plan.push({ id: Store.uid(), date, title: t, subjectId: subId, done: false }));
          refresh();
        };
        $("#day-add-btn", body).onclick = doAdd;
        $("#day-new", body).addEventListener("keydown", (e) => { if (e.key === "Enter") doAdd(); });

        const push = $("#day-push", body);
        if (push) push.onclick = () => {
          Store.set((s) => s.plan.forEach((p) => { if (p.date === date && !p.done) p.date = addDaysISO(date, 1); }));
          refresh(); toast("Pendentes movidas para amanhã");
        };
      });
    };
    render();
  }

  function shiftPlanForm() {
    const today = isoLocal(new Date());
    modal.open("Empurrar plano", `
      <div class="form-grid">
        <p class="muted-note">Atrasou os estudos? Empurre tudo para frente de uma vez, sem precisar editar dia por dia.</p>
        <div class="field"><label>A partir de qual dia?</label><input type="date" id="sp-from" value="${today}" /></div>
        <div class="field"><label>Empurrar quantos dias para frente?</label><input type="number" id="sp-days" value="1" min="1" /></div>
        <div class="modal-actions">
          <button class="btn btn-light" id="sp-cancel">Cancelar</button>
          <button class="btn btn-primary" id="sp-save">Empurrar</button>
        </div>
      </div>
    `, (body) => {
      $("#sp-cancel", body).onclick = modal.close;
      $("#sp-save", body).onclick = () => {
        const from = $("#sp-from", body).value;
        const n = Math.max(1, Number($("#sp-days", body).value) || 1);
        if (!from) return toast("Escolha a partir de qual dia");
        let count = 0;
        Store.set((s) => s.plan.forEach((p) => { if (p.date >= from) { p.date = addDaysISO(p.date, n); count++; } }));
        modal.close(); renderSchedule(); toast(`${count} estudo(s) adiado(s) em ${n} dia(s)`);
      };
    });
  }

  // ============================================================
  //  NOTAS (planilha)
  // ============================================================
  function renderGrades() {
    const { grades, subjects, settings } = Store.get();
    const divisor = Number(settings.gradeDivisor) || 2;
    const bimCount = Number(settings.bimesterCount) || 4;
    const passGrade = settings.passGrade ?? 6;
    const round2 = (n) => Math.round(n * 100) / 100;

    // média de um bimestre numa matéria = soma dos pontos ÷ divisor
    const bimAvg = (subjectId, bim) => {
      const evals = grades.filter((g) => g.subjectId === subjectId && (g.bimester || 1) === bim);
      if (!evals.length) return null;
      const soma = evals.reduce((a, g) => a + (Number(g.grade) || 0), 0);
      return round2(soma / divisor);
    };
    // média anual = soma das médias dos bimestres ÷ quantidade de bimestres
    const annualAvg = (subjectId) => {
      let total = 0, count = 0;
      for (let b = 1; b <= bimCount; b++) {
        const m = bimAvg(subjectId, b);
        if (m !== null) { total += m; count++; }
      }
      return count ? round2(total / bimCount) : null;
    };

    const settingsCard = `
      <div class="card grades-settings">
        <strong>⚙️ Como sua escola calcula a média</strong>
        <div class="settings-row">
          <label>Somo os pontos e divido por <input type="number" min="1" step="1" id="set-divisor" value="${divisor}" /></label>
          <label>Bimestres no ano <input type="number" min="1" max="8" step="1" id="set-bim" value="${bimCount}" /></label>
          <label>Média para passar <input type="number" min="0" step="0.5" id="set-pass" value="${passGrade}" /></label>
        </div>
        <p class="muted-note">Média do bimestre = soma dos pontos ÷ ${divisor}. &nbsp;|&nbsp; Média anual = soma das médias dos ${bimCount} bimestres ÷ ${bimCount}.</p>
      </div>`;

    const withGrades = subjects.filter((s) => grades.some((g) => g.subjectId === s.id));

    let body;
    if (!subjects.length) {
      body = `<div class="empty"><div class="emoji">📘</div><p>Cadastre uma matéria primeiro para lançar notas.</p></div>`;
    } else if (!withGrades.length) {
      body = `<div class="empty"><div class="emoji">📝</div><p>Nenhuma nota lançada. Clique em “Nova nota”.</p></div>`;
    } else {
      body = withGrades.map((s) => {
        const annual = annualAvg(s.id);
        const annualClass = annual === null ? "" : (annual >= passGrade ? "grade-ok" : "grade-bad");
        let blocks = "";
        for (let b = 1; b <= bimCount; b++) {
          const evals = grades.filter((g) => g.subjectId === s.id && (g.bimester || 1) === b);
          if (!evals.length) continue;
          const m = bimAvg(s.id, b);
          const rows = evals.map((g) => `
            <tr data-id="${g.id}">
              <td class="ev-name">${esc(g.name)}</td>
              <td class="ev-grade">
                <input type="number" step="0.1" min="0" data-field="grade" value="${g.grade ?? ""}" /> de
                <input type="number" step="0.1" min="0" data-field="max" value="${g.max ?? 10}" />
              </td>
              <td class="ev-del"><button class="icon-btn" data-del="${g.id}" title="Excluir">🗑️</button></td>
            </tr>`).join("");
          blocks += `
            <div class="bim-block">
              <div class="bim-head">
                <span>${b}º Bimestre</span>
                <span class="grade-pill ${m >= passGrade ? "grade-ok" : "grade-bad"}">média ${m.toFixed(2)}</span>
              </div>
              <table class="bim-table"><tbody>${rows}</tbody></table>
            </div>`;
        }
        return `
          <div class="card subject-grades" style="border-left:5px solid ${s.color}">
            <div class="sg-head">
              <h3>${esc(s.name)}</h3>
              <div class="sg-annual">Média anual: <span class="grade-pill ${annualClass}">${annual === null ? "—" : annual.toFixed(2)}</span></div>
            </div>
            ${blocks}
          </div>`;
      }).join("");
    }

    $("#view-grades").innerHTML = `
      <div class="view-head">
        <div><h2>📈 Notas</h2><p>Suas médias por matéria e por bimestre</p></div>
        <button class="btn btn-primary" id="addGrade" ${subjects.length ? "" : "disabled"}>＋ Nova nota</button>
      </div>
      ${subjects.length ? settingsCard : ""}
      ${body}
    `;

    $("#addGrade")?.addEventListener("click", () => gradeForm());

    const onSet = (id, key, clamp) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.onchange = () => { Store.set((st) => { st.settings[key] = clamp(Number(el.value)); }); renderGrades(); };
    };
    onSet("set-divisor", "gradeDivisor", (v) => Math.max(1, v || 1));
    onSet("set-bim", "bimesterCount", (v) => Math.min(8, Math.max(1, v || 1)));
    onSet("set-pass", "passGrade", (v) => Math.max(0, v || 0));

    $$("input[data-field]", $("#view-grades")).forEach((inp) => (inp.onchange = () => {
      const id = inp.closest("tr").dataset.id;
      Store.set((s) => {
        const g = s.grades.find((x) => x.id === id);
        g[inp.dataset.field] = inp.value === "" ? "" : Number(inp.value);
      });
      renderGrades();
    }));
    $$("[data-del]", $("#view-grades")).forEach((b) => (b.onclick = () => {
      Store.set((s) => { s.grades = s.grades.filter((x) => x.id !== b.dataset.del); });
      renderGrades(); toast("Nota removida");
    }));
  }

  function gradeForm() {
    const { subjects, settings } = Store.get();
    const bimCount = Number(settings.bimesterCount) || 4;
    const bimOpts = Array.from({ length: bimCount }, (_, i) => `<option value="${i + 1}">${i + 1}º Bimestre</option>`).join("");
    modal.open("Nova nota", `
      <div class="form-grid">
        <div class="field"><label>Matéria</label><select id="f-subject">${subjects.map((s) => `<option value="${s.id}">${esc(s.name)}</option>`).join("")}</select></div>
        <div class="field-row">
          <div class="field"><label>Bimestre</label><select id="f-bim">${bimOpts}</select></div>
          <div class="field"><label>Avaliação</label><input id="f-name" placeholder="Ex.: Prova" /></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Pontos que fez</label><input type="number" step="0.1" id="f-grade" placeholder="6" /></div>
          <div class="field"><label>Valia (máximo)</label><input type="number" step="0.1" id="f-max" value="10" /></div>
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
          bimester: Number($("#f-bim", body).value) || 1,
          name,
          grade: $("#f-grade", body).value === "" ? "" : Number($("#f-grade", body).value),
          max: Number($("#f-max", body).value) || 10,
        }));
        modal.close(); renderGrades(); toast("Nota lançada");
      };
    });
  }

  // ============================================================
  //  METAS
  // ============================================================
  function weekStartISO() {
    const d = new Date();
    const offset = (d.getDay() + 6) % 7; // 0 = segunda-feira
    d.setDate(d.getDate() - offset);
    return isoLocal(d);
  }
  function studiedSeconds(period) {
    const sessions = Store.get().sessions;
    if (period === "month") {
      const ym = isoLocal(new Date()).slice(0, 7);
      return sessions.filter((s) => s.date && s.date.slice(0, 7) === ym).reduce((a, s) => a + s.seconds, 0);
    }
    if (period === "week") {
      const ws = weekStartISO();
      return sessions.filter((s) => s.date && s.date >= ws).reduce((a, s) => a + s.seconds, 0);
    }
    return sessions.reduce((a, s) => a + s.seconds, 0);
  }
  const PERIOD_LABEL = { week: "esta semana", month: "este mês", total: "no total" };

  function renderGoals() {
    const { goals } = Store.get();
    $("#view-goals").innerHTML = `
      <div class="view-head">
        <div><h2>🎯 Metas</h2><p>Defina objetivos e acompanhe a evolução</p></div>
        <button class="btn btn-primary" id="addGoal">＋ Nova meta</button>
      </div>
      ${goals.length ? goals.map((g) => {
        const auto = !!g.auto;
        let pct, label;
        if (auto) {
          const sec = studiedSeconds(g.period);
          const targetSec = (g.target || 0) * 3600;
          pct = targetSec ? Math.min(100, Math.round((sec / targetSec) * 100)) : 0;
          label = `${fmtDur(sec)} / ${g.target}h • ${pct}%`;
        } else {
          pct = g.target ? Math.min(100, Math.round((g.current / g.target) * 100)) : 0;
          label = `${g.current} / ${g.target} ${esc(g.unit || "")} • ${pct}%`;
        }
        return `
          <div class="goal">
            <div class="goal-head">
              <h3>${esc(g.title)} ${pct >= 100 ? "✅" : ""}</h3>
              <button class="icon-btn" data-del="${g.id}">🗑️</button>
            </div>
            <div class="progress"><span style="width:${pct}%"></span></div>
            <div class="goal-foot">
              <span>${label}</span>
              ${auto
                ? `<span class="goal-auto">🔗 Cronômetro (${PERIOD_LABEL[g.period] || ""})</span>`
                : `<div class="stepper"><button data-dec="${g.id}">−</button><button data-inc="${g.id}">＋</button></div>`}
            </div>
          </div>`;
      }).join("")
      : `<div class="empty"><div class="emoji">🎯</div><p>Sem metas ainda. Que tal “Estudar 10h por semana”?</p></div>`}
    `;
    $("#addGoal").onclick = () => goalForm();
    const step = (id, d) => { Store.set((s) => { const g = s.goals.find((x) => x.id === id); g.current = Math.max(0, (g.current || 0) + d); }); renderGoals(); };
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
        <div class="field"><label>Objetivo</label><input id="f-title" placeholder="Ex.: Estudar 20h por semana" /></div>
        <div class="field"><label>Tipo de meta</label>
          <select id="f-type">
            <option value="hours">⏱️ Horas de estudo (atualiza sozinha pelo Cronômetro)</option>
            <option value="manual">✋ Manual (eu atualizo no + / −)</option>
          </select>
        </div>
        <div class="field-row" id="row-hours">
          <div class="field"><label>Meta de horas</label><input type="number" id="f-target-h" value="20" min="1" /></div>
          <div class="field"><label>Período</label>
            <select id="f-period">
              <option value="week">Esta semana</option>
              <option value="month">Este mês</option>
              <option value="total">No total</option>
            </select>
          </div>
        </div>
        <div class="field-row" id="row-manual" hidden>
          <div class="field"><label>Alvo</label><input type="number" id="f-target-m" value="10" /></div>
          <div class="field"><label>Unidade</label><input id="f-unit" placeholder="páginas, exercícios..." /></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-light" id="f-cancel">Cancelar</button>
          <button class="btn btn-primary" id="f-save">Salvar</button>
        </div>
      </div>
    `, (body) => {
      const type = $("#f-type", body);
      const toggle = () => {
        const isHours = type.value === "hours";
        $("#row-hours", body).hidden = !isHours;
        $("#row-manual", body).hidden = isHours;
      };
      type.onchange = toggle; toggle();

      $("#f-cancel", body).onclick = modal.close;
      $("#f-save", body).onclick = () => {
        const title = $("#f-title", body).value.trim();
        if (!title) return toast("Descreva a meta");
        if (type.value === "hours") {
          Store.set((s) => s.goals.push({
            id: Store.uid(), title, auto: true, unit: "h",
            period: $("#f-period", body).value,
            target: Number($("#f-target-h", body).value) || 1,
          }));
        } else {
          Store.set((s) => s.goals.push({
            id: Store.uid(), title, auto: false, current: 0,
            target: Number($("#f-target-m", body).value) || 1,
            unit: $("#f-unit", body).value.trim(),
          }));
        }
        modal.close(); renderGoals(); toast("Meta criada");
      };
    });
  }

  // ============================================================
  //  CRONÔMETRO
  // ============================================================
  function renderTimer() {
    const { sessions, timer } = Store.get();
    const running = timer.running;
    const elapsed = timerElapsed();
    const today = isoLocal(new Date());
    const todaySessions = sessions.filter((s) => s.date === today).sort((a, b) => b.id.localeCompare(a.id));
    const todaySec = todaySessions.reduce((a, s) => a + s.seconds, 0);
    const statusText = running ? "⏳ Estudando..." : (elapsed > 0 ? "⏸ Pausado" : "Pronto para começar");

    $("#view-timer").innerHTML = `
      <div class="view-head">
        <div><h2>⏱️ Cronômetro</h2><p>Inicie ao começar a estudar. Pause nas pausas. Finalize para salvar as horas.</p></div>
      </div>

      <div class="card timer-card">
        <div class="timer-display" id="timerDisplay">${fmtClock(elapsed)}</div>
        <div class="timer-status" id="timerStatus">${statusText}</div>
        <div class="timer-actions">
          ${(!running && elapsed === 0) ? `<button class="btn btn-primary timer-big" id="t-start">▶ Iniciar</button>` : ""}
          ${running ? `<button class="btn btn-light timer-big" id="t-pause">⏸ Pausar</button>` : ""}
          ${(!running && elapsed > 0) ? `<button class="btn btn-primary timer-big" id="t-resume">▶ Retomar</button>` : ""}
          ${elapsed > 0 ? `<button class="btn btn-success" id="t-finish">✓ Finalizar e salvar</button>` : ""}
          ${elapsed > 0 ? `<button class="btn btn-light" id="t-reset">Descartar</button>` : ""}
        </div>
      </div>

      <div class="section-title">📅 Sessões de hoje — total ${fmtDur(todaySec)}</div>
      ${todaySessions.length ? `<div class="task-list">${todaySessions.map((s) => `
        <div class="task"><div class="task-main"><div class="task-title">⏱️ ${fmtDur(s.seconds)}</div></div>
          <button class="icon-btn" data-del-sess="${s.id}" title="Excluir">🗑️</button></div>`).join("")}</div>`
        : `<div class="empty small"><p>Nenhuma sessão hoje ainda. Bora começar? 💪</p></div>`}
    `;

    const onClick = (id, fn) => { const el = $("#" + id, $("#view-timer")); if (el) el.onclick = fn; };
    onClick("t-start", () => {
      Store.set((s) => { s.timer = { running: true, startedAt: Date.now(), accumulated: 0, subjectId: null }; });
      renderTimer();
    });
    onClick("t-pause", () => {
      Store.set((s) => { const tt = s.timer; tt.accumulated = (tt.accumulated || 0) + (Date.now() - tt.startedAt) / 1000; tt.startedAt = null; tt.running = false; });
      renderTimer();
    });
    onClick("t-resume", () => {
      Store.set((s) => { s.timer.running = true; s.timer.startedAt = Date.now(); });
      renderTimer();
    });
    onClick("t-finish", () => {
      const total = Math.round(timerElapsed());
      Store.set((s) => {
        if (total >= 1) s.sessions.push({ id: Store.uid(), date: isoLocal(new Date()), seconds: total, subjectId: s.timer.subjectId || null });
        s.timer = { running: false, startedAt: null, accumulated: 0, subjectId: s.timer.subjectId };
      });
      renderTimer();
      if (total >= 1) toast(`Sessão salva: ${fmtDur(total)} 🎉`);
    });
    onClick("t-reset", () => {
      if (!confirm("Descartar esta sessão sem salvar?")) return;
      Store.set((s) => { s.timer = { running: false, startedAt: null, accumulated: 0, subjectId: s.timer.subjectId }; });
      renderTimer();
    });

    $$("[data-del-sess]", $("#view-timer")).forEach((b) => (b.onclick = () => {
      Store.set((s) => { s.sessions = s.sessions.filter((x) => x.id !== b.dataset.delSess); });
      renderTimer(); toast("Sessão removida");
    }));
  }

  // Atualiza o relógio na tela a cada segundo (apenas visual, não salva)
  setInterval(() => {
    const disp = document.getElementById("timerDisplay");
    if (disp && Store.get().timer.running) disp.textContent = fmtClock(timerElapsed());
  }, 1000);

  // ============================================================
  //  Navegação / tema / dados
  // ============================================================
  const renderers = {
    dashboard: renderDashboard, subjects: renderSubjects, tasks: renderTasks,
    schedule: renderSchedule, grades: renderGrades, goals: renderGoals, timer: renderTimer,
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

  // ---------- Lembretes (notificações no navegador) ----------
  const Notifier = {
    check() {
      if (!("Notification" in window) || Notification.permission !== "granted") return;
      const today = todayISO();
      const due = Store.get().tasks.filter((t) => !t.done && t.due && t.due <= today);
      const lastKey = "guia-lastNotif" + (Store.isCloud() ? "-cloud" : "");
      if (due.length && localStorage.getItem(lastKey) !== today) {
        const overdue = due.filter((t) => t.due < today).length;
        const body = overdue
          ? `Você tem ${due.length} tarefa(s) pendente(s), sendo ${overdue} atrasada(s).`
          : `Você tem ${due.length} tarefa(s) para hoje. Bons estudos! 📚`;
        try { new Notification("📚 Guia de Estudos", { body }); } catch (e) {}
        localStorage.setItem(lastKey, today);
      }
    },
  };
  setInterval(() => Notifier.check(), 60 * 60 * 1000); // re-checa a cada hora enquanto aberto

  $("#notifyBtn").onclick = async () => {
    if (!("Notification" in window)) return toast("Seu navegador não suporta notificações");
    if (Notification.permission === "denied") return toast("As notificações estão bloqueadas nas configurações do navegador");
    if (Notification.permission === "granted") {
      localStorage.removeItem("guia-lastNotif");
      localStorage.removeItem("guia-lastNotif-cloud");
      Notifier.check();
      return toast("Lembretes já estão ativos 🔔");
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") { toast("Lembretes ativados! 🔔"); Notifier.check(); }
    else toast("Permissão de notificação negada");
  };

  // Início — chamado pelo auth.js depois de carregar os dados (local ou nuvem)
  function start() {
    applyTheme(Store.get().settings.theme);
    navTo(current);
    Notifier.check();
  }
  window.App = { start, renderAll };
})();
