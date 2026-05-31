import { useState, useEffect } from "react";
import {
  Home, Grid, Users, CreditCard, Wallet, BarChart2, Settings,
  List, LogOut, Plus, Edit, Trash2, Check, X, AlertTriangle,
  Download, Eye, EyeOff, ChevronLeft, Bell, Search,
  Building, Menu, RefreshCw, CheckCircle, Clock, Shield, FileText, Link2, TrendingUp
} from "lucide-react";

const FB="https://kos-meruya-default-rtdb.asia-southeast1.firebasedatabase.app";
const FB_KEY="AIzaSyDubp1ZVhVNEEsEKldcnnMX4fEewfyGncg";
const FB_EMAIL="app@kosmeruya.com";
const FB_PASS="Ry201011!";
let _fbToken=null;
let _fbRt=null;
const fbAuth=async()=>{
  const r=await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FB_KEY}`,
    {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:FB_EMAIL,password:FB_PASS,returnSecureToken:true})});
  if(!r.ok)throw new Error("Firebase auth gagal");
  const d=await r.json(); _fbToken=d.idToken; _fbRt=d.refreshToken;
};
const fbRefresh=async()=>{
  try{const r=await fetch(`https://securetoken.googleapis.com/v1/token?key=${FB_KEY}`,
    {method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({grant_type:"refresh_token",refresh_token:_fbRt})});
  if(!r.ok)return;const d=await r.json();_fbToken=d.id_token;_fbRt=d.refresh_token;}catch{}
};
const toKey=(k)=>k.replace(/-/g,"_");
const store={
  get:async(k)=>{try{const auth=_fbToken?`?auth=${_fbToken}`:"";const r=await fetch(`${FB}/${toKey(k)}.json${auth}`);if(!r.ok)return null;const d=await r.json();if(d===null)return null;return typeof d==="string"?JSON.parse(d):d;}catch{return null;}},
  set:async(k,v)=>{try{const auth=_fbToken?`?auth=${_fbToken}`:"";if(v===null){const r=await fetch(`${FB}/${toKey(k)}.json${auth}`,{method:"DELETE"});return r.ok;}const r=await fetch(`${FB}/${toKey(k)}.json${auth}`,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(JSON.stringify(v))});return r.ok;}catch{return false;}}
};

const SK={S:"km-settings",R:"km-rooms",T:"km-tenants",P:"km-payments",E:"km-expenses",A:"km-audit",K:"km-kas",BH:"km-bagihasil"};

// Firebase sometimes returns objects instead of arrays — always convert
const toArr=(v)=>{
  if(!v) return null;
  if(Array.isArray(v)) return v;
  if(typeof v==="string"){try{const p=JSON.parse(v);return Array.isArray(p)?p:null;}catch{return null;}}
  if(typeof v==="object") return Object.values(v);
  return null;
};
// Read session synchronously — prevents React DOM reconciliation errors
const _sess = (()=>{
  try{const s=localStorage.getItem("km-session");if(s){const{u,r}=JSON.parse(s);if(u&&r)return{u,r};}}catch{}
  return null;
})();



const DEF_USERS=[{id:"admin",nama:"Ricy Candra",role:"admin",password:"1234"},{id:"ricy",nama:"Ricy Candra",role:"investor",password:"1111"},{id:"arief",nama:"Arief Wahyudi",role:"investor",password:"2222"},{id:"ferry",nama:"Ferry Lukas",role:"investor",password:"3333"},{id:"staff",nama:"Karyawan Operasional",role:"staff",password:"0000"}];

// Daftar menu yang bisa diatur aksesnya
const MENU_KEYS = ["rooms","tenants","payments","expenses","invoices","mutasi","reports","bagihasil","settings","audit"];
const MENU_LABELS = {rooms:"Kamar",tenants:"Penyewa",payments:"Pembayaran",expenses:"Kas & Keluar",invoices:"Invoice",mutasi:"Mutasi Keuangan",reports:"Laporan",bagihasil:"Bagi Hasil",settings:"Pengaturan",audit:"Log Aktivitas"};

// Permission default per role - dipakai jika user tidak punya perms custom
const DEFAULT_PERMS = {
  admin:    {rooms:"edit",tenants:"edit",payments:"edit",expenses:"edit",invoices:"edit",mutasi:"edit",reports:"edit",bagihasil:"edit",settings:"edit",audit:"edit"},
  investor: {rooms:"view",tenants:"view",payments:"view",expenses:"view",invoices:"view",mutasi:"view",reports:"view",bagihasil:"none",settings:"none",audit:"view"},
  staff:    {rooms:"view",tenants:"edit",payments:"edit",expenses:"edit",invoices:"edit",mutasi:"none",reports:"none",bagihasil:"none",settings:"none",audit:"none"},
};

const getPerms = (u) => u?.perms || DEFAULT_PERMS[u?.role] || {};


const DEF = {
  kasOperasional: 10000000,
  feeManager: 10,
  kepemilikan: { ricy: 43.501, arief: 29.150, ferry: 27.352 },
  pins: { admin:"1234", ricy:"1111", arief:"2222", ferry:"3333", staff:"0000" },
  companyInfo: { name:"Kos Meruya", address:"", phone:"", email:"" },
  bankAccounts: [],
  roomTypes: [
    { id:"rt1", nama:"Standard", harga:0 },
    { id:"rt2", nama:"AC", harga:0 },
    { id:"rt3", nama:"Deluxe", harga:0 },
  ],
};

