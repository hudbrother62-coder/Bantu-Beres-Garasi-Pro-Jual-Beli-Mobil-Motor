/* Garasi Pro — umur stok kendaraan, tanggal otomatis/manual dan impor Excel. */
const isActiveStock = (vehicle) => !["sold", "delivered", "cancelled"].includes(vehicle.status);
const agingFilter = { mode: "input", range: "all", search: "" };

function jakartaDay(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value || "";
  return [part("year"), part("month"), part("day")].join("-");
}

function isCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return year >= 1950 && year <= 2100 &&
    date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month && date.getUTCDate() === day;
}
function todayAtShowroom() { return jakartaDay(new Date()); }

export function stockDateValue(vehicle) {
  if (vehicle.stock_date_mode === "manual") return vehicle.stock_start_date || vehicle.purchase_date || "";
  if (vehicle.stock_date_mode === "input") return jakartaDay(vehicle.created_at) || vehicle.purchase_date || "";
  // Kendaraan sebelum fitur ini memakai tanggal beli, tanpa mengubah catatan lama.
  return vehicle.purchase_date || jakartaDay(vehicle.created_at) || "";
}
export function stockAgeDays(vehicle) {
  const first = stockDateValue(vehicle);
  const now = todayAtShowroom();
  if (!isCalendarDate(first) || !isCalendarDate(now)) return null;
  const days = (Date.parse(now + "T00:00:00Z") - Date.parse(first + "T00:00:00Z")) / 86400000;
  return Math.max(0, Math.floor(days));
}
function stockModeLabel(vehicle) {
  if (vehicle.stock_date_mode === "manual") return "Tanggal khusus";
  if (vehicle.stock_date_mode === "input") return "Hari input";
  return "Tanggal beli (data lama)";
}
function ageStatus(days) {
  if (days == null) return ["Belum ada tanggal", "neutral"];
  if (days > 90) return ["Lebih dari 90 hari", "bad"];
  if (days > 60) return ["61–90 hari", "warn"];
  if (days > 30) return ["31–60 hari", "watch"];
  return ["0–30 hari", "ok"];
}
function dateDisplay(iso) {
  if (!isCalendarDate(iso)) return "-";
  const [y,m,d] = iso.split("-");
  return d + "/" + m + "/" + y;
}
function filteredStock(ctx) {
  const needle = agingFilter.search.trim().toLowerCase();
  return ctx.state.vehicles.filter(isActiveStock).filter((v) => {
    const isManual = v.stock_date_mode === "manual";
    if (agingFilter.mode === "manual" ? !isManual : isManual) return false;
    const age = stockAgeDays(v);
    if (agingFilter.range === "90" && !(age > 90)) return false;
    if (agingFilter.range === "60" && !(age > 60)) return false;
    if (agingFilter.range === "30" && !(age > 30)) return false;
    if (needle && ![v.brand, v.model, v.code, v.license_plate, v.variant].some((s) => String(s || "").toLowerCase().includes(needle))) return false;
    return true;
  }).sort((a,b) => (stockAgeDays(b) ?? -1) - (stockAgeDays(a) ?? -1));
}

