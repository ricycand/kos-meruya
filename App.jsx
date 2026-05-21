import { useState } from "react";

export default function App() {
  const [ok, setOk] = useState(false);
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  if (ok) return (
    <div style={{background:"#0f172a",minHeight:"100vh",color:"white",padding:40}}>
      <h1 style={{fontSize:28,fontWeight:900}}>✅ Kos Meruya</h1>
      <p style={{marginTop:8,color:"#94a3b8"}}>Login berhasil! Sistem berjalan normal.</p>
      <button onClick={()=>setOk(false)} style={{marginTop:16,padding:"8px 20px",background:"#ef4444",color:"white",border:"none",borderRadius:8,cursor:"pointer"}}>Keluar</button>
    </div>
  );

  return (
    <div style={{background:"#0f172a",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{background:"white",padding:32,borderRadius:16,width:320,boxShadow:"0 20px 60px rgba(0,0,0,0.5)"}}>
        <h1 style={{textAlign:"center",marginBottom:24,fontSize:24,fontWeight:900}}>🏠 Kos Meruya</h1>
        <div style={{marginBottom:12}}>
          <label style={{display:"block",fontSize:12,fontWeight:700,marginBottom:4,color:"#475569"}}>ID PENGGUNA</label>
          <input value={id} onChange={e=>setId(e.target.value)}
            style={{width:"100%",padding:"10px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,boxSizing:"border-box"}}
            placeholder="Masukkan ID"/>
        </div>
        <div style={{marginBottom:16}}>
          <label style={{display:"block",fontSize:12,fontWeight:700,marginBottom:4,color:"#475569"}}>PASSWORD</label>
          <input type="password" value={pw} onChange={e=>setPw(e.target.value)}
            onKeyDown={e=>e.key==="Enter"&&(id==="admin"&&pw==="1234"?setOk(true):setErr("ID atau password salah"))}
            style={{width:"100%",padding:"10px 12px",border:"1px solid #e2e8f0",borderRadius:8,fontSize:14,boxSizing:"border-box"}}
            placeholder="Masukkan password"/>
        </div>
        {err&&<p style={{color:"red",fontSize:13,marginBottom:8}}>{err}</p>}
        <button onClick={()=>id==="admin"&&pw==="1234"?setOk(true):setErr("ID atau password salah")}
          style={{width:"100%",padding:"12px",background:"#2563eb",color:"white",border:"none",borderRadius:8,fontSize:14,fontWeight:700,cursor:"pointer"}}>
          Masuk →
        </button>
        <p style={{textAlign:"center",fontSize:11,color:"#94a3b8",marginTop:12}}>Default: admin / 1234</p>
      </div>
    </div>
  );
}
