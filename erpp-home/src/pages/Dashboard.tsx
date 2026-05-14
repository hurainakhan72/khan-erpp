import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { useData } from "../context/DataContext";
import { getVisibleEmployees } from "../utils/utils";
import { useNavigate } from "react-router-dom";
import {
  Users, UserCheck, CalendarDays, AlertTriangle,
  Activity, Cake, TrendingUp, BarChart3, Plus,
  Megaphone, Bell, ShieldAlert, FileText,
  Target, Award, Clock, ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area,
} from "recharts";

// ✅ Import Calendar Component
import Calendar from "./Calendar";

// ─── Static fallback chart data ───────────────────────────────────────────────
const DEPT_DATA = [
  { name: "Engineering", value: 84, color: "#6366f1" },
  { name: "Sales",       value: 49, color: "#ec4899" },
  { name: "Marketing",   value: 45, color: "#f97316" },
  { name: "HR",          value: 34, color: "#14b8a6" },
  { name: "Finance",     value: 35, color: "#06b6d4" },
];
const ANNOUNCEMENTS = [
  { title:"Office Closure — Eid ul Fitr", date:"Mar 20, 2026", text:"Office closed March 28–April 1 for Eid ul Fitr celebrations." },
  { title:"Annual Performance Review",    date:"Mar 15, 2026", text:"FY 2025-26 reviews begin April 5. All managers should prepare evaluations." },
  { title:"New Health Insurance Policy",  date:"Mar 10, 2026", text:"Updated coverage now includes dental and vision for all full-time employees." },
];
const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const AV_COLORS = ["#6366f1","#ec4899","#f97316","#14b8a6","#a855f7","#06b6d4"];

// ─── Global CSS ───────────────────────────────────────────────────────────────
const G = `
  *{box-sizing:border-box;}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  @keyframes up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  .pg{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;}
  .hc{cursor:pointer;transition:transform .18s,box-shadow .18s;}
  .hc:hover{transform:translateY(-5px) scale(1.015);}
  .hc:active{transform:scale(.97);}
  .fc{animation:up .4s ease both;}
  .rh{transition:background .1s;border-radius:8px;}
  .rh:hover{background:#f5f7ff;}
  .cd{transition:background .1s;}
  .cd:hover{background:#eff6ff!important;cursor:pointer;}
  .nb{transition:opacity .15s,transform .15s;}
  .nb:hover{opacity:.85;transform:translateY(-1px);}
  .ni:hover{background:#f0f4ff!important;}
  ::-webkit-scrollbar{width:3px;}
  ::-webkit-scrollbar-track{background:transparent;}
  ::-webkit-scrollbar-thumb{background:#e2e8f0;border-radius:3px;}
  .cal-day{width:28px;height:28px;display:flex;align-items:center;justify-content:center;border-radius:50%;font-size:11px;cursor:default;position:relative;transition:background .12s;}
  .cal-day.today{background:#6366f1;color:#fff;font-weight:700;}
  .cal-day.has-event{font-weight:600;color:#1e1b4b;}
  .cal-day.has-event::after{content:'';position:absolute;bottom:2px;left:50%;transform:translateX(-50%);width:4px;height:4px;border-radius:50%;background:#6366f1;}
  .cal-day.today::after{background:#fff;}
  .cal-day.birthday::after{background:#ec4899;}
  .cal-day.today.birthday::after{background:#fff;}
`;

// ─── Reusable mini components ─────────────────────────────────────────────────
const Chip = ({ bg, fg, children }: { bg:string; fg:string; children:React.ReactNode }) => (
  <span style={{background:bg,color:fg,padding:"2px 8px",borderRadius:20,fontSize:9,fontWeight:700,whiteSpace:"nowrap"}}>
    {children}
  </span>
);

const Prog = ({ pct, color }: { pct:number; color:string }) => (
  <div style={{height:5,background:"#f1f5f9",borderRadius:4,overflow:"hidden",marginTop:5}}>
    <div style={{height:"100%", width: `${Math.min(pct,100)}%`, background: color, borderRadius:4, transition:"width .8s ease"}}/>
  </div>
);

const Av = ({ ini, color, size=32 }: { ini:string; color:string; size?:number }) => (
  <div style={{width:size,height:size,borderRadius:size*.3,background:color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:size*.29,fontWeight:700,flexShrink:0}}>
    {ini}
  </div>
);

const WCard = ({ children, style, onClick }: { children:React.ReactNode; style?:React.CSSProperties; onClick?:() => void }) => (
  <div className="fc" onClick={onClick} style={{background:"#fff",borderRadius:16,padding:"18px 20px",boxShadow:"0 1px 10px rgba(0,0,0,.07)",...style, cursor: onClick ? 'pointer' : 'default'}}>
    {children}
  </div>
);

const SHead = ({ icon, title, right }: { icon:React.ReactNode; title:string; right?:React.ReactNode }) => (
  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:14}}>
    {icon}
    <span style={{fontSize:13,fontWeight:700,color:"#1e1b4b"}}>{title}</span>
    {right && <div style={{marginLeft:"auto"}}>{right}</div>}
  </div>
);