export function agingView(ctx) {
  const active = ctx.state.vehicles.filter(isActiveStock);
  const aged = active.filter((v) => (stockAgeDays(v) ?? -1) > 90);
  const manual = active.filter((v) => v.stock_date_mode === "manual").length;
  const rows = filteredStock(ctx);
  const e = ctx.esc;
  const canImport = ctx.role !== "sales";
  const header = ctx.pageHead("Umur Stok / Stok Mengendap",
    "Pantau kendaraan yang belum terjual berdasarkan tanggal awal stok. Tanggal ini tidak mengubah tanggal beli atau kas.",
    canImport ? '<div class="age-actions"><button class="button secondary" data-age-template>Template Excel</button><button class="button primary-action" data-age-upload>Impor Excel</button></div>' : "");
  const summary = '<div class="metric-grid age-metrics">' +
    '<article class="metric"><div class="label">STOK BELUM TERJUAL</div><div class="value">' + active.length + '</div><div class="meta">Unit tersedia</div></article>' +
    '<article class="metric"><div class="label">MENGENDAP > 90 HARI</div><div class="value warn">' + aged.length + '</div><div class="meta">Prioritas pemeriksaan</div></article>' +
    '<article class="metric"><div class="label">MODAL TERIKAT > 90 HARI</div><div class="value">' + ctx.rupiah(aged.reduce((sum,v)=>sum+ctx.vehicleHpp(v),0)) + '</div><div class="meta">Harga beli + rekondisi</div></article>' +
    '<article class="metric"><div class="label">TANGGAL MANUAL</div><div class="value">' + manual + '</div><div class="meta">Unit memakai tanggal khusus</div></article></div>';
  const filters = '<section class="panel age-panel"><div class="age-tabs" role="group" aria-label="Pilih cara menghitung umur stok">' +
    '<button type="button" data-age-mode="input" class="' + (agingFilter.mode === "input" ? "active" : "") + '">Otomatis (hari input)</button>' +
    '<button type="button" data-age-mode="manual" class="' + (agingFilter.mode === "manual" ? "active" : "") + '">Tanggal yang ditentukan</button></div>' +
    '<p class="sub age-note">' + (agingFilter.mode === "input"
       ? "Umur dimulai dari hari kendaraan diinput. Data lama tetap dihitung dari tanggal beli sampai diubah."
       : "Umur dimulai dari tanggal stok khusus yang dipilih saat menambah atau mengubah kendaraan.") + '</p>' +
    '<div class="age-filters"><input data-age-search aria-label="Cari stok" placeholder="Cari kode, merek, model, atau plat" value="' + e(agingFilter.search) + '">' +
    '<select data-age-range aria-label="Filter lama stok"><option value="all">Semua umur</option><option value="30"' +
    (agingFilter.range === "30" ? " selected" : "") + '>Lebih dari 30 hari</option><option value="60"' +
    (agingFilter.range === "60" ? " selected" : "") + '>Lebih dari 60 hari</option><option value="90"' +
    (agingFilter.range === "90" ? " selected" : "") + '>Lebih dari 90 hari</option></select>' +
    '<button type="button" class="button secondary" data-age-export>Ekspor Excel</button></div>' +
    '<p class="sub age-count">' + rows.length + ' kendaraan ditampilkan</p>';
  const rowHtml = rows.map((v) => {
    const d = stockAgeDays(v), status = ageStatus(d);
    return '<tr><td><strong>' + e(v.brand) + ' ' + e(v.model) + '</strong><br><small>' + e(v.code) + ' · ' + e(v.license_plate || "-") + '</small></td>' +
      '<td>' + e(dateDisplay(stockDateValue(v))) + '<br><small>' + e(stockModeLabel(v)) + '</small></td>' +
      '<td><strong>' + (d == null ? "-" : d + " hari") + '</strong></td>' +
      '<td><span class="age-status ' + status[1] + '">' + status[0] + '</span></td>' +
      '<td>' + ctx.rupiah(ctx.vehicleHpp(v)) + '</td>' +
      '<td>' + (canImport ? '<button class="button secondary compact" data-edit-vehicle="' + e(v.id) + '">Ubah tanggal</button>' : '-') + '</td></tr>';
  }).join("");
  const table = '<div class="table-wrap"><table class="data-table age-table"><thead><tr><th>Kendaraan</th><th>Tanggal stok</th><th>Lama stok</th><th>Kondisi</th><th>Modal</th><th>Aksi</th></tr></thead><tbody>' +
    (rowHtml || '<tr><td colspan="6"><div class="empty">Tidak ada stok untuk pilihan ini.</div></td></tr>') + '</tbody></table></div>';
  const mobile = '<div class="age-mobile">' + rows.map((v) => {
    const d=stockAgeDays(v), a=ageStatus(d);
    return '<article class="data-card age-card"><div class="card-top"><div><small>' + e(v.code) + '</small><h3>' + e(v.brand) + ' ' + e(v.model) + '</h3></div><span class="age-status ' + a[1] + '">' + a[0] + '</span></div>' +
      '<dl><div><dt>Mulai stok</dt><dd>' + e(dateDisplay(stockDateValue(v))) + '</dd></div><div><dt>Lama stok</dt><dd><strong>' + (d==null?"-":d+" hari") + '</strong></dd></div><div><dt>Modal</dt><dd>' + ctx.rupiah(ctx.vehicleHpp(v)) + '</dd></div></dl>' +
      '<small>' + e(stockModeLabel(v)) + '</small>' +
      (canImport ? '<div class="card-actions"><button class="button secondary compact" data-edit-vehicle="' + e(v.id) + '">Ubah tanggal stok</button></div>' : '') + '</article>';
  }).join("") + '</div>';
  return header + summary + filters + table + mobile +
    (canImport ? '<input type="file" data-age-file accept=".xlsx,.xls" hidden>' : '') + '</section>';
}

