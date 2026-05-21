import React, { useState, useEffect, useCallback } from "react";
import {
  Home, Grid, Users, CreditCard, Wallet, BarChart2, Settings,
  List, LogOut, Plus, Edit, Trash2, Check, X, AlertTriangle,
  Download, Eye, EyeOff, ChevronLeft, Bell, Search,
  Building, Menu, RefreshCw, CheckCircle, Clock, Shield, FileText, Link2, TrendingUp
} from "lucide-react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref as dbRef, set as dbSet, get as dbGet } from "firebase/database";

// ═══════════════════════════════════════════════
// CONSTANTS & HELPERS
// ═══════════════════════════════════════════════
const SK = { S:"km-settings", R:"km-rooms", T:"km-tenants", P:"km-payments", E:"km-expenses", A:"km-audit", K:"km-kas" };

const DEF = {
  kasOperasional: 10000000,
  feeManager: 10,
  kepemilikan: { ricy: 43.501, arief: 29.150, ferry: 27.352 },
  pins: { admin:"1234", ricy:"1111", arief:"2222", ferry:"3333", staff:"0000" },
  companyInfo: { name:"Kos Meruya", address:"", phone:"", email:"" },
  bankAccounts: [],
};

const DEF_USERS = [
  { id:"admin",  nama:"Ricy Candra",          role:"admin",    password:"1234" },
  { id:"ricy",   nama:"Ricy Candra",           role:"investor", password:"1111" },
  { id:"arief",  nama:"Arief Wahyudi",         role:"investor", password:"2222" },
  { id:"ferry",  nama:"Ferry Lukas",           role:"investor", password:"3333" },
  { id:"staff",  nama:"Karyawan Operasional",  role:"staff",    password:"0000" },
];

const uid  = () => Math.random().toString(36).substr(2,9) + Date.now().toString(36);
const now  = () => new Date().toISOString();
const fRp  = (n) => "Rp " + Math.round(n||0).toLocaleString("id-ID");
const fD   = (d) => d ? new Date(d).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}) : "-";
const tMon = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
const mLbl = (ym) => { if(!ym) return ""; const [y,m]=ym.split("-"); return ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][+m-1]+" "+y; };
const months6 = () => Array.from({length:6},(_,i)=>{ const d=new Date(); d.setMonth(d.getMonth()-i); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; });

// ═══════════════════════════════════════════════
// FIREBASE DATABASE
// ═══════════════════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyDubp1ZVhVNEEsEKldcnnMX4fEewfyGncg",
  authDomain: "kos-meruya.firebaseapp.com",
  databaseURL: "https://kos-meruya-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kos-meruya",
  storageBucket: "kos-meruya.firebasestorage.app",
  messagingSenderId: "428242398218",
  appId: "1:428242398218:web:8a241d14021006b91543f3"
};
const fbApp = initializeApp(firebaseConfig);
const db = getDatabase(fbApp);

const store = {
  get: async (k) => {
    try {
      const snap = await dbGet(dbRef(db, k.replace(/-/g,"_")));
      if (!snap.exists()) return null;
      const v = snap.val();
      return typeof v === "string" ? JSON.parse(v) : v;
    } catch(e) { console.error("DB get:", k, e); return null; }
  },
  set: async (k, v) => {
    try {
      await dbSet(dbRef(db, k.replace(/-/g,"_")), JSON.stringify(v));
      return true;
    } catch(e) { console.error("DB set:", k, e); return false; }
  }
};

const mkRooms = (n=42) => Array.from({length:n},(_,i)=>({
  id:uid(), nomor:String(i+1).padStart(2,"0"),
  lantai:i<12?1:i<24?2:i<36?3:4,
  tipe:"Standard", harga:0, status:"kosong", penyewaId:null
}));

// ═══════════════════════════════════════════════
// UI PRIMITIVES
// ═══════════════════════════════════════════════
const inp = "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition";

function Btn({ v="primary", onClick, children, disabled, full, size="md" }) {
  const vs = {
    primary:"bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-200",
    secondary:"bg-slate-100 hover:bg-slate-200 text-slate-700",
    danger:"bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-200",
    success:"bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-200",
    ghost:"text-slate-600 hover:bg-slate-100",
  };
  const sz = { sm:"px-3 py-1.5 text-xs", md:"px-4 py-2.5 text-sm", lg:"px-6 py-3 text-base" };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${vs[v]} ${sz[size]} ${full?"w-full":""}  rounded-xl font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2`}>
      {children}
    </button>
  );
}

function Modal({ title, onClose, children, size="md" }) {
  const s = { sm:"max-w-sm", md:"max-w-lg", lg:"max-w-2xl", xl:"max-w-4xl" };
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
         onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${s[size]} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <h2 className="font-bold text-slate-800 text-lg">{title}</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition"><X size={18}/></button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

const Card = ({children,className=""}) => <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm ${className}`}>{children}</div>;

function Badge({ status }) {
  const map = {
    lunas:    { cls:"bg-emerald-100 text-emerald-700", label:"Lunas" },
    telat:    { cls:"bg-red-100 text-red-700",         label:"Telat" },
    belum:    { cls:"bg-amber-100 text-amber-700",     label:"Belum Bayar" },
    kosong:   { cls:"bg-slate-100 text-slate-500",     label:"Kosong" },
    maintenance: { cls:"bg-orange-100 text-orange-700", label:"Maintenance" },
    pending:  { cls:"bg-amber-100 text-amber-700",     label:"Menunggu Approval" },
    approved: { cls:"bg-emerald-100 text-emerald-700", label:"Disetujui" },
    rejected: { cls:"bg-red-100 text-red-700",         label:"Ditolak" },
    aktif:    { cls:"bg-emerald-100 text-emerald-700", label:"Aktif" },
    keluar:   { cls:"bg-slate-100 text-slate-500",     label:"Keluar" },
  };
  const b = map[status] || { cls:"bg-slate-100 text-slate-500", label:status };
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${b.cls}`}>{b.label}</span>;
}

// ═══════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════
function LoginScreen({ settings, users, onLogin }) {
  const [uid,  setUid]  = useState("");
  const [pwd,  setPwd]  = useState("");
  const [show, setShow] = useState(false);
  const [err,  setErr]  = useState("");
  const kosName = settings?.companyInfo?.name || "Kos Meruya";

  const doLogin = () => {
    if (!uid||!pwd) return setErr("ID dan password wajib diisi");
    const u = (users||DEF_USERS).find(x=>x.id.toLowerCase()===uid.toLowerCase()&&x.password===pwd);
    if (!u) { setErr("ID atau password salah"); setUid(""); setPwd(""); return; }
    setErr(""); onLogin(u);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="fixed top-0 left-0 w-96 h-96 bg-blue-600/20 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl pointer-events-none"/>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl pointer-events-none"/>
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl w-full max-w-sm p-8 shadow-2xl relative">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30">
            <Building size={36} className="text-white"/>
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">{kosName}</h1>
          <p className="text-blue-200/70 text-sm mt-1">Sistem Manajemen Properti</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-white/60 text-xs font-semibold uppercase tracking-widest block mb-2">ID Pengguna</label>
            <input value={uid} onChange={e=>setUid(e.target.value)} onKeyDown={e=>e.key==="Enter"&&doLogin()}
              placeholder="Masukkan ID pengguna" autoComplete="username"
              className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"/>
          </div>
          <div>
            <label className="text-white/60 text-xs font-semibold uppercase tracking-widest block mb-2">Password</label>
            <div className="relative">
              <input type={show?"text":"password"} value={pwd} onChange={e=>setPwd(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&doLogin()}
                placeholder="Masukkan password" autoComplete="current-password"
                className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 pr-12"/>
              <button onClick={()=>setShow(!show)} className="absolute right-4 top-3.5 text-white/40 hover:text-white/70 transition">
                {show?<EyeOff size={16}/>:<Eye size={16}/>}
              </button>
            </div>
          </div>
          {err&&<p className="text-red-400 text-sm text-center font-medium">{err}</p>}
          <button onClick={doLogin}
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-bold py-3.5 rounded-2xl hover:from-blue-600 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/30 text-sm mt-2">
            Masuk →
          </button>
        </div>
      </div>
    </div>
  );
}


function Layout({ children, page, setPage, role, user, onLogout, expenses, open, setOpen }) {
  const NAV = [
    { id:"dashboard", icon:Home,      label:"Dashboard",       roles:["admin","investor","staff"] },
    { id:"rooms",     icon:Grid,      label:"Kamar",           roles:["admin","investor","staff"] },
    { id:"tenants",   icon:Users,     label:"Penyewa",         roles:["admin","investor","staff"] },
    { id:"payments",  icon:CreditCard,label:"Pembayaran",      roles:["admin","investor","staff"] },
    { id:"expenses",  icon:Wallet,    label:"Kas & Keluar",    roles:["admin","investor","staff"] },
    { id:"invoices",  icon:FileText,  label:"Invoice",         roles:["admin","investor","staff"] },
    { id:"status",     icon:CheckCircle,label:"Status Bayar",     roles:["admin","investor","staff"] },
    { id:"mutasi",    icon:TrendingUp,label:"Mutasi Bank",      roles:["admin","investor"] },
    { id:"status",     icon:CheckCircle,label:"Status Bayar",     roles:["admin","investor","staff"] },
    { id:"reports",   icon:BarChart2, label:"Laporan",         roles:["admin","investor"] },
    { id:"settings",  icon:Settings,  label:"Pengaturan",      roles:["admin"] },
    { id:"audit",     icon:List,      label:"Log Aktivitas",   roles:["admin","investor"] },
  ].filter(n => n.roles.includes(role));

  const pending = expenses.filter(e=>e.status==="pending").length;
  const uLabel = { admin:"Admin 👑", ricy:"Investor Ricy", arief:"Investor Arief", ferry:"Investor Ferry", staff:"Staff Operasional" }[user]||user;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className={`${open?"w-60":"w-16"} bg-slate-900 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out`}>
        <div className="flex items-center justify-between px-4 py-5 border-b border-slate-700/50">
          {open && (
            <div>
              <p className="text-white font-black text-sm tracking-tight">Kos Meruya</p>
              <p className="text-slate-400 text-xs">Manajemen Properti</p>
            </div>
          )}
          <button onClick={()=>setOpen(!open)} className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition ml-auto">
            {open ? <ChevronLeft size={18}/> : <Menu size={18}/>}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV.map(n => {
            const Icon = n.icon;
            const active = page === n.id;
            return (
              <button key={n.id} onClick={()=>setPage(n.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30" : "text-slate-400 hover:bg-slate-800 hover:text-white"}`}>
                <div className="relative flex-shrink-0">
                  <Icon size={18}/>
                  {n.id==="expenses" && pending>0 &&
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">{pending}</span>}
                </div>
                {open && <span>{n.label}</span>}
              </button>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-700/50">
          {open && <p className="text-slate-500 text-xs px-3 pb-2 truncate">{uLabel}</p>}
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition text-sm font-medium">
            <LogOut size={18}/>
            {open && "Keluar"}
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════
function Dashboard({ role, user, rooms, tenants, payments, expenses, settings, setPage }) {
  const cm = tMon();
  const terisi   = rooms.filter(r=>r.status==="terisi").length;
  const kosong   = rooms.filter(r=>r.status==="kosong").length;
  const income   = payments.filter(p=>p.periode===cm).reduce((s,p)=>s+p.nominal,0);
  const spend    = expenses.filter(e=>e.periode===cm&&e.status==="approved").reduce((s,e)=>s+e.nominal,0);
  const pending  = expenses.filter(e=>e.status==="pending");
  const occ      = rooms.length>0 ? Math.round(terisi/rooms.length*100) : 0;

  const bersih   = Math.max(0, income - (settings.kasOperasional||10000000));
  const feeFerry = bersih * ((settings.feeManager||10)/100);
  const dibagi   = bersih - feeFerry;
  const k        = settings.kepemilikan || DEF.kepemilikan;
  const bagian   = { ricy: dibagi*(k.ricy/100), arief: dibagi*(k.arief/100), ferry: dibagi*(k.ferry/100)+feeFerry };

  const today = new Date();
  const telat = tenants.filter(t => {
    if (!t.aktif||!t.jatuhTempo||!t.kamarId) return false;
    const paid = payments.some(p=>p.penyewaId===t.id&&p.periode===cm);
    if (paid) return false;
    const due = new Date(today.getFullYear(), today.getMonth(), t.jatuhTempo);
    return today > due;
  });

  const isInv = role==="admin"||role==="investor";

  const STATS = [
    { label:"Occupancy",    value:`${occ}%`,       sub:`${terisi} terisi · ${kosong} kosong`, color:"blue" },
    { label:"Pendapatan",   value:fRp(income),      sub:mLbl(cm),                              color:"emerald" },
    { label:"Pengeluaran",  value:fRp(spend),       sub:"kas operasional",                      color:"red" },
    { label:"Tunggakan",    value:telat.length,     sub:"kamar terlambat bayar",                color:"amber" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">{mLbl(cm)} · {today.toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(s => (
          <Card key={s.label} className="p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
            <p className={`text-2xl font-black mt-2 text-${s.color}-600`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
          </Card>
        ))}
      </div>

      {isInv && (
        <Card className="p-6">
          <h2 className="font-black text-slate-900 mb-1">Estimasi Bagi Hasil</h2>
          <p className="text-slate-400 text-sm mb-5">{mLbl(cm)}</p>
          <div className="grid grid-cols-3 gap-4 mb-5">
            {[{n:"Ricy Candra",k:"ricy",p:k.ricy},{n:"Arief Wahyudi",k:"arief",p:k.arief},{n:"Ferry Lukas",k:"ferry",p:k.ferry,fee:true}].map(inv=>(
              <div key={inv.k} className={`rounded-2xl p-4 ${user===inv.k||user==="admin"?"bg-blue-50 border-2 border-blue-200":"bg-slate-50"}`}>
                <p className="font-bold text-slate-800 text-sm">{inv.n}</p>
                <p className="text-xs text-slate-400">{inv.p}%{inv.fee?" + fee":""}</p>
                <p className="text-xl font-black text-blue-700 mt-2">{fRp(bagian[inv.k])}</p>
              </div>
            ))}
          </div>
          <div className="bg-slate-50 rounded-xl p-4 text-sm space-y-2">
            {[
              ["Total Pendapatan",                  fRp(income),                      "text-emerald-600"],
              [`Kas Operasional`,                    "– "+fRp(settings.kasOperasional),"text-red-500"],
              [`Fee Pengelola (${settings.feeManager}%)`, "– "+fRp(feeFerry),         "text-red-500"],
            ].map(([l,v,c])=>(
              <div key={l} className="flex justify-between items-center">
                <span className="text-slate-500">{l}</span>
                <span className={`font-bold ${c}`}>{v}</span>
              </div>
            ))}
            <div className="flex justify-between items-center pt-2 border-t border-slate-200">
              <span className="font-bold text-slate-800">Yang Dibagikan</span>
              <span className="font-black text-slate-900 text-base">{fRp(dibagi)}</span>
            </div>
          </div>
        </Card>
      )}

      {isInv && pending.length>0 && (
        <Card className="p-6 border-l-4 border-amber-400">
          <div className="flex items-center gap-2 mb-4">
            <Bell size={20} className="text-amber-500"/>
            <h2 className="font-black text-slate-900">{pending.length} Pengeluaran Butuh Persetujuan</h2>
          </div>
          {pending.slice(0,3).map(e=>(
            <div key={e.id} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
              <div>
                <p className="text-sm font-bold text-slate-800">{e.deskripsi}</p>
                <p className="text-xs text-slate-400">{e.kategori} · {fD(e.tanggal)} · {e.approvals?.length||0}/2 approval</p>
              </div>
              <p className="font-black text-red-600">{fRp(e.nominal)}</p>
            </div>
          ))}
          <button onClick={()=>setPage("expenses")} className="mt-3 text-sm font-bold text-blue-600 hover:underline">Lihat & setujui →</button>
        </Card>
      )}

      {telat.length>0 && (
        <Card className="p-6 border-l-4 border-red-400">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={20} className="text-red-500"/>
            <h2 className="font-black text-slate-900">{telat.length} Penyewa Terlambat Bayar</h2>
          </div>
          {telat.slice(0,5).map(t=>{
            const room=rooms.find(r=>r.id===t.kamarId);
            return (
              <div key={t.id} className="flex justify-between items-center py-3 border-b border-slate-100 last:border-0">
                <div>
                  <p className="text-sm font-bold text-slate-800">{t.nama}</p>
                  <p className="text-xs text-slate-400">Kamar {room?.nomor} · Jatuh tempo tgl {t.jatuhTempo}</p>
                </div>
                <Badge status="telat"/>
              </div>
            );
          })}
        </Card>
      )}

      {/* ── JATUH TEMPO 7 HARI KE DEPAN ── */}
      {(()=>{
        const next7 = tenants.filter(t=>{
          if(!t.aktif||!t.jatuhTempo||!t.kamarId) return false;
          const paid = payments.some(p=>p.penyewaId===t.id&&p.periode===cm);
          if(paid) return false;
          const due = new Date(today.getFullYear(),today.getMonth(),t.jatuhTempo);
          const diff = (due-today)/(1000*60*60*24);
          return diff>=0 && diff<=7;
        });
        if(!next7.length) return null;
        const genWA = (t,room) => {
          const due = new Date(today.getFullYear(),today.getMonth(),t.jatuhTempo);
          return `Halo Kak ${t.nama} 👋

Mengingatkan tagihan sewa Kamar ${room?.nomor} bulan ${["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][today.getMonth()]} ${today.getFullYear()} jatuh tempo *${due.toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})}*.

Mohon segera lakukan pembayaran. Terima kasih 🙏

_Manajemen Kos Meruya_`;
        };
        return (
          <Card className="p-6 border-l-4 border-blue-400">
            <div className="flex items-center gap-2 mb-4">
              <Bell size={20} className="text-blue-500"/>
              <h2 className="font-black text-slate-900">🔔 {next7.length} Penyewa Jatuh Tempo 7 Hari ke Depan</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">Segera tagih sebelum jatuh tempo!</p>
            {next7.map(t=>{
              const room=rooms.find(r=>r.id===t.kamarId);
              const due=new Date(today.getFullYear(),today.getMonth(),t.jatuhTempo);
              const sisa=Math.ceil((due-today)/(1000*60*60*24));
              return (
                <div key={t.id} className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0 gap-4">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{t.nama}</p>
                    <p className="text-xs text-slate-400">Kamar {room?.nomor} · JT tgl {t.jatuhTempo} · <span className="font-bold text-blue-600">{sisa===0?"Hari ini!":sisa+" hari lagi"}</span></p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={()=>{
                      const msg=genWA(t,room);
                      navigator.clipboard.writeText(msg).catch(()=>{});
                      alert("Pesan pengingat tersalin!\n\nPaste ke WhatsApp "+t.nama+" ("+t.hp+")");
                    }} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition">
                      💬 Kirim WA
                    </button>
                    <button onClick={()=>setPage("invoices")} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition">
                      📋 Buat Invoice
                    </button>
                  </div>
                </div>
              );
            })}
          </Card>
        );
      })()}
    </div>
  );
}

