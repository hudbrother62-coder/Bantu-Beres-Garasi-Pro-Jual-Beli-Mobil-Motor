const SUPABASE_URL = "https://enmbebmcjenngzjcnbma.supabase.co";
const SUPABASE_KEY = "sb_publishable_NCTMqAr8tJ6bswIJQclCbA_HU96WUA5";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const app = document.querySelector("#app");
const mobileIcons = {
  dashboard: "home",
  vehicles: "directions_car",
  sales: "receipt_long",
  finance: "account_balance_wallet",
  costs: "build",
  customers: "group",
  leads: "follow_the_signs",
  reports: "bar_chart",
  settings: "settings",
  team: "groups",
};
function renderShellMobileV3() {
  const user =
      state.session.user.user_metadata?.username ||
      state.session.user.email.split("@")[0],
    business =
      state.showroom.business_type === "both"
        ? "Mobil & Motor"
        : state.showroom.business_type === "car"
          ? "Mobil"
          : "Motor";
  app.innerHTML = `<div class="shell shell-v3"><aside class="sidebar"><div class="side-brand">${logo()}<div><strong>Garasi Pro</strong><span>Bantu Beres</span></div></div><nav class="nav">${navV2.map(([id, n]) => `<button data-view="${id}" class="${state.view === id ? "active" : ""}"><span class="material-symbols-rounded">${mobileIcons[id]}</span>${n}</button>`).join("")}</nav><div class="sidebar-foot"><div class="user-chip">${esc(user)}</div><button class="logout-button" data-logout>Keluar akun</button></div></aside><main class="main"><header class="topbar"><div class="mobile-brand">${logo()}<div><strong>${esc(state.showroom.name)}</strong><span>Showroom ${business}</span></div></div><div class="showroom-name">${esc(state.showroom.name)}<span>Showroom ${business} · ${esc(state.showroom.city || "Belum ada kota")}</span></div><div class="top-actions"><button class="icon-btn desktop-refresh" data-refresh aria-label="Muat ulang"><span class="material-symbols-rounded">refresh</span></button><button class="icon-btn" data-theme aria-label="Ganti tema"><span class="material-symbols-rounded">${document.documentElement.dataset.theme === "dark" ? "light_mode" : "dark_mode"}</span></button><button class="icon-btn mobile-menu-button" data-menu aria-label="Buka menu"><span class="material-symbols-rounded">menu</span></button></div></header><section id="page" class="page"></section></main><nav class="mobile-nav">${navV2
    .slice(0, 4)
    .map(
      ([id, n]) =>
        `<button data-view="${id}" class="${state.view === id ? "active" : ""}"><span class="material-symbols-rounded">${mobileIcons[id]}</span><span>${n}</span></button>`,
    )
    .join(
      "",
    )}</nav><aside class="mobile-drawer" aria-hidden="true"><div class="drawer-brand">${logo()}<div><strong>Bantu Beres</strong><span>Garasi Pro</span></div><button class="icon-btn" data-menu-close aria-label="Tutup menu"><span class="material-symbols-rounded">close</span></button></div><div class="drawer-account"><small>Akun showroom</small><strong>${esc(state.showroom.name)}</strong><span>${esc(user)}</span></div><nav>${navV2.map(([id, n]) => `<button data-view="${id}" class="${state.view === id ? "active" : ""}"><span class="material-symbols-rounded">${mobileIcons[id]}</span>${n}</button>`).join("")}</nav><button class="drawer-logout" data-logout><span class="material-symbols-rounded">logout</span> Keluar akun</button></aside><div class="drawer-shade" data-menu-close></div></div>`;
  document
    .querySelectorAll("[data-view]")
    .forEach((b) => (b.onclick = () => gotoView(b.dataset.view)));
  document.querySelectorAll("[data-logout]").forEach(
    (b) =>
      (b.onclick = async () => {
        await db.auth.signOut();
        state = { ...state, session: null, showroom: null };
        renderAuth();
      }),
  );
  document.querySelector("[data-refresh]").onclick = async () => {
    await loadData();
    renderPage();
    toast("Data berhasil diperbarui");
  };
  document.querySelector("[data-theme]").onclick = () => {
    setTheme(
      document.documentElement.dataset.theme === "dark" ? "light" : "dark",
    );
    renderShellMobileV3();
  };
  const shell = document.querySelector(".shell"),
    open = () => {
      shell.classList.add("drawer-open");
      document.body.classList.add("no-scroll");
    },
    close = () => {
      shell.classList.remove("drawer-open");
      document.body.classList.remove("no-scroll");
    };
  document.querySelector("[data-menu]").onclick = open;
  document
    .querySelectorAll("[data-menu-close]")
    .forEach((x) => (x.onclick = close));
  renderPage();
}
let state = {
  session: null,
  showroom: null,
  member: null,
  team: [],
  view: "dashboard",
  vehicles: [],
  costs: [],
  customers: [],
  leads: [],
  sales: [],
  accounts: [],
  transactions: [],
  photos: [],
};
const rupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n || 0));
const esc = (s) =>
  String(s ?? "").replace(
    /[&<>'"]/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[
        c
      ],
  );
const mark = () =>
  '<span class="brand-mark logo-bantuberes" role="img" aria-label="BantuBeres"></span>';