function spreadsheetReady() {
  if (!window.XLSX) throw new Error("Komponen Excel tidak termuat. Periksa koneksi lalu muat ulang halaman.");
  return window.XLSX;
}
const templateHeaders = [
  "Jenis", "Merek", "Model", "Varian", "Tahun", "Nomor Polisi",
  "Warna", "Kilometer", "Transmisi", "Bahan Bakar", "Kapasitas Mesin",
  "Harga Beli", "Target Jual", "Harga Minimum", "Tanggal Beli",
  "Mode Tanggal Stok", "Tanggal Stok", "Status", "Catatan"
];
function makeWorkbook(XLSX) {
  const book = XLSX.utils.book_new();
  const first = XLSX.utils.aoa_to_sheet([templateHeaders]);
  first["!cols"] = templateHeaders.map((x)=>({wch:Math.max(16,x.length+3)}));
  XLSX.utils.book_append_sheet(book, first, "Data Stok");
  const example = XLSX.utils.aoa_to_sheet([
    templateHeaders,
    ["Mobil", "Toyota", "Avanza", "G", 2020, "L 1234 AB", "Hitam", 45000,
     "Manual", "Bensin", 1500, 145000000, 165000000, 150000000,
     "2026-11-01", "manual", "2026-11-01", "ready", "Contoh saja, jangan diimpor"]
  ]);
  example["!cols"] = first["!cols"];
  XLSX.utils.book_append_sheet(book, example, "CONTOH - jangan impor");
  return book;
}
function downloadWorkbook(XLSX, ctx, rows) {
  const book = makeWorkbook(XLSX);
  if (rows) {
    const heading=["Kode", "Jenis", "Kendaraan", "Tanggal Beli", "Mode Tanggal Stok", "Tanggal Stok", "Lama Stok (hari)", "Status", "Modal"];
    const sheet=XLSX.utils.aoa_to_sheet([heading,...rows.map(v=>[
      v.code, v.vehicle_type==="car"?"Mobil":"Motor", (v.brand||"")+" "+(v.model||""),
      v.purchase_date, stockModeLabel(v), stockDateValue(v), stockAgeDays(v), v.status,
      ctx.vehicleHpp(v)
    ])]);
    sheet["!cols"]=heading.map(x=>({wch:Math.max(x.length+2,17)}));
    XLSX.utils.book_append_sheet(book,sheet,"Laporan Mengendap");
  }
  XLSX.writeFile(book, rows ? "Garasi-Pro-Laporan-Umur-Stok.xlsx" : "Garasi-Pro-Template-Impor-Stok.xlsx");
}

