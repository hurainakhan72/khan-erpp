import { useState, useEffect } from "react";

/* ═══════════ TYPES ═══════════ */
interface Employee {
  id: string; name: string; designation: string; department: string;
  doj: string; payMode: string;
  salary: { basic: number; rent: number; med: number; conv: number; comm: number };
}
interface PayRecord {
  empId: string; name: string; dept: string; designation: string;
  doj: string; payMode: string;
  month: number; year: number;
  workingDays: number; paidDays: number; absents: number;
  cl: number; ml: number; al: number;
  basic: number; rent: number; med: number; conv: number; comm: number; ot: number;
  absDed: number; tax: number; eobi: number; advance: number; loan: number; other: number;
  gross: number; ded: number; net: number;
  status: "Draft" | "Finalized";
}

/* ═══════════ CONSTANTS ═══════════ */
const MONTHS = ["","January","February","March","April","May","June",
  "July","August","September","October","November","December"];

const DEPARTMENTS = ["All Departments","Engineering","Human Resources","Sales","Finance","Operations"];

/*
  HR ROLE SIMULATION
  ------------------
  Set CURRENT_USER_DEPT to a department string to simulate an HR user
  who can only see their own department's payroll.
  Leave empty ("") for admin view — sees all departments.

  Examples:
    const CURRENT_USER_DEPT = "Engineering";
    const CURRENT_USER_DEPT = "Human Resources";
    const CURRENT_USER_DEPT = "";   ← admin
*/
const CURRENT_USER_DEPT = "";

const monthDays = (m: number, y: number) => {
  if (m === 2) return y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0) ? 29 : 28;
  return [0,31,28,31,30,31,30,31,31,30,31,30,31][m];
};

const EMPLOYEES: Employee[] = [
  { id:"EMP001", name:"Ahmed Raza",     designation:"Senior Developer",   department:"Engineering",     doj:"Jan 15, 2020", payMode:"Online Transfer", salary:{basic:150000,rent:30000,med:10000,conv:5000,comm:0} },
  { id:"EMP002", name:"Sara Khan",      designation:"HR Manager",          department:"Human Resources", doj:"Mar 1, 2019",  payMode:"Bank Transfer",   salary:{basic:120000,rent:24000,med:8000, conv:4000,comm:0} },
  { id:"EMP003", name:"Bilal Siddiqui", designation:"Sales Executive",     department:"Sales",           doj:"Jun 10, 2021", payMode:"Online Transfer", salary:{basic:80000, rent:16000,med:5000, conv:3000,comm:15000} },
  { id:"EMP004", name:"Nadia Malik",    designation:"Finance Analyst",     department:"Finance",         doj:"Sep 5, 2018",  payMode:"Cash",            salary:{basic:100000,rent:20000,med:7000, conv:3500,comm:0} },
  { id:"EMP005", name:"Usman Tariq",    designation:"Project Manager",     department:"Operations",      doj:"Feb 20, 2022", payMode:"Online Transfer", salary:{basic:180000,rent:36000,med:12000,conv:6000,comm:0} },
  { id:"EMP006", name:"Zainab Ali",     designation:"UI/UX Designer",      department:"Engineering",     doj:"Apr 1, 2023",  payMode:"Online Transfer", salary:{basic:95000, rent:19000,med:6500, conv:3000,comm:0} },
  { id:"EMP007", name:"Hassan Malik",   designation:"Sales Manager",       department:"Sales",           doj:"Aug 12, 2020", payMode:"Bank Transfer",   salary:{basic:110000,rent:22000,med:7500, conv:4000,comm:20000} },
  { id:"EMP008", name:"Ayesha Siddiq",  designation:"Finance Manager",     department:"Finance",         doj:"May 3, 2017",  payMode:"Online Transfer", salary:{basic:130000,rent:26000,med:9000, conv:4500,comm:0} },
  { id:"EMP009", name:"Kamran Sheikh",  designation:"DevOps Engineer",     department:"Engineering",     doj:"Nov 1, 2021",  payMode:"Online Transfer", salary:{basic:140000,rent:28000,med:9500, conv:5000,comm:0} },
  { id:"EMP010", name:"Rabia Noor",     designation:"HR Executive",        department:"Human Resources", doj:"Feb 14, 2022", payMode:"Bank Transfer",   salary:{basic:70000, rent:14000,med:5000, conv:2500,comm:0} },
];

const AVATAR_COLORS = ["#6366f1","#06b6d4","#ec4899","#10b981","#f97316","#8b5cf6","#3b82f6","#ef4444","#14b8a6","#a855f7"];
const avatarBg = (name: string) => AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const initials  = (name: string) => name.split(" ").map(p => p[0]).join("").slice(0,2).toUpperCase();
const pkr       = (n: number) => "PKR " + Math.round(n).toLocaleString("en-PK");
const pkrShort  = (n: number) => {
  n = Math.round(n);
  if (n >= 10000000) return "PKR " + (n/10000000).toFixed(2)+" Cr";
  if (n >= 100000)   return "PKR " + (n/100000).toFixed(2)+" L";
  return "PKR " + n.toLocaleString("en-PK");
};