function toast(msg) {
  const el = document.querySelector("#toast");
  el.textContent = msg;
  el.classList.add("toast-show");
  setTimeout(() => el.classList.remove("toast-show"), 3200);
}
function status(s) {
  return `<span class="status ${String(s).replaceAll(" ", "_")}">${esc(String(s).replaceAll("_", " "))}</span>`;
}
async function init() {
  const {
    data: { session },
  } = await db.auth.getSession();
  state.session = session;
  if (!session) return renderAuth();
  await loadShowroom();
}
async function loadShowroom() {
  const { data: memberships, error: memberError } = await db
    .from("showroom_members")
    .select("showroom_id,user_id,role,full_name,username,is_active,showrooms(*)")
    .eq("user_id", state.session.user.id)
    .eq("is_active", true)
    .limit(1);
  if (memberError) return toast(memberError.message, "error");
  const membership = memberships?.[0];
  state.member = membership || null;
  state.showroom = membership?.showrooms || null;
  if (!state.showroom) {
    const { data, error } = await db
      .from("showrooms")
      .select("*")
      .eq("owner_id", state.session.user.id)
      .limit(1);
    if (error) return toast(error.message, "error");
    state.showroom = data?.[0] || null;
    if (state.showroom) state.member = { role: "owner", user_id: state.session.user.id, is_active: true };
  }
  if (!state.showroom) return renderOnboarding();
  await loadData();
  renderShell();
}
async function loadData() {
  const id = state.showroom.id;
  const [v, c, cu, l, s, a, t, ph] = await Promise.all([
    db
      .from("vehicles")
      .select("*")
      .eq("showroom_id", id)
      .order("created_at", { ascending: false }),
    db.from("vehicle_costs").select("*").eq("showroom_id", id),
    db
      .from("customers")
      .select("*")
      .eq("showroom_id", id)
      .order("created_at", { ascending: false }),
    db
      .from("leads")
      .select("*, customers(full_name,phone), vehicles(brand,model,year)")
      .eq("showroom_id", id)
      .order("created_at", { ascending: false }),
    db
      .from("sales")
      .select("*, vehicles(brand,model,year), customers(full_name)")
      .eq("showroom_id", id)
      .order("sale_date", { ascending: false }),
    db.from("cash_accounts").select("*").eq("showroom_id", id),
    db
      .from("cash_transactions")
      .select("*")
      .eq("showroom_id", id)
      .order("transaction_date", { ascending: false }),
    db
      .from("vehicle_photos")
      .select("*")
      .eq("showroom_id", id)
      .order("sort_order"),
  ]);
  Object.assign(state, {
    vehicles: v.data || [],
    costs: c.data || [],
    customers: cu.data || [],
    leads: l.data || [],
    sales: s.data || [],
    accounts: a.data || [],
    transactions: t.data || [],
    photos: ph.data || [],
  });
  if (state.member?.role === "owner") await loadTeam();
  else state.team = [];
}
function renderAuth() {
  app.innerHTML = `<main class="auth"><section class="auth-card"><div class="brand">${mark()}<span>Bantu Beres Garasi Pro</span></div><h1>Kelola showroom lebih jelas.</h1><p>Catat mobil atau motor, hitung modal sebenarnya, dan pantau penjualan per unit.</p><div class="tabs"><button class="active" data-auth="login">Masuk</button><button data-auth="register">Daftar</button></div><form id="authForm"><label>Username</label><input name="username" required autocomplete="username" placeholder="Contoh: garasimaju"><label>Kata sandi</label><input type="password" name="password" required autocomplete="current-password" minlength="6" placeholder="Minimal 6 karakter"><button class="button full">Masuk ke aplikasi</button></form></section></main>`;
  document
    .querySelectorAll("[data-auth]")
    .forEach((b) => (b.onclick = () => switchAuth(b.dataset.auth)));
  document.querySelector("#authForm").onsubmit = authSubmit;
}
function switchAuth(mode) {
  document
    .querySelectorAll("[data-auth]")
    .forEach((b) => b.classList.toggle("active", b.dataset.auth === mode));
  document.querySelector("#authForm").innerHTML =
    `${mode === "register" ? '<label>Nama lengkap</label><input name="name" required autocomplete="name" placeholder="Nama pemilik showroom">' : ""}<label>Username</label><input name="username" required autocomplete="username" placeholder="Contoh: garasimaju"><label>Kata sandi</label><input type="password" name="password" required autocomplete="${mode === "register" ? "new-password" : "current-password"}" minlength="6" placeholder="Minimal 6 karakter"><button class="button full">${mode === "register" ? "Buat akun" : "Masuk ke aplikasi"}</button>`;
  document.querySelector("#authForm").dataset.mode = mode;
}
function loginIdentity(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (raw.includes("@")) return raw;
  return /^[a-z0-9._-]{3,32}$/.test(raw)
    ? `${raw}@login.garasipro.local`
    : null;
}
async function registerUsernameAccount(username, password, fullName) {
  const { data, error } = await db.functions.invoke("account-signup", {
    body: { username, password, full_name: fullName },
  });
  if (!error) return { data };
  let message = "Pendaftaran belum dapat diproses. Coba lagi.";
  try {
    const detail = await error.context.json();
    message = detail.error || message;
  } catch {}
  return { error: { message } };
}
async function authSubmit(e) {
  e.preventDefault();
  const form = e.currentTarget,
    f = new FormData(form),
    username = f.get("username"),
    email = loginIdentity(username),
    password = f.get("password"),
    register = form.dataset.mode === "register";
  if (!email)
    return toast(
      "Username gunakan 3–32 karakter: huruf, angka, titik, garis bawah, atau strip.",
    );
  const submit = form.querySelector('button[type="submit"],button:not([type])');
  submit.disabled = true;
  submit.textContent = register ? "Membuat akun..." : "Memeriksa akun...";
  const r = register
    ? await registerUsernameAccount(
        String(username).trim(),
        password,
        f.get("name"),
      )
    : await db.auth.signInWithPassword({ email, password });
  if (r.error) {
    submit.disabled = false;
    submit.textContent = register ? "Buat akun" : "Masuk ke aplikasi";
    return toast(r.error.message);
  }
  const login = register
    ? await db.auth.signInWithPassword({ email, password })
    : r;
  if (login.error || !login.data.session) {
    submit.disabled = false;
    submit.textContent = register ? "Buat akun" : "Masuk ke aplikasi";
    return toast(
      login.error?.message || "Sesi akun belum terbentuk. Coba masuk kembali.",
    );
  }
  state.session = login.data.session;
  await loadShowroom();
}
function renderOnboarding() {
  app.innerHTML = `<main class="auth"><section class="onboarding"><div class="brand">${mark()}<span>Bantu Beres Garasi Pro</span></div><h1>Siapkan showroom kamu</h1><p>Jenis usaha menentukan formulir kendaraan, kategori biaya, katalog, dan laporan akun ini.</p><div class="panel"><form id="setupForm"><label>Nama showroom</label><input name="name" required placeholder="Contoh: Garasi Maju Jaya"><div class="form-grid"><div><label>Kota</label><input name="city" placeholder="Contoh: Malang"></div><div><label>Nomor WhatsApp</label><input name="phone" placeholder="08xxxxxxxxxx"></div></div><label>Jenis usaha</label><div class="choice-grid" id="typeChoices"><button type="button" class="choice selected" data-type="car"><strong>Showroom Mobil</strong><span>Kelola stok dan penjualan mobil.</span></button><button type="button" class="choice" data-type="motorcycle"><strong>Showroom Motor</strong><span>Kelola stok dan penjualan motor.</span></button><button type="button" class="choice" data-type="both"><strong>Mobil + Motor</strong><span>Gunakan dua kategori kendaraan.</span></button></div><input type="hidden" name="business_type" value="car"><button class="button full">Buat ruang showroom</button></form></div></section></main>`;
  document.querySelectorAll("[data-type]").forEach(
    (b) =>
      (b.onclick = () => {
        document
          .querySelectorAll("[data-type]")
          .forEach((x) => x.classList.remove("selected"));
        b.classList.add("selected");
        document.querySelector("[name=business_type]").value = b.dataset.type;
      }),
  );
  document.querySelector("#setupForm").onsubmit = setupShowroom;
}
async function setupShowroom(e) {
  e.preventDefault();
  const f = new FormData(e.currentTarget),
    row = {
      owner_id: state.session.user.id,
      name: f.get("name"),
      city: f.get("city"),
      phone: f.get("phone"),
      business_type: f.get("business_type"),
    };
  const { data, error } = await db
    .from("showrooms")
    .insert(row)
    .select()
    .single();
  if (error) return toast(error.message);
  const r = await db.from("showroom_members").insert({
    showroom_id: data.id,
    user_id: state.session.user.id,
    role: "owner",
    full_name: state.session.user.user_metadata?.full_name || "Owner",
    username: state.session.user.user_metadata?.username || state.session.user.email.split("@")[0],
    is_active: true,
  });
  if (r.error) return toast(r.error.message);
  await db
    .from("cash_accounts")
    .insert({ showroom_id: data.id, name: "Kas Utama", account_type: "cash" });
  state.showroom = data;
  state.member = { showroom_id: data.id, user_id: state.session.user.id, role: "owner", is_active: true };
  await loadData();
  renderShell();
  toast("Showroom berhasil dibuat");
}
const nav = [
  ["dashboard", "Dashboard"],
  ["vehicles", "Kendaraan"],
  ["costs", "Rekondisi"],
  ["customers", "Customer"],
  ["leads", "Lead & Follow-up"],
  ["sales", "Penjualan"],
  ["finance", "Keuangan"],
  ["reports", "Laporan"],
  ["settings", "Pengaturan"],
];
function renderShell() {
  app.innerHTML = `<div class="shell"><aside class="sidebar"><div class="brand">${mark()}<span>Garasi Pro</span></div><div class="side-section">Operasional</div><nav class="nav">${nav.map(([id, n]) => `<button data-view="${id}" class="${state.view === id ? "active" : ""}">${n}</button>`).join("")}</nav><div class="sidebar-foot"><div class="user-chip">${esc(state.session.user.user_metadata?.username || state.session.user.email)}</div><button id="logout" class="nav">Keluar akun</button></div></aside><main class="main"><header class="topbar"><div class="showroom-name">${esc(state.showroom.name)}<span>${state.showroom.business_type === "both" ? "Mobil & Motor" : state.showroom.business_type === "car" ? "Showroom Mobil" : "Showroom Motor"} · ${esc(state.showroom.city || "Belum ada kota")}</span></div><div class="top-actions"><button class="icon-btn" id="refresh" title="Muat ulang">↻</button><button class="icon-btn" id="theme" title="Tampilan">◐</button></div></header><section id="page" class="page"></section></main></div>`;
  document.querySelectorAll("[data-view]").forEach(
    (b) =>
      (b.onclick = () => {
        state.view = b.dataset.view;
        renderShell();
      }),
  );
  document.querySelector("#logout").onclick = async () => {
    await db.auth.signOut();
    state = { ...state, session: null, showroom: null };
    renderAuth();
  };
  document.querySelector("#refresh").onclick = async () => {
    await loadData();
    renderPage();
    toast("Data diperbarui");
  };
  renderPage();
}
function pageHead(title, desc, button = "") {
  return `<div class="page-head"><div><h1>${title}</h1><p>${desc}</p></div>${button}</div>`;
}
function renderPage() {
  const p = document.querySelector("#page");
  const m = {
    dashboard: dashboard,
    vehicles: vehicles,
    costs: costs,
    customers: customers,
    leads: leads,
    sales: sales,
    finance: finance,
    reports: reports,
    settings: settings,
  };
  p.innerHTML = m[state.view]();
  bindPage();
}
function dashboard() {
  const inStock = state.vehicles.filter(
    (v) => !["sold", "delivered", "cancelled"].includes(v.status),
  );
  const hpp = (v) =>
    Number(v.purchase_price) +
    state.costs
      .filter((c) => c.vehicle_id === v.id)
      .reduce((a, c) => a + Number(c.amount), 0);
  const capital = inStock.reduce((a, v) => a + hpp(v), 0);
  const profit = state.sales.reduce((a, s) => {
    const v = state.vehicles.find((x) => x.id === s.vehicle_id);
    return (
      a +
      Number(s.sale_price) -
      Number(s.discount) -
      Number(s.commission) -
      (v ? hpp(v) : 0)
    );
  }, 0);
  const old = inStock.filter(
    (v) => (Date.now() - new Date(v.purchase_date)) / 864e5 > 90,
  );
  const unpaid = state.sales.filter((s) => s.payment_status !== "paid");
  return `${pageHead("Dashboard", "Ringkasan kondisi showroom hari ini", '<button class="button primary-action" data-modal="vehicle">+ Tambah kendaraan</button>')}<div class="metric-grid"><div class="metric"><div class="label">MODAL DI STOK</div><div class="value">${rupiah(capital)}</div><div class="meta">${inStock.length} unit aktif</div></div><div class="metric"><div class="label">UNIT TERJUAL</div><div class="value">${state.sales.length}</div><div class="meta">Seluruh periode</div></div><div class="metric"><div class="label">LABA BERSIH</div><div class="value ${profit < 0 ? "bad" : "up"}">${rupiah(profit)}</div><div class="meta">Setelah biaya dan komisi</div></div><div class="metric"><div class="label">PIUTANG AKTIF</div><div class="value ${unpaid.length ? "warn" : ""}">${unpaid.length}</div><div class="meta">Penjualan belum lunas</div></div></div><div class="dashboard-grid"><section class="panel"><h2>Tindakan prioritas</h2><p class="sub">Hal yang perlu dibereskan lebih dulu.</p><div class="action-list">${old.length ? `<div class="action"><i class="dot bad"></i><div><strong>${old.length} unit melewati 90 hari</strong><p>Evaluasi harga, promosi, atau kondisi kendaraan agar modal tidak terlalu lama tertahan.</p></div></div>` : ""}${unpaid.length ? `<div class="action"><i class="dot warn"></i><div><strong>${unpaid.length} pembayaran belum lunas</strong><p>Periksa pencairan leasing atau sisa pembayaran customer.</p></div></div>` : ""}${!old.length && !unpaid.length ? '<div class="action"><i class="dot ok"></i><div><strong>Kondisi stok sehat</strong><p>Tidak ada peringatan penting pada data saat ini.</p></div></div>' : ""}</div></section><section class="panel"><h2>Stok terbaru</h2><p class="sub">Unit yang terakhir ditambahkan.</p>${stockRows(inStock.slice(0, 5))}</section></div>`;
}
function stockRows(rows) {
  return rows.length
    ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Unit</th><th>Target jual</th><th>Status</th></tr></thead><tbody>${rows.map((v) => `<tr><td><strong>${esc(v.brand)} ${esc(v.model)}</strong><br><small>${esc(v.code)} · ${v.year || "-"}</small></td><td>${rupiah(v.target_price)}</td><td>${status(v.status)}</td></tr>`).join("")}</tbody></table></div>`
    : '<div class="empty">Belum ada kendaraan. Tambahkan unit pertama.</div>';
}
function vehicles() {
  return `${pageHead("Kendaraan", "Stok mobil dan motor showroom.", '<button class="button primary-action" data-modal="vehicle">+ Tambah kendaraan</button>')}<div class="panel"><div class="filter-row"><input id="vehicleSearch" placeholder="Cari kode, merek, tipe, atau nomor polisi"><select id="vehicleStatus"><option value="">Semua status</option>${["inspection", "reconditioning", "ready", "listed", "booked", "sold", "delivered"].map((s) => `<option>${s}</option>`).join("")}</select></div><div id="vehicleTable">${vehicleTable(state.vehicles)}</div></div>`;
}
function vehicleTable(rows) {
  return rows.length
    ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Unit</th><th>Jenis</th><th>Modal</th><th>Target jual</th><th>Umur</th><th>Status</th><th></th></tr></thead><tbody>${rows
        .map((v) => {
          const total =
            Number(v.purchase_price) +
            state.costs
              .filter((c) => c.vehicle_id === v.id)
              .reduce((a, c) => a + Number(c.amount), 0);
          const age = Math.max(
            0,
            Math.floor((Date.now() - new Date(v.purchase_date)) / 864e5),
          );
          return `<tr><td><strong>${esc(v.brand)} ${esc(v.model)}</strong><br><small>${esc(v.code)} · ${v.year || "-"} · ${esc(v.license_plate || "-")}</small></td><td>${v.vehicle_type === "car" ? "Mobil" : "Motor"}</td><td>${rupiah(total)}</td><td>${rupiah(v.target_price)}</td><td class="${age > 90 ? "bad" : ""}">${age} hari</td><td>${status(v.status)}</td><td><button class="icon-btn" data-edit-vehicle="${v.id}" title="Ubah">✎</button></td></tr>`;
        })
        .join("")}</tbody></table></div>`
    : '<div class="empty">Tidak ada kendaraan yang sesuai.</div>';
}
function costs() {
  return `${pageHead("Biaya Rekondisi", "Catat semua biaya agar HPP aktual tidak menipu.", '<button class="button primary-action" data-modal="cost">+ Catat biaya</button>')}<div class="metric-grid"><div class="metric"><div class="label">TOTAL REKONDISI</div><div class="value">${rupiah(state.costs.reduce((a, c) => a + Number(c.amount), 0))}</div><div class="meta">Semua unit</div></div><div class="metric"><div class="label">CATATAN BIAYA</div><div class="value">${state.costs.length}</div><div class="meta">Transaksi tercatat</div></div></div><div class="panel" style="margin-top:16px"><div class="table-wrap"><table class="data-table"><thead><tr><th>Tanggal</th><th>Unit</th><th>Kategori</th><th>Bengkel/Keterangan</th><th>Nominal</th></tr></thead><tbody>${
    state.costs
      .map((c) => {
        const v = state.vehicles.find((v) => v.id === c.vehicle_id);
        return `<tr><td>${c.cost_date}</td><td>${esc(v ? `${v.brand} ${v.model}` : "-")}</td><td>${esc(c.category)}</td><td>${esc(c.vendor || c.note || "-")}</td><td>${rupiah(c.amount)}</td></tr>`;
      })
      .join("") ||
    '<tr><td colspan="5"><div class="empty">Belum ada biaya rekondisi.</div></td></tr>'
  }</tbody></table></div></div>`;
}
function customers() {
  return `${pageHead("Customer", "Simpan data calon pembeli dan pelanggan.", '<button class="button primary-action" data-modal="customer">+ Tambah customer</button>')}<div class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Nama</th><th>WhatsApp</th><th>Kota</th><th>Sumber</th><th>Catatan</th></tr></thead><tbody>${state.customers.map((c) => `<tr><td><strong>${esc(c.full_name)}</strong></td><td>${esc(c.phone || "-")}</td><td>${esc(c.city || "-")}</td><td>${esc(c.source || "-")}</td><td>${esc(c.note || "-")}</td></tr>`).join("") || '<tr><td colspan="5"><div class="empty">Belum ada customer.</div></td></tr>'}</tbody></table></div></div>`;
}
function leads() {
  return `${pageHead("Lead & Follow-up", "Pantau peluang sebelum berubah menjadi penjualan.", '<button class="button primary-action" data-modal="lead">+ Tambah lead</button>')}<div class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Customer</th><th>Unit diminati</th><th>Status</th><th>Follow-up</th><th>Penawaran</th></tr></thead><tbody>${state.leads.map((l) => `<tr><td><strong>${esc(l.customers?.full_name || "-")}</strong></td><td>${esc(l.vehicles ? `${l.vehicles.brand} ${l.vehicles.model}` : "-")}</td><td>${status(l.status)}</td><td>${l.next_follow_up_at ? new Date(l.next_follow_up_at).toLocaleDateString("id-ID") : "-"}</td><td>${rupiah(l.offered_price)}</td></tr>`).join("") || '<tr><td colspan="5"><div class="empty">Belum ada lead.</div></td></tr>'}</tbody></table></div></div>`;
}
function sales() {
  return `${pageHead("Penjualan", "Unit yang terjual, pembayaran, dan laba per transaksi.", '<button class="button primary-action" data-modal="sale">+ Catat penjualan</button>')}<div class="panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>No. nota</th><th>Unit</th><th>Customer</th><th>Harga jual</th><th>Status bayar</th><th>Perkiraan laba</th></tr></thead><tbody>${
    state.sales
      .map((s) => {
        const v = state.vehicles.find((x) => x.id === s.vehicle_id);
        const hpp = v
          ? Number(v.purchase_price) +
            state.costs
              .filter((c) => c.vehicle_id === v.id)
              .reduce((a, c) => a + Number(c.amount), 0)
          : 0;
        const profit =
          Number(s.sale_price) -
          Number(s.discount) -
          Number(s.commission) -
          hpp;
        return `<tr><td><strong>${esc(s.invoice_number)}</strong><br><small>${s.sale_date}</small></td><td>${esc(s.vehicles ? `${s.vehicles.brand} ${s.vehicles.model}` : "-")}</td><td>${esc(s.customers?.full_name || "-")}</td><td>${rupiah(s.sale_price)}</td><td>${status(s.payment_status)}</td><td class="${profit < 0 ? "bad" : "up"}">${rupiah(profit)}</td></tr>`;
      })
      .join("") ||
    '<tr><td colspan="6"><div class="empty">Belum ada penjualan.</div></td></tr>'
  }</tbody></table></div></div>`;
}
function finance() {
  const balance = state.accounts.reduce(
    (sum, a) =>
      sum +
      Number(a.opening_balance) +
      state.transactions
        .filter((t) => t.account_id === a.id)
        .reduce(
          (x, t) =>
            x + (t.flow === "income" ? Number(t.amount) : -Number(t.amount)),
          0,
        ),
    0,
  );
  return `${pageHead("Keuangan", "Kas, pemasukan, dan pengeluaran operasional.", '<button class="button primary-action" data-modal="transaction">+ Catat transaksi</button>')}<div class="metric-grid"><div class="metric"><div class="label">SALDO KAS</div><div class="value">${rupiah(balance)}</div><div class="meta">${state.accounts.length} akun kas</div></div><div class="metric"><div class="label">PEMASUKAN</div><div class="value up">${rupiah(state.transactions.filter((t) => t.flow === "income").reduce((a, t) => a + Number(t.amount), 0))}</div><div class="meta">Transaksi tercatat</div></div><div class="metric"><div class="label">PENGELUARAN</div><div class="value bad">${rupiah(state.transactions.filter((t) => t.flow === "expense").reduce((a, t) => a + Number(t.amount), 0))}</div><div class="meta">Transaksi tercatat</div></div></div><div class="panel" style="margin-top:16px"><div class="table-wrap"><table class="data-table"><thead><tr><th>Tanggal</th><th>Arus</th><th>Kategori</th><th>Keterangan</th><th>Nilai</th></tr></thead><tbody>${state.transactions.map((t) => `<tr><td>${t.transaction_date}</td><td class="${t.flow === "income" ? "up" : "bad"}">${t.flow === "income" ? "Masuk" : "Keluar"}</td><td>${esc(t.category)}</td><td>${esc(t.note || "-")}</td><td>${rupiah(t.amount)}</td></tr>`).join("") || '<tr><td colspan="5"><div class="empty">Belum ada transaksi kas.</div></td></tr>'}</tbody></table></div></div>`;
}
function reports() {
  const inStock = state.vehicles.filter(
    (v) => !["sold", "delivered", "cancelled"].includes(v.status),
  );
  return `${pageHead("Laporan", "Ringkasan yang siap diekspor atau dicetak.")}<div class="dashboard-grid"><section class="panel"><h2>Laporan Stok</h2><p class="sub">${inStock.length} kendaraan masih tersedia.</p><button class="button secondary" data-print="stock">Cetak laporan stok</button></section><section class="panel"><h2>Laporan Penjualan</h2><p class="sub">${state.sales.length} transaksi penjualan tercatat.</p><button class="button secondary" data-print="sales">Cetak laporan penjualan</button></section><section class="panel"><h2>Laporan Piutang</h2><p class="sub">${state.sales.filter((s) => s.payment_status !== "paid").length} transaksi belum lunas.</p><button class="button secondary" data-print="receivable">Cetak laporan piutang</button></section><section class="panel"><h2>Catatan</h2><p class="sub">Cetak memakai data akun showroom yang sedang aktif.</p></section></div>`;
}
function settings() {
  return `${pageHead("Profil Showroom", "Informasi usaha yang digunakan pada laporan dan data showroom.", '<button class="button primary-action" id="saveSettings">Simpan perubahan</button>')}<div class="panel showroom-profile"><div class="form-grid"><div class="span-2"><label>Nama showroom</label><input id="setName" value="${esc(state.showroom.name)}"></div><div><label>Nama pemilik / penanggung jawab</label><input id="setOwner" value="${esc(state.showroom.owner_name || "")}"></div><div><label>Jenis usaha</label><select id="setType"><option value="car" ${state.showroom.business_type === "car" ? "selected" : ""}>Showroom Mobil</option><option value="motorcycle" ${state.showroom.business_type === "motorcycle" ? "selected" : ""}>Showroom Motor</option><option value="both" ${state.showroom.business_type === "both" ? "selected" : ""}>Mobil + Motor</option></select></div><div><label>Kota / kabupaten</label><input id="setCity" value="${esc(state.showroom.city || "")}"></div><div><label>Nomor telepon</label><input id="setPhone" value="${esc(state.showroom.phone || "")}"></div><div><label>WhatsApp</label><input id="setWhatsapp" value="${esc(state.showroom.whatsapp || state.showroom.phone || "")}"></div><div><label>Email kontak (opsional)</label><input id="setEmail" value="${esc(state.showroom.contact_email || "")}"></div><div class="span-2"><label>Alamat lengkap</label><textarea id="setAddress">${esc(state.showroom.address || "")}</textarea></div><div><label>Jam operasional</label><input id="setHours" value="${esc(state.showroom.opening_hours || "")}" placeholder="Senin–Sabtu, 08.00–17.00"></div><div class="span-2"><label>Keterangan showroom</label><textarea id="setDescription" placeholder="Layanan, spesialisasi kendaraan, atau informasi penting lainnya">${esc(state.showroom.description || "")}</textarea></div></div></div>`;
}
function bindPage() {
  document
    .querySelectorAll("[data-modal]")
    .forEach((b) => (b.onclick = () => openModal(b.dataset.modal)));
  document.querySelectorAll("[data-edit-vehicle]").forEach(
    (b) =>
      (b.onclick = () =>
        openModal(
          "vehicle",
          state.vehicles.find((v) => v.id === b.dataset.editVehicle),
        )),
  );
  const q = document.querySelector("#vehicleSearch"),
    st = document.querySelector("#vehicleStatus");
  if (q) {
    const filter = () => {
      const term = q.value.toLowerCase();
      document.querySelector("#vehicleTable").innerHTML = vehicleTable(
        state.vehicles.filter(
          (v) =>
            (!term ||
              [v.code, v.brand, v.model, v.license_plate]
                .join(" ")
                .toLowerCase()
                .includes(term)) &&
            (!st.value || v.status === st.value),
        ),
      );
    };
    q.oninput = filter;
    st.onchange = filter;
  }
  document
    .querySelector("#saveSettings")
    ?.addEventListener("click", saveSettings);
  document
    .querySelectorAll("[data-print]")
    .forEach((b) => (b.onclick = () => window.print()));
}
function options(items, selected = "", labelFn = (x) => x) {
  return items
    .map(
      (x) =>
        `<option value="${x.id || x}" ${(x.id || x) === selected ? "selected" : ""}>${esc(labelFn(x))}</option>`,
    )
    .join("");
}
function openModal(type, data = {}) {
  const vehicleOptions = options(
      state.vehicles.filter(
        (v) => !["sold", "delivered", "cancelled"].includes(v.status),
      ),
      data.vehicle_id,
      (v) => `${v.code} — ${v.brand} ${v.model}`,
    ),
    customerOptions = options(
      state.customers,
      data.customer_id,
      (c) => c.full_name,
    );
  const forms = {
    vehicle: `<h2>${data.id ? "Ubah" : "Tambah"} kendaraan</h2><div class="form-grid"><div><label>Kode unit</label><input name="code" required value="${esc(data.code || "")}"></div><div><label>Jenis</label><select name="vehicle_type"><option value="car" ${data.vehicle_type === "car" ? "selected" : ""}>Mobil</option><option value="motorcycle" ${data.vehicle_type === "motorcycle" ? "selected" : ""}>Motor</option></select></div><div><label>Merek</label><input name="brand" required value="${esc(data.brand || "")}"></div><div><label>Tipe/Model</label><input name="model" required value="${esc(data.model || "")}"></div><div><label>Tahun</label><input type="number" name="year" value="${data.year || ""}"></div><div><label>Nomor polisi</label><input name="license_plate" value="${esc(data.license_plate || "")}"></div><div><label>Harga beli</label><input type="number" min="0" name="purchase_price" value="${data.purchase_price || 0}"></div><div><label>Target jual</label><input type="number" min="0" name="target_price" value="${data.target_price || 0}"></div><div><label>Tanggal beli</label><input type="date" name="purchase_date" value="${data.purchase_date || new Date().toISOString().slice(0, 10)}"></div><div><label>Status</label><select name="status">${options(["inspection", "reconditioning", "ready", "listed", "booked", "sold", "delivered"], data.status || "inspection")}</select></div><div class="span-2"><label>Catatan</label><textarea name="description">${esc(data.description || "")}</textarea></div></div>`,
    cost: `<h2>Catat biaya rekondisi</h2><div class="form-grid"><div class="span-2"><label>Kendaraan</label><select name="vehicle_id" required><option value="">Pilih unit</option>${vehicleOptions}</select></div><div><label>Tanggal</label><input type="date" name="cost_date" value="${new Date().toISOString().slice(0, 10)}"></div><div><label>Kategori</label><input name="category" required placeholder="Contoh: Mesin / CVT / Ban"></div><div><label>Nominal</label><input type="number" min="1" name="amount" required></div><div><label>Bengkel/vendor</label><input name="vendor"></div><div class="span-2"><label>Catatan</label><textarea name="note"></textarea></div></div>`,
    customer: `<h2>Tambah customer</h2><div class="form-grid"><div class="span-2"><label>Nama lengkap</label><input name="full_name" required></div><div><label>WhatsApp</label><input name="phone"></div><div><label>Email</label><input type="email" name="email"></div><div><label>Kota</label><input name="city"></div><div><label>Sumber lead</label><input name="source" placeholder="WhatsApp, Instagram, walk-in"></div><div class="span-2"><label>Catatan</label><textarea name="note"></textarea></div></div>`,
    lead: `<h2>Tambah lead</h2><div class="form-grid"><div><label>Customer</label><select name="customer_id" required><option value="">Pilih customer</option>${customerOptions}</select></div><div><label>Unit diminati</label><select name="vehicle_id"><option value="">Belum memilih unit</option>${vehicleOptions}</select></div><div><label>Status</label><select name="status">${options(["new", "contacted", "interested", "visit_scheduled", "test_drive", "negotiation", "booked", "waiting_payment", "closed", "lost", "follow_up"], "new")}</select></div><div><label>Follow-up berikutnya</label><input type="datetime-local" name="next_follow_up_at"></div><div><label>Penawaran</label><input type="number" name="offered_price"></div><div class="span-2"><label>Catatan</label><textarea name="note"></textarea></div></div>`,
    sale: `<h2>Catat penjualan</h2><div class="form-grid"><div><label>Unit terjual</label><select name="vehicle_id" required><option value="">Pilih unit</option>${vehicleOptions}</select></div><div><label>Customer</label><select name="customer_id"><option value="">Pilih customer</option>${customerOptions}</select></div><div><label>No. nota</label><input name="invoice_number" required value="NJ-${String(Date.now()).slice(-6)}"></div><div><label>Tanggal jual</label><input type="date" name="sale_date" value="${new Date().toISOString().slice(0, 10)}"></div><div><label>Harga jual</label><input type="number" min="0" name="sale_price" required></div><div><label>Diskon</label><input type="number" min="0" name="discount" value="0"></div><div><label>Komisi sales</label><input type="number" min="0" name="commission" value="0"></div><div><label>Status pembayaran</label><select name="payment_status">${options(["unpaid", "partial", "paid"], "unpaid")}</select></div><div class="span-2"><label>Metode pembayaran / leasing</label><input name="payment_method"></div></div>`,
    transaction: `<h2>Catat transaksi kas</h2><div class="form-grid"><div><label>Arus</label><select name="flow"><option value="income">Pemasukan</option><option value="expense">Pengeluaran</option></select></div><div><label>Akun kas</label><select name="account_id"><option value="">Tanpa akun</option>${options(state.accounts, "", (a) => a.name)}</select></div><div><label>Tanggal</label><input type="date" name="transaction_date" value="${new Date().toISOString().slice(0, 10)}"></div><div><label>Kategori</label><input name="category" required></div><div><label>Nominal</label><input type="number" min="1" name="amount" required></div><div class="span-2"><label>Keterangan</label><textarea name="note"></textarea></div></div>`,
  };
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<section class="modal"><div class="modal-head">${forms[type]}<button class="icon-btn" data-close>×</button></div></section>`;
  const title = modal.querySelector("h2");
  const form = document.createElement("form");
  form.className = "modal-body";
  form.innerHTML =
    title.parentElement.innerHTML.replace(title.outerHTML, "") +
    `<div class="modal-foot"><button type="button" class="button secondary" data-close>Batal</button><button class="button">Simpan</button></div>`;
  modal.querySelector(".modal").innerHTML = "";
  modal.querySelector(".modal").append(form);
  document.body.append(modal);
  modal
    .querySelectorAll("[data-close]")
    .forEach((b) => (b.onclick = () => modal.remove()));
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
  form.onsubmit = (e) => saveForm(e, type, data.id, modal);
}
async function saveForm(e, type, id, modal) {
  e.preventDefault();
  const formData = new FormData(e.currentTarget);
  const photoFiles =
    type === "vehicle" ? formData.getAll("photos").filter((f) => f?.size) : [];
  const raw = Object.fromEntries(formData);
  delete raw.photos;
  Object.keys(raw).forEach((k) => {
    if (raw[k] === "") raw[k] = null;
  });
  const numberFields = [
    "year",
    "mileage",
    "engine_capacity",
    "purchase_price",
    "target_price",
    "minimum_price",
    "amount",
    "offered_price",
    "sale_price",
    "discount",
    "commission",
    "paid_amount",
  ];
  numberFields.forEach((k) => {
    if (k in raw && raw[k] != null) raw[k] = Number(raw[k]);
  });
  const table = {
    vehicle: "vehicles",
    cost: "vehicle_costs",
    customer: "customers",
    lead: "leads",
    sale: "sales",
    transaction: "cash_transactions",
  }[type];
  raw.showroom_id = state.showroom.id;
  if (type === "customer" && state.member?.role === "sales") {
    raw.assigned_to = state.session.user.id;
    raw.created_by = state.session.user.id;
  }
  if (type === "lead" && state.member?.role === "sales")
    raw.assigned_to = state.session.user.id;
  if (type === "sale" && state.member?.role === "sales")
    raw.sales_person_id = state.session.user.id;
  if (type === "vehicle") {
    delete raw.code;
    if (state.showroom.business_type !== "both")
      raw.vehicle_type = state.showroom.business_type;
  }
  const request = id
    ? db.from(table).update(raw).eq("id", id)
    : db.from(table).insert(raw);
  const { data: savedRows, error } = await request.select();
  if (error) return toast(error.message, "error");
  if (type === "vehicle" && photoFiles.length) {
    const vehicleId = id || savedRows?.[0]?.id;
    const existingCount = state.photos.filter(
      (p) => p.vehicle_id === vehicleId,
    ).length;
    for (let index = 0; index < photoFiles.length; index++) {
      const file = photoFiles[index];
      if (file.size > 5 * 1024 * 1024)
        return toast(`${file.name} melebihi 5 MB`, "error");
      const extension = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${state.showroom.id}/${vehicleId}/${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await db.storage
        .from("vehicle-photos")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) return toast(uploadError.message, "error");
      const { data: publicData } = db.storage
        .from("vehicle-photos")
        .getPublicUrl(path);
      const isPrimary = existingCount === 0 && index === 0;
      const { error: photoError } = await db
        .from("vehicle_photos")
        .insert({
          showroom_id: state.showroom.id,
          vehicle_id: vehicleId,
          storage_path: path,
          public_url: publicData.publicUrl,
          is_primary: isPrimary,
          sort_order: existingCount + index,
        });
      if (photoError) return toast(photoError.message, "error");
      if (isPrimary)
        await db
          .from("vehicles")
          .update({ cover_url: publicData.publicUrl })
          .eq("id", vehicleId);
    }
  }
  modal.remove();
  await loadData();
  renderShell();
  toast("Data berhasil disimpan");
}
async function saveSettings() {
  const row = {
    name: document.querySelector("#setName").value,
    city: document.querySelector("#setCity").value,
    phone: document.querySelector("#setPhone").value,
    address: document.querySelector("#setAddress").value,
    business_type: document.querySelector("#setType").value,
    owner_name: document.querySelector("#setOwner").value,
    whatsapp: document.querySelector("#setWhatsapp").value,
    contact_email: document.querySelector("#setEmail").value,
    opening_hours: document.querySelector("#setHours").value,
    description: document.querySelector("#setDescription").value,
  };
  const { data, error } = await db
    .from("showrooms")
    .update(row)
    .eq("id", state.showroom.id)
    .select()
    .single();
  if (error) return toast(error.message);
  state.showroom = data;
  renderShell();
  toast("Pengaturan disimpan");
}
document.addEventListener(
  "click",
  (event) => {
    if (event.target.matches("[data-close]")) event.preventDefault();
  },
  true,
);
db.auth.onAuthStateChange((_event, session) => {
  if (!session && state.session) {
    state.session = null;
    renderAuth();
  }
});
init();

/* Approved mobile-first shell: one navigation source, left drawer, five bottom actions. */
dashboard = function () {
  const stock = state.vehicles.filter(
    (v) => !["sold", "delivered", "cancelled"].includes(v.status),
  );
  const capital = stock.reduce((sum, v) => sum + vehicleHpp(v), 0);
  const income = state.transactions
    .filter((t) => t.flow === "income")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const expense = state.transactions
    .filter((t) => t.flow === "expense")
    .reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const unpaid = state.sales.filter((s) => s.payment_status !== "paid");
  const old = stock.filter(
    (v) =>
      v.purchase_date && (Date.now() - new Date(v.purchase_date)) / 864e5 > 90,
  );
  return `${pageHead("Dashboard", "Ringkasan showroom dan aktivitas terbaru.")}
    <section class="hero-summary"><div><span>Nilai stok aktif</span><strong>${rupiah(capital)}</strong><small>${stock.length} kendaraan tersedia</small></div><span class="material-symbols-rounded">garage_home</span></section>
    <div class="metric-grid dashboard-metrics"><article class="metric"><div class="label">UNIT TERJUAL</div><div class="value">${state.sales.length}</div><div class="meta">Seluruh periode</div></article><article class="metric"><div class="label">SALDO KAS</div><div class="value up">${rupiah(income - expense)}</div><div class="meta">Arus kas tercatat</div></article><article class="metric"><div class="label">PIUTANG</div><div class="value warn">${unpaid.length}</div><div class="meta">Belum lunas</div></article><article class="metric"><div class="label">REKONDISI</div><div class="value">${rupiah(state.costs.reduce((a, c) => a + Number(c.amount || 0), 0))}</div><div class="meta">Total biaya</div></article></div>
    <div class="dashboard-grid"><section class="panel"><div class="section-title"><div><h2>Perlu diperiksa</h2><p class="sub">Catatan operasional utama</p></div></div><div class="action-list">${old.length ? `<div class="action"><i class="dot bad"></i><div><strong>${old.length} stok lebih dari 90 hari</strong><p>Periksa harga dan kondisi unit.</p></div></div>` : ""}${unpaid.length ? `<div class="action"><i class="dot warn"></i><div><strong>${unpaid.length} pembayaran belum lunas</strong><p>Periksa sisa pembayaran customer.</p></div></div>` : ""}${!old.length && !unpaid.length ? '<div class="action"><i class="dot ok"></i><div><strong>Tidak ada peringatan</strong><p>Data operasional saat ini aman.</p></div></div>' : ""}</div></section><section class="panel"><div class="section-title"><div><h2>Kendaraan terbaru</h2><p class="sub">Unit terakhir yang dicatat</p></div><button class="text-button" data-view="vehicles">Lihat semua</button></div><div class="latest-stock">${stock.slice(0, 4).map(vehiclePreview).join("") || '<div class="empty">Belum ada kendaraan.</div>'}</div></section></div>`;
};

function vehiclePreview(v) {
  const photo =
    state.photos.find((p) => p.vehicle_id === v.id && p.is_primary) ||
    state.photos.find((p) => p.vehicle_id === v.id);
  return `<button class="stock-preview" data-edit-vehicle="${v.id}"><span class="vehicle-thumb">${photo?.public_url || v.cover_url ? `<img src="${esc(photo?.public_url || v.cover_url)}" alt="${esc(v.brand)} ${esc(v.model)}">` : '<span class="material-symbols-rounded">directions_car</span>'}</span><span><strong>${esc(v.brand)} ${esc(v.model)}</strong><small>${esc(v.code)} · ${v.year || "-"}</small></span>${status(v.status)}<span class="material-symbols-rounded chevron">chevron_right</span></button>`;
}

function renderShellApproved() {
  const username =
    state.session.user.user_metadata?.username ||
    state.session.user.email.split("@")[0];
  const business =
    state.showroom.business_type === "both"
      ? "Mobil & Motor"
      : state.showroom.business_type === "car"
        ? "Mobil"
        : "Motor";
  const navItems = navV2
    .map(
      ([id, n]) =>
        `<button data-view="${id}" class="${state.view === id ? "active" : ""}"><span class="material-symbols-rounded">${mobileIcons[id]}</span><span class="nav-label">${n}</span></button>`,
    )
    .join("");
  app.innerHTML = `<div class="shell clean-shell"><aside class="sidebar"><div class="side-brand">${logo()}<div><strong>Bantu Beres</strong><span>Garasi Pro</span></div><button class="sidebar-toggle" data-collapse aria-label="Sembunyikan menu"><span class="material-symbols-rounded">left_panel_close</span></button></div><nav class="nav">${navItems}</nav><div class="sidebar-foot"><div class="user-chip">${esc(username)}</div><button class="logout-button" data-logout><span class="material-symbols-rounded">logout</span><span class="nav-label">Keluar akun</span></button></div></aside><main class="main"><header class="topbar"><button class="icon-btn mobile-menu-button" data-menu aria-label="Buka menu"><span class="material-symbols-rounded">menu</span></button><div class="showroom-name"><strong>${esc(state.showroom.name)}</strong><span>Showroom ${business} · ${esc(state.showroom.city || "Lokasi belum diisi")}</span></div><div class="top-actions"><button class="icon-btn" data-refresh aria-label="Muat ulang"><span class="material-symbols-rounded">refresh</span></button><button class="icon-btn" data-theme aria-label="Ganti tema"><span class="material-symbols-rounded">${document.documentElement.dataset.theme === "dark" ? "light_mode" : "dark_mode"}</span></button></div></header><section id="page" class="page"></section></main><nav class="mobile-nav"><button data-view="dashboard" class="${state.view === "dashboard" ? "active" : ""}"><span class="material-symbols-rounded">dashboard</span><span>Dashboard</span></button><button data-view="vehicles" class="${state.view === "vehicles" ? "active" : ""}"><span class="material-symbols-rounded">directions_car</span><span>Stok</span></button><button class="add-action" data-modal="vehicle"><span class="material-symbols-rounded">add</span><b>Tambah</b></button><button data-view="sales" class="${state.view === "sales" ? "active" : ""}"><span class="material-symbols-rounded">receipt_long</span><span>Penjualan</span></button><button data-menu><span class="material-symbols-rounded">menu</span><span>Menu</span></button></nav><aside class="mobile-drawer"><div class="drawer-brand">${logo()}<div><strong>Bantu Beres</strong><span>Garasi Pro</span></div><button class="icon-btn" data-menu-close><span class="material-symbols-rounded">close</span></button></div><div class="drawer-account"><small>${esc(username)}</small><strong>${esc(state.showroom.name)}</strong><span>Showroom ${business}</span></div><nav>${navItems}</nav><button class="drawer-logout" data-logout><span class="material-symbols-rounded">logout</span>Keluar akun</button></aside><div class="drawer-shade" data-menu-close></div></div>`;
  const shell = app.querySelector(".shell");
  const close = () => {
    shell.classList.remove("drawer-open");
    document.body.classList.remove("no-scroll");
  };
  app.querySelectorAll("[data-view]").forEach(
    (b) =>
      (b.onclick = () => {
        state.view = b.dataset.view;
        close();
        renderShell();
      }),
  );
  app.querySelectorAll("[data-menu]").forEach(
    (b) =>
      (b.onclick = () => {
        shell.classList.add("drawer-open");
        document.body.classList.add("no-scroll");
      }),
  );
  app.querySelectorAll("[data-menu-close]").forEach((b) => (b.onclick = close));
  app.querySelectorAll("[data-logout]").forEach(
    (b) =>
      (b.onclick = async () => {
        await db.auth.signOut();
        state.session = null;
        renderAuth();
      }),
  );
  app.querySelector("[data-refresh]").onclick = async () => {
    await loadData();
    renderPage();
    toast("Data berhasil diperbarui");
  };
  app.querySelector("[data-theme]").onclick = () => {
    setTheme(
      document.documentElement.dataset.theme === "dark" ? "light" : "dark",
    );
    renderShell();
  };
  app.querySelector("[data-collapse]").onclick = () => {
    shell.classList.toggle("sidebar-collapsed");
    localStorage.setItem(
      "garasi-sidebar",
      shell.classList.contains("sidebar-collapsed") ? "1" : "0",
    );
  };
  if (localStorage.getItem("garasi-sidebar") === "1")
    shell.classList.add("sidebar-collapsed");
  renderPage();
}

/* Garasi Pro UX v2 — mobile, theme, accounting and reversible transactions */
const today = () => new Date().toISOString().slice(0, 10);
let vehicleKind = "all",
  financePeriod = "all";
const logo = (variant = "mark") =>
  `<span class="bb-logo logo-bantuberes ${variant}" role="img" aria-label="Bantu Beres"></span>`;
function setTheme(value) {
  document.documentElement.dataset.theme = value;
  localStorage.setItem("garasi-pro-theme", value);
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.content = value === "dark" ? "#11151d" : "#592d91";
}
setTheme(localStorage.getItem("garasi-pro-theme") || "light");
toast = function (msg, kind = "success") {
  const el = document.querySelector("#toast");
  el.className = `toast-show ${kind}`;
  el.innerHTML = `<strong>${kind === "error" ? "Perlu diperiksa" : "Berhasil"}</strong><span>${esc(msg)}</span>`;
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => (el.className = ""), 3600);
};
const navV2 = [
  ["dashboard", "Beranda", "⌂"],
  ["vehicles", "Kendaraan", "▣"],
  ["sales", "Penjualan", "✓"],
  ["finance", "Keuangan", "Rp"],
  ["costs", "Rekondisi", "◇"],
  ["customers", "Customer", "○"],
  ["leads", "Follow-up", "↗"],
  ["reports", "Laporan", "▤"],
  ["settings", "Pengaturan", "⚙"],
];
function gotoView(id) {
  state.view = id;
  renderShell();
}
renderShell = function () {
  const user =
    state.session.user.user_metadata?.username ||
    state.session.user.email.split("@")[0];
  app.innerHTML = `<div class="shell"><aside class="sidebar"><div class="side-brand">${logo()}<div><strong>Garasi Pro</strong><span>Bantu Beres</span></div></div><nav class="nav">${navV2.map(([id, n, i]) => `<button data-view="${id}" class="${state.view === id ? "active" : ""}"><i>${i}</i>${n}</button>`).join("")}</nav><div class="sidebar-foot"><div class="user-chip">${esc(user)}</div><button class="logout-button" data-logout>Keluar akun</button></div></aside><main class="main"><header class="topbar"><div class="showroom-name">${esc(state.showroom.name)}<span>${state.showroom.business_type === "both" ? "Showroom Mobil & Motor" : state.showroom.business_type === "car" ? "Showroom Mobil" : "Showroom Motor"} · ${esc(state.showroom.city || "Belum ada kota")}</span></div><div class="top-actions"><button class="icon-btn" data-refresh aria-label="Muat ulang">↻</button><button class="icon-btn" data-theme aria-label="Ganti tema">${document.documentElement.dataset.theme === "dark" ? "☀" : "☾"}</button></div></header><section id="page" class="page"></section></main><nav class="mobile-nav">${navV2
    .slice(0, 4)
    .map(
      ([id, n, i]) =>
        `<button data-view="${id}" class="${state.view === id ? "active" : ""}"><i>${i}</i><span>${n}</span></button>`,
    )
    .join(
      "",
    )}<button data-menu><i>•••</i><span>Menu</span></button></nav><div class="mobile-drawer" aria-hidden="true"><div class="drawer-head"><strong>Menu lainnya</strong><button class="icon-btn" data-menu-close>×</button></div>${navV2
    .slice(4)
    .map(([id, n, i]) => `<button data-view="${id}"><i>${i}</i>${n}</button>`)
    .join(
      "",
    )}<button class="drawer-logout" data-logout>Keluar akun</button></div><div class="drawer-shade" data-menu-close></div></div>`;
  document
    .querySelectorAll("[data-view]")
    .forEach((b) => (b.onclick = () => gotoView(b.dataset.view)));
  document.querySelectorAll("[data-logout]").forEach(
    (b) =>
      (b.onclick = async () => {
        await db.auth.signOut();
        state = { ...state, session: null, showroom: null };
        renderAuth();
      }),
  );
  document.querySelector("[data-refresh]").onclick = async () => {
    await loadData();
    renderPage();
    toast("Data berhasil diperbarui");
  };
  document.querySelector("[data-theme]").onclick = () => {
    setTheme(
      document.documentElement.dataset.theme === "dark" ? "light" : "dark",
    );
    renderShell();
  };
  const open = () =>
      document.querySelector(".shell").classList.add("drawer-open"),
    close = () =>
      document.querySelector(".shell").classList.remove("drawer-open");
  document.querySelector("[data-menu]").onclick = open;
  document
    .querySelectorAll("[data-menu-close]")
    .forEach((x) => (x.onclick = close));
  renderPage();
};
// Gunakan satu shell final secara sinkron. Jangan menimpa renderer melalui timer.
renderShell = renderShellMobileV3;
function mobileCards(rows, render) {
  return `<div class="mobile-cards">${rows.length ? rows.map(render).join("") : '<div class="empty">Belum ada data.</div>'}</div>`;
}
function typeTabs() {
  if (state.showroom.business_type !== "both") return "";
  return `<div class="segment" id="kindFilter"><button data-kind="all" class="${vehicleKind === "all" ? "active" : ""}">Semua</button><button data-kind="car" class="${vehicleKind === "car" ? "active" : ""}">Mobil</button><button data-kind="motorcycle" class="${vehicleKind === "motorcycle" ? "active" : ""}">Motor</button></div>`;
}
vehicles = function () {
  const rows = state.vehicles.filter(
    (v) => vehicleKind === "all" || v.vehicle_type === vehicleKind,
  );
  return `${pageHead("Data Kendaraan", "Stok dipisahkan per kategori dan selalu memakai kode unit berurutan.", '<button class="button primary-action" data-modal="vehicle">+ Tambah kendaraan</button>')}<div class="toolbar">${typeTabs()}<div class="filter-row"><input id="vehicleSearch" placeholder="Cari kode, merek, model, atau nomor polisi"><select id="vehicleStatus"><option value="">Semua status</option>${["inspection", "reconditioning", "ready", "listed", "booked", "sold", "delivered"].map((s) => `<option value="${s}">${s.replaceAll("_", " ")}</option>`).join("")}</select></div></div><div class="panel data-panel" id="vehicleTable">${vehicleTable(rows)}</div>`;
};
vehicleTable = function (rows) {
  const desktop = rows.length
    ? `<div class="table-wrap"><table class="data-table"><thead><tr><th>Unit</th><th>Jenis</th><th>Modal aktual</th><th>Target jual</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${rows.map((v) => vehicleRow(v)).join("")}</tbody></table></div>`
    : '<div class="empty">Tidak ada kendaraan yang sesuai.</div>';
  return (
    desktop +
    mobileCards(rows, (v) => {
      const total = vehicleHpp(v);
      return `<article class="data-card ${v.status === "sold" ? "is-sold" : ""}"><div class="card-top"><div><small>${esc(v.code)}</small><h3>${esc(v.brand)} ${esc(v.model)}</h3></div>${status(v.status)}</div>${v.status === "sold" ? '<div class="sold-banner">Produk sudah terjual</div>' : ""}<dl><div><dt>Jenis</dt><dd>${v.vehicle_type === "car" ? "Mobil" : "Motor"}</dd></div><div><dt>Modal</dt><dd>${rupiah(total)}</dd></div><div><dt>Target</dt><dd>${rupiah(v.target_price)}</dd></div></dl><div class="card-actions"><button class="button secondary compact" data-edit-vehicle="${v.id}">Ubah data</button><button class="button danger compact" data-delete-vehicle="${v.id}">Hapus</button></div></article>`;
    })
  );
};
function vehicleHpp(v) {
  return (
    Number(v.purchase_price || 0) +
    state.costs
      .filter((c) => c.vehicle_id === v.id)
      .reduce((a, c) => a + Number(c.amount || 0), 0)
  );
}
function vehicleRow(v) {
  return `<tr class="${v.status === "sold" ? "sold-row" : ""}"><td><strong>${esc(v.brand)} ${esc(v.model)}</strong><br><small>${esc(v.code)} · ${v.year || "-"} · ${esc(v.license_plate || "-")}</small>${v.status === "sold" ? '<span class="sold-note">Produk sudah terjual</span>' : ""}</td><td>${v.vehicle_type === "car" ? "Mobil" : "Motor"}</td><td>${rupiah(vehicleHpp(v))}</td><td>${rupiah(v.target_price)}</td><td>${status(v.status)}</td><td><div class="row-actions"><button class="button secondary compact" data-edit-vehicle="${v.id}">Ubah</button><button class="button danger compact" data-delete-vehicle="${v.id}">Hapus</button></div></td></tr>`;
}

costs = function () {
  const rows = state.costs;
  return `${pageHead("Biaya Rekondisi", "Catat semua biaya agar HPP aktual tetap akurat.", '<button class="button primary-action" data-modal="cost">+ Catat biaya</button>')}<div class="metric-grid"><div class="metric"><div class="label">TOTAL REKONDISI</div><div class="value">${rupiah(rows.reduce((a, c) => a + Number(c.amount || 0), 0))}</div><div class="meta">Semua unit</div></div><div class="metric"><div class="label">CATATAN BIAYA</div><div class="value">${rows.length}</div><div class="meta">Transaksi tercatat</div></div></div><div class="panel data-panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Tanggal</th><th>Unit</th><th>Kategori</th><th>Bengkel/Keterangan</th><th>Nominal</th><th>Aksi</th></tr></thead><tbody>${rows.map((c) => { const v = state.vehicles.find((x) => x.id === c.vehicle_id); return `<tr><td>${esc(c.cost_date || "-")}</td><td>${esc(v ? `${v.code} · ${v.brand} ${v.model}` : "-")}</td><td>${esc(c.category || "-")}</td><td>${esc(c.vendor || c.note || "-")}</td><td>${rupiah(c.amount)}</td><td><div class="row-actions"><button class="button secondary compact" data-edit-cost="${c.id}">Ubah</button><button class="button danger compact" data-delete-cost="${c.id}">Hapus</button></div></td></tr>`; }).join("") || '<tr><td colspan="6"><div class="empty">Belum ada biaya rekondisi.</div></td></tr>'}</tbody></table></div>${mobileCards(rows, (c) => { const v = state.vehicles.find((x) => x.id === c.vehicle_id); return `<article class="data-card"><div class="card-top"><div><small>${esc(c.cost_date || "-")}</small><h3>${esc(c.category || "Biaya rekondisi")}</h3></div><strong class="bad">${rupiah(c.amount)}</strong></div><p>${esc(v ? `${v.code} · ${v.brand} ${v.model}` : "Unit tidak ditemukan")} · ${esc(c.vendor || c.note || "-")}</p><div class="card-actions"><button class="button secondary compact" data-edit-cost="${c.id}">Ubah</button><button class="button danger compact" data-delete-cost="${c.id}">Hapus</button></div></article>`; })}</div></div>`;
};