function normalizeName(s) {
  return String(s||"").toLowerCase().normalize("NFKC").replace(/[^a-z0-9]/g,"");
}
function getCell(row, ...labels) {
  const object=Object.fromEntries(Object.entries(row).map(([k,v])=>[normalizeName(k),v]));
  for(const name of labels) if(Object.prototype.hasOwnProperty.call(object,normalizeName(name))) return object[normalizeName(name)];
  return "";
}
function excelDate(value, XLSX) {
  if(value==null||value==="") return "";
  if(value instanceof Date && !Number.isNaN(value.getTime())) {
    return [value.getUTCFullYear(),String(value.getUTCMonth()+1).padStart(2,"0"),String(value.getUTCDate()).padStart(2,"0")].join("-");
  }
  if(typeof value==="number") {
    const d=XLSX.SSF.parse_date_code(value);
    return d ? [d.y,String(d.m).padStart(2,"0"),String(d.d).padStart(2,"0")].join("-") : "";
  }
  const str=String(value).trim();
  if(/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  const m=str.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);
  return m ? m[3]+"-"+m[2].padStart(2,"0")+"-"+m[1].padStart(2,"0") : str;
}
function numeric(value) {
  if(value==null||String(value).trim()==="") return 0;
  if(typeof value==="number") return value;
  const str=String(value).replace(/[^\d.,-]/g,"");
  const clean=str.replace(/[.,](?=\d{3}(?:[.,]|$))/g,"").replace(",",".");
  return Number(clean);
}
function importRows(XLSX, sheet, ctx) {
  const source=XLSX.utils.sheet_to_json(sheet,{defval:"",raw:true,blankrows:false});
  const seenPlate=new Set(ctx.state.vehicles.map(v=>normalizeName(v.license_plate)).filter(Boolean));
  const errors=[], result=[];
  for(let idx=0;idx<source.length;idx++) {
    const row=source[idx], i=idx+2;
    if(!Object.values(row).some(value=>String(value??"").trim())) continue;
    const brand=String(getCell(row,"Merek","Brand")||"").trim();
    const model=String(getCell(row,"Model","Tipe","Model / Tipe")||"").trim();
    const plate=String(getCell(row,"Nomor Polisi","Plat Nomor","Nopol")||"").trim();
    const kind=String(getCell(row,"Jenis","Jenis Kendaraan")||"").toLowerCase();
    const dateBought=excelDate(getCell(row,"Tanggal Beli","Tanggal Pembelian"),XLSX)||todayAtShowroom();
    const requested=String(getCell(row,"Mode Tanggal Stok","Mode Stok")||"").toLowerCase().trim();
    const custom=excelDate(getCell(row,"Tanggal Stok","Tanggal Masuk Stok","Awal Stok"),XLSX);
    const mode=requested.includes("manual")||requested.includes("tentu")?"manual":
      requested.includes("input")||requested.includes("otomatis")?"input":(custom?"manual":"input");
    const yearVal=getCell(row,"Tahun");
    const year=yearVal===""?null:numeric(yearVal);
    const purchase=numeric(getCell(row,"Harga Beli","Harga Pembelian"));
    const target=numeric(getCell(row,"Target Jual","Harga Jual"));
    const min=numeric(getCell(row,"Harga Minimum","Minimal Jual"));
    const mileage=numeric(getCell(row,"Kilometer","KM"));
    const cc=numeric(getCell(row,"Kapasitas Mesin","CC"));
    const statusRaw=String(getCell(row,"Status","Status Unit")||"inspection").toLowerCase().trim();
    const statusMap={"inspeksi":"inspection","rekondisi":"reconditioning","siap jual":"ready","diiklankan":"listed","dipesan":"booked"};
    const status=statusMap[statusRaw]||statusRaw;
    const validStatuses=["inspection","reconditioning","ready","listed","booked"];
    const problems=[];
    if(!brand||!model) problems.push("Merek dan Model wajib diisi");
    if(!isCalendarDate(dateBought)) problems.push("Tanggal Beli tidak valid");
    if(mode==="manual"&&!isCalendarDate(custom)) problems.push("Tanggal Stok manual wajib valid");
    if(mode==="manual"&&custom>todayAtShowroom()) problems.push("Tanggal Stok belum boleh di masa depan");
    if(year!=null&&(!Number.isInteger(year)||year<1950||year>2100)) problems.push("Tahun tidak valid");
    if([purchase,target,min,mileage,cc].some(v=>!Number.isFinite(v)||v<0)) problems.push("Nilai angka tidak valid");
    if(!validStatuses.includes(status)) problems.push("Status belum terjual harus inspection/reconditioning/ready/listed/booked");
    if(plate&&seenPlate.has(normalizeName(plate))) problems.push("Nomor polisi duplikat");
    const type=ctx.state.showroom.business_type==="both"?
      (kind.includes("motor")?"motorcycle":"car"):ctx.state.showroom.business_type;
    if(problems.length) {errors.push("Baris "+i+": "+problems.join("; "));continue;}
    if(plate) seenPlate.add(normalizeName(plate));
    result.push({
      showroom_id:ctx.state.showroom.id, vehicle_type:type,
      brand, model, variant:String(getCell(row,"Varian")||"").trim()||null,
      year, license_plate:plate||null, color:String(getCell(row,"Warna")||"").trim()||null,
      mileage, transmission:String(getCell(row,"Transmisi")||"").trim()||null,
      fuel_type:String(getCell(row,"Bahan Bakar")||"").trim()||null,
      engine_capacity:cc, purchase_price:purchase,target_price:target,minimum_price:min,
      purchase_date:dateBought, stock_date_mode:mode, stock_start_date:mode==="manual"?custom:null,
      status, description:String(getCell(row,"Catatan","Keterangan")||"").trim()||null
    });
  }
  return {rows:result, errors};
}
function previewImport(file, ctx) {
  const e=ctx.esc;
  const overlay=document.createElement("div");
  overlay.className="modal-backdrop visible";
  overlay.innerHTML='<section class="modal age-import-modal"><header class="modal-title"><div><h2>Pratinjau impor stok</h2><p>'+e(file.name)+'</p></div><button type="button" class="modal-close" data-age-close>×</button></header><div class="modal-body" data-age-preview><p>Memeriksa data Excel…</p></div><footer class="modal-foot"><button type="button" class="button secondary" data-age-close>Batal</button><button type="button" class="button" data-age-save disabled>Impor data</button></footer></section>';
  document.body.append(overlay);
  overlay.querySelectorAll("[data-age-close]").forEach(b=>b.onclick=()=>overlay.remove());
  overlay.onclick=(ev)=>{if(ev.target===overlay)overlay.remove()};
  file.arrayBuffer().then(buf=>{
    const XLSX=spreadsheetReady();
    const book=XLSX.read(buf,{type:"array",cellDates:true});
    const sheet=book.Sheets[book.SheetNames.includes("Data Stok")?"Data Stok":book.SheetNames[0]];
    if(!sheet) throw new Error("Sheet data tidak ditemukan");
    const imported=importRows(XLSX,sheet,ctx);
    if(imported.rows.length>500) imported.errors.push("Maksimal 500 unit per file. Bagi file menjadi beberapa bagian.");
    const body=overlay.querySelector("[data-age-preview]");
    body.innerHTML='<div class="age-import-summary"><strong>'+imported.rows.length+' unit siap diimpor</strong><span>'+imported.errors.length+' masalah perlu diperbaiki</span></div>'+
      (imported.errors.length?'<div class="age-import-errors" role="alert">'+imported.errors.slice(0,20).map(m=>'<p>'+e(m)+'</p>').join("")+
       (imported.errors.length>20?'<p>Dan '+(imported.errors.length-20)+' kesalahan lainnya.</p>':"")+'</div>':'<p class="sub">Tanggal beli dan tanggal stok disimpan secara terpisah. Pembelian akan tetap tercatat di kas seperti input manual.</p>')+
      '<div class="table-wrap"><table class="data-table"><thead><tr><th>Merek / Model</th><th>Tanggal beli</th><th>Awal stok</th></tr></thead><tbody>'+
      imported.rows.slice(0,8).map(v=>'<tr><td>'+e(v.brand+" "+v.model)+'</td><td>'+e(dateDisplay(v.purchase_date))+'</td><td>'+e(dateDisplay(v.stock_date_mode==="manual"?v.stock_start_date:todayAtShowroom()))+'</td></tr>').join("")+
      '</tbody></table></div>';
    const save=overlay.querySelector("[data-age-save]");
    save.disabled=!imported.rows.length||!!imported.errors.length;
    save.onclick=async()=>{
      save.disabled=true;save.textContent="Mengimpor…";
      try{
        const {error}=await ctx.db.from("vehicles").insert(imported.rows);
        if(error) throw error;
        overlay.remove();
        await ctx.loadData();
        ctx.renderPage();
        ctx.toast(imported.rows.length+" kendaraan berhasil diimpor");
      }catch(error) {
        save.disabled=false;save.textContent="Coba impor lagi";
        ctx.toast(error.message||"Gagal mengimpor Excel","error");
      }
    };
  }).catch(error=>{
    overlay.querySelector("[data-age-preview]").innerHTML='<p class="age-import-errors" role="alert">'+e(error.message||"Excel gagal dibaca")+'</p>';
  });
}