const uid  = () => Math.random().toString(36).substr(2,9) + Date.now().toString(36);
const now  = () => new Date().toISOString();
const fRp  = (n) => "Rp " + Math.round(n||0).toLocaleString("id-ID");
const fD   = (d) => d ? new Date(d).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}) : "-";
const tMon = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; };
const mLbl = (ym) => { if(!ym) return ""; const [y,m]=ym.split("-"); return ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][+m-1]+" "+y; };
const months6 = () => Array.from({length:6},(_,i)=>{ const d=new Date(); d.setMonth(d.getMonth()-i); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`; });

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
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${s[size]} max-h-[90vh] overflow-y-auto mx-2 sm:mx-0`}>
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

function CollapseCard({ title, icon:Icon, badge, defaultOpen=false, danger, children }) {
  const [open,setOpen]=useState(defaultOpen);
  return (
    <Card className={`overflow-hidden ${danger?"border-2 border-red-100":""}`}>
      <button onClick={()=>setOpen(!open)} className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition text-left">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={20} className={danger?"text-red-500":"text-blue-600"}/>}
          <h2 className={`font-black ${danger?"text-red-700":"text-slate-900"}`}>{title}</h2>
          {badge && <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{badge}</span>}
        </div>
        <span className={`text-sm font-bold flex-shrink-0 ${open?"text-blue-600":"text-slate-400"}`}>{open?"▲":"▼"}</span>
      </button>
      {open && <div className="px-6 pb-6">{children}</div>}
    </Card>
  );
}

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
  const [uid,setUid]=useState(""); const [pwd,setPwd]=useState("");
  const [show,setShow]=useState(false); const [err,setErr]=useState("");
  const nm=settings?.companyInfo?.name||"Kos Meruya";
  const go=()=>{
    if(!uid||!pwd)return setErr("ID dan password wajib diisi");
    const u=(users||DEF_USERS).find(x=>x.id.toLowerCase()===uid.toLowerCase()&&x.password===pwd);
    if(!u)return setErr("ID atau password salah");
    onLogin(u);
  };
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#0f172a,#1e3a5f)",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"rgba(255,255,255,0.1)",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:24,width:"100%",maxWidth:380,padding:32}}>
        <div style={{textAlign:"center",marginBottom:32}}>
          <div style={{width:72,height:72,background:"linear-gradient(135deg,#3b82f6,#6366f1)",borderRadius:16,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><Building size={32} color="white"/></div>
          <h1 style={{color:"white",fontSize:28,fontWeight:900,margin:0}}>{nm}</h1>
          <p style={{color:"rgba(147,197,253,0.7)",fontSize:14,marginTop:4}}>Sistem Manajemen Properti</p>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div>
            <label style={{color:"rgba(255,255,255,0.6)",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:2,display:"block",marginBottom:8}}>ID Pengguna</label>
            <input value={uid} onChange={e=>setUid(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="Masukkan ID"
              style={{width:"100%",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:12,padding:"12px 16px",color:"white",fontSize:14,outline:"none",boxSizing:"border-box"}}/>
          </div>
          <div style={{position:"relative"}}>
            <label style={{color:"rgba(255,255,255,0.6)",fontSize:11,fontWeight:700,textTransform:"uppercase",letterSpacing:2,display:"block",marginBottom:8}}>Password</label>
            <input type={show?"text":"password"} value={pwd} onChange={e=>setPwd(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="Masukkan password"
              style={{width:"100%",background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.2)",borderRadius:12,padding:"12px 48px 12px 16px",color:"white",fontSize:14,outline:"none",boxSizing:"border-box"}}/>
            <button onClick={()=>setShow(!show)} style={{position:"absolute",right:12,bottom:10,background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",padding:4}}>
              {show?<EyeOff size={16}/>:<Eye size={16}/>}
            </button>
          </div>
          {err&&<p style={{color:"#f87171",fontSize:13,textAlign:"center",margin:0}}>{err}</p>}
          <button onClick={go} style={{background:"linear-gradient(135deg,#3b82f6,#6366f1)",color:"white",border:"none",borderRadius:12,padding:"14px",fontSize:14,fontWeight:700,cursor:"pointer",width:"100%"}}>
            Masuk →
          </button>
        </div>
      </div>
    </div>
  );
}

function Layout({ children, page, setPage, role, user, onLogout, expenses, open, setOpen, myPerms, users, saveUsers, addAudit }) {
  const [cpModal, setCpModal] = useState(false);
  const [cpForm, setCpForm] = useState({lama:"",baru:"",konfirmasi:""});
  const [cpErr, setCpErr] = useState("");

  const doChangePass = async () => {
    const me = (users||[]).find(u=>u.id===user);
    if(!me) return;
    if(me.password !== cpForm.lama) { setCpErr("Password lama salah."); return; }
    if(cpForm.baru.length < 4) { setCpErr("Password baru minimal 4 karakter."); return; }
    if(cpForm.baru !== cpForm.konfirmasi) { setCpErr("Konfirmasi tidak cocok."); return; }
    const updated = (users||[]).map(u=>u.id===user?{...u,password:cpForm.baru}:u);
    await saveUsers(updated);
    await addAudit("GANTI_PASS", `${user} mengganti password`);
    setCpModal(false); setCpForm({lama:"",baru:"",konfirmasi:""}); setCpErr("");
    alert("✅ Password berhasil diganti!");
  };
  const NAV = [
    { id:"dashboard", icon:Home,      label:"Dashboard",       roles:["admin","investor","staff"] },
    { id:"rooms",     icon:Grid,      label:"Kamar",           roles:["admin","investor","staff"] },
    { id:"tenants",   icon:Users,     label:"Penyewa",         roles:["admin","investor","staff"] },
    { id:"expenses",  icon:Wallet,    label:"Kas & Keluar",    roles:["admin","investor","staff"] },
    { id:"invoices",  icon:FileText,  label:"Invoice",         roles:["admin","investor","staff"] },
    { id:"mutasi",    icon:TrendingUp,label:"Mutasi Keuangan", roles:["admin","investor"] },
    { id:"reports",   icon:BarChart2, label:"Laporan",         roles:["admin","investor"] },
    { id:"bagihasil", icon:TrendingUp,label:"Bagi Hasil",      roles:["admin"] },
    { id:"settings",  icon:Settings,  label:"Pengaturan",      roles:["admin"] },
    { id:"audit",     icon:List,      label:"Log Aktivitas",   roles:["admin","investor"] },
  ].filter(n => n.roles.includes(role) && (n.id==="dashboard" || !myPerms || myPerms[n.id]!=="none"));

  const pending = expenses.filter(e=>e.status==="pending").length;
  const uLabel = { admin:"Admin 👑", ricy:"Investor Ricy", arief:"Investor Arief", ferry:"Investor Ferry", staff:"Staff Operasional" }[user]||user;
  const navClick = (id) => { setPage(id); if(window.innerWidth<768) setOpen(false); };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Mobile backdrop */}
      {open && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={()=>setOpen(false)}/>}

      {/* Sidebar */}
      <aside className={`fixed md:relative z-50 h-full bg-slate-900 flex flex-col flex-shrink-0 transition-all duration-300 ease-in-out ${open?"w-60 translate-x-0":"-translate-x-full md:translate-x-0 w-60 md:w-16"}`}>
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
              <button key={n.id} onClick={()=>navClick(n.id)}
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
          <button onClick={()=>setCpModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition text-sm font-medium mb-1">
            <Shield size={16}/>
            {open && "Ganti Password"}
          </button>
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-slate-800 transition text-sm font-medium">
            <LogOut size={18}/>
            {open && "Keluar"}
          </button>
        </div>
      </aside>

      {cpModal&&(
        <Modal title="Ganti Password" onClose={()=>{setCpModal(false);setCpErr("");}}>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-700 font-medium">Login: <strong>{user}</strong></div>
            {cpErr&&<p className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-lg">{cpErr}</p>}
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Password Lama</label>
              <input type="password" className={inp} value={cpForm.lama} onChange={e=>setCpForm({...cpForm,lama:e.target.value})} placeholder="Masukkan password lama"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Password Baru</label>
              <input type="password" className={inp} value={cpForm.baru} onChange={e=>setCpForm({...cpForm,baru:e.target.value})} placeholder="Minimal 4 karakter"/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Konfirmasi Password Baru</label>
              <input type="password" className={inp} value={cpForm.konfirmasi} onChange={e=>setCpForm({...cpForm,konfirmasi:e.target.value})} placeholder="Ulangi password baru"/>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Btn v="secondary" onClick={()=>{setCpModal(false);setCpErr("");}}>Batal</Btn>
              <Btn onClick={doChangePass}>Simpan Password</Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Main */}
      <main className="flex-1 overflow-y-auto w-full">
        {/* Mobile top bar */}
        <div className="md:hidden sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200 px-4 py-3 flex items-center justify-between">
          <button onClick={()=>setOpen(true)} className="p-1.5 hover:bg-slate-100 rounded-lg transition"><Menu size={20} className="text-slate-700"/></button>
          <p className="font-black text-slate-900 text-sm">Kos Meruya</p>
          <button onClick={onLogout} className="p-1.5 hover:bg-slate-100 rounded-lg transition"><LogOut size={18} className="text-slate-400"/></button>
        </div>
        <div className="p-3 md:p-6 max-w-7xl mx-auto min-h-full">
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
  const terisi   = tenants.filter(t=>t.aktif).length;
  const kosong   = rooms.length - terisi;
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

  // Expiring tenants (Berlaku s/d ≤ 7 hari)
  const [tInvDash, setTInvDash] = useState([]);
  useEffect(()=>{ store.get("km-invoices").then(d=>setTInvDash(toArr(d)||[])); },[tenants]);
  const expiring = tenants.filter(t=>{
    if(!t.aktif) return false;
    const paidInvs = tInvDash.filter(i=>i.tenantId===t.id&&(i.paid||(i.invPayments||[]).reduce((s,p)=>s+(+p.amount||0),0)>=(+i.nominal||0)));
    const dates = paidInvs.map(i=>i.periode?.end).filter(Boolean).sort();
    const berlaku = dates[dates.length-1];
    if(!berlaku) return false;
    const diff = Math.ceil((new Date(berlaku)-today)/(864e5));
    return diff<=7;
  }).map(t=>{
    const paidInvs = tInvDash.filter(i=>i.tenantId===t.id&&(i.paid||(i.invPayments||[]).reduce((s,p)=>s+(+p.amount||0),0)>=(+i.nominal||0)));
    const dates = paidInvs.map(i=>i.periode?.end).filter(Boolean).sort();
    const berlaku = dates[dates.length-1];
    const diff = Math.ceil((new Date(berlaku)-today)/(864e5));
    return {...t, berlaku, diff};
  }).sort((a,b)=>a.diff-b.diff);

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
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-0.5">{mLbl(cm)} · {today.toLocaleDateString("id-ID",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map(s => (
          <Card key={s.label} className="p-5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{s.label}</p>
            <p className={`text-2xl font-black mt-2 text-${s.color}-600`}>{s.value}</p>
            <p className="text-xs text-slate-400 mt-1">{s.sub}</p>
          </Card>
        ))}
      </div>

      {expiring.length>0&&(
        <Card className="overflow-hidden border-l-4 border-red-400">
          <div className="px-5 py-4 flex items-center gap-2">
            <Bell size={18} className="text-red-500"/>
            <h2 className="font-black text-slate-900">Masa Berlaku Hampir Habis</h2>
            <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{expiring.length} penyewa</span>
          </div>
          <div className="px-5 pb-4 space-y-2">
            {expiring.map(t=>{
              const room=rooms.find(r=>r.id===t.kamarId);
              return(
                <div key={t.id} className={`flex items-center justify-between px-3 py-2.5 rounded-xl ${t.diff<=0?"bg-red-50":"bg-amber-50"}`}>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{t.nama} · K-{room?.nomor||"?"}</p>
                    <p className="text-xs text-slate-400">Berlaku s/d: <span className={`font-bold ${t.diff<=0?"text-red-600":"text-amber-600"}`}>{t.diff<=0?`Sudah habis ${Math.abs(t.diff)} hari lalu`:t.diff===0?"Hari ini":t.diff===1?"Besok":`${t.diff} hari lagi`}</span></p>
                  </div>
                  <button onClick={()=>setPage("invoices")} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl">Buat Invoice</button>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {isInv && (
        <Card className="p-6">
          <h2 className="font-black text-slate-900 mb-1">Estimasi Bagi Hasil</h2>
          <p className="text-slate-400 text-sm mb-5">{mLbl(cm)}</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
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
                  <p className="text-xs text-slate-400">Kamar {room?.nomor}</p>
                </div>
                <Badge status="telat"/>
              </div>
            );
          })}
        </Card>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// ROOMS PAGE
// ═══════════════════════════════════════════════
function RoomsPage({ role, rooms, tenants, payments, saveRooms, addAudit, myPerms, settings }) {
  const canEdit = myPerms?.rooms==="edit";
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
  const isAdmin = canEdit;

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
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">Kamar</h1>
          <p className="text-slate-400 text-sm">{rooms.length} kamar total</p>
        </div>
        {isAdmin && <Btn onClick={openAdd}><Plus size={16}/>Tambah Kamar</Btn>}
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-600">Status:</label>
          <select value={filter} onChange={e=>setFilter(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="semua">Semua</option>
            <option value="kosong">Kosong</option>
            <option value="terisi">Terisi</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-600">Lantai:</label>
          <select value={lantai} onChange={e=>setLantai(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="semua">Semua Lantai</option>
            {lantais.map(l=><option key={l} value={String(l)}>Lantai {l}</option>)}
          </select>
        </div>
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

      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-11 gap-2">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Lantai</label>
                <select className={inp} value={form.lantai||1} onChange={e=>setForm({...form,lantai:+e.target.value})}>
                  {[1,2,3,4].map(l=><option key={l} value={l}>Lantai {l}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Tipe</label>
                <select className={inp} value={form.tipe||""} onChange={e=>{
                  const tipe=e.target.value;
                  const rt=(settings.roomTypes||[]).find(t=>t.nama===tipe);
                  setForm({...form, tipe, harga:rt?.harga||form.harga||0});
                }}>
                  {(settings.roomTypes||[{nama:"Standard"},{nama:"AC"},{nama:"Deluxe"}]).map(t=><option key={t.nama} value={t.nama}>{t.nama}{t.harga?` (${fRp(t.harga)})`:""}</option>)}
                  {form.tipe&&!(settings.roomTypes||[]).some(t=>t.nama===form.tipe)&&<option value={form.tipe}>{form.tipe} (tidak ada di setting)</option>}
                </select></div>
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Harga Sewa/Bulan (Rp)</label>
                <input type="number" className={inp} value={form.harga||0} onChange={e=>setForm({...form,harga:e.target.value})}/>
                <p className="text-[11px] text-slate-400 mt-1">Otomatis dari tipe. Bisa dioverride manual.</p></div>
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
function TenantsPage({ role, rooms, tenants, saveTenants, saveRooms, addAudit, myPerms }) {
  const canEdit = myPerms?.tenants==="edit";
  const [modal,   setModal]  = useState(null);
  const [form,    setForm]   = useState({});
  const [search,  setSearch] = useState("");
  const [coModal, setCoModal]= useState(null);
  const [coForm,  setCoForm] = useState({dikembalikan:0,catatan:""});
  const [showAlumni, setShowAlumni] = useState(false);
  const [sortBy, setSortBy] = useState("nama");
  const [detailModal, setDetailModal] = useState(null);
  const [tInvoices, setTInvoices] = useState([]);
  const isEdit = canEdit;

  useEffect(()=>{store.get("km-invoices").then(d=>setTInvoices(toArr(d)||[]));},[tenants]);

  const getBerlaku = (t) => {
    const invs = tInvoices.filter(i=>i.tenantId===t.id);
    const paidInvs = invs.filter(i=>{
      const paid = (i.invPayments||[]).reduce((s,p)=>s+(+p.amount||0),0);
      return i.paid || paid >= (+i.nominal||0);
    });
    if(paidInvs.length===0) return null;
    const dates = paidInvs.map(i=>i.periode?.end).filter(Boolean).sort();
    return dates[dates.length-1]||null;
  };

  const handleKtpUpload = async (e, t) => {
    const file = e.target.files?.[0];
    if(!file) return;
    if(file.size>2*1024*1024) return alert("Ukuran KTP max 2MB");
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target.result;
      await saveTenants(tenants.map(x=>x.id===t.id?{...x,ktpImage:base64}:x));
      setDetailModal({...t, ktpImage:base64});
      await addAudit("KTP_UPLOAD",`KTP ${t.nama} diupload`);
    };
    reader.readAsDataURL(file);
  };

  const filtered = tenants
    .filter(t=>showAlumni ? !t.aktif : t.aktif)
    .filter(t=>!search||t.nama?.toLowerCase().includes(search.toLowerCase())||t.hp?.includes(search))
    .sort((a,b)=>{
      if(sortBy==="nama") return (a.nama||"").localeCompare(b.nama||"");
      if(sortBy==="kamar"){const ra=rooms.find(r=>r.id===a.kamarId);const rb=rooms.find(r=>r.id===b.kamarId);return (ra?.nomor||0)-(rb?.nomor||0);}
      if(sortBy==="lantai"){const ra=rooms.find(r=>r.id===a.kamarId);const rb=rooms.find(r=>r.id===b.kamarId);return (ra?.lantai||0)-(rb?.lantai||0);}
      if(sortBy==="berlaku"){const ba=getBerlaku(a);const bb=getBerlaku(b);if(!ba&&!bb)return 0;if(!ba)return 1;if(!bb)return -1;return new Date(ba)-new Date(bb);}
      return 0;
    });

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
      if (tenants.some(t=>t.aktif&&t.kamarId===form.kamarId)) return alert("Kamar sudah ada penyewa aktif!");
      const t = {...form,id:uid(),aktif:true,depositStatus:"disimpan"};
      await saveTenants([...tenants,t]);
      await saveRooms(rooms.map(r=>r.id===form.kamarId?{...r,status:"terisi",penyewaId:t.id}:r));
      await addAudit("PENYEWA_MASUK",`${form.nama} masuk kamar ${room?.nomor}`);
    } else {
      const kamarBerubah = form.kamarId !== modal.kamarId;
      if (kamarBerubah) {
        const newRoom = rooms.find(r=>r.id===form.kamarId);
        if (newRoom?.status==="terisi"||tenants.some(t=>t.aktif&&t.id!==modal.id&&t.kamarId===form.kamarId))
          return alert("Kamar tujuan sudah terisi!");
        await saveRooms(rooms.map(r=>{
          if(r.id===modal.kamarId) return {...r,status:"kosong",penyewaId:null};
          if(r.id===form.kamarId) return {...r,status:"terisi",penyewaId:modal.id};
          return r;
        }));
        const oldRoom = rooms.find(r=>r.id===modal.kamarId);
        await addAudit("PENYEWA_PINDAH",`${form.nama} pindah dari K-${oldRoom?.nomor} ke K-${newRoom?.nomor}`);
      }
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

  const avail = rooms.filter(r=>{
    if(modal&&modal!=="add"&&r.id===modal.kamarId) return true;
    if(r.status!=="kosong") return false;
    if(tenants.some(t=>t.aktif&&t.kamarId===r.id)) return false;
    return true;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl sm:text-2xl font-black text-slate-900">Penyewa</h1>
          <p className="text-slate-400 text-sm">{tenants.filter(t=>t.aktif).length} aktif · {tenants.filter(t=>!t.aktif).length} alumni</p></div>
        {isEdit && <Btn onClick={openAdd}><Plus size={16}/>Tambah Penyewa</Btn>}
      </div>

      <div className="relative">
        <Search size={15} className="absolute left-4 top-3 text-slate-400"/>
        <input className={inp+" pl-10"} placeholder="Cari nama atau HP..." value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {/* Filter & Sort bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-xl overflow-hidden border border-slate-200">
          <button onClick={()=>setShowAlumni(false)} className={`px-4 py-2 text-sm font-bold transition-all ${!showAlumni?"bg-blue-600 text-white":"bg-white text-slate-600"}`}>Aktif ({tenants.filter(t=>t.aktif).length})</button>
          <button onClick={()=>setShowAlumni(true)} className={`px-4 py-2 text-sm font-bold transition-all ${showAlumni?"bg-blue-600 text-white":"bg-white text-slate-600"}`}>Alumni ({tenants.filter(t=>!t.aktif).length})</button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-600">Urutkan:</label>
          <select value={sortBy} onChange={e=>setSortBy(e.target.value)} className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none">
            <option value="nama">Nama A-Z</option>
            <option value="kamar">Nomor Kamar</option>
            <option value="lantai">Lantai</option>
            <option value="berlaku">Berlaku s/d</option>
          </select>
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              {["Kamar","Lantai","Nama","HP","Masuk","Berlaku s/d","Deposit","Status",""].map(h=>(
                <th key={h} className="text-left px-5 py-3.5 text-xs font-bold text-slate-400 uppercase tracking-widest">{h}</th>
              ))}
            </tr></thead>
            <tbody>
              {filtered.length===0&&<tr><td colSpan={10} className="text-center py-10 text-slate-400 text-sm">Belum ada data penyewa</td></tr>}
              {filtered.map(t=>{
                const room=rooms.find(r=>r.id===t.kamarId);
                return (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/80 transition">
                    <td className="px-5 py-3.5 font-black text-blue-600">K-{room?.nomor||"—"}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-sm">Lt {room?.lantai||"—"}</td>
                    <td className="px-5 py-3.5 font-bold text-blue-600 cursor-pointer hover:underline" onClick={()=>setDetailModal(t)}>{t.nama}</td>
                    <td className="px-5 py-3.5 text-slate-500">{t.hp||"—"}</td>
                    <td className="px-5 py-3.5 text-slate-500">{fD(t.tanggalMasuk)}</td>
                    <td className="px-5 py-3.5">{(()=>{
                      if(!t.aktif) return <span className="text-slate-400">{t.tanggalKeluar?fD(t.tanggalKeluar):"—"}</span>;
                      const b=getBerlaku(t);
                      if(!b) return <span className="text-slate-300">—</span>;
                      const exp=new Date(b); const now2=new Date(); const diff=Math.ceil((exp-now2)/(1000*60*60*24));
                      return <span className={`text-xs font-bold ${diff<7?"text-red-600":diff<30?"text-amber-600":"text-emerald-600"}`}>{fD(b)}{diff<0?" (lewat)":`  (${diff}hr)`}</span>;
                    })()}</td>
                    <td className="px-5 py-3.5 text-slate-500">{fRp(t.deposit)}</td>
                    <td className="px-5 py-3.5"><Badge status={t.aktif?"aktif":"keluar"}/></td>
                    <td className="px-5 py-3.5">
                      <div className="flex gap-1.5">
                        <button onClick={()=>setDetailModal(t)} className="p-1.5 hover:bg-blue-50 rounded-lg text-blue-400 hover:text-blue-700 transition"><Eye size={14}/></button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

      {/* Detail Penyewa Modal */}
      {detailModal&&(()=>{
        const t=detailModal;
        const room=rooms.find(r=>r.id===t.kamarId);
        const invs=tInvoices.filter(i=>i.tenantId===t.id).sort((a,b)=>new Date(b.generatedAt||0)-new Date(a.generatedAt||0));
        const berlaku=getBerlaku(t);
        return (
          <Modal title={`Detail — ${t.nama}`} onClose={()=>setDetailModal(null)} size="lg">
            <div className="space-y-5">
              {/* Info */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-4 text-sm">
                <div><span className="text-slate-400">Kamar:</span> <span className="font-bold text-blue-600">K-{room?.nomor||"?"} (Lt {room?.lantai})</span></div>
                <div><span className="text-slate-400">HP:</span> <span className="font-bold">{t.hp||"—"}</span></div>
                <div><span className="text-slate-400">Masuk:</span> <span className="font-bold">{fD(t.tanggalMasuk)}</span></div>
                <div><span className="text-slate-400">Tgl Masuk:</span> <span className="font-bold">{t.tanggalMasuk||"-"}</span></div>
                <div><span className="text-slate-400">Deposit:</span> <span className="font-bold">{fRp(t.deposit)}</span></div>
                <div><span className="text-slate-400">Berlaku s/d:</span> <span className={`font-black ${berlaku?"text-emerald-600":"text-slate-400"}`}>{berlaku?fD(berlaku):"Belum ada pembayaran"}</span></div>
                {t.ktp&&<div className="col-span-2"><span className="text-slate-400">No KTP:</span> <span className="font-bold">{t.ktp}</span></div>}
                {t.kontakDarurat&&<div className="col-span-2"><span className="text-slate-400">Kontak Darurat:</span> <span className="font-bold">{t.kontakDarurat} ({t.kontakDaruratHp})</span></div>}
                {t.catatan&&<div className="col-span-2"><span className="text-slate-400">Catatan:</span> {t.catatan}</div>}
              </div>

              {/* KTP */}
              <div className="bg-slate-50 rounded-xl p-4">
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Foto KTP</p>
                {t.ktpImage?(
                  <img src={t.ktpImage} alt="KTP" className="max-w-full max-h-48 rounded-xl border border-slate-200 mb-2"/>
                ):(
                  <p className="text-sm text-slate-400 mb-2">Belum ada foto KTP</p>
                )}
                <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg cursor-pointer transition">
                  📷 {t.ktpImage?"Ganti":"Upload"} KTP
                  <input type="file" accept="image/*" className="hidden" onChange={e=>handleKtpUpload(e,t)}/>
                </label>
              </div>

              {/* Invoice & Payment History */}
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Riwayat Invoice & Pembayaran</p>
                {invs.length===0&&<p className="text-sm text-slate-400 text-center py-4">Belum ada invoice</p>}
                <div className="space-y-2">
                  {invs.map(inv=>{
                    const paid=(inv.invPayments||[]).reduce((s,p)=>s+(+p.amount||0),0);
                    const lunas=inv.paid||paid>=(+inv.nominal||0);
                    return (
                      <div key={inv.id} className={`rounded-xl p-3 border ${lunas?"border-emerald-200 bg-emerald-50/50":"border-slate-200 bg-white"}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-bold text-slate-800">{inv.invoiceNo}</p>
                            <p className="text-xs text-slate-400">{inv.periode?.label}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-black text-sm">{fRp(inv.nominal)}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lunas?"bg-emerald-100 text-emerald-700":paid>0?"bg-amber-100 text-amber-700":"bg-red-100 text-red-600"}`}>
                              {lunas?"Lunas":paid>0?`Sebagian (${fRp(paid)})`:"Belum Bayar"}
                            </span>
                          </div>
                        </div>
                        {(inv.invPayments||[]).length>0&&(
                          <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                            {(inv.invPayments||[]).map(p=>(
                              <div key={p.id} className="flex justify-between text-[11px]">
                                <span className="text-slate-500">{fD(p.date)} · {p.method==="transfer"?"Transfer":"Cash"}{p.bank?` ${p.bank}`:""}</span>
                                <span className="font-bold text-emerald-700">{fRp(p.amount)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}
// ═══════════════════════════════════════════════
function PaymentsPage({ role, user, rooms, tenants, payments, savePayments, addAudit , myPerms }) {
  const canEdit = myPerms?.payments==="edit";
  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState({});
  const [fBulan, setFBulan] = useState(String(new Date().getMonth()+1).padStart(2,"0"));
  const [fTahun, setFTahun] = useState(String(new Date().getFullYear()));
  const isEdit = canEdit;
  const fMonth = `${fTahun}-${fBulan}`;
  const bulanList = [{v:"01",l:"Januari"},{v:"02",l:"Februari"},{v:"03",l:"Maret"},{v:"04",l:"April"},{v:"05",l:"Mei"},{v:"06",l:"Juni"},{v:"07",l:"Juli"},{v:"08",l:"Agustus"},{v:"09",l:"September"},{v:"10",l:"Oktober"},{v:"11",l:"November"},{v:"12",l:"Desember"}];
  const tahunList = Array.from({length:3},(_,i)=>String(new Date().getFullYear()-i));

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
        <div><h1 className="text-xl sm:text-2xl font-black text-slate-900">Pembayaran Sewa</h1>
          <p className="text-slate-400 text-sm">{filtered.length} transaksi · {fRp(total)}</p></div>
        {isEdit&&<Btn onClick={openAdd}><Plus size={16}/>Input Pembayaran</Btn>}
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-bold text-slate-600">Periode:</label>
        <select value={fBulan} onChange={e=>setFBulan(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {bulanList.map(b=><option key={b.v} value={b.v}>{b.l}</option>)}
        </select>
        <select value={fTahun} onChange={e=>setFTahun(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {tahunList.map(t=><option key={t} value={t}>{t}</option>)}
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
                const t=tenants.find(x=>x.id===p.penyewaId); const room=rooms.find(r=>r.id===p.kamarId)||rooms.find(r=>r.id===t?.kamarId);
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Periode *</label>
                <select className={inp} value={form.periode} onChange={e=>setForm({...form,periode:e.target.value})}>
                  {Array.from({length:12},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-i);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;}).map(m=><option key={m} value={m}>{mLbl(m)}</option>)}</select></div>
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Nominal (Rp) *</label>
                <input type="number" className={inp} value={form.nominal||0} onChange={e=>setForm({...form,nominal:e.target.value})}/></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Metode</label>
                <select className={inp} value={form.metode} onChange={e=>setForm({...form,metode:e.target.value})}>
                  <option value="transfer">Transfer Bank</option><option value="tunai">Tunai</option></select></div>
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Bank</label>
                <input className={inp} placeholder="BCA, BRI, Mandiri..." value={form.bank||""} onChange={e=>setForm({...form,bank:e.target.value})}/></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Nama Pengirim</label>
                <input className={inp} value={form.pengirim||""} onChange={e=>setForm({...form,pengirim:e.target.value})}/></div>
              <div><label className="text-xs font-bold text-slate-600 block mb-1">No. Referensi</label>
                <input className={inp} value={form.referensi||""} onChange={e=>setForm({...form,referensi:e.target.value})}/></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
function ExpensesPage({ role, user, expenses, saveExpenses, addAudit, myPerms }) {
  const canEdit = myPerms?.expenses==="edit";
  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState({});
  const [fBulan, setFBulan] = useState(String(new Date().getMonth()+1).padStart(2,"0"));
  const [fTahun, setFTahun] = useState(String(new Date().getFullYear()));
  const fMonth = `${fTahun}-${fBulan}`;
  const bulanList = [{v:"01",l:"Januari"},{v:"02",l:"Februari"},{v:"03",l:"Maret"},{v:"04",l:"April"},{v:"05",l:"Mei"},{v:"06",l:"Juni"},{v:"07",l:"Juli"},{v:"08",l:"Agustus"},{v:"09",l:"September"},{v:"10",l:"Oktober"},{v:"11",l:"November"},{v:"12",l:"Desember"}];
  const tahunList = Array.from({length:3},(_,i)=>String(new Date().getFullYear()-i));
  const isEdit = canEdit;
  const isInv  = role==="admin"||role==="investor";
  const ms = months6();

  const filtered = expenses.filter(e=>e.periode===fMonth).sort((a,b)=>new Date(b.tanggal)-new Date(a.tanggal));
  const totApproved = filtered.filter(e=>e.status==="approved").reduce((s,e)=>s+e.nominal,0);
  const totPending  = filtered.filter(e=>e.status==="pending").reduce((s,e)=>s+e.nominal,0);

  const openAdd = () => {
    setForm({kategori:"Listrik",nominal:0,deskripsi:"",tanggal:new Date().toISOString().split("T")[0],periode:tMon()});
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
        <div><h1 className="text-xl sm:text-2xl font-black text-slate-900">Kas & Pengeluaran</h1>
          <p className="text-slate-400 text-sm">Disetujui: {fRp(totApproved)} · Pending: {fRp(totPending)}</p></div>
        {isEdit&&<Btn onClick={openAdd}><Plus size={16}/>Input Pengeluaran</Btn>}
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm font-bold text-slate-600">Periode:</label>
        <select value={fBulan} onChange={e=>setFBulan(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {bulanList.map(b=><option key={b.v} value={b.v}>{b.l}</option>)}
        </select>
        <select value={fTahun} onChange={e=>setFTahun(e.target.value)}
          className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          {tahunList.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100">
              {["Tgl","Kategori","Deskripsi","Nominal","Status","Approval",""].map(h=>(
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Kategori</label>
                <select className={inp} value={form.kategori} onChange={e=>setForm({...form,kategori:e.target.value})}>
                  {["Listrik","Air","Kebersihan","Keamanan","Pemeliharaan","Iuran RT/RW","Lain-lain"].map(c=><option key={c}>{c}</option>)}</select></div>
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Periode</label>
                <select className={inp} value={form.periode} onChange={e=>setForm({...form,periode:e.target.value})}>
                  {ms.map(m=><option key={m} value={m}>{mLbl(m)}</option>)}</select></div>
            </div>
            <div><label className="text-xs font-bold text-slate-600 block mb-1">Deskripsi *</label>
              <input className={inp} value={form.deskripsi||""} onChange={e=>setForm({...form,deskripsi:e.target.value})} placeholder="Tagihan PLN bulan Mei..."/></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Nominal (Rp) *</label>
                <input type="number" className={inp} value={form.nominal||0} onChange={e=>setForm({...form,nominal:e.target.value})}/>
                {+form.nominal>5000000&&<p className="text-xs text-amber-600 mt-1.5 font-semibold">⚠ &gt; Rp 5 juta — butuh 2 approval investor</p>}
              </div>
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Tanggal</label>
                <input type="date" className={inp} value={form.tanggal||""} onChange={e=>setForm({...form,tanggal:e.target.value})}/></div>
            </div>
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
function ReportsPage({ rooms, tenants, payments, expenses, settings, audit, kasTx, bagiHasil }) {
  const [fBulan, setFBulan] = useState(String(new Date().getMonth()+1).padStart(2,"0"));
  const [fTahun, setFTahun] = useState(String(new Date().getFullYear()));
  const [tab, setTab] = useState("pendapatan");
  const month = `${fTahun}-${fBulan}`;
  const bulanList = [{v:"01",l:"Januari"},{v:"02",l:"Februari"},{v:"03",l:"Maret"},{v:"04",l:"April"},{v:"05",l:"Mei"},{v:"06",l:"Juni"},{v:"07",l:"Juli"},{v:"08",l:"Agustus"},{v:"09",l:"September"},{v:"10",l:"Oktober"},{v:"11",l:"November"},{v:"12",l:"Desember"}];
  const tahunList = Array.from({length:3},(_,i)=>String(new Date().getFullYear()-i));
  const inp = "bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  // Filter by month
  const mPay = payments.filter(p=>p.periode===month);
  const mExpBank = expenses.filter(e=>e.periode===month&&e.status==="approved"&&e.sumber==="bank");
  const mExpKas = expenses.filter(e=>e.periode===month&&e.status==="approved"&&(e.sumber==="kas"||!e.sumber));
  const mKasIn = (kasTx||[]).filter(k=>k.tipe==="masuk"&&k.tanggal?.startsWith(month));
  const mBagi = (bagiHasil||[]).filter(b=>b.tanggal?.startsWith(month));

  // Totals
  const totPendapatan = mPay.reduce((s,p)=>s+(+p.nominal||0),0);
  const totBankIn = totPendapatan; // Bank masuk = pendapatan (kecuali bunga)
  const totBankOut = mExpBank.reduce((s,e)=>s+(+e.nominal||0),0) + mKasIn.reduce((s,k)=>s+(+k.jumlah||0),0) + mBagi.reduce((s,b)=>s+(+b.nominal||0),0);
  const totKasIn = mKasIn.reduce((s,k)=>s+(+k.jumlah||0),0);
  const totKasOut = mExpKas.reduce((s,e)=>s+(+e.nominal||0),0);

  const k = settings.kepemilikan || DEF.kepemilikan;

  const doPrint = () => {
    let title = "", body = "";
    if (tab==="pendapatan") {
      title = "Laporan Pendapatan";
      body = `<h3>Total Pendapatan: ${fRp(totPendapatan)}</h3>
      <table><tr><th>Kamar</th><th>Penyewa</th><th>Tanggal</th><th class="right">Nominal</th></tr>
      ${mPay.map(p=>{const t=tenants.find(x=>x.id===p.penyewaId);const r=rooms.find(x=>x.id===p.kamarId)||rooms.find(x=>x.id===t?.kamarId);return `<tr><td>K-${r?.nomor||"?"}</td><td>${t?.nama||"?"}</td><td>${fD(p.tanggal)}</td><td class="right">${fRp(p.nominal)}</td></tr>`;}).join("")}
      </table>`;
    } else if (tab==="bank") {
      title = "Laporan Bank";
      body = `<h3>Masuk: ${fRp(totBankIn)} · Keluar: ${fRp(totBankOut)}</h3>
      <table><tr><th>Tanggal</th><th>Deskripsi</th><th>Tipe</th><th class="right">Nominal</th></tr>
      ${mPay.map(p=>{const t=tenants.find(x=>x.id===p.penyewaId);return `<tr><td>${fD(p.tanggal)}</td><td>Sewa ${t?.nama||"?"}</td><td>Masuk</td><td class="right green">${fRp(p.nominal)}</td></tr>`;}).join("")}
      ${mExpBank.map(e=>`<tr><td>${fD(e.tanggal)}</td><td>${e.kategori}: ${e.deskripsi}</td><td>Keluar</td><td class="right red">- ${fRp(e.nominal)}</td></tr>`).join("")}
      ${mKasIn.map(k=>`<tr><td>${fD(k.tanggal)}</td><td>Transfer ke Kas</td><td>Keluar</td><td class="right red">- ${fRp(k.jumlah)}</td></tr>`).join("")}
      ${mBagi.map(b=>`<tr><td>${fD(b.tanggal)}</td><td>Bagi Hasil Investor</td><td>Keluar</td><td class="right red">- ${fRp(b.nominal)}</td></tr>`).join("")}
      </table>`;
    } else if (tab==="kas") {
      title = "Laporan Kas";
      body = `<h3>Masuk: ${fRp(totKasIn)} · Keluar: ${fRp(totKasOut)}</h3>
      <table><tr><th>Tanggal</th><th>Deskripsi</th><th>Tipe</th><th class="right">Nominal</th></tr>
      ${mKasIn.map(k=>`<tr><td>${fD(k.tanggal)}</td><td>Transfer dari Bank</td><td>Masuk</td><td class="right green">${fRp(k.jumlah)}</td></tr>`).join("")}
      ${mExpKas.map(e=>`<tr><td>${fD(e.tanggal)}</td><td>${e.kategori}: ${e.deskripsi}</td><td>Keluar</td><td class="right red">- ${fRp(e.nominal)}</td></tr>`).join("")}
      </table>`;
    }
    const html = `<!DOCTYPE html><html><head><title>${title} ${mLbl(month)}</title>
      <style>body{font-family:Arial;padding:20px;}h1{font-size:18px;}h3{font-size:14px;margin-top:20px;}table{width:100%;border-collapse:collapse;margin-top:10px;font-size:12px;}th,td{padding:8px;border:1px solid #ddd;text-align:left;}.right{text-align:right;}.green{color:green;}.red{color:red;}</style>
      </head><body><h1>${title} - ${mLbl(month)}</h1><p>${settings.companyInfo?.name||"Kos Meruya"}</p>${body}</body></html>`;
    const w = window.open("","_blank"); w.document.write(html); w.document.close(); setTimeout(()=>w.print(),300);
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div><h1 className="text-xl sm:text-2xl font-black text-slate-900">Laporan Keuangan</h1><p className="text-slate-400 text-sm">{mLbl(month)}</p></div>
        <Btn v="secondary" onClick={doPrint}><Download size={16}/>Export / Cetak PDF</Btn>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <label className="text-sm font-bold text-slate-600">Periode:</label>
        <select value={fBulan} onChange={e=>setFBulan(e.target.value)} className={inp}>
          {bulanList.map(b=><option key={b.v} value={b.v}>{b.l}</option>)}
        </select>
        <select value={fTahun} onChange={e=>setFTahun(e.target.value)} className={inp}>
          {tahunList.map(t=><option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-slate-200 w-fit">
        {[["pendapatan","Pendapatan"],["bank","Bank"],["kas","Kas"]].map(([t,l])=>(
          <button key={t} onClick={()=>setTab(t)} className={`px-5 py-2 text-sm font-bold transition-all ${tab===t?"bg-blue-600 text-white":"bg-white text-slate-600 hover:bg-slate-50"}`}>{l}</button>
        ))}
      </div>

      {/* PENDAPATAN TAB */}
      {tab==="pendapatan" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Total Pendapatan Sewa</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{fRp(totPendapatan)}</p>
              <p className="text-xs text-slate-500 mt-1">{mPay.length} pembayaran</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Occupancy</p>
              <p className="text-2xl font-black text-blue-600 mt-1">{rooms.length>0?Math.round(tenants.filter(t=>t.aktif).length/rooms.length*100):0}%</p>
              <p className="text-xs text-slate-500 mt-1">{tenants.filter(t=>t.aktif).length}/{rooms.length} kamar</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">{["Kamar","Penyewa","Tanggal","Nominal"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">{h}</th>)}</tr></thead>
              <tbody>
                {mPay.length===0&&<tr><td colSpan={4} className="text-center py-8 text-slate-400">Belum ada pendapatan {mLbl(month)}</td></tr>}
                {mPay.map(p=>{const t=tenants.find(x=>x.id===p.penyewaId);const rm=rooms.find(r=>r.id===p.kamarId)||rooms.find(r=>r.id===t?.kamarId);return(
                  <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-5 py-3 font-black text-blue-600">K-{rm?.nomor||"?"}</td>
                    <td className="px-5 py-3 font-bold">{t?.nama||"?"}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{fD(p.tanggal)}</td>
                    <td className="px-5 py-3 font-bold text-emerald-600">{fRp(p.nominal)}</td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* BANK TAB */}
      {tab==="bank" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Bank Masuk</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">+{fRp(totBankIn)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Bank Keluar</p>
              <p className="text-2xl font-black text-red-600 mt-1">-{fRp(totBankOut)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Net</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{fRp(totBankIn-totBankOut)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">{["Tanggal","Deskripsi","Tipe","Nominal"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">{h}</th>)}</tr></thead>
              <tbody>
                {mPay.length===0&&mExpBank.length===0&&mKasIn.length===0&&mBagi.length===0&&<tr><td colSpan={4} className="text-center py-8 text-slate-400">Belum ada transaksi bank {mLbl(month)}</td></tr>}
                {mPay.map(p=>{const t=tenants.find(x=>x.id===p.penyewaId);return(
                  <tr key={p.id} className="border-b border-slate-50">
                    <td className="px-5 py-3 text-slate-500 text-xs">{fD(p.tanggal)}</td>
                    <td className="px-5 py-3">Sewa - {t?.nama||"?"}</td>
                    <td className="px-5 py-3"><span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">↑ Masuk</span></td>
                    <td className="px-5 py-3 font-bold text-emerald-600">+{fRp(p.nominal)}</td>
                  </tr>
                );})}
                {mExpBank.map(e=>(
                  <tr key={e.id} className="border-b border-slate-50">
                    <td className="px-5 py-3 text-slate-500 text-xs">{fD(e.tanggal)}</td>
                    <td className="px-5 py-3">{e.kategori}: {e.deskripsi}</td>
                    <td className="px-5 py-3"><span className="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">↓ Keluar</span></td>
                    <td className="px-5 py-3 font-bold text-red-600">-{fRp(e.nominal)}</td>
                  </tr>
                ))}
                {mKasIn.map(k=>(
                  <tr key={k.id+"bb"} className="border-b border-slate-50">
                    <td className="px-5 py-3 text-slate-500 text-xs">{fD(k.tanggal)}</td>
                    <td className="px-5 py-3">Transfer ke Kas</td>
                    <td className="px-5 py-3"><span className="text-xs font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">↓ Keluar</span></td>
                    <td className="px-5 py-3 font-bold text-amber-600">-{fRp(k.jumlah)}</td>
                  </tr>
                ))}
                {mBagi.map(b=>(
                  <tr key={b.id+"bh"} className="border-b border-slate-50">
                    <td className="px-5 py-3 text-slate-500 text-xs">{fD(b.tanggal)}</td>
                    <td className="px-5 py-3 font-bold">Bagi Hasil Investor</td>
                    <td className="px-5 py-3"><span className="text-xs font-bold px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">↓ Keluar</span></td>
                    <td className="px-5 py-3 font-bold text-purple-600">-{fRp(b.nominal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* KAS TAB */}
      {tab==="kas" && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Kas Masuk</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">+{fRp(totKasIn)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Kas Keluar</p>
              <p className="text-2xl font-black text-red-600 mt-1">-{fRp(totKasOut)}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase">Net</p>
              <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{fRp(totKasIn-totKasOut)}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">{["Tanggal","Deskripsi","Tipe","Nominal"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">{h}</th>)}</tr></thead>
              <tbody>
                {mKasIn.length===0&&mExpKas.length===0&&<tr><td colSpan={4} className="text-center py-8 text-slate-400">Belum ada transaksi kas {mLbl(month)}</td></tr>}
                {mKasIn.map(k=>(
                  <tr key={k.id} className="border-b border-slate-50">
                    <td className="px-5 py-3 text-slate-500 text-xs">{fD(k.tanggal)}</td>
                    <td className="px-5 py-3">Transfer dari Bank</td>
                    <td className="px-5 py-3"><span className="text-xs font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full">↑ Masuk</span></td>
                    <td className="px-5 py-3 font-bold text-emerald-600">+{fRp(k.jumlah)}</td>
                  </tr>
                ))}
                {mExpKas.map(e=>(
                  <tr key={e.id} className="border-b border-slate-50">
                    <td className="px-5 py-3 text-slate-500 text-xs">{fD(e.tanggal)}</td>
                    <td className="px-5 py-3">{e.kategori}: {e.deskripsi}</td>
                    <td className="px-5 py-3"><span className="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">↓ Keluar</span></td>
                    <td className="px-5 py-3 font-bold text-red-600">-{fRp(e.nominal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
function SettingsPage({ settings, saveSettings, addAudit, user, onReset, rooms, saveRooms, users, saveUsers, exportAll }) {
  const [permsModal, setPermsModal] = useState(null);
  const [form, setForm]    = useState({...settings, kepemilikan:{...settings.kepemilikan}});
  const [pins, setPins]    = useState({...settings.pins});
  const [saved, setSaved]  = useState(false);
  const [bulkTipe, setBulkTipe] = useState("");

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
          updated.push({ id:uid(), nomor, lantai, tipe:(form.roomTypes||[])[0]?.nama||"Standard", harga:(form.roomTypes||[])[0]?.harga||0, status:"kosong", penyewaId:null });
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
      roomTypes: form.roomTypes||DEF.roomTypes,
    };
    await saveSettings(ns);
    await addAudit("SETTINGS",`${user} mengupdate pengaturan sistem`);
    setSaved(true); setTimeout(()=>setSaved(false),3000);
  };

  return (
    <div className="space-y-5 max-w-2xl">
      <div><h1 className="text-xl sm:text-2xl font-black text-slate-900">Pengaturan</h1>
        <p className="text-slate-400 text-sm">Admin only — perubahan berlaku langsung</p></div>

      {/* FLOOR & ROOM CONFIG */}
      <CollapseCard title="Konfigurasi Lantai & Kamar" icon={Building} badge={`${totalRoomsConfig} kamar`}>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      </CollapseCard>

      {/* TIPE & HARGA KAMAR */}
      <CollapseCard title="Tipe & Harga Kamar" icon={Grid}>
        <div className="flex justify-end mb-3">
          <Btn v="secondary" size="sm" onClick={()=>setForm({...form, roomTypes:[...(form.roomTypes||[]),{id:uid(),nama:"",harga:0}]})}>
            <Plus size={14}/>Tambah Tipe
          </Btn>
        </div>
        <p className="text-sm text-slate-500 mb-4">Harga kamar ditentukan dari tipe. Ubah harga di sini, lalu klik "Terapkan" untuk update semua kamar sekaligus.</p>
        <div className="space-y-3">
          {(form.roomTypes||[]).map((rt,i)=>{
            const count = rooms.filter(r=>r.tipe===rt.nama).length;
            return (
              <div key={rt.id||i} className="bg-slate-50 rounded-xl p-4">
                <div className="grid grid-cols-7 gap-3 items-end">
                  <div className="col-span-3">
                    <label className="text-xs font-bold text-slate-500 block mb-1">Nama Tipe</label>
                    <input className={inp} placeholder="cth: Standard, AC, Deluxe..." value={rt.nama||""}
                      onChange={e=>{const nr=[...(form.roomTypes)];nr[i]={...rt,nama:e.target.value};setForm({...form,roomTypes:nr});}}/>
                  </div>
                  <div className="col-span-3">
                    <label className="text-xs font-bold text-slate-500 block mb-1">Harga / Bulan (Rp)</label>
                    <input type="number" className={inp} value={rt.harga||0}
                      onChange={e=>{const nr=[...(form.roomTypes)];nr[i]={...rt,harga:+e.target.value};setForm({...form,roomTypes:nr});}}/>
                  </div>
                  <div>
                    <button onClick={()=>{
                      if(count>0&&!confirm(`${count} kamar pakai tipe "${rt.nama}". Tetap hapus?`))return;
                      setForm({...form,roomTypes:(form.roomTypes).filter((_,j)=>j!==i)});
                    }} className="w-full p-2.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl transition flex items-center justify-center">
                      <Trash2 size={14}/>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">{count} kamar menggunakan tipe ini {rt.harga ? `· ${fRp(rt.harga)}/bln` : ""}</p>
              </div>
            );
          })}
          {(!form.roomTypes||form.roomTypes.length===0)&&(
            <p className="text-sm text-slate-400 text-center py-4">Belum ada tipe. Klik tombol di atas untuk menambah.</p>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
          {(()=>{
            const types = form.roomTypes||[];
            const typeNames = new Set(types.map(t=>t.nama).filter(Boolean));
            const unmatched = rooms.filter(r=>!typeNames.has(r.tipe));
            const unmatchedTypes = [...new Set(unmatched.map(r=>r.tipe||"(kosong)"))];
            return unmatched.length>0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="text-sm font-bold text-amber-700 mb-1">⚠ {unmatched.length} kamar punya tipe yang tidak terdaftar</p>
                <p className="text-xs text-amber-600">Tipe lama: {unmatchedTypes.join(", ")}</p>
              </div>
            );
          })()}
          <div className="bg-blue-50 rounded-xl p-4">
            <p className="text-xs font-black text-blue-700 uppercase tracking-widest mb-3">Set Semua Kamar Sekaligus</p>
            <div className="flex items-end gap-3 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <label className="text-xs font-bold text-slate-600 block mb-1">Pilih Tipe</label>
                <select className={inp} value={bulkTipe} onChange={e=>setBulkTipe(e.target.value)}>
                  <option value="">— Pilih tipe —</option>
                  {(form.roomTypes||[]).filter(t=>t.nama).map(t=><option key={t.id} value={t.nama}>{t.nama} — {fRp(t.harga)}/bln</option>)}
                </select>
              </div>
              <Btn disabled={!bulkTipe} onClick={async()=>{
                const types = form.roomTypes||[];
                const rt = types.find(t=>t.nama===bulkTipe);
                if(!rt) return;
                if(!confirm(`Set SEMUA ${rooms.length} kamar ke tipe "${rt.nama}" dengan harga ${fRp(rt.harga)}/bulan?`)) return;
                await saveSettings({...settings, roomTypes: types});
                const updated = rooms.map(r=>({...r, tipe:rt.nama, harga:rt.harga}));
                await saveRooms(updated);
                await addAudit("TIPE_BULK",`Semua ${rooms.length} kamar diset ke tipe "${rt.nama}" — ${fRp(rt.harga)}`);
                alert(`✓ ${rooms.length} kamar diset ke "${rt.nama}" — ${fRp(rt.harga)}/bln`);
              }}>
                <Check size={16}/>Terapkan ke Semua Kamar
              </Btn>
            </div>
            <p className="text-xs text-blue-500 mt-2">Mengubah tipe DAN harga semua kamar sekaligus ke tipe yang dipilih.</p>
          </div>
          <Btn v="secondary" onClick={async()=>{
            const types = form.roomTypes||[];
            if(types.length===0) return alert("Belum ada tipe kamar.");
            await saveSettings({...settings, roomTypes: types});
            const updated = rooms.map(r=>{
              const rt = types.find(t=>t.nama===r.tipe);
              return rt ? {...r, harga:rt.harga} : r;
            });
            const changed = updated.filter((r,i)=>r.harga!==rooms[i].harga).length;
            if(changed===0) return alert("Tidak ada perubahan. Pastikan nama tipe kamar cocok dengan tipe di setting.");
            if(!confirm(`Update harga ${changed} kamar yang tipenya cocok?`)) return;
            await saveRooms(updated);
            await addAudit("HARGA_SYNC",`Harga ${changed} kamar di-sync sesuai tipe`);
            alert(`✓ ${changed} kamar diupdate!`);
          }}><RefreshCw size={16}/>Sync Harga Saja (Tipe Tidak Berubah)</Btn>
          <p className="text-xs text-slate-400">Hanya update harga untuk kamar yang tipenya sudah cocok dengan setting.</p>
        </div>
      </CollapseCard>

      <CollapseCard title="% Kepemilikan Investor" icon={Shield}>
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
      </CollapseCard>

      <CollapseCard title="Parameter Keuangan" icon={Wallet}>
        <div className="space-y-4">
          <div><label className="text-xs font-bold text-slate-600 block mb-1">Kas Operasional Bulanan (Rp)</label>
            <input type="number" className={inp} value={form.kasOperasional||0} onChange={e=>setForm({...form,kasOperasional:+e.target.value})}/></div>
          <div><label className="text-xs font-bold text-slate-600 block mb-1">Fee Pengelola (%)</label>
            <input type="number" min="0" max="100" step="0.1" className={inp} value={form.feeManager||0} onChange={e=>setForm({...form,feeManager:+e.target.value})}/></div>
        </div>
      </CollapseCard>

      {/* Company info */}
      <CollapseCard title="Info Perusahaan (Kop Invoice)" icon={Building}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[{l:"Nama Perusahaan/Kos",k:"name",f:true},{l:"Alamat",k:"address",f:true},{l:"No Telepon",k:"phone"},{l:"Email",k:"email"}].map(f=>(
            <div key={f.k} className={f.f?"col-span-2":""}>
              <label className="text-xs font-bold text-slate-600 block mb-1">{f.l}</label>
              <input className={inp} value={form.companyInfo?.[f.k]||""}
                onChange={e=>setForm({...form,companyInfo:{...(form.companyInfo||{}), [f.k]:e.target.value}})}/>
            </div>
          ))}
        </div>
      </CollapseCard>

      {/* Bank accounts */}
      <CollapseCard title="Rekening Perusahaan" icon={CreditCard}>
        <div className="flex justify-end mb-3">
          <Btn v="secondary" size="sm" onClick={()=>setForm({...form, bankAccounts:[...(form.bankAccounts||[]),{id:uid(),bank:"",noRek:"",atasNama:""}]})}>
            <Plus size={14}/>Tambah Rekening
          </Btn>
        </div>
        {(!form.bankAccounts||form.bankAccounts.length===0)&&(
          <p className="text-sm text-slate-400 text-center py-4">Belum ada rekening. Klik tombol di atas untuk menambah.</p>
        )}
        <div className="space-y-3">
          {(form.bankAccounts||[]).map((b,i)=>(
            <div key={b.id||i} className="grid grid-cols-1 sm:grid-cols-7 gap-2 items-end bg-slate-50 rounded-xl p-3">
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
      </CollapseCard>

      <CollapseCard title="PIN Akses" icon={Shield}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[{l:"Admin (Ricy)",k:"admin"},{l:"Investor Ricy",k:"ricy"},{l:"Investor Arief",k:"arief"},{l:"Investor Ferry",k:"ferry"},{l:"Staff",k:"staff"}].map(p=>(
            <div key={p.k}><label className="text-xs font-bold text-slate-600 block mb-1">{p.l}</label>
              <input className={inp} value={pins[p.k]||""} onChange={e=>setPins({...pins,[p.k]:e.target.value})} placeholder="PIN baru"/></div>
          ))}
        </div>
      </CollapseCard>

      <div className="flex items-center gap-4">
        <Btn onClick={doSave} size="lg">Simpan Semua Perubahan</Btn>
        {saved&&<span className="text-emerald-600 font-black">✓ Tersimpan!</span>}
      </div>

      {/* KELOLA PENGGUNA */}
      <CollapseCard title="Kelola Pengguna" icon={Shield} badge={`${(users||[]).length} user`}>
        <div className="flex justify-end mb-4">
          <button onClick={()=>{
            const id=prompt("ID Pengguna (huruf kecil tanpa spasi):");
            if(!id||!id.trim())return;
            if((users||[]).find(u=>u.id===id))return alert("ID sudah dipakai");
            const nama=prompt("Nama Lengkap:"); if(!nama)return;
            const role=prompt("Role (admin/investor/staff):","staff");
            if(!["admin","investor","staff"].includes(role))return alert("Role harus admin, investor, atau staff");
            const password=prompt("Password:");
            if(!password||password.length<4)return alert("Password minimal 4 karakter");
            saveUsers([...(users||[]),{id:id.trim().toLowerCase(),nama,role,password}]);
            addAudit("USER_TAMBAH",`User baru: ${id} (${role})`);
          }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl">
            <Plus size={14} className="inline mr-1"/>Tambah User
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-4">Atur akun login untuk investor dan staff. Total: {(users||[]).length} pengguna.</p>
        <div className="space-y-2">
          {(users||[]).map(u=>(
            <div key={u.id} className="p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition">
              <div className="flex items-center gap-3 mb-2.5">
                <div className={`w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center font-black text-white text-sm ${u.role==="admin"?"bg-purple-600":u.role==="investor"?"bg-blue-600":"bg-slate-500"}`}>
                  {u.nama?.[0]?.toUpperCase()||"?"}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 text-sm truncate">{u.nama}</p>
                  <p className="text-xs text-slate-500">ID: <span className="font-mono">{u.id}</span> · {u.role}</p>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <button onClick={()=>{
                  const nama=prompt("Nama:",u.nama);if(!nama)return;
                  const password=prompt("Password baru (kosongkan jika tidak ganti):");
                  const updated=(users||[]).map(x=>x.id===u.id?{...x,nama,password:password||x.password}:x);
                  saveUsers(updated);
                  addAudit("USER_EDIT",`User ${u.id} diupdate`);
                }} className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200">
                  Edit
                </button>
                <button onClick={()=>setPermsModal(u)} className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg">
                  Akses
                </button>
                {u.id!=="admin"&&u.id!==user&&(
                  <button onClick={()=>{
                    if(!confirm(`Hapus user ${u.nama} (${u.id})?`))return;
                    saveUsers((users||[]).filter(x=>x.id!==u.id));
                    addAudit("USER_HAPUS",`User ${u.id} dihapus`);
                  }} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg">
                    Hapus
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapseCard>

      {/* EXPORT & BACKUP */}
      <CollapseCard title="Export & Backup Data" icon={Download}>
        {(()=>{
          const last = localStorage.getItem('km-lastBackup');
          const days = last ? Math.floor((Date.now()-parseInt(last))/(864e5)) : null;
          if(days===null) return <p className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mb-4">⚠ Belum pernah backup. Disarankan backup sekarang.</p>;
          if(days>=7) return <p className="text-xs font-bold text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">⚠ Sudah {days} hari belum backup! Backup sekarang.</p>;
          return <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg mb-4">✓ Terakhir backup {days===0?"hari ini":`${days} hari lalu`}.</p>;
        })()}
        <p className="text-sm text-slate-500 mb-4">Download semua data (penyewa, kamar, invoice, pembayaran, kas keluar) dalam format pilihan kamu. Simpan filenya di Google Drive atau email ke diri sendiri.</p>
        <div className="flex gap-3 flex-wrap">
          <button onClick={async()=>{
            if(!window.XLSX){
              await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s);});
            }
            const X=window.XLSX; const d=await exportAll();
            const fmtRp=n=>n?Number(n).toLocaleString('id-ID'):0;
            const wb=X.utils.book_new();
            // Sheet Kamar
            X.utils.book_append_sheet(wb,X.utils.json_to_sheet(d.rooms.map(r=>({'Nomor':`K-${r.nomor}`,'Lantai':`Lt ${r.lantai}`,'Tipe':r.tipe||'-','Harga/Bln':r.harga||0,'Status':r.status==='terisi'?'Terisi':'Kosong','Penyewa':d.tenants.find(t=>t.id===r.penyewaId)?.nama||'-'}))),'Kamar');
            // Sheet Penyewa
            X.utils.book_append_sheet(wb,X.utils.json_to_sheet(d.tenants.map(t=>{const r=d.rooms.find(x=>x.id===t.kamarId);return{'Kamar':`K-${r?.nomor||'-'}`,'Lantai':`Lt ${r?.lantai||'-'}`,'Nama':t.nama,'No HP':t.hp,'Tgl Masuk':t.tanggalMasuk||'-','Deposit':t.deposit||0,'Status':t.status==='aktif'?'Aktif':'Alumni'};})),'Penyewa');
            // Sheet Invoice
            X.utils.book_append_sheet(wb,X.utils.json_to_sheet(d.invoices.length?d.invoices.map(i=>{const paid=(i.invPayments||[]).reduce((s,p)=>s+(+p.amount||0),0);return{'No Invoice':i.invoiceNo,'Penyewa':i.tenantName,'Kamar':`K-${i.roomNomor}`,'Periode':i.periode?.label||'-','Jatuh Tempo':i.dueDate||'-','Nominal':i.nominal||0,'Terbayar':paid,'Sisa':Math.max(0,(i.nominal||0)-paid),'Status':i.paid||paid>=(i.nominal||0)?'Lunas':paid>0?'Sebagian':'Belum Bayar'}}):[{Info:'Belum ada invoice'}]),'Invoice');
            // Sheet Pembayaran
            X.utils.book_append_sheet(wb,X.utils.json_to_sheet(d.payments.length?d.payments.map(p=>({'Tanggal':p.tanggal||p.date||'-','Penyewa':p.penyewaName||'-','Kamar':`K-${d.rooms.find(r=>r.id===p.kamarId)?.nomor||'-'}`,'Periode':p.periode||'-','Nominal':p.nominal||0,'Metode':p.metode||'-','Bank':p.bank||'-','Pengirim':p.pengirim||'-'})):[{Info:'Belum ada pembayaran'}]),'Pembayaran');
            // Sheet Kas Keluar
            X.utils.book_append_sheet(wb,X.utils.json_to_sheet(d.expenses.length?d.expenses.map(e=>({'Tanggal':e.tanggal||'-','Kategori':e.kategori||'-','Deskripsi':e.deskripsi||'-','Nominal':e.nominal||0,'Dibayar Oleh':e.dibayarOleh||'-'})):[{Info:'Belum ada pengeluaran'}]),'Kas Keluar');
            X.writeFile(wb,`KosMeruya-${new Date().toISOString().split('T')[0]}.xlsx`);
            localStorage.setItem('km-lastBackup',Date.now().toString());
          }} className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-sm">
            <Download size={16}/>Export Excel
          </button>
          <button onClick={async()=>{
            const d=await exportAll();
            const now=new Date().toLocaleDateString('id-ID',{dateStyle:'full'});
            const aktif=d.tenants.filter(t=>t.status==='aktif');
            const unpaid=d.invoices.filter(i=>{const p=(i.invPayments||[]).reduce((s,x)=>s+(+x.amount||0),0);return !i.paid&&p<(i.nominal||0);});
            const fRp=n=>'Rp '+Number(n||0).toLocaleString('id-ID');
            const tRow=(cells,bold)=>`<tr>${cells.map(c=>`<t${bold?'h':'d'} style="border:1px solid #ddd;padding:6px 10px;${bold?'background:#f1f5f9;font-weight:bold;':''}">${c}</t${bold?'h':'d'}>`).join('')}</tr>`;
            const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Laporan Kos Meruya</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#1e293b}h1{color:#1e40af;margin-bottom:4px}h2{color:#475569;font-size:14px;margin:20px 0 8px}table{border-collapse:collapse;width:100%;font-size:13px;margin-bottom:16px}.summary{display:flex;gap:16px;flex-wrap:wrap;margin:16px 0}.box{background:#f8fafc;border:1px solid #e2e8f0;padding:12px 20px;border-radius:8px}.box b{display:block;font-size:20px;color:#1e40af}.label{font-size:11px;color:#64748b}@media print{button{display:none}}</style></head><body>
            <h1>Laporan Kos Meruya</h1><p style="color:#64748b;font-size:13px">Dicetak: ${now}</p>
            <div class="summary">
              <div class="box"><b>${d.rooms.length}</b><span class="label">Total Kamar</span></div>
              <div class="box"><b>${aktif.length}</b><span class="label">Penyewa Aktif</span></div>
              <div class="box"><b>${unpaid.length}</b><span class="label">Invoice Belum Lunas</span></div>
              <div class="box"><b>${fRp(d.payments.reduce((s,p)=>s+(+p.nominal||0),0))}</b><span class="label">Total Pemasukan</span></div>
            </div>
            <h2>Penyewa Aktif (${aktif.length})</h2>
            <table><thead>${tRow(['Kamar','Nama','No HP','Tgl Masuk','Deposit'],true)}</thead><tbody>${aktif.map(t=>{const r=d.rooms.find(x=>x.id===t.kamarId);return tRow([`K-${r?.nomor||'-'}`,t.nama,t.hp,t.tanggalMasuk||'-',fRp(t.deposit)])}).join('')}</tbody></table>
            <h2>Invoice Belum Lunas (${unpaid.length})</h2>
            <table><thead>${tRow(['No Invoice','Penyewa','Kamar','Jatuh Tempo','Sisa'],true)}</thead><tbody>${unpaid.map(i=>{const p=(i.invPayments||[]).reduce((s,x)=>s+(+x.amount||0),0);return tRow([i.invoiceNo,i.tenantName,`K-${i.roomNomor}`,i.dueDate||'-',fRp((i.nominal||0)-p)])}).join('')}</tbody></table>
            <h2>Pengeluaran (${d.expenses.length} total)</h2>
            <table><thead>${tRow(['Tanggal','Kategori','Deskripsi','Nominal'],true)}</thead><tbody>${d.expenses.slice(0,30).map(e=>tRow([e.tanggal||'-',e.kategori||'-',e.deskripsi||'-',fRp(e.nominal)])).join('')}</tbody></table>
            <br><button onclick="window.print()" style="background:#1e40af;color:white;padding:10px 24px;border:none;border-radius:8px;cursor:pointer;font-size:14px;font-weight:bold">🖨 Print / Save PDF</button>
            </body></html>`;
            const w=window.open('','_blank'); w.document.write(html); w.document.close();
            localStorage.setItem('km-lastBackup',Date.now().toString());
          }} className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition text-sm">
            <FileText size={16}/>Export PDF
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-3">Excel: 5 sheet (Kamar, Penyewa, Invoice, Pembayaran, Kas Keluar). PDF: laporan ringkas siap cetak.</p>
      </CollapseCard>

      {/* RESET DATA */}
      <CollapseCard title="Reset Data" icon={AlertTriangle} danger>
        <p className="text-sm text-slate-500 mb-4">Hapus semua data penyewa, pembayaran, kas, invoice, dan bersihkan status kamar. Web kembali seperti baru. <strong>Tidak bisa dibatalkan.</strong></p>
        <button onClick={()=>resetAll("penyewa")}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-xl transition">
          🗑️ Reset Semua Data
        </button>
      </CollapseCard>

      {/* RESET DATA LAMA */}
      <CollapseCard title="Reset / Hapus Data Test" icon={Trash2} danger>
        <p className="text-slate-500 text-sm mb-5">Hapus data uji coba. Pengaturan, % kepemilikan, dan PIN <strong>tidak</strong> ikut terhapus.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
      </CollapseCard>

      {/* Modal Atur Akses */}
      {permsModal && (() => {
        const currentPerms = permsModal.perms || DEFAULT_PERMS[permsModal.role] || {};
        const [draft,setDraft] = [currentPerms, (newP)=>{
          const updated = (users||[]).map(x=>x.id===permsModal.id?{...x,perms:newP}:x);
          saveUsers(updated);
          setPermsModal({...permsModal, perms:newP});
        }];
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-black text-slate-900">Atur Akses</h2>
                <p className="text-sm text-slate-500 mt-1">{permsModal.nama} ({permsModal.id})</p>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                <div className="grid grid-cols-4 gap-2 text-xs font-bold text-slate-500 uppercase mb-2 px-2">
                  <span>Menu</span>
                  <span className="text-center">Tidak</span>
                  <span className="text-center">Lihat</span>
                  <span className="text-center">Edit</span>
                </div>
                {MENU_KEYS.map(m=>(
                  <div key={m} className="grid grid-cols-4 gap-2 items-center py-2 border-b border-slate-50 hover:bg-slate-50 rounded-lg px-2">
                    <span className="text-sm font-bold text-slate-700">{MENU_LABELS[m]}</span>
                    {["none","view","edit"].map(v=>(
                      <label key={v} className="flex justify-center cursor-pointer">
                        <input type="radio" name={m} value={v} checked={draft[m]===v}
                          onChange={()=>{ const np={...draft,[m]:v}; setDraft(np); }}
                          className="w-4 h-4 accent-blue-600"/>
                      </label>
                    ))}
                  </div>
                ))}
                <p className="text-xs text-slate-400 mt-4">
                  <strong>Tidak</strong>: menu tersembunyi · <strong>Lihat</strong>: bisa buka, tidak bisa edit · <strong>Edit</strong>: bisa edit/hapus/tambah
                </p>
              </div>
              <div className="p-4 border-t border-slate-100 flex justify-end gap-2">
                <button onClick={()=>{
                  const updated = (users||[]).map(x=>x.id===permsModal.id?{...x,perms:DEFAULT_PERMS[x.role]||{}}:x);
                  saveUsers(updated);
                  setPermsModal(null);
                  addAudit("USER_PERMS_RESET", `Akses ${permsModal.id} di-reset ke default`);
                }} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl">
                  Reset ke Default
                </button>
                <button onClick={()=>{
                  addAudit("USER_PERMS_EDIT", `Akses ${permsModal.id} diupdate`);
                  setPermsModal(null);
                }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl">
                  Selesai
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
      <div><h1 className="text-xl sm:text-2xl font-black text-slate-900">Log Aktivitas</h1>
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
function InvoicesPage({ role, user, rooms, tenants, settings, addAudit, audit, myPerms, payments, savePayments }) {
  const canEdit = myPerms?.invoices==="edit";
  const [invoices, setInvs]  = useState([]);
  const [modal,    setModal] = useState(null);
  const [form,     setForm]  = useState({});
  const [copied,   setCopied]= useState("");
  const [loadingInv, setLI]  = useState(true);
  const [showWA,   setShowWA]= useState(null);
  const [previewInv,setPreviewInv]=useState(null);
  const [multiModal,setMultiModal]=useState(null);
  const [multiMonths,setMultiMonths]=useState(3);
  const [multiPrice,setMultiPrice]=useState(0);
  const [payModal,  setPayModal] = useState(null);
  const [payForm,   setPayForm]  = useState({amount:0,date:"",method:"transfer",bank:"",pengirim:"",referensi:"",catatan:""});
  const [editInvModal, setEditInvModal] = useState(null);
  const [editInvForm, setEditInvForm] = useState({nominal:0,dueDate:""});
  const [showGenerate, setShowGenerate] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [showDue, setShowDue] = useState(true);
  const [fStatus, setFStatus] = useState("semua");
  const [fBulan, setFBulan] = useState("");
  const [genSearch, setGenSearch] = useState("");
  const [genSort, setGenSort] = useState("kamar");

  const isEdit = canEdit;

  // Payment helpers
  const getPaid = (inv) => (inv.invPayments||[]).reduce((s,p)=>s+(+p.amount||0),0);
  const getRemaining = (inv) => Math.max(0,(+inv.nominal||0)-getPaid(inv));
  const isLunas = (inv) => inv.paid || getPaid(inv)>=(+inv.nominal||0);

  useEffect(()=>{
    store.get("km-invoices").then(d=>{ setInvs(toArr(d)||[]); setLI(false); });
  },[]);

  const saveInvs = async (data) => {
    setInvs(data);
    await store.set("km-invoices", data);
  };

  const fmtDate = (d) => d.toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"});

  const addMonthsClamped = (baseDate, n) => {
    const day = baseDate.getDate();
    const t = new Date(baseDate.getFullYear(), baseDate.getMonth()+n, 1);
    const lastDay = new Date(t.getFullYear(), t.getMonth()+1, 0).getDate();
    t.setDate(Math.min(day, lastDay));
    return t;
  };

  const calcNextPeriode = (tenant, numMonths=1) => {
    const moveIn = new Date(tenant.tanggalMasuk);
    const tenantInvs = invoices.filter(i=>i.tenantId===tenant.id);
    const monthsUsed = tenantInvs.reduce((s,i)=>s+(i.multiBulan||1), 0);
    const start = addMonthsClamped(moveIn, monthsUsed);
    const endExcl = addMonthsClamped(moveIn, monthsUsed + numMonths);
    const end = new Date(endExcl); end.setDate(end.getDate()-1);
    const ym = `${start.getFullYear()}-${String(start.getMonth()+1).padStart(2,"0")}`;
    return { start:start.toISOString().split("T")[0], end:end.toISOString().split("T")[0], label:`${fmtDate(start)} – ${fmtDate(end)}`, targetMonth:ym };
  };

  const genWAMsg = (inv) => {
    const banks = (inv.bankAccounts||[]).map(b=>`🏦 ${b.bank}  ${b.noRek}  a.n. ${b.atasNama}`).join("\n");
    return `Halo Kak ${inv.tenantName} 👋

Berikut tagihan sewa kamar Anda di *${inv.companyInfo?.name||"Kos Meruya"}*:

🏠 Kamar       : ${inv.roomNomor} (${inv.roomTipe})
📋 No. Invoice : ${inv.invoiceNo}
📆 Periode     : ${inv.periode?.label||"-"}
💰 Total       : *${fRp(inv.nominal)}*
⏰ Jatuh Tempo : ${fD(inv.dueDate)}

🔗 Lihat invoice online:\nhttps://kos-meruya-pgkq.vercel.app/#inv-${inv.id}

${banks?"Transfer pembayaran ke:\n"+banks+"\n":""}
Mohon konfirmasi via WhatsApp setelah transfer.
Terima kasih 🙏

_Manajemen ${inv.companyInfo?.name||"Kos Meruya"}_`;
  };

  const printInvoice = (inv) => setPreviewInv(inv);

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
    const per = calcNextPeriode(t);
    setForm({ tenantId:t.id, tenantName:t.nama, tenantHp:t.hp,
      kamarId:t.kamarId, roomNomor:room?.nomor, roomTipe:room?.tipe||"Standard",
      nominal:room?.harga||0, targetMonth:per.targetMonth, periode:per, dueDate:per.start });
    setModal(t);
  };

  const updateMonth = null; // removed - periode auto-calculated

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
    await store.set(`km-inv-${inv.id}`, inv);
    const newInvs = [inv,...invoices];
    await saveInvs(newInvs);
    await addAudit("INVOICE",`${inv.invoiceNo} dibuat untuk ${inv.tenantName} (K-${inv.roomNomor}) – ${inv.periode?.label}`);
    setModal(null);
    setShowWA({ inv, msg: genWAMsg(inv) });
  };

  const generateMulti = async () => {
    const t = multiModal;
    const room = rooms.find(r=>r.id===t.kamarId);
    if (!room?.harga) return alert("Set harga kamar terlebih dahulu.");
    const n = +multiMonths;
    const per = calcNextPeriode(t, n);
    const totalNominal = multiPrice || (room.harga * n);
    const inv = {
      id:uid(), invoiceNo:nextInvNo(per.targetMonth),
      tenantId:t.id, tenantName:t.nama, tenantHp:t.hp,
      kamarId:t.kamarId, roomNomor:room.nomor, roomTipe:room.tipe||"Standard",
      nominal:totalNominal, targetMonth:per.targetMonth, periode:per, dueDate:per.start,
      multiBulan:n, hargaPerBulan:room.harga,
      bankAccounts:settings.bankAccounts||[], companyInfo:settings.companyInfo||{name:"Kos Meruya"},
      generatedBy:user, generatedAt:now(), paid:false,
    };
    await store.set(`km-inv-${inv.id}`, inv);
    await saveInvs([inv, ...invoices]);
    await addAudit("INVOICE_MULTI", `Invoice ${n} bulan untuk ${t.nama} (${inv.invoiceNo}) - ${fRp(totalNominal)}`);
    setMultiModal(null);
    alert(`✅ Invoice ${n} bulan berhasil dibuat!\nTotal: ${fRp(totalNominal)}`);
  };

  const cancelInvoice = async (inv) => {
    const paidAmt = getPaid(inv);
    const warnMsg = paidAmt>0
      ? `Batalkan invoice ${inv.invoiceNo} untuk ${inv.tenantName}?\n\n⚠ Invoice ini sudah ada pembayaran ${fRp(paidAmt)}. Pembayaran tersebut akan IKUT DIHAPUS dari laporan.\n\nInvoice akan dihapus permanen.`
      : `Batalkan invoice ${inv.invoiceNo} untuk ${inv.tenantName}?\nInvoice akan dihapus permanen.`;
    if (!confirm(warnMsg)) return;
    const updated = invoices.filter(i=>i.id!==inv.id);
    await saveInvs(updated);
    await store.set(`km-inv-${inv.id}`, null);
    // Remove associated payments from main payments[] (shared IDs)
    const payIds = new Set((inv.invPayments||[]).map(p=>p.id));
    if(payIds.size>0) await savePayments(payments.filter(p=>!payIds.has(p.id)));
    await addAudit("INV_BATAL", `Invoice ${inv.invoiceNo} - ${inv.tenantName} dibatalkan${paidAmt>0?` (pembayaran ${fRp(paidAmt)} ikut dihapus)`:""} oleh ${user}`);
  };

  const openPayModal = (inv, type) => {
    const remaining = getRemaining(inv);
    setPayForm({
      amount: type==="full" ? remaining : 0,
      date: new Date().toISOString().split("T")[0],
      method:"transfer", bank:"", pengirim:"", referensi:"", catatan:""
    });
    setPayModal({inv, type});
  };

  const recordPayment = async () => {
    const {inv, type} = payModal;
    const amt = +payForm.amount;
    const remaining = getRemaining(inv);
    if(!amt||amt<=0) return alert("Nominal harus lebih dari 0");
    if(amt>remaining) return alert(`Melebihi sisa tagihan (${fRp(remaining)})`);
    const payment = {id:uid(),amount:amt,date:payForm.date,method:payForm.method,bank:payForm.bank,pengirim:payForm.pengirim,referensi:payForm.referensi,catatan:payForm.catatan,inputBy:user,inputAt:now()};
    const newInvPayments = [...(inv.invPayments||[]), payment];
    const totalPaid = newInvPayments.reduce((s,p)=>s+(+p.amount||0),0);
    const fullyPaid = totalPaid >= (+inv.nominal||0);
    const updatedInv = {...inv, invPayments:newInvPayments, paid:fullyPaid, paidAt:fullyPaid?now():inv.paidAt, paidBy:fullyPaid?user:inv.paidBy};
    const updatedInvs = invoices.map(i=>i.id===inv.id?updatedInv:i);
    await saveInvs(updatedInvs);
    await store.set(`km-inv-${inv.id}`, updatedInv);
    // Also record in main payments[] for reporting
    const payRecord = {id:payment.id,kamarId:inv.kamarId||"",penyewaId:inv.tenantId,periode:inv.targetMonth||"",nominal:amt,metode:payForm.method,bank:payForm.bank,pengirim:payForm.pengirim,referensi:payForm.referensi,tanggal:payForm.date,catatan:`${inv.invoiceNo}${payForm.catatan?" - "+payForm.catatan:""}`,inputBy:user,inputAt:now()};
    await savePayments([...payments,payRecord]);
    await addAudit("INV_BAYAR",`${inv.invoiceNo} – ${inv.tenantName}: ${type==="full"?"Bayar Penuh":"Bayar Sebagian"} ${fRp(amt)}${fullyPaid?" → LUNAS":` (sisa ${fRp(remaining-amt)})`}`);
    setPayModal(null);
    if(fullyPaid) alert(`✅ ${inv.invoiceNo} LUNAS!`);
  };

  const showShare = (inv) => setShowWA({ inv, msg: genWAMsg(inv) });

  const saveEditInv = async () => {
    const inv = editInvModal;
    const updatedInv = {...inv, nominal:+editInvForm.nominal, dueDate:editInvForm.dueDate};
    const updatedInvs = invoices.map(i=>i.id===inv.id?updatedInv:i);
    await saveInvs(updatedInvs);
    await store.set(`km-inv-${inv.id}`, updatedInv);
    await addAudit("INV_EDIT",`${inv.invoiceNo} diedit: nominal ${fRp(editInvForm.nominal)}, JT ${fD(editInvForm.dueDate)}`);
    setEditInvModal(null);
  };

  const activeTenants = tenants.filter(t=>t.aktif);
  const ms = months6();
  const noBank = !settings.bankAccounts?.length;

  // Jatuh tempo terdekat (unpaid invoices sorted by due date)
  const unpaidInvs = invoices.filter(i=>!isLunas(i)).sort((a,b)=>new Date(a.dueDate||"9999")-new Date(b.dueDate||"9999"));

  if (multiModal) {
    const room = rooms.find(r=>r.id===multiModal.kamarId);
    const months = Array.from({length:multiMonths},(_,i)=>{
      const today=new Date(); const d=new Date(today.getFullYear(),today.getMonth()+i,1);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
    });
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <h2 className="text-xl font-black text-slate-900 mb-1">Buat Invoice Multi Bulan</h2>
          <p className="text-slate-500 text-sm mb-5">{multiModal.nama} · Kamar {room?.nomor} · {fRp(room?.harga||0)}/bln</p>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-2">Jumlah Bulan</label>
              <div className="flex gap-2">
                {[1,2,3,6,12].map(n=>(
                  <button key={n} onClick={()=>{setMultiMonths(n);setMultiPrice((room?.harga||0)*n);}}
                    className={`px-4 py-2 rounded-xl text-sm font-bold border transition ${multiMonths===n?"bg-blue-600 text-white border-blue-600":"bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                    {n} bln
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Total Harga (Rp)</label>
              <input type="number" className={inp} value={multiPrice||0}
                onChange={e=>setMultiPrice(+e.target.value)}/>
              {(()=>{
                const normal=(room?.harga||0)*multiMonths;
                const diff=normal-multiPrice;
                if(diff>0) return <p className="text-xs text-emerald-600 mt-1 font-bold">🏷 Diskon {fRp(diff)} ({Math.round(diff/normal*100)}%) dari harga normal {fRp(normal)}</p>;
                if(diff<0) return <p className="text-xs text-amber-600 mt-1 font-bold">⚠ Lebih mahal {fRp(-diff)} dari harga normal</p>;
                return <p className="text-xs text-slate-400 mt-1">Harga normal: {fRp(normal)} ({fRp(room?.harga||0)} × {multiMonths} bln)</p>;
              })()}
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={()=>setMultiModal(null)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm">Batal</button>
              <button onClick={generateMulti} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm">Generate Invoice</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Invoice Tagihan</h1>
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
        <Card className="overflow-hidden">
          <button onClick={()=>setShowGenerate(!showGenerate)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition">
            <div className="flex items-center gap-3">
              <h2 className="font-black text-slate-900">Generate Invoice per Penyewa</h2>
              <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{activeTenants.length} penyewa</span>
            </div>
            <span className={`text-sm font-bold transition-transform ${showGenerate?"text-blue-600":"text-slate-400"}`}>{showGenerate?"▲ Tutup":"▼ Buka"}</span>
          </button>
          {showGenerate&&(
          <div className="border-t border-slate-100">
            {/* Search & Sort */}
            <div className="px-5 py-3 bg-slate-50/50 flex items-center gap-3 flex-wrap">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400"/>
                <input className="w-full bg-white border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Cari nama atau no kamar..." value={genSearch} onChange={e=>setGenSearch(e.target.value)}/>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-slate-500">Urutkan:</label>
                <select value={genSort} onChange={e=>setGenSort(e.target.value)}
                  className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="kamar">No Kamar</option>
                  <option value="nama">Nama A-Z</option>
                  <option value="jt">Jatuh Tempo</option>
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-100">
                {["Kamar","Nama","No HP","Harga/Bln",""].map(h=>(
                  <th key={h} className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {(()=>{
                  let list = [...activeTenants];
                  if(genSearch){
                    const q=genSearch.toLowerCase();
                    list=list.filter(t=>{const rm=rooms.find(r=>r.id===t.kamarId);return t.nama?.toLowerCase().includes(q)||(rm?.nomor||"").toLowerCase().includes(q)||t.hp?.includes(q);});
                  }
                  list.sort((a,b)=>{
                    if(genSort==="kamar"){const ra=rooms.find(r=>r.id===a.kamarId);const rb=rooms.find(r=>r.id===b.kamarId);return (ra?.nomor||"").localeCompare(rb?.nomor||"",undefined,{numeric:true});}
                    if(genSort==="nama") return (a.nama||"").localeCompare(b.nama||"");
                    if(genSort==="jt") return (a.jatuhTempo||1)-(b.jatuhTempo||1);
                    return 0;
                  });
                  if(list.length===0) return <tr><td colSpan={6} className="text-center py-8 text-slate-400 text-sm">{genSearch?"Tidak ditemukan":"Belum ada penyewa aktif"}</td></tr>;
                  return list.map(t=>{
                    const room=rooms.find(r=>r.id===t.kamarId);
                    return (
                      <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-black text-blue-600">K-{room?.nomor||"—"}</td>
                        <td className="px-4 py-3 font-bold text-slate-800">{t.nama}</td>
                        <td className="px-4 py-3 text-slate-500">{t.hp||"—"}</td>
                        <td className="px-4 py-3 font-bold text-emerald-600">{fRp(room?.harga)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button onClick={()=>openGenerate(t)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5">
                              <FileText size={12}/>Invoice
                            </button>
                            <button onClick={()=>{const rm=rooms.find(r=>r.id===t.kamarId);setMultiPrice((rm?.harga||0)*multiMonths);setMultiModal(t);}}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5">
                              Multi
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  });
                })()}
              </tbody>
            </table>
            </div>
          </div>
          )}
        </Card>
      )}

      {/* Jatuh Tempo Terdekat */}
      {!loadingInv&&unpaidInvs.length>0&&(
        <Card className="overflow-hidden border-l-4 border-amber-400">
          <button onClick={()=>setShowDue(!showDue)}
            className="w-full px-5 py-4 flex items-center justify-between hover:bg-slate-50 transition">
            <div className="flex items-center gap-2">
              <Clock size={18} className="text-amber-500"/>
              <h2 className="font-black text-slate-900">Jatuh Tempo Terdekat</h2>
              <span className="text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">{unpaidInvs.length} belum lunas</span>
            </div>
            <span className={`text-sm font-bold ${showDue?"text-amber-600":"text-slate-400"}`}>{showDue?"▲ Tutup":"▼ Buka"}</span>
          </button>
          {showDue&&(
          <div className="px-5 pb-5 space-y-2">
            {unpaidInvs.slice(0,5).map(inv=>{
              const remaining = getRemaining(inv);
              const paid = getPaid(inv);
              const overdue = new Date(inv.dueDate)<new Date();
              return (
                <div key={inv.id} className={`flex items-center justify-between py-2.5 px-3 rounded-xl ${overdue?"bg-red-50":"bg-slate-50"}`}>
                  <div>
                    <p className="text-sm font-bold text-slate-800">{inv.tenantName} · K-{inv.roomNomor}</p>
                    <p className="text-xs text-slate-400">JT: <span className={`font-bold ${overdue?"text-red-600":"text-slate-600"}`}>{fD(inv.dueDate)}</span> · {inv.invoiceNo}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-slate-800">{fRp(remaining)}</p>
                    {paid>0&&<p className="text-[10px] text-emerald-600 font-bold">Sudah {fRp(paid)}</p>}
                  </div>
                  {isEdit&&<button onClick={()=>openPayModal(inv,"full")} className="ml-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl">Bayar</button>}
                </div>
              );
            })}
            {unpaidInvs.length>5&&<p className="text-xs text-slate-400 text-center pt-1">+{unpaidInvs.length-5} invoice lainnya</p>}
          </div>
          )}
        </Card>
      )}

      {/* Invoice list */}
      <Card>
        <button onClick={()=>setShowHistory(!showHistory)}
          className="w-full px-6 py-4 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition">
          <div className="flex items-center gap-3">
            <h2 className="font-black text-slate-900">Riwayat Invoice</h2>
            <span className="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-bold">{invoices.length} invoice</span>
          </div>
          <span className="text-slate-400 text-sm font-bold">{showHistory?"▲ Tutup":"▼ Buka"}</span>
        </button>
        {showHistory&&(<>
        {/* Filters */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-3 flex-wrap bg-slate-50/50">
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500">Status:</label>
            <select value={fStatus} onChange={e=>setFStatus(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="semua">Semua</option>
              <option value="lunas">Lunas</option>
              <option value="sebagian">Sebagian</option>
              <option value="belum">Belum Bayar</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs font-bold text-slate-500">Bulan:</label>
            <input type="month" value={fBulan} onChange={e=>setFBulan(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            {fBulan&&<button onClick={()=>setFBulan("")} className="text-xs text-red-500 font-bold hover:underline">✕ Reset</button>}
          </div>
        </div>
        {loadingInv&&<p className="text-center py-10 text-slate-400 text-sm">Memuat...</p>}
        {!loadingInv&&invoices.length===0&&<p className="text-center py-10 text-slate-400 text-sm">Belum ada invoice dibuat</p>}
        <div className="divide-y divide-slate-50">
          {invoices.filter(inv=>{
            const lunas2 = isLunas(inv); const paid2 = getPaid(inv); const partial2 = paid2>0&&!lunas2;
            if(fStatus==="lunas"&&!lunas2) return false;
            if(fStatus==="sebagian"&&!partial2) return false;
            if(fStatus==="belum"&&(lunas2||partial2)) return false;
            if(fBulan&&!(inv.targetMonth||"").startsWith(fBulan)&&!(inv.dueDate||"").startsWith(fBulan)&&!(inv.generatedAt||"").startsWith(fBulan)) return false;
            return true;
          }).map(inv=>{
            const paid = getPaid(inv);
            const remaining = getRemaining(inv);
            const lunas = isLunas(inv);
            const partial = paid>0&&!lunas;
            return (
            <div key={inv.id} className="px-4 sm:px-6 py-4 hover:bg-slate-50/80 transition">
              {/* Top: Invoice number + status + amount */}
              <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-slate-800 text-sm">{inv.invoiceNo}</span>
                  {lunas&&<span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">✓ Lunas</span>}
                  {partial&&<span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Sebagian ({fRp(paid)}/{fRp(inv.nominal)})</span>}
                  {!lunas&&!partial&&<span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Belum Bayar</span>}
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-800">{fRp(inv.nominal)}</span>
                  {!lunas&&paid>0&&<p className="text-xs font-bold text-red-500">Sisa: {fRp(remaining)}</p>}
                </div>
              </div>
              {/* Info */}
              <p className="text-sm font-bold text-slate-700">{inv.tenantName} · K-{inv.roomNomor}</p>
              <p className="text-xs text-slate-400">{inv.periode?.label}</p>
              <p className="text-xs text-slate-400">JT: {fD(inv.dueDate)} · Dibuat {fD(inv.generatedAt)}</p>
              {/* Payment history */}
              {(inv.invPayments||[]).length>0&&(
                <div className="mt-2 flex flex-wrap gap-1">
                  {(inv.invPayments||[]).map(p=>(
                    <span key={p.id} className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                      {fD(p.date)} · {fRp(p.amount)} · {p.method==="transfer"?"Transfer":"Cash"}
                    </span>
                  ))}
                </div>
              )}
              {/* Buttons */}
              <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                {!lunas&&isEdit&&<button onClick={()=>openPayModal(inv,"full")} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition">Bayar Penuh</button>}
                {!lunas&&isEdit&&<button onClick={()=>openPayModal(inv,"partial")} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition">Sebagian</button>}
                {!lunas&&isEdit&&<button onClick={()=>{setEditInvForm({nominal:inv.nominal,dueDate:inv.dueDate||""});setEditInvModal(inv);}} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition">✎ Edit</button>}
                {!lunas&&isEdit&&<button onClick={()=>cancelInvoice(inv)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition">✕ Batal</button>}
                <button onClick={()=>printInvoice(inv)} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition">🖨 PDF</button>
                {!lunas&&<button onClick={()=>showShare(inv)} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition">💬 WA</button>}
              </div>
            </div>
            );
          })}
        </div>
        </>)}
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

            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Periode Tagihan</p>
              <p className="font-black text-slate-800 text-lg">{form.periode?.label}</p>
              <p className="text-xs text-slate-400 mt-1">Dihitung otomatis dari tanggal masuk penyewa</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

      {/* Payment Modal */}
      {payModal&&(
        <Modal title={`${payModal.type==="full"?"Bayar Penuh":"Bayar Sebagian"} – ${payModal.inv.invoiceNo}`} onClose={()=>setPayModal(null)}>
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-4">
              <p className="text-sm"><span className="font-bold">Penyewa:</span> {payModal.inv.tenantName} · K-{payModal.inv.roomNomor}</p>
              <p className="text-sm"><span className="font-bold">Total Tagihan:</span> {fRp(payModal.inv.nominal)}</p>
              <p className="text-sm"><span className="font-bold">Sudah Dibayar:</span> {fRp(getPaid(payModal.inv))}</p>
              <p className="text-sm font-black text-blue-700">Sisa: {fRp(getRemaining(payModal.inv))}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Nominal Bayar (Rp) *</label>
              <input type="number" className={inp} value={payForm.amount||0}
                onChange={e=>setPayForm({...payForm,amount:+e.target.value})}
                max={getRemaining(payModal.inv)}/>
              {payModal.type==="partial"&&payForm.amount>0&&payForm.amount<getRemaining(payModal.inv)&&(
                <p className="text-xs text-amber-600 mt-1">Sisa setelah bayar: {fRp(getRemaining(payModal.inv)-payForm.amount)}</p>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Tanggal Bayar *</label>
                <input type="date" className={inp} value={payForm.date} onChange={e=>setPayForm({...payForm,date:e.target.value})}/></div>
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Metode</label>
                <select className={inp} value={payForm.method} onChange={e=>setPayForm({...payForm,method:e.target.value})}>
                  <option value="transfer">Transfer Bank</option><option value="tunai">Tunai / Cash</option></select></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Bank</label>
                <input className={inp} placeholder="BCA, BRI, Mandiri..." value={payForm.bank} onChange={e=>setPayForm({...payForm,bank:e.target.value})}/></div>
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Nama Pengirim</label>
                <input className={inp} value={payForm.pengirim} onChange={e=>setPayForm({...payForm,pengirim:e.target.value})}/></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><label className="text-xs font-bold text-slate-600 block mb-1">No. Referensi</label>
                <input className={inp} value={payForm.referensi} onChange={e=>setPayForm({...payForm,referensi:e.target.value})}/></div>
              <div><label className="text-xs font-bold text-slate-600 block mb-1">Catatan</label>
                <input className={inp} value={payForm.catatan} onChange={e=>setPayForm({...payForm,catatan:e.target.value})}/></div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Btn v="secondary" onClick={()=>setPayModal(null)}>Batal</Btn>
              <Btn v={payModal.type==="full"?"success":"primary"} onClick={recordPayment}>
                {payModal.type==="full"?"✓ Bayar Penuh":"Simpan Pembayaran Sebagian"}
              </Btn>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Invoice Modal */}
      {editInvModal&&(
        <Modal title={`Edit Invoice – ${editInvModal.invoiceNo}`} onClose={()=>setEditInvModal(null)}>
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 text-sm">
              <p><span className="font-bold">Penyewa:</span> {editInvModal.tenantName} · K-{editInvModal.roomNomor}</p>
              <p><span className="font-bold">Periode:</span> {editInvModal.periode?.label}</p>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Nominal (Rp)</label>
              <input type="number" className={inp} value={editInvForm.nominal||0}
                onChange={e=>setEditInvForm({...editInvForm,nominal:+e.target.value})}/>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-600 block mb-1">Tanggal Jatuh Tempo</label>
              <input type="date" className={inp} value={editInvForm.dueDate||""}
                onChange={e=>setEditInvForm({...editInvForm,dueDate:e.target.value})}/>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Btn v="secondary" onClick={()=>setEditInvModal(null)}>Batal</Btn>
              <Btn onClick={saveEditInv}>Simpan Perubahan</Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatusBayarPage({ rooms, tenants, payments }) {
  const [fMonth,setFMonth]=useState(new Date().toISOString().slice(0,7));
  const [search,setSearch]=useState("");
  const ms=Array.from({length:12},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-i);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;});
  const today=new Date();
  const active=tenants.filter(t=>t.aktif);
  const fil=active.filter(t=>!search||t.nama?.toLowerCase().includes(search.toLowerCase()));
  const getSt=(t)=>{
    const paid=payments.find(p=>p.penyewaId===t.id&&p.periode===fMonth);
    if(paid)return{st:"lunas",nom:paid.nominal};
    const[y,m]=fMonth.split("-").map(Number);
    if(y===today.getFullYear()&&m===today.getMonth()+1&&t.jatuhTempo){
      return{st:new Date(y,m-1,t.jatuhTempo)<today?"telat":"belum",nom:0};
    }
    return{st:"telat",nom:0};
  };
  const stats={lunas:0,belum:0,telat:0};
  active.forEach(t=>{const{st}=getSt(t);stats[st]=(stats[st]||0)+1;});
  const inp="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";
  return (
    <div className="space-y-5">
      <div><h1 className="text-xl sm:text-2xl font-black text-slate-900">Status Pembayaran</h1></div>
      <div className="flex items-center gap-3">
        <label className="text-sm font-bold text-slate-600">Bulan:</label>
        <select value={fMonth} onChange={e=>setFMonth(e.target.value)} className={inp+" w-44"}>
          {ms.map(m=><option key={m} value={m}>{new Date(m+"-01").toLocaleDateString("id-ID",{month:"long",year:"numeric"})}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[["Sudah Lunas",stats.lunas,"text-emerald-600"],["Belum Bayar",stats.belum,"text-amber-600"],["Terlambat",stats.telat,"text-red-600"]].map(([l,v,c])=>(
          <div key={l} className="bg-white rounded-2xl border border-slate-100 p-4 text-center shadow-sm">
            <p className={`text-3xl font-black ${c}`}>{v}</p>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{l}</p>
          </div>
        ))}
      </div>
      <div className="relative"><Search size={15} className="absolute left-4 top-3 text-slate-400"/>
        <input className={inp+" pl-10"} placeholder="Cari nama..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100">{["Kamar","Nama","HP","Status","Nominal"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">{h}</th>)}</tr></thead>
          <tbody>
            {fil.length===0&&<tr><td colSpan={5} className="text-center py-8 text-slate-400">Tidak ada penyewa</td></tr>}
            {fil.map(t=>{const rm=rooms.find(r=>r.id===t.kamarId);const{st,nom}=getSt(t);return(
              <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-5 py-3 font-black text-blue-600">K-{rm?.nomor||"?"}</td>
                <td className="px-5 py-3 font-bold">{t.nama}</td>
                <td className="px-5 py-3 text-slate-500 text-xs">{t.hp}</td>
                <td className="px-5 py-3"><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${st==="lunas"?"bg-emerald-100 text-emerald-700":st==="telat"?"bg-red-100 text-red-600":"bg-amber-100 text-amber-700"}`}>{st==="lunas"?"✓ Lunas":st==="telat"?"✗ Telat":"⏳ Belum"}</span></td>
                <td className="px-5 py-3 font-bold">{nom?"Rp "+nom.toLocaleString("id-ID"):"-"}</td>
              </tr>
            );})}
          </tbody>
        </table>
      </div>
    </div>
  );
}


function BagiHasilPage({ settings, payments, expenses, kasTx, bagiHasil, saveBagiHasil, addAudit, user, myPerms }) {
  const canEdit = myPerms?.bagihasil==="edit";
  const [nominal, setNominal] = useState("");
  const fRp = (n)=>"Rp "+Math.round(n||0).toLocaleString("id-ID");
  const fD = (d)=>d?new Date(d).toLocaleDateString("id-ID",{day:"2-digit",month:"long",year:"numeric"}):"-";
  const inp = "w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  // Calculate current bank balance
  const totMasuk = payments.reduce((s,p)=>s+(+p.nominal||0),0);
  const totExpenseBank = expenses.filter(e=>e.status==="approved"&&e.sumber==="bank").reduce((s,e)=>s+(+e.nominal||0),0);
  const totTransferKas = (kasTx||[]).filter(k=>k.tipe==="masuk").reduce((s,k)=>s+(+k.jumlah||0),0);
  const totBagiHasil = (bagiHasil||[]).reduce((s,b)=>s+(+b.nominal||0),0);
  const saldoAwalBank = +(settings.saldoAwal?.jumlah)||0;
  const saldoBank = saldoAwalBank + totMasuk - totExpenseBank - totTransferKas - totBagiHasil;

  const k = settings.kepemilikan || DEF.kepemilikan;
  const fee = settings.feeManager || 10;
  const nom = +nominal||0;
  const feeFerry = nom * (fee/100);
  const sisa = nom - feeFerry;
  const distribusi = {
    ricy: sisa * (k.ricy/100),
    arief: sisa * (k.arief/100),
    ferry: sisa * (k.ferry/100) + feeFerry,
  };

  const eksekusi = async () => {
    if (!nom || nom <= 0) return alert("Masukkan nominal yang akan dibagi");
    if (nom > saldoBank) return alert(`Saldo Bank tidak cukup. Saldo: ${fRp(saldoBank)}`);
    if (!confirm(`Eksekusi bagi hasil ${fRp(nom)}?\n\nFee Pengelola Ferry (${fee}%): ${fRp(feeFerry)}\n\nRicy: ${fRp(distribusi.ricy)}\nArief: ${fRp(distribusi.arief)}\nFerry: ${fRp(distribusi.ferry)}\n\nSaldo Bank akan berkurang ${fRp(nom)}`)) return;
    const entry = {
      id: Math.random().toString(36).substr(2)+Date.now().toString(36),
      tanggal: new Date().toISOString().split("T")[0],
      nominal: nom,
      fee: feeFerry,
      feePercent: fee,
      distribusi,
      kepemilikan: {...k},
      inputBy: user,
      inputAt: new Date().toISOString(),
    };
    await saveBagiHasil([entry, ...(bagiHasil||[])]);
    await addAudit("BAGI_HASIL", `Bagi hasil ${fRp(nom)} dieksekusi - Ricy: ${fRp(distribusi.ricy)}, Arief: ${fRp(distribusi.arief)}, Ferry: ${fRp(distribusi.ferry)}`);
    setNominal("");
    alert("✅ Bagi hasil berhasil dieksekusi!");
  };

  const batalkan = async (entry) => {
    if (!confirm(`Batalkan bagi hasil ${fRp(entry.nominal)} tanggal ${fD(entry.tanggal)}?\nSaldo Bank akan kembali bertambah.`)) return;
    await saveBagiHasil((bagiHasil||[]).filter(b=>b.id!==entry.id));
    await addAudit("BAGI_HASIL_BATAL", `Bagi hasil ${fRp(entry.nominal)} tanggal ${fD(entry.tanggal)} dibatalkan`);
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-slate-900">Bagi Hasil</h1>
        <p className="text-slate-400 text-sm">Distribusi keuntungan ke investor</p>
      </div>

      {/* Saldo Bank */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
        <p className="text-blue-100 text-sm font-bold uppercase tracking-wider mb-1">Saldo Bank Saat Ini</p>
        <p className="text-4xl font-black">{fRp(saldoBank)}</p>
        <p className="text-blue-200 text-xs mt-2">Tersedia untuk dibagi</p>
      </div>

      {/* Input nominal - hanya untuk yang punya akses edit */}
      {canEdit && <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
        <h2 className="font-black text-slate-900 mb-4">Eksekusi Bagi Hasil Baru</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-2">Nominal yang Dibagi</label>
            <input type="number" value={nominal} onChange={e=>setNominal(e.target.value)} placeholder="Contoh: 35000000"
              className={inp}/>
            <div className="flex gap-2 mt-2">
              {[5000000,10000000,20000000,30000000,saldoBank].filter(v=>v>0&&v<=saldoBank).map(v=>(
                <button key={v} onClick={()=>setNominal(String(v))} className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg">
                  {v===saldoBank?"Maks":fRp(v)}
                </button>
              ))}
            </div>
          </div>

          {nom > 0 && (
            <div className="bg-slate-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Preview Distribusi</p>
              <div className="flex justify-between text-sm pb-2 border-b border-slate-200">
                <span className="text-slate-600">Fee Pengelola Ferry ({fee}%)</span>
                <span className="font-bold text-amber-600">{fRp(feeFerry)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-700">Ricy Candra ({k.ricy}%)</span>
                <span className="font-black text-slate-900">{fRp(distribusi.ricy)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-700">Arief Wahyudi ({k.arief}%)</span>
                <span className="font-black text-slate-900">{fRp(distribusi.arief)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-700">Ferry Lukas ({k.ferry}% + fee)</span>
                <span className="font-black text-slate-900">{fRp(distribusi.ferry)}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-200">
                <span className="font-black text-slate-900">Total Dibagi</span>
                <span className="font-black text-blue-600">{fRp(nom)}</span>
              </div>
              <div className="flex justify-between text-xs pt-1 text-slate-500">
                <span>Saldo Bank setelah bagi hasil</span>
                <span className="font-bold">{fRp(saldoBank - nom)}</span>
              </div>
            </div>
          )}

          <button onClick={eksekusi} disabled={!nom||nom<=0||nom>saldoBank}
            className="w-full px-5 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black rounded-xl transition">
            Eksekusi Bagi Hasil
          </button>
        </div>
      </div>}

      {/* Riwayat */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-black text-slate-900">Riwayat Bagi Hasil</h2>
          <span className="text-xs font-bold text-slate-400">{(bagiHasil||[]).length} transaksi</span>
        </div>
        {(!bagiHasil||bagiHasil.length===0)?(
          <p className="text-center py-10 text-slate-400 text-sm">Belum ada bagi hasil</p>
        ):(
          <div className="divide-y divide-slate-100">
            {bagiHasil.map(b=>(
              <div key={b.id} className="px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition">
                <div>
                  <p className="font-black text-slate-900">{fRp(b.nominal)}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{fD(b.tanggal)} · oleh {b.inputBy}</p>
                  <div className="flex gap-3 mt-2 text-xs text-slate-500">
                    <span>Ricy: <span className="font-bold text-slate-700">{fRp(b.distribusi?.ricy||0)}</span></span>
                    <span>Arief: <span className="font-bold text-slate-700">{fRp(b.distribusi?.arief||0)}</span></span>
                    <span>Ferry: <span className="font-bold text-slate-700">{fRp(b.distribusi?.ferry||0)}</span></span>
                  </div>
                </div>
                {canEdit && <button onClick={()=>batalkan(b)} className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition">
                  Batalkan
                </button>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MutasiBankKasPage({ settings, saveSettings, payments, expenses, rooms, tenants, addAudit, user, role, kasTx, saveKas, bagiHasil, myPerms }) {
  const canEdit = myPerms?.mutasi==="edit";
  const [tab,setTab]=useState("bank");
  const [fMonth,setFMonth]=useState("");
  const ms=Array.from({length:6},(_,i)=>{const d=new Date();d.setMonth(d.getMonth()-i);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;});
  const inp="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none";
  const fRp=(n)=>"Rp "+Math.round(n||0).toLocaleString("id-ID");
  const fD=(d)=>d?new Date(d).toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}):"-";

  const bankIn=payments.map(p=>{const t=tenants.find(x=>x.id===p.penyewaId);const rm=rooms.find(r=>r.id===p.kamarId)||rooms.find(r=>r.id===t?.kamarId);return{id:p.id,tanggal:p.tanggal,tipe:"masuk",jumlah:+p.nominal,desc:`Sewa K-${rm?.nomor||"?"} - ${t?.nama||"?"}`,periode:p.periode};});
  const bankOut=[...expenses.filter(e=>e.status==="approved"&&e.sumber==="bank").map(e=>({id:e.id,tanggal:e.tanggal,tipe:"keluar",jumlah:+e.nominal,desc:`${e.kategori}: ${e.deskripsi}`})),
    ...(kasTx||[]).filter(k=>k.tipe==="masuk").map(k=>({id:k.id+"b",tanggal:k.tanggal,tipe:"keluar",jumlah:+k.jumlah,desc:"Transfer ke Kas"})),
    ...(bagiHasil||[]).map(b=>({id:b.id+"bh",tanggal:b.tanggal,tipe:"keluar",jumlah:+b.nominal,desc:"Bagi Hasil Investor"}))];
  const kasIn=(kasTx||[]).filter(k=>k.tipe==="masuk");
  const kasOut=expenses.filter(e=>e.status==="approved"&&(e.sumber==="kas"||!e.sumber)).map(e=>({id:e.id,tanggal:e.tanggal,tipe:"keluar",jumlah:+e.nominal,desc:`${e.kategori}: ${e.deskripsi}`}));

  const fil=(arr)=>(fMonth?arr.filter(t=>(t.periode||t.tanggal||"").startsWith(fMonth)):arr).sort((a,b)=>new Date(a.tanggal)-new Date(b.tanggal));
  const s0bank=+(settings.saldoAwal?.jumlah)||0, s0kas=+(settings.saldoKas?.jumlah)||0;
  const calcRows=(arr,s0)=>{let b=s0;return fil(arr).map(t=>{b+=t.tipe==="masuk"?t.jumlah:-t.jumlah;return{...t,saldo:b};});};
  const bankRows=calcRows([...bankIn,...bankOut],s0bank);
  const kasRows=calcRows([...kasIn,...kasOut],s0kas);
  const bankAkhir=s0bank+fil([...bankIn,...bankOut]).reduce((s,t)=>s+(t.tipe==="masuk"?t.jumlah:-t.jumlah),0);
  const kasAkhir=s0kas+fil([...kasIn,...kasOut]).reduce((s,t)=>s+(t.tipe==="masuk"?t.jumlah:-t.jumlah),0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl sm:text-2xl font-black text-slate-900">Mutasi Keuangan</h1><p className="text-slate-400 text-sm">Bank & Kas Operasional</p></div>
        {canEdit&&<button onClick={async()=>{const j=prompt("Jumlah transfer Bank ke Kas:");if(!j||isNaN(j))return;const tx={id:Math.random().toString(36).substr(2),tanggal:new Date().toISOString().split("T")[0],tipe:"masuk",jumlah:+j,deskripsi:"Transfer dari Bank",inputBy:user,inputAt:new Date().toISOString()};await saveKas([...(kasTx||[]),tx]);alert("Transfer berhasil!");}} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl">Transfer Bank→Kas</button>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[["Saldo Bank",fRp(bankAkhir),"text-blue-600"],["Saldo Kas",fRp(kasAkhir),"text-amber-600"],
          ["Total Masuk Bank",fRp(fil([...bankIn]).reduce((s,t)=>s+t.jumlah,0)),"text-emerald-600"],
          ["Total Keluar Kas",fRp(fil([...kasOut]).reduce((s,t)=>s+t.jumlah,0)),"text-red-600"]].map(([l,v,c])=>(
          <div key={l} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase">{l}</p>
            <p className={`text-xl font-black mt-1 ${c}`}>{v}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex rounded-xl overflow-hidden border border-slate-200">
          {[["bank","🏦 Bank"],["kas","💵 Kas"]].map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} className={`px-5 py-2 text-sm font-bold ${tab===t?"bg-blue-600 text-white":"bg-white text-slate-600"}`}>{l}</button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-slate-600">Periode:</label>
          <select value={fMonth} onChange={e=>setFMonth(e.target.value)} className={inp+" w-44"}>
            <option value="">Semua</option>{ms.map(m=><option key={m} value={m}>{new Date(m+"-01").toLocaleDateString("id-ID",{month:"long",year:"numeric"})}</option>)}
          </select>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-100">{["Tanggal","Deskripsi","Tipe","Jumlah","Saldo"].map(h=><th key={h} className="text-left px-5 py-3 text-xs font-bold text-slate-400 uppercase">{h}</th>)}</tr></thead>
          <tbody>
            {(tab==="bank"?bankRows:kasRows).length===0&&<tr><td colSpan={5} className="text-center py-8 text-slate-400">Belum ada transaksi</td></tr>}
            {(tab==="bank"?bankRows:kasRows).map(t=>(
              <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                <td className="px-5 py-3 text-xs text-slate-500">{fD(t.tanggal)}</td>
                <td className="px-5 py-3 text-slate-800">{t.desc}</td>
                <td className="px-5 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-full ${t.tipe==="masuk"?"bg-emerald-100 text-emerald-700":"bg-red-100 text-red-600"}`}>{t.tipe==="masuk"?"↑ Masuk":"↓ Keluar"}</span></td>
                <td className={`px-5 py-3 font-black ${t.tipe==="masuk"?"text-emerald-600":"text-red-600"}`}>{t.tipe==="masuk"?"+":"-"}{fRp(t.jumlah)}</td>
                <td className="px-5 py-3 font-bold text-slate-800">{fRp(t.saldo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function App() {
  const [role,    setRole]    = useState(_sess?.r||null);
  const [user,    setUser]    = useState(_sess?.u||null);
  const [page,    setPage]    = useState("dashboard");
  const [open,    setOpen]    = useState(typeof window!=="undefined"&&window.innerWidth>=768);
  const [settings,setSettings]= useState(DEF);
  const [rooms,   setRooms]   = useState([]);
  const [tenants, setTenants] = useState([]);
  const [payments,setPayments]= useState([]);
  const [expenses,setExpenses]= useState([]);
  const [audit,   setAudit]   = useState([]);
  const [users,   setUsers]   = useState(DEF_USERS);
  const [kasTx,   setKasTx]   = useState([]);
  const [iv,      setIV]      = useState(null);
  const [bagiHasil,setBagiHasil]= useState([]);

  // Load data in background (never blocks UI)
  useEffect(()=>{
    // Check invoice hash
    const hash=window.location.hash;
    if(hash.startsWith("#inv-")){
      store.get("km-inv-"+hash.replace("#inv-","")).then(inv=>setIV(inv||"notfound")).catch(()=>{});
      return;
    }
    (async()=>{
      try{
        await fbAuth();
        setInterval(fbRefresh, 55*60*1000);
        const sRaw=await store.get(SK.S); const s=(sRaw&&typeof sRaw==="object")?sRaw:(typeof sRaw==="string"?JSON.parse(sRaw):null); if(s)setSettings(s);
        const rRaw=await store.get(SK.R); const r=toArr(rRaw); if(r&&r.length>0)setRooms(r); else{const nr=mkRooms();setRooms(nr);store.set(SK.R,nr);}
        const res=await Promise.allSettled([store.get(SK.T),store.get(SK.P),store.get(SK.E),store.get(SK.A),store.get("km-users"),store.get(SK.K),store.get(SK.BH)]);
        const t=toArr(res[0].value); if(t)setTenants(t);
        const p=toArr(res[1].value); if(p)setPayments(p);
        const e=toArr(res[2].value); if(e)setExpenses(e);
        const a=toArr(res[3].value); if(a)setAudit(a);
        const u=toArr(res[4].value); if(u?.length)setUsers(u);
        const k=toArr(res[5].value); if(k)setKasTx(k);
        const bh=toArr(res[6].value); if(bh)setBagiHasil(bh);
      }catch(e){console.error(e);}
    })();
  },[]);

  const saveUsers=async(d)=>{setUsers(d);await store.set("km-users",d);};
  const saveKas=async(d)=>{setKasTx(d);await store.set(SK.K,d);};
  const exportAll = async () => {
    const invData = await store.get("km-invoices");
    return { rooms, tenants, payments, expenses, kasTx, settings, invoices: toArr(invData)||[] };
  };
  const login=(u)=>{setUser(u.id);setRole(u.role);try{localStorage.setItem("km-session",JSON.stringify({u:u.id,r:u.role}));}catch{}};
  const logout=()=>{setUser(null);setRole(null);setPage("dashboard");try{localStorage.removeItem("km-session");}catch{}};
  const addAudit=async(action,detail)=>{const e={id:Math.random().toString(36).substr(2)+Date.now().toString(36),action,detail,by:user,at:new Date().toISOString()};const na=[e,...(audit||[])].slice(0,200);setAudit(na);await store.set(SK.A,na);};

  const save={
    settings:async(d)=>{setSettings(d);await store.set(SK.S,d);},
    rooms:   async(d)=>{setRooms(d);   await store.set(SK.R,d);},
    tenants: async(d)=>{setTenants(d); await store.set(SK.T,d);},
    payments:async(d)=>{setPayments(d);await store.set(SK.P,d);},
    expenses:async(d)=>{setExpenses(d);await store.set(SK.E,d);},
  };

  const resetData=async(key)=>{
    const doReset=async(fbKey,stateFn)=>{await store.set(fbKey,null);stateFn();};
    if(key==="payments")  await doReset(SK.P,()=>setPayments([]));
    if(key==="expenses")  await doReset(SK.E,()=>setExpenses([]));
    if(key==="audit")     await doReset(SK.A,()=>setAudit([]));
    if(key==="tenants"){
      await store.set(SK.T,null); setTenants([]);
      await store.set("km-invoices",null);
      const cr=rooms.map(r=>({...r,status:"kosong",penyewaId:null}));
      await store.set(SK.R,cr); setRooms(cr);
    }
    if(key==="all"){
      await Promise.all([SK.T,SK.P,SK.E,SK.A,SK.K,SK.BH,"km-invoices"].map(k=>store.set(k,null)));
      const cr=rooms.map(r=>({...r,status:"kosong",penyewaId:null}));
      await store.set(SK.R,cr);
      setRooms(cr);setTenants([]);setPayments([]);setExpenses([]);setAudit([]);setKasTx([]);setBagiHasil([]);
      alert("✅ Semua data berhasil dihapus!");
    }
  };

  const resetAll=async(what)=>{
    if(what==="penyewa"){
      if(!confirm("Reset semua data penyewa, pembayaran, dan invoice?\n\nData yang dihapus TIDAK bisa dikembalikan!")) return;
      await Promise.all([SK.T,SK.P,SK.E,"km-invoices",SK.A,SK.K].map(k=>store.set(k,null)));
      const cr=rooms.map(r=>({...r,status:"kosong",penyewaId:null}));
      await store.set(SK.R,cr);
      setRooms(cr);setTenants([]);setPayments([]);setExpenses([]);setAudit([]);setKasTx([]);
      alert("✅ Semua data berhasil direset! Web sekarang seperti baru.");
    }
  };

  const saveBagiHasil = async (d)=>{setBagiHasil(d); await store.set(SK.BH,d);};
  const currentUser = (users||[]).find(u=>u.id===user) || {role,id:user};
  const myPerms = getPerms(currentUser);
  const ctx={role,user,settings,rooms,tenants,payments,expenses,audit,users,kasTx,bagiHasil,myPerms,
    saveSettings:save.settings,saveRooms:save.rooms,saveTenants:save.tenants,
    savePayments:save.payments,saveExpenses:save.expenses,addAudit,saveUsers,saveKas,saveBagiHasil,exportAll};

  // Invoice view

  if(iv) return <InvoicePublicView inv={iv==="notfound"?null:iv}/>;

  // Not logged in — show login
  if(!role) return <LoginScreen settings={settings} users={users} onLogin={login}/>;

  // Logged in — show app
  return (
    <Layout page={page} setPage={setPage} role={role} user={user} onLogout={logout}
            expenses={expenses} open={open} setOpen={setOpen} myPerms={myPerms}
            users={users} saveUsers={saveUsers} addAudit={addAudit}>
      {page==="dashboard" && <Dashboard {...ctx} setPage={setPage}/>}
      {page==="rooms"     && myPerms.rooms!=="none"     && <RoomsPage {...ctx}/>}
      {page==="tenants"   && myPerms.tenants!=="none"   && <TenantsPage {...ctx}/>}
      {page==="expenses"  && myPerms.expenses!=="none"  && <ExpensesPage {...ctx}/>}
      {page==="invoices"  && myPerms.invoices!=="none"  && <InvoicesPage {...ctx}/>}
      {page==="status"    && <StatusBayarPage {...ctx}/>}
      {page==="mutasi"    && myPerms.mutasi!=="none"    && <MutasiBankKasPage {...ctx}/>}
      {page==="bagihasil" && myPerms.bagihasil!=="none" && <BagiHasilPage {...ctx}/>}
      {page==="reports"   && myPerms.reports!=="none"   && <ReportsPage {...ctx}/>}
      {page==="settings"  && myPerms.settings==="edit"  && <SettingsPage {...ctx} onReset={resetData}/>}
      {page==="audit"     && myPerms.audit!=="none"     && <AuditPage {...ctx}/>}
    </Layout>
  );
}