// ═══════════════════════════════════════════════
// ROOMS PAGE
// ═══════════════════════════════════════════════
function RoomsPage({ role, rooms, tenants, payments, saveRooms, addAudit }) {
  const [modal,   setModal]  = useState(null);
  const [form,    setForm]   = useState({});
  const [filter,  setFilter] = useState("semua");
  const [lantai,  setLantai] = useState("semua");
  const cm = tMon();
  const lantais = [...new Set(rooms.map(r=>r.lantai))].sort();

  const getRoomStatus = (room) => {
    if (room.status==="kosong") return "kosong";
    if (room.status==="maintenance") return "maintenance";
    const t = tenants.find(t=>t.id===room.penyewaId);
    if (!t) return "kosong";
    if (payments.some(p=>p.penyewaId===t.id&&p.periode===cm)) return "lunas";
    const today=new Date(); const due=new Date(today.getFullYear(),today.getMonth(),t.jatuhTempo||1);
    return today>due ? "telat" : "belum";
  };

  const COLORS = {
    lunas:"border-emerald-400 bg-emerald-50", telat:"border-red-400 bg-red-50",
    belum:"border-amber-300 bg-amber-50", kosong:"border-slate-200 bg-slate-50",
    maintenance:"border-orange-300 bg-orange-50"
  };

  const filtered = rooms.filter(r =>
    (filter==="semua" || r.status===filter) &&
    (lantai==="semua" || r.lantai===+lantai)
  );
  const isAdmin = role==="admin";

  const openAdd = () => { setForm({nomor:"",lantai:1,tipe:"Standard",harga:0,status:"kosong"}); setModal("add"); };
  const openEdit = (r) => { setForm({...r}); setModal(r); };

  const save = async () => {
    if (!form.nomor) return alert("Nomor kamar wajib diisi");
    if (modal==="add") {
      const nr = [...rooms,{...form,id:uid(),penyewaId:null,harga:+form.harga}];
      await saveRooms(nr);
      await addAudit("KAMAR_TAMBAH",`Kamar ${form.nomor} ditambahkan`);
    } else {
      await saveRooms(rooms.map(r=>r.id===modal.id?{...r,...form,harga:+form.harga}:r));
      await addAudit("KAMAR_EDIT",`Kamar ${form.nomor} diedit`);
    }
    setModal(null);
  };

  const del = async (r) => {
    if (r.status==="terisi") return alert("Kamar masih terisi, tidak bisa dihapus");
    if (!confirm(`Hapus kamar ${r.nomor}?`)) return;
    await saveRooms(rooms.filter(x=>x.id!==r.id));
    await addAudit("KAMAR_HAPUS",`Kamar ${r.nomor} dihapus`);
    setModal(null);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Kamar</h1>
          <p className="text-slate-400 text-sm">{rooms.length} kamar total</p>
        </div>
        {isAdmin && <Btn onClick={openAdd}><Plus size={16}/>Tambah Kamar</Btn>}
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {["semua","kosong","terisi","maintenance"].map(f=>(
          <button key={f} onClick={()=>setFilter(f)}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold capitalize transition-all ${filter===f?"bg-blue-600 text-white shadow-sm":"bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {f}
          </button>
        ))}
      </div>

      {/* Lantai filter */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mr-1">Lantai:</span>
        {["semua",...lantais].map(l=>(
          <button key={l} onClick={()=>setLantai(String(l))}
            className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${lantai===String(l)?"bg-indigo-600 text-white shadow-sm":"bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
            {l==="semua"?"Semua":`Lantai ${l}`}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-slate-500">
        {[["bg-emerald-400","Lunas"],["bg-amber-300","Belum Bayar"],["bg-red-400","Telat"],["bg-orange-300","Maintenance"],["bg-slate-200","Kosong"]].map(([c,l])=>(
          <div key={l} className="flex items-center gap-1.5"><div className={`w-3 h-3 rounded ${c}`}/>{l}</div>
        ))}
      </div>

      {/* Summary count */}
      <p className="text-xs text-slate-400 font-medium">
        Menampilkan <span className="font-black text-slate-600">{filtered.length}</span> kamar
        {lantai!=="semua" && ` di Lantai ${lantai}`}
        {filter!=="semua" && ` · status: ${filter}`}
      </p>

      <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-11 gap-2">
        {filtered.map(r => {
          const st = getRoomStatus(r);
          const t = tenants.find(x=>x.id===r.penyewaId);
          return (
            <button key={r.id} onClick={()=>openEdit(r)}
              className={`border-2 rounded-xl p-2 text-center hover:shadow-md transition-all ${COLORS[st]}`}>
              <p className="font-black text-slate-800 text-xs">K{r.nomor}</p>
              <p className="text-[9px] text-slate-400">Lt {r.lantai}</p>
              <p className="text-[9px] font-bold text-slate-600 mt-0.5 truncate">{t?t.nama.split(" ")[0]:"—"}</p>
            </button>
          );
        })}
      </div>

      {modal && (
        <Modal title={modal==="add"?"Tambah Kamar":`Edit Kamar K-${modal.nomor}`} onClose={()=>setModal(null)}>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <label className="text-xs font-black text-blue-700 block mb-1">KODE KAMAR *</label>
              <input className="w-full border-2 border-blue-300 rounded-xl px-3 py-2.5 text-lg font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white tracking-widest"
                placeholder="cth: 101, A-01, B02..."
                value={form.nomor||""} onChange={e=>setForm({...form,nomor:e.target.value})}/>
              <p className="text-xs text-blue-500 mt-1">Kode ini yang tampil di grid kamar</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Lantai</label>
                <select className={inp} value={form.lantai||1} onChange={e=>setForm({...form,lantai:+e.target.value})}>
                  {[1,2,3,4].map(l=><option key={l} value={l}>Lantai {l}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Tipe</label>
                <select className={inp} value={form.tipe||"Standard"} onChange={e=>setForm({...form,tipe:e.target.value})}>
                  {["Standard","AC","Deluxe","VIP"].map(t=><option key={t}>{t}</option>)}</select></div>
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Harga Sewa/Bulan (Rp)</label>
                <input type="number" className={inp} value={form.harga||0} onChange={e=>setForm({...form,harga:e.target.value})}/></div>
            </div>
            <div><label className="text-xs font-bold text-slate-600 block mb-1">Status</label>
              <select className={inp} value={form.status||"kosong"} onChange={e=>setForm({...form,status:e.target.value})}>
                <option value="kosong">Kosong</option>
                <option value="terisi">Terisi</option>
                <option value="maintenance">Maintenance</option>
              </select></div>
            <div className="flex gap-2 justify-end pt-2">
              <Btn v="secondary" onClick={()=>setModal(null)}>Batal</Btn>
              {isAdmin && modal!=="add" && <Btn v="danger" onClick={()=>del(modal)}><Trash2 size={14}/>Hapus</Btn>}
              {isAdmin && <Btn onClick={save}>Simpan</Btn>}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// TENANTS PAGE
// ═══════════════════════════════════════════════
function TenantsPage({ role, rooms, tenants, saveTenants, saveRooms, addAudit }) {
  const [modal,   setModal]  = useState(null);
  const [form,    setForm]   = useState({});
  const [search,  setSearch] = useState("");
  const [coModal, setCoModal]= useState(null);
  const [coForm,  setCoForm] = useState({dikembalikan:0,catatan:""});
  const isEdit = role==="admin"||role==="staff";

  const filtered = tenants.filter(t=>!search||t.nama?.toLowerCase().includes(search.toLowerCase())||t.hp?.includes(search));

  const openAdd = () => {
    setForm({nama:"",hp:"",ktp:"",kontakDarurat:"",kontakDaruratHp:"",kamarId:"",
      tanggalMasuk:new Date().toISOString().split("T")[0],jatuhTempo:1,deposit:0,catatan:""});
    setModal("add");
  };

  const save = async () => {
    if (!form.nama||!form.kamarId) return alert("Nama dan kamar wajib diisi");
    if (modal==="add") {
      const room = rooms.find(r=>r.id===form.kamarId);
      if (room?.status==="terisi") return alert("Kamar sudah terisi!");
      const t = {...form,id:uid(),aktif:true,depositStatus:"disimpan"};
      await saveTenants([...tenants,t]);
      await saveRooms(rooms.map(r=>r.id===form.kamarId?{...r,status:"terisi",penyewaId:t.id}:r));
      await addAudit("PENYEWA_MASUK",`${form.nama} masuk kamar ${room?.nomor}`);
    } else {
      await saveTenants(tenants.map(t=>t.id===modal.id?{...t,...form}:t));
      await addAudit("PENYEWA_EDIT",`Data ${form.nama} diupdate`);
    }
    setModal(null);
  };

  const checkout = async () => {
    const t = coModal;
    const room = rooms.find(r=>r.id===t.kamarId);
    await saveTenants(tenants.map(x=>x.id===t.id?{...x,aktif:false,tanggalKeluar:new Date().toISOString().split("T")[0],depositDikembalikan:coForm.dikembalikan,catatanCO:coForm.catatan}:x));
    await saveRooms(rooms.map(r=>r.id===t.kamarId?{...r,status:"kosong",penyewaId:null}:r));
    await addAudit("PENYEWA_KELUAR",`${t.nama} keluar kamar ${room?.nomor}. Deposit dikembalikan ${fRp(coForm.dikembalikan)}`);
    setCoModal(null);
  };

  const avail = rooms.filter(r=>r.status==="kosong"||(modal&&modal!=="add"&&r.id===modal.kamarId));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black text-slate-900">Penyewa</h1>
          <p className="text-slate-400 text-sm">{tenants.filter(t=>t.aktif).length} aktif · {tenants.filter(t=>!t.aktif).length} alumni</p></div>
        {isEdit && <Btn onClick={openAdd}><Plus size={16}/>Tambah Penyewa</Btn>}
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-4 top-3 text-slate-400"/>
        <input className={inp+" pl-10"} placeholder="Cari nama atau HP..." value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              {["Kamar","Nama","HP","Masuk","JT","Deposit","Status",""].map(h=>(
                <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={8} className="text-center py-10 text-slate-400 text-sm">Belum ada data penyewa</td></tr>}
              {filtered.map(t=>{
                const room=rooms.find(r=>r.id===t.kamarId);
                return (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-black text-blue-600">K-{room?.nomor||"—"}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">{t.nama}</td>
                    <td className="px-5 py-3.5 text-slate-500">{t.hp||"—"}</td>
                    <td className="px-5 py-3.5 text-slate-500">{fD(t.tanggalMasuk)}</td>
                    <td className="px-5 py-3.5 text-slate-500">Tgl {t.jatuhTempo}</td>
                    <td className="px-5 py-3.5 text-slate-500">{fRp(t.deposit)}</td>
                    <td className="px-5 py-3.5"><Badge status={t.aktif?"aktif":"keluar"}/></td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5">
                        <button onClick={()=>{setForm({...t});setModal(t);}} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-700 transition"><Edit size={14}/></button>
                        {isEdit&&t.aktif&&<button onClick={()=>{setCoModal(t);setCoForm({dikembalikan:t.deposit,catatan:""}); }}
                          className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition">Checkout</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {modal && (
        <Modal title={modal==="add"?"Tambah Penyewa":"Edit Data Penyewa"} onClose={()=>setModal(null)} size="lg">
          <div className="grid grid-cols-2 gap-4">
            {[{l:"Nama Lengkap *",k:"nama",f:true},{l:"No HP/WA *",k:"hp"},{l:"No KTP",k:"ktp"},{l:"Kontak Darurat",k:"kontakDarurat"},{l:"HP Darurat",k:"kontakDaruratHp"}].map(f=>(
              <div key={f.k} className={f.f?"col-span-2":""}>
                <label className="text-xs font-bold text-slate-600 block mb-1">{f.l}</label>
                <input className={inp} value={form[f.k]||""} onChange={e=>setForm({...form,[f.k]:e.target.value})}/>
              </div>
            ))}
            <div><label className="text-xs font-bold text-slate-600 block mb-1">Kamar *</label>
              <select className={inp} value={form.kamarId||""} onChange={e=>setForm({...form,kamarId:e.target.value})}>
                <option value="">— Pilih Kamar —</option>
                {avail.map(r=><option key={r.id} value={r.id}>K-{r.nomor} (Lt {r.lantai}) · {fRp(r.harga)}/bln</option>)}
              </select></div>
            <div><label className="text-xs font-bold text-slate-600 block mb-1">Tanggal Masuk</label>
              <input type="date" className={inp} value={form.tanggalMasuk||""} onChange={e=>setForm({...form,tanggalMasuk:e.target.value})}/></div>
            <div><label className="text-xs font-bold text-slate-600 block mb-1">Jatuh Tempo (tgl per bulan)</label>
              <input type="number" min={1} max={28} className={inp} value={form.jatuhTempo||1} onChange={e=>setForm({...form,jatuhTempo:+e.target.value})}/></div>
            <div><label className="text-xs font-bold text-slate-600 block mb-1">Deposit (Rp)</label>
              <input type="number" className={inp} value={form.deposit||0} onChange={e=>setForm({...form,deposit:+e.target.value})}/></div>
            <div className="col-span-2"><label className="text-xs font-bold text-slate-600 block mb-1">Catatan</label>
              <textarea className={inp} rows={2} value={form.catatan||""} onChange={e=>setForm({...form,catatan:e.target.value})}/></div>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Btn v="secondary" onClick={()=>setModal(null)}>Batal</Btn>
            {isEdit&&<Btn onClick={save}>Simpan</Btn>}
          </div>
        </Modal>
      )}

      {coModal && (
        <Modal title={`Checkout – ${coModal.nama}`} onClose={()=>setCoModal(null)}>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4 text-sm space-y-1">
              <p><span className="font-bold">Kamar:</span> {rooms.find(r=>r.id===coModal.kamarId)?.nomor}</p>
              <p><span className="font-bold">Deposit tersimpan:</span> {fRp(coModal.deposit)}</p>
            </div>
            <div><label className="text-xs font-bold text-slate-600 block mb-1">Deposit Dikembalikan (Rp)</label>
              <input type="number" className={inp} value={coForm.dikembalikan} onChange={e=>setCoForm({...coForm,dikembalikan:+e.target.value})}/>
              {coModal.deposit-coForm.dikembalikan>0&&<p className="text-xs text-amber-600 mt-1">Potongan: {fRp(coModal.deposit-coForm.dikembalikan)}</p>}
            </div>
            <div><label className="text-xs font-bold text-slate-600 block mb-1">Catatan Checkout</label>
              <textarea className={inp} rows={2} value={coForm.catatan} onChange={e=>setCoForm({...coForm,catatan:e.target.value})} placeholder="Alasan potongan, kondisi kamar, dll"/></div>
            <div className="flex gap-2 justify-end">
              <Btn v="secondary" onClick={()=>setCoModal(null)}>Batal</Btn>
              <Btn v="danger" onClick={checkout}>Konfirmasi Checkout</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// PAYMENTS PAGE
// ═══════════════════════════════════════════════
function PaymentsPage({ role, user, rooms, tenants, payments, savePayments, addAudit }) {
  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState({});
  const [fMonth, setFMonth] = useState(tMon());
  const isEdit = role==="admin"||role==="staff";
  const ms = months6();

  const filtered = payments.filter(p=>p.periode===fMonth).sort((a,b)=>new Date(b.tanggal)-new Date(a.tanggal));
  const total = filtered.reduce((s,p)=>s+p.nominal,0);

  const openAdd = () => {
    setForm({kamarId:"",penyewaId:"",periode:tMon(),nominal:0,metode:"transfer",bank:"",pengirim:"",referensi:"",tanggal:new Date().toISOString().split("T")[0],catatan:""});
    setModal(true);
  };

  const selRoom = (kamarId) => {
    const room   = rooms.find(r=>r.id===kamarId);
    const tenant = tenants.find(t=>t.id===room?.penyewaId);
    setForm(f=>({...f,kamarId,penyewaId:tenant?.id||"",nominal:room?.harga||0}));
  };

  const save = async () => {
    if (!form.kamarId||!form.nominal||!form.periode) return alert("Kamar, nominal, dan periode wajib diisi");
    const np = [...payments,{...form,id:uid(),nominal:+form.nominal,inputBy:user,inputAt:now()}];
    await savePayments(np);
    const room=rooms.find(r=>r.id===form.kamarId); const t=tenants.find(t=>t.id===form.penyewaId);
    await addAudit("BAYAR",`${t?.nama||"?"} (K-${room?.nomor}) bayar ${fRp(form.nominal)} – ${mLbl(form.periode)}`);
    setModal(false);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black text-slate-900">Pembayaran Sewa</h1>
          <p className="text-slate-400 text-sm">{filtered.length} transaksi · {fRp(total)}</p></div>
        {isEdit&&<Btn onClick={openAdd}><Plus size={16}/>Input Pembayaran</Btn>}
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-bold text-slate-600">Periode:</label>
        <select value={fMonth} onChange={e=>setFMonth(e.target.value)} className={inp+" w-44"}>
          {ms.map(m=><option key={m} value={m}>{mLbl(m)}</option>)}
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              {["Kamar","Penyewa","Periode","Nominal","Metode","Bank / Pengirim","Tgl Bayar","Input"].map(h=>(
                <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={8} className="text-center py-10 text-slate-400 text-sm">Belum ada pembayaran {mLbl(fMonth)}</td></tr>}
              {filtered.map(p=>{
                const room=rooms.find(r=>r.id===p.kamarId); const t=tenants.find(t=>t.id===p.penyewaId);
                return (
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-black text-blue-600">K-{room?.nomor||"—"}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">{t?.nama||"—"}</td>
                    <td className="px-5 py-3.5 text-slate-500">{mLbl(p.periode)}</td>
                    <td className="px-5 py-3.5 font-black text-emerald-600">{fRp(p.nominal)}</td>
                    <td className="px-5 py-3.5 text-slate-500 capitalize">{p.metode}</td>
                    <td className="px-5 py-3.5 text-slate-500">{[p.bank,p.pengirim].filter(Boolean).join(" · ")||"—"}</td>
                    <td className="px-5 py-3.5 text-slate-500">{fD(p.tanggal)}</td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{p.inputBy}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {modal && (
        <Modal title="Input Pembayaran Sewa" onClose={()=>setModal(false)}>
          <div className="space-y-4">
            <div><label className="text-xs font-bold text-slate-600 block mb-1">Kamar *</label>
              <select className={inp} value={form.kamarId} onChange={e=>selRoom(e.target.value)}>
                <option value="">— Pilih Kamar —</option>
                {rooms.filter(r=>r.status==="terisi").map(r=>{
                  const t=tenants.find(x=>x.id===r.penyewaId);
                  return <option key={r.id} value={r.id}>K-{r.nomor} – {t?.nama||"?"}</option>;
                })}
              </select></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Periode *</label>
                <select className={inp} value={form.periode} onChange={e=>setForm({...form,periode:e.target.value})}>
                  {ms.map(m=><option key={m} value={m}>{mLbl(m)}</option>)}</select></div>
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Nominal (Rp) *</label>
                <input type="number" className={inp} value={form.nominal||0} onChange={e=>setForm({...form,nominal:e.target.value})}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Metode</label>
                <select className={inp} value={form.metode} onChange={e=>setForm({...form,metode:e.target.value})}>
                  <option value="transfer">Transfer Bank</option><option value="tunai">Tunai</option></select></div>
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Bank</label>
                <input className={inp} placeholder="BCA, BRI, Mandiri..." value={form.bank||""} onChange={e=>setForm({...form,bank:e.target.value})}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Nama Pengirim</label>
                <input className={inp} value={form.pengirim||""} onChange={e=>setForm({...form,pengirim:e.target.value})}/></div>
              <div><label className="text-xs font-bold text-slate-600 block mb-1">No. Referensi</label>
                <input className={inp} value={form.referensi||""} onChange={e=>setForm({...form,referensi:e.target.value})}/></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Tanggal Bayar</label>
                <input type="date" className={inp} value={form.tanggal||""} onChange={e=>setForm({...form,tanggal:e.target.value})}/></div>
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Catatan</label>
                <input className={inp} value={form.catatan||""} onChange={e=>setForm({...form,catatan:e.target.value})}/></div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Btn v="secondary" onClick={()=>setModal(false)}>Batal</Btn>
              <Btn onClick={save}>Simpan Pembayaran</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// EXPENSES PAGE
// ═══════════════════════════════════════════════
function ExpensesPage({ role, user, expenses, saveExpenses, addAudit }) {
  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState({});
  const [fMonth, setFMonth] = useState(tMon());
  const isEdit = role==="admin"||role==="staff";
  const isInv  = role==="admin"||role==="investor";
  const ms = months6();

  const filtered = expenses.filter(e=>e.periode===fMonth).sort((a,b)=>new Date(b.tanggal)-new Date(a.tanggal));
  const totApproved = filtered.filter(e=>e.status==="approved").reduce((s,e)=>s+e.nominal,0);
  const totPending  = filtered.filter(e=>e.status==="pending").reduce((s,e)=>s+e.nominal,0);

  const openAdd = () => {
    setForm({kategori:"Listrik",nominal:0,deskripsi:"",tanggal:new Date().toISOString().split("T")[0],periode:tMon(),sumber:"kas"});
    setModal(true);
  };

  const save = async () => {
    if (!form.deskripsi||!form.nominal) return alert("Deskripsi dan nominal wajib diisi");
    const need = +form.nominal > 5000000;
    const ne = [...expenses,{...form,id:uid(),nominal:+form.nominal,status:need?"pending":"approved",approvals:[],inputBy:user,inputAt:now()}];
    await saveExpenses(ne);
    await addAudit("PENGELUARAN",`${form.kategori}: ${form.deskripsi} – ${fRp(form.nominal)} [${need?"PENDING":"AUTO-APPROVED"}]`);
    setModal(false);
  };

  const approve = async (e) => {
    if (e.approvals?.some(a=>a.by===user)) return alert("Anda sudah menyetujui pengeluaran ini");
    const newApp = [...(e.approvals||[]),{by:user,at:now()}];
    const done   = newApp.length>=2;
    await saveExpenses(expenses.map(x=>x.id===e.id?{...x,approvals:newApp,status:done?"approved":"pending"}:x));
    await addAudit("APPROVE",`${user} setuju: ${e.deskripsi} ${fRp(e.nominal)}${done?" — FINAL APPROVED":" (1/2)"}`);
  };

  const reject = async (e) => {
    if (!confirm("Tolak pengeluaran ini?")) return;
    await saveExpenses(expenses.map(x=>x.id===e.id?{...x,status:"rejected"}:x));
    await addAudit("TOLAK",`${user} tolak: ${e.deskripsi} ${fRp(e.nominal)}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black text-slate-900">Kas & Pengeluaran</h1>
          <p className="text-slate-400 text-sm">Disetujui: {fRp(totApproved)} · Pending: {fRp(totPending)}</p></div>
        {isEdit&&<Btn onClick={openAdd}><Plus size={16}/>Input Pengeluaran</Btn>}
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-bold text-slate-600">Periode:</label>
        <select value={fMonth} onChange={e=>setFMonth(e.target.value)} className={inp+" w-44"}>
          {ms.map(m=><option key={m} value={m}>{mLbl(m)}</option>)}
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              {["Tgl","Kategori","Deskripsi","Dari","Nominal","Status","Approval",""].map(h=>(
                <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={7} className="text-center py-10 text-slate-400 text-sm">Belum ada pengeluaran {mLbl(fMonth)}</td></tr>}
              {filtered.map(e=>{
                const alreadyApp = e.approvals?.some(a=>a.by===user);
                return (
                  <tr key={e.id} className={`border-b border-slate-50 hover:bg-slate-50/80 transition ${e.status==="pending"?"bg-amber-50/40":""}`}>
                    <td className="px-5 py-3.5 text-slate-500">{fD(e.tanggal)}</td>
                    <td className="px-5 py-3.5"><span className="text-xs font-bold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{e.kategori}</span></td>
                    <td className="px-5 py-3.5 font-medium text-slate-800">{e.deskripsi}</td>
                    <td className="px-5 py-3.5 font-black text-red-600">{fRp(e.nominal)}</td>
                    <td className="px-5 py-3.5"><Badge status={e.status}/></td>
                    <td className="px-5 py-3.5 text-xs text-slate-400">
                      {e.nominal>5000000&&<span>{e.approvals?.length||0}/2 {e.approvals?.map(a=><span key={a.by} className="ml-1 font-bold text-emerald-600">{a.by}✓</span>)}</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {e.status==="pending"&&isInv&&(
                        <div className="flex gap-1.5">
                          {!alreadyApp&&<button onClick={()=>approve(e)} className="px-2.5 py-1 text-xs font-bold bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition flex items-center gap-1"><Check size={12}/>Setuju</button>}
                          <button onClick={()=>reject(e)} className="px-2.5 py-1 text-xs font-bold bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition flex items-center gap-1"><X size={12}/>Tolak</button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {modal && (
        <Modal title="Input Pengeluaran" onClose={()=>setModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Kategori</label>
                <select className={inp} value={form.kategori} onChange={e=>setForm({...form,kategori:e.target.value})}>
                  {["Listrik","Air","Kebersihan","Keamanan","Pemeliharaan","Iuran RT/RW","Lain-lain"].map(c=><option key={c}>{c}</option>)}</select></div>
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Periode</label>
                <select className={inp} value={form.periode} onChange={e=>setForm({...form,periode:e.target.value})}>
                  {ms.map(m=><option key={m} value={m}>{mLbl(m)}</option>)}</select></div>
            </div>
            <div><label className="text-xs font-bold text-slate-600 block mb-1">Deskripsi *</label>
              <input className={inp} value={form.deskripsi||""} onChange={e=>setForm({...form,deskripsi:e.target.value})} placeholder="Tagihan PLN bulan Mei..."/></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Nominal (Rp) *</label>
                <input type="number" className={inp} value={form.nominal||0} onChange={e=>setForm({...form,nominal:e.target.value})}/>
                {+form.nominal>5000000&&<p className="text-xs text-amber-600 mt-1.5 font-semibold">⚠ &gt; Rp 5 juta — butuh 2 approval investor</p>}
              </div>
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Tanggal</label>
                <input type="date" className={inp} value={form.tanggal||""} onChange={e=>setForm({...form,tanggal:e.target.value})}/></div>
            </div>
            <div><label className="text-xs font-bold text-slate-600 block mb-1">💰 Bayar dari</label>
              <select className={inp} value={form.sumber||"kas"} onChange={e=>setForm({...form,sumber:e.target.value})}>
                <option value="kas">💵 Kas (uang tunai operasional)</option>
                <option value="bank">🏦 Bank (transfer dari rekening)</option>
              </select></div>
            <div className="flex gap-2 justify-end pt-2">
              <Btn v="secondary" onClick={()=>setModal(false)}>Batal</Btn>
              <Btn onClick={save}>Simpan</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// REPORTS PAGE
// ═══════════════════════════════════════════════
function ReportsPage({ rooms, tenants, payments, expenses, settings, audit }) {
  const [month, setMonth] = useState(tMon());
  const ms = months6().concat(Array.from({length:6},(_,i)=>{ const d=new Date(); d.setMonth(d.getMonth()-6-i); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; }));

  const mPay  = payments.filter(p=>p.periode===month);
  const mExp  = expenses.filter(e=>e.periode===month&&e.status==="approved");
  const totIn = mPay.reduce((s,p)=>s+p.nominal,0);
  const totEx = mExp.reduce((s,e)=>s+e.nominal,0);
  const occ   = rooms.length>0?Math.round(rooms.filter(r=>r.status==="terisi").length/rooms.length*100):0;

  const kas   = settings.kasOperasional||10000000;
  const fee   = settings.feeManager||10;
  const k     = settings.kepemilikan||DEF.kepemilikan;
  const bersih= Math.max(0,totIn-kas);
  const fFerry= bersih*(fee/100);
  const dibagi= bersih-fFerry;
  const bagian= { ricy:dibagi*(k.ricy/100), arief:dibagi*(k.arief/100), ferry:dibagi*(k.ferry/100)+fFerry };

  const byKat = mExp.reduce((a,e)=>{a[e.kategori]=(a[e.kategori]||0)+e.nominal;return a;},{});

  const doPrint = () => {
    const w = window.open("","_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>Laporan Kos Meruya – ${mLbl(month)}</title>
    <style>body{font-family:sans-serif;max-width:800px;margin:30px auto;color:#1e293b}h1{color:#1d4ed8;margin-bottom:4px}h2{margin-top:24px;margin-bottom:8px;border-bottom:2px solid #e2e8f0;padding-bottom:6px}table{width:100%;border-collapse:collapse;margin-bottom:16px}th,td{text-align:left;padding:8px 12px;border:1px solid #e2e8f0}th{background:#f8fafc;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.05em}tr:nth-child(even){background:#f8fafc}.right{text-align:right}.green{color:#059669;font-weight:700}.red{color:#dc2626;font-weight:700}.big{font-size:20px;font-weight:900}</style>
    </head><body>
    <h1>🏠 Kos Meruya — Laporan Keuangan</h1><p style="color:#64748b">Periode: <strong>${mLbl(month)}</strong> · Dibuat: ${new Date().toLocaleDateString("id-ID")} · Occupancy: ${occ}%</p>
    <h2>Ringkasan Keuangan</h2>
    <table><tr><th>Item</th><th class="right">Nilai</th></tr>
    <tr><td>Total Pendapatan Sewa</td><td class="right green">${fRp(totIn)}</td></tr>
    <tr><td>Kas Operasional Disisihkan</td><td class="right red">– ${fRp(kas)}</td></tr>
    <tr><td>Fee Pengelola (${fee}%)</td><td class="right red">– ${fRp(fFerry)}</td></tr>
    <tr><td><strong>Total Dibagikan ke Investor</strong></td><td class="right big">${fRp(dibagi)}</td></tr></table>
    <h2>Bagi Hasil Investor</h2>
    <table><tr><th>Investor</th><th>Kepemilikan</th><th class="right">Jumlah</th></tr>
    <tr><td>Ricy Candra</td><td>${k.ricy}%</td><td class="right">${fRp(bagian.ricy)}</td></tr>
    <tr><td>Arief Wahyudi</td><td>${k.arief}%</td><td class="right">${fRp(bagian.arief)}</td></tr>
    <tr><td>Ferry Lukas</td><td>${k.ferry}% + fee pengelola</td><td class="right">${fRp(bagian.ferry)}</td></tr></table>
    <h2>Detail Pembayaran Sewa (${mPay.length} transaksi)</h2>
    <table><tr><th>Kamar</th><th>Penyewa</th><th>Tgl Bayar</th><th>Metode</th><th class="right">Nominal</th></tr>
    ${mPay.map(p=>{const r=rooms.find(x=>x.id===p.kamarId);const t=tenants.find(x=>x.id===p.penyewaId);return`<tr><td>K-${r?.nomor||"—"}</td><td>${t?.nama||"—"}</td><td>${fD(p.tanggal)}</td><td>${p.metode}</td><td class="right green">${fRp(p.nominal)}</td></tr>`;}).join("")}
    <tr><td colspan="4"><strong>Total</strong></td><td class="right green big">${fRp(totIn)}</td></tr></table>
    <h2>Detail Pengeluaran (${mExp.length} transaksi)</h2>
    <table><tr><th>Tgl</th><th>Kategori</th><th>Deskripsi</th><th class="right">Nominal</th></tr>
    ${mExp.map(e=>`<tr><td>${fD(e.tanggal)}</td><td>${e.kategori}</td><td>${e.deskripsi}</td><td class="right red">${fRp(e.nominal)}</td></tr>`).join("")}
    <tr><td colspan="3"><strong>Total</strong></td><td class="right red big">${fRp(totEx)}</td></tr></table>
    <p style="margin-top:40px;color:#94a3b8;font-size:12px">Dokumen ini digenerate otomatis oleh Sistem Manajemen Kos Meruya · ${new Date().toLocaleString("id-ID")}</p>
    </body></html>`);
    w.document.close(); w.print();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-black text-slate-900">Laporan Keuangan</h1>
          <p className="text-slate-400 text-sm">{mLbl(month)}</p></div>
        <Btn v="secondary" onClick={doPrint}><Download size={16}/>Export / Cetak PDF</Btn>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-bold text-slate-600">Periode Laporan:</label>
        <select value={month} onChange={e=>setMonth(e.target.value)} className={inp+" w-44"}>
          {ms.slice(0,12).map(m=><option key={m} value={m}>{mLbl(m)}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {l:"Pendapatan",v:fRp(totIn),c:"emerald",s:`${mPay.length} pembayaran`},
          {l:"Pengeluaran",v:fRp(totEx),c:"red",s:`${mExp.length} transaksi`},
          {l:"Occupancy",v:`${occ}%`,c:"blue",s:`${rooms.filter(r=>r.status==="terisi").length}/${rooms.length} kamar`},
          {l:"Total Dibagi",v:fRp(dibagi),c:"purple",s:"setelah potongan"},
        ].map(s=>(
          <Card key={s.l} className="p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.l}</p>
            <p className={`text-2xl font-black mt-2 text-${s.c}-600`}>{s.v}</p>
            <p className="text-xs text-slate-400 mt-1">{s.s}</p>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        <h2 className="font-black text-slate-900 mb-5">Kalkulasi Bagi Hasil</h2>
        <div className="space-y-3 mb-6">
          {[
            ["Total Pendapatan Sewa",        "+"+fRp(totIn),       "text-emerald-600"],
            [`Kas Operasional Disisihkan`,    "–"+fRp(kas),         "text-red-500"],
            [`Fee Pengelola Ferry (${fee}%)`, "–"+fRp(fFerry),      "text-red-500"],
          ].map(([l,v,c])=>(
            <div key={l} className="flex justify-between py-2.5 border-b border-slate-50">
              <span className="text-sm text-slate-500">{l}</span>
              <span className={`font-black ${c}`}>{v}</span>
            </div>
          ))}
          <div className="flex justify-between pt-1">
            <span className="font-black text-slate-800">Total Dibagikan ke Investor</span>
            <span className="font-black text-lg text-slate-900">{fRp(dibagi)}</span>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[{n:"Ricy Candra",key:"ricy",p:k.ricy},{n:"Arief Wahyudi",key:"arief",p:k.arief},{n:"Ferry Lukas",key:"ferry",p:k.ferry,fee:true}].map(inv=>(
            <div key={inv.key} className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 text-center border border-blue-100">
              <p className="font-black text-slate-800">{inv.n}</p>
              <p className="text-xs text-slate-400 mt-0.5">{inv.p}%{inv.fee?<><br/><span className="text-blue-500">+ fee {fRp(fFerry)}</span></>:""}</p>
              <p className="text-2xl font-black text-blue-700 mt-3">{fRp(bagian[inv.key])}</p>
            </div>
          ))}
        </div>
      </Card>

      {Object.keys(byKat).length>0&&(
        <Card className="p-6">
          <h2 className="font-black text-slate-900 mb-4">Pengeluaran per Kategori</h2>
          <div className="space-y-3">
            {Object.entries(byKat).sort((a,b)=>b[1]-a[1]).map(([kat,val])=>(
              <div key={kat} className="flex items-center gap-4">
                <span className="text-sm text-slate-600 w-32 flex-shrink-0">{kat}</span>
                <div className="flex-1 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-red-400 h-2.5 rounded-full transition-all" style={{width:`${totEx>0?Math.round(val/totEx*100):0}%`}}/>
                </div>
                <span className="text-sm font-black text-slate-700 w-36 text-right">{fRp(val)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
      {/* Invoice activity log */}
      {(() => {
        const invLogs = (audit||[]).filter(a=>a.action==="INVOICE"||a.action==="INV_LUNAS").slice(0,20);
        if (!invLogs.length) return null;
        return (
          <Card>
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-black text-slate-900">Log Aktivitas Invoice</h2>
              <p className="text-xs text-slate-400 mt-0.5">Siapa buat, siapa lunasin — tercatat semua</p>
            </div>
            <div className="divide-y divide-slate-50">
              {invLogs.map(a=>(
                <div key={a.id} className="flex items-start gap-3 px-6 py-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 mt-0.5 ${a.action==="INV_LUNAS"?"bg-emerald-100 text-emerald-700":"bg-blue-100 text-blue-700"}`}>
                    {a.action==="INV_LUNAS"?"✓ LUNAS":"DIBUAT"}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-800">{a.detail}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      <span className="font-bold">{a.by}</span> · {fD(a.at)} {new Date(a.at).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        );
      })()}
    </div>
  );
}
// ═══════════════════════════════════════════════
function SettingsPage({ settings, saveSettings, addAudit, user, onReset, rooms, saveRooms, users, saveUsers }) {
  const [form, setForm]    = useState({...settings, kepemilikan:{...settings.kepemilikan}});
  const [pins, setPins]    = useState({...settings.pins});
  const [saved, setSaved]  = useState(false);

  // Floor config: { lantai: { prefix, count } }
  const initFloorCfg = () => {
    const cfg = {};
    rooms.forEach(r => {
      if (!cfg[r.lantai]) cfg[r.lantai] = { count: 0, prefix: `${r.lantai}-` };
      cfg[r.lantai].count++;
    });
    // detect prefix from existing room names
    Object.keys(cfg).forEach(lt => {
      const sample = rooms.find(r=>r.lantai===+lt);
      if (sample) {
        const m = sample.nomor.match(/^([A-Za-z0-9]*[^0-9])(\d+)$/);
        cfg[lt].prefix = m ? m[1] : `${lt}-`;
      }
    });
    return cfg;
  };
  const [floorCfg, setFloorCfg] = useState(initFloorCfg);
  const [newLantai, setNewLantai] = useState("");

  const total = (+form.kepemilikan?.ricy||0)+(+form.kepemilikan?.arief||0)+(+form.kepemilikan?.ferry||0);
  const valid = Math.abs(total-100)<0.01;

  const applyFloorConfig = async () => {
    let updated = [...rooms];
    const msgs = [];

    for (const [lt, cfg] of Object.entries(floorCfg)) {
      const lantai = +lt;
      const target = +cfg.count || 0;
      const prefix = cfg.prefix || `${lt}-`;
      const floorRooms = updated.filter(r => r.lantai === lantai);
      const diff = target - floorRooms.length;

      if (diff > 0) {
        // Add new rooms
        const usedNomors = new Set(updated.map(r => r.nomor));
        let seq = floorRooms.length + 1;
        for (let i = 0; i < diff; i++) {
          let nomor = `${prefix}${String(seq).padStart(2,"0")}`;
          while (usedNomors.has(nomor)) { seq++; nomor = `${prefix}${String(seq).padStart(2,"0")}`; }
          usedNomors.add(nomor);
          updated.push({ id:uid(), nomor, lantai, tipe:"Standard", harga:0, status:"kosong", penyewaId:null });
          seq++;
        }
        msgs.push(`Lantai ${lantai}: +${diff} kamar baru`);
      } else if (diff < 0) {
        // Remove empty rooms only
        const toRemove = Math.abs(diff);
        const empty = floorRooms.filter(r => r.status==="kosong").slice(-toRemove);
        if (empty.length < toRemove) msgs.push(`Lantai ${lantai}: ${toRemove-empty.length} kamar terisi, tidak bisa dihapus. Hanya ${empty.length} kamar kosong yang dihapus.`);
        else msgs.push(`Lantai ${lantai}: −${empty.length} kamar dihapus`);
        const removeIds = new Set(empty.map(r=>r.id));
        updated = updated.filter(r => !removeIds.has(r.id));
      } else {
        // Update prefix only — rename rooms that still follow old auto-pattern
        const toRename = floorRooms.filter(r => r.status==="kosong");
        const usedNomors = new Set(updated.filter(r=>!toRename.includes(r)).map(r=>r.nomor));
        let seq = 1;
        toRename.forEach(r => {
          let nomor = `${prefix}${String(seq).padStart(2,"0")}`;
          while (usedNomors.has(nomor)) { seq++; nomor = `${prefix}${String(seq).padStart(2,"0")}`; }
          usedNomors.add(nomor); seq++;
          updated = updated.map(x => x.id===r.id ? {...x, nomor} : x);
        });
      }
    }

    await saveRooms(updated);
    await addAudit("FLOOR_CONFIG", `Konfigurasi lantai diterapkan: ${msgs.join(" | ")}`);
    alert("✓ Konfigurasi diterapkan!\n\n" + msgs.join("\n"));
  };

  const addFloor = () => {
    if (!newLantai || floorCfg[newLantai]) return;
    setFloorCfg({...floorCfg, [newLantai]: { count:0, prefix:`${newLantai}-` }});
    setNewLantai("");
  };

  const removeFloor = (lt) => {
    const occupied = rooms.filter(r=>r.lantai===+lt&&r.status==="terisi").length;
    if (occupied>0) return alert(`Lantai ${lt} masih ada ${occupied} kamar terisi!`);
    if (!confirm(`Hapus konfigurasi Lantai ${lt}? Semua kamar kosong di lantai ini akan dihapus.`)) return;
    const {[lt]:_, ...rest} = floorCfg;
    setFloorCfg(rest);
    saveRooms(rooms.filter(r=>r.lantai!==+lt));
  };

  const totalRoomsConfig = Object.values(floorCfg).reduce((s,c)=>s+(+c.count||0),0);

  const doSave = async () => {
    if (!valid) return alert(`Total kepemilikan harus 100%. Sekarang: ${total.toFixed(3)}%`);
    const ns = {
      ...form,
      kepemilikan:{ricy:+form.kepemilikan.ricy,arief:+form.kepemilikan.arief,ferry:+form.kepemilikan.ferry},
      pins,
      companyInfo: form.companyInfo||DEF.companyInfo,
      bankAccounts: form.bankAccounts||[],
    };
    await saveSettings(ns);
    await addAudit("SETTINGS",`${user} mengupdate pengaturan sistem`);
    setSaved(true); setTimeout(()=>setSaved(false),3000);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div><h1 className="text-2xl font-black text-slate-900">Pengaturan</h1>
        <p className="text-slate-400 text-sm">Admin only — perubahan berlaku langsung</p></div>

      {/* FLOOR & ROOM CONFIG */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Building size={20} className="text-indigo-600"/>
            <h2 className="font-black text-slate-900">Konfigurasi Lantai & Kamar</h2>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">Total: {totalRoomsConfig} kamar</span>
        </div>

        <div className="space-y-3 mb-4">
          {Object.entries(floorCfg).sort(([a],[b])=>+a-+b).map(([lt, cfg]) => {
            const occupied = rooms.filter(r=>r.lantai===+lt&&r.status==="terisi").length;
            const current  = rooms.filter(r=>r.lantai===+lt).length;
            return (
              <div key={lt} className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-black text-slate-700 w-20">Lantai {lt}</span>
                  <span className="text-xs text-slate-400">{current} kamar saat ini · {occupied} terisi</span>
                  <button onClick={()=>removeFloor(lt)} className="ml-auto text-xs text-red-400 hover:text-red-600 font-bold transition">Hapus Lantai</button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Prefix Kode Kamar</label>
                    <div className="flex items-center gap-2">
                      <input className={inp+" flex-1"} placeholder="cth: 1-, A-, B0"
                        value={cfg.prefix||""}
                        onChange={e=>setFloorCfg({...floorCfg,[lt]:{...cfg,prefix:e.target.value}})}/>
                      <span className="text-xs text-slate-400 whitespace-nowrap">+ 01, 02...</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">Preview: <span className="font-bold text-slate-600">{cfg.prefix||lt+"-"}01</span>, <span className="font-bold text-slate-600">{cfg.prefix||lt+"-"}02</span></p>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 block mb-1">Jumlah Kamar</label>
                    <input type="number" min={occupied} className={inp}
                      value={cfg.count}
                      onChange={e=>setFloorCfg({...floorCfg,[lt]:{...cfg,count:e.target.value}})}/>
                    {+cfg.count < current && <p className="text-[11px] text-amber-600 mt-1">↓ {current - +cfg.count} kamar akan dihapus (hanya kosong)</p>}
                    {+cfg.count > current && <p className="text-[11px] text-emerald-600 mt-1">↑ {+cfg.count - current} kamar baru akan ditambah</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tambah lantai */}
        <div className="flex gap-2 mb-4">
          <input type="number" className={inp+" w-32"} placeholder="No. lantai" value={newLantai}
            onChange={e=>setNewLantai(e.target.value)} min={1}/>
          <Btn v="secondary" onClick={addFloor}><Plus size={14}/>Tambah Lantai</Btn>
        </div>

        <Btn v="primary" onClick={applyFloorConfig}>
          <Check size={16}/>Terapkan Konfigurasi Lantai
        </Btn>
        <p className="text-xs text-slate-400 mt-2">⚠ Kode kamar yang sudah diedit manual tidak akan berubah. Prefix hanya berlaku untuk kamar baru.</p>
      </Card>

      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Shield size={20} className="text-blue-600"/>
          <h2 className="font-black text-slate-900">% Kepemilikan Investor</h2>
        </div>
        <div className="space-y-4">
          {[{l:"Ricy Candra",k:"ricy"},{l:"Arief Wahyudi",k:"arief"},{l:"Ferry Lukas",k:"ferry"}].map(inv=>(
            <div key={inv.k} className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-700 w-36">{inv.l}</span>
              <input type="number" step="0.001" min="0" max="100" className={inp+" w-32"}
                value={form.kepemilikan?.[inv.k]||""} onChange={e=>setForm({...form,kepemilikan:{...form.kepemilikan,[inv.k]:e.target.value}})}/>
              <span className="text-slate-500 font-bold">%</span>
            </div>
          ))}
          <div className={`text-sm font-black pt-2 border-t ${valid?"text-emerald-600":"text-red-500"}`}>
            Total: {total.toFixed(3)}% {valid?"✓ Valid":"✗ Harus tepat 100%"}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-black text-slate-900 mb-5">Parameter Keuangan</h2>
        <div className="space-y-4">
          <div><label className="text-xs font-bold text-slate-600 block mb-1">Kas Operasional Bulanan (Rp)</label>
            <input type="number" className={inp} value={form.kasOperasional||0} onChange={e=>setForm({...form,kasOperasional:+e.target.value})}/></div>
          <div><label className="text-xs font-bold text-slate-600 block mb-1">Fee Pengelola (%)</label>
            <input type="number" min="0" max="100" step="0.1" className={inp} value={form.feeManager||0} onChange={e=>setForm({...form,feeManager:+e.target.value})}/></div>
        </div>
      </Card>

      {/* Company info */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Building size={20} className="text-blue-600"/>
          <h2 className="font-black text-slate-900">Info Perusahaan (Kop Invoice)</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[{l:"Nama Perusahaan/Kos",k:"name",f:true},{l:"Alamat",k:"address",f:true},{l:"No Telepon",k:"phone"},{l:"Email",k:"email"}].map(f=>(
            <div key={f.k} className={f.f?"col-span-2":""}>
              <label className="text-xs font-bold text-slate-600 block mb-1">{f.l}</label>
              <input className={inp} value={form.companyInfo?.[f.k]||""}
                onChange={e=>setForm({...form,companyInfo:{...(form.companyInfo||{}), [f.k]:e.target.value}})}/>
            </div>
          ))}
        </div>
      </Card>

      {/* Bank accounts */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-black text-slate-900">Rekening Perusahaan</h2>
          <Btn v="secondary" size="sm" onClick={()=>setForm({...form, bankAccounts:[...(form.bankAccounts||[]),{id:uid(),bank:"",noRek:"",atasNama:""}]})}>
            <Plus size={14}/>Tambah Rekening
          </Btn>
        </div>
        {(!form.bankAccounts||form.bankAccounts.length===0)&&(
          <p className="text-sm text-slate-400 text-center py-4">Belum ada rekening. Klik tombol di atas untuk menambah.</p>
        )}
        <div className="space-y-3">
          {(form.bankAccounts||[]).map((b,i)=>(
            <div key={b.id||i} className="grid grid-cols-7 gap-2 items-end bg-slate-50 rounded-xl p-3">
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 block mb-1">Bank</label>
                <input className={inp} placeholder="BCA, BRI..." value={b.bank||""}
                  onChange={e=>{const nb=[...(form.bankAccounts)]; nb[i]={...b,bank:e.target.value}; setForm({...form,bankAccounts:nb});}}/>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 block mb-1">No Rekening</label>
                <input className={inp} placeholder="1234567890" value={b.noRek||""}
                  onChange={e=>{const nb=[...(form.bankAccounts)]; nb[i]={...b,noRek:e.target.value}; setForm({...form,bankAccounts:nb});}}/>
              </div>
              <div className="col-span-2">
                <label className="text-xs font-bold text-slate-500 block mb-1">Atas Nama</label>
                <input className={inp} placeholder="Nama pemilik rek" value={b.atasNama||""}
                  onChange={e=>{const nb=[...(form.bankAccounts)]; nb[i]={...b,atasNama:e.target.value}; setForm({...form,bankAccounts:nb});}}/>
              </div>
              <div>
                <button onClick={()=>{ const nb=(form.bankAccounts).filter((_,j)=>j!==i); setForm({...form,bankAccounts:nb}); }}
                  className="w-full p-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition flex items-center justify-center">
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="font-black text-slate-900 mb-5">PIN Akses</h2>
        <div className="grid grid-cols-2 gap-4">
          {[{l:"Admin (Ricy)",k:"admin"},{l:"Investor Ricy",k:"ricy"},{l:"Investor Arief",k:"arief"},{l:"Investor Ferry",k:"ferry"},{l:"Staff",k:"staff"}].map(p=>(
            <div key={p.k}><label className="text-xs font-bold text-slate-600 block mb-1">{p.l}</label>
              <input className={inp} value={pins[p.k]||""} onChange={e=>setPins({...pins,[p.k]:e.target.value})} placeholder="PIN baru"/></div>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-4">
        <Btn onClick={doSave} size="lg">Simpan Semua Perubahan</Btn>
        {saved&&<span className="text-emerald-600 font-black">✓ Tersimpan!</span>}
      </div>

      {/* USER MANAGEMENT */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Shield size={20} className="text-blue-600"/>
            <h2 className="font-black text-slate-900">Kelola Pengguna</h2>
          </div>
          <Btn v="secondary" size="sm" onClick={()=>{
            const id=prompt("ID Pengguna (huruf kecil, tanpa spasi):");
            if(!id) return;
            if((users||[]).find(u=>u.id===id)){alert("ID sudah ada!");return;}
            const nama=prompt("Nama lengkap:");
            if(!nama) return;
            const role=prompt("Role (admin/investor/staff):");
            if(!["admin","investor","staff"].includes(role)){alert("Role tidak valid!");return;}
            const pwd=prompt("Password:");
            if(!pwd) return;
            saveUsers([...(users||[]),{id,nama,role,password:pwd}]);
          }}><Plus size={14}/>Tambah User</Btn>
        </div>
        <div className="space-y-2">
          {(users||DEF_USERS).map((u,i)=>(
            <div key={u.id} className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
              <div className="flex-1">
                <span className="font-black text-slate-800 text-sm">{u.id}</span>
                <span className="text-slate-400 text-xs ml-2">· {u.nama} · {u.role}</span>
              </div>
              <button onClick={()=>{
                const pwd=prompt(`Password baru untuk ${u.id}:`);
                if(!pwd) return;
                saveUsers((users||[]).map(x=>x.id===u.id?{...x,password:pwd}:x));
              }} className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg font-bold transition">Ganti PW</button>
              {u.id!==user&&<button onClick={()=>{
                if(!confirm(`Hapus user ${u.id}?`)) return;
                saveUsers((users||[]).filter(x=>x.id!==u.id));
              }} className="text-xs px-2.5 py-1 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg font-bold transition">Hapus</button>}
            </div>
          ))}
        </div>
      </Card>

      {/* RESET DATA */}
      <Card className="p-6 border-2 border-red-100">
        <div className="flex items-center gap-2 mb-2">
          <Trash2 size={20} className="text-red-500"/>
          <h2 className="font-black text-red-700">Reset / Hapus Data Test</h2>
        </div>
        <p className="text-slate-500 text-sm mb-5">Hapus data uji coba. Pengaturan, % kepemilikan, dan PIN <strong>tidak</strong> ikut terhapus.</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            {label:"Hapus Semua Pembayaran",  key:"payments",  desc:"Bersihkan semua data sewa masuk"},
            {label:"Hapus Semua Pengeluaran", key:"expenses",  desc:"Bersihkan semua data kas keluar"},
            {label:"Hapus Semua Penyewa",     key:"tenants",   desc:"Kosongkan semua kamar sekaligus"},
            {label:"Hapus Log Aktivitas",     key:"audit",     desc:"Bersihkan riwayat audit trail"},
          ].map(opt=>(
            <div key={opt.key} className="bg-red-50 rounded-xl p-4">
              <p className="text-sm font-bold text-slate-800">{opt.label}</p>
              <p className="text-xs text-slate-400 mt-0.5 mb-3">{opt.desc}</p>
              <button onClick={()=>{
                if(!confirm(`Yakin hapus ${opt.label.toLowerCase()}? Tidak bisa dibatalkan.`)) return;
                onReset(opt.key);
              }} className="px-3 py-1.5 text-xs font-bold bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition">
                Hapus →
              </button>
            </div>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-red-100">
          <p className="text-xs text-red-400 font-bold mb-2">⚠ Zona Berbahaya</p>
          <button onClick={()=>{
            if(!confirm("HAPUS SEMUA data?\n\nIni akan menghapus: penyewa, pembayaran, pengeluaran, dan log.\nKamar kembali ke 42 default kosong.\nPIN & setting AMAN.\n\nLanjutkan?")) return;
            if(!confirm("Konfirmasi terakhir: yakin hapus semua data?")) return;
            onReset("all");
          }} className="px-4 py-2 text-sm font-black bg-red-600 hover:bg-red-700 text-white rounded-xl transition">
            🗑 Reset SEMUA Data (kecuali setting & PIN)
          </button>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════
// AUDIT PAGE
// ═══════════════════════════════════════════════
function AuditPage({ audit }) {
  const color = (a) => {
    if (a.includes("BAYAR")||a.includes("MASUK")) return "bg-emerald-100 text-emerald-700";
    if (a.includes("HAPUS")||a.includes("KELUAR")||a.includes("TOLAK")) return "bg-red-100 text-red-700";
    if (a.includes("APPROVE")) return "bg-blue-100 text-blue-700";
    if (a.includes("PENGELUARAN")||a.includes("PENDING")) return "bg-amber-100 text-amber-700";
    return "bg-slate-100 text-slate-600";
  };
  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-black text-slate-900">Log Aktivitas</h1>
        <p className="text-slate-400 text-sm">{audit.length} entri · tidak bisa dihapus</p></div>
      <Card>
        {audit.length===0&&<p className="text-center py-10 text-slate-400 text-sm">Belum ada aktivitas tercatat</p>}
        <div className="divide-y divide-slate-50">
          {audit.map(a=>(
            <div key={a.id} className="flex items-start gap-3 px-5 py-3.5">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 mt-0.5 ${color(a.action)}`}>{a.action}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 font-medium">{a.detail}</p>
                <p className="text-xs text-slate-400 mt-0.5">{a.by} · {fD(a.at)} {new Date(a.at).toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════
// INVOICE PUBLIC VIEW (no auth required)
// ═══════════════════════════════════════════════
function InvoicePublicView({ inv }) {
  if (!inv) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="text-center p-8">
        <p className="text-5xl mb-4">🔍</p>
        <p className="text-xl font-black text-slate-500">Invoice tidak ditemukan</p>
        <p className="text-slate-400 mt-2 text-sm">Link mungkin salah atau sudah dihapus</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 py-8 px-4 print:bg-white print:py-0">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-5 print:hidden">
          <p className="text-sm text-slate-500 font-medium">🏠 Kos Meruya · Invoice</p>
          <button onClick={()=>window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200">
            🖨 Print / Simpan PDF
          </button>
        </div>

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden print:shadow-none print:rounded-none">
          {/* Header strip */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 px-8 py-7 text-white">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-2xl font-black tracking-tight">{inv.companyInfo?.name||"Kos Meruya"}</p>
                {inv.companyInfo?.address&&<p className="text-blue-200 text-sm mt-1">{inv.companyInfo.address}</p>}
                {inv.companyInfo?.phone&&<p className="text-blue-200 text-sm">{inv.companyInfo.phone}</p>}
              </div>
              <div className="text-right">
                <p className="text-blue-300 text-xs font-bold uppercase tracking-widest">Invoice</p>
                <p className="text-xl font-black mt-1">{inv.invoiceNo}</p>
                <p className="text-blue-200 text-sm mt-1">Tgl: {fD(inv.generatedAt)}</p>
              </div>
            </div>
          </div>

          <div className="px-8 py-7">
            {/* Billing to + due date */}
            <div className="flex justify-between mb-8 gap-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Tagihan Kepada</p>
                <p className="font-black text-slate-900 text-xl">{inv.tenantName}</p>
                <p className="text-slate-500 mt-0.5">{inv.tenantHp}</p>
                <p className="text-slate-500">Kamar <span className="font-bold text-blue-600">{inv.roomNomor}</span> · {inv.roomTipe}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Jatuh Tempo</p>
                <p className="font-black text-slate-900">{fD(inv.dueDate)}</p>
                <span className={`inline-block text-xs font-black px-3 py-1.5 rounded-full mt-2 ${inv.paid?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-600"}`}>
                  {inv.paid?"✓ LUNAS":"BELUM LUNAS"}
                </span>
              </div>
            </div>

            {/* Line items */}
            <div className="border-t-2 border-b-2 border-slate-100 py-4 mb-6">
              <div className="flex justify-between items-start py-3">
                <div>
                  <p className="font-bold text-slate-800">Sewa Kamar {inv.roomNomor} – {inv.roomTipe}</p>
                  <p className="text-slate-400 text-sm mt-0.5">Periode: {inv.periode?.label}</p>
                </div>
                <p className="font-black text-slate-800 text-lg">{fRp(inv.nominal)}</p>
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center mb-8 bg-blue-50 rounded-2xl px-6 py-4">
              <p className="font-black text-slate-700 text-lg">TOTAL TAGIHAN</p>
              <p className="font-black text-blue-700 text-3xl">{fRp(inv.nominal)}</p>
            </div>

            {/* Bank accounts */}
            {inv.bankAccounts?.length>0&&(
              <div className="bg-slate-50 rounded-2xl p-5 mb-6">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Transfer Pembayaran Ke:</p>
                <div className="space-y-2.5">
                  {inv.bankAccounts.map((b,i)=>(
                    <div key={i} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-slate-100">
                      <span className="text-sm font-black text-blue-700 w-14">{b.bank}</span>
                      <span className="text-base font-black text-slate-800 tracking-widest">{b.noRek}</span>
                      <span className="text-sm text-slate-400">a.n. {b.atasNama}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-slate-400 mt-3">Konfirmasi transfer via WhatsApp ke pengelola kos.</p>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-slate-100 pt-4 text-center">
              <p className="text-xs text-slate-300">Invoice #{inv.invoiceNo} · Dibuat {inv.generatedAt?new Date(inv.generatedAt).toLocaleString("id-ID"):""}</p>
              <p className="text-xs text-slate-300">Sistem Manajemen Kos Meruya</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// INVOICES PAGE
// ═══════════════════════════════════════════════
function InvoicesPage({ role, user, rooms, tenants, settings, addAudit, audit, payments, savePayments }) {
  const [invoices, setInvs]  = useState([]);
  const [modal,    setModal] = useState(null);
  const [form,     setForm]  = useState({});
  const [copied,   setCopied]= useState("");
  const [loadingInv, setLI]  = useState(true);
  const [showWA,   setShowWA]= useState(null);
  const [previewInv,setPreviewInv]=useState(null); // fullscreen invoice preview

  const isEdit = role==="admin"||role==="staff";

  useEffect(()=>{
    store.get("km-invoices").then(d=>{ setInvs(d||[]); setLI(false); });
  },[]);

  const saveInvs = async (data) => {
    setInvs(data);
    await store.set("km-invoices", data, true);
  };

  const calcPeriode = (jatuhTempo, targetMonth) => {
    const [y,m] = (targetMonth||tMon()).split("-").map(Number);
    const jt = +jatuhTempo||1;
    const start = new Date(y, m-1, jt);
    // end = jt-1 of next month (or last day if jt=1)
    const endDate = jt>1 ? new Date(y, m, jt-1) : new Date(y, m, 0);
    const fmt = (d) => d.toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"});
    return {
      start: start.toISOString().split("T")[0],
      end:   endDate.toISOString().split("T")[0],
      label: `${fmt(start)} – ${fmt(endDate)}`
    };
  };

  const getBaseUrl = () => { const h=window.location.href; const i=h.indexOf("#"); return i>-1?h.substring(0,i):h; };

  const genWAMsg = (inv) => {
    const banks = (inv.bankAccounts||[]).map(b=>`🏦 ${b.bank}  ${b.noRek}  a.n. ${b.atasNama}`).join("\n");
    const link = `${getBaseUrl()}#inv-${inv.id}`;
    return `Halo Kak ${inv.tenantName} 👋

Berikut tagihan sewa kamar Anda di *${inv.companyInfo?.name||"Kos Meruya"}*:

🏠 Kamar       : ${inv.roomNomor} (${inv.roomTipe})
📋 No. Invoice : ${inv.invoiceNo}
📆 Periode     : ${inv.periode?.label||"-"}
💰 Total       : *${fRp(inv.nominal)}*
⏰ Jatuh Tempo : ${fD(inv.dueDate)}

🔗 Lihat invoice di: ${link}

${banks?"Transfer pembayaran ke:\n"+banks+"\n":""}
Mohon konfirmasi via WhatsApp setelah transfer.
Terima kasih 🙏

_Manajemen ${inv.companyInfo?.name||"Kos Meruya"}_`;
  };

  const printInvoice = (inv) => {
    const banks = (inv.bankAccounts||[]).map(b=>`
      <div style="display:flex;gap:12px;align-items:center;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px;margin-bottom:8px">
        <span style="font-weight:900;color:#1d4ed8;min-width:48px">${b.bank}</span>
        <span style="font-weight:700;letter-spacing:2px;color:#1e293b;font-size:16px">${b.noRek}</span>
        <span style="color:#94a3b8">a.n. ${b.atasNama}</span>
      </div>`).join("");
    const w = window.open("","_blank");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${inv.invoiceNo} - Kos Meruya</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',sans-serif;background:#f1f5f9;padding:30px;color:#1e293b}
    .card{background:#fff;max-width:680px;margin:0 auto;border-radius:20px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,.12)}
    .hdr{background:linear-gradient(135deg,#1d4ed8,#4338ca);padding:32px;color:#fff;display:flex;justify-content:space-between;align-items:flex-start}
    .body{padding:32px}.meta{display:flex;justify-content:space-between;margin-bottom:28px;gap:16px}
    .lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:#94a3b8;margin-bottom:8px}
    .items{border-top:2px solid #f1f5f9;border-bottom:2px solid #f1f5f9;padding:20px 0;margin-bottom:24px}
    .total{background:#eff6ff;border-radius:14px;padding:16px 20px;display:flex;justify-content:space-between;align-items:center;margin-bottom:24px}
    .footer{text-align:center;padding:16px 32px;border-top:1px solid #f1f5f9;color:#cbd5e1;font-size:11px}
    .btn{display:inline-block;background:#1d4ed8;color:#fff;border:none;padding:12px 28px;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:20px}
    @media print{.no-print{display:none!important}body{background:#fff;padding:0}.card{box-shadow:none;border-radius:0}}</style>
    </head><body>
    <div style="text-align:center" class="no-print">
      <button class="btn" onclick="window.print()">🖨 Print / Simpan PDF</button>
    </div>
    <div class="card">
      <div class="hdr">
        <div><div style="font-size:22px;font-weight:900">${inv.companyInfo?.name||"Kos Meruya"}</div>
        ${inv.companyInfo?.address?`<div style="color:rgba(255,255,255,.7);font-size:13px;margin-top:4px">${inv.companyInfo.address}</div>`:""}
        ${inv.companyInfo?.phone?`<div style="color:rgba(255,255,255,.7);font-size:13px">${inv.companyInfo.phone}</div>`:""}</div>
        <div style="text-align:right"><div style="color:rgba(255,255,255,.6);font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px">Invoice</div>
        <div style="font-size:20px;font-weight:900;margin-top:4px">${inv.invoiceNo}</div>
        <div style="color:rgba(255,255,255,.6);font-size:12px;margin-top:4px">Tgl: ${fD(inv.generatedAt)}</div></div>
      </div>
      <div class="body">
        <div class="meta">
          <div><div class="lbl">Tagihan Kepada</div>
          <div style="font-size:20px;font-weight:900">${inv.tenantName}</div>
          <div style="color:#64748b">${inv.tenantHp||""}</div>
          <div style="color:#64748b">Kamar <strong style="color:#1d4ed8">${inv.roomNomor}</strong> · ${inv.roomTipe}</div></div>
          <div style="text-align:right"><div class="lbl">Jatuh Tempo</div>
          <div style="font-weight:700;font-size:16px">${fD(inv.dueDate)}</div>
          <div style="display:inline-block;margin-top:6px;padding:6px 14px;border-radius:20px;font-size:12px;font-weight:700;${inv.paid?"background:#dcfce7;color:#15803d":"background:#fee2e2;color:#dc2626"}">${inv.paid?"✓ LUNAS":"BELUM LUNAS"}</div></div>
        </div>
        <div class="items">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div><div style="font-weight:700;font-size:15px">Sewa Kamar ${inv.roomNomor} – ${inv.roomTipe}</div>
            <div style="color:#94a3b8;font-size:13px;margin-top:3px">Periode: ${inv.periode?.label||"-"}</div></div>
            <div style="font-weight:900;font-size:17px">${fRp(inv.nominal)}</div>
          </div>
        </div>
        <div class="total"><div style="font-weight:900;font-size:17px">TOTAL TAGIHAN</div>
        <div style="font-weight:900;color:#1d4ed8;font-size:28px">${fRp(inv.nominal)}</div></div>
        ${banks?`<div style="background:#f8fafc;border-radius:14px;padding:20px;margin-bottom:16px">
          <div class="lbl" style="margin-bottom:12px">Transfer Pembayaran Ke</div>${banks}
          <div style="color:#94a3b8;font-size:12px;margin-top:8px">Konfirmasi transfer via WhatsApp ke pengelola kos.</div></div>`:""}
      </div>
      <div class="footer">Invoice ${inv.invoiceNo} · ${inv.generatedBy} · ${fD(inv.generatedAt)} · Sistem Manajemen Kos Meruya</div>
    </div></body></html>`);
    w.document.close();
  };

  const clipCopy = async (text) => {
    try { await navigator.clipboard.writeText(text); return true; } catch {}
    try {
      const el = document.createElement("textarea");
      el.value = text; el.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;";
      document.body.appendChild(el); el.focus(); el.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(el); return ok;
    } catch { return false; }
  };

  const openGenerate = (t) => {
    const room = rooms.find(r=>r.id===t.kamarId);
    const tm   = tMon();
    const per  = calcPeriode(t.jatuhTempo, tm);
    setForm({ tenantId:t.id, tenantName:t.nama, tenantHp:t.hp,
      roomNomor:room?.nomor, roomTipe:room?.tipe||"Standard",
      nominal:room?.harga||0, targetMonth:tm, periode:per, dueDate:per.start });
    setModal(t);
  };

  const updateMonth = (tm) => {
    const per = calcPeriode(modal.jatuhTempo, tm);
    setForm(f=>({...f, targetMonth:tm, periode:per, dueDate:per.start}));
  };

  const nextInvNo = (tm) => {
    const key = tm.replace("-","");
    const cnt = invoices.filter(i=>i.invoiceNo?.includes(key)).length;
    return `INV-${key}-${String(cnt+1).padStart(3,"0")}`;
  };

  const generate = async () => {
    if (!form.nominal) return alert("Nominal 0. Set harga kamar terlebih dahulu.");
    const inv = {
      id: uid(), invoiceNo: nextInvNo(form.targetMonth), ...form,
      bankAccounts: settings.bankAccounts||[],
      companyInfo:  settings.companyInfo||{name:"Kos Meruya"},
      generatedBy: user, generatedAt: now(), paid: false,
    };
    await store.set(`km-inv-${inv.id}`, inv, true);
    const newInvs = [inv,...invoices];
    await saveInvs(newInvs);
    await addAudit("INVOICE",`${inv.invoiceNo} dibuat untuk ${inv.tenantName} (K-${inv.roomNomor}) – ${inv.periode?.label}`);
    setModal(null);
    setShowWA({ inv, msg: genWAMsg(inv) });
  };

  const markPaid = async (inv) => {
    // Konfirmasi dulu
    const konfirmasi = window.confirm(
      `✅ KONFIRMASI PELUNASAN\n\n` +
      `Penyewa  : ${inv.tenantName}\n` +
      `Kamar    : ${inv.roomNomor}\n` +
      `Periode  : ${inv.periode?.label||"-"}\n` +
      `Nominal  : ${fRp(inv.nominal)}\n` +
      `Invoice  : ${inv.invoiceNo}\n\n` +
      `Yakin uang sudah MASUK ke rekening?\n` +
      `Pembayaran akan otomatis tercatat di sistem.`
    );
    if (!konfirmasi) return;

    // Cek apakah sudah ada pembayaran untuk periode ini
    const sudahAda = payments.find(p=>p.penyewaId===inv.tenantId&&p.periode===inv.targetMonth);
    if (sudahAda) {
      const lanjut = window.confirm(
        `⚠️ Perhatian!\n\nSudah ada record pembayaran untuk ${inv.tenantName} bulan ${mLbl(inv.targetMonth)}.\n\nTetap tandai lunas? (Tidak akan duplikasi pembayaran)`
      );
      if (!lanjut) return;
    } else {
      // Buat record pembayaran otomatis
      const room = rooms.find(r=>r.nomor===inv.roomNomor)||rooms.find(r=>r.id===inv.kamarId);
      const newPay = {
        id: uid(),
        kamarId: room?.id||"",
        penyewaId: inv.tenantId||"",
        periode: inv.targetMonth||tMon(),
        nominal: +inv.nominal,
        metode: "transfer",
        bank: "",
        pengirim: inv.tenantName,
        referensi: inv.invoiceNo,
        tanggal: new Date().toISOString().split("T")[0],
        catatan: `Otomatis dari Invoice ${inv.invoiceNo}`,
        inputBy: user,
        inputAt: now()
      };
      await savePayments([...payments, newPay]);
    }

    // Update status invoice
    const updated = invoices.map(i=>i.id===inv.id?{...i,paid:true,paidAt:now(),paidBy:user}:i);
    await saveInvs(updated);
    await store.set(`km-inv-${inv.id}`, {...inv,paid:true,paidAt:now(),paidBy:user}, true);
    await addAudit("INV_LUNAS",`${inv.invoiceNo} – ${inv.tenantName} LUNAS oleh ${user}. Pembayaran ${fRp(inv.nominal)} otomatis dicatat.`);
  };

  const showShare = (inv) => setShowWA({ inv, msg: genWAMsg(inv) });

  const activeTenants = tenants.filter(t=>t.aktif);
  const ms = months6();
  const noBank = !settings.bankAccounts?.length;

  return (
    <div className="space-y-6">

      {/* ── INVOICE PREVIEW MODAL ── */}
      {previewInv&&(
        <Modal title={previewInv.invoiceNo} onClose={()=>setPreviewInv(null)} size="lg">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-xl p-5 text-white flex justify-between items-start mb-5">
            <div>
              <p className="text-lg font-black">{previewInv.companyInfo?.name||"Kos Meruya"}</p>
              {previewInv.companyInfo?.address&&<p className="text-blue-200 text-xs mt-1">{previewInv.companyInfo.address}</p>}
              {previewInv.companyInfo?.phone&&<p className="text-blue-200 text-xs">{previewInv.companyInfo.phone}</p>}
            </div>
            <div className="text-right">
              <p className="text-blue-300 text-[10px] font-bold uppercase tracking-widest">Invoice</p>
              <p className="font-black text-lg mt-1">{previewInv.invoiceNo}</p>
              <p className="text-blue-200 text-xs">{fD(previewInv.generatedAt)}</p>
            </div>
          </div>

          {/* Billing info */}
          <div className="flex justify-between gap-4 mb-5">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tagihan Kepada</p>
              <p className="font-black text-slate-900 text-base">{previewInv.tenantName}</p>
              <p className="text-slate-500 text-sm">{previewInv.tenantHp}</p>
              <p className="text-slate-500 text-sm">Kamar <span className="font-black text-blue-600">{previewInv.roomNomor}</span> · {previewInv.roomTipe}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Jatuh Tempo</p>
              <p className="font-black text-slate-900">{fD(previewInv.dueDate)}</p>
              <span className={`inline-block text-xs font-black px-3 py-1 rounded-full mt-1 ${previewInv.paid?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-600"}`}>
                {previewInv.paid?"✓ LUNAS":"BELUM LUNAS"}
              </span>
            </div>
          </div>

          {/* Item */}
          <div className="border-t-2 border-b-2 border-slate-100 py-4 mb-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-bold text-slate-800">Sewa Kamar {previewInv.roomNomor} – {previewInv.roomTipe}</p>
                <p className="text-slate-400 text-sm mt-0.5">Periode: {previewInv.periode?.label}</p>
              </div>
              <p className="font-black text-slate-800">{fRp(previewInv.nominal)}</p>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center bg-blue-50 rounded-xl px-5 py-4 mb-4">
            <p className="font-black text-slate-800">TOTAL TAGIHAN</p>
            <p className="font-black text-blue-700 text-2xl">{fRp(previewInv.nominal)}</p>
          </div>

          {/* Bank */}
          {previewInv.bankAccounts?.length>0&&(
            <div className="bg-slate-50 rounded-xl p-4 mb-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Transfer Pembayaran Ke</p>
              {previewInv.bankAccounts.map((b,i)=>(
                <div key={i} className="flex items-center gap-3 bg-white rounded-lg px-4 py-2.5 border border-slate-100 mb-2">
                  <span className="font-black text-blue-700 w-12 text-sm">{b.bank}</span>
                  <span className="font-black text-slate-800 tracking-wider text-sm">{b.noRek}</span>
                  <span className="text-slate-400 text-sm">a.n. {b.atasNama}</span>
                </div>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-300 text-center mb-4">Dibuat oleh {previewInv.generatedBy} · {fD(previewInv.generatedAt)}</p>

          {/* Screenshot tip */}
          <div className="bg-amber-50 rounded-xl p-3 text-center">
            <p className="text-sm font-bold text-amber-700">📸 Screenshot halaman ini untuk simpan & kirim ke penyewa via WA</p>
          </div>
        </Modal>
      )}

      <div>
        <h1 className="text-2xl font-black text-slate-900">Invoice Tagihan</h1>
        <p className="text-slate-400 text-sm">{invoices.length} invoice · {invoices.filter(i=>i.paid).length} lunas</p>
      </div>

      {noBank&&isEdit&&(
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-500 flex-shrink-0"/>
          <p className="text-sm text-amber-700 font-medium">Belum ada rekening perusahaan. Tambahkan di <span className="font-black">Pengaturan → Rekening Perusahaan</span> agar muncul di invoice.</p>
        </div>
      )}

      {/* Quick generate table */}
      {isEdit&&(
        <Card className="p-5">
          <h2 className="font-black text-slate-900 mb-4">Generate Invoice per Penyewa</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                {["Kamar","Nama","No HP","JT","Harga/Bln",""].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {activeTenants.length===0&&<tr><td colSpan={6} className="text-center py-8 text-slate-400 text-sm">Belum ada penyewa aktif</td></tr>}
                {activeTenants.map(t=>{
                  const room=rooms.find(r=>r.id===t.kamarId);
                  const lastInv=invoices.find(i=>i.tenantId===t.id);
                  return (
                    <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                      <td className="px-4 py-3 font-black text-blue-600">K-{room?.nomor||"—"}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{t.nama}</td>
                      <td className="px-4 py-3 text-slate-500">{t.hp||"—"}</td>
                      <td className="px-4 py-3 text-slate-500">Tgl {t.jatuhTempo}</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{fRp(room?.harga)}</td>
                      <td className="px-4 py-3">
                        <button onClick={()=>openGenerate(t)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5">
                          <FileText size={12}/>Buat Invoice
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Invoice list */}
      <Card>
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-black text-slate-900">Riwayat Invoice</h2>
          <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-bold">{invoices.length} invoice</span>
        </div>
        {loadingInv&&<p className="text-center py-10 text-slate-400 text-sm">Memuat...</p>}
        {!loadingInv&&invoices.length===0&&<p className="text-center py-10 text-slate-400 text-sm">Belum ada invoice dibuat</p>}
        <div className="divide-y divide-slate-50">
          {invoices.map(inv=>(
            <div key={inv.id} className="px-6 py-4 hover:bg-slate-50/80 transition">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-black text-slate-800">{inv.invoiceNo}</span>
                    <Badge status={inv.paid?"lunas":"belum"}/>
                  </div>
                  <p className="font-bold text-slate-700 mt-1 text-sm">{inv.tenantName} · Kamar {inv.roomNomor}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{inv.periode?.label}</p>
                  <p className="text-xs text-slate-400">JT: {fD(inv.dueDate)} · Dibuat {fD(inv.generatedAt)} oleh {inv.generatedBy}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                  <span className="font-black text-slate-800">{fRp(inv.nominal)}</span>
                  {!inv.paid&&isEdit&&(
                    <button onClick={()=>markPaid(inv)} className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition">✓ Lunas</button>
                  )}
                  <button onClick={()=>printInvoice(inv)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5">
                    🖨 PDF
                  </button>
                  <button onClick={()=>showShare(inv)}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5">
                    💬 WA
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* WA Share Modal */}
      {showWA&&(
        <Modal title={`Kirim ke ${showWA.inv.tenantName}`} onClose={()=>setShowWA(null)} size="lg">
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
              <span className="text-lg">✅</span>
              <p className="text-sm font-bold text-green-700">Invoice <span className="font-black">{showWA.inv.invoiceNo}</span> berhasil dibuat!</p>
            </div>

            {/* Step 1: Cetak PDF */}
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-3">Langkah 1 — Lihat Invoice</p>
              <button onClick={()=>{
                const inv = showWA.inv;
                setShowWA(null);
                setPreviewInv(inv);
              }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition flex items-center justify-center gap-2 text-sm">
                🖨 Buka Invoice &amp; Simpan PDF
              </button>
              <p className="text-xs text-blue-500 mt-2">Invoice terbuka fullscreen → screenshot atau Print → Save as PDF</p>
            </div>

            {/* Step 2: Pesan WA */}
            <div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-2">Langkah 2 — Salin Pesan WA</p>
              <div className="flex justify-end mb-2">
                <button onClick={async()=>{
                  const ok = await clipCopy(showWA.msg);
                  setCopied("wa"); setTimeout(()=>setCopied(""),3000);
                }} className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${copied==="wa"?"bg-emerald-100 text-emerald-700":"bg-slate-100 hover:bg-slate-200 text-slate-700"}`}>
                  {copied==="wa"?"✓ Tersalin!":"📋 Salin Pesan"}
                </button>
              </div>
              <textarea readOnly value={showWA.msg} onClick={e=>e.target.select()}
                className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 bg-slate-50 focus:outline-none resize-none font-mono leading-relaxed"
                rows={13}/>
              <p className="text-xs text-slate-400 mt-1.5">💡 Tap teks → tahan → Pilih Semua → Salin. Lalu kirim PDF + pesan ini ke WA penyewa.</p>
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Btn v="secondary" onClick={()=>setShowWA(null)}>Tutup</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Generate modal */}
      {modal&&(
        <Modal title={`Buat Invoice – ${form.tenantName}`} onClose={()=>setModal(null)} size="lg">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 bg-slate-50 rounded-xl p-4">
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kamar</p><p className="font-black text-blue-600">K-{form.roomNomor}</p></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipe</p><p className="font-bold text-slate-700">{form.roomTipe}</p></div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No HP</p><p className="font-bold text-slate-700">{form.tenantHp}</p></div>
            </div>

            <div>
              <label className="text-xs font-black text-slate-600 block mb-1">Bulan Tagihan</label>
              <select className={inp} value={form.targetMonth} onChange={e=>updateMonth(e.target.value)}>
                {ms.map(m=><option key={m} value={m}>{mLbl(m)}</option>)}
              </select>
            </div>

            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Periode Tagihan Otomatis</p>
              <p className="font-black text-slate-800 text-lg">{form.periode?.label}</p>
              <p className="text-xs text-slate-400 mt-1">Dihitung dari jatuh tempo tgl {modal.jatuhTempo} setiap bulan</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black text-slate-600 block mb-1">Nominal (Rp)</label>
                <input type="number" className={inp} value={form.nominal||0} onChange={e=>setForm({...form,nominal:+e.target.value})}/>
              </div>
              <div>
                <label className="text-xs font-black text-slate-600 block mb-1">Tanggal Jatuh Tempo</label>
                <input type="date" className={inp} value={form.dueDate||""} onChange={e=>setForm({...form,dueDate:e.target.value})}/>
              </div>
            </div>

            {settings.bankAccounts?.length>0?(
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rekening di Invoice</p>
                {settings.bankAccounts.map((b,i)=>(
                  <p key={i} className="text-sm"><span className="font-black">{b.bank}</span> {b.noRek} <span className="text-slate-400">a.n. {b.atasNama}</span></p>
                ))}
              </div>
            ):(
              <div className="bg-amber-50 rounded-xl p-4">
                <p className="text-xs font-bold text-amber-600">⚠ Belum ada rekening. Tambahkan di Pengaturan dulu agar muncul di invoice.</p>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <Btn v="secondary" onClick={()=>setModal(null)}>Batal</Btn>
              <Btn onClick={generate}><FileText size={14}/>Generate Invoice</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════
// ERROR BOUNDARY
// ═══════════════════════════════════════════════
class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = {err:null}; }
  static getDerivedStateFromError(e) { return {err:e}; }
  render() {
    if (this.state.err) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full text-center">
          <p className="text-4xl mb-4">⚠️</p>
          <h2 className="text-xl font-black text-slate-800 mb-2">Ada kesalahan di halaman ini</h2>
          <p className="text-slate-500 text-sm mb-4">{this.state.err?.message}</p>
          <button onClick={()=>this.setState({err:null})} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm">Kembali</button>
        </div>
      </div>
    );
    return this.props.children;
  }
}

// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// STATUS BAYAR PAGE
// ═══════════════════════════════════════════════
function StatusBayarPage({ rooms, tenants, payments }) {
  const [fMonth, setFMonth] = useState(tMon());
  const [search, setSearch] = useState("");
  const ms = Array.from({length:12},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-i);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;});
  const today = new Date();
  const activeTenants = tenants.filter(t=>t.aktif);
  const filtered = activeTenants.filter(t=>!search||t.nama?.toLowerCase().includes(search.toLowerCase()));

  const getStatus = (t) => {
    const paid = payments.find(p=>p.penyewaId===t.id&&p.periode===fMonth);
    if (paid) return { st:"lunas", nominal:paid.nominal };
    const [y,m] = fMonth.split("-").map(Number);
    const isCurrentMonth = y===today.getFullYear()&&m===today.getMonth()+1;
    if (isCurrentMonth&&t.jatuhTempo) {
      const due = new Date(y,m-1,t.jatuhTempo);
      return { st:today>due?"telat":"belum", nominal:0 };
    }
    return { st:"telat", nominal:0 };
  };

  const stats = {lunas:0,belum:0,telat:0};
  activeTenants.forEach(t=>{ const {st}=getStatus(t); stats[st]=(stats[st]||0)+1; });

  return (
    <div className="space-y-5">
      <div><h1 className="text-2xl font-black text-slate-900">Status Pembayaran</h1>
        <p className="text-slate-400 text-sm">Pantau status bayar semua penyewa</p></div>
      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-bold text-slate-600">Bulan:</label>
        <select value={fMonth} onChange={e=>setFMonth(e.target.value)} className={inp+" w-44"}>
          {ms.map(m=><option key={m} value={m}>{mLbl(m)}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {[{l:"Sudah Lunas",v:stats.lunas,c:"emerald"},{l:"Belum Bayar",v:stats.belum,c:"amber"},{l:"Terlambat",v:stats.telat,c:"red"}].map(s=>(
          <Card key={s.l} className="p-4 text-center">
            <p className={`text-3xl font-black text-${s.c}-600`}>{s.v}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{s.l}</p>
            <p className="text-xs text-slate-400">{mLbl(fMonth)}</p>
          </Card>
        ))}
      </div>
      <div className="relative"><Search size={15} className="absolute left-4 top-3 text-slate-400"/>
        <input className={inp+" pl-10"} placeholder="Cari nama penyewa..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              {["Kamar","Nama","No HP","JT",`Status ${mLbl(fMonth)}`,"Nominal"].map(h=>(
                <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">{h}</th>
              ))}</tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={6} className="text-center py-10 text-slate-400 text-sm">Tidak ada penyewa</td></tr>}
              {filtered.map(t=>{
                const room=rooms.find(r=>r.id===t.kamarId);
                const {st,nominal}=getStatus(t);
                return (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/80">
                    <td className="px-5 py-3.5 font-black text-blue-600">K-{room?.nomor||"?"}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">{t.nama}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{t.hp}</td>
                    <td className="px-5 py-3.5 text-slate-500">Tgl {t.jatuhTempo}</td>
                    <td className="px-5 py-3.5"><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st==="lunas"?"bg-emerald-100 text-emerald-700":st==="telat"?"bg-red-100 text-red-600":"bg-amber-100 text-amber-700"}`}>{st==="lunas"?"✓ Lunas":st==="telat"?"✗ Telat":"⏳ Belum"}</span></td>
                    <td className="px-5 py-3.5 font-bold text-slate-700">{nominal?fRp(nominal):"-"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════
// MUTASI BANK & KAS PAGE  
// ═══════════════════════════════════════════════
function MutasiBankKasPage({ settings, saveSettings, payments, expenses, rooms, tenants, addAudit, user, role, kasTx, saveKas }) {
  const [tab, setTab]             = useState("bank");
  const [saldoForm, setSaldoForm] = useState({bank:+(settings.saldoAwal?.jumlah)||0,kas:+(settings.saldoKas?.jumlah)||0,tanggal:settings.saldoAwal?.tanggal||""});
  const [editSaldo, setEditSaldo] = useState(false);
  const [fMonth, setFMonth]       = useState("");
  const [showTrf, setShowTrf]     = useState(false);
  const [trfForm, setTrfForm]     = useState({jumlah:0,tanggal:new Date().toISOString().split("T")[0]});
  const ms = months6();
  const isAdmin = role==="admin";

  const saveSaldo = async () => {
    const ns={...settings,saldoAwal:{jumlah:+saldoForm.bank,tanggal:saldoForm.tanggal},saldoKas:{jumlah:+saldoForm.kas,tanggal:saldoForm.tanggal}};
    await saveSettings(ns);
    await addAudit("SALDO_AWAL",`${user} set saldo bank:${fRp(saldoForm.bank)} kas:${fRp(saldoForm.kas)}`);
    setEditSaldo(false);
  };

  const doTransfer = async () => {
    if (!trfForm.jumlah||+trfForm.jumlah<=0) return alert("Nominal harus lebih dari 0");
    const tx={id:uid(),tanggal:trfForm.tanggal,tipe:"masuk",jumlah:+trfForm.jumlah,deskripsi:"Transfer dari Bank",inputBy:user,inputAt:now()};
    await saveKas([...(kasTx||[]),tx]);
    await addAudit("TRANSFER_KAS",`${user} transfer ${fRp(trfForm.jumlah)} Bank→Kas`);
    setShowTrf(false); setTrfForm({jumlah:0,tanggal:new Date().toISOString().split("T")[0]});
    alert("✓ Transfer Bank → Kas berhasil!");
  };

  const bankIn  = payments.map(p=>{const room=rooms.find(r=>r.id===p.kamarId);const t=tenants.find(x=>x.id===p.penyewaId);return{id:p.id,tanggal:p.tanggal,tipe:"masuk",jumlah:+p.nominal,deskripsi:`Sewa K-${room?.nomor||"?"} – ${t?.nama||"?"}`,by:p.inputBy,periode:p.periode};});
  const bankOut = [...expenses.filter(e=>e.status==="approved"&&e.sumber==="bank").map(e=>({id:e.id,tanggal:e.tanggal,tipe:"keluar",jumlah:+e.nominal,deskripsi:`${e.kategori}: ${e.deskripsi}`,by:e.inputBy})),
    ...(kasTx||[]).filter(k=>k.tipe==="masuk").map(k=>({id:k.id+"_b",tanggal:k.tanggal,tipe:"keluar",jumlah:+k.jumlah,deskripsi:"Transfer ke Kas",by:k.inputBy}))];
  const bankTx  = [...bankIn,...bankOut].sort((a,b)=>new Date(a.tanggal)-new Date(b.tanggal));

  const kasIn   = (kasTx||[]).filter(k=>k.tipe==="masuk");
  const kasOut  = expenses.filter(e=>e.status==="approved"&&(e.sumber==="kas"||!e.sumber)).map(e=>({id:e.id,tanggal:e.tanggal,tipe:"keluar",jumlah:+e.nominal,deskripsi:`${e.kategori}: ${e.deskripsi}`,by:e.inputBy}));
  const kasTxAll= [...kasIn,...kasOut].sort((a,b)=>new Date(a.tanggal)-new Date(b.tanggal));

  const filterTx = (txs) => fMonth?txs.filter(t=>t.periode===fMonth||t.tanggal?.startsWith(fMonth)):txs;
  const calcRows = (txs,saldoAwal) => { let b=saldoAwal; return filterTx(txs).map(t=>{b+=t.tipe==="masuk"?t.jumlah:-t.jumlah;return{...t,saldo:b};}); };

  const bankSaldo0 = +(settings.saldoAwal?.jumlah)||0;
  const kasSaldo0  = +(settings.saldoKas?.jumlah)||0;
  const bankRows   = calcRows(bankTx, bankSaldo0);
  const kasRows    = calcRows(kasTxAll, kasSaldo0);
  const bankSaldoAkhir = bankSaldo0+filterTx(bankTx).reduce((s,t)=>s+(t.tipe==="masuk"?t.jumlah:-t.jumlah),0);
  const kasSaldoAkhir  = kasSaldo0 +filterTx(kasTxAll).reduce((s,t)=>s+(t.tipe==="masuk"?t.jumlah:-t.jumlah),0);

  const TxTable = ({rows}) => (
    <Card><div className="overflow-x-auto"><table className="w-full text-sm">
      <thead><tr className="border-b border-slate-100">{["Tanggal","Deskripsi","Tipe","Jumlah","Saldo","Oleh"].map(h=>(
        <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">{h}</th>))}</tr></thead>
      <tbody>
        {rows.length===0&&<tr><td colSpan={6} className="text-center py-10 text-slate-400 text-sm">Belum ada transaksi</td></tr>}
        {rows.map(t=>(
          <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/80">
            <td className="px-5 py-3 text-slate-500 text-xs whitespace-nowrap">{fD(t.tanggal)}</td>
            <td className="px-5 py-3 font-medium text-slate-800">{t.deskripsi}</td>
            <td className="px-5 py-3"><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${t.tipe==="masuk"?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-600"}`}>{t.tipe==="masuk"?"↑ Masuk":"↓ Keluar"}</span></td>
            <td className={`px-5 py-3 font-black ${t.tipe==="masuk"?"text-emerald-600":"text-red-600"}`}>{t.tipe==="masuk"?"+":"-"}{fRp(t.jumlah)}</td>
            <td className="px-5 py-3 font-bold text-slate-800">{fRp(t.saldo)}</td>
            <td className="px-5 py-3 text-slate-400 text-xs">{t.by||"-"}</td>
          </tr>
        ))}
      </tbody>
    </table></div></Card>
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-2xl font-black text-slate-900">Mutasi Keuangan</h1>
          <p className="text-slate-400 text-sm">Rekening Bank &amp; Kas Operasional</p></div>
        {isAdmin&&<Btn v="secondary" onClick={()=>setShowTrf(true)}>🔄 Transfer Bank → Kas</Btn>}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[{l:"Saldo Bank",v:fRp(bankSaldoAkhir),c:"blue"},{l:"Saldo Kas",v:fRp(kasSaldoAkhir),c:"amber"},
          {l:"Total Masuk Bank",v:fRp(filterTx(bankTx).filter(t=>t.tipe==="masuk").reduce((s,t)=>s+t.jumlah,0)),c:"emerald"},
          {l:"Total Keluar Kas",v:fRp(filterTx(kasTxAll).filter(t=>t.tipe==="keluar").reduce((s,t)=>s+t.jumlah,0)),c:"red"}].map(s=>(
          <Card key={s.l} className="p-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.l}</p>
            <p className={`text-xl font-black mt-1 text-${s.c}-600`}>{s.v}</p>
          </Card>
        ))}
      </div>

      {isAdmin&&(
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div><h2 className="font-black text-slate-900">Saldo Awal</h2></div>
            <Btn v="secondary" size="sm" onClick={()=>setEditSaldo(!editSaldo)}><Edit size={14}/>Edit</Btn>
          </div>
          {editSaldo?(
            <div className="grid grid-cols-3 gap-3 items-end">
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Bank (Rp)</label><input type="number" className={inp} value={saldoForm.bank} onChange={e=>setSaldoForm({...saldoForm,bank:e.target.value})}/></div>
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Kas (Rp)</label><input type="number" className={inp} value={saldoForm.kas} onChange={e=>setSaldoForm({...saldoForm,kas:e.target.value})}/></div>
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Per Tanggal</label><input type="date" className={inp} value={saldoForm.tanggal} onChange={e=>setSaldoForm({...saldoForm,tanggal:e.target.value})}/></div>
              <Btn onClick={saveSaldo}>Simpan</Btn>
            </div>
          ):(
            <div className="flex gap-8">
              <div><p className="text-xs text-slate-400">Bank</p><p className="text-xl font-black text-blue-700">{fRp(+(settings.saldoAwal?.jumlah)||0)}</p></div>
              <div><p className="text-xs text-slate-400">Kas</p><p className="text-xl font-black text-amber-700">{fRp(+(settings.saldoKas?.jumlah)||0)}</p></div>
            </div>
          )}
        </Card>
      )}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex rounded-xl overflow-hidden border border-slate-200">
          {[["bank","🏦 Bank"],["kas","💵 Kas"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} className={`px-5 py-2 text-sm font-bold transition-all ${tab===t?"bg-blue-600 text-white":"bg-white text-slate-600 hover:bg-slate-50"}`}>{l}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-600">Periode:</label>
          <select value={fMonth} onChange={e=>setFMonth(e.target.value)} className={inp+" w-44"}>
            <option value="">Semua</option>
            {ms.map(m=><option key={m} value={m}>{mLbl(m)}</option>)}
          </select>
        </div>
      </div>

      {tab==="bank"&&<TxTable rows={bankRows}/>}
      {tab==="kas"&&<TxTable rows={kasRows}/>}

      {showTrf&&(
        <Modal title="Transfer Bank → Kas" onClose={()=>setShowTrf(false)}>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4 text-sm">
              <p>Saldo Bank: <strong>{fRp(bankSaldoAkhir)}</strong> | Saldo Kas: <strong>{fRp(kasSaldoAkhir)}</strong></p>
            </div>
            <div><label className="text-xs font-black text-slate-600 block mb-1">Jumlah Transfer (Rp)</label>
              <input type="number" className={inp} value={trfForm.jumlah||0} onChange={e=>setTrfForm({...trfForm,jumlah:+e.target.value})}/></div>
            <div><label className="text-xs font-black text-slate-600 block mb-1">Tanggal</label>
              <input type="date" className={inp} value={trfForm.tanggal} onChange={e=>setTrfForm({...trfForm,tanggal:e.target.value})}/></div>
            <div className="flex gap-2 justify-end">
              <Btn v="secondary" onClick={()=>setShowTrf(false)}>Batal</Btn>
              <Btn onClick={doTransfer}>Konfirmasi Transfer</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// ERROR BOUNDARY
// ═══════════════════════════════════════════════

export default function App() {
  const [role,        setRole]    = useState(null);
  const [user,        setUser]    = useState(null);
  const [page,        setPage]    = useState("dashboard");
  const [open,        setOpen]    = useState(true);
  const [loading,     setLoading] = useState(true);
  const [invoiceView, setIV]      = useState(null); // public invoice

  const [settings, setSettings] = useState(DEF);
  const [rooms,    setRooms]    = useState([]);
  const [tenants,  setTenants]  = useState([]);
  const [payments, setPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [audit,    setAudit]    = useState([]);

  useEffect(()=>{
    (async()=>{
      setLoading(true);

      // Check hash for public invoice view
      const hash = window.location.hash;
      if (hash.startsWith("#inv-")) {
        const id = hash.replace("#inv-","");
        const inv = await store.get(`km-inv-${id}`);
        setIV(inv || "notfound");
        setLoading(false);
        return;
      }

      let s = await store.get(SK.S); if (!s) { s=DEF; await store.set(SK.S,s); }
      let r = await store.get(SK.R); if (!r||r.length===0) { r=mkRooms(); await store.set(SK.R,r); }
      setSettings(s); setRooms(r);
      setTenants(  await store.get(SK.T)||[]);
      setPayments( await store.get(SK.P)||[]);
      setExpenses( await store.get(SK.E)||[]);
      setAudit(    await store.get(SK.A)||[]);
      const u = await store.get("km-users"); if(u&&u.length) setUsers(u);
      setKasTx(await store.get(SK.K)||[]);
      setLoading(false);
    })();
  },[]);

  const save = {
    settings: async (d)=>{ setSettings(d); await store.set(SK.S,d); },
    rooms:    async (d)=>{ setRooms(d);    await store.set(SK.R,d); },
    tenants:  async (d)=>{ setTenants(d);  await store.set(SK.T,d); },
    payments: async (d)=>{ setPayments(d); await store.set(SK.P,d); },
    expenses: async (d)=>{ setExpenses(d); await store.set(SK.E,d); },
    kas:      async (d)=>{ setKasTx(d);   await store.set(SK.K,d); },
  };

  const resetData = async (key) => {
    if (key==="payments"||key==="all") { setPayments([]); await store.set(SK.P,[]); }
    if (key==="expenses"||key==="all") { setExpenses([]); await store.set(SK.E,[]); }
    if (key==="audit"   ||key==="all") { setAudit([]);    await store.set(SK.A,[]); }
    if (key==="tenants" ||key==="all") {
      setTenants([]);
      const fresh = mkRooms(rooms.length);
      // preserve room config (nomor, lantai, tipe, harga) but reset status & penyewaId
      const reset = rooms.map(r=>({...r,status:"kosong",penyewaId:null}));
      setRooms(reset); await store.set(SK.R,reset);
      await store.set(SK.T,[]);
    }
    if (key==="all") {
      const reset = rooms.map(r=>({...r,status:"kosong",penyewaId:null}));
      setRooms(reset); await store.set(SK.R,reset);
    }
    alert("✓ Data berhasil dihapus!");
  };

  const addAudit = useCallback(async (action, detail) => {
    const cur = await store.get(SK.A)||[];
    const entry = {id:uid(),action,detail,by:user,role,at:now()};
    const updated = [entry,...cur].slice(0,500);
    setAudit(updated);
    await store.set(SK.A,updated);
  },[user,role]);

  // Restore session on load
  useEffect(()=>{
    try {
      const saved = localStorage.getItem("km-session");
      if (saved) { const {u,r}=JSON.parse(saved); if(u&&r){setUser(u);setRole(r);} }
    } catch {}
  },[]);

  const roleLabel = (userId) => {
    const u = users.find(x=>x.id===userId);
    return u ? `${u.nama} (${u.role})` : userId;
  };

  const saveUsers = async (data) => { setUsers(data); await store.set("km-users", data); };

  const login = (userObj) => {
    setUser(userObj.id); setRole(userObj.role);
    try { localStorage.setItem("km-session", JSON.stringify({u:userObj.id,r:userObj.role})); } catch {}
  };

  const logout = () => {
    setUser(null); setRole(null); setPage("dashboard");
    try { localStorage.removeItem("km-session"); } catch {}
  };

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-blue-950">
      <div className="text-center">
        <div className="w-14 h-14 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"/>
        <p className="text-blue-200 font-bold text-lg">Kos Meruya</p>
        <p className="text-slate-400 text-sm mt-1">Memuat data...</p>
      </div>
    </div>
  );

  // Public invoice view — no login required
  if (invoiceView) return <InvoicePublicView inv={invoiceView==="notfound"?null:invoiceView}/>;

  if (!role) return <LoginScreen settings={settings} users={users} onLogin={login}/>;

  const ctx = { role, user, settings, rooms, tenants, payments, expenses, audit, users,
    saveSettings:save.settings, saveRooms:save.rooms, saveTenants:save.tenants,
    savePayments:save.payments, saveExpenses:save.expenses, addAudit, saveUsers, kasTx, saveKas:save.kas };

  return (
    <Layout page={page} setPage={setPage} role={role} user={user} onLogout={logout}
            expenses={expenses} open={open} setOpen={setOpen}>
      <ErrorBoundary>

      {page==="dashboard" && <Dashboard {...ctx} setPage={setPage}/>}
      {page==="rooms"     && <RoomsPage {...ctx}/>}
      {page==="tenants"   && <TenantsPage {...ctx}/>}
      {page==="payments"  && <PaymentsPage {...ctx}/>}
      {page==="expenses"  && <ExpensesPage {...ctx}/>}
      {page==="invoices"  && <InvoicesPage {...ctx}/>}
      {page==="reports"   && (role==="admin"||role==="investor") && <ReportsPage {...ctx}/>}
      {page==="settings"  && role==="admin" && <SettingsPage {...ctx} onReset={resetData}/>}
      {page==="audit"     && (role==="admin"||role==="investor") && <AuditPage {...ctx}/>}

      {page==="mutasi"    && (role==="admin"||role==="investor") && <MutasiBankKasPage {...ctx}/>}
      {page==="status"    && <StatusBayarPage {...ctx}/>}
      </ErrorBoundary>
    </Layout>
  );
}