export function bindAgingPage(ctx) {
  if(ctx.state.view!=="aging") return;
  document.querySelectorAll("[data-age-mode]").forEach(b=>b.onclick=()=>{
    agingFilter.mode=b.dataset.ageMode;agingFilter.search="";ctx.renderPage();
  });
  document.querySelector("[data-age-range]")?.addEventListener("change",ev=>{
    agingFilter.range=ev.target.value;ctx.renderPage();
  });
  document.querySelector("[data-age-search]")?.addEventListener("change",ev=>{
    agingFilter.search=ev.target.value;ctx.renderPage();
  });
  document.querySelector("[data-age-template]")?.addEventListener("click",()=>{
    try{downloadWorkbook(spreadsheetReady(),ctx)}catch(error){ctx.toast(error.message,"error")}
  });
  document.querySelector("[data-age-export]")?.addEventListener("click",()=>{
    try{downloadWorkbook(spreadsheetReady(),ctx,filteredStock(ctx))}catch(error){ctx.toast(error.message,"error")}
  });
  document.querySelector("[data-age-upload]")?.addEventListener("click",()=>document.querySelector("[data-age-file]")?.click());
  document.querySelector("[data-age-file]")?.addEventListener("change",ev=>{
    if(ev.target.files?.[0]) previewImport(ev.target.files[0],ctx);
    ev.target.value="";
  });
}