customers = function () {
  const rows = state.customers;
  return `${pageHead("Customer", "Simpan data calon pembeli dan pelanggan.", '<button class="button primary-action" data-modal="customer">+ Tambah customer</button>')}<div class="panel data-panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Nama</th><th>WhatsApp</th><th>Kota</th><th>Sumber</th><th>Catatan</th><th>Aksi</th></tr></thead><tbody>${rows.map((c) => `<tr><td><strong>${esc(c.full_name)}</strong>${c.email ? `<br><small>${esc(c.email)}</small>` : ""}</td><td>${esc(c.phone || "-")}</td><td>${esc(c.city || "-")}</td><td>${esc(c.source || "-")}</td><td>${esc(c.note || "-")}</td><td><div class="row-actions"><button class="button secondary compact" data-edit-customer="${c.id}">Ubah</button><button class="button danger compact" data-delete-customer="${c.id}">Hapus</button></div></td></tr>`).join("") || '<tr><td colspan="6"><div class="empty">Belum ada customer.</div></td></tr>'}</tbody></table></div>${mobileCards(rows, (c) => `<article class="data-card"><div class="card-top"><div><small>${esc(c.phone || "Tanpa nomor")}</small><h3>${esc(c.full_name)}</h3></div></div><p>${esc(c.city || "Kota belum diisi")} · ${esc(c.source || "Sumber belum diisi")}</p>${c.note ? `<p>${esc(c.note)}</p>` : ""}<div class="card-actions"><button class="button secondary compact" data-edit-customer="${c.id}">Ubah</button><button class="button danger compact" data-delete-customer="${c.id}">Hapus</button></div></article>`)}</div></div>`;
};
sales = function () {
  return `${pageHead("Penjualan", "Setiap penjualan otomatis memperbarui kendaraan dan kas.", '<button class="button primary-action" data-modal="sale">+ Catat penjualan</button>')}<div class="panel data-panel">${salesTable()}</div>`;
};
function salesTable() {
  const rows = state.sales;
  const desktop = `<div class="table-wrap"><table class="data-table"><thead><tr><th>Nota</th><th>Unit & customer</th><th>Nilai transaksi</th><th>Diterima</th><th>Laba</th><th>Aksi</th></tr></thead><tbody>${rows.map((s) => saleRow(s)).join("") || '<tr><td colspan="6"><div class="empty">Belum ada penjualan.</div></td></tr>'}</tbody></table></div>`;
  return (
    desktop +
    mobileCards(rows, (s) => {
      const m = saleMetrics(s);
      return `<article class="data-card"><div class="card-top"><div><small>${esc(s.invoice_number)}</small><h3>${esc(s.vehicles ? `${s.vehicles.brand} ${s.vehicles.model}` : "Unit")}</h3></div>${status(s.payment_status)}</div><dl><div><dt>Harga bersih</dt><dd>${rupiah(m.net)}</dd></div><div><dt>Diterima</dt><dd>${rupiah(s.paid_amount)}</dd></div><div><dt>Laba</dt><dd class="${m.profit < 0 ? "bad" : "up"}">${rupiah(m.profit)}</dd></div></dl><div class="card-actions"><button class="button secondary compact" data-edit-sale="${s.id}">Ubah</button><button class="button danger compact" data-delete-sale="${s.id}">Hapus</button></div></article>`;
    })
  );
}
function saleMetrics(s) {
  const v = state.vehicles.find((x) => x.id === s.vehicle_id),
    net = Number(s.sale_price || 0) - Number(s.discount || 0);
  return {
    net,
    profit: net - Number(s.commission || 0) - (v ? vehicleHpp(v) : 0),
    receivable: Math.max(0, net - Number(s.paid_amount || 0)),
  };
}
function saleRow(s) {
  const m = saleMetrics(s);
  return `<tr><td><strong>${esc(s.invoice_number)}</strong><br><small>${s.sale_date}</small></td><td>${esc(s.vehicles ? `${s.vehicles.brand} ${s.vehicles.model}` : "-")}<br><small>${esc(s.customers?.full_name || "-")}</small></td><td>${rupiah(m.net)}<br>${status(s.payment_status)}</td><td>${rupiah(s.paid_amount)}</td><td class="${m.profit < 0 ? "bad" : "up"}">${rupiah(m.profit)}</td><td><div class="row-actions"><button class="button secondary compact" data-edit-sale="${s.id}">Ubah</button><button class="button danger compact" data-delete-sale="${s.id}">Hapus</button></div></td></tr>`;
}
finance = function () {
  const now = new Date(),
    filtered = state.transactions.filter(
      (t) =>
        financePeriod === "all" ||
        String(t.transaction_date).slice(0, 7) === financePeriod,
    );
  const income = filtered
      .filter((t) => t.flow === "income")
      .reduce((a, t) => a + Number(t.amount), 0),
    expense = filtered
      .filter((t) => t.flow === "expense")
      .reduce((a, t) => a + Number(t.amount), 0),
    opening = state.accounts.reduce(
      (a, x) => a + Number(x.opening_balance || 0),
      0,
    ),
    balance =
      financePeriod === "all" ? opening + income - expense : income - expense;
  const months = [
    ...new Set(
      state.transactions.map((t) => String(t.transaction_date).slice(0, 7)),
    ),
  ]
    .sort()
    .reverse();
  return `${pageHead("Keuangan", "Kas berbasis uang aktual; laba dan piutang dihitung terpisah.", '<button class="button primary-action" data-modal="transaction">+ Transaksi manual</button>')}<div class="period-bar"><label>Periode laporan</label><select id="financePeriod"><option value="all">Keseluruhan</option>${months.map((m) => `<option value="${m}" ${m === financePeriod ? "selected" : ""}>${new Date(m + "-01").toLocaleDateString("id-ID", { month: "long", year: "numeric" })}</option>`).join("")}</select></div><div class="metric-grid"><div class="metric"><div class="label">${financePeriod === "all" ? "SALDO KAS" : "PERUBAHAN KAS"}</div><div class="value ${balance < 0 ? "bad" : ""}">${rupiah(balance)}</div><div class="meta">${financePeriod === "all" ? "Saldo awal + seluruh arus kas" : "Masuk dikurangi keluar pada periode"}</div></div><div class="metric"><div class="label">PEMASUKAN</div><div class="value up">${rupiah(income)}</div><div class="meta">Termasuk pembayaran penjualan</div></div><div class="metric"><div class="label">PENGELUARAN</div><div class="value bad">${rupiah(expense)}</div><div class="meta">Pembelian, rekondisi, dan biaya lain</div></div><div class="metric"><div class="label">PIUTANG PENJUALAN</div><div class="value warn">${rupiah(state.sales.reduce((a, s) => a + saleMetrics(s).receivable, 0))}</div><div class="meta">Belum dihitung sebagai kas</div></div></div><div class="panel data-panel">${transactionTable(filtered)}</div>`;
};
function transactionTable(rows) {
  const body = rows
    .map(
      (t) =>
        `<tr><td>${t.transaction_date}</td><td class="${t.flow === "income" ? "up" : "bad"}">${t.flow === "income" ? "Masuk" : "Keluar"}</td><td>${esc(t.category)}</td><td>${esc(t.note || "-")} ${t.is_system ? '<span class="system-tag">Otomatis</span>' : ""}</td><td>${rupiah(t.amount)}</td><td>${t.is_system ? "—" : `<div class="row-actions"><button class="button secondary compact" data-edit-transaction="${t.id}">Ubah</button><button class="button danger compact" data-delete-transaction="${t.id}">Hapus</button></div>`}</td></tr>`,
    )
    .join("");
  return (
    `<div class="table-wrap"><table class="data-table"><thead><tr><th>Tanggal</th><th>Arus</th><th>Kategori</th><th>Keterangan</th><th>Nominal</th><th>Aksi</th></tr></thead><tbody>${body || '<tr><td colspan="6"><div class="empty">Belum ada transaksi pada periode ini.</div></td></tr>'}</tbody></table></div>` +
    mobileCards(
      rows,
      (t) =>
        `<article class="data-card"><div class="card-top"><div><small>${t.transaction_date}</small><h3>${esc(t.category)}</h3></div><strong class="${t.flow === "income" ? "up" : "bad"}">${t.flow === "income" ? "+" : "−"} ${rupiah(t.amount)}</strong></div><p>${esc(t.note || "-")} ${t.is_system ? '<span class="system-tag">Otomatis</span>' : ""}</p>${t.is_system ? "" : `<div class="card-actions"><button class="button secondary compact" data-edit-transaction="${t.id}">Ubah</button><button class="button danger compact" data-delete-transaction="${t.id}">Hapus</button></div>`}</article>`,
    )
  );
}
const originalBindPage = bindPage;
bindPage = function () {
  originalBindPage();
  document.querySelectorAll("[data-kind]").forEach(
    (b) =>
      (b.onclick = () => {
        vehicleKind = b.dataset.kind;
        renderPage();
      }),
  );
  document.querySelector("#financePeriod")?.addEventListener("change", (e) => {
    financePeriod = e.target.value;
    renderPage();
  });
  document.querySelectorAll("[data-edit-sale]").forEach(
    (b) =>
      (b.onclick = () =>
        openModalV2(
          "sale",
          state.sales.find((s) => s.id === b.dataset.editSale),
        )),
  );
  document
    .querySelectorAll("[data-delete-sale]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          confirmAction(
            "Hapus transaksi penjualan?",
            "Kendaraan akan kembali ke status sebelumnya dan catatan kas terkait akan dibalik.",
            () => deleteRecord("sales", b.dataset.deleteSale),
          )),
    );
  document.querySelectorAll("[data-edit-transaction]").forEach(
    (b) =>
      (b.onclick = () =>
        openModalV2(
          "transaction",
          state.transactions.find((t) => t.id === b.dataset.editTransaction),
        )),
  );
  document
    .querySelectorAll("[data-delete-transaction]")
    .forEach(
      (b) =>
        (b.onclick = () =>
          confirmAction(
            "Hapus transaksi kas?",
            "Saldo kas akan dihitung ulang tanpa transaksi ini.",
            () =>
              deleteRecord("cash_transactions", b.dataset.deleteTransaction),
          )),
    );
  document
    .querySelectorAll("[data-modal]")
    .forEach((b) => (b.onclick = () => openModalV2(b.dataset.modal)));
  document.querySelectorAll("[data-edit-vehicle]").forEach(
    (b) =>
      (b.onclick = () =>
        openModalV2(
          "vehicle",
          state.vehicles.find((v) => v.id === b.dataset.editVehicle),
        )),
  );
};
async function deleteRecord(table, id) {
  const { error } = await db.from(table).delete().eq("id", id);
  if (error) return toast(error.message, "error");
  await loadData();
  renderShell();
  toast("Data dihapus dan perhitungan diperbarui");
}
function confirmAction(title, message, onConfirm) {
  const root = document.querySelector("#confirmRoot");
  root.innerHTML = `<div class="modal-backdrop confirm-backdrop"><section class="confirm-box"><div class="confirm-icon">!</div><h2>${esc(title)}</h2><p>${esc(message)}</p><div class="modal-foot"><button class="button secondary" data-cancel>Batal</button><button class="button danger" data-confirm>Ya, hapus</button></div></section></div>`;
  root.querySelector("[data-cancel]").onclick = () => (root.innerHTML = "");
  root.querySelector("[data-confirm]").onclick = async () => {
    root.innerHTML = "";
    await onConfirm();
  };
}
function fieldSelect(name, label, items, value = "", other = true) {
  return `<div><label>${label}</label><select name="${name}" data-other-select="${other ? "1" : "0"}">${items
    .map((x) => {
      const val = Array.isArray(x) ? x[0] : x,
        txt = Array.isArray(x) ? x[1] : x;
      return `<option value="${esc(val)}" ${val === value ? "selected" : ""}>${esc(txt)}</option>`;
    })
    .join(
      "",
    )}${other ? '<option value="__other">Lainnya…</option>' : ""}</select><input class="other-input" data-other-for="${name}" placeholder="Tulis pilihan lainnya" hidden></div>`;
}
function openModalV2(type, data = {}) {
  const active = state.vehicles.filter(
      (v) =>
        !["sold", "delivered", "cancelled"].includes(v.status) ||
        v.id === data.vehicle_id,
    ),
    vehicleOpts = active
      .map(
        (v) =>
          `<option value="${v.id}" ${v.id === data.vehicle_id ? "selected" : ""}>${esc(v.code)} — ${esc(v.brand)} ${esc(v.model)}</option>`,
      )
      .join(""),
    customerOpts = state.customers
      .map(
        (c) =>
          `<option value="${c.id}" ${c.id === data.customer_id ? "selected" : ""}>${esc(c.full_name)}</option>`,
      )
      .join("");
  const leadOpts = state.leads
    .filter((lead) => lead.id === data.lead_id || !["closed", "lost"].includes(lead.status))
    .map((lead) => `<option value="${lead.id}" ${lead.id === data.lead_id ? "selected" : ""}>${esc(lead.customers?.full_name || "Lead tanpa customer")} — ${esc(leadDisplayStatus(lead.status))}</option>`)
    .join("");
  let title = "",
    subtitle = "",
    body = "";
  if (type === "lead") {
    title = data.id ? "Ubah follow-up" : "Tambah follow-up";
    subtitle = "Catat minat calon pembeli dan jadwal tindak lanjutnya secara lengkap.";
    body = `<div class="form-grid"><div class="span-2"><label>Customer</label><select name="customer_id"><option value="">Pilih customer</option>${customerOpts}</select><small>Tambahkan customer terlebih dahulu dari menu Customer jika belum tersedia.</small></div><div class="span-2"><label>Kendaraan yang diminati</label><select name="vehicle_id"><option value="">Belum memilih kendaraan</option>${vehicleOpts}</select></div>${fieldSelect(
      "status",
      "Tahap follow-up",
      [
        ["new", "Lead baru"],
        ["contacted", "Sudah dihubungi"],
        ["interested", "Tertarik"],
        ["visit_scheduled", "Jadwal kunjungan"],
        ["test_drive", "Test drive"],
        ["negotiation", "Negosiasi"],
        ["booked", "Booking"],
        ["waiting_payment", "Menunggu pembayaran"],
        ["closed", "Berhasil closing"],
        ["lost", "Tidak lanjut"],
        ["follow_up", "Perlu di-follow-up"],
      ],
      data.status || "new",
      false,
    )}<div><label>Follow-up berikutnya</label><input type="datetime-local" name="next_follow_up_at" value="${data.next_follow_up_at ? new Date(data.next_follow_up_at).toISOString().slice(0,16) : ""}"></div><div><label>Nilai penawaran</label><input type="number" min="0" name="offered_price" value="${data.offered_price || ""}"></div><div class="span-2"><label>Catatan komunikasi</label><textarea name="note" placeholder="Ringkasan percakapan, kebutuhan customer, atau rencana tindak lanjut">${esc(data.note || "")}</textarea></div></div>`;
  }
  if (type === "vehicle") {
    title = data.id ? "Ubah kendaraan" : "Tambah kendaraan";
    subtitle = "Kode unit dibuat otomatis dan berurutan setelah disimpan.";
    const kinds =
      state.showroom.business_type === "both"
        ? fieldSelect(
            "vehicle_type",
            "Jenis kendaraan",
            [
              ["car", "Mobil"],
              ["motorcycle", "Motor"],
            ],
            data.vehicle_type || "car",
            false,
          )
        : `<input type="hidden" name="vehicle_type" value="${state.showroom.business_type}">`;
    body = `<div class="form-grid"><div><label>Kode unit</label><input value="${esc(data.code || "Otomatis saat disimpan")}" readonly class="readonly"></div>${kinds}<div><label>Merek</label><input name="brand" required value="${esc(data.brand || "")}"></div><div><label>Model / tipe</label><input name="model" required value="${esc(data.model || "")}"></div><div><label>Varian</label><input name="variant" value="${esc(data.variant || "")}"></div><div><label>Tahun</label><input type="number" name="year" min="1900" max="2100" value="${data.year || ""}"></div><div><label>Nomor polisi</label><input name="license_plate" value="${esc(data.license_plate || "")}"></div><div><label>Warna</label><input name="color" value="${esc(data.color || "")}"></div><div><label>Kilometer</label><input type="number" min="0" name="mileage" value="${data.mileage || ""}"></div>${fieldSelect(
      "transmission",
      "Transmisi",
      [
        ["Manual", "Manual"],
        ["Automatic", "Automatic"],
        ["CVT", "CVT"],
      ],
      data.transmission || "",
    )}${fieldSelect(
      "fuel_type",
      "Bahan bakar",
      [
        ["Bensin", "Bensin"],
        ["Diesel", "Diesel"],
        ["Hybrid", "Hybrid"],
        ["Listrik", "Listrik"],
      ],
      data.fuel_type || "",
    )}<div><label>Kapasitas mesin (cc)</label><input type="number" min="0" name="engine_capacity" value="${data.engine_capacity || ""}"></div><div><label>Harga beli</label><input type="number" min="0" name="purchase_price" required value="${data.purchase_price || 0}"></div><div><label>Target jual</label><input type="number" min="0" name="target_price" value="${data.target_price || 0}"></div><div><label>Harga minimum</label><input type="number" min="0" name="minimum_price" value="${data.minimum_price || ""}"></div><div><label>Tanggal beli</label><input type="date" name="purchase_date" value="${data.purchase_date || today()}"></div>${fieldSelect(
      "status",
      "Status unit",
      [
        ["inspection", "Inspeksi"],
        ["reconditioning", "Rekondisi"],
        ["ready", "Siap jual"],
        ["listed", "Diiklankan"],
        ["booked", "Dipesan"],
      ],
      data.status || "inspection",
      false,
    )}<div class="span-2"><label>Foto kendaraan</label><input type="file" name="photos" accept="image/jpeg,image/png,image/webp" multiple><small>Maksimal 5 MB per foto. Foto pertama menjadi sampul.</small>${data.id ? photoManager(data.id) : ""}</div><div class="span-2"><label>Catatan</label><textarea name="description">${esc(data.description || "")}</textarea></div></div>`;
  }
  if (type === "sale") {
    title = data.id ? "Ubah penjualan" : "Catat penjualan";
    subtitle = "Kas hanya bertambah sebesar uang yang benar-benar diterima.";
    body = `<div class="form-grid"><div><label>Unit terjual</label><select name="vehicle_id" required><option value="">Pilih unit</option>${vehicleOpts}</select></div><div><label>Customer</label><select name="customer_id"><option value="">Tanpa customer</option>${customerOpts}</select></div><div><label>Nomor nota</label><input name="invoice_number" required value="${esc(data.invoice_number || `NJ-${String(Date.now()).slice(-6)}`)}"></div><div><label>Tanggal jual</label><input type="date" name="sale_date" value="${data.sale_date || today()}"></div><div><label>Harga jual</label><input type="number" min="0" name="sale_price" required value="${data.sale_price || 0}"></div><div><label>Diskon</label><input type="number" min="0" name="discount" value="${data.discount || 0}"></div><div><label>Komisi</label><input type="number" min="0" name="commission" value="${data.commission || 0}"></div>${fieldSelect(
      "payment_status",
      "Status pembayaran",
      [
        ["unpaid", "Belum dibayar"],
        ["partial", "Dibayar sebagian"],
        ["paid", "Lunas"],
      ],
      data.payment_status || "unpaid",
      false,
    )}<div><label>Uang diterima</label><input type="number" min="0" name="paid_amount" value="${data.paid_amount || 0}"></div>${fieldSelect(
      "payment_method",
      "Metode pembayaran",
      [
        ["Tunai", "Tunai"],
        ["Transfer", "Transfer"],
        ["Leasing", "Leasing"],
      ],
      data.payment_method || "",
    )}<div class="span-2"><label>Catatan transaksi</label><textarea name="note">${esc(data.note || "")}</textarea></div></div>`;
  }
  if (type === "transaction") {
    title = data.id ? "Ubah transaksi manual" : "Tambah transaksi manual";
    subtitle =
      "Transaksi otomatis dari kendaraan, rekondisi, dan penjualan tidak dapat diubah di sini.";
    body = `<div class="form-grid">${fieldSelect(
      "flow",
      "Arus kas",
      [
        ["income", "Pemasukan"],
        ["expense", "Pengeluaran"],
      ],
      data.flow || "expense",
      false,
    )}<div><label>Akun kas</label><select name="account_id"><option value="">Kas utama otomatis</option>${state.accounts.map((a) => `<option value="${a.id}" ${a.id === data.account_id ? "selected" : ""}>${esc(a.name)}</option>`).join("")}</select></div><div><label>Tanggal</label><input type="date" name="transaction_date" value="${data.transaction_date || today()}"></div>${fieldSelect(
      "category",
      "Kategori",
      [
        ["Operasional", "Operasional"],
        ["Modal pemilik", "Modal pemilik"],
        ["Penarikan pemilik", "Penarikan pemilik"],
        ["Pendapatan lain", "Pendapatan lain"],
      ],
      data.category || "",
    )}<div><label>Nominal</label><input type="number" min="1" name="amount" required value="${data.amount || ""}"></div><div class="span-2"><label>Keterangan</label><textarea name="note">${esc(data.note || "")}</textarea></div></div>`;
  }
  if (type === "cost") {
    title = data.id ? "Ubah biaya rekondisi" : "Catat biaya rekondisi";
    subtitle = "Biaya ini otomatis masuk ke HPP kendaraan dan arus kas pengeluaran.";
    body = `<div class="form-grid"><div class="span-2"><label>Kendaraan</label><select name="vehicle_id" required><option value="">Pilih unit</option>${vehicleOpts}</select></div><div><label>Tanggal</label><input type="date" name="cost_date" value="${data.cost_date || today()}"></div>${fieldSelect("category", "Kategori", ["Servis", "Sparepart", "Body repair", "Detailing", "Pajak", "Lainnya"], data.category || "Servis")}<div><label>Nominal</label><input type="number" min="1" name="amount" required value="${data.amount || ""}"></div><div><label>Bengkel/vendor</label><input name="vendor" value="${esc(data.vendor || "")}"></div><div class="span-2"><label>Catatan</label><textarea name="note">${esc(data.note || "")}</textarea></div></div>`;
  }
  if (type === "customer") {
    title = data.id ? "Ubah customer" : "Tambah customer";
    subtitle = "Data customer dapat diperbarui kapan saja tanpa menghapus riwayat penjualan.";
    body = `<div class="form-grid"><div class="span-2"><label>Nama lengkap</label><input name="full_name" required value="${esc(data.full_name || "")}"></div><div><label>WhatsApp</label><input name="phone" value="${esc(data.phone || "")}"></div><div><label>Email</label><input type="email" name="email" value="${esc(data.email || "")}"></div><div><label>Kota</label><input name="city" value="${esc(data.city || "")}"></div>${fieldSelect("source", "Sumber lead", ["WhatsApp", "Instagram", "Facebook", "Walk-in", "Marketplace"], data.source || "WhatsApp")}<div class="span-2"><label>Catatan</label><textarea name="note">${esc(data.note || "")}</textarea></div></div>`;
  }
  if (!body) return openModal(type, data);
  const backdrop = document.createElement("div");
  backdrop.className = "modal-backdrop";
  backdrop.innerHTML = `<section class="modal"><header class="modal-title"><div><h2>${title}</h2><p>${subtitle}</p></div><button type="button" class="modal-close" aria-label="Tutup">×</button></header><form class="modal-body">${body}<footer class="modal-foot"><button type="button" class="button secondary" data-close>Batal</button><button class="button" type="submit">Simpan</button></footer></form></section>`;
  document.body.append(backdrop);
  requestAnimationFrame(() => backdrop.classList.add("visible"));
  const close = () => {
    backdrop.classList.remove("visible");
    setTimeout(() => backdrop.remove(), 180);
  };
  backdrop.querySelector(".modal-close").onclick = close;
  backdrop.querySelector("[data-close]").onclick = close;
  backdrop.onclick = (e) => {
    if (e.target === backdrop) close();
  };
  backdrop.querySelectorAll('[data-other-select="1"]').forEach(
    (s) =>
      (s.onchange = () => {
        const i = backdrop.querySelector(`[data-other-for="${s.name}"]`);
        i.hidden = s.value !== "__other";
        if (!i.hidden) i.focus();
      }),
  );
  backdrop.querySelector("form").onsubmit = async (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    form.querySelectorAll('[data-other-select="1"]').forEach((s) => {
      if (s.value === "__other")
        s.value = form.querySelector(`[data-other-for="${s.name}"]`).value;
    });
    const submit = form.querySelector('[type="submit"]');
    submit.disabled = true;
    submit.textContent = "Menyimpan…";
    await saveForm(e, type, data.id, backdrop);
    if (document.body.contains(backdrop)) {
      submit.disabled = false;
      submit.textContent = "Simpan";
    }
  };
}

