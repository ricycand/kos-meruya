import { useState, useEffect, useCallback } from 'react'

// ─── Firebase REST ────────────────────────────────────────────────────────────
const DB = 'https://kos-meruya-default-rtdb.asia-southeast1.firebasedatabase.app'
const fbGet    = (p)    => fetch(`${DB}/${p}.json`).then(r=>r.json()).catch(()=>null)
const fbSet    = (p,d)  => fetch(`${DB}/${p}.json`,{method:'PUT',body:JSON.stringify(d)})
const fbPush   = (p,d)  => fetch(`${DB}/${p}.json`,{method:'POST',body:JSON.stringify(d)}).then(r=>r.json()).then(j=>j?.name)
const fbPatch  = (p,d)  => fetch(`${DB}/${p}.json`,{method:'PATCH',body:JSON.stringify(d)})
const fbDelete = (p)    => fetch(`${DB}/${p}.json`,{method:'DELETE'})

// ─── Constants ────────────────────────────────────────────────────────────────
const USERS = {
  admin: { pw:'1234', role:'Admin',    name:'Admin' },
  ricy:  { pw:'1111', role:'Investor', name:'Ricy Candra' },
  arief: { pw:'2222', role:'Investor', name:'Arief Wahyudi' },
  ferry: { pw:'3333', role:'Investor', name:'Ferry Lukas' },
  staff: { pw:'0000', role:'Staff',    name:'Staff' },
}
const INVESTORS = [
  { id:'ricy',  name:'Ricy Candra',   pct:43.501 },
  { id:'arief', name:'Arief Wahyudi', pct:29.150 },
  { id:'ferry', name:'Ferry Lukas',   pct:27.352 },
]
const FERRY_FEE_PCT = 10
const KOS_NAME = 'Kos Meruya'
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']

// ─── Utils ────────────────────────────────────────────────────────────────────
const rp = n => 'Rp ' + Math.round(Number(n)||0).toLocaleString('id-ID')
const today = () => new Date().toISOString().slice(0,10)
const nowTs  = () => new Date().toISOString()
const fmtDate = d => { if(!d) return '-'; const dt=new Date(d+'T00:00:00'); return `${dt.getDate()} ${['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][dt.getMonth()]} ${dt.getFullYear()}` }
const toObj  = raw => raw && typeof raw==='object' ? Object.entries(raw).map(([id,v])=>({id,...v})) : []
const curMonth = () => { const n=new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}` }

// ─── Room initialization helper ───────────────────────────────────────────────
async function initRoomsIfEmpty() {
  const existing = await fbGet('km_rooms')
  if (existing && Object.keys(existing).length > 0) return
  const rooms = {}
  // 42 rooms: L1=101-112(12), L2=201-212(12), L3=301-312(12), L4=401-406(6)
  const floors = [
    {floor:1, prefix:'1', count:12},
    {floor:2, prefix:'2', count:12},
    {floor:3, prefix:'3', count:12},
    {floor:4, prefix:'4', count:6},
  ]
  floors.forEach(({floor,prefix,count})=>{
    for(let i=1;i<=count;i++){
      const no = `K-${prefix}${String(i).padStart(2,'0')}`
      rooms[no.replace('-','_')] = { no, floor, status:'kosong', price:1500000, type:'Standar' }
    }
  })
  await fbSet('km_rooms', rooms)
}

// ══════════════════════════════════════════════════════════════════════════════
// LOGIN SCREEN
// ══════════════════════════════════════════════════════════════════════════════
function LoginScreen({ onLogin }) {
  const [id, setId]   = useState('')
  const [pw, setPw]   = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  const doLogin = async e => {
    e.preventDefault()
    setErr('')
    setBusy(true)
    await new Promise(r=>setTimeout(r,300))
    const u = USERS[id.toLowerCase()]
    if (u && u.pw === pw) {
      // Load settings from Firebase
      onLogin({ id: id.toLowerCase(), role: u.role, name: u.name })
    } else {
      setErr('ID atau password salah.')
    }
    setBusy(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-indigo-800 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🏠</div>
          <h1 className="text-2xl font-bold text-gray-800">{KOS_NAME}</h1>
          <p className="text-sm text-gray-500 mt-1">Sistem Manajemen Properti</p>
        </div>
        <form onSubmit={doLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
            <input value={id} onChange={e=>setId(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="admin / ricy / arief / ferry / staff" autoComplete="username" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input type="password" value={pw} onChange={e=>setPw(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoComplete="current-password" />
          </div>
          {err && <p className="text-red-500 text-sm bg-red-50 px-3 py-2 rounded-lg">{err}</p>}
          <button type="submit" disabled={busy}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition">
            {busy ? 'Masuk...' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SIDEBAR + LAYOUT
// ══════════════════════════════════════════════════════════════════════════════
const MENU = [
  { id:'dashboard',   label:'Dashboard',      icon:'📊', roles:['Admin','Investor','Staff'] },
  { id:'kamar',       label:'Kamar',          icon:'🚪', roles:['Admin','Staff'] },
  { id:'penyewa',     label:'Penyewa',        icon:'👥', roles:['Admin','Staff'] },
  { id:'pembayaran',  label:'Pembayaran',     icon:'💳', roles:['Admin','Staff'] },
  { id:'invoice',     label:'Invoice',        icon:'🧾', roles:['Admin','Staff'] },
  { id:'statusbayar', label:'Status Bayar',   icon:'✅', roles:['Admin','Investor','Staff'] },
  { id:'kaskeluar',   label:'Kas & Keluar',   icon:'💸', roles:['Admin','Staff'] },
  { id:'mutasibank',  label:'Mutasi Bank',    icon:'🏦', roles:['Admin','Investor'] },
  { id:'laporan',     label:'Laporan',        icon:'📈', roles:['Admin','Investor'] },
  { id:'pengaturan',  label:'Pengaturan',     icon:'⚙️', roles:['Admin'] },
  { id:'logaktivitas',label:'Log Aktivitas',  icon:'📋', roles:['Admin'] },
]

function Layout({ user, onLogout, children, page, setPage }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const allowedMenu = MENU.filter(m => m.roles.includes(user.role))
  const currentMenu = allowedMenu.find(m => m.id === page) || allowedMenu[0]

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={()=>setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-gray-900 text-white z-30 transform transition-transform flex flex-col ${sidebarOpen?'translate-x-0':'-translate-x-full'} lg:translate-x-0 lg:static lg:flex flex-shrink-0`}>
        <div className="p-4 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏠</span>
            <div>
              <p className="font-bold text-sm">{KOS_NAME}</p>
              <p className="text-xs text-gray-400">{user.name} · {user.role}</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-2 overflow-y-auto min-h-0">
          {allowedMenu.map(m=>(
            <button key={m.id} onClick={()=>{setPage(m.id);setSidebarOpen(false)}}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition mb-0.5 ${page===m.id?'bg-blue-600 text-white':'text-gray-300 hover:bg-gray-700'}`}>
              <span>{m.icon}</span><span>{m.label}</span>
            </button>
          ))}
        </nav>
        <div className="flex-shrink-0 p-3 border-t border-gray-700">
          <button onClick={onLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition">
            <span>🚪</span><span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <button onClick={()=>setSidebarOpen(true)} className="lg:hidden p-1.5 rounded hover:bg-gray-100">
            <span className="text-xl">☰</span>
          </button>
          <h1 className="font-semibold text-gray-800">{currentMenu?.icon} {currentMenu?.label}</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4">
          {children}
        </main>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ══════════════════════════════════════════════════════════════════════════════
function Card({ title, value, sub, color='blue', icon }) {
  const colors = { blue:'bg-blue-50 border-blue-200', green:'bg-green-50 border-green-200', yellow:'bg-yellow-50 border-yellow-200', red:'bg-red-50 border-red-200', purple:'bg-purple-50 border-purple-200' }
  const tcolors = { blue:'text-blue-700', green:'text-green-700', yellow:'text-yellow-700', red:'text-red-700', purple:'text-purple-700' }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className={`text-xl font-bold mt-1 ${tcolors[color]}`}>{value}</p>
          {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
        </div>
        {icon && <span className="text-2xl">{icon}</span>}
      </div>
    </div>
  )
}

function Modal({ open, title, onClose, children, wide }) {
  if (!open) return null
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e=>{ if(e.target===e.currentTarget) onClose() }}>
      <div className={`bg-white rounded-xl shadow-xl w-full ${wide?'max-w-2xl':'max-w-md'} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-800">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  )
}

function Btn({ children, onClick, variant='primary', size='md', disabled, className='' }) {
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger:  'bg-red-600 hover:bg-red-700 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    ghost:   'bg-gray-100 hover:bg-gray-200 text-gray-700',
  }
  const sizes = { sm:'px-3 py-1 text-sm', md:'px-4 py-2 text-sm', lg:'px-6 py-2.5' }
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${variants[variant]} ${sizes[size]} rounded-lg font-medium transition disabled:opacity-50 ${className}`}>
      {children}
    </button>
  )
}

function Input({ label, ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" {...props} />
    </div>
  )
}

function Select({ label, children, ...props }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white" {...props}>
        {children}
      </select>
    </div>
  )
}

function Badge({ color='gray', children }) {
  const c = { gray:'bg-gray-100 text-gray-700', green:'bg-green-100 text-green-700', red:'bg-red-100 text-red-700', yellow:'bg-yellow-100 text-yellow-700', blue:'bg-blue-100 text-blue-700', purple:'bg-purple-100 text-purple-700' }
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${c[color]}`}>{children}</span>
}