// Mini Calendar component (compact month view + events + birthdays)
function MiniCalendar({ employees, events }: { employees: any[]; events: any[] }) {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const firstDay  = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMon = new Date(viewYear, viewMonth + 1, 0).getDate();

  const birthdayDates = new Set<number>();
  employees.forEach(emp => {
    if (!emp.dob) return;
    const dob = new Date(emp.dob);
    if (dob.getMonth() === viewMonth) birthdayDates.add(dob.getDate());
  });

  const eventDates = new Set<number>();
  events.forEach((ev:any) => {
    if (!ev || !ev.date) return;
    const d = new Date(`${ev.date}T00:00:00`);
    if (d.getMonth() === viewMonth && d.getFullYear() === viewYear) eventDates.add(d.getDate());
  });

  const monthEvents = events.filter((ev:any) => {
    if (!ev || !ev.date) return false;
    const d = new Date(`${ev.date}T00:00:00`);
    return d.getMonth() === viewMonth && d.getFullYear() === viewYear;
  });

  const monthBirthdays = employees.filter(emp => {
    if (!emp.dob) return false;
    const dob = new Date(emp.dob);
    return dob.getMonth() === viewMonth;
  });

  const cells: (number|null)[] = [...Array(firstDay).fill(null), ...Array.from({length: daysInMon}, (_,i) => i+1)];

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <button onClick={prevMonth} style={{background:"none",border:"none",cursor:"pointer",color:"#9ca3af"}}><ChevronLeft size={14} /></button>
        <span style={{fontSize:12,fontWeight:700,color:"#1e1b4b"}}>{MONTH_NAMES[viewMonth].slice(0,3)} {viewYear}</span>
        <button onClick={nextMonth} style={{background:"none",border:"none",cursor:"pointer",color:"#9ca3af"}}><ChevronRight size={14} /></button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",marginBottom:4}}>
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} style={{textAlign:"center",fontSize:9,color:"#d1d5db",fontWeight:600,paddingBottom:4}}>{d}</div>
        ))}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",rowGap:2}}>
        {cells.map((day,i) => {
          if (!day) return <div key={i} />;
          const isToday = day === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();
          const hasBday = birthdayDates.has(day);
          const hasEvent = eventDates.has(day);
          let cls = "cal-day";
          if (isToday) cls += " today";
          if (hasEvent) cls += " has-event";
          if (hasBday) cls += " birthday";
          return <div key={i} style={{display:"flex",justifyContent:"center"}}><div className={cls}>{day}</div></div>;
        })}
      </div>

      <div style={{display:"flex",gap:12,marginTop:10,flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"#9ca3af"}}><span style={{width:6,height:6,borderRadius:"50%",background:"#6366f1",display:"inline-block"}}/> Event</div>
        <div style={{display:"flex",alignItems:"center",gap:4,fontSize:9,color:"#9ca3af"}}><span style={{width:6,height:6,borderRadius:"50%",background:"#ec4899",display:"inline-block"}}/> Birthday</div>
      </div>

      {monthEvents.length > 0 && (
        <div style={{marginTop:12,borderTop:"1px solid #f3f4f6",paddingTop:10}}>
          <div style={{fontSize:10,fontWeight:700,color:"#6b7280",marginBottom:6}}>Events this month</div>
          {monthEvents.map((ev:any,i:number) => {
            const d = new Date(ev.date);
            const color = ev.type === 'holiday' ? '#ef4444' : (ev.type === 'meeting' ? '#3b82f6' : '#6b7280');
            return (
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:i<monthEvents.length-1?"1px solid #f9fafb":"none"}}>
                <span style={{width:7,height:7,borderRadius:"50%",background:color,flexShrink:0}}/>
                <span style={{fontSize:10,color:"#374151",flex:1}}>{ev.title}</span>
                <span style={{fontSize:9,color:"#d1d5db",whiteSpace:"nowrap"}}>{d.getDate()} {MONTH_NAMES[d.getMonth()].slice(0,3)}</span>
              </div>
            );
          })}
        </div>
      )}

      {monthBirthdays.length > 0 && (
        <div style={{marginTop:10,borderTop:"1px solid #f3f4f6",paddingTop:10}}>
          <div style={{fontSize:10,fontWeight:700,color:"#6b7280",marginBottom:6}}>🎂 Birthdays this month</div>
          {monthBirthdays.map((emp,i) => {
            const dob = new Date(emp.dob);
            const ini = emp.name.split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase();
            const color = AV_COLORS[i % AV_COLORS.length];
            return (
              <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"4px 0",borderBottom:i<monthBirthdays.length-1?"1px solid #f9fafb":"none"}}>
                <div style={{width:22,height:22,borderRadius:6,background:color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,fontWeight:700,flexShrink:0}}>{ini}</div>
                <span style={{fontSize:10,color:"#374151",flex:1}}>{emp.name}</span>
                <span style={{fontSize:9,color:"#ec4899",fontWeight:600,whiteSpace:"nowrap"}}>{dob.getDate()} {MONTH_NAMES[dob.getMonth()].slice(0,3)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const { user, activeRole } = useAuth();
  const { leaveRequests, employees, globalDays } = useData();
  const navigate = useNavigate();

  const [selectedBranch, setSelectedBranch] = useState<string>('All');

  const branches = useMemo(() => {
    const s = new Set<string>();
    employees?.forEach((e:any) => { if (e.branch) s.add(e.branch); });
    return ['All', ...Array.from(s)];
  }, [employees]);

  const [now, setNow] = useState(new Date());
  const [showNotif, setShowNotif] = useState(false);
  const [hovCard, setHovCard] = useState<number|null>(null);

  // live clock
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const visibleEmployees = useMemo(() => getVisibleEmployees(user, activeRole, employees), [user, activeRole, employees]);

  const filteredEmployees = useMemo(() => {
    if (!visibleEmployees) return [];
    if (selectedBranch === 'All') return visibleEmployees;
    return visibleEmployees.filter((e:any) => (e.branch || '') === selectedBranch);
  }, [visibleEmployees, selectedBranch]);

  const deptData = useMemo(() => {
    const deptCounts: Record<string, number> = {};
    filteredEmployees.forEach(emp => {
      deptCounts[emp.department] = (deptCounts[emp.department] || 0) + 1;
    });
    return Object.entries(deptCounts).map(([name, value], i) => ({
      name,
      value,
      color: AV_COLORS[i % AV_COLORS.length]
    }));
  }, [filteredEmployees]);

  // ── Real data ──
  const totalEmp = filteredEmployees?.length ?? 0;
  const activeEmp = filteredEmployees?.filter((e:any) => e.status === "active").length ?? 0;
  const visibleEmployeeIds = new Set(filteredEmployees.map((e:any) => e.id));
  const visibleLeaveRequests = useMemo(
    () => leaveRequests?.filter((l:any) => visibleEmployeeIds.has(l.empId)) || [],
    [leaveRequests, visibleEmployeeIds],
  );

  const pendingLv = visibleLeaveRequests.filter((l:any) => l.status === "Pending").length;

  const attendanceChartData = useMemo(() => {
    const base = Math.max(totalEmp, 8);
    return MONTH_NAMES.slice(-6).map((month, idx) => {
      const present = Math.max(base - Math.round(base * 0.1) - (idx % 2), 1);
      const absent = Math.max(base - present, 0);
      return { month: month.slice(0,3), present, absent };
    });
  }, [totalEmp]);

  const growthData = useMemo(() => {
    const base = Math.max(totalEmp, 24);
    return MONTH_NAMES.slice(-6).map((month, idx) => ({
      month: month.slice(0,3),
      count: Math.max(1, base - 2 + idx),
    }));
  }, [totalEmp]);

  const leaveData = useMemo(() => {
    const totals: Record<string, number> = {
      Annual: 120,
      Casual: 80,
      Sick: 60,
      Maternity: 30,
    };
    const colors: Record<string, string> = {
      Annual: '#6366f1',
      Casual: '#f97316',
      Sick: '#ef4444',
      Maternity: '#ec4899',
    };

    const summary: Record<string, number> = {};
    visibleLeaveRequests.forEach((l:any) => {
      summary[l.leaveType] = (summary[l.leaveType] || 0) + l.days;
    });

    return Object.keys(totals).map((type) => ({
      type,
      used: summary[type] || 0,
      total: totals[type],
      color: colors[type],
    }));
  }, [visibleLeaveRequests]);

  const attendPct = totalEmp > 0 ? Math.round((activeEmp/totalEmp)*100) : 88;
  const onTimePct = 93;
  const retainPct = 94;
  const leavePct = 42;

  // ── Greeting ──
  const h = now.getHours();
  const greeting = h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const dateStr = now.toLocaleDateString("en-PK",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const timeStr = now.toLocaleTimeString("en-PK",{hour:"2-digit",minute:"2-digit",second:"2-digit",hour12:false});
  const uName = (user as any)?.username || "User";

  // ── Notifications ──
  const notifs = [
    {id:1,title:"Leave Request Pending",  msg: `${pendingLv} requests awaiting approval`, time:"Just now",   link:"/leave", read:false},
    {id:2,title:"Incomplete Attendance",  msg:"3 employees haven't marked attendance today", time:"2 hrs ago", link:"/attendance", read:false},
    {id:3,title:"Contract Expiry Alert",  msg:"Usman Malik's contract expires in 8 days", time:"Yesterday", link:"/employees", read:false},
    {id:4,title:"New Employee Onboarded", msg:"Bilal Ahmed added successfully", time:"Yesterday", link:"/employees", read:true},
    {id:5,title:"Probation Period Ending",msg:"Fatima Raza's probation ends in 12 days", time:"2 days ago", link:"/employees", read:true},
  ];
  const unread = notifs.filter(n=>!n.read).length;

  // Merge calendar/globalDays into announcements so additions in Calendar appear here
  const combinedAnnouncements = useMemo(() => {
    const fromDays = (globalDays || []).map((g:any) => ({ title: g.title || g.type, date: g.date, text: g.banner_message || '', id: g.id }));
    return [...ANNOUNCEMENTS, ...fromDays];
  }, [globalDays]);

  // ── Hero cards ──
  const hCards = [
    { grad:"linear-gradient(135deg,#667eea,#764ba2)", glow:"rgba(102,126,234,.45)", icon:<Users size={20} color="#fff"/>, val: totalEmp || 247, label:"Total Employees", sub:"+12% this quarter", chip:"↑ 2.4%", link:"/employees" },
    { grad:"linear-gradient(135deg,#11998e,#38ef7d)", glow:"rgba(17,153,142,.4)", icon:<UserCheck size={20} color="#fff"/>, val: activeEmp || 218, label:"Active Today", sub:"Live attendance", chip:"● Live", link:"/attendance" },
    { grad:"linear-gradient(135deg,#b721ff,#21d4fd)", glow:"rgba(183,33,255,.35)", icon:<CalendarDays size={20} color="#fff"/>, val: pendingLv || 2, label:"Pending Leaves", sub:"Need approval", chip:"Action Needed", link:"/leave" },
  ];

  // ── KPIs ──
  const kpis = [
    {label:"Attendance Rate", pct:attendPct, color:"#10b981", target:90},
    {label:"Leave Utilization", pct:leavePct, color:"#f97316", target:60},
    {label:"On-time Rate", pct:onTimePct, color:"#6366f1", target:95},
    {label:"Staff Retention", pct:retainPct, color:"#ec4899", target:95},
  ];

  // ── Pending actions ──
  const actions = [
    {emoji:"📋", text: `${pendingLv||2} leave requests awaiting approval`, cta:"Review →", link:"/leave"},
    {emoji:"⏰", text:"Attendance incomplete — 3 employees", cta:"Mark →", link:"/attendance"},
    {emoji:"🏦", text:"Bank info missing — EMP004, EMP005", cta:"Fix →", link:"/employees"},
  ];

  // ── Urgent alerts ──
  const alerts = [
    {name:"Usman Malik", sub:"Contract expiry in 8 days", chip:"URGENT", bg:"#fef2f2", fg:"#dc2626"},
    {name:"Fatima Raza", sub:"Probation ends in 12 days", chip:"PROBATION", bg:"#fefce8", fg:"#ca8a04"},
    {name:"Bilal Ahmed", sub:"Bank info missing", chip:"MISSING", bg:"#eff6ff", fg:"#2563eb"},
    {name:"Ahmed Ali", sub:"Absent 3 consecutive days", chip:"ABSENT", bg:"#fef2f2", fg:"#dc2626"},
  ];

  // ── Activity ──
  const activity = [
    {ini:"SK",color:"#f97316",text:"Sara Khan's leave approved", time:"2 hrs ago", by:"Super Admin", chip:"Approved", cBg:"#dcfce7", cFg:"#166534"},
    {ini:"BA",color:"#6366f1",text:"Bilal Ahmed added", time:"Yesterday", by:"HR1", chip:"New Hire", cBg:"#eff6ff", cFg:"#2563eb"},
    {ini:"UM",color:"#ef4444",text:"Usman's leave rejected", time:"3 days ago", by:"HR1", chip:"Rejected", cBg:"#fef2f2", cFg:"#dc2626"},
    {ini:"FR",color:"#14b8a6",text:"Fatima's salary updated", time:"4 days ago", by:"Super Admin", chip:"Updated", cBg:"#f0fdf4", cFg:"#166534"},
  ];

  // ── Top performers ──
  const topP = useMemo(() => {
    const fallback = [
      {name:"Sara Khan", dept:"Sales", score:98, ini:"SK", color:"#f97316"},
      {name:"Ali Raza", dept:"Engineering", score:95, ini:"AR", color:"#6366f1"},
      {name:"Hina Malik", dept:"HR", score:92, ini:"HM", color:"#ec4899"},
      {name:"Bilal Ahmed", dept:"Marketing", score:90, ini:"BA", color:"#14b8a6"},
    ];
    const source = visibleEmployees?.length ? visibleEmployees : employees;
    if (!source?.length) return fallback;
    const src = filteredEmployees?.length ? filteredEmployees : employees;
    return src.slice(0,4).map((e:any,i:number) => ({
      name: e.name || "—",
      dept: e.department || "—",
      score: 88 + Math.floor((i*3.5)%11),
      ini: (e.name||"?").split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase(),
      color: AV_COLORS[i % AV_COLORS.length],
    }));
  }, [filteredEmployees, employees]);

  // ── Upcoming birthdays (integrated with calendar) ──
  const birthdays = useMemo(() => {
    const source = (filteredEmployees && filteredEmployees.length) ? filteredEmployees : employees || [];
    const today = new Date(); today.setHours(0,0,0,0);
    const list: {name:string; dept:string; date:Date; daysUntil:number; ini:string; color:string}[] = [];
    source.forEach((emp:any, idx:number) => {
      if (!emp.dob) return;
      const dob = new Date(emp.dob);
      let bday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
      if (bday < today) bday = new Date(today.getFullYear()+1, dob.getMonth(), dob.getDate());
      const days = Math.ceil((bday.getTime() - today.getTime()) / 86400000);
      if (days <= 30) {
        list.push({
          name: emp.name,
          dept: emp.department || "—",
          date: bday,
          daysUntil: days,
          ini: (emp.name||"?").split(" ").map((n:string)=>n[0]).join("").slice(0,2).toUpperCase(),
          color: AV_COLORS[idx % AV_COLORS.length],
        });
      }
    });
    return list.sort((a,b) => a.daysUntil - b.daysUntil);
  }, [filteredEmployees, employees]);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{G}</style>
      <div className="pg" style={{padding:"22px 28px", background:"#fff", minHeight:"100vh"}}>

        {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20, flexWrap:"wrap", gap:12}}>
          <div>
            <p style={{margin:0, fontSize:12, color:"#9ca3af"}}>{greeting},</p>
            <h1 style={{margin:"2px 0 0", fontSize:27, fontWeight:800, color:"#1e1b4b", display:"flex", alignItems:"center", gap:10, lineHeight:1.15}}>
              {uName} 👋
              <span style={{display:"inline-flex", alignItems:"center", gap:5, background:"#dcfce7", padding:"3px 10px", borderRadius:20, fontSize:9, fontWeight:700, color:"#166534"}}>
                <span style={{width:6, height:6, borderRadius:"50%", background:"#10b981", animation:"pulse 1.5s infinite"}}/>
                LIVE
              </span>
            </h1>
            <p style={{margin:"5px 0 0", fontSize:11, color:"#9ca3af"}}>
              📅 {dateStr} &nbsp;·&nbsp; 🕐 {timeStr} PKT
            </p>
          </div>

          <div style={{display:"flex", gap:10, alignItems:"center"}}>
            <div style={{position:"relative"}}>
              <button className="nb"
                onClick={()=>setShowNotif(v=>!v)}
                style={{background:"#fff", border:"1px solid #e5e7eb", borderRadius:40, padding:"8px 16px", cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:12, color:"#374151", boxShadow:"0 1px 4px rgba(0,0,0,.06)"}}>
                <Bell size={15} color="#6b7280"/>
                Alerts
                {unread>0 && (
                  <span style={{position:"absolute", top:-6, right:-6, background:"#ef4444", color:"#fff", fontSize:9, fontWeight:700, padding:"1px 6px", borderRadius:20, minWidth:18, textAlign:"center"}}>
                    {unread}
                  </span>
                )}
              </button>
              {showNotif && (
                <>
                  <div style={{position:"fixed", inset:0, zIndex:990}} onClick={()=>setShowNotif(false)}/>
                  <div style={{position:"absolute", top:"calc(100% + 8px)", right:0, width:310, background:"#fff", borderRadius:14, boxShadow:"0 16px 40px rgba(0,0,0,.14)", zIndex:999, overflow:"hidden"}}>
                    <div style={{padding:"11px 14px", borderBottom:"1px solid #f3f4f6", display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                      <span style={{fontSize:13, fontWeight:700, color:"#1e1b4b"}}>Notifications</span>
                      <span style={{fontSize:10, color:"#9ca3af"}}>{unread} unread</span>
                    </div>
                    <div style={{maxHeight:320, overflowY:"auto"}}>
                      {notifs.map(n=>(
                        <div key={n.id} className="ni"
                          style={{padding:"11px 14px", borderBottom:"1px solid #f3f4f6", cursor:"pointer", background:n.read?"#fff":"#fffbeb", transition:"background .1s"}}
                          onClick={()=>{navigate(n.link); setShowNotif(false);}}>
                          <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8}}>
                            <div style={{fontSize:12, fontWeight:600, color:"#1e1b4b"}}>{n.title}</div>
                            {!n.read && <span style={{width:6, height:6, borderRadius:"50%", background:"#3b82f6", flexShrink:0, marginTop:3}}/>}
                          </div>
                          <div style={{fontSize:10, color:"#6b7280", marginTop:2}}>{n.msg}</div>
                          <div style={{fontSize:9, color:"#d1d5db", marginTop:3}}>{n.time}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            <button className="nb"
              onClick={()=>navigate("/employees/add")}
              style={{background:"linear-gradient(135deg,#6366f1,#8b5cf6)", border:"none", borderRadius:30, padding:"9px 20px", color:"#fff", fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:6, boxShadow:"0 4px 14px rgba(99,102,241,.4)"}}>
              <Plus size={13}/> Add Employee
            </button>
          </div>
        </div>

        {/* ══ 3 HERO CARDS ════════════════════════════════════════════════════ */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:18}}>
            {hCards.map((c,i)=>(
            <div key={i} className="hc"
              style={{background:c.grad, borderRadius:18, padding:"20px", color:"#fff", position:"relative", overflow:"hidden", minHeight:130, boxShadow: hovCard===i ? `0 20px 44px ${c.glow}` : "0 6px 20px rgba(0,0,0,.10)"}}
              onClick={()=>navigate(c.link)}
              onMouseEnter={()=>setHovCard(i)}
              onMouseLeave={()=>setHovCard(null)}>
              <div style={{width:36, height:36, borderRadius:10, background:"rgba(255,255,255,.22)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:10}}>
                {c.icon}
              </div>
              <div style={{fontSize:32, fontWeight:800, lineHeight:1}}>{c.val}</div>
              <div style={{fontSize:11, opacity:.9, marginTop:4}}>{c.label}</div>
              <div style={{fontSize:10, opacity:.65, marginTop:2}}>{c.sub}</div>
              <span style={{position:"absolute", top:14, right:14, background:"rgba(255,255,255,.22)", borderRadius:20, padding:"3px 9px", fontSize:9, fontWeight:700}}>{c.chip}</span>
              <div style={{position:"absolute", width:80, height:80, borderRadius:"50%", background:"rgba(255,255,255,.07)", bottom:-18, right:-18}}/>
              <div style={{position:"absolute", width:48, height:48, borderRadius:"50%", background:"rgba(255,255,255,.06)", bottom:20, right:28}}/>
              <div style={{position:"absolute", bottom:12, right:14, fontSize:9, opacity:.5, display:"flex", alignItems:"center", gap:3}}>View <span style={{fontSize:11}}>↗️</span></div>
            </div>
          ))}
        </div>

        {/* ══ KPI STRIP ═══════════════════════════════════════════════════════ */}
        <WCard style={{marginBottom:18, padding:"14px 22px"}}>
          <SHead icon={<Target size={14} color="#6366f1"/>} title="Key Performance Indicators" right={<span style={{fontSize:10, color:"#9ca3af"}}>Monthly targets</span>}/>
          <div style={{display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:20}}>
            {kpis.map((k,i)=>(
              <div key={i}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
                  <span style={{fontSize:11, color:"#6b7280"}}>{k.label}</span>
                  <span style={{fontSize:16, fontWeight:800, color:k.color}}>{k.pct}%</span>
                </div>
                <Prog pct={k.pct} color={k.color}/>
                <div style={{fontSize:9, color:"#d1d5db", marginTop:3}}>Target {k.target}%</div>
              </div>
            ))}
          </div>
        </WCard>

        {/* ══ CHARTS ROW: Attendance + Dept donut ════════════════════════════ */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14}}>
          <WCard onClick={() => navigate('/attendance')}>
            <SHead icon={<BarChart3 size={14} color="#6366f1"/>} title="Monthly Attendance" right={<div style={{display:'flex',alignItems:'center',gap:8}}>
                {(activeRole === 'super_admin' || activeRole === 'head_hr') && (
                  <select value={selectedBranch} onChange={(e)=>setSelectedBranch(e.target.value)} style={{padding:'6px 8px',borderRadius:8,border:'1px solid #e5e7eb',fontSize:12}}>
                    {branches.map(b=> <option key={b} value={b}>{b}</option>)}
                  </select>
                )}
                <Chip bg="#dcfce7" fg="#166534">↗️ +5.2%</Chip>
              </div>} />
            <p style={{margin:"-10px 0 10px", fontSize:10, color:"#9ca3af"}}>Present vs Absent · Last 6 months</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={attendanceChartData} barGap={3}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:10, fill:"#9ca3af"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:9, fill:"#9ca3af"}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{borderRadius:10, border:"none", boxShadow:"0 4px 20px rgba(0,0,0,.1)", fontSize:11}} cursor={{fill:"#f8fafc"}}/>
                <Bar dataKey="present" name="Present" fill="#10b981" radius={[4,4,0,0]} barSize={18}/>
                <Bar dataKey="absent" name="Absent" fill="#ef4444" radius={[4,4,0,0]} barSize={18}/>
              </BarChart>
            </ResponsiveContainer>
          </WCard>

          <WCard onClick={() => navigate('/employees')}>
            <SHead icon={<Users size={14} color="#a855f7"/>} title="Department Distribution"/>
            <p style={{margin:"-10px 0 12px", fontSize:10, color:"#9ca3af"}}>Headcount by department</p>
            <div style={{display:"flex", gap:14, alignItems:"center"}}>
              <div style={{position:"relative", width:140, height:140, flexShrink:0}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={deptData} cx="50%" cy="50%" innerRadius={40} outerRadius={58} dataKey="value" stroke="none">
                      {deptData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center"}}>
                  <div style={{fontSize:16, fontWeight:800, color:"#1e1b4b"}}>{totalEmp || 247}</div>
                  <div style={{fontSize:8, color:"#9ca3af"}}>TOTAL</div>
                </div>
              </div>
              <div style={{flex:1}}>
                {deptData.map((d,i)=>(
                  <div key={i} style={{display:"flex", alignItems:"center", gap:7, padding:"4px 0", fontSize:11, borderBottom:"1px solid #f8fafc"}}>
                    <div style={{width:8, height:8, borderRadius:"50%", background:d.color, flexShrink:0}}/>
                    <span style={{flex:1, color:"#374151"}}>{d.name}</span>
                    <span style={{fontWeight:700, color:"#1e1b4b"}}>{d.value}</span>
                    <span style={{color:"#d1d5db", fontSize:10, width:26, textAlign:"right"}}>{Math.round((d.value/(totalEmp||247))*100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </WCard>
        </div>

        {/* ══ CHARTS ROW 2: Headcount growth + Leave breakdown ═══════════════ */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14}}>
          <WCard onClick={() => navigate('/employees')}>
            <SHead icon={<TrendingUp size={14} color="#10b981"/>} title="Headcount Growth" right={<span style={{fontSize:12, fontWeight:800, color:"#10b981"}}>260 ↑</span>}/>
            <ResponsiveContainer width="100%" height={185}>
              <AreaChart data={growthData}>
                <defs><linearGradient id="gr1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a855f7" stopOpacity={0.18}/><stop offset="95%" stopColor="#a855f7" stopOpacity={0}/></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false}/>
                <XAxis dataKey="month" tick={{fontSize:10, fill:"#9ca3af"}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fontSize:9, fill:"#9ca3af"}} axisLine={false} tickLine={false} domain={["dataMin - 10","dataMax + 10"]}/>
                <Tooltip contentStyle={{borderRadius:10, border:"none", boxShadow:"0 4px 20px rgba(0,0,0,.1)", fontSize:11}} cursor={{stroke:"#e2e8f0"}}/>
                <Area type="monotone" dataKey="count" stroke="#a855f7" strokeWidth={2.5} fill="url(#gr1)" dot={{r:4, fill:"#a855f7", stroke:"#fff", strokeWidth:2}}/>
              </AreaChart>
            </ResponsiveContainer>
          </WCard>

          <WCard onClick={() => navigate('/leave')}>
            <SHead icon={<FileText size={14} color="#f97316"/>} title="Leave Breakdown" right={pendingLv>0 ? <Chip bg="#fef3c7" fg="#d97706">{pendingLv} Pending</Chip> : undefined}/>
            <div style={{display:"flex", gap:16, alignItems:"center"}}>
              <div style={{position:"relative", width:130, height:130, flexShrink:0}}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={leaveData} cx="50%" cy="50%" innerRadius={35} outerRadius={53} dataKey="used" stroke="none">
                      {leaveData.map((d,i)=><Cell key={i} fill={d.color}/>)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div style={{position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", textAlign:"center"}}>
                  <div style={{fontSize:14, fontWeight:800, color:"#1e1b4b"}}>173</div>
                  <div style={{fontSize:8, color:"#9ca3af"}}>TOTAL</div>
                </div>
              </div>
              <div style={{flex:1}}>
                {leaveData.map((d,i)=>(
                  <div key={i} style={{marginBottom:9}}>
                    <div style={{display:"flex", justifyContent:"space-between", fontSize:10}}>
                      <span style={{color:"#374151", display:"flex", alignItems:"center", gap:5}}><span style={{width:7, height:7, borderRadius:"50%", background:d.color, display:"inline-block"}}/>{d.type}</span>
                      <span style={{fontWeight:700, color:"#1e1b4b"}}>{d.used}<span style={{color:"#d1d5db", fontWeight:400}}>/{d.total}</span></span>
                    </div>
                    <Prog pct={(d.used/d.total)*100} color={d.color}/>
                  </div>
                ))}
              </div>
            </div>
          </WCard>
        </div>

        {/* ══ 3-COL: Pending Actions + Urgent Alerts + Top Performers ════════ */}
        <div style={{display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14, marginBottom:14}}>
          <WCard>
            <SHead icon={<AlertTriangle size={14} color="#f59e0b"/>} title="Pending Actions" right={<Chip bg="#fef3c7" fg="#d97706">{actions.length}</Chip>}/>
            {actions.map((a,i)=>(
              <div key={i} className="rh" style={{display:"flex", alignItems:"center", gap:10, padding:"9px 6px", borderBottom:i<actions.length-1?"1px solid #f3f4f6":"none"}}>
                <span style={{fontSize:15}}>{a.emoji}</span>
                <span style={{flex:1, fontSize:11, color:"#374151", lineHeight:1.4}}>{a.text}</span>
                <button onClick={()=>navigate(a.link)} style={{background:"none", border:"none", color:"#6366f1", fontSize:10, fontWeight:700, cursor:"pointer", padding:"2px 0", whiteSpace:"nowrap"}}>{a.cta}</button>
              </div>
            ))}
          </WCard>

          <WCard>
            <SHead icon={<ShieldAlert size={14} color="#ef4444"/>} title="Urgent Alerts" right={<Chip bg="#fef2f2" fg="#dc2626">{alerts.length}</Chip>}/>
            {alerts.map((a,i)=>(
              <div key={i} className="rh" style={{display:"flex", alignItems:"center", gap:10, padding:"9px 6px", borderBottom:i<alerts.length-1?"1px solid #f3f4f6":"none"}}>
                <div style={{flex:1}}><div style={{fontSize:11, fontWeight:600, color:"#1e1b4b"}}>{a.name}</div><div style={{fontSize:9, color:"#9ca3af", marginTop:2}}>{a.sub}</div></div>
                <Chip bg={a.bg} fg={a.fg}>{a.chip}</Chip>
              </div>
            ))}
          </WCard>

          <WCard>
            <SHead icon={<Award size={14} color="#f59e0b"/>} title="Top Performers" right={<Chip bg="#fefce8" fg="#ca8a04">This Month</Chip>}/>
            {topP.map((p,i)=>(
              <div key={i} className="rh" style={{display:"flex", alignItems:"center", gap:10, padding:"9px 6px", borderBottom:i<topP.length-1?"1px solid #f3f4f6":"none"}}>
                <div style={{width:30, height:30, borderRadius:8, background:p.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:i<3?14:9, fontWeight:700, flexShrink:0}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":p.ini}</div>
                <div style={{flex:1}}><div style={{fontSize:11, fontWeight:600, color:"#1e1b4b"}}>{p.name}</div><div style={{fontSize:9, color:"#9ca3af"}}>{p.dept}</div></div>
                <span style={{fontSize:13, fontWeight:800, color:"#10b981"}}>{p.score}%</span>
              </div>
            ))}
          </WCard>
        </div>

        {/* ══ 2-COL: Recent Activity + Announcements ══════════════════════════ */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:14}}>
          <WCard>
            <SHead icon={<Activity size={14} color="#6b7280"/>} title="Recent Activity" right={<button onClick={()=>navigate("/audit-log")} style={{background:"none", border:"none", fontSize:10, color:"#6366f1", fontWeight:600, cursor:"pointer", padding:0}}>View All →</button>}/>
            {activity.map((a,i)=>(
              <div key={i} className="rh" style={{display:"flex", alignItems:"center", gap:10, padding:"9px 6px", borderBottom:i<activity.length-1?"1px solid #f3f4f6":"none"}}>
                <Av ini={a.ini} color={a.color} size={32}/>
                <div style={{flex:1}}><div style={{fontSize:11, color:"#374151"}}>{a.text}</div><div style={{fontSize:9, color:"#d1d5db", marginTop:2}}>{a.time} · {a.by}</div></div>
                <Chip bg={a.cBg} fg={a.cFg}>{a.chip}</Chip>
              </div>
            ))}
          </WCard>

          <WCard>
            <SHead icon={<Megaphone size={14} color="#f59e0b"/>} title="Announcements"/>
            {combinedAnnouncements.map((a:any,i:number)=>(
              <div key={i} style={{padding:"10px 0", borderBottom:i<ANNOUNCEMENTS.length-1?"1px solid #f3f4f6":"none"}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:8}}><span style={{fontSize:12, fontWeight:600, color:"#1e1b4b", lineHeight:1.3}}>{a.title}</span><span style={{fontSize:9, color:"#d1d5db", whiteSpace:"nowrap", marginTop:2}}>{a.date}</span></div>
                <p style={{margin:"4px 0 0", fontSize:10, color:"#9ca3af", lineHeight:1.55}}>{a.text}</p>
              </div>
            ))}
          </WCard>
        </div>

        {/* ══ CALENDAR + BIRTHDAYS (Same size as other cards) ════════════════ */}
        <div style={{display:"grid", gridTemplateColumns:"1fr 1fr", gap:14}}>

          {/* Calendar - compact mini calendar that syncs with DataContext */}
          <WCard>
            <SHead
              icon={<CalendarDays size={14} color="#6366f1" />}
              title="Calendar — Events"
              right={
                <button
                  onClick={() => navigate("/calendar")}
                  style={{ fontSize: 11, color: "#6366f1", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}
                >
                  View Full →
                </button>
              }
            />
            <MiniCalendar employees={(filteredEmployees && filteredEmployees.length) ? filteredEmployees : employees} events={(globalDays || []).map((g:any) => ({ date: g.date, title: g.title || g.type, type: g.type }))} />
          </WCard>

          {/* Birthdays - Exactly same size as other cards */}
          <WCard>
            <SHead
              icon={<Cake size={14} color="#ec4899"/>}
              title="Upcoming Birthdays"
              right={
                <span style={{background:"#fdf2f8", color:"#ec4899", padding:"3px 9px", borderRadius:20, fontSize:10, fontWeight:700}}>
                  Birthdays this month · {birthdays.length}
                </span>
              }
            />

            {birthdays.length === 0 ? (
              <div style={{textAlign:"center", padding:"36px 20px"}}>
                <div style={{fontSize:28}}>🎉</div>
                <div style={{fontSize:11, color:"#9ca3af", marginTop:8}}>No birthdays in the next 30 days</div>
              </div>
            ) : (
              <div style={{maxHeight: 340, overflowY: "auto"}}>
                {birthdays.map((b, i) => (
                  <div key={i} className="rh"
                    style={{display:"flex", alignItems:"center", gap:12, padding:"10px 6px", borderBottom: i < birthdays.length-1 ? "1px solid #f3f4f6" : "none"}}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: b.daysUntil === 0 ? "linear-gradient(135deg,#ec4899,#fbcfe8)" : "linear-gradient(135deg,#6366f1,#8b5cf6)",
                      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: b.daysUntil === 0 ? 16 : 11, fontWeight: 700,
                    }}>
                      {b.daysUntil === 0 ? "🎂" : b.ini}
                    </div>
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={{fontSize: 12, fontWeight: 600, color: "#1e1b4b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>{b.name}</div>
                      <div style={{fontSize: 9, color: "#9ca3af", marginTop: 1}}>{b.dept}</div>
                    </div>
                    <div style={{
                      background: b.daysUntil === 0 ? "#ec4899" : b.daysUntil <= 3 ? "#f59e0b" : "#eff6ff",
                      color: b.daysUntil <= 3 ? "#fff" : "#6366f1",
                      padding: "3px 8px", borderRadius: 16, fontSize: 9, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0,
                    }}>
                        {b.daysUntil === 0 ? "Today" : b.daysUntil === 1 ? "Tomorrow" : `${b.daysUntil}d`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </WCard>
        </div>

      </div>
    </>
  );
}