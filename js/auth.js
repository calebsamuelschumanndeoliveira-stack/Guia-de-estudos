/* auth.js — login/cadastro com Supabase e sincronização na nuvem.
   Se o Supabase não estiver configurado (ou indisponível), o site roda em
   "modo local" usando o navegador, sem login. */
(() => {
  const cfg = window.SUPABASE_CONFIG || {};
  const configured = Boolean(cfg.url && cfg.anonKey);
  const $ = (s) => document.querySelector(s);

  const escapeHtml = (s) => String(s ?? "").replace(/[&<>"']/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function setAccountBox(html) {
    const box = $("#accountBox");
    if (box) box.innerHTML = html;
  }

  function translateError(m) {
    m = (m || "").toLowerCase();
    if (m.includes("invalid login") || m.includes("credentials")) return "E-mail ou senha incorretos.";
    if (m.includes("already registered") || m.includes("already been")) return "Esse e-mail já tem conta. Tente entrar.";
    if (m.includes("password")) return "Senha inválida (mínimo 6 caracteres).";
    if (m.includes("email")) return "Verifique o e-mail informado.";
    if (m.includes("rate") || m.includes("seconds")) return "Muitas tentativas. Espere um pouco e tente de novo.";
    return "Ops, algo deu errado. Tente novamente.";
  }

  // ---------------------------------------------------------------- MODO LOCAL
  async function startLocal() {
    Store.setLocal();
    await Store.init();
    setAccountBox(`<div class="acc-local">💾 Modo local<br><small>dados só neste aparelho</small></div>`);
    App.start();
  }

  // ---------------------------------------------------------------- MODO NUVEM
  let client = null;

  async function startCloud(session) {
    Store.setCloud(client, session.user.id);
    await Store.init();
    hideAuthScreen();
    const meta = session.user.user_metadata || {};
    const name = meta.username || session.user.email;
    window.GuiaUser = meta.username || null;
    setAccountBox(`
      <div class="acc-user">👤 <strong>${escapeHtml(name)}</strong></div>
      <button id="logoutBtn" class="ghost-btn">Sair</button>
    `);
    $("#logoutBtn").onclick = async () => {
      await client.auth.signOut();
      location.reload();
    };
    App.start();
  }

  function buildAuthScreen() {
    if ($("#authScreen")) return;
    const el = document.createElement("div");
    el.id = "authScreen";
    el.className = "auth-screen";
    el.innerHTML = `
      <div class="auth-card">
        <div class="auth-brand"><span>📚</span> Guia de Estudos</div>
        <p class="auth-tagline">Entre para salvar seus estudos na nuvem e acessar de qualquer aparelho.</p>
        <div class="auth-tabs">
          <button data-tab="login" class="active">Entrar</button>
          <button data-tab="signup">Criar conta</button>
        </div>
        <form id="authForm" class="form-grid" autocomplete="on">
          <div class="field signup-only" hidden>
            <label>Nome de usuário</label>
            <input id="a-username" placeholder="Ex.: caleb" autocomplete="username" />
          </div>
          <div class="field">
            <label>E-mail</label>
            <input id="a-email" type="email" placeholder="voce@email.com" autocomplete="email" required />
          </div>
          <div class="field signup-only" hidden>
            <label>Telefone (opcional)</label>
            <input id="a-phone" placeholder="(11) 99999-9999" autocomplete="tel" />
          </div>
          <div class="field">
            <label>Senha</label>
            <input id="a-password" type="password" placeholder="mínimo 6 caracteres" autocomplete="current-password" required />
          </div>
          <button type="submit" class="btn btn-primary" id="a-submit" style="width:100%;justify-content:center">Entrar</button>
          <p class="auth-msg" id="a-msg"></p>
        </form>
      </div>`;
    document.body.appendChild(el);

    let mode = "login";
    const setMode = (m) => {
      mode = m;
      el.querySelectorAll(".auth-tabs button").forEach((b) => b.classList.toggle("active", b.dataset.tab === m));
      el.querySelectorAll(".signup-only").forEach((f) => (f.hidden = m !== "signup"));
      $("#a-submit").textContent = m === "signup" ? "Criar conta" : "Entrar";
      $("#a-password").setAttribute("autocomplete", m === "signup" ? "new-password" : "current-password");
      $("#a-msg").textContent = "";
    };
    el.querySelectorAll(".auth-tabs button").forEach((b) => (b.onclick = () => setMode(b.dataset.tab)));

    $("#authForm").onsubmit = async (e) => {
      e.preventDefault();
      const email = $("#a-email").value.trim();
      const password = $("#a-password").value;
      const msg = $("#a-msg");
      msg.style.color = "var(--danger)";
      if (password.length < 6) { msg.textContent = "A senha precisa de ao menos 6 caracteres."; return; }

      $("#a-submit").disabled = true;
      try {
        if (mode === "signup") {
          const username = $("#a-username").value.trim();
          const phone = $("#a-phone").value.trim();
          const { data, error } = await client.auth.signUp({
            email, password, options: { data: { username, phone } },
          });
          if (error) throw error;
          if (!data.session) {
            // confirmação de e-mail está ligada no Supabase
            msg.style.color = "var(--success)";
            msg.textContent = "Conta criada! Confirme pelo e-mail enviado e depois faça login.";
            setMode("login");
          } else {
            startCloud(data.session);
          }
        } else {
          const { data, error } = await client.auth.signInWithPassword({ email, password });
          if (error) throw error;
          startCloud(data.session);
        }
      } catch (err) {
        msg.textContent = translateError(err.message || "");
      } finally {
        $("#a-submit").disabled = false;
      }
    };
  }

  function showAuthScreen() { buildAuthScreen(); $("#authScreen").hidden = false; }
  function hideAuthScreen() { const a = $("#authScreen"); if (a) a.hidden = true; }

  async function bootCloud() {
    try {
      const { data: { session } } = await client.auth.getSession();
      if (session) await startCloud(session);
      else showAuthScreen();
    } catch (e) {
      console.error("Falha ao iniciar a nuvem, usando modo local:", e);
      startLocal();
    }
  }

  // ------------------------------------------------------------------- INÍCIO
  if (configured && typeof supabase !== "undefined") {
    client = supabase.createClient(cfg.url, cfg.anonKey);
    bootCloud();
  } else {
    if (configured) console.warn("Biblioteca do Supabase não carregou — rodando em modo local.");
    startLocal();
  }
})();