// ══════════════════════════════════════════════════════════════════════════════
// DASHBOARD
// ══════════════════════════════════════════════════════════════════════════════
function Dashboard({ user, logAction }) {
  const [data, setData] = useState({ rooms:{}, tenants:{}, payments:{}, expenses:{} })
  const [loading, setLoading] = useState(true)

  useEffect(()=>{
    async function load() {
      const [rooms, tenants, payments, expenses] = await Promise.all([
        fbGet('km_rooms'), fbGet('km_tenants'), fbGet('km_payments'), fbGet('km_expenses')
      ])
      setData({ rooms:rooms||{}, tenants:tenants||{}, payments:payments||{}, expenses:expenses||{} })
      setLoading(false)
    }
    load()
  },[])

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-500">Memuat data...</div>

  const roomList    = toObj(data.rooms)
  const tenantList  = toObj(data.tenants)
  const payList     = toObj(data.payments)
  const expList     = toObj(data.expenses)

  const totalRooms  = roomList.length || 42
  const occupied    = roomList.filter(r=>r.status==='isi').length
  const vacant      = roomList.filter(r=>r.status==='kosong').length
  const occupancy   = totalRooms > 0 ? Math.round((occupied/totalRooms)*100) : 0

  // Revenue this month
  const cm = curMonth()
  const monthPay = payList.filter(p=>p.month===cm && p.type==='sewa')
  const monthRev = monthPay.reduce((s,p)=>s+(Number(p.amount)||0),0)

  // Expenses this month
  const monthExp = expList.filter(e=>e.date?.startsWith(cm) && e.status!=='ditolak')
  const monthExpTotal = monthExp.reduce((s,e)=>s+(Number(e.amount)||0),0)

  const netProfit = monthRev - monthExpTotal

  // Overdue tenants (JT sudah lewat, belum bayar bulan ini)
  const todayDate = new Date()
  const overdueList = tenantList.filter(t=>{
    if (!t.dueDate || t.status==='keluar') return false
    const paid = payList.some(p=>p.tenantId===t.id && p.month===cm && p.type==='sewa' && p.status!=='dibatalkan')
    if (paid) return false
    const dueDay = Number(t.dueDate)
    const dueDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), dueDay)
    return todayDate > dueDate
  })

  // Approaching due in 7 days
  const approaching = tenantList.filter(t=>{
    if (!t.dueDate || t.status==='keluar') return false
    const paid = payList.some(p=>p.tenantId===t.id && p.month===cm && p.type==='sewa' && p.status!=='dibatalkan')
    if (paid) return false
    const dueDay = Number(t.dueDate)
    const dueDate = new Date(todayDate.getFullYear(), todayDate.getMonth(), dueDay)
    const diff = (dueDate - todayDate) / 86400000
    return diff >= 0 && diff <= 7
  })

  // Pending expense approvals
  const pendingApproval = expList.filter(e=>e.status==='pending_approval')

  return (
    <div className="space-y-5">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card title="Tingkat Hunian" value={`${occupancy}%`} sub={`${occupied}/${totalRooms} kamar`} color="blue" icon="🏠" />
        <Card title="Pendapatan Bulan Ini" value={rp(monthRev)} sub={`${monthPay.length} pembayaran`} color="green" icon="💰" />
        <Card title="Pengeluaran" value={rp(monthExpTotal)} sub="bulan ini" color="yellow" icon="💸" />
        <Card title="Net Profit" value={rp(netProfit)} sub="bulan ini" color={netProfit>=0?'purple':'red'} icon="📈" />
      </div>

      {/* Room status bar */}
      <div className="bg-white rounded-xl p-4 border border-gray-200">
        <h3 className="font-semibold text-gray-700 mb-3">Status Kamar</h3>
        <div className="flex gap-4 text-sm mb-3">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"></span>Terisi: {occupied}</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-300 inline-block"></span>Kosong: {vacant}</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block"></span>Maintenance: {roomList.filter(r=>r.status==='maintenance').length}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
          <div className="h-4 bg-green-500 rounded-full transition-all" style={{width:`${occupancy}%`}}></div>
        </div>
      </div>

      {/* Alerts */}
      {overdueList.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <h3 className="font-semibold text-red-700 mb-2">🔴 Tunggakan ({overdueList.length} penyewa)</h3>
          <div className="space-y-1">
            {overdueList.slice(0,5).map(t=>(
              <div key={t.id} className="text-sm text-red-700 flex items-center justify-between bg-red-100 rounded-lg px-3 py-1.5">
                <span>{t.name} — {t.room}</span>
                <span>JT tgl {t.dueDate}</span>
              </div>
            ))}
            {overdueList.length > 5 && <p className="text-sm text-red-600">+{overdueList.length-5} lainnya</p>}
          </div>
        </div>
      )}

      {approaching.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-semibold text-yellow-700 mb-2">⚠️ Jatuh Tempo 7 Hari ({approaching.length} penyewa)</h3>
          <div className="space-y-1">
            {approaching.map(t=>(
              <div key={t.id} className="text-sm text-yellow-800 flex items-center justify-between bg-yellow-100 rounded-lg px-3 py-1.5">
                <span>{t.name} — {t.room}</span>
                <span>JT tgl {t.dueDate}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingApproval.length > 0 && user.role==='Admin' && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <h3 className="font-semibold text-orange-700 mb-2">⏳ Perlu Persetujuan Pengeluaran ({pendingApproval.length})</h3>
          {pendingApproval.map(e=>(
            <div key={e.id} className="text-sm text-orange-800 bg-orange-100 rounded-lg px-3 py-1.5 mb-1 flex justify-between">
              <span>{e.desc}</span><span className="font-semibold">{rp(e.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Bagi Hasil Preview — Investor only */}
      {user.role === 'Investor' && netProfit > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
          <h3 className="font-semibold text-purple-700 mb-3">💎 Estimasi Bagi Hasil Bulan Ini</h3>
          {(() => {
            const ferryFee = Math.round(netProfit * FERRY_FEE_PCT / 100)
            const distributable = netProfit - ferryFee
            return INVESTORS.map(inv => {
              const share = Math.round(distributable * inv.pct / 100)
              const isMe = inv.id === user.id
              return (
                <div key={inv.id} className={`flex justify-between text-sm py-1.5 px-2 rounded ${isMe?'bg-purple-200 font-semibold':''}`}>
                  <span>{inv.name}{isMe?' (Kamu)':''}</span>
                  <span>{rp(share)}</span>
                </div>
              )
            })
          })()}
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// KAMAR
// ══════════════════════════════════════════════════════════════════════════════
function Kamar({ user, logAction }) {
  const [rooms, setRooms]       = useState({})
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState({ floor:'', status:'' })
  const [modal, setModal]       = useState(null) // {room} or null
  const [form, setForm]         = useState({})

  const load = async () => {
    setLoading(true)
    const data = await fbGet('km_rooms')
    if (!data || Object.keys(data).length === 0) {
      await initRoomsIfEmpty()
      const d2 = await fbGet('km_rooms')
      setRooms(d2 || {})
    } else {
      setRooms(data)
    }
    setLoading(false)
  }

  useEffect(()=>{ load() },[])

  const roomList = toObj(rooms)
  const floors = [...new Set(roomList.map(r=>r.floor))].sort()
  const filtered = roomList.filter(r=>
    (!filter.floor  || String(r.floor)===filter.floor) &&
    (!filter.status || r.status===filter.status)
  )

  const openEdit = r => { setForm({...r}); setModal({room:r}) }

  const saveRoom = async () => {
    const key = form.no?.replace('-','_').replace('-','_')
    if (!key) return
    await fbPatch(`km_rooms/${key}`, { type:form.type, price:Number(form.price), status:form.status })
    await logAction('Edit Kamar', `${form.no} → status: ${form.status}, harga: ${rp(form.price)}`)
    setModal(null)
    load()
  }

  const statusColor = s => ({ isi:'green', kosong:'gray', maintenance:'yellow' })[s] || 'gray'

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-500">Memuat...</div>

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="bg-white rounded-xl p-3 border flex flex-wrap gap-3">
        <Select label="" value={filter.floor} onChange={e=>setFilter(f=>({...f,floor:e.target.value}))}>
          <option value="">Semua Lantai</option>
          {floors.map(f=><option key={f} value={f}>Lantai {f}</option>)}
        </Select>
        <Select label="" value={filter.status} onChange={e=>setFilter(f=>({...f,status:e.target.value}))}>
          <option value="">Semua Status</option>
          <option value="isi">Terisi</option>
          <option value="kosong">Kosong</option>
          <option value="maintenance">Maintenance</option>
        </Select>
        <div className="flex items-end gap-2 text-sm text-gray-600">
          <span>Menampilkan {filtered.length} dari {roomList.length} kamar</span>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {filtered.map(r=>(
          <button key={r.id} onClick={()=>user.role!=='Investor' && openEdit(r)}
            className={`rounded-xl p-3 border-2 text-center transition hover:shadow-md ${
              r.status==='isi'?'bg-green-50 border-green-300':
              r.status==='maintenance'?'bg-yellow-50 border-yellow-300':
              'bg-white border-gray-200 hover:border-blue-300'
            }`}>
            <p className="text-xs font-bold text-gray-700">{r.no}</p>
            <p className="text-xs text-gray-500 mt-0.5">L{r.floor}</p>
            <Badge color={statusColor(r.status)}>{r.status}</Badge>
            {r.status==='isi' && <p className="text-xs text-green-700 mt-1">{rp(r.price)}</p>}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card title="Terisi" value={roomList.filter(r=>r.status==='isi').length} color="green" />
        <Card title="Kosong" value={roomList.filter(r=>r.status==='kosong').length} color="blue" />
        <Card title="Maintenance" value={roomList.filter(r=>r.status==='maintenance').length} color="yellow" />
      </div>

      {/* Edit Modal */}
      <Modal open={!!modal} title={`Edit Kamar ${modal?.room?.no}`} onClose={()=>setModal(null)}>
        <div className="space-y-3">
          <Select label="Status" value={form.status||''} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
            <option value="kosong">Kosong</option>
            <option value="isi">Terisi</option>
            <option value="maintenance">Maintenance</option>
          </Select>
          <Input label="Harga Sewa (Rp)" type="number" value={form.price||''} onChange={e=>setForm(f=>({...f,price:e.target.value}))} />
          <Input label="Tipe Kamar" value={form.type||''} onChange={e=>setForm(f=>({...f,type:e.target.value}))} />
          <div className="flex gap-2 pt-2">
            <Btn onClick={saveRoom} variant="primary">Simpan</Btn>
            <Btn onClick={()=>setModal(null)} variant="ghost">Batal</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PENYEWA
// ══════════════════════════════════════════════════════════════════════════════
function Penyewa({ user, logAction }) {
  const [tenants, setTenants] = useState([])
  const [rooms, setRooms]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [modal, setModal]     = useState(null) // 'add'|'edit'|'checkout' + data
  const [form, setForm]       = useState({})
  const [busy, setBusy]       = useState(false)

  const load = async () => {
    setLoading(true)
    const [t, r] = await Promise.all([fbGet('km_tenants'), fbGet('km_rooms')])
    setTenants(toObj(t))
    setRooms(toObj(r).filter(r=>r.status==='kosong'))
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  const filtered = tenants.filter(t=>
    !t.status || t.status!=='keluar' // hide checked-out
  ).filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.room?.toLowerCase().includes(search.toLowerCase()) ||
    t.phone?.includes(search)
  )

  const defaultForm = () => ({
    name:'', room:'', phone:'', startDate:today(), dueDate:'21', deposit:'0', rent:'1500000', status:'aktif', notes:''
  })

  const openAdd    = () => { setForm(defaultForm()); setModal({type:'add'}) }
  const openEdit   = t  => { setForm({...t}); setModal({type:'edit', tenant:t}) }
  const openCheckout = t => { setForm({...t}); setModal({type:'checkout', tenant:t}) }

  const saveTenant = async () => {
    setBusy(true)
    if (modal.type === 'add') {
      const id = await fbPush('km_tenants', {...form, createdAt:nowTs()})
      // Update room status
      const roomKey = form.room?.replace('-','_').replace('-','_')
      if (roomKey) await fbPatch(`km_rooms/${roomKey}`, { status:'isi', tenantId:id })
      await logAction('Tambah Penyewa', `${form.name} di ${form.room}`)
    } else {
      await fbPatch(`km_tenants/${modal.tenant.id}`, form)
      await logAction('Edit Penyewa', `${form.name}`)
    }
    setBusy(false)
    setModal(null)
    load()
  }

  const doCheckout = async () => {
    setBusy(true)
    await fbPatch(`km_tenants/${form.id}`, { status:'keluar', checkoutDate:today() })
    const roomKey = form.room?.replace('-','_').replace('-','_')
    if (roomKey) await fbPatch(`km_rooms/${roomKey}`, { status:'kosong', tenantId:'' })
    await logAction('Checkout Penyewa', `${form.name} dari ${form.room}`)
    setBusy(false)
    setModal(null)
    load()
  }

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-500">Memuat...</div>

  // All rooms for edit dropdown
  const allRooms = async () => { const r = await fbGet('km_rooms'); return toObj(r) }

  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <input value={search} onChange={e=>setSearch(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Cari nama, kamar, HP..." />
        {user.role !== 'Investor' && <Btn onClick={openAdd}>+ Penyewa</Btn>}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Nama','Kamar','HP','JT','Sewa/Bln','Deposit','Aksi'].map(h=>(
              <th key={h} className="text-left px-3 py-2.5 text-gray-600 font-medium">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-8 text-gray-400">Tidak ada penyewa</td></tr>
            ) : filtered.map(t=>(
              <tr key={t.id} className="hover:bg-gray-50">
                <td className="px-3 py-2.5 font-medium">{t.name}</td>
                <td className="px-3 py-2.5">{t.room}</td>
                <td className="px-3 py-2.5">{t.phone}</td>
                <td className="px-3 py-2.5">Tgl {t.dueDate}</td>
                <td className="px-3 py-2.5">{rp(t.rent)}</td>
                <td className="px-3 py-2.5">{rp(t.deposit)}</td>
                <td className="px-3 py-2.5">
                  {user.role !== 'Investor' && (
                    <div className="flex gap-1.5">
                      <Btn size="sm" variant="ghost" onClick={()=>openEdit(t)}>Edit</Btn>
                      <Btn size="sm" variant="warning" onClick={()=>openCheckout(t)}>Checkout</Btn>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modal?.type==='add'||modal?.type==='edit'} title={modal?.type==='add'?'Tambah Penyewa':'Edit Penyewa'} onClose={()=>setModal(null)}>
        <div className="space-y-3">
          <Input label="Nama Lengkap" value={form.name||''} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nomor HP" value={form.phone||''} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} />
            <Input label="Tanggal JT (1-31)" type="number" min="1" max="31" value={form.dueDate||''} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Tanggal Masuk" type="date" value={form.startDate||''} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))} />
            <Input label="No. Kamar (mis: K-201)" value={form.room||''} onChange={e=>setForm(f=>({...f,room:e.target.value}))} placeholder="K-201" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Sewa/Bulan (Rp)" type="number" value={form.rent||''} onChange={e=>setForm(f=>({...f,rent:e.target.value}))} />
            <Input label="Deposit (Rp)" type="number" value={form.deposit||''} onChange={e=>setForm(f=>({...f,deposit:e.target.value}))} />
          </div>
          <Input label="Catatan" value={form.notes||''} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
          <div className="flex gap-2 pt-2">
            <Btn onClick={saveTenant} disabled={busy}>{busy?'Menyimpan...':'Simpan'}</Btn>
            <Btn onClick={()=>setModal(null)} variant="ghost">Batal</Btn>
          </div>
        </div>
      </Modal>

      {/* Checkout Modal */}
      <Modal open={modal?.type==='checkout'} title="Konfirmasi Checkout" onClose={()=>setModal(null)}>
        <div className="space-y-3">
          <p className="text-gray-700">Checkout penyewa <strong>{form.name}</strong> dari kamar <strong>{form.room}</strong>?</p>
          <p className="text-sm text-gray-500">Kamar akan otomatis dikembalikan ke status Kosong.</p>
          <div className="flex gap-2 pt-2">
            <Btn onClick={doCheckout} disabled={busy} variant="danger">{busy?'Proses...':'Ya, Checkout'}</Btn>
            <Btn onClick={()=>setModal(null)} variant="ghost">Batal</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PEMBAYARAN
// ══════════════════════════════════════════════════════════════════════════════
function Pembayaran({ user, logAction }) {
  const [payments, setPayments] = useState([])
  const [tenants, setTenants]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [filter, setFilter]     = useState({ month: '', tenantId:'' }) // default: semua
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState({})
  const [busy, setBusy]         = useState(false)

  const load = async () => {
    setLoading(true)
    const [p, t] = await Promise.all([fbGet('km_payments'), fbGet('km_tenants')])
    setPayments(toObj(p))
    setTenants(toObj(t).filter(t=>t.status!=='keluar'))
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  const filtered = payments.filter(p=>
    (!filter.month || p.month===filter.month || p.month?.startsWith(filter.month) || p.bulan===filter.month) &&
    (!filter.tenantId || p.tenantId===filter.tenantId) &&
    p.status !== 'dibatalkan'
  )
  const total = filtered.reduce((s,p)=>s+(Number(p.amount)||0),0)

  const openAdd = () => {
    setForm({ tenantId:'', month:curMonth(), amount:'', date:today(), type:'sewa', notes:'' })
    setModal(true)
  }

  const savePayment = async () => {
    setBusy(true)
    const tenant = tenants.find(t=>t.id===form.tenantId)
    const id = await fbPush('km_payments', {
      ...form, amount:Number(form.amount),
      tenantName: tenant?.name||'',
      tenantRoom: tenant?.room||'',
      status:'lunas', createdAt:nowTs()
    })
    await logAction('Input Pembayaran', `${tenant?.name} ${rp(form.amount)} bulan ${form.month}`)
    setBusy(false)
    setModal(false)
    load()
  }

  const cancelPayment = async (p) => {
    if (!confirm(`Batalkan pembayaran ${p.tenantName}?`)) return
    await fbPatch(`km_payments/${p.id}`, { status:'dibatalkan' })
    await logAction('Batalkan Pembayaran', `${p.tenantName} ${rp(p.amount)}`)
    load()
  }

  // Generate months list
  const monthOptions = []
  const now = new Date()
  for (let i = 5; i >= -1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    monthOptions.push({ val, label:`${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}` })
  }

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-500">Memuat...</div>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <Select value={filter.month} onChange={e=>setFilter(f=>({...f,month:e.target.value}))}>
          <option value="">📋 Semua Bulan</option>
          {monthOptions.map(m=><option key={m.val} value={m.val}>{m.label}</option>)}
        </Select>
        <Select value={filter.tenantId} onChange={e=>setFilter(f=>({...f,tenantId:e.target.value}))}>
          <option value="">Semua Penyewa</option>
          {tenants.map(t=><option key={t.id} value={t.id}>{t.name} ({t.room})</option>)}
        </Select>
        {user.role !== 'Investor' && <Btn onClick={openAdd}>+ Input Pembayaran</Btn>}
        <div className="ml-auto text-sm font-semibold text-green-700">Total: {rp(total)}</div>
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Tanggal','Penyewa','Kamar','Bulan','Tipe','Jumlah','Status','Aksi'].map(h=>(
              <th key={h} className="text-left px-3 py-2.5 text-gray-600 font-medium">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length===0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400">Tidak ada data</td></tr>
            ) : filtered.sort((a,b)=>b.createdAt?.localeCompare(a.createdAt||'')||0).map(p=>(
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-3 py-2.5">{fmtDate(p.date)}</td>
                <td className="px-3 py-2.5 font-medium">{p.tenantName}</td>
                <td className="px-3 py-2.5">{p.tenantRoom}</td>
                <td className="px-3 py-2.5">{p.month}</td>
                <td className="px-3 py-2.5"><Badge color={p.type==='sewa'?'blue':'purple'}>{p.type}</Badge></td>
                <td className="px-3 py-2.5 font-semibold text-green-700">{rp(p.amount)}</td>
                <td className="px-3 py-2.5"><Badge color="green">{p.status}</Badge></td>
                <td className="px-3 py-2.5">
                  {user.role==='Admin' && (
                    <Btn size="sm" variant="danger" onClick={()=>cancelPayment(p)}>Batal</Btn>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} title="Input Pembayaran" onClose={()=>setModal(false)}>
        <div className="space-y-3">
          <Select label="Penyewa" value={form.tenantId||''} onChange={e=>{
            const t = tenants.find(t=>t.id===e.target.value)
            setForm(f=>({...f,tenantId:e.target.value,amount:t?.rent||''}))
          }}>
            <option value="">-- Pilih Penyewa --</option>
            {tenants.map(t=><option key={t.id} value={t.id}>{t.name} ({t.room})</option>)}
          </Select>
          <Select label="Bulan" value={form.month||''} onChange={e=>setForm(f=>({...f,month:e.target.value}))}>
            {monthOptions.map(m=><option key={m.val} value={m.val}>{m.label}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Jumlah (Rp)" type="number" value={form.amount||''} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} />
            <Input label="Tanggal Bayar" type="date" value={form.date||''} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
          </div>
          <Select label="Tipe" value={form.type||'sewa'} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
            <option value="sewa">Sewa Bulanan</option>
            <option value="deposit">Deposit</option>
            <option value="denda">Denda</option>
            <option value="lainnya">Lainnya</option>
          </Select>
          <Input label="Catatan" value={form.notes||''} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
          <div className="flex gap-2 pt-2">
            <Btn onClick={savePayment} disabled={busy}>{busy?'Menyimpan...':'Simpan'}</Btn>
            <Btn onClick={()=>setModal(false)} variant="ghost">Batal</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// INVOICE
// ══════════════════════════════════════════════════════════════════════════════
function Invoice({ user, logAction }) {
  const [invoices, setInvoices] = useState([])
  const [tenants, setTenants]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState({})
  const [busy, setBusy]         = useState(false)

  const load = async () => {
    setLoading(true)
    const [inv, t] = await Promise.all([fbGet('km_invoices'), fbGet('km_tenants')])
    setInvoices(toObj(inv).sort((a,b)=>b.createdAt?.localeCompare(a.createdAt)||0))
    setTenants(toObj(t).filter(t=>t.status!=='keluar'))
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  const openCreate = () => {
    const now = new Date()
    const seq = String(invoices.length+1).padStart(3,'0')
    const invNo = `INV-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}-${seq}`
    setForm({ tenantId:'', month:curMonth(), amount:'', dueDate:'', notes:'', invNo })
    setModal(true)
  }

  const createInvoice = async () => {
    setBusy(true)
    const tenant = tenants.find(t=>t.id===form.tenantId)
    const inv = { ...form, amount:Number(form.amount), tenantName:tenant?.name||'', tenantRoom:tenant?.room||'', status:'belum_lunas', createdAt:nowTs() }
    await fbPush('km_invoices', inv)
    await logAction('Buat Invoice', `${inv.invNo} untuk ${tenant?.name}`)
    setBusy(false)
    setModal(false)
    load()
  }

  const markLunas = async (inv) => {
    await fbPatch(`km_invoices/${inv.id}`, { status:'lunas', paidAt:nowTs() })
    // Auto-create payment
    await fbPush('km_payments', {
      tenantId: inv.tenantId, tenantName: inv.tenantName, tenantRoom: inv.tenantRoom,
      month: inv.month, amount: Number(inv.amount), date: today(),
      type:'sewa', status:'lunas', invoiceId: inv.id, createdAt: nowTs(), notes:`Dari invoice ${inv.invNo}`
    })
    await logAction('Tandai Lunas', `${inv.invNo}`)
    load()
  }

  const waLink = inv => {
    const no = inv.tenantPhone || ''
    const waNo = no.startsWith('0') ? '62'+no.slice(1) : no
    const msg = encodeURIComponent(`Halo ${inv.tenantName},\n\nInvoice sewa kamar ${inv.tenantRoom} bulan ${inv.month}:\n\n${inv.invNo}\nJumlah: ${rp(inv.amount)}\nJatuh Tempo: ${fmtDate(inv.dueDate)}\n\nMohon segera dilunasi. Terima kasih!\n\n${KOS_NAME}`)
    return `https://wa.me/${waNo}?text=${msg}`
  }

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-500">Memuat...</div>

  const monthOptions = []
  const now = new Date()
  for (let i = 5; i >= -1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    monthOptions.push({ val, label:`${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}` })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">{invoices.length} invoice total</p>
        {user.role !== 'Investor' && <Btn onClick={openCreate}>+ Buat Invoice</Btn>}
      </div>

      <div className="space-y-3">
        {invoices.length === 0 ? (
          <div className="bg-white rounded-xl border p-8 text-center text-gray-400">Belum ada invoice</div>
        ) : invoices.map(inv => (
          <div key={inv.id} className={`bg-white rounded-xl border p-4 ${inv.status==='belum_lunas'?'border-yellow-200':''}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-800">{inv.invNo}</p>
                <p className="text-sm text-gray-600">{inv.tenantName} — {inv.tenantRoom}</p>
                <p className="text-sm text-gray-500">Bulan: {inv.month} · JT: {fmtDate(inv.dueDate)}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-lg">{rp(inv.amount)}</p>
                <Badge color={inv.status==='lunas'?'green':'yellow'}>{inv.status==='lunas'?'Lunas':'Belum Lunas'}</Badge>
              </div>
            </div>
            {inv.status === 'belum_lunas' && user.role !== 'Investor' && (
              <div className="flex gap-2 mt-3 pt-3 border-t">
                <Btn size="sm" variant="success" onClick={()=>markLunas(inv)}>✓ Tandai Lunas</Btn>
                <a href={waLink(inv)} target="_blank" rel="noreferrer">
                  <Btn size="sm" variant="ghost">📱 Kirim WA</Btn>
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={modal} title="Buat Invoice" onClose={()=>setModal(false)}>
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">No Invoice</label>
            <p className="text-sm font-mono bg-gray-50 px-3 py-2 rounded-lg border">{form.invNo}</p>
          </div>
          <Select label="Penyewa" value={form.tenantId||''} onChange={e=>{
            const t = tenants.find(t=>t.id===e.target.value)
            setForm(f=>({...f,tenantId:e.target.value,amount:t?.rent||''}))
          }}>
            <option value="">-- Pilih Penyewa --</option>
            {tenants.map(t=><option key={t.id} value={t.id}>{t.name} ({t.room})</option>)}
          </Select>
          <Select label="Bulan" value={form.month||''} onChange={e=>setForm(f=>({...f,month:e.target.value}))}>
            {monthOptions.map(m=><option key={m.val} value={m.val}>{m.label}</option>)}
          </Select>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Jumlah (Rp)" type="number" value={form.amount||''} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} />
            <Input label="Jatuh Tempo" type="date" value={form.dueDate||''} onChange={e=>setForm(f=>({...f,dueDate:e.target.value}))} />
          </div>
          <Input label="Catatan" value={form.notes||''} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
          <div className="flex gap-2 pt-2">
            <Btn onClick={createInvoice} disabled={busy}>{busy?'Membuat...':'Buat Invoice'}</Btn>
            <Btn onClick={()=>setModal(false)} variant="ghost">Batal</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// STATUS BAYAR
// ══════════════════════════════════════════════════════════════════════════════
function StatusBayar({ user }) {
  const [tenants, setTenants]   = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [filterMonth, setFilterMonth] = useState(curMonth())

  const load = async () => {
    setLoading(true)
    const [t, p] = await Promise.all([fbGet('km_tenants'), fbGet('km_payments')])
    setTenants(toObj(t).filter(t=>t.status!=='keluar'))
    setPayments(toObj(p))
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  const isPaid = t => payments.some(p=>p.tenantId===t.id && p.month===filterMonth && p.type==='sewa' && p.status!=='dibatalkan')

  const months = []
  const now = new Date()
  for (let i = 5; i >= -1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    months.push({ val, label:`${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}` })
  }

  const paid   = tenants.filter(t=>isPaid(t))
  const unpaid = tenants.filter(t=>!isPaid(t))

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-500">Memuat...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={filterMonth} onChange={e=>setFilterMonth(e.target.value)}>
          {months.map(m=><option key={m.val} value={m.val}>{m.label}</option>)}
        </Select>
        <span className="text-sm text-gray-600">
          {paid.length} lunas / {unpaid.length} belum — {tenants.length} total
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card title="Sudah Bayar" value={paid.length} sub={`dari ${tenants.length} penyewa`} color="green" icon="✅" />
        <Card title="Belum Bayar" value={unpaid.length} sub="bulan ini" color="red" icon="⚠️" />
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-3 py-2.5 text-gray-600 font-medium">Penyewa</th>
              <th className="text-left px-3 py-2.5 text-gray-600 font-medium">Kamar</th>
              <th className="text-left px-3 py-2.5 text-gray-600 font-medium">JT</th>
              <th className="text-left px-3 py-2.5 text-gray-600 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tenants.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Tidak ada penyewa</td></tr>
            ) : tenants.sort((a,b)=>isPaid(b)-isPaid(a)).map(t=>(
              <tr key={t.id} className={`hover:bg-gray-50 ${!isPaid(t)?'bg-red-50':''}`}>
                <td className="px-3 py-2.5 font-medium">{t.name}</td>
                <td className="px-3 py-2.5">{t.room}</td>
                <td className="px-3 py-2.5">Tgl {t.dueDate}</td>
                <td className="px-3 py-2.5">
                  {isPaid(t) ? <Badge color="green">✓ Lunas</Badge> : <Badge color="red">✗ Belum</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// KAS & KELUAR
// ══════════════════════════════════════════════════════════════════════════════
function KasKeluar({ user, logAction }) {
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState({})
  const [busy, setBusy]         = useState(false)
  const [filter, setFilter]     = useState({ month: '' }) // default: semua bulan

  const LIMIT_APPROVAL = 5000000

  const load = async () => {
    setLoading(true)
    const data = await fbGet('km_expenses')
    setExpenses(toObj(data).sort((a,b)=>b.createdAt?.localeCompare(a.createdAt)||0))
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  // Match date against month filter — handles yyyy-mm-dd, dd/mm/yyyy, mm/yyyy, etc.
  const matchMonth = (dateStr, monthFilter) => {
    if (!monthFilter) return true
    if (!dateStr) return false
    const [yr, mo] = monthFilter.split('-') // e.g. '2026-05'
    // Handle yyyy-mm-dd (standard)
    if (dateStr.startsWith(monthFilter)) return true
    // Handle dd/mm/yyyy
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/')
      if (parts.length === 3) return parts[2] === yr && parts[1] === mo
      if (parts.length === 2) return parts[1] === yr && parts[0] === mo
    }
    // Handle mm-yyyy or mm/yyyy
    return dateStr.includes(`${mo}-${yr}`) || dateStr.includes(`${mo}/${yr}`)
  }

  const filtered = expenses.filter(e=>
    (!filter.month || matchMonth(e.date || e.tanggal, filter.month))
  )
  const total = filtered.filter(e=>e.status!=='ditolak').reduce((s,e)=>s+(Number(e.amount)||0),0)

  const openAdd = () => {
    setForm({ desc:'', amount:'', date:today(), category:'operasional', source:'kas', notes:'' })
    setModal(true)
  }

  const saveExpense = async () => {
    setBusy(true)
    const amount = Number(form.amount)
    const status = amount >= LIMIT_APPROVAL ? 'pending_approval' : 'approved'
    await fbPush('km_expenses', { ...form, amount, status, createdAt:nowTs(), createdBy:user.name })
    await logAction('Input Pengeluaran', `${form.desc} ${rp(amount)} ${status==='pending_approval'?'(menunggu approval)':''}`)
    setBusy(false)
    setModal(false)
    load()
  }

  const approve = async (e, approved) => {
    await fbPatch(`km_expenses/${e.id}`, { status: approved?'approved':'ditolak', approvedBy:user.name, approvedAt:nowTs() })
    await logAction(approved?'Approve Pengeluaran':'Tolak Pengeluaran', `${e.desc} ${rp(e.amount)}`)
    load()
  }

  const months = []
  const now = new Date()
  for (let i = 5; i >= -1; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    months.push({ val, label:`${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}` })
  }

  const statusBadge = s => {
    const map = { approved:{c:'green',l:'Approved'}, pending_approval:{c:'yellow',l:'Pending'}, ditolak:{c:'red',l:'Ditolak'} }
    const m = map[s] || {c:'gray',l:s}
    return <Badge color={m.c}>{m.l}</Badge>
  }

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-500">Memuat...</div>

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-end">
        <Select value={filter.month} onChange={e=>setFilter(f=>({...f,month:e.target.value}))}>
          <option value="">📋 Semua Bulan</option>
          {months.map(m=><option key={m.val} value={m.val}>{m.label}</option>)}
        </Select>
        {user.role !== 'Investor' && <Btn onClick={openAdd}>+ Input Pengeluaran</Btn>}
        <div className="ml-auto text-sm font-semibold text-red-700">Total: {rp(total)}</div>
      </div>

      {/* Pending approvals */}
      {expenses.filter(e=>e.status==='pending_approval').length > 0 && user.role === 'Admin' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">⏳ Menunggu Persetujuan (≥{rp(LIMIT_APPROVAL)})</h3>
          {expenses.filter(e=>e.status==='pending_approval').map(e=>(
            <div key={e.id} className="flex items-center justify-between bg-white rounded-lg p-3 mb-2 border">
              <div>
                <p className="font-medium text-sm">{e.desc}</p>
                <p className="text-xs text-gray-500">{fmtDate(e.date)} · {e.source} · {e.createdBy}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">{rp(e.amount)}</span>
                <Btn size="sm" variant="success" onClick={()=>approve(e,true)}>✓</Btn>
                <Btn size="sm" variant="danger" onClick={()=>approve(e,false)}>✗</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Tanggal','Deskripsi','Kategori','Sumber','Jumlah','Status'].map(h=>(
              <th key={h} className="text-left px-3 py-2.5 text-gray-600 font-medium">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length===0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400">Tidak ada data</td></tr>
            ) : filtered.map(e=>(
              <tr key={e.id} className={`hover:bg-gray-50 ${e.status==='ditolak'?'opacity-50':''}`}>
                <td className="px-3 py-2.5">{fmtDate(e.date)}</td>
                <td className="px-3 py-2.5 font-medium">{e.desc}</td>
                <td className="px-3 py-2.5"><Badge color="gray">{e.category}</Badge></td>
                <td className="px-3 py-2.5"><Badge color={e.source==='bank'?'blue':'purple'}>{e.source}</Badge></td>
                <td className="px-3 py-2.5 font-semibold text-red-700">{rp(e.amount)}</td>
                <td className="px-3 py-2.5">{statusBadge(e.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modal} title="Input Pengeluaran" onClose={()=>setModal(false)}>
        <div className="space-y-3">
          <Input label="Deskripsi" value={form.desc||''} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} placeholder="mis: Tagihan PLN, Perbaikan AC..." />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Jumlah (Rp)" type="number" value={form.amount||''} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} />
            <Input label="Tanggal" type="date" value={form.date||''} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Kategori" value={form.category||'operasional'} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
              <option value="operasional">Operasional</option>
              <option value="perawatan">Perawatan</option>
              <option value="utilitas">Utilitas (Air/Listrik)</option>
              <option value="gaji">Gaji/Honor</option>
              <option value="lainnya">Lainnya</option>
            </Select>
            <Select label="Sumber Dana" value={form.source||'kas'} onChange={e=>setForm(f=>({...f,source:e.target.value}))}>
              <option value="kas">Kas</option>
              <option value="bank">Bank</option>
            </Select>
          </div>
          <Input label="Catatan" value={form.notes||''} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} />
          {Number(form.amount) >= LIMIT_APPROVAL && (
            <p className="text-sm text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg">
              ⚠️ Pengeluaran ≥{rp(LIMIT_APPROVAL)} memerlukan persetujuan Admin.
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <Btn onClick={saveExpense} disabled={busy}>{busy?'Menyimpan...':'Simpan'}</Btn>
            <Btn onClick={()=>setModal(false)} variant="ghost">Batal</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MUTASI BANK
// ══════════════════════════════════════════════════════════════════════════════
function MutasiBank({ user, logAction }) {
  const [mutations, setMutations] = useState([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('bank') // 'bank' | 'kas'
  const [modal, setModal]         = useState(false)
  const [form, setForm]           = useState({})
  const [busy, setBusy]           = useState(false)

  const load = async () => {
    setLoading(true)
    const data = await fbGet('km_mutations')
    setMutations(toObj(data).sort((a,b)=>b.createdAt?.localeCompare(a.createdAt)||0))
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  const filtered = mutations.filter(m=>m.account===tab)

  const bankTotal = mutations.filter(m=>m.account==='bank').reduce((s,m)=>s+(m.type==='masuk'?1:-1)*(Number(m.amount)||0),0)
  const kasTotal  = mutations.filter(m=>m.account==='kas').reduce((s,m)=>s+(m.type==='masuk'?1:-1)*(Number(m.amount)||0),0)

  const openAdd = () => {
    setForm({ account:tab, type:'masuk', amount:'', date:today(), desc:'', ref:'' })
    setModal(true)
  }

  const openTransfer = () => {
    setForm({ account:'transfer', type:'transfer', amount:'', date:today(), desc:'Transfer Bank → Kas', ref:'' })
    setModal('transfer')
  }

  const saveMutation = async () => {
    setBusy(true)
    if (modal === 'transfer') {
      // Bank keluar + Kas masuk
      await fbPush('km_mutations', { account:'bank', type:'keluar', amount:Number(form.amount), date:form.date, desc:form.desc||'Transfer ke Kas', createdAt:nowTs() })
      await fbPush('km_mutations', { account:'kas',  type:'masuk',  amount:Number(form.amount), date:form.date, desc:form.desc||'Transfer dari Bank', createdAt:nowTs() })
      await logAction('Transfer Bank→Kas', rp(form.amount))
    } else {
      await fbPush('km_mutations', { ...form, amount:Number(form.amount), createdAt:nowTs() })
      await logAction('Input Mutasi', `${form.account} ${form.type} ${rp(form.amount)}`)
    }
    setBusy(false)
    setModal(false)
    load()
  }

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-500">Memuat...</div>

  return (
    <div className="space-y-4">
      {/* Balances */}
      <div className="grid grid-cols-2 gap-3">
        <Card title="Saldo Bank" value={rp(bankTotal)} color="blue" icon="🏦" />
        <Card title="Saldo Kas" value={rp(kasTotal)} color="green" icon="💵" />
      </div>

      {/* Tabs + Actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
          {['bank','kas'].map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${tab===t?'bg-white shadow text-blue-600':'text-gray-600'}`}>
              {t === 'bank' ? '🏦 Bank' : '💵 Kas'}
            </button>
          ))}
        </div>
        {user.role !== 'Investor' && (
          <div className="flex gap-2">
            <Btn size="sm" variant="ghost" onClick={openTransfer}>⇄ Transfer</Btn>
            <Btn size="sm" onClick={openAdd}>+ Input</Btn>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Tanggal','Deskripsi','Tipe','Jumlah'].map(h=>(
              <th key={h} className="text-left px-3 py-2.5 text-gray-600 font-medium">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length===0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Tidak ada mutasi</td></tr>
            ) : filtered.map(m=>(
              <tr key={m.id} className="hover:bg-gray-50">
                <td className="px-3 py-2.5">{fmtDate(m.date)}</td>
                <td className="px-3 py-2.5">{m.desc}</td>
                <td className="px-3 py-2.5"><Badge color={m.type==='masuk'?'green':'red'}>{m.type}</Badge></td>
                <td className={`px-3 py-2.5 font-semibold ${m.type==='masuk'?'text-green-700':'text-red-700'}`}>
                  {m.type==='masuk'?'+':'-'}{rp(m.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={!!modal} title={modal==='transfer'?'Transfer Bank → Kas':'Input Mutasi'} onClose={()=>setModal(false)}>
        <div className="space-y-3">
          {modal !== 'transfer' && (
            <div className="grid grid-cols-2 gap-3">
              <Select label="Akun" value={form.account||'bank'} onChange={e=>setForm(f=>({...f,account:e.target.value}))}>
                <option value="bank">Bank</option>
                <option value="kas">Kas</option>
              </Select>
              <Select label="Tipe" value={form.type||'masuk'} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                <option value="masuk">Masuk</option>
                <option value="keluar">Keluar</option>
              </Select>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Jumlah (Rp)" type="number" value={form.amount||''} onChange={e=>setForm(f=>({...f,amount:e.target.value}))} />
            <Input label="Tanggal" type="date" value={form.date||''} onChange={e=>setForm(f=>({...f,date:e.target.value}))} />
          </div>
          <Input label="Deskripsi" value={form.desc||''} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} />
          <div className="flex gap-2 pt-2">
            <Btn onClick={saveMutation} disabled={busy}>{busy?'Menyimpan...':'Simpan'}</Btn>
            <Btn onClick={()=>setModal(false)} variant="ghost">Batal</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// LAPORAN BAGI HASIL
// ══════════════════════════════════════════════════════════════════════════════
function Laporan({ user }) {
  const [payments, setPayments] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading]   = useState(true)
  const [month, setMonth]       = useState(curMonth())

  const load = async () => {
    setLoading(true)
    const [p, e] = await Promise.all([fbGet('km_payments'), fbGet('km_expenses')])
    setPayments(toObj(p))
    setExpenses(toObj(e))
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  const months = []
  const now = new Date()
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const val = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`
    months.push({ val, label:`${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}` })
  }

  const revenue = payments.filter(p=>p.month===month && p.type==='sewa' && p.status!=='dibatalkan').reduce((s,p)=>s+(Number(p.amount)||0),0)
  const exp = expenses.filter(e=>e.date?.startsWith(month) && e.status==='approved').reduce((s,e)=>s+(Number(e.amount)||0),0)
  const netProfit = revenue - exp
  const ferryFee  = Math.round(netProfit * FERRY_FEE_PCT / 100)
  const distributable = netProfit - ferryFee

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-500">Memuat...</div>

  return (
    <div className="space-y-4">
      <Select value={month} onChange={e=>setMonth(e.target.value)}>
        {months.map(m=><option key={m.val} value={m.val}>{m.label}</option>)}
      </Select>

      {/* P&L Summary */}
      <div className="grid grid-cols-3 gap-3">
        <Card title="Total Pendapatan" value={rp(revenue)} color="green" icon="💰" />
        <Card title="Total Pengeluaran" value={rp(exp)} color="red" icon="💸" />
        <Card title="Net Profit" value={rp(netProfit)} color={netProfit>=0?'purple':'red'} icon="📊" />
      </div>

      {/* Bagi Hasil */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Rincian Bagi Hasil</h3>

        {netProfit <= 0 ? (
          <p className="text-yellow-700 bg-yellow-50 rounded-lg p-3 text-sm">Net profit bulan ini {rp(netProfit)} — bagi hasil tidak dapat dilakukan.</p>
        ) : (
          <>
            <div className="text-sm text-gray-600 mb-3 p-3 bg-gray-50 rounded-lg space-y-1">
              <div className="flex justify-between"><span>Net Profit</span><span className="font-semibold">{rp(netProfit)}</span></div>
              <div className="flex justify-between text-orange-700"><span>Fee Pengelola (Ferry, {FERRY_FEE_PCT}%)</span><span>- {rp(ferryFee)}</span></div>
              <div className="flex justify-between font-semibold text-green-700 border-t pt-1 mt-1"><span>Yang Dibagi</span><span>{rp(distributable)}</span></div>
            </div>

            <div className="space-y-2">
              {INVESTORS.map(inv=>{
                const share = Math.round(distributable * inv.pct / 100)
                const ferryTotal = inv.id==='ferry' ? share + ferryFee : share
                const isMe = inv.id === user.id
                return (
                  <div key={inv.id} className={`flex items-center justify-between rounded-xl px-4 py-3 border ${isMe?'bg-blue-50 border-blue-200':''}`}>
                    <div>
                      <p className="font-semibold text-sm">{inv.name}{isMe?' (Kamu)':''}</p>
                      <p className="text-xs text-gray-500">{inv.pct}% kepemilikan{inv.id==='ferry'?' + fee pengelola':''}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-700">{rp(inv.id==='ferry'?ferryTotal:share)}</p>
                      {inv.id==='ferry' && <p className="text-xs text-gray-500">(bagi hasil + fee)</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>

      {/* Income detail */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Rincian Pembayaran Masuk</h3>
        {payments.filter(p=>p.month===month&&p.type==='sewa'&&p.status!=='dibatalkan').length === 0 ? (
          <p className="text-sm text-gray-400">Tidak ada pembayaran bulan ini</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b text-gray-600">
              <tr><th className="text-left py-1.5">Penyewa</th><th className="text-left py-1.5">Kamar</th><th className="text-right py-1.5">Jumlah</th></tr>
            </thead>
            <tbody>
              {payments.filter(p=>p.month===month&&p.type==='sewa'&&p.status!=='dibatalkan').map(p=>(
                <tr key={p.id} className="border-b border-gray-50">
                  <td className="py-1.5">{p.tenantName}</td>
                  <td className="py-1.5 text-gray-600">{p.tenantRoom}</td>
                  <td className="py-1.5 text-right font-medium text-green-700">{rp(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// PENGATURAN
// ══════════════════════════════════════════════════════════════════════════════
function Pengaturan({ user, logAction }) {
  const [settings, setSettings] = useState({ kosName:KOS_NAME, bankName:'', bankNo:'', bankOwner:'' })
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null)
  const [form, setForm]         = useState({})
  const [busy, setBusy]         = useState(false)

  // DB Diagnostics state
  const [dbStatus, setDbStatus]   = useState(null)  // null | loading | results
  const [dbChecking, setDbChecking] = useState(false)
  const [seedBusy, setSeedBusy]   = useState(false)
  const [seedResult, setSeedResult] = useState('')

  const load = async () => {
    setLoading(true)
    const [s, u] = await Promise.all([fbGet('km_settings'), fbGet('km_users')])
    if (s) setSettings(s)
    setUsers(toObj(u))
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  const saveSettings = async () => {
    setBusy(true)
    await fbSet('km_settings', settings)
    await logAction('Update Pengaturan', 'Nama kos / rekening')
    setBusy(false)
    alert('Pengaturan disimpan!')
  }

  const openAddUser = () => {
    setForm({ userId:'', name:'', role:'Staff', pw:'' })
    setModal('addUser')
  }

  const saveUser = async () => {
    setBusy(true)
    const key = form.userId.toLowerCase().replace(/\s+/g,'_')
    await fbPatch(`km_users/${key}`, { name:form.name, role:form.role, pw:form.pw })
    await logAction('Tambah/Edit User', `${form.userId} (${form.role})`)
    setBusy(false)
    setModal(null)
    load()
  }

  const deleteUser = async (u) => {
    if (!confirm(`Hapus user ${u.name}?`)) return
    await fbDelete(`km_users/${u.id}`)
    await logAction('Hapus User', u.name)
    load()
  }

  // ── Database Diagnostics ──────────────────────────────────────────────────
  const checkDatabase = async () => {
    setDbChecking(true)
    setDbStatus(null)
    const paths = ['km_rooms','km_tenants','km_payments','km_expenses','km_invoices','km_mutations','km_logs','km_settings']
    const results = []
    for (const p of paths) {
      try {
        const res = await fetch(`${DB}/${p}.json`)
        const text = await res.text()
        if (text === 'null' || text === '') {
          results.push({ path:p, count:0, status:'empty', sample:'' })
        } else {
          const data = JSON.parse(text)
          if (typeof data === 'object' && data !== null) {
            const keys = Object.keys(data)
            const sample = JSON.stringify(Object.values(data)[0]).slice(0,80)
            results.push({ path:p, count:keys.length, status:'ok', sample })
          } else {
            results.push({ path:p, count:1, status:'ok', sample:String(data).slice(0,80) })
          }
        }
      } catch(e) {
        results.push({ path:p, count:0, status:'error', sample:e.message })
      }
    }
    setDbStatus(results)
    setDbChecking(false)
  }

  // ── Data Seeder — restore baseline data ──────────────────────────────────
  const seedData = async () => {
    if (!confirm('Ini akan MENAMBAHKAN data contoh ke Firebase (tidak menghapus data yang ada). Lanjutkan?')) return
    setSeedBusy(true)
    setSeedResult('')
    const results = []

    try {
      // Seed rooms if empty
      const existingRooms = await fbGet('km_rooms')
      if (!existingRooms || Object.keys(existingRooms).length === 0) {
        const rooms = {}
        const floors = [{f:1,c:12},{f:2,c:12},{f:3,c:12},{f:4,c:6}]
        floors.forEach(({f,c})=>{
          for(let i=1;i<=c;i++){
            const no = `K-${f}${String(i).padStart(2,'0')}`
            const key = `K_${f}${String(i).padStart(2,'0')}`
            rooms[key] = { no, floor:f, status:'kosong', price:1500000, type:'Standar' }
          }
        })
        await fbSet('km_rooms', rooms)
        results.push('✅ 42 kamar berhasil dibuat')
      } else {
        results.push(`⏭️ Kamar sudah ada (${Object.keys(existingRooms).length} kamar)`)
      }

      // Seed tenant Anto
      const existingTenants = await fbGet('km_tenants')
      const tenantList = existingTenants ? Object.values(existingTenants) : []
      const antoExists = tenantList.some(t=>t.name==='Anto')
      if (!antoExists) {
        const tenantId = await fbPush('km_tenants', {
          name:'Anto', room:'K-201', phone:'081283020335',
          dueDate:'21', startDate:'2026-01-01',
          rent:1000000, deposit:1000000, status:'aktif',
          notes:'Penyewa lama', createdAt:nowTs()
        })
        // Update room K_201 status
        await fbPatch('km_rooms/K_201', { status:'isi', tenantId })
        results.push('✅ Penyewa Anto (K-201) berhasil ditambahkan')
      } else {
        results.push('⏭️ Penyewa Anto sudah ada')
      }

      // Seed payment
      const existingPay = await fbGet('km_payments')
      const payList = existingPay ? Object.values(existingPay) : []
      const payExists = payList.some(p=>p.tenantName==='Anto' && p.month==='2026-05')
      if (!payExists) {
        await fbPush('km_payments', {
          tenantId:'', tenantName:'Anto', tenantRoom:'K-201',
          month:'2026-05', amount:1000000, date:'2026-05-01',
          type:'sewa', status:'lunas', createdAt:nowTs(), notes:'Seed data'
        })
        results.push('✅ Pembayaran Anto Mei 2026 berhasil ditambahkan')
      } else {
        results.push('⏭️ Pembayaran Anto Mei 2026 sudah ada')
      }

      // Seed expenses
      const existingExp = await fbGet('km_expenses')
      const expList = existingExp ? Object.values(existingExp) : []
      if (expList.length === 0) {
        await fbPush('km_expenses', {
          desc:'Tagihan Air', amount:150000, date:'2026-05-01',
          category:'utilitas', source:'kas', status:'approved',
          createdBy:'Admin', createdAt:nowTs()
        })
        await fbPush('km_expenses', {
          desc:'Plafon bocor', amount:250000, date:'2026-05-10',
          category:'perawatan', source:'kas', status:'approved',
          createdBy:'Admin', createdAt:nowTs()
        })
        results.push('✅ 2 pengeluaran (Air + Plafon) berhasil ditambahkan')
      } else {
        results.push(`⏭️ Pengeluaran sudah ada (${expList.length} data)`)
      }

      await logAction('Seed Database', results.join(' | '))
      setSeedResult(results.join('\n'))
    } catch(e) {
      setSeedResult('❌ Error: ' + e.message)
    }
    setSeedBusy(false)
  }

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-500">Memuat...</div>

  return (
    <div className="space-y-5">
      {/* General Settings */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Informasi Kos</h3>
        <div className="space-y-3">
          <Input label="Nama Kos" value={settings.kosName||''} onChange={e=>setSettings(s=>({...s,kosName:e.target.value}))} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nama Bank" value={settings.bankName||''} onChange={e=>setSettings(s=>({...s,bankName:e.target.value}))} placeholder="mis: BCA" />
            <Input label="No. Rekening" value={settings.bankNo||''} onChange={e=>setSettings(s=>({...s,bankNo:e.target.value}))} />
          </div>
          <Input label="Atas Nama" value={settings.bankOwner||''} onChange={e=>setSettings(s=>({...s,bankOwner:e.target.value}))} />
          <Btn onClick={saveSettings} disabled={busy}>{busy?'Menyimpan...':'Simpan Pengaturan'}</Btn>
        </div>
      </div>

      {/* ── DATABASE DIAGNOSTICS ── */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-gray-800 mb-1">🔍 Cek Database Firebase</h3>
        <p className="text-xs text-gray-500 mb-3">Cek koneksi dan isi setiap tabel di Firebase Realtime Database</p>
        <div className="flex gap-2 mb-4">
          <Btn onClick={checkDatabase} disabled={dbChecking} variant="ghost">
            {dbChecking ? '⏳ Mengecek...' : '🔍 Cek Sekarang'}
          </Btn>
        </div>
        {dbStatus && (
          <div className="space-y-2">
            {dbStatus.map(r=>(
              <div key={r.path} className={`flex items-start justify-between rounded-lg px-3 py-2.5 text-sm ${
                r.status==='error'?'bg-red-50 border border-red-200':
                r.count===0?'bg-yellow-50 border border-yellow-200':
                'bg-green-50 border border-green-200'
              }`}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-gray-700">{r.path}</span>
                    <Badge color={r.status==='error'?'red':r.count===0?'yellow':'green'}>
                      {r.status==='error'?'ERROR':r.count===0?'KOSONG':`${r.count} records`}
                    </Badge>
                  </div>
                  {r.sample && <p className="text-xs text-gray-500 mt-0.5 font-mono truncate max-w-sm">{r.sample}</p>}
                </div>
              </div>
            ))}
            {/* Summary */}
            <div className="pt-2 border-t text-sm text-gray-600">
              {dbStatus.every(r=>r.status==='error') ? (
                <p className="text-red-600 font-medium">❌ Semua path error — kemungkinan Firebase Rules memblokir akses. Cek di Firebase Console → Realtime Database → Rules.</p>
              ) : dbStatus.filter(r=>r.count===0 && r.status!=='error').length > 3 ? (
                <p className="text-yellow-700">⚠️ Banyak tabel kosong — klik "Restore Data Awal" di bawah untuk mengisi data contoh.</p>
              ) : (
                <p className="text-green-700">✅ Database dapat diakses. Kalau data tidak muncul, cek filter bulan di halaman masing-masing.</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── DATA SEEDER ── */}
      <div className="bg-white rounded-xl border p-4">
        <h3 className="font-semibold text-gray-800 mb-1">🌱 Restore / Seed Data Awal</h3>
        <p className="text-xs text-gray-500 mb-3">Menambahkan data contoh (42 kamar, penyewa Anto, pembayaran, pengeluaran). Tidak menghapus data yang sudah ada.</p>
        <Btn onClick={seedData} disabled={seedBusy} variant="warning">
          {seedBusy ? '⏳ Memproses...' : '🌱 Restore Data Awal'}
        </Btn>
        {seedResult && (
          <div className="mt-3 bg-gray-50 border rounded-lg p-3">
            <pre className="text-xs text-gray-700 whitespace-pre-wrap font-mono">{seedResult}</pre>
          </div>
        )}
      </div>

      {/* User Management */}
      <div className="bg-white rounded-xl border p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">Kelola Pengguna (Firebase)</h3>
          <Btn size="sm" onClick={openAddUser}>+ Tambah</Btn>
        </div>
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <p className="font-medium mb-1">👥 User Default (hardcoded):</p>
          <p>admin/1234 · ricy/1111 · arief/2222 · ferry/3333 · staff/0000</p>
        </div>
        {users.length > 0 && (
          <table className="w-full text-sm">
            <thead className="border-b text-gray-600">
              <tr><th className="text-left py-2">ID</th><th className="text-left py-2">Nama</th><th className="text-left py-2">Role</th><th className="py-2"></th></tr>
            </thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id} className="border-b border-gray-50">
                  <td className="py-2 font-mono">{u.id}</td>
                  <td className="py-2">{u.name}</td>
                  <td className="py-2"><Badge color={u.role==='Admin'?'blue':u.role==='Investor'?'purple':'gray'}>{u.role}</Badge></td>
                  <td className="py-2 text-right">
                    <Btn size="sm" variant="danger" onClick={()=>deleteUser(u)}>Hapus</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={modal==='addUser'} title="Tambah User" onClose={()=>setModal(null)}>
        <div className="space-y-3">
          <Input label="User ID" value={form.userId||''} onChange={e=>setForm(f=>({...f,userId:e.target.value}))} placeholder="mis: budi" />
          <Input label="Nama" value={form.name||''} onChange={e=>setForm(f=>({...f,name:e.target.value}))} />
          <Select label="Role" value={form.role||'Staff'} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
            <option value="Admin">Admin</option>
            <option value="Investor">Investor</option>
            <option value="Staff">Staff</option>
          </Select>
          <Input label="Password" type="password" value={form.pw||''} onChange={e=>setForm(f=>({...f,pw:e.target.value}))} />
          <div className="flex gap-2 pt-2">
            <Btn onClick={saveUser} disabled={busy}>{busy?'Menyimpan...':'Simpan'}</Btn>
            <Btn onClick={()=>setModal(null)} variant="ghost">Batal</Btn>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// LOG AKTIVITAS
// ══════════════════════════════════════════════════════════════════════════════
function LogAktivitas() {
  const [logs, setLogs]   = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    const data = await fbGet('km_logs')
    setLogs(toObj(data).sort((a,b)=>b.ts?.localeCompare(a.ts)||0))
    setLoading(false)
  }
  useEffect(()=>{ load() },[])

  if (loading) return <div className="flex items-center justify-center h-40 text-gray-500">Memuat...</div>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">{logs.length} aktivitas tercatat</p>
        <Btn size="sm" variant="ghost" onClick={load}>↻ Refresh</Btn>
      </div>
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>{['Waktu','User','Aksi','Detail'].map(h=>(
              <th key={h} className="text-left px-3 py-2.5 text-gray-600 font-medium">{h}</th>
            ))}</tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.length===0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-gray-400">Belum ada log</td></tr>
            ) : logs.slice(0,200).map(l=>(
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-3 py-2 text-gray-500 whitespace-nowrap text-xs">{l.ts?.slice(0,16).replace('T',' ')}</td>
                <td className="px-3 py-2"><Badge color="blue">{l.user}</Badge></td>
                <td className="px-3 py-2 font-medium">{l.action}</td>
                <td className="px-3 py-2 text-gray-600">{l.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN APP — THE KEY FIX IS HERE
// Both login screen and main app are always mounted (CSS toggle, not conditional swap)
// This prevents React 18 removeChild DOM reconciliation errors
// ══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [user, setUser]   = useState(null)
  const [page, setPage]   = useState('dashboard')

  const logAction = useCallback(async (action, detail='') => {
    if (!user) return
    await fbPush('km_logs', { action, detail, user:user.name, role:user.role, ts:nowTs() })
  }, [user])

  const handleLogin  = u => { setUser(u); setPage('dashboard') }
  const handleLogout = () => { setUser(null) }

  const renderPage = () => {
    const props = { user, logAction }
    switch(page) {
      case 'dashboard':    return <Dashboard    {...props} />
      case 'kamar':        return <Kamar        {...props} />
      case 'penyewa':      return <Penyewa      {...props} />
      case 'pembayaran':   return <Pembayaran   {...props} />
      case 'invoice':      return <Invoice      {...props} />
      case 'statusbayar':  return <StatusBayar  {...props} />
      case 'kaskeluar':    return <KasKeluar    {...props} />
      case 'mutasibank':   return <MutasiBank   {...props} />
      case 'laporan':      return <Laporan      {...props} />
      case 'pengaturan':   return <Pengaturan   {...props} />
      case 'logaktivitas': return <LogAktivitas {...props} />
      default:             return <Dashboard    {...props} />
    }
  }

  return (
    // Single stable root — NEVER unmounts or swaps at top level
    // This is the fix: both views coexist in DOM, toggled via display CSS
    <div style={{height:'100vh',overflow:'hidden'}}>
      {/* LOGIN — shown when no user */}
      <div style={{display: user ? 'none' : 'block', height:'100%'}}>
        <LoginScreen onLogin={handleLogin} />
      </div>

      {/* MAIN APP — shown when user is set */}
      <div style={{display: user ? 'block' : 'none', height:'100%'}}>
        {user && (
          <Layout user={user} onLogout={handleLogout} page={page} setPage={setPage}>
            {renderPage()}
          </Layout>
        )}
      </div>
    </div>
  )
}
