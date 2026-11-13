/* GymSync Socio — PWA */
(() => {
  'use strict';

  const DEFAULT_API = 'http://localhost:3000/api/v1';
  const SESSION_KEY = 'gymsync-session';
  const CACHE_KEY = 'gymsync-cache';
  const CRED_KEY = 'gymsync-cred';
  const API_KEY = 'gymsync-api';

  const state = {
    api: localStorage.getItem(API_KEY) || DEFAULT_API,
    token: '',
    user: null,
    view: 'home',
    locked: false,
    offline: false,
    data: { membership: null, plan: null, routines: [], products: [], aforo: null },
    lastOrder: null,
    installPrompt: null,
  };

  const viewEl = document.getElementById('view');
  const tabbar = document.getElementById('tabbar');
  const offlineBanner = document.getElementById('offline-banner');
  const toastEl = document.getElementById('toast');
  let toastTimer;

  // ── Utilidades ────────────────────────────────────────────────
  const esc = (v) =>
    String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => (toastEl.hidden = true), 3200);
  }

  const money = (n) =>
    Number(n || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' });

  function fmtDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return esc(value);
    return d.toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  function initials(user) {
    if (!user) return 'GS';
    return `${(user.first_name || 'G')[0]}${(user.last_name || '')[0] || ''}`.toUpperCase();
  }

  const isDemo = () => state.token === 'demo-session';

  function saveSession() {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token: state.token, user: state.user }));
  }

  function clearSession() {
    state.token = '';
    state.user = null;
    localStorage.removeItem(SESSION_KEY);
  }

  // ── API ───────────────────────────────────────────────────────
  async function api(path, opts = {}) {
    const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
    if (state.token && opts.auth !== false) headers.Authorization = 'Bearer ' + state.token;
    const res = await fetch(state.api + path, {
      method: opts.method || 'GET',
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(data.message || data.error || `Error ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return data;
  }

  // ── Biometría (WebAuthn) ──────────────────────────────────────
  const b64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
  const unb64 = (str) => Uint8Array.from(atob(str), (c) => c.charCodeAt(0));

  async function biometricSupported() {
    try {
      return !!(
        window.PublicKeyCredential &&
        (await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable())
      );
    } catch {
      return false;
    }
  }

  async function registerBiometric() {
    if (!state.user) return;
    try {
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: 'GymSync', id: location.hostname },
          user: {
            id: new TextEncoder().encode(String(state.user.id)).slice(0, 64),
            name: state.user.phone || 'socio@gymsync',
            displayName: `${state.user.first_name || ''} ${state.user.last_name || ''}`.trim() || 'Socio GymSync',
          },
          pubKeyCredParams: [
            { type: 'public-key', alg: -7 },
            { type: 'public-key', alg: -257 },
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
            residentKey: 'preferred',
          },
          timeout: 60000,
          attestation: 'none',
        },
      });
      if (!cred) throw new Error('No se creó la credencial');
      localStorage.setItem(CRED_KEY, b64(cred.rawId));
      toast('Acceso biométrico activado');
      render();
    } catch (e) {
      toast('No se pudo activar la biometría: ' + (e.message || 'cancelado'));
    }
  }

  async function unlockWithBiometric() {
    const id = localStorage.getItem(CRED_KEY);
    if (!id) return;
    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          allowCredentials: [{ type: 'public-key', id: unb64(id) }],
          userVerification: 'required',
          timeout: 60000,
        },
      });
      if (!assertion) throw new Error('No verificado');
      state.locked = false;
      await refresh();
      render();
    } catch (e) {
      toast('No se pudo verificar la biometría');
    }
  }

  // ── Datos ─────────────────────────────────────────────────────
  function demoData() {
    return {
      aforo: 37,
      membership: { status: 'ACTIVE', end_date: new Date(Date.now() + 14 * 864e5).toISOString() },
      plan: { name: 'Mensual Full', price: 45 },
      routines: [
        { id: 'r1', name: 'Fuerza — Tren inferior', description: 'Sentadilla, prensa, peso muerto', difficulty: 'INTERMEDIATE', duration_weeks: 4 },
        { id: 'r2', name: 'Full body express', description: 'Circuito de 30 minutos', difficulty: 'BEGINNER', duration_weeks: 3 },
      ],
      products: [
        { id: 'p1', name: 'Whey Protein 2lb', price: 32, stock: 8, category: 'SUPPLEMENT' },
        { id: 'p2', name: 'Camiseta GymSync', price: 18, stock: 12, category: 'CLOTHING' },
        { id: 'p3', name: 'Shaker 600ml', price: 9, stock: 3, category: 'ACCESSORY' },
      ],
    };
  }

  function cacheData() {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(state.data));
    } catch {
      /* cuota llena */
    }
  }

  function loadCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  async function refresh() {
    if (!state.user) return;
    if (isDemo()) {
      state.data = demoData();
      state.offline = false;
      return;
    }
    try {
      const uid = encodeURIComponent(state.user.id);
      const gym = encodeURIComponent(state.user.gym_id || '');
      const [memberships, plans, routines, assignments, products, aforo] = await Promise.all([
        api(`/members/memberships/user/${uid}`),
        api(`/members/plans?gym_id=${gym}`),
        api(`/routines/routines?gym_id=${gym}`),
        api(`/routines/my?user_id=${uid}`).catch(() => ({ routine_ids: [] })),
        api(`/marketplace/products?gym_id=${gym}`),
        api('/access/aforo').catch(() => ({ aforo: null })),
      ]);

      const list = memberships.memberships || [];
      const membership = list.find((m) => m.status === 'ACTIVE') || list[0] || null;
      const plan = membership ? (plans.plans || []).find((p) => p.id === membership.plan_id) || null : null;

      const ids = assignments.routine_ids || [];
      const allRoutines = routines.routines || [];
      const mine = ids.length ? allRoutines.filter((r) => ids.includes(r.id)) : [];

      state.data = {
        membership,
        plan,
        routines: mine.length ? mine : allRoutines,
        products: products.products || [],
        aforo: aforo.aforo ?? null,
      };
      state.offline = false;
      cacheData();
    } catch (e) {
      if (e.status === 401) {
        clearSession();
        state.locked = false;
        render();
        toast('La sesión expiró, ingresá de nuevo');
        return;
      }
      state.offline = true;
      const cached = loadCache();
      if (cached) state.data = cached;
    }
  }

  // ── Login ─────────────────────────────────────────────────────
  function renderLogin() {
    tabbar.hidden = true;
    viewEl.innerHTML = `
      <section class="auth">
        <div class="logo">GS</div>
        <h1>GymSync</h1>
        <p class="sub">Ingresá con el PIN que te dio tu gimnasio.</p>

        <div class="field">
          <label for="phone">Teléfono</label>
          <input id="phone" type="tel" inputmode="tel" placeholder="+593999999999" autocomplete="username" />
        </div>
        <div class="field">
          <label for="pin">PIN de 4 dígitos</label>
          <input id="pin" type="password" inputmode="numeric" maxlength="4" class="pin" placeholder="••••" autocomplete="current-password" />
        </div>

        <button class="btn" id="login-btn">Ingresar</button>
        <button class="btn biometric" id="bio-btn" hidden>Desbloquear con biometría</button>

        <p class="foot">¿No tenés PIN? Pedilo en recepción.</p>

        <details>
          <summary>Opciones avanzadas</summary>
          <div class="field" style="margin-top:10px">
            <label for="api">URL de la API</label>
            <input id="api" type="url" value="${esc(state.api)}" />
          </div>
          <button class="btn demo" id="demo-btn">Ver demo (sin backend)</button>
        </details>
      </section>
    `;

    const phone = viewEl.querySelector('#phone');
    const pin = viewEl.querySelector('#pin');

    viewEl.querySelector('#login-btn').addEventListener('click', async () => {
      if (!/^\d{4}$/.test(pin.value)) {
        toast('El PIN debe tener 4 dígitos');
        return;
      }
      const btn = viewEl.querySelector('#login-btn');
      btn.disabled = true;
      btn.textContent = 'Ingresando…';
      try {
        const data = await api('/auth/login-pin', {
          method: 'POST',
          auth: false,
          body: { phone: phone.value.trim(), pin: pin.value },
        });
        state.token = data.token;
        state.user = data.user;
        state.api = viewEl.querySelector('#api').value.trim() || DEFAULT_API;
        localStorage.setItem(API_KEY, state.api);
        saveSession();
        await refresh();
        render();
      } catch (e) {
        toast(e.message || 'No se pudo iniciar sesión');
        btn.disabled = false;
        btn.textContent = 'Ingresar';
      }
    });

    viewEl.querySelector('#demo-btn').addEventListener('click', async () => {
      state.token = 'demo-session';
      state.user = {
        id: 'demo-member',
        first_name: 'Ana',
        last_name: 'Torres',
        phone: '+593999999999',
        role_id: 4,
        gym_id: '00000000-0000-0000-0000-000000000001',
      };
      saveSession();
      await refresh();
      render();
      toast('Modo demo: datos de ejemplo');
    });

    const bioBtn = viewEl.querySelector('#bio-btn');
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored && localStorage.getItem(CRED_KEY)) {
      bioBtn.hidden = false;
      bioBtn.addEventListener('click', unlockWithBiometric);
    }
  }

  // ── Lock ──────────────────────────────────────────────────────
  function renderLock() {
    tabbar.hidden = true;
    const name = state.user?.first_name || 'Hola';
    viewEl.innerHTML = `
      <section class="auth">
        <div class="logo">GS</div>
        <h1>Hola, ${esc(name)}</h1>
        <p class="sub">Desbloqueá tu app con huella o Face ID.</p>
        <button class="btn" id="unlock-btn">Desbloquear con biometría</button>
        <button class="btn ghost" id="pin-btn" style="margin-top:10px">Usar PIN</button>
        <p class="foot">Sesión guardada en este dispositivo.</p>
      </section>
    `;
    viewEl.querySelector('#unlock-btn').addEventListener('click', unlockWithBiometric);
    viewEl.querySelector('#pin-btn').addEventListener('click', () => {
      clearSession();
      state.locked = false;
      render();
    });
  }

  // ── Home ──────────────────────────────────────────────────────
  function membershipBadge(status) {
    const map = { ACTIVE: ['ok', 'Activa'], EXPIRED: ['bad', 'Vencida'], OVERDUE: ['warn', 'En mora'], FROZEN: ['info', 'Congelada'], CANCELLED: ['bad', 'Cancelada'] };
    const [cls, label] = map[status] || ['warn', 'Sin membresía'];
    return `<span class="badge ${cls}">${label}</span>`;
  }

  function renderPass() {
    const uid = state.user?.id || '';
    const gym = state.user?.gym_id || '';
    const payload = `gymsync://access?user_id=${encodeURIComponent(uid)}&gym_id=${encodeURIComponent(gym)}`;
    return `
      <div class="pass card">
        <div class="pass-head">
          <strong>Tu pase de acceso</strong>
          ${membershipBadge(state.data.membership?.status)}
        </div>
        <div class="qr" id="qr-box"></div>
        <p class="hint">Mostrá este QR en recepción para ingresar.</p>
        <p class="member">${esc(`${state.user?.first_name || ''} ${state.user?.last_name || ''}`.trim())}</p>
      </div>
    `;
  }

  function drawQr() {
    const box = viewEl.querySelector('#qr-box');
    if (!box) return;
    const uid = state.user?.id || '';
    const gym = state.user?.gym_id || '';
    const payload = `gymsync://access?user_id=${encodeURIComponent(uid)}&gym_id=${encodeURIComponent(gym)}`;
    try {
      const qr = qrcode(0, 'M');
      qr.addData(payload);
      qr.make();
      box.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 1 });
    } catch {
      box.textContent = 'QR no disponible';
    }
  }

  function renderHome() {
    const { membership, plan, routines, aforo } = state.data;
    const today = new Date().toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' });
    viewEl.innerHTML = `
      <div class="top">
        <div class="avatar">${esc(initials(state.user))}</div>
        <div class="hello">
          <small>${esc(today)}</small>
          <strong>Hola, ${esc(state.user?.first_name || 'socio')}</strong>
        </div>
        <button class="icon-btn" id="refresh-btn" title="Actualizar">⟳</button>
      </div>

      ${state.offline ? '<div class="card" style="padding:10px 12px;font-size:12px;color:#92400e;background:rgba(245,158,11,.12);border-color:rgba(245,158,11,.35)">Sin conexión · mostrando lo último guardado</div>' : ''}

      ${renderPass()}

      <div class="grid2">
        <button class="mini" data-goto="routines">
          <span>🏋️</span><small>Tu rutina</small><strong>${esc(routines[0]?.name || 'Sin asignar')}</strong>
        </button>
        <button class="mini" data-goto="shop">
          <span>🛒</span><small>Tienda</small><strong>${state.data.products.length} productos</strong>
        </button>
        <button class="mini" data-goto="profile">
          <span>🎟️</span><small>Tu plan</small><strong>${esc(plan?.name || 'Sin plan')}</strong>
        </button>
        <div class="mini" style="cursor:default">
          <span>👥</span><small>Aforo hoy</small><strong>${aforo ?? '—'} personas</strong>
        </div>
      </div>

      <div class="card">
        <h2>Estado de tu membresía</h2>
        <div class="kv"><span>Estado</span><strong>${membershipBadge(membership?.status)}</strong></div>
        <div class="kv"><span>Vence</span><strong>${membership ? fmtDate(membership.end_date) : '—'}</strong></div>
        <div class="kv"><span>Plan</span><strong>${esc(plan?.name || '—')}</strong></div>
      </div>

      <div class="card">
        <h2>Acceso rápido</h2>
        <div class="list-item">
          <div class="bullet">🎟️</div>
          <div class="body"><strong>Pase QR de un solo uso</strong><p>Generá tu pase desde el inicio y presentalo en recepción.</p></div>
        </div>
        <div class="list-item">
          <div class="bullet">📶</div>
          <div class="body"><strong>Funciona sin conexión</strong><p>Tus rutinas y pase quedan guardados en el celular.</p></div>
        </div>
      </div>
    `;

    drawQr();
    viewEl.querySelector('#refresh-btn').addEventListener('click', async () => {
      await refresh();
      render();
      toast('Actualizado');
    });
    viewEl.querySelectorAll('[data-goto]').forEach((el) =>
      el.addEventListener('click', () => go(el.dataset.goto))
    );
  }

  function renderRoutines() {
    const routines = state.data.routines || [];
    const diff = { BEGINNER: 'Principiante', INTERMEDIATE: 'Intermedio', ADVANCED: 'Avanzado' };
    viewEl.innerHTML = `
      <div class="top">
        <div class="hello"><small>Entrenamiento</small><strong>Mis rutinas</strong></div>
      </div>
      ${routines.length ? `<div class="card">${routines.map((r) => `
        <div class="list-item">
          <div class="bullet">🏋️</div>
          <div class="body">
            <strong>${esc(r.name)}</strong>
            <p>${esc(r.description || 'Rutina asignada por tu entrenador')}</p>
            <p style="margin-top:6px">
              <span class="badge info">${esc(diff[r.difficulty] || r.difficulty || 'General')}</span>
              <span class="badge ok">${esc(r.duration_weeks || 4)} semanas</span>
            </p>
          </div>
        </div>`).join('')}</div>` : `<div class="card empty"><strong>Sin rutinas todavía</strong>Tu entrenador va a asignarte una rutina.</div>`}
      <div class="card">
        <h2>Consejo</h2>
        <p style="margin:0;font-size:12.5px;color:var(--muted);line-height:1.6">Registrá tu progreso en recepción para que el entrenador ajuste tus cargas.</p>
      </div>
    `;
  }

  function renderShop() {
    const products = state.data.products || [];
    viewEl.innerHTML = `
      <div class="top"><div class="hello"><small>Marketplace</small><strong>Tienda del gym</strong></div></div>
      ${state.lastOrder ? `<div class="card" style="background:rgba(16,185,129,.08);border-color:rgba(16,185,129,.35)">
        <h2>Pedido confirmado</h2>
        <p style="margin:0;font-size:12.5px">Mostrá este token de pickup en mostrador:</p>
        <p style="font-size:26px;font-weight:800;letter-spacing:6px;color:#047857;margin:8px 0 0">${esc(state.lastOrder)}</p>
      </div>` : ''}
      <div class="card">
        ${products.length ? products.map((p) => `
          <div class="product">
            <div class="name">
              <strong>${esc(p.name)}</strong>
              <small>${esc(p.stock)} disponibles</small>
            </div>
            <span class="price">${money(p.price)}</span>
            <button class="btn sm" data-buy="${esc(p.id)}" ${p.stock > 0 ? '' : 'disabled'}>Comprar</button>
          </div>`).join('') : `<div class="empty"><strong>Sin productos</strong>La tienda todavía no tiene artículos.</div>`}
      </div>
    `;
    viewEl.querySelectorAll('[data-buy]').forEach((btn) =>
      btn.addEventListener('click', () => buy(btn.dataset.buy))
    );
  }

  async function buy(productId) {
    if (isDemo()) {
      state.lastOrder = String(Math.floor(1000 + Math.random() * 9000));
      render();
      toast('Pedido demo generado');
      return;
    }
    try {
      const data = await api('/marketplace/orders', {
        method: 'POST',
        body: { gym_id: state.user.gym_id, user_id: state.user.id, product_id: productId, quantity: 1 },
      });
      state.lastOrder = data.order?.token || '';
      await refresh();
      render();
      toast('Pedido registrado');
    } catch (e) {
      toast(e.message || 'No se pudo comprar');
    }
  }

  function renderProfile() {
    const { membership, plan } = state.data;
    const hasBio = !!localStorage.getItem(CRED_KEY);
    viewEl.innerHTML = `
      <div class="top">
        <div class="avatar">${esc(initials(state.user))}</div>
        <div class="hello">
          <small>Socio</small>
          <strong>${esc(`${state.user?.first_name || ''} ${state.user?.last_name || ''}`.trim())}</strong>
        </div>
      </div>

      <div class="card">
        <h2>Mis datos</h2>
        <div class="kv"><span>Teléfono</span><strong>${esc(state.user?.phone || '—')}</strong></div>
        <div class="kv"><span>Gym ID</span><strong>${esc(state.user?.gym_id || '—')}</strong></div>
        <div class="kv"><span>Membresía</span><strong>${membershipBadge(membership?.status)}</strong></div>
        <div class="kv"><span>Plan</span><strong>${esc(plan?.name || '—')}</strong></div>
        <div class="kv"><span>Vence</span><strong>${membership ? fmtDate(membership.end_date) : '—'}</strong></div>
      </div>

      <div class="card">
        <h2>Acceso biométrico</h2>
        <p style="margin:0 0 12px;font-size:12.5px;color:var(--muted);line-height:1.5">
          ${hasBio ? 'Huella o Face ID activado para desbloquear la app.' : 'Activá huella o Face ID para entrar sin escribir el PIN.'}
        </p>
        <button class="btn ${hasBio ? 'ghost' : 'secondary'}" id="bio-toggle">
          ${hasBio ? 'Desactivar biometría' : 'Activar biometría'}
        </button>
      </div>

      <div class="card">
        <h2>Preferencias</h2>
        <div class="field" style="margin-bottom:10px">
          <label style="color:var(--muted)">URL de la API</label>
          <input id="api-url" value="${esc(state.api)}" style="padding:10px 12px;border:1px solid var(--line);border-radius:10px;width:100%" />
        </div>
        <button class="btn ghost sm" id="save-api">Guardar URL</button>
      </div>

      <button class="btn ghost" id="install-btn" hidden style="margin-bottom:10px">Instalar app en el celular</button>
      <button class="btn danger" id="logout-btn">Cerrar sesión</button>
      <p style="text-align:center;font-size:11px;color:var(--muted);margin-top:16px">GymSync Socio · v1.0</p>
    `;

    viewEl.querySelector('#bio-toggle').addEventListener('click', async () => {
      if (localStorage.getItem(CRED_KEY)) {
        localStorage.removeItem(CRED_KEY);
        toast('Biometría desactivada');
        render();
      } else {
        if (!(await biometricSupported())) {
          toast('Este dispositivo no soporta biometría');
          return;
        }
        await registerBiometric();
      }
    });

    viewEl.querySelector('#save-api').addEventListener('click', () => {
      const value = viewEl.querySelector('#api-url').value.trim() || DEFAULT_API;
      state.api = value;
      localStorage.setItem(API_KEY, value);
      toast('URL guardada');
    });

    const installBtn = viewEl.querySelector('#install-btn');
    if (state.installPrompt) {
      installBtn.hidden = false;
      installBtn.addEventListener('click', async () => {
        state.installPrompt.prompt();
        await state.installPrompt.userChoice;
        state.installPrompt = null;
        render();
      });
    }

    viewEl.querySelector('#logout-btn').addEventListener('click', () => {
      clearSession();
      state.view = 'home';
      state.locked = false;
      render();
      toast('Sesión cerrada');
    });
  }

  // ── Router ────────────────────────────────────────────────────
  function go(view) {
    state.view = view;
    render();
    viewEl.scrollTop = 0;
  }

  function updateTabs() {
    tabbar.querySelectorAll('.tab').forEach((tab) =>
      tab.classList.toggle('active', tab.dataset.view === state.view)
    );
  }

  function render() {
    offlineBanner.hidden = !state.offline;
    if (!state.user) return renderLogin();
    if (state.locked) return renderLock();

    tabbar.hidden = false;
    updateTabs();
    if (state.view === 'routines') renderRoutines();
    else if (state.view === 'shop') renderShop();
    else if (state.view === 'profile') renderProfile();
    else renderHome();
  }

  // ── Arranque ──────────────────────────────────────────────────
  async function init() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        state.token = saved.token || '';
        state.user = saved.user || null;
      }
    } catch {
      clearSession();
    }

    if (state.user) {
      state.locked = !!localStorage.getItem(CRED_KEY);
      await refresh();
    }
    render();

    tabbar.querySelectorAll('.tab').forEach((tab) =>
      tab.addEventListener('click', () => go(tab.dataset.view))
    );

    window.addEventListener('online', async () => {
      await refresh();
      render();
    });
    window.addEventListener('offline', () => {
      state.offline = true;
      render();
    });

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      state.installPrompt = e;
      if (state.user && state.view === 'profile') render();
    });

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