function photoManager(vehicleId) {
  const rows = state.photos.filter((p) => p.vehicle_id === vehicleId);
  return rows.length
    ? `<div class="photo-grid">${rows.map((p) => `<figure><img src="${esc(p.public_url)}" alt="Foto kendaraan"><figcaption>${p.is_primary ? "Sampul" : "Foto tambahan"} <button type="button" data-delete-photo="${p.id}" data-path="${esc(p.storage_path)}">Hapus</button></figcaption></figure>`).join("")}</div>`
    : "";
}

function leadDisplayStatus(value) {
  const labels = { new: "Lead baru", contacted: "Dihubungi", interested: "Tertarik", visit_scheduled: "Jadwal kunjungan", test_drive: "Test drive", negotiation: "Negosiasi", booked: "Booking", waiting_payment: "Menunggu pembayaran", closed: "Closing", lost: "Tidak lanjut", follow_up: "Follow-up" };
  return labels[value] || String(value || "Belum diatur").replaceAll("_", " ");
}
function leadDate(value) {
  if (!value) return "Belum dijadwalkan";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Tanggal tidak valid" : date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}
leads = function () {
  const rows = [...state.leads].sort((a, b) => new Date(a.next_follow_up_at || "2999-01-01") - new Date(b.next_follow_up_at || "2999-01-01"));
  return `${pageHead("Follow-up", "Kelola calon pembeli dari minat sampai closing.", '<button class="button primary-action" data-modal="lead">+ Tambah follow-up</button>')}<div class="followup-summary"><div><span>Total lead</span><strong>${rows.length}</strong></div><div><span>Perlu ditindaklanjuti</span><strong>${rows.filter((x) => x.status !== "closed" && x.status !== "lost").length}</strong></div><div><span>Closing</span><strong>${rows.filter((x) => x.status === "closed").length}</strong></div></div><div class="panel data-panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Customer</th><th>Kendaraan</th><th>Status</th><th>Jadwal berikutnya</th><th>Penawaran</th><th>Aksi</th></tr></thead><tbody>${rows.map(leadRow).join("") || '<tr><td colspan="6"><div class="empty">Belum ada follow-up. Tambahkan calon pembeli pertama.</div></td></tr>'}</tbody></table></div>${mobileCards(rows, (lead) => `<article class="data-card lead-card"><div class="card-top"><div><small>${esc(lead.customers?.phone || "Customer")}</small><h3>${esc(lead.customers?.full_name || "Customer belum dipilih")}</h3></div><span class="status lead-status">${esc(leadDisplayStatus(lead.status))}</span></div><p class="lead-vehicle"><span class="material-symbols-rounded">directions_car</span>${esc(lead.vehicles ? `${lead.vehicles.brand} ${lead.vehicles.model} · ${lead.vehicles.year || "-"}` : "Belum memilih kendaraan")}</p><dl><div><dt>Follow-up</dt><dd>${esc(leadDate(lead.next_follow_up_at))}</dd></div><div><dt>Penawaran</dt><dd>${rupiah(lead.offered_price)}</dd></div></dl>${lead.note ? `<p class="lead-note">${esc(lead.note)}</p>` : ""}<div class="card-actions"><button class="button secondary compact" data-edit-lead="${lead.id}">Ubah</button><button class="button danger compact" data-delete-lead="${lead.id}">Hapus</button></div></article>`)}</div>`;
};
function leadRow(lead) {
  return `<tr><td><strong>${esc(lead.customers?.full_name || "Customer belum dipilih")}</strong><br><small>${esc(lead.customers?.phone || "-")}</small></td><td>${esc(lead.vehicles ? `${lead.vehicles.brand} ${lead.vehicles.model}` : "Belum memilih kendaraan")}</td><td><span class="status lead-status">${esc(leadDisplayStatus(lead.status))}</span></td><td>${esc(leadDate(lead.next_follow_up_at))}</td><td>${rupiah(lead.offered_price)}</td><td><div class="row-actions"><button class="button secondary compact" data-edit-lead="${lead.id}">Ubah</button><button class="button danger compact" data-delete-lead="${lead.id}">Hapus</button></div></td></tr>`;
}
const bindPageWithFollowups = bindPage;
bindPage = function () {
  bindPageWithFollowups();
  document.querySelectorAll("[data-edit-lead]").forEach((button) => {
    button.onclick = () => openModalV2("lead", state.leads.find((lead) => lead.id === button.dataset.editLead));
  });
  document.querySelectorAll("[data-delete-lead]").forEach((button) => {
    button.onclick = () => confirmAction("Hapus follow-up?", "Riwayat follow-up ini akan dihapus dari showroom.", () => deleteRecord("leads", button.dataset.deleteLead));
  });
  document.querySelectorAll("[data-delete-vehicle]").forEach((button) => {
    button.onclick = () => confirmAction("Hapus kendaraan?", "Data kendaraan dan foto yang terkait akan dihapus. Riwayat penjualan atau biaya yang masih terkait dapat membuat penghapusan ditolak.", () => deleteRecord("vehicles", button.dataset.deleteVehicle));
  });
  document.querySelectorAll("[data-edit-cost]").forEach((button) => {
    button.onclick = () => openModalV2("cost", state.costs.find((cost) => cost.id === button.dataset.editCost));
  });
  document.querySelectorAll("[data-delete-cost]").forEach((button) => {
    button.onclick = () => confirmAction("Hapus biaya rekondisi?", "HPP dan pengeluaran kas akan dihitung ulang tanpa catatan ini.", () => deleteRecord("vehicle_costs", button.dataset.deleteCost));
  });
  document.querySelectorAll("[data-edit-customer]").forEach((button) => {
    button.onclick = () => openModalV2("customer", state.customers.find((customer) => customer.id === button.dataset.editCustomer));
  });
  document.querySelectorAll("[data-delete-customer]").forEach((button) => {
    button.onclick = () => confirmAction("Hapus customer?", "Riwayat penjualan atau follow-up yang terkait dapat membuat penghapusan ditolak.", () => deleteRecord("customers", button.dataset.deleteCustomer));
  });
  document.querySelectorAll("[data-delete-photo]").forEach((button) => {
    button.onclick = () => confirmAction("Hapus foto kendaraan?", "Foto ini akan dihapus dari galeri kendaraan.", async () => {
      const photo = state.photos.find((item) => item.id === button.dataset.deletePhoto);
      const { error: storageError } = photo?.storage_path ? await db.storage.from("vehicle-photos").remove([photo.storage_path]) : { error: null };
      if (storageError) return toast(storageError.message, "error");
      const { error } = await db.from("vehicle_photos").delete().eq("id", button.dataset.deletePhoto);
      if (error) return toast(error.message, "error");
      await loadData();
      renderShell();
      toast("Foto kendaraan dihapus");
    });
  });
};

renderShell = renderShellApproved;

/* Team access: Owner, Sales, and Admin Operasional. */
const ownerDashboardView = dashboard;
const ownerVehiclesView = vehicles;
const ownerSalesView = sales;
const ownerCustomersView = customers;
const ownerLeadsView = leads;
const baseBindPageForRoles = bindPage;

function currentRole() {
  return state.member?.role || "owner";
}
function roleLabel(role = currentRole()) {
  return role === "owner" ? "Owner" : role === "sales" ? "Sales" : "Admin Operasional";
}
function allowedNavigation() {
  const ids = currentRole() === "owner"
    ? ["dashboard", "vehicles", "sales", "finance", "costs", "customers", "leads", "reports", "team", "settings"]
    : currentRole() === "sales"
      ? ["dashboard", "vehicles", "customers", "leads", "sales", "reports"]
      : ["dashboard", "vehicles", "sales", "finance", "costs", "customers", "reports"];
  const labels = Object.fromEntries(navV2.map(([id, label, icon]) => [id, [label, icon]]));
  labels.team = ["Tim", "groups"];
  return ids.map((id) => [id, labels[id]?.[0] || id, labels[id]?.[1] || mobileIcons[id] || "circle"]);
}
function ensureAllowedView() {
  const allowed = allowedNavigation().map(([id]) => id);
  if (!allowed.includes(state.view)) state.view = "dashboard";
}
function roleDashboard() {
  if (currentRole() === "owner") return ownerDashboardView();
  if (currentRole() === "sales") {
    const open = state.leads.filter((x) => !["closed", "lost"].includes(x.status));
    const followups = open.filter((x) => x.next_follow_up_at).sort((a, b) => new Date(a.next_follow_up_at) - new Date(b.next_follow_up_at));
    return `${pageHead("Dashboard Sales", "Customer dan follow-up yang menjadi tanggung jawab kamu.", '<button class="button primary-action" data-modal="customer">+ Tambah customer</button>')}<div class="metric-grid"><div class="metric"><div class="label">CUSTOMER SAYA</div><div class="value">${state.customers.length}</div><div class="meta">Customer yang ditugaskan</div></div><div class="metric"><div class="label">FOLLOW-UP AKTIF</div><div class="value">${open.length}</div><div class="meta">Belum closing atau tidak lanjut</div></div><div class="metric"><div class="label">CLOSING</div><div class="value up">${state.leads.filter((x) => x.status === "closed").length}</div><div class="meta">Lead berhasil closing</div></div><div class="metric"><div class="label">PENJUALAN SAYA</div><div class="value">${state.sales.length}</div><div class="meta">Transaksi yang tercatat</div></div></div><section class="panel"><h2>Follow-up berikutnya</h2><p class="sub">Hubungi customer langsung dari nomor WhatsApp.</p>${followups.slice(0, 6).map((lead) => `<div class="team-row"><div><strong>${esc(lead.customers?.full_name || "Customer")}</strong><span>${esc(leadDate(lead.next_follow_up_at))}</span></div>${waButton(lead.customers?.phone, "Hubungi")}</div>`).join("") || '<div class="empty">Belum ada jadwal follow-up.</div>'}</section>`;
  }
  return `${pageHead("Dashboard Operasional", "Ringkasan stok, transaksi, dan pekerjaan administrasi.", '<button class="button primary-action" data-modal="vehicle">+ Tambah kendaraan</button>')}<div class="metric-grid"><div class="metric"><div class="label">UNIT AKTIF</div><div class="value">${state.vehicles.filter((v) => !["sold","delivered","cancelled"].includes(v.status)).length}</div><div class="meta">Stok yang masih diproses</div></div><div class="metric"><div class="label">UNIT TERJUAL</div><div class="value">${state.sales.length}</div><div class="meta">Seluruh transaksi</div></div><div class="metric"><div class="label">BELUM LUNAS</div><div class="value warn">${state.sales.filter((s) => s.payment_status !== "paid").length}</div><div class="meta">Perlu pemeriksaan pembayaran</div></div><div class="metric"><div class="label">CUSTOMER</div><div class="value">${state.customers.length}</div><div class="meta">Data administrasi</div></div></div><section class="panel"><h2>Unit terbaru</h2>${state.vehicles.slice(0, 6).map((v) => `<div class="team-row"><div><strong>${esc(v.brand)} ${esc(v.model)}</strong><span>${esc(v.code)} · ${esc(v.status)}</span></div></div>`).join("") || '<div class="empty">Belum ada kendaraan.</div>'}</section>`;
}
function salesRoleView() {
  if (currentRole() === "owner") return ownerSalesView();
  const canCreate = currentRole() === "sales" || currentRole() === "admin";
  return `${pageHead("Penjualan", currentRole() === "sales" ? "Penjualan yang tercatat atas nama kamu." : "Kelola transaksi dan status pembayaran.", canCreate ? '<button class="button primary-action" data-modal="sale">+ Catat penjualan</button>' : "")}<div class="panel data-panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Nota</th><th>Unit & customer</th><th>Nilai transaksi</th><th>Diterima</th><th>Status</th>${currentRole() === "admin" ? "<th>Aksi</th>" : ""}</tr></thead><tbody>${state.sales.map((s) => { const m=saleMetrics(s); return `<tr><td><strong>${esc(s.invoice_number)}</strong><br><small>${esc(s.sale_date)}</small></td><td>${esc(s.vehicles ? `${s.vehicles.brand} ${s.vehicles.model}` : "-")}<br><small>${esc(s.customers?.full_name || "-")}</small></td><td>${rupiah(m.net)}</td><td>${rupiah(s.paid_amount)}</td><td>${status(s.payment_status)}</td>${currentRole() === "admin" ? `<td><button class="button secondary compact" data-edit-sale="${s.id}">Ubah</button></td>` : ""}</tr>`; }).join("") || `<tr><td colspan="6"><div class="empty">Belum ada penjualan.</div></td></tr>`}</tbody></table></div></div>`;
}
function waLink(phone) {
  let number = String(phone || "").replace(/\D/g, "");
  if (number.startsWith("0")) number = `62${number.slice(1)}`;
  return number ? `https://wa.me/${number}` : "";
}
function waButton(phone, label = "WhatsApp") {
  const href = waLink(phone);
  return href ? `<a class="button whatsapp compact" href="${href}" target="_blank" rel="noopener"><span class="material-symbols-rounded">chat</span>${label}</a>` : '<span class="muted">Nomor belum diisi</span>';
}
function customersRoleView() {
  const rows = state.customers;
  return `${pageHead("Customer", currentRole() === "sales" ? "Customer yang menjadi tanggung jawab kamu." : "Simpan data calon pembeli dan pelanggan.", '<button class="button primary-action" data-modal="customer">+ Tambah customer</button>')}<div class="panel data-panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Nama</th><th>WhatsApp</th><th>Kota</th><th>Sumber</th><th>Aksi</th></tr></thead><tbody>${rows.map((c) => `<tr><td><strong>${esc(c.full_name)}</strong></td><td>${esc(c.phone || "-")}</td><td>${esc(c.city || "-")}</td><td>${esc(c.source || "-")}</td><td><div class="row-actions">${waButton(c.phone, "Hubungi")}<button class="button secondary compact" data-edit-customer="${c.id}">Ubah</button>${currentRole() === "admin" ? "" : `<button class="button danger compact" data-delete-customer="${c.id}">Hapus</button>`}</div></td></tr>`).join("") || '<tr><td colspan="5"><div class="empty">Belum ada customer.</div></td></tr>'}</tbody></table></div>${mobileCards(rows, (c) => `<article class="data-card"><div class="card-top"><div><small>${esc(c.phone || "Tanpa nomor")}</small><h3>${esc(c.full_name)}</h3></div></div><p>${esc(c.city || "Kota belum diisi")} · ${esc(c.source || "Sumber belum diisi")}</p><div class="card-actions">${waButton(c.phone, "Hubungi")}<button class="button secondary compact" data-edit-customer="${c.id}">Ubah</button>${currentRole() === "admin" ? "" : `<button class="button danger compact" data-delete-customer="${c.id}">Hapus</button>`}</div></article>`)}</div>`;
}
function leadsRoleView() {
  const rows=[...state.leads].sort((a,b)=>new Date(a.next_follow_up_at||"2999-01-01")-new Date(b.next_follow_up_at||"2999-01-01"));
  return `${pageHead("Follow-up", currentRole()==="sales" ? "Kelola customer kamu dan hubungi langsung melalui WhatsApp." : "Kelola calon pembeli dari minat sampai closing.", '<button class="button primary-action" data-modal="lead">+ Tambah follow-up</button>')}<div class="followup-summary"><div><span>Total lead</span><strong>${rows.length}</strong></div><div><span>Perlu ditindaklanjuti</span><strong>${rows.filter((x)=>!["closed","lost"].includes(x.status)).length}</strong></div><div><span>Closing</span><strong>${rows.filter((x)=>x.status==="closed").length}</strong></div></div><div class="panel data-panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Customer</th><th>Kendaraan</th><th>Status</th><th>Follow-up</th><th>Aksi</th></tr></thead><tbody>${rows.map((lead)=>`<tr><td><strong>${esc(lead.customers?.full_name||"Customer")}</strong><br><small>${esc(lead.customers?.phone||"-")}</small></td><td>${esc(lead.vehicles?`${lead.vehicles.brand} ${lead.vehicles.model}`:"Belum memilih kendaraan")}</td><td><span class="status lead-status">${esc(leadDisplayStatus(lead.status))}</span></td><td>${esc(leadDate(lead.next_follow_up_at))}</td><td><div class="row-actions">${waButton(lead.customers?.phone,"Hubungi")}<button class="button secondary compact" data-edit-lead="${lead.id}">Ubah</button>${currentRole()==="admin"?"":`<button class="button danger compact" data-delete-lead="${lead.id}">Hapus</button>`}</div></td></tr>`).join("")||'<tr><td colspan="5"><div class="empty">Belum ada follow-up.</div></td></tr>'}</tbody></table></div>${mobileCards(rows,(lead)=>`<article class="data-card"><div class="card-top"><div><small>${esc(lead.customers?.phone||"Tanpa nomor")}</small><h3>${esc(lead.customers?.full_name||"Customer")}</h3></div><span class="status">${esc(leadDisplayStatus(lead.status))}</span></div><p>${esc(lead.vehicles?`${lead.vehicles.brand} ${lead.vehicles.model}`:"Belum memilih kendaraan")}</p><div class="card-actions">${waButton(lead.customers?.phone,"Hubungi")}<button class="button secondary compact" data-edit-lead="${lead.id}">Ubah</button>${currentRole()==="admin"?"":`<button class="button danger compact" data-delete-lead="${lead.id}">Hapus</button>`}</div></article>`)}</div>`;
}
async function teamRequest(action, payload = {}) {
  const { data, error } = await db.functions.invoke("team-manage", { body: { action, showroom_id: state.showroom.id, ...payload } });
  if (error) {
    let message = "Pengelolaan tim belum dapat diproses.";
    try { const detail = await error.context.json(); message = detail.error || message; } catch {}
    throw new Error(message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}
async function loadTeam() {
  try { state.team = (await teamRequest("list")).members || []; }
  catch (error) { state.team = []; toast(error.message, "error"); }
}
function teamView() {
  return `${pageHead("Tim", "Owner membuat akun dan menentukan akses setiap karyawan.", '<button class="button primary-action" data-add-team>+ Tambah tim</button>')}<div class="role-summary"><div><strong>Owner</strong><span>Akses penuh dan pengelola tim</span></div><div><strong>Sales</strong><span>Customer, follow-up, kendaraan, dan penjualan sendiri</span></div><div><strong>Admin Operasional</strong><span>Stok, rekondisi, transaksi, kas, dan laporan</span></div></div><div class="panel data-panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Nama</th><th>Username</th><th>Akses</th><th>Status</th><th>Aksi</th></tr></thead><tbody>${state.team.map((m) => `<tr><td><strong>${esc(m.full_name || "-")}</strong></td><td>${esc(m.username || "-")}</td><td>${roleLabel(m.role)}</td><td><span class="status ${m.is_active ? "paid" : "cancelled"}">${m.is_active ? "Aktif" : "Nonaktif"}</span></td><td><div class="row-actions"><button class="button secondary compact" data-edit-team="${m.user_id}">Ubah</button><button class="button secondary compact" data-reset-team="${m.user_id}">Reset password</button><button class="button ${m.is_active ? "danger" : "secondary"} compact" data-toggle-team="${m.user_id}">${m.is_active ? "Nonaktifkan" : "Aktifkan"}</button></div></td></tr>`).join("") || '<tr><td colspan="5"><div class="empty">Belum ada akun tim.</div></td></tr>'}</tbody></table></div>${mobileCards(state.team, (m) => `<article class="data-card"><div class="card-top"><div><small>@${esc(m.username || "-")}</small><h3>${esc(m.full_name || "-")}</h3></div><span class="status">${roleLabel(m.role)}</span></div><p>${m.is_active ? "Akun aktif" : "Akun dinonaktifkan"}</p><div class="card-actions"><button class="button secondary compact" data-edit-team="${m.user_id}">Ubah</button><button class="button secondary compact" data-reset-team="${m.user_id}">Password</button><button class="button ${m.is_active ? "danger" : "secondary"} compact" data-toggle-team="${m.user_id}">${m.is_active ? "Nonaktifkan" : "Aktifkan"}</button></div></article>`)}</div>`;
}
function openTeamModal(member = null, resetOnly = false) {
  const modal = document.createElement("div");
  modal.className = "modal-backdrop visible";
  const isEdit = Boolean(member);
  const fields = resetOnly
    ? `<div><label>Password baru</label><input name="password" type="password" minlength="6" required autocomplete="new-password" placeholder="Minimal 6 karakter"></div>`
    : `<div class="form-grid"><div class="span-2"><label>Nama lengkap</label><input name="full_name" required value="${esc(member?.full_name || "")}"></div>${isEdit ? `<div class="span-2"><label>Username</label><input value="${esc(member.username || "")}" readonly class="readonly"><small>Username tetap agar akses login tidak terputus.</small></div>` : '<div><label>Username</label><input name="username" required pattern="[a-zA-Z0-9._-]{3,32}" placeholder="Contoh: sales.andi"></div><div><label>Password awal</label><input name="password" type="password" minlength="6" required autocomplete="new-password"></div>'}<div class="span-2"><label>Akses</label><select name="role"><option value="sales" ${member?.role === "sales" ? "selected" : ""}>Sales</option><option value="admin" ${member?.role === "admin" ? "selected" : ""}>Admin Operasional</option></select></div></div>`;
  modal.innerHTML = `<section class="modal"><header class="modal-title"><div><h2>${resetOnly ? "Reset password" : isEdit ? "Ubah anggota tim" : "Tambah anggota tim"}</h2><p>${resetOnly ? `Buat password baru untuk ${esc(member.full_name)}.` : "Akun langsung dapat digunakan setelah disimpan."}</p></div><button type="button" class="modal-close">×</button></header><form class="modal-body">${fields}<footer class="modal-foot"><button type="button" class="button secondary" data-close>Batal</button><button class="button" type="submit">Simpan</button></footer></form></section>`;
  document.body.append(modal);
  const close = () => modal.remove();
  modal.querySelector(".modal-close").onclick = close;
  modal.querySelector("[data-close]").onclick = close;
  modal.onclick = (e) => { if (e.target === modal) close(); };
  modal.querySelector("form").onsubmit = async (e) => {
    e.preventDefault(); const submit=e.currentTarget.querySelector('[type="submit"]'); submit.disabled=true; submit.textContent="Menyimpan…";
    const values=Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (resetOnly) await teamRequest("reset_password", { user_id: member.user_id, password: values.password });
      else if (isEdit) await teamRequest("update", { user_id: member.user_id, full_name: values.full_name, role: values.role });
      else await teamRequest("create", values);
      close(); await loadTeam(); renderShell(); toast(resetOnly ? "Password berhasil diganti" : "Akun tim berhasil disimpan");
    } catch(error) { submit.disabled=false; submit.textContent="Simpan"; toast(error.message,"error"); }
  };
}
function renderRolePage() {
  ensureAllowedView();
  const page = document.querySelector("#page");
  const views = { dashboard: roleDashboard, vehicles: currentRole() === "sales" ? () => {
    const rows=state.vehicles; return `${pageHead("Kendaraan", "Lihat unit yang tersedia dan target harga jual.")}<div class="panel data-panel"><div class="table-wrap"><table class="data-table"><thead><tr><th>Unit</th><th>Jenis</th><th>Target jual</th><th>Status</th></tr></thead><tbody>${rows.map((v)=>`<tr><td><strong>${esc(v.brand)} ${esc(v.model)}</strong><br><small>${esc(v.code)} · ${v.year || "-"}</small></td><td>${v.vehicle_type === "car" ? "Mobil" : "Motor"}</td><td>${rupiah(v.target_price)}</td><td>${status(v.status)}</td></tr>`).join("") || '<tr><td colspan="4"><div class="empty">Belum ada kendaraan.</div></td></tr>'}</tbody></table></div></div>`;
  } : ownerVehiclesView, costs, customers: customersRoleView, leads: leadsRoleView, sales: salesRoleView, finance, reports, team: teamView, settings };
  page.innerHTML = views[state.view]();
  if (currentRole() === "admin")
    page.querySelectorAll("[data-delete-vehicle],[data-delete-cost],[data-delete-sale],[data-delete-transaction],[data-delete-customer]").forEach((el)=>el.remove());
  if (currentRole() === "sales")
    page.querySelectorAll("[data-edit-vehicle],[data-delete-vehicle],[data-edit-sale],[data-delete-sale]").forEach((el)=>el.remove());
  bindPage();
}
function renderRoleShell() {
  ensureAllowedView();
  const username=state.member?.username || state.session.user.user_metadata?.username || state.session.user.email.split("@")[0];
  const nav=allowedNavigation();
  const navItems=nav.map(([id,label])=>`<button data-view="${id}" class="${state.view === id ? "active" : ""}"><span class="material-symbols-rounded">${mobileIcons[id] || "circle"}</span><span class="nav-label">${label}</span></button>`).join("");
  const primaryIds=currentRole()==="sales" ? ["dashboard","customers","leads","sales"] : ["dashboard","vehicles","sales","finance"];
  const primary=nav.filter(([id])=>primaryIds.includes(id)).slice(0,3);
  const addType=currentRole()==="sales" ? "customer" : "vehicle";
  app.innerHTML=`<div class="shell clean-shell"><aside class="sidebar"><div class="side-brand">${logo()}<div><strong>Bantu Beres</strong><span>Garasi Pro</span></div><button class="sidebar-toggle" data-collapse><span class="material-symbols-rounded">left_panel_close</span></button></div><nav class="nav">${navItems}</nav><div class="sidebar-foot"><div class="account-role"><strong>${esc(username)}</strong><span>${roleLabel()}</span></div><button class="logout-button" data-logout><span class="material-symbols-rounded">logout</span><span class="nav-label">Keluar akun</span></button></div></aside><main class="main"><header class="topbar"><button class="icon-btn mobile-menu-button" data-menu><span class="material-symbols-rounded">menu</span></button><div class="showroom-name"><strong>${esc(state.showroom.name)}</strong><span>${roleLabel()} · ${esc(state.showroom.city || "Lokasi belum diisi")}</span></div><div class="top-actions"><button class="icon-btn" data-refresh><span class="material-symbols-rounded">refresh</span></button><button class="icon-btn" data-theme><span class="material-symbols-rounded">${document.documentElement.dataset.theme === "dark" ? "light_mode" : "dark_mode"}</span></button></div></header><section id="page" class="page"></section></main><nav class="mobile-nav">${primary.map(([id,label])=>`<button data-view="${id}" class="${state.view===id?"active":""}"><span class="material-symbols-rounded">${mobileIcons[id]}</span><span>${label}</span></button>`).join("")}<button class="add-action" data-modal="${addType}"><span class="material-symbols-rounded">add</span><b>Tambah</b></button><button data-menu><span class="material-symbols-rounded">menu</span><span>Menu</span></button></nav><aside class="mobile-drawer"><div class="drawer-brand">${logo()}<div><strong>Bantu Beres</strong><span>Garasi Pro</span></div><button class="icon-btn" data-menu-close><span class="material-symbols-rounded">close</span></button></div><div class="drawer-account"><small>${esc(username)}</small><strong>${esc(state.showroom.name)}</strong><span>${roleLabel()}</span></div><nav>${navItems}</nav><button class="drawer-logout" data-logout><span class="material-symbols-rounded">logout</span>Keluar akun</button></aside><div class="drawer-shade" data-menu-close></div></div>`;
  const shell=app.querySelector(".shell"), close=()=>{shell.classList.remove("drawer-open");document.body.classList.remove("no-scroll")};
  app.querySelectorAll("[data-view]").forEach((b)=>b.onclick=()=>{state.view=b.dataset.view;close();renderShell()});
  app.querySelectorAll("[data-menu]").forEach((b)=>b.onclick=()=>{shell.classList.add("drawer-open");document.body.classList.add("no-scroll")});
  app.querySelectorAll("[data-menu-close]").forEach((b)=>b.onclick=close);
  app.querySelectorAll("[data-logout]").forEach((b)=>b.onclick=async()=>{await db.auth.signOut();state={...state,session:null,showroom:null,member:null,team:[]};renderAuth()});
  app.querySelector("[data-refresh]").onclick=async()=>{await loadData();renderPage();toast("Data berhasil diperbarui")};
  app.querySelector("[data-theme]").onclick=()=>{setTheme(document.documentElement.dataset.theme==="dark"?"light":"dark");renderShell()};
  app.querySelector("[data-collapse]").onclick=()=>{shell.classList.toggle("sidebar-collapsed");localStorage.setItem("garasi-sidebar",shell.classList.contains("sidebar-collapsed")?"1":"0")};
  if(localStorage.getItem("garasi-sidebar")==="1") shell.classList.add("sidebar-collapsed");
  renderPage();
}
bindPage = function () {
  baseBindPageForRoles();
  document.querySelectorAll("[data-wa-phone]").forEach((b)=>b.onclick=()=>window.open(waLink(b.dataset.waPhone),"_blank","noopener"));
  document.querySelector("[data-add-team]")?.addEventListener("click",()=>openTeamModal());
  document.querySelectorAll("[data-edit-team]").forEach((b)=>b.onclick=()=>openTeamModal(state.team.find((m)=>m.user_id===b.dataset.editTeam)));
  document.querySelectorAll("[data-reset-team]").forEach((b)=>b.onclick=()=>openTeamModal(state.team.find((m)=>m.user_id===b.dataset.resetTeam),true));
  document.querySelectorAll("[data-toggle-team]").forEach((b)=>b.onclick=()=>{const m=state.team.find((x)=>x.user_id===b.dataset.toggleTeam);confirmAction(m.is_active?"Nonaktifkan akun?":"Aktifkan akun?",m.is_active?"Akun langsung kehilangan akses ke data showroom.":"Akun dapat kembali masuk menggunakan username dan passwordnya.",async()=>{try{await teamRequest("set_active",{user_id:m.user_id,is_active:!m.is_active});await loadTeam();renderShell();toast(`Akun ${m.is_active?"dinonaktifkan":"diaktifkan"}`)}catch(error){toast(error.message,"error")}})});
};
renderPage = renderRolePage;
renderShell = renderRoleShell;


/* Dedicated spreadsheet-style printable reports. */
function reportCell(value) {
  return esc(value == null || value === "" ? "-" : String(value));
}
function reportDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? reportCell(value)
    : date.toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function reportVehicleName(vehicle, fallback = null) {
  const item = vehicle || fallback;
  return item ? [item.brand, item.model].filter(Boolean).join(" ") || "-" : "-";
}
function printableReportData(type) {
  const activeStock = state.vehicles.filter(
    (vehicle) => !["sold", "delivered", "cancelled"].includes(vehicle.status),
  );
  if (type === "stock") {
    const rows = activeStock.map((vehicle, index) => {
      const recon = state.costs
        .filter((cost) => cost.vehicle_id === vehicle.id)
        .reduce((sum, cost) => sum + Number(cost.amount || 0), 0);
      const purchase = Number(vehicle.purchase_price || 0);
      return [
        index + 1,
        vehicle.code,
        vehicle.vehicle_type === "car" ? "Mobil" : "Motor",
        reportVehicleName(vehicle),
        vehicle.year,
        vehicle.license_plate,
        reportDate(vehicle.purchase_date),
        rupiah(purchase),
        rupiah(recon),
        rupiah(purchase + recon),
        rupiah(vehicle.target_price),
        statusLabel(vehicle.status),
      ];
    });
    const capital = activeStock.reduce((sum, vehicle) => sum + vehicleHpp(vehicle), 0);
    return {
      title: "LAPORAN STOK KENDARAAN",
      columns: ["No.", "Kode", "Jenis", "Kendaraan", "Tahun", "No. Polisi", "Tanggal Beli", "Harga Beli", "Rekondisi", "HPP", "Target Jual", "Status"],
      rows,
      summary: [
        ["Jumlah stok aktif", activeStock.length + " unit"],
        ["Total modal dalam stok", rupiah(capital)],
        ["Total target penjualan", rupiah(activeStock.reduce((sum, vehicle) => sum + Number(vehicle.target_price || 0), 0))],
      ],
    };
  }
  const salesRows = type === "receivable"
    ? state.sales.filter((sale) => saleMetrics(sale).receivable > 0)
    : state.sales;
  if (type === "receivable") {
    return {
      title: "LAPORAN PIUTANG PENJUALAN",
      columns: ["No.", "Tanggal", "No. Nota", "Customer", "Kendaraan", "Harga Bersih", "Sudah Dibayar", "Sisa Piutang", "Status"],
      rows: salesRows.map((sale, index) => {
        const metrics = saleMetrics(sale);
        return [
          index + 1,
          reportDate(sale.sale_date),
          sale.invoice_number,
          sale.customers?.full_name,
          reportVehicleName(sale.vehicles, state.vehicles.find((vehicle) => vehicle.id === sale.vehicle_id)),
          rupiah(metrics.net),
          rupiah(sale.paid_amount),
          rupiah(metrics.receivable),
          statusLabel(sale.payment_status),
        ];
      }),
      summary: [
        ["Jumlah transaksi belum lunas", salesRows.length + " transaksi"],
        ["Total nilai penjualan bersih", rupiah(salesRows.reduce((sum, sale) => sum + saleMetrics(sale).net, 0))],
        ["Total pembayaran diterima", rupiah(salesRows.reduce((sum, sale) => sum + Number(sale.paid_amount || 0), 0))],
        ["Total sisa piutang", rupiah(salesRows.reduce((sum, sale) => sum + saleMetrics(sale).receivable, 0))],
      ],
    };
  }
  return {
    title: "LAPORAN PENJUALAN KENDARAAN",
    columns: ["No.", "Tanggal", "No. Nota", "Customer", "Kendaraan", "Harga Jual", "Diskon", "Harga Bersih", "Dibayar", "Komisi", "HPP", "Laba", "Status"],
    rows: salesRows.map((sale, index) => {
      const metrics = saleMetrics(sale);
      const vehicle = sale.vehicles || state.vehicles.find((item) => item.id === sale.vehicle_id);
      return [
        index + 1,
        reportDate(sale.sale_date),
        sale.invoice_number,
        sale.customers?.full_name,
        reportVehicleName(vehicle),
        rupiah(sale.sale_price),
        rupiah(sale.discount),
        rupiah(metrics.net),
        rupiah(sale.paid_amount),
        rupiah(sale.commission),
        rupiah(vehicle ? vehicleHpp(vehicle) : 0),
        rupiah(metrics.profit),
        statusLabel(sale.payment_status),
      ];
    }),
    summary: [
      ["Jumlah penjualan", salesRows.length + " transaksi"],
      ["Total penjualan bersih", rupiah(salesRows.reduce((sum, sale) => sum + saleMetrics(sale).net, 0))],
      ["Total pembayaran diterima", rupiah(salesRows.reduce((sum, sale) => sum + Number(sale.paid_amount || 0), 0))],
      ["Total laba", rupiah(salesRows.reduce((sum, sale) => sum + saleMetrics(sale).profit, 0))],
    ],
  };
}
function statusLabel(value) {
  const labels = {
    inspection: "Pemeriksaan",
    reconditioning: "Rekondisi",
    ready: "Siap dijual",
    listed: "Dipasarkan",
    booked: "Dipesan",
    sold: "Terjual",
    delivered: "Diserahkan",
    paid: "Lunas",
    partial: "Sebagian",
    unpaid: "Belum lunas",
  };
  return labels[value] || value || "-";
}
function printReport(type) {
  const report = printableReportData(type);
  const showroom = state.showroom || {};
  const generatedAt = new Date().toLocaleString("id-ID", {
    day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  const tableRows = report.rows.length
    ? report.rows.map((row) => "<tr>" + row.map((cell) => "<td>" + reportCell(cell) + "</td>").join("") + "</tr>").join("")
    : '<tr><td class="empty-print" colspan="' + report.columns.length + '">Belum ada data untuk laporan ini.</td></tr>';
  const summaryRows = report.summary
    .map(([label, value]) => "<tr><th>" + reportCell(label) + "</th><td>" + reportCell(value) + "</td></tr>")
    .join("");
  const contact = [showroom.phone || showroom.whatsapp, showroom.contact_email].filter(Boolean).join(" · ");
  const html = \`<!doctype html><html lang="id"><head><meta charset="utf-8"><title>\${reportCell(report.title)} - \${reportCell(showroom.name)}</title><style>
    @page{size:A4 landscape;margin:12mm}
    *{box-sizing:border-box}
    body{margin:0;color:#111;font:10px Arial,Helvetica,sans-serif;background:#fff}
    .report-head{display:grid;grid-template-columns:1fr auto;gap:18px;align-items:start;border-bottom:2px solid #111;padding-bottom:9px;margin-bottom:12px}
    h1{font-size:17px;letter-spacing:.4px;margin:0 0 6px}
    .identity{line-height:1.55}.identity strong{font-size:13px}
    .meta{text-align:right;line-height:1.6}
    .summary{width:auto;min-width:330px;border-collapse:collapse;margin:0 0 14px auto}
    .summary th,.summary td{border:1px solid #555;padding:5px 7px;text-align:left}
    .summary th{background:#eee;width:58%}
    .report-table{width:100%;border-collapse:collapse;table-layout:auto}
    .report-table thead{display:table-header-group}
    .report-table tr{break-inside:avoid}
    .report-table th,.report-table td{border:1px solid #555;padding:5px 4px;vertical-align:top;white-space:nowrap}
    .report-table th{background:#e9e9e9;text-align:center;font-weight:700}
    .report-table td:first-child{text-align:center}
    .empty-print{text-align:center!important;padding:22px!important}
    .signature{display:grid;grid-template-columns:1fr 220px;gap:30px;margin-top:24px;break-inside:avoid}
    .signature-box{text-align:center;line-height:1.5}.signature-space{height:55px}
    .footer{margin-top:12px;padding-top:6px;border-top:1px solid #999;font-size:8px;color:#555}
    @media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>
    <header class="report-head"><div class="identity"><h1>\${reportCell(report.title)}</h1><strong>\${reportCell(showroom.name)}</strong><br>\${reportCell(showroom.address || showroom.city)}<br>\${reportCell(contact)}</div><div class="meta">Dicetak: \${reportCell(generatedAt)}<br>Penanggung jawab: \${reportCell(showroom.owner_name)}<br>Jenis usaha: \${showroom.business_type === "car" ? "Mobil" : showroom.business_type === "motorcycle" ? "Motor" : "Mobil & Motor"}</div></header>
    <table class="summary"><tbody>\${summaryRows}</tbody></table>
    <table class="report-table"><thead><tr>\${report.columns.map((column) => "<th>" + reportCell(column) + "</th>").join("")}</tr></thead><tbody>\${tableRows}</tbody></table>
    <section class="signature"><div></div><div class="signature-box">\${reportCell(showroom.city)}, \${reportDate(new Date())}<br>Pemilik/Penanggung Jawab<div class="signature-space"></div><strong>\${reportCell(showroom.owner_name)}</strong></div></section>
    <footer class="footer">Dokumen dibuat dari Bantu Beres Garasi Pro berdasarkan data showroom yang sedang aktif.</footer>
  </body></html>\`;
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;width:0;height:0;border:0;right:0;bottom:0";
  document.body.appendChild(frame);
  const printWindow = frame.contentWindow;
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  frame.onload = () => {
    printWindow.focus();
    printWindow.print();
    setTimeout(() => frame.remove(), 1000);
  };
}
const bindPageBeforePrintableReports = bindPage;
bindPage = function () {
  bindPageBeforePrintableReports();
  document.querySelectorAll("[data-print]").forEach((button) => {
    button.onclick = () => printReport(button.dataset.print);
  });
};