function numWords(n: number): string {
  if (n <= 0) return "Zero";
  const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten",
    "Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  if (n < 20)  return ones[n];
  if (n < 100) return tens[Math.floor(n/10)]+(n%10?" "+ones[n%10]:"");
  if (n < 1000) return ones[Math.floor(n/100)]+" Hundred"+(n%100?" and "+numWords(n%100):"");
  if (n < 100000) return numWords(Math.floor(n/1000))+" Thousand"+(n%1000?" "+numWords(n%1000):"");
  if (n < 10000000) return numWords(Math.floor(n/100000))+" Lakh"+(n%100000?" "+numWords(n%100000):"");
  return numWords(Math.floor(n/10000000))+" Crore"+(n%10000000?" "+numWords(n%10000000):"");
}

const CARD_THEMES = [
  { bg:"linear-gradient(135deg,#f97316 0%,#ef4444 100%)", shadow:"0 8px 28px rgba(249,115,22,.35)", icon:"💰", label:"NET PAYABLE" },
  { bg:"linear-gradient(135deg,#06b6d4 0%,#3b82f6 100%)", shadow:"0 8px 28px rgba(6,182,212,.35)",  icon:"📊", label:"TOTAL GROSS" },
  { bg:"linear-gradient(135deg,#f59e0b 0%,#f97316 100%)", shadow:"0 8px 28px rgba(245,158,11,.35)", icon:"📄", label:"DRAFT RECORDS" },
  { bg:"linear-gradient(135deg,#10b981 0%,#06b6d4 100%)", shadow:"0 8px 28px rgba(16,185,129,.35)", icon:"🔒", label:"FINALIZED" },
];

function Toast({ msg, show }: { msg: string; show: boolean }) {
  return (
    <div style={{
      position:"fixed",bottom:28,right:28,zIndex:9999,
      background:"linear-gradient(135deg,#f97316,#ef4444)",
      color:"#fff",padding:"12px 22px",borderRadius:12,
      fontSize:13,fontWeight:600,
      boxShadow:"0 8px 32px rgba(249,115,22,.4)",
      opacity:show?1:0,transform:show?"translateY(0)":"translateY(10px)",
      transition:"all .3s ease",pointerEvents:"none",
    }}>{msg}</div>
  );
}

/* ═══════════ MAIN COMPONENT ═══════════ */
export default function Payroll() {
  const now = new Date();
  const [records,  setRecords]  = useState<PayRecord[]>([]);
  const [fMonth,   setFMonth]   = useState(now.getMonth()+1);
  const [fYear,    setFYear]    = useState(now.getFullYear());
  const [fStatus,  setFStatus]  = useState("");
  const [fDept,    setFDept]    = useState("");
  const [fSearch,  setFSearch]  = useState("");
  const [showGen,  setShowGen]  = useState(false);
  const [showSlip, setShowSlip] = useState<PayRecord|null>(null);
  const [toast,    setToast]    = useState({show:false,msg:""});

  // Gen form state
  const [gEmp,   setGEmp]   = useState("EMP001");
  const [gMonth, setGMonth] = useState(now.getMonth()+1);
  const [gYear,  setGYear]  = useState(now.getFullYear());
  const [gPaid,  setGPaid]  = useState(31);
  const [gAbs,   setGAbs]   = useState(0);
  const [gCL,    setGCL]    = useState(0);
  const [gML,    setGML]    = useState(0);
  const [gAL,    setGAL]    = useState(0);
  const [gBasic, setGBasic] = useState(150000);
  const [gRent,  setGRent]  = useState(30000);
  const [gMed,   setGMed]   = useState(10000);
  const [gConv,  setGConv]  = useState(5000);
  const [gComm,  setGComm]  = useState(0);
  const [gOT,    setGOT]    = useState(0);
  const [gTax,   setGTax]   = useState(12000);
  const [gEOBI,  setGEOBI]  = useState(370);
  const [gAdv,   setGAdv]   = useState(0);
  const [gLoan,  setGLoan]  = useState(0);
  const [gOther, setGOther] = useState(0);

  const totalDays  = monthDays(gMonth, gYear);
  const absDed     = gAbs > 0 ? (gBasic / totalDays) * gAbs : 0;
  const earnings   = gBasic + gRent + gMed + gConv + gComm + gOT;
  const deductions = absDed + gTax + gEOBI + gAdv + gLoan + gOther;
  const netSalary  = earnings - deductions;

  function showToast(msg: string) {
    setToast({show:true,msg});
    setTimeout(()=>setToast({show:false,msg:""}),3000);
  }

  function loadEmp(id: string) {
    const e = EMPLOYEES.find(x=>x.id===id);
    if (!e) return;
    setGBasic(e.salary.basic); setGRent(e.salary.rent);
    setGMed(e.salary.med);     setGConv(e.salary.conv);
    setGComm(e.salary.comm);   setGOT(0);
    setGAdv(0); setGLoan(0); setGOther(0);
    setGTax(Math.round(e.salary.basic * 0.08));
    setGEOBI(370);
  }

  useEffect(()=>{ loadEmp(gEmp); }, [gEmp]);
  useEffect(()=>{ setGPaid(monthDays(gMonth,gYear)); }, [gMonth,gYear]);

  // Employees visible to current HR user
  const allowedEmps = CURRENT_USER_DEPT
    ? EMPLOYEES.filter(e=>e.department===CURRENT_USER_DEPT)
    : EMPLOYEES;

  function openGen() {
    const first = allowedEmps[0];
    setGEmp(first.id); setGMonth(fMonth); setGYear(fYear);
    setGAbs(0); setGCL(0); setGML(0); setGAL(0);
    loadEmp(first.id);
    setShowGen(true);
  }

  function savePayroll(status:"Draft"|"Finalized") {
    const emp = EMPLOYEES.find(e=>e.id===gEmp)!;
    const rec: PayRecord = {
      empId:gEmp, name:emp.name, dept:emp.department, designation:emp.designation,
      doj:emp.doj, payMode:emp.payMode,
      month:gMonth, year:gYear,
      workingDays:totalDays, paidDays:gPaid, absents:gAbs,
      cl:gCL, ml:gML, al:gAL,
      basic:gBasic, rent:gRent, med:gMed, conv:gConv, comm:gComm, ot:gOT,
      absDed:Math.round(absDed), tax:gTax, eobi:gEOBI,
      advance:gAdv, loan:gLoan, other:gOther,
      gross:Math.round(earnings), ded:Math.round(deductions), net:Math.round(netSalary),
      status,
    };
    setRecords(prev=>{
      const idx=prev.findIndex(r=>r.empId===gEmp&&r.month===gMonth&&r.year===gYear);
      if(idx>=0){const n=[...prev];n[idx]=rec;return n;}
      return [...prev,rec];
    });
    setShowGen(false);
    showToast(status==="Draft"?"📄 Saved as Draft":"✅ Payroll Finalized & Locked");
  }

  function finalizeRecord(empId:string,month:number,year:number) {
    setRecords(prev=>prev.map(r=>
      r.empId===empId&&r.month===month&&r.year===year?{...r,status:"Finalized"}:r
    ));
    showToast("✅ Payroll Finalized");
  }

  function deleteRecord(empId:string,month:number,year:number) {
    if(!window.confirm("Delete this payroll record?")) return;
    setRecords(prev=>prev.filter(r=>!(r.empId===empId&&r.month===month&&r.year===year)));
    showToast("🗑 Record deleted");
  }

  /* ── Department-scoped filtering ──
     HR user: sees only their dept.
     Admin:   sees all, with optional fDept filter. */
  const baseRecords = CURRENT_USER_DEPT
    ? records.filter(r=>r.dept===CURRENT_USER_DEPT)
    : records;

  const allMonth = baseRecords.filter(r=>r.month===fMonth&&r.year===fYear);
  const filtered  = allMonth.filter(r=>{
    if(fStatus && r.status!==fStatus) return false;
    if(fDept && r.dept!==fDept) return false;
    if(fSearch && !r.name.toLowerCase().includes(fSearch.toLowerCase()) && !r.empId.toLowerCase().includes(fSearch.toLowerCase())) return false;
    return true;
  });

  const netTotal   = filtered.reduce((s,r)=>s+r.net,0);
  const grossTotal = filtered.reduce((s,r)=>s+r.gross,0);
  const draftList  = allMonth.filter(r=>r.status==="Draft");
  const finalList  = allMonth.filter(r=>r.status==="Finalized");

  const STATS = [
    { val:pkrShort(netTotal),       sub:filtered.length+" employees this period",  pct:filtered.length>0?80:0 },
    { val:pkrShort(grossTotal),     sub:"Before deductions",                        pct:grossTotal>0?70:0 },
    { val:String(draftList.length), sub:draftList.length>0?pkrShort(draftList.reduce((s,r)=>s+r.net,0))+" pending":"No drafts this period", pct:allMonth.length?Math.round(draftList.length/allMonth.length*100):0 },
    { val:String(finalList.length), sub:finalList.length>0?pkrShort(finalList.reduce((s,r)=>s+r.net,0))+" locked":"None finalized yet",     pct:allMonth.length?Math.round(finalList.length/allMonth.length*100):0 },
  ];

  const years = Array.from({length:11},(_,i)=>now.getFullYear()-3+i);

  // Reusable sub-components
  const Pill = ({s}:{s:string}) => s==="Draft"
    ? <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:600,background:"#fef3c7",color:"#d97706",border:"1px solid #fde68a"}}>Draft</span>
    : <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:600,background:"#d1fae5",color:"#059669",border:"1px solid #a7f3d0"}}>Finalized</span>;

  const Chip = ({t}:{t:string}) => (
    <span style={{fontFamily:"'DM Mono',monospace",fontSize:11,background:"#f0f4ff",padding:"3px 9px",borderRadius:6,color:"#4f46e5",border:"1px solid #e0e7ff",fontWeight:500}}>{t}</span>
  );

  const selStyle: React.CSSProperties = {height:36,border:"1px solid #e5e7eb",borderRadius:9,background:"#f9fafb",color:"#374151",fontSize:12,padding:"0 12px",outline:"none",cursor:"pointer"};

  // Modal form helpers
  const SectionLabel = ({label,color}:{label:string,color:string}) => (
    <div style={{fontSize:10,fontWeight:700,color,textTransform:"uppercase",letterSpacing:".08em",padding:"10px 0 8px",borderTop:"1px solid #f3f4f6",marginTop:4,display:"flex",alignItems:"center",gap:6}}>
      <span style={{width:3,height:12,borderRadius:2,background:color,display:"inline-block"}}/>
      {label}
    </div>
  );

  const InpField = ({label,val,set,disabled=false,accent=""}:{label:string,val:number,set:(v:number)=>void,disabled?:boolean,accent?:string}) => (
    <div style={{flex:1,minWidth:130,display:"flex",flexDirection:"column",gap:4}}>
      <div style={{fontSize:11,color:"#6b7280",fontWeight:500}}>{label}</div>
      <input type="number" value={val} disabled={disabled} onChange={e=>set(+e.target.value)}
        style={{height:34,border:`1px solid ${disabled?"#f3f4f6":"#e5e7eb"}`,borderRadius:8,padding:"0 10px",fontSize:12,
          color:accent||"#111827",background:disabled?"#f9fafb":"#fff",
          fontFamily:"'DM Mono',monospace",outline:"none",width:"100%",opacity:disabled?.7:1}}/>
    </div>
  );

  /* ── Payslip Modal ── */
  function SlipModal({r}:{r:PayRecord}) {
    const slipNo = records.findIndex(x=>x.empId===r.empId&&x.month===r.month&&x.year===r.year)+1;
    const R:React.CSSProperties = {display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 16px",borderBottom:"1px solid #f3f4f6",fontSize:12};
    const SC:React.CSSProperties = {fontSize:10,fontWeight:700,color:"#f97316",background:"#fff7ed",padding:"7px 16px",borderBottom:"1px solid #fed7aa",textTransform:"uppercase",letterSpacing:".06em"};
    return (
      <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(4px)"}} onClick={()=>setShowSlip(null)}>
        <div style={{background:"#fff",borderRadius:18,width:"100%",maxWidth:760,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.2)"}} onClick={e=>e.stopPropagation()}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"16px 22px",borderBottom:"1px solid #f3f4f6",position:"sticky",top:0,background:"#fff",zIndex:2}}>
            <div style={{fontWeight:700,fontSize:15,color:"#111827"}}>Pay Slip</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>window.print()} style={{height:32,borderRadius:8,border:"1px solid #e5e7eb",background:"#f9fafb",color:"#374151",fontSize:12,fontWeight:500,padding:"0 14px",cursor:"pointer"}}>🖨 Print</button>
              <button onClick={()=>setShowSlip(null)} style={{height:32,borderRadius:8,border:"1px solid #e5e7eb",background:"#f9fafb",color:"#374151",fontSize:12,fontWeight:500,padding:"0 14px",cursor:"pointer"}}>✕ Close</button>
            </div>
          </div>
          <div style={{padding:22}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:18}}>
              <div style={{width:44,height:44,borderRadius:12,background:avatarBg(r.name),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:14,flexShrink:0}}>{initials(r.name)}</div>
              <div>
                <div style={{fontWeight:700,fontSize:16,color:"#111827"}}>{r.name}</div>
                <div style={{fontSize:11,color:"#9ca3af"}}>{r.designation} · {r.dept}</div>
              </div>
              <div style={{marginLeft:"auto"}}><Pill s={r.status}/></div>
            </div>
            <div style={{border:"1px solid #e5e7eb",borderRadius:12,overflow:"hidden"}}>
              <div style={{background:"linear-gradient(135deg,#f97316,#ef4444)",color:"#fff",padding:"14px 20px",textAlign:"center"}}>
                <div style={{fontSize:16,fontWeight:700,letterSpacing:".06em"}}>PAYROLL SLIP</div>
                <div style={{fontSize:11,opacity:.85,marginTop:2}}>{MONTHS[r.month].toUpperCase()} {r.year}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
                <div>
                  <div style={SC}>Employee Details</div>
                  {[["Employee Code",r.empId],["Full Name",r.name],["Designation",r.designation],["Department",r.dept],["Date of Joining",r.doj],["Payment Mode",r.payMode]].map(([k,v])=>(
                    <div key={k} style={R}><span style={{color:"#6b7280"}}>{k}</span><span style={{fontFamily:"'DM Mono',monospace",fontWeight:500,color:"#111827"}}>{v}</span></div>
                  ))}
                </div>
                <div style={{borderLeft:"1px solid #f3f4f6"}}>
                  <div style={SC}>Slip Information</div>
                  {[["Slip No.",String(slipNo).padStart(3,"0")],["Month",MONTHS[r.month]],["Year",String(r.year)],["Working Days",String(r.workingDays)],["Paid Days",String(r.paidDays)],["Absents",String(r.absents)]].map(([k,v])=>(
                    <div key={k} style={R}><span style={{color:"#6b7280"}}>{k}</span><span style={{fontFamily:"'DM Mono',monospace",fontWeight:500,color:"#111827"}}>{v}</span></div>
                  ))}
                </div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr"}}>
                <div>
                  <div style={SC}>Earnings</div>
                  {[["Basic Salary",pkr(r.basic)],["House Rent",pkr(r.rent)],["Medical",pkr(r.med)],["Conveyance",pkr(r.conv)],["Commission",pkr(r.comm)],["Overtime",pkr(r.ot||0)]].map(([k,v])=>(
                    <div key={k} style={R}><span style={{color:"#6b7280"}}>{k}</span><span style={{fontFamily:"'DM Mono',monospace",color:"#3b82f6"}}>{v}</span></div>
                  ))}
                  <div style={{...R,background:"#eff6ff",fontWeight:700}}>
                    <span style={{color:"#1e40af"}}>Gross Total</span><span style={{fontFamily:"'DM Mono',monospace",color:"#2563eb",fontSize:14}}>{pkr(r.gross)}</span>
                  </div>
                </div>
                <div style={{borderLeft:"1px solid #f3f4f6"}}>
                  <div style={SC}>Deductions</div>
                  {[["Absent Deduction",pkr(r.absDed)],["Income Tax",pkr(r.tax)],["EOBI",pkr(r.eobi||0)],["Advance",pkr(r.advance)],["Loan",pkr(r.loan)],["Other",pkr(r.other)]].map(([k,v])=>(
                    <div key={k} style={R}><span style={{color:"#6b7280"}}>{k}</span><span style={{fontFamily:"'DM Mono',monospace",color:"#ef4444"}}>{v}</span></div>
                  ))}
                  <div style={{...R,background:"#fef2f2",fontWeight:700}}>
                    <span style={{color:"#991b1b"}}>Total Deductions</span><span style={{fontFamily:"'DM Mono',monospace",color:"#ef4444",fontSize:14}}>{pkr(r.ded)}</span>
                  </div>
                </div>
              </div>
              <div style={{background:"linear-gradient(135deg,#fff7ed,#fffbf5)",padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",borderTop:"1px solid #fed7aa"}}>
                <div>
                  <div style={{fontSize:11,color:"#9ca3af",marginBottom:4}}>NET SALARY</div>
                  <div style={{fontFamily:"'DM Mono',monospace",fontSize:26,fontWeight:700,color:"#f97316"}}>{pkr(r.net)}</div>
                </div>
                <div style={{textAlign:"right",fontSize:11,color:"#9ca3af",maxWidth:240}}><em>{numWords(r.net)} Rupees Only</em></div>
              </div>
              <div style={{display:"flex",justifyContent:"space-around",padding:"22px 20px 18px",borderTop:"1px solid #f3f4f6"}}>
                {["Prepared By","Employee Signature","Authorized By"].map(l=>(
                  <div key={l} style={{textAlign:"center"}}>
                    <div style={{width:110,borderBottom:"1px solid #d1d5db",margin:"0 auto 8px"}}/>
                    <div style={{fontSize:10,color:"#9ca3af"}}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════ RENDER ═══════════ */
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        body{background:#f1f5f9}
        .c-hover:hover{transform:translateY(-4px)!important;box-shadow:0 18px 48px rgba(0,0,0,.22)!important}
        .row-h:hover td{background:#fafafa!important}
        .ico-h:hover{opacity:.8}
        .btn-main:hover{opacity:.9;transform:translateY(-1px)}
        select option{background:#fff;color:#111827}
        ::-webkit-scrollbar{width:5px;height:5px}
        ::-webkit-scrollbar-thumb{background:#e5e7eb;border-radius:4px}
      `}</style>

      <div style={{minHeight:"100vh",background:"#f1f5f9",fontFamily:"'DM Sans',system-ui,sans-serif",padding:"28px 32px"}}>

        {/* ── Topbar ── */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:26,fontWeight:700,color:"#111827",letterSpacing:"-0.5px"}}>Payroll</div>
            <div style={{fontSize:12,color:"#9ca3af",marginTop:4}}>
              Manage salaries &amp; payslips &nbsp;·&nbsp;
              <span style={{color:"#f97316",fontWeight:600}}>{MONTHS[fMonth]} {fYear}</span>
              {CURRENT_USER_DEPT && (
                <span style={{marginLeft:8,background:"#eff6ff",color:"#3b82f6",padding:"2px 8px",borderRadius:6,fontWeight:600,fontSize:11}}>
                  {CURRENT_USER_DEPT} HR View
                </span>
              )}
            </div>
          </div>
          <button className="btn-main" onClick={openGen} style={{
            height:42,borderRadius:11,border:"none",
            background:"linear-gradient(135deg,#f97316,#ef4444)",
            color:"#fff",fontSize:13,fontWeight:700,padding:"0 22px",
            cursor:"pointer",display:"inline-flex",alignItems:"center",gap:8,
            boxShadow:"0 4px 20px rgba(249,115,22,.4)",transition:"all .2s",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            + Generate Payroll
          </button>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
          {STATS.map((s,i)=>(
            <div key={i} className="c-hover" style={{
              background:CARD_THEMES[i].bg,
              borderRadius:18,padding:"22px 24px",
              boxShadow:CARD_THEMES[i].shadow,
              transition:"transform .2s,box-shadow .2s",
              position:"relative",overflow:"hidden",cursor:"default",
            }}>
              <div style={{position:"absolute",right:-22,top:-22,width:95,height:95,borderRadius:"50%",background:"rgba(255,255,255,.18)"}}/>
              <div style={{position:"absolute",right:18,top:16,fontSize:26}}>{CARD_THEMES[i].icon}</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,.85)",fontWeight:700,letterSpacing:".08em",marginBottom:10,textTransform:"uppercase"}}>{CARD_THEMES[i].label}</div>
              <div style={{fontSize:i<2?22:32,fontWeight:700,color:"#fff",fontFamily:"'DM Mono',monospace",marginBottom:5,letterSpacing:i<2?"-0.5px":"0"}}>{s.val}</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,.8)",marginBottom:14}}>{s.sub}</div>
              <div style={{height:4,borderRadius:4,background:"rgba(255,255,255,.25)"}}>
                <div style={{height:"100%",borderRadius:4,background:"rgba(255,255,255,.75)",width:`${s.pct}%`,transition:"width .7s ease"}}/>
              </div>
            </div>
          ))}
        </div>

        {/* ── Filter Bar ── */}
        <div style={{
          background:"#fff",border:"1px solid #e5e7eb",borderRadius:14,
          padding:"14px 18px",marginBottom:18,
          display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",
          boxShadow:"0 1px 4px rgba(0,0,0,.05)",
        }}>
          {/* Month — all 12 months */}
          <select value={fMonth} onChange={e=>setFMonth(+e.target.value)} style={selStyle}>
            {MONTHS.slice(1).map((m,i)=>(
              <option key={i+1} value={i+1}>{m}</option>
            ))}
          </select>

          {/* Year */}
          <select value={fYear} onChange={e=>setFYear(+e.target.value)} style={selStyle}>
            {years.map(y=><option key={y} value={y}>{y}</option>)}
          </select>

          {/* Status */}
          <select value={fStatus} onChange={e=>setFStatus(e.target.value)} style={selStyle}>
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Finalized">Finalized</option>
          </select>

          {/* Department filter — shown only to admin */}
          {!CURRENT_USER_DEPT && (
            <select value={fDept} onChange={e=>setFDept(e.target.value)} style={selStyle}>
              {DEPARTMENTS.map(d=>(
                <option key={d} value={d==="All Departments"?"":d}>{d}</option>
              ))}
            </select>
          )}

          {/* Search */}
          <input
            type="text" placeholder="🔍  Search name or ID…"
            value={fSearch} onChange={e=>setFSearch(e.target.value)}
            style={{flex:1,minWidth:180,height:36,border:"1px solid #e5e7eb",borderRadius:9,background:"#f9fafb",color:"#374151",fontSize:12,padding:"0 14px",outline:"none"}}
          />

          <span style={{fontSize:11,color:"#9ca3af",whiteSpace:"nowrap",marginLeft:"auto",fontWeight:500}}>
            Showing <b style={{color:"#374151"}}>{filtered.length}</b> record{filtered.length!==1?"s":""}
          </span>
        </div>

        {/* ── Table ── */}
        <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:16,overflow:"auto",boxShadow:"0 1px 4px rgba(0,0,0,.05)"}}>
          <table style={{width:"100%",borderCollapse:"collapse",minWidth:940}}>
            <thead>
              <tr style={{background:"linear-gradient(135deg,#f8fafc,#f1f5f9)"}}>
                {["Employee","Emp ID","Department","Working Days","Paid Days","Gross Salary","Deductions","Net Salary","Status","Actions"].map(h=>(
                  <th key={h} style={{textAlign:"left",padding:"13px 16px",fontSize:10,fontWeight:700,color:"#9ca3af",borderBottom:"2px solid #f1f5f9",whiteSpace:"nowrap",letterSpacing:".07em",textTransform:"uppercase"}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length===0 ? (
                <tr><td colSpan={10} style={{textAlign:"center",padding:"72px 20px",color:"#9ca3af"}}>
                  <div style={{fontSize:40,marginBottom:12}}>📋</div>
                  <div style={{fontWeight:600,color:"#6b7280",fontSize:14,marginBottom:6}}>No payroll records found</div>
                  <div style={{fontSize:12}}>Click "+ Generate Payroll" to create records for this period</div>
                </td></tr>
              ) : filtered.map(r=>(
                <tr key={r.empId+r.month+r.year} className="row-h">
                  {/* Employee */}
                  <td style={{padding:"13px 16px",borderBottom:"1px solid #f9fafb",verticalAlign:"middle"}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:36,height:36,borderRadius:10,background:avatarBg(r.name),display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700,fontSize:12,flexShrink:0}}>
                        {initials(r.name)}
                      </div>
                      <div>
                        <div style={{fontWeight:600,color:"#111827",fontSize:13}}>{r.name}</div>
                        <div style={{fontSize:10,color:"#9ca3af",marginTop:1}}>{r.payMode}</div>
                      </div>
                    </div>
                  </td>
                  {/* Emp ID */}
                  <td style={{padding:"13px 16px",borderBottom:"1px solid #f9fafb",verticalAlign:"middle"}}><Chip t={r.empId}/></td>
                  {/* Dept */}
                  <td style={{padding:"13px 16px",borderBottom:"1px solid #f9fafb",verticalAlign:"middle"}}>
                    <span style={{fontSize:11,color:"#6b7280",background:"#f3f4f6",padding:"3px 10px",borderRadius:6,fontWeight:500}}>{r.dept}</span>
                  </td>
                  {/* Working Days */}
                  <td style={{padding:"13px 16px",borderBottom:"1px solid #f9fafb",verticalAlign:"middle",fontFamily:"'DM Mono',monospace",fontSize:13,color:"#374151",fontWeight:500}}>{r.workingDays}</td>
                  {/* Paid Days */}
                  <td style={{padding:"13px 16px",borderBottom:"1px solid #f9fafb",verticalAlign:"middle",fontFamily:"'DM Mono',monospace",fontSize:13,color:"#374151",fontWeight:500}}>{r.paidDays}</td>
                  {/* Gross */}
                  <td style={{padding:"13px 16px",borderBottom:"1px solid #f9fafb",verticalAlign:"middle"}}>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:"#3b82f6",fontWeight:600}}>↗ {pkr(r.gross)}</span>
                  </td>
                  {/* Deductions */}
                  <td style={{padding:"13px 16px",borderBottom:"1px solid #f9fafb",verticalAlign:"middle"}}>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:"#ef4444",fontWeight:600}}>↘ {pkr(r.ded)}</span>
                  </td>
                  {/* Net Salary */}
                  <td style={{padding:"13px 16px",borderBottom:"1px solid #f9fafb",verticalAlign:"middle"}}>
                    <span style={{fontFamily:"'DM Mono',monospace",fontSize:13,color:"#10b981",fontWeight:700}}>↗ {pkr(r.net)}</span>
                  </td>
                  {/* Status */}
                  <td style={{padding:"13px 16px",borderBottom:"1px solid #f9fafb",verticalAlign:"middle"}}><Pill s={r.status}/></td>
                  {/* Actions */}
                  <td style={{padding:"13px 16px",borderBottom:"1px solid #f9fafb",verticalAlign:"middle"}}>
                    <div style={{display:"flex",gap:5}}>
                      {/* View */}
                      <button className="ico-h" onClick={()=>setShowSlip(r)} title="View Payslip" style={{width:30,height:30,borderRadius:8,border:"1px solid #e5e7eb",background:"#f9fafb",cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",color:"#6b7280",transition:"all .15s"}}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      {/* Finalize */}
                      {r.status==="Draft" && (
                        <button className="ico-h" onClick={()=>finalizeRecord(r.empId,r.month,r.year)} title="Finalize & Lock" style={{width:30,height:30,borderRadius:8,border:"1px solid #bfdbfe",background:"#eff6ff",cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",color:"#2563eb",transition:"all .15s"}}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </button>
                      )}
                      {/* Delete */}
                      <button className="ico-h" onClick={()=>deleteRecord(r.empId,r.month,r.year)} title="Delete" style={{width:30,height:30,borderRadius:8,border:"1px solid #fecaca",background:"#fef2f2",cursor:"pointer",display:"inline-flex",alignItems:"center",justifyContent:"center",color:"#ef4444",transition:"all .15s"}}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══════════ Generate Modal ═══════════ */}
      {showGen && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:20,backdropFilter:"blur(3px)"}} onClick={()=>setShowGen(false)}>
          <div style={{background:"#fff",borderRadius:18,width:"100%",maxWidth:740,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.18)"}} onClick={e=>e.stopPropagation()}>
            {/* Header */}
            <div style={{padding:"18px 24px",borderBottom:"1px solid #f3f4f6",display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:"#fff",zIndex:2}}>
              <div style={{fontWeight:700,fontSize:16,color:"#111827"}}>⚙️ Generate Payroll</div>
              <button onClick={()=>setShowGen(false)} style={{height:32,borderRadius:8,border:"1px solid #e5e7eb",background:"#f9fafb",color:"#374151",fontSize:12,fontWeight:500,padding:"0 14px",cursor:"pointer"}}>✕ Close</button>
            </div>

            <div style={{padding:24}}>
              {/* Employee + Period */}
              <div style={{display:"flex",gap:12,marginBottom:14,flexWrap:"wrap"}}>
                <div style={{flex:2,minWidth:200,display:"flex",flexDirection:"column",gap:4}}>
                  <div style={{fontSize:11,color:"#6b7280",fontWeight:600}}>Employee</div>
                  <select value={gEmp} onChange={e=>setGEmp(e.target.value)} style={{...selStyle,width:"100%"}}>
                    {allowedEmps.map(e=>(
                      <option key={e.id} value={e.id}>{e.id} — {e.name} ({e.department})</option>
                    ))}
                  </select>
                </div>
                <div style={{flex:1,minWidth:130,display:"flex",flexDirection:"column",gap:4}}>
                  <div style={{fontSize:11,color:"#6b7280",fontWeight:600}}>Month</div>
                  <select value={gMonth} onChange={e=>setGMonth(+e.target.value)} style={{...selStyle,width:"100%"}}>
                    {MONTHS.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
                  </select>
                </div>
                <div style={{flex:1,minWidth:100,display:"flex",flexDirection:"column",gap:4}}>
                  <div style={{fontSize:11,color:"#6b7280",fontWeight:600}}>Year</div>
                  <select value={gYear} onChange={e=>setGYear(+e.target.value)} style={{...selStyle,width:"100%"}}>
                    {years.map(y=><option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              <SectionLabel label="Attendance" color="#f97316"/>
              <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap"}}>
                <InpField label="Total Days in Month" val={totalDays} set={()=>{}} disabled/>
                <InpField label="Paid Days"   val={gPaid} set={setGPaid}/>
                <InpField label="Absents"     val={gAbs}  set={setGAbs}/>
              </div>
              <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap"}}>
                <InpField label="Casual Leave (CL)"  val={gCL} set={setGCL}/>
                <InpField label="Medical Leave (ML)" val={gML} set={setGML}/>
                <InpField label="Annual Leave (AL)"  val={gAL} set={setGAL}/>
              </div>

              <SectionLabel label="Earnings" color="#3b82f6"/>
              <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap"}}>
                <InpField label="Basic Salary"       val={gBasic} set={setGBasic}/>
                <InpField label="House Rent Allow."  val={gRent}  set={setGRent}/>
                <InpField label="Medical Allowance"  val={gMed}   set={setGMed}/>
              </div>
              <div style={{display:"flex",gap:12,marginBottom:8,flexWrap:"wrap"}}>
                <InpField label="Conveyance"        val={gConv} set={setGConv}/>
                <InpField label="Commission/Bonus"  val={gComm} set={setGComm}/>
                <InpField label="Overtime"          val={gOT}   set={setGOT}/>
              </div>
              <div style={{textAlign:"right",fontSize:12,color:"#6b7280",marginBottom:4}}>
                Total Earnings: <span style={{fontFamily:"'DM Mono',monospace",color:"#10b981",fontSize:15,fontWeight:700}}>{pkr(earnings)}</span>
              </div>

              <SectionLabel label="Deductions" color="#ef4444"/>
              <div style={{display:"flex",gap:12,marginBottom:12,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:130,display:"flex",flexDirection:"column",gap:4}}>
                  <div style={{fontSize:11,color:"#6b7280",fontWeight:500}}>Absent Deduction (auto)</div>
                  <input disabled value={pkr(Math.round(absDed))} style={{height:34,border:"1px solid #f3f4f6",borderRadius:8,padding:"0 10px",fontSize:12,color:"#f97316",background:"#fff7ed",fontFamily:"'DM Mono',monospace",outline:"none",width:"100%"}}/>
                </div>
                <InpField label="Income Tax"          val={gTax}  set={setGTax}/>
                <InpField label="EOBI/Social Security" val={gEOBI} set={setGEOBI}/>
              </div>
              <div style={{display:"flex",gap:12,marginBottom:8,flexWrap:"wrap"}}>
                <InpField label="Advance Deduction" val={gAdv}   set={setGAdv}/>
                <InpField label="Loan Installment"  val={gLoan}  set={setGLoan}/>
                <InpField label="Other Deductions"  val={gOther} set={setGOther}/>
              </div>
              <div style={{textAlign:"right",fontSize:12,color:"#6b7280",marginBottom:4}}>
                Total Deductions: <span style={{fontFamily:"'DM Mono',monospace",color:"#ef4444",fontSize:15,fontWeight:700}}>{pkr(Math.round(deductions))}</span>
              </div>

              {/* Summary */}
              <div style={{background:"linear-gradient(135deg,#fff7ed,#fffbf5)",border:"1px solid #fed7aa",borderRadius:14,padding:"16px 20px",marginTop:14}}>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#6b7280",marginBottom:8}}>
                  <span>Gross Salary</span>
                  <span style={{fontFamily:"'DM Mono',monospace",color:"#3b82f6",fontWeight:600}}>{pkr(earnings)}</span>
                </div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:13,color:"#6b7280",marginBottom:10}}>
                  <span>Total Deductions</span>
                  <span style={{fontFamily:"'DM Mono',monospace",color:"#ef4444",fontWeight:600}}>{pkr(Math.round(deductions))}</span>
                </div>
                <div style={{borderTop:"1px solid #fed7aa",paddingTop:12,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span style={{fontSize:15,fontWeight:700,color:"#111827"}}>NET SALARY</span>
                  <span style={{fontFamily:"'DM Mono',monospace",fontSize:28,fontWeight:700,color:"#f97316"}}>{pkr(Math.round(netSalary))}</span>
                </div>
                <div style={{fontSize:11,color:"#9ca3af",fontStyle:"italic",marginTop:10,paddingTop:8,borderTop:"1px solid #fde68a"}}>
                  {numWords(Math.max(0,Math.floor(netSalary)))} Rupees Only
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{padding:"14px 24px",borderTop:"1px solid #f3f4f6",display:"flex",justifyContent:"flex-end",gap:10,position:"sticky",bottom:0,background:"#fff"}}>
              <button onClick={()=>setShowGen(false)} style={{height:36,borderRadius:9,border:"1px solid #e5e7eb",background:"#f9fafb",color:"#374151",fontSize:12,fontWeight:500,padding:"0 16px",cursor:"pointer"}}>Cancel</button>
              <button onClick={()=>savePayroll("Draft")} style={{height:36,borderRadius:9,border:"1px solid #fde68a",background:"#fefce8",color:"#a16207",fontSize:12,fontWeight:600,padding:"0 16px",cursor:"pointer"}}>📄 Save as Draft</button>
              <button className="btn-main" onClick={()=>savePayroll("Finalized")} style={{height:36,borderRadius:9,border:"none",background:"linear-gradient(135deg,#f97316,#ef4444)",color:"#fff",fontSize:12,fontWeight:700,padding:"0 18px",cursor:"pointer",boxShadow:"0 4px 14px rgba(249,115,22,.4)",transition:"all .2s"}}>
                ✅ Finalize &amp; Lock
              </button>
            </div>
          </div>
        </div>
      )}

      {showSlip && <SlipModal r={showSlip}/>}
      <Toast msg={toast.msg} show={toast.show}/>
    </>
  );
}