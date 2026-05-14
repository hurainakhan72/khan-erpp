import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BRANCHES, EMP_DATA } from './attendanceTypes';

type ShiftType = 'Morning' | 'Evening' | 'Night';
type EmployeeStatus = 'Present' | 'Late' | 'Absent' | 'On Leave';

interface Employee {
  name: string;
  code: string;
  dept: string;
  mgr: string;
  shift: ShiftType;
  ci: string;
  co: string;
  status: EmployeeStatus;
  notes: string;
  lates: number;
  state?: 'draft' | 'saved' | 'submitted' | 'acknowledged' | 'unlock_requested';
}

const GRADS = [
  'linear-gradient(135deg,#6366f1,#8b5cf6)',
  'linear-gradient(135deg,#ec4899,#db2777)',
  'linear-gradient(135deg,#f97316,#f59e0b)',
  'linear-gradient(135deg,#14b8a6,#06b6d4)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#3b82f6,#6366f1)',
];

const ng = (name: string) => GRADS[(name.charCodeAt(0) || 0) % GRADS.length];
const ini = (name: string) => name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase();
const t12 = (time: string) => {
  if (!time || time === '--') return '--';
  const [hours, minutes] = time.split(':');
  const hr = parseInt(hours, 10);
  return `${hr % 12 || 12}:${minutes} ${hr >= 12 ? 'PM' : 'AM'}`;
};

const EMPS: Employee[] = [
  { name: 'Ahmed Raza', code: 'E-101', dept: 'Sales', mgr: 'Ahmed Khan', shift: 'Morning', ci: '09:04', co: '06:02', status: 'Present', notes: '', lates: 4, state: 'submitted' },
  { name: 'Sana Iqbal', code: 'E-102', dept: 'Accounts', mgr: 'Sara Malik', shift: 'Morning', ci: '09:18', co: '06:10', status: 'Late', notes: 'Traffic on Shahrah', lates: 3, state: 'submitted' },
  { name: 'Bilal Khan', code: 'E-103', dept: 'IT', mgr: 'Usman Tariq', shift: 'Evening', ci: '02:00', co: '10:05', status: 'Present', notes: 'Covering for Hamza', lates: 0, state: 'saved' },
  { name: 'Hira Saleem', code: 'E-104', dept: 'HR', mgr: 'Sara Malik', shift: 'Morning', ci: '--', co: '--', status: 'On Leave', notes: 'CL approved', lates: 0, state: 'acknowledged' },
  { name: 'Usman Tariq', code: 'E-105', dept: 'Warehouse', mgr: 'Ahmed Khan', shift: 'Night', ci: '10:11', co: '06:01', status: 'Present', notes: 'Shift swap', lates: 2, state: 'submitted' },
  { name: 'Mariam Yousuf', code: 'E-106', dept: 'Marketing', mgr: 'Nadia Sheikh', shift: 'Morning', ci: '--', co: '--', status: 'Absent', notes: 'No leave application', lates: 0, state: 'draft' },
  { name: 'Faraz Ali', code: 'E-107', dept: 'Sales', mgr: 'Ahmed Khan', shift: 'Morning', ci: '09:02', co: '06:00', status: 'Present', notes: 'DHA visit', lates: 0, state: 'submitted' },
  { name: 'Zoya Hashmi', code: 'E-108', dept: 'Accounts', mgr: 'Sara Malik', shift: 'Evening', ci: '02:25', co: '10:10', status: 'Late', notes: 'Bank work', lates: 4, state: 'submitted' },
  { name: 'Kamran Sheikh', code: 'E-109', dept: 'IT', mgr: 'Usman Tariq', shift: 'Morning', ci: '09:00', co: '06:00', status: 'Present', notes: '', lates: 1, state: 'submitted' },
  { name: 'Rabia Noor', code: 'E-110', dept: 'HR', mgr: 'Sara Malik', shift: 'Morning', ci: '09:05', co: '06:00', status: 'Present', notes: '', lates: 0, state: 'submitted' },
  { name: 'Hassan Malik', code: 'E-111', dept: 'Operations', mgr: 'Nadia Sheikh', shift: 'Morning', ci: '08:55', co: '05:58', status: 'Present', notes: '', lates: 0, state: 'acknowledged' },
  { name: 'Ayesha Siddiq', code: 'E-112', dept: 'Engineering', mgr: 'Ahmed Khan', shift: 'Evening', ci: '02:10', co: '10:00', status: 'Late', notes: '', lates: 2, state: 'submitted' },
];

const HR_DEPT = 'IT';
const DEPARTMENTS = ['All Departments', 'Sales', 'Accounts', 'IT', 'HR', 'Warehouse', 'Marketing', 'Operations', 'Engineering'];
const MANAGERS = ['All Managers', 'Ahmed Khan', 'Sara Malik', 'Usman Tariq', 'Nadia Sheikh'];
const STATUS_OPTIONS = ['All Status', 'Present', 'Late', 'Absent', 'On Leave'];
const MODAL_STATUS: EmployeeStatus[] = ['Present', 'Late', 'Absent', 'On Leave'];

const Attendance = () => {
  const { activeRole, user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('sa');
  const [deptFilter, setDeptFilter] = useState<string>('All Departments');
  const [mgrFilter, setMgrFilter] = useState<string>('All Managers');
  const [statusFilter, setStatusFilter] = useState<string>('All Status');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [saStatFilter, setSaStatFilter] = useState<string>('All');
  const [hrStatFilter, setHrStatFilter] = useState<string>('All');
  const [hrSearchTerm, setHrSearchTerm] = useState<string>('');
  const [selectedEmployeeCode, setSelectedEmployeeCode] = useState<string>('');
  const [modalStatus, setModalStatus] = useState<EmployeeStatus>('Present');
  const [modalNotes, setModalNotes] = useState<string>('');
  const [saveLabel, setSaveLabel] = useState<string>('Save Entry');
  const today = new Date();
  const [attendanceRows, setAttendanceRows] = useState<Employee[]>(EMPS.map((emp) => ({ ...emp, state: emp.state || 'draft' })));
  const [modalDate, setModalDate] = useState<string>(today.toISOString().slice(0, 10));
  const [modalIn, setModalIn] = useState<string>('09:00');
  const [modalOut, setModalOut] = useState<string>('18:00');

  useEffect(() => {
    // Treat Head HR as SuperAdmin for the attendance view so they see the same master layout
    if (activeRole === 'super_admin' || activeRole === 'head_hr') {
      setActiveTab('sa');
    } else if (activeRole === 'hr' || activeRole === 'branch_hr' || activeRole === 'dept_hr') {
      setActiveTab('hr');
    } else {
      setActiveTab('emp');
    }
  }, [activeRole]);

  // If Department HR, pre-filter to their department and keep selection locked
  useEffect(() => {
    if (activeRole === 'department_hr' || activeRole === 'dept_hr') {
      const dept = (user?.departments && user.departments[0]) || 'All Departments';
      setDeptFilter(dept);
    }
    if (activeRole === 'branch_hr' && user?.branch) {
      setDeptFilter('All Departments');
    }
  }, [activeRole, user]);

  const isSuperAdmin = activeRole === 'super_admin' || activeRole === 'head_hr';
  const isHR = activeRole === 'hr' || activeRole === 'branch_hr' || activeRole === 'dept_hr';
  const isEmployee = activeRole === 'employee';

  const allowedTabs = useMemo(() => {
    if (isSuperAdmin) {
      return [
        { id: 'sa', label: 'SuperAdmin', icon: '🛡️' },
        { id: 'mod', label: 'Add Attendance', icon: '➕' },
      ];
    }
    if (isHR) {
      return [
        { id: 'hr', label: 'HR View', icon: '👥' },
        { id: 'mod', label: 'Add Attendance', icon: '➕' },
      ];
    }
    return [{ id: 'emp', label: 'My Attendance', icon: '👤' }];
  }, [isSuperAdmin, isHR]);

  const selectedEmployee = useMemo(
    () => attendanceRows.find((emp) => emp.code === selectedEmployeeCode) || null,
    [attendanceRows, selectedEmployeeCode]
  );

  const employeeRecord = useMemo(() => {
    if (isEmployee && user?.employeeId) {
      return attendanceRows.find((emp) => emp.code === user.employeeId) || attendanceRows[0];
    }
    return attendanceRows[0];
  }, [attendanceRows, isEmployee, user]);

  // Determine which attendance rows the current user is allowed to see
  const visibleRows = useMemo(() => {
    if (isSuperAdmin) return attendanceRows; // full company
    if (activeRole === 'branch_hr') {
      // branch_hr sees records for their branch (if data has branch field)
      if (user?.branch) return attendanceRows.filter((emp: any) => emp.branch === user.branch || !emp.branch);
      return attendanceRows;
    }
    if (activeRole === 'department_hr' || activeRole === 'dept_hr') {
      const depts = user?.departments || [];
      if (depts.includes('All')) return attendanceRows;
      return attendanceRows.filter((emp) => depts.includes(emp.dept));
    }
    if (isHR) return attendanceRows; // generic HR fallback
    if (isEmployee && user?.employeeId) return attendanceRows.filter((emp) => emp.code === user.employeeId);
    return attendanceRows;
  }, [attendanceRows, activeRole, user, isSuperAdmin, isHR, isEmployee]);

  const filteredSA = useMemo(() => {
    return visibleRows.filter((emp) => {
      if (deptFilter !== 'All Departments' && emp.dept !== deptFilter) return false;
      if (mgrFilter !== 'All Managers' && emp.mgr !== mgrFilter) return false;
      if (statusFilter !== 'All Status' && emp.status !== statusFilter) return false;
      if (saStatFilter !== 'All' && saStatFilter !== 'Penalties' && emp.status !== saStatFilter) return false;
      const term = searchTerm.toLowerCase().trim();
      if (term && ![emp.name, emp.code, emp.dept, emp.mgr].some((value) => value.toLowerCase().includes(term))) {
        return false;
      }
      return true;
    });
  }, [visibleRows, deptFilter, mgrFilter, statusFilter, searchTerm, saStatFilter]);

  const hrEmployees = useMemo(() => visibleRows, [visibleRows]);

  const filteredHR = useMemo(() => {
    return hrEmployees.filter((emp) => {
      if (hrStatFilter !== 'All' && emp.status !== hrStatFilter) return false;
      const term = hrSearchTerm.toLowerCase().trim();
      return !term || emp.name.toLowerCase().includes(term);
    });
  }, [hrEmployees, hrStatFilter, hrSearchTerm]);

  const saCounts = useMemo(
    () => ({
      present: attendanceRows.filter((emp) => emp.status === 'Present').length,
      late: attendanceRows.filter((emp) => emp.status === 'Late').length,
      absent: attendanceRows.filter((emp) => emp.status === 'Absent').length,
      onLeave: attendanceRows.filter((emp) => emp.status === 'On Leave').length,
    }),
    [attendanceRows]
  );

  const hrCounts = useMemo(
    () => ({
      present: hrEmployees.filter((emp) => emp.status === 'Present').length,
      late: hrEmployees.filter((emp) => emp.status === 'Late').length,
      absent: hrEmployees.filter((emp) => emp.status === 'Absent').length,
      onLeave: hrEmployees.filter((emp) => emp.status === 'On Leave').length,
    }),
    [hrEmployees]
  );

  const clearFilters = () => {
    setDeptFilter('All Departments');
    setMgrFilter('All Managers');
    setStatusFilter('All Status');
    setSearchTerm('');
    setSaStatFilter('All');
  };

  const requestUnlockAttendance = (empCode: string) => {
    setAttendanceRows((prev) =>
      prev.map((emp) =>
        emp.code === empCode && emp.state === 'submitted'
          ? { ...emp, state: 'unlock_requested' }
          : emp
      )
    );
  };

  const submitAttendance = (empCode: string) => {
    setAttendanceRows((prev) =>
      prev.map((emp) =>
        emp.code === empCode
          ? { ...emp, state: 'submitted' }
          : emp
      )
    );
  };

  const unlockAttendance = (empCode: string) => {
    setAttendanceRows((prev) =>
      prev.map((emp) =>
        emp.code === empCode && (emp.state === 'submitted' || emp.state === 'unlock_requested')
          ? { ...emp, state: 'saved' }
          : emp
      )
    );
  };

  const acknowledgeAttendance = (empCode: string) => {
    setAttendanceRows((prev) =>
      prev.map((emp) =>
        emp.code === empCode && emp.state === 'submitted'
          ? { ...emp, state: 'acknowledged' }
          : emp
      )
    );
  };

  const saveAttendance = () => {
    if (selectedEmployee) {
      setAttendanceRows((prev) =>
        prev.map((emp) =>
          emp.code === selectedEmployee.code
            ? {
                ...emp,
                ci: modalIn,
                co: modalOut,
                status: modalStatus,
                notes: modalNotes,
                state: emp.state === 'submitted' ? 'submitted' : 'saved',
              }
            : emp
        )
      );
    }

    setSaveLabel('Saved!');
    setTimeout(() => {
      setSaveLabel('Save Entry');
      setActiveTab(isSuperAdmin ? 'sa' : isHR ? 'hr' : 'emp');
      setSelectedEmployeeCode('');
      setModalStatus('Present');
      setModalNotes('');
      setModalDate(today.toISOString().slice(0, 10));
      setModalIn('09:00');
      setModalOut('18:00');
    }, 1200);
  };

  const pageStyles = `
    *{box-sizing:border-box;margin:0;padding:0;}
    body,div,span,td,th,input,select,button,textarea{font-family:'Segoe UI',system-ui,sans-serif;}
    .page{background:#f0f2f8;padding:16px;min-height:100vh;}
    .tab-row{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap;}
    .tab{padding:7px 18px;border-radius:20px;border:1px solid #e5e7eb;background:#fff;color:#6b7280;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;}
    .tab.on{background:#6366f1;color:#fff;border-color:#6366f1;}
    .hidden{display:none!important;}
    .ph{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px;flex-wrap:wrap;gap:10px;}
    .ptitle{font-size:20px;font-weight:700;color:#1e1b4b;}
    .psub{font-size:11px;color:#9ca3af;margin-top:3px;}
    .hbtns{display:flex;gap:6px;flex-wrap:wrap;}
    .btn{height:32px;border-radius:8px;border:1px solid #e5e7eb;background:#fff;color:#374151;font-size:11px;font-weight:600;padding:0 12px;cursor:pointer;display:inline-flex;align-items:center;gap:5px;transition:all .15s;}
    .btn:hover{background:#f5f7ff;border-color:#c7d2fe;}
    .btn.prim{background:#6366f1;color:#fff;border:none;}
    .btn.prim:hover{background:#4f46e5;}
    .stats5{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:12px;}
    .scard{background:#fff;border-radius:14px;border:1.5px solid #e5e7eb;padding:14px 16px;cursor:pointer;transition:all .18s;position:relative;overflow:hidden;}
    .scard:hover{transform:translateY(-2px);border-color:#a5b4fc;}
    .scard.on{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.15);}
    .scard-accent{position:absolute;left:0;top:0;bottom:0;width:4px;border-radius:14px 0 0 14px;}
    .scard-icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:18px;margin-bottom:10px;}
    .scard-val{font-size:30px;font-weight:700;color:#1e1b4b;line-height:1;}
    .scard-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;margin-top:5px;}
    .scard-sub{font-size:9px;color:#9ca3af;margin-top:2px;}
    .drow{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:12px;}
    .dcard{background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:12px 14px;display:flex;align-items:center;gap:10px;transition:all .15s;}
    .dcard:hover{box-shadow:0 2px 12px rgba(99,102,241,.12);border-color:#c7d2fe;}
    .dicon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;}
    .dname{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#9ca3af;}
    .dval{font-size:17px;font-weight:700;color:#1e1b4b;}
    .dsub{font-size:9px;color:#9ca3af;margin-top:2px;}
    .mcard{background:#fff;border-radius:14px;border:1px solid #e5e7eb;overflow:hidden;margin-bottom:4px;}
    .alertbar{padding:9px 16px;background:#fffbeb;border-bottom:1px solid #fde68a;font-size:11px;color:#92400e;display:flex;align-items:center;gap:8px;flex-wrap:wrap;}
    .apill{background:#fef3c7;padding:2px 9px;border-radius:20px;font-size:10px;font-weight:700;color:#b45309;}
    .fbar{display:flex;align-items:center;gap:7px;flex-wrap:wrap;padding:10px 14px;border-bottom:1px solid #f1f5f9;background:#fafbff;}
    .fitem{display:flex;align-items:center;gap:5px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:0 10px;height:30px;font-size:11px;color:#374151;cursor:pointer;}
    .fitem select,.fitem input{border:none;background:transparent;outline:none;font-size:11px;color:#374151;cursor:pointer;}
    .fsearch{display:flex;align-items:center;gap:6px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:0 10px;height:30px;flex:1;min-width:160px;}
    .fsearch input{border:none;background:transparent;outline:none;font-size:11px;color:#374151;width:100%;}
    .clrbtn{height:28px;border-radius:8px;border:1px solid #fecaca;background:#fef2f2;color:#dc2626;font-size:10px;font-weight:700;padding:0 10px;cursor:pointer;}
    .tbl{width:100%;border-collapse:collapse;font-size:11px;table-layout:fixed;}
    .tbl th{padding:8px 10px;text-align:left;font-size:9px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:.06em;background:#fafbff;border-bottom:1px solid #f1f5f9;white-space:nowrap;}
    .tbl td{padding:10px 10px;border-bottom:1px solid #f8fafc;color:#374151;vertical-align:middle;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
    .tbl tr:hover td{background:#f5f7ff;}
    .tbl tr:last-child td{border-bottom:none;}
    .av{width:30px;height:30px;border-radius:8px;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;vertical-align:middle;}
    .chip{font-family:monospace;font-size:9px;background:#f3f4f6;padding:1px 5px;border-radius:4px;color:#6b7280;}
    .shift{border-radius:6px;padding:2px 8px;font-size:9px;font-weight:700;cursor:pointer;border:1px solid;}
    .sm{background:#dbeafe;color:#1e40af;border-color:#bfdbfe;}
    .se{background:#fef3c7;color:#92400e;border-color:#fde68a;}
    .sn{background:#ede9fe;color:#3730a3;border-color:#c4b5fd;}
    .stbadge{border-radius:20px;padding:2px 9px;font-size:9px;font-weight:700;cursor:pointer;border:1px solid;}
    .sp{background:#d1fae5;color:#065f46;border-color:#a7f3d0;}
    .sl{background:#fef3c7;color:#92400e;border-color:#fde68a;}
    .sa2{background:#fee2e2;color:#991b1b;border-color:#fecaca;}
    .so{background:#ede9fe;color:#3730a3;border-color:#c4b5fd;}
    .db{background:#dbeafe;color:#1e40af;border-color:#bfdbfe;}
    .gb{background:#d1fae5;color:#065f46;border-color:#a7f3d0;}
    .pb2{background:#fce7f3;color:#9d174d;border-color:#fbcfe8;}
    .lbtn{background:none;border:none;color:#6366f1;font-weight:700;cursor:pointer;font-size:11px;}
    .lnum{background:#fee2e2;color:#991b1b;padding:1px 6px;border-radius:5px;font-family:monospace;font-size:10px;}
    .notecell{font-size:10px;color:#9ca3af;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:inline-block;}
    .foot{padding:8px 14px;border-top:1px solid #f1f5f9;font-size:10px;color:#9ca3af;display:flex;justify-content:space-between;background:#fafbff;flex-wrap:wrap;gap:8px;}
    .hrhead{background:#6366f1;padding:16px 18px;}
    .hrtitle{font-size:18px;font-weight:700;color:#fff;}
    .hrsub{font-size:11px;color:rgba(255,255,255,.75);margin-top:3px;}
    .hrstats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:14px 16px;border-bottom:1px solid #f1f5f9;}
    .hrstat{background:#fff;border-radius:12px;border:1.5px solid #e5e7eb;padding:12px 14px;cursor:pointer;transition:all .18s;}
    .hrstat:hover{transform:translateY(-2px);border-color:#a5b4fc;}
    .hrstat.on{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.15);}
    .hrstat-icon{width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;margin-bottom:7px;}
    .hrstat-val{font-size:24px;font-weight:700;color:#1e1b4b;}
    .hrstat-lbl{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;color:#9ca3af;margin-top:2px;}
    .abar{display:flex;gap:8px;align-items:center;padding:10px 14px;border-bottom:1px solid #f1f5f9;background:#fafbff;flex-wrap:wrap;}
    .hrsearch{display:flex;align-items:center;gap:6px;background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:0 12px;height:30px;flex:1;max-width:300px;}
    .hrsearch input{border:none;background:transparent;outline:none;font-size:11px;color:#374151;width:100%;}
    .ov{min-height:500px;background:rgba(0,0,0,.42);border-radius:14px;display:flex;align-items:flex-start;justify-content:center;padding:20px 10px;position:fixed;top:0;left:0;right:0;bottom:0;z-index:1000;}
    .modal{background:#fff;border-radius:16px;width:100%;max-width:410px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.12);}
    .mhead{background:#6366f1;padding:14px 18px;display:flex;justify-content:space-between;align-items:center;}
    .mt{font-size:14px;font-weight:700;color:#fff;}
    .ms{font-size:10px;color:rgba(255,255,255,.7);margin-top:2px;}
    .mclose{width:24px;height:24px;background:rgba(255,255,255,.2);border:none;border-radius:6px;color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:13px;}
    .mbody{padding:14px 16px;}
    .fg{display:flex;flex-direction:column;gap:4px;margin-bottom:10px;}
    .fl{font-size:10px;font-weight:700;color:#6b7280;}
    .fi{height:32px;border:1px solid #e5e7eb;border-radius:8px;padding:0 10px;font-size:11px;color:#374151;background:#fff;width:100%;outline:none;}
    .fi:focus{border-color:#6366f1;box-shadow:0 0 0 2px rgba(99,102,241,.12);}
    .frow{display:grid;grid-template-columns:1fr 1fr;gap:8px;}
    .prev{display:flex;align-items:center;gap:8px;background:#f5f7ff;border:1px solid #c7d2fe;border-radius:9px;padding:9px 11px;margin-bottom:10px;}
    .stog{padding:4px 12px;border-radius:20px;border:1px solid;font-size:10px;font-weight:700;cursor:pointer;transition:all .15s;}
    .mfoot{padding:10px 16px;border-top:1px solid #f1f5f9;display:flex;justify-content:flex-end;gap:7px;background:#fafbff;}
  `;

  const countRow = filteredSA.length;
  const countHr = filteredHR.length;
  const displayDate = new Date();
  const formattedDate = displayDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="page">
      <style>{pageStyles}</style>
      <div className="tab-row">
        {allowedTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab ${activeTab === tab.id ? 'on' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'sa' && isSuperAdmin && (
        <div id="sa">
          <div className="ph">
            <div>
              <div className="ptitle">📋 Attendance Master</div>
              <div className="psub" id="sa-sub">
                Company-wide · <span style={{ color: '#6366f1', fontWeight: 700 }} id="sa-count">{countRow} records</span> · {formattedDate}
              </div>
            </div>
            <div className="hbtns">
              <button className="btn" type="button">📤 Export</button>
              <button className="btn" type="button">📥 Import</button>
              <button className="btn prim" type="button" onClick={() => setActiveTab('mod')}>➕ Add Attendance</button>
            </div>
          </div>

          <div className="stats5" id="sa-stats">
            <div className={`scard ${saStatFilter === 'Present' ? 'on' : ''}`} onClick={() => setSaStatFilter(saStatFilter === 'Present' ? 'All' : 'Present')}>
              <div className="scard-accent" style={{ background: '#10b981' }} />
              <div className="scard-icon" style={{ background: '#d1fae5', color: '#059669', marginLeft: 6 }}>✅</div>
              <div className="scard-val" style={{ marginLeft: 6 }}>{saCounts.present}</div>
              <div className="scard-lbl" style={{ marginLeft: 6 }}>Present Today</div>
              <div className="scard-sub" style={{ marginLeft: 6 }}>{attendanceRows.length > 0 ? Math.round((saCounts.present / attendanceRows.length) * 100) : 0}% attendance</div>
            </div>
            <div className={`scard ${saStatFilter === 'Late' ? 'on' : ''}`} onClick={() => setSaStatFilter(saStatFilter === 'Late' ? 'All' : 'Late')}>
              <div className="scard-accent" style={{ background: '#f59e0b' }} />
              <div className="scard-icon" style={{ background: '#fef3c7', color: '#d97706', marginLeft: 6 }}>⏰</div>
              <div className="scard-val" style={{ marginLeft: 6 }}>{saCounts.late}</div>
              <div className="scard-lbl" style={{ marginLeft: 6 }}>Late Arrivals</div>
              <div className="scard-sub" style={{ marginLeft: 6 }}>Flagged check-ins</div>
            </div>
            <div className={`scard ${saStatFilter === 'Absent' ? 'on' : ''}`} onClick={() => setSaStatFilter(saStatFilter === 'Absent' ? 'All' : 'Absent')}>
              <div className="scard-accent" style={{ background: '#ef4444' }} />
              <div className="scard-icon" style={{ background: '#fee2e2', color: '#dc2626', marginLeft: 6 }}>❌</div>
              <div className="scard-val" style={{ marginLeft: 6 }}>{saCounts.absent}</div>
              <div className="scard-lbl" style={{ marginLeft: 6 }}>Absent Today</div>
              <div className="scard-sub" style={{ marginLeft: 6 }}>Without leave</div>
            </div>
            <div className={`scard ${saStatFilter === 'On Leave' ? 'on' : ''}`} onClick={() => setSaStatFilter(saStatFilter === 'On Leave' ? 'All' : 'On Leave')}>
              <div className="scard-accent" style={{ background: '#8b5cf6' }} />
              <div className="scard-icon" style={{ background: '#ede9fe', color: '#7c3aed', marginLeft: 6 }}>🏖️</div>
              <div className="scard-val" style={{ marginLeft: 6 }}>{saCounts.onLeave}</div>
              <div className="scard-lbl" style={{ marginLeft: 6 }}>On Leave</div>
              <div className="scard-sub" style={{ marginLeft: 6 }}>Approved leaves</div>
            </div>
            <div className={`scard ${saStatFilter === 'Penalties' ? 'on' : ''}`} onClick={() => setSaStatFilter(saStatFilter === 'Penalties' ? 'All' : 'Penalties')}>
              <div className="scard-accent" style={{ background: '#ec4899' }} />
              <div className="scard-icon" style={{ background: '#fce7f3', color: '#db2777', marginLeft: 6 }}>⚡</div>
              <div className="scard-val" style={{ marginLeft: 6 }}>2</div>
              <div className="scard-lbl" style={{ marginLeft: 6 }}>Auto Penalties</div>
              <div className="scard-sub" style={{ marginLeft: 6 }}>3 lates = 1 day cut</div>
            </div>
          </div>

          <div className="drow">
            <div className="dcard"><div className="dicon" style={{ background: '#ede9fe', color: '#4338ca' }}>💼</div><div><div className="dname">Sales</div><div className="dval">2 <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 400 }}>staff</span></div><div className="dsub"><span style={{ color: '#059669' }}>✓2</span> · <span style={{ color: '#d97706' }}>⏰0</span> · <span style={{ color: '#dc2626' }}>✗0</span></div></div></div>
            <div className="dcard"><div className="dicon" style={{ background: '#dbeafe', color: '#1e40af' }}>🖥️</div><div><div className="dname">IT</div><div className="dval">2 <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 400 }}>staff</span></div><div className="dsub"><span style={{ color: '#059669' }}>✓2</span> · <span style={{ color: '#d97706' }}>⏰0</span> · <span style={{ color: '#dc2626' }}>✗0</span></div></div></div>
            <div className="dcard"><div className="dicon" style={{ background: '#d1fae5', color: '#065f46' }}>💰</div><div><div className="dname">Accounts</div><div className="dval">2 <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 400 }}>staff</span></div><div className="dsub"><span style={{ color: '#059669' }}>✓0</span> · <span style={{ color: '#d97706' }}>⏰2</span> · <span style={{ color: '#dc2626' }}>✗0</span></div></div></div>
            <div className="dcard"><div className="dicon" style={{ background: '#fef3c7', color: '#92400e' }}>👥</div><div><div className="dname">HR</div><div className="dval">2 <span style={{ fontSize: 10, color: '#9ca3af', fontWeight: 400 }}>staff</span></div><div className="dsub"><span style={{ color: '#059669' }}>✓1</span> · <span style={{ color: '#d97706' }}>⏰0</span> · <span style={{ color: '#dc2626' }}>✗0</span></div></div></div>
          </div>

          <div className="mcard">
            <div className="alertbar"><span className="apill">⚠️ 3 Lates = 1 Day Cut</span><span>Live: <strong id="al-abs">{saCounts.absent}</strong> Absent · <strong id="al-late">{saCounts.late}</strong> Late flagged today</span></div>
            <div className="fbar">
              <div className="fitem">
                <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)}>
                  {DEPARTMENTS.map((dept) => <option key={dept}>{dept}</option>)}
                </select>
              </div>
              <div className="fitem">
                <select value={mgrFilter} onChange={(e) => setMgrFilter(e.target.value)}>
                  {MANAGERS.map((mgr) => <option key={mgr}>{mgr}</option>)}
                </select>
              </div>
              <div className="fitem">
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  {STATUS_OPTIONS.map((status) => <option key={status}>{status}</option>)}
                </select>
              </div>
              <div className="fitem"><span>📅</span><input type="date" /></div>
              <div className="fitem"><span>📅</span><input type="date" /></div>
              <div className="fsearch"><span>🔍</span><input type="text" value={searchTerm} placeholder="Search name, code, dept, manager..." onChange={(e) => setSearchTerm(e.target.value)} /></div>
              <button className="clrbtn" type="button" onClick={clearFilters}>Clear ✕</button>
              <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 'auto', whiteSpace: 'nowrap'}}><strong id="f-shown" style={{ color: '#374151' }}>{countRow}</strong> / <strong style={{ color: '#374151' }}>{attendanceRows.length}</strong></span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead><tr>
                  <th style={{ width: 160 }}>Employee</th>
                  <th style={{ width: 90 }}>Department</th>
                  <th style={{ width: 90 }}>Manager</th>
                  <th style={{ width: 80 }}>Shift</th>
                  <th style={{ width: 80 }}>Check In</th>
                  <th style={{ width: 80 }}>Check Out</th>
                  <th style={{ width: 80 }}>Status</th>
                  <th style={{ width: 80 }}>State</th>
                  <th style={{ width: 110 }}>Notes</th>
                  <th style={{ width: 50 }}>Lates</th>
                  <th style={{ width: 120 }}>Actions</th>
                </tr></thead>
                <tbody>
                  {filteredSA.length === 0 ? (
                    <tr><td colSpan={11} style={{ textAlign: 'center', padding: 36, color: '#9ca3af', fontSize: 12 }}>No matching records</td></tr>
                  ) : filteredSA.map((emp) => (
                    <tr key={emp.code}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div className="av" style={{ background: ng(emp.name) }}>{ini(emp.name)}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 11, color: '#1e1b4b' }}>{emp.name}</div>
                            <span className="chip">{emp.code}</span>
                          </div>
                        </div>
                      </td>
                      <td dangerouslySetInnerHTML={{ __html: deptBadge(emp.dept) }} />
                      <td><span style={{ fontSize: 10, color: '#6b7280' }}>{emp.mgr}</span></td>
                      <td dangerouslySetInnerHTML={{ __html: shiftBadge(emp.shift) }} />
                      <td><span style={{ fontSize: 11, cursor: 'pointer', background: '#f8fafc', padding: '2px 6px', borderRadius: 5 }} title="Click to edit">🕒 {t12(emp.ci)}</span></td>
                      <td><span style={{ fontSize: 11, cursor: 'pointer', background: '#f8fafc', padding: '2px 6px', borderRadius: 5 }} title="Click to edit">🕒 {t12(emp.co)}</span></td>
                      <td dangerouslySetInnerHTML={{ __html: statusBadge(emp.status) }} />
                      <td dangerouslySetInnerHTML={{ __html: stateBadge(emp.state || 'draft') }} />
                      <td><span className="notecell" title={emp.notes}>{emp.notes || '—'}</span></td>
                      <td><button className="lbtn" type="button">{emp.lates > 0 ? <span className="lnum">{emp.lates}</span> : <span style={{ color: '#9ca3af', fontFamily: 'monospace' }}>0</span>}</button></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(emp.state === 'draft' || emp.state === 'saved') && <button className="btn btn-sm btn-primary" onClick={() => submitAttendance(emp.code)}>Submit</button>}
                          {emp.state === 'submitted' && <>
                            <button className="btn btn-sm btn-secondary" onClick={() => unlockAttendance(emp.code)}>Unlock</button>
                            <button className="btn btn-sm btn-ghost" onClick={() => requestUnlockAttendance(emp.code)}>Request Unlock</button>
                          </>}
                          {emp.state === 'unlock_requested' && <button className="btn btn-sm btn-primary" onClick={() => unlockAttendance(emp.code)}>Approve Unlock</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="foot"><span id="sa-foot">Showing {countRow} of {attendanceRows.length} employees · Click any field to edit inline</span><span id="sa-time">Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
          </div>
        </div>
      )}

      {activeTab === 'hr' && isHR && (
        <div id="hr">
          <div className="mcard" style={{ borderRadius: 14 }}>
            <div className="hrhead">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                    <div className="hrtitle">Daily Attendance</div>
                    <div className="hrsub">{formattedDate} <span style={{ background: 'rgba(255,255,255,.2)', padding: '1px 9px', borderRadius: 20, fontSize: 10 }}>{(user?.departments && user.departments[0]) || 'Department' } Department</span></div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn" style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff' }} type="button">📤 Export</button>
                  <button className="btn" style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff' }} type="button">📥 Import</button>
                  {(activeRole === 'branch_hr' || activeRole === 'department_hr') && (
                    <button
                      className="btn prim"
                      type="button"
                      onClick={() => {
                        const branchName = (user && (user as any).branch) || BRANCHES[0].name;
                        const branchObj = BRANCHES.find(b => b.name === branchName) || BRANCHES[0];
                        const branchId = branchObj.id;
                        const data = EMP_DATA[branchId] || attendanceRows.map(r => ({ name: r.name, code: r.code, dept: r.dept, shift: r.shift, ci: r.ci, co: r.co, status: r.status, note: r.notes }));

                        // mark local rows as submitted
                        setAttendanceRows(prev => prev.map(emp => ({ ...emp, state: 'submitted' })));

                        window.dispatchEvent(new CustomEvent('attendanceSheetSubmitted', {
                          detail: {
                            branchId,
                            branchName: branchObj.name,
                            date: new Date().toISOString().split('T')[0],
                            lockedBy: (user && (user as any).username) || 'Branch HR',
                            data,
                          }
                        }));

                        alert('Sheet submitted to Head HR');
                      }}
                    >
                      📨 Submit Sheet
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="hrstats">
              <div className={`hrstat ${hrStatFilter === 'Present' ? 'on' : ''}`} onClick={() => setHrStatFilter(hrStatFilter === 'Present' ? 'All' : 'Present')}>
                <div className="hrstat-icon" style={{ background: '#d1fae5', color: '#059669' }}>✅</div>
                <div className="hrstat-val" id="hv-Present">{hrCounts.present}</div>
                <div className="hrstat-lbl">Present</div>
              </div>
              <div className={`hrstat ${hrStatFilter === 'Late' ? 'on' : ''}`} onClick={() => setHrStatFilter(hrStatFilter === 'Late' ? 'All' : 'Late')}>
                <div className="hrstat-icon" style={{ background: '#fef3c7', color: '#d97706' }}>⏰</div>
                <div className="hrstat-val" id="hv-Late">{hrCounts.late}</div>
                <div className="hrstat-lbl">Late</div>
              </div>
              <div className={`hrstat ${hrStatFilter === 'Absent' ? 'on' : ''}`} onClick={() => setHrStatFilter(hrStatFilter === 'Absent' ? 'All' : 'Absent')}>
                <div className="hrstat-icon" style={{ background: '#fee2e2', color: '#dc2626' }}>❌</div>
                <div className="hrstat-val" id="hv-Absent">{hrCounts.absent}</div>
                <div className="hrstat-lbl">Absent</div>
              </div>
              <div className={`hrstat ${hrStatFilter === 'On Leave' ? 'on' : ''}`} onClick={() => setHrStatFilter(hrStatFilter === 'On Leave' ? 'All' : 'On Leave')}>
                <div className="hrstat-icon" style={{ background: '#ede9fe', color: '#7c3aed' }}>🏖️</div>
                <div className="hrstat-val" id="hv-OnLeave">{hrCounts.onLeave}</div>
                <div className="hrstat-lbl">On Leave</div>
              </div>
            </div>

            <div className="alertbar"><span className="apill">⚠️ 3 Lates = 1 Day Cut</span><span><strong id="hr-al-abs">{hrCounts.absent}</strong> Absent · <strong id="hr-al-late">{hrCounts.late}</strong> Late today</span></div>

            <div className="abar">
              <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>🔍 Search by name:</span>
              <div className="hrsearch"><span>👤</span><input type="text" id="hr-search" value={hrSearchTerm} placeholder="Type employee name..." onChange={(e) => setHrSearchTerm(e.target.value)} /></div>
              <button className="clrbtn" type="button" onClick={() => setHrSearchTerm('')}>Clear ✕</button>
              <span style={{ fontSize: 10, color: '#9ca3af', marginLeft: 'auto' }}><span id="hr-shown">{countHr}</span> of {hrEmployees.length} staff</span>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead><tr>
                  <th style={{ width: 170 }}>Employee</th>
                  <th style={{ width: 80 }}>Shift</th>
                  <th style={{ width: 85 }}>Check In</th>
                  <th style={{ width: 85 }}>Check Out</th>
                  <th style={{ width: 85 }}>Status</th>
                  <th style={{ width: 85 }}>State</th>
                  <th style={{ width: 120 }}>Notes</th>
                  <th style={{ width: 55 }}>Lates</th>
                  <th style={{ width: 120 }}>Actions</th>
                </tr></thead>
                <tbody>
                  {filteredHR.length === 0 ? (
                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 36, color: '#9ca3af', fontSize: 12 }}>No matching records</td></tr>
                  ) : filteredHR.map((emp) => (
                    <tr key={emp.code}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <div className="av" style={{ background: ng(emp.name) }}>{ini(emp.name)}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 11, color: '#1e1b4b' }}>{emp.name}</div>
                            <span className="chip">{emp.code}</span> <span style={{ fontSize: 9, color: '#9ca3af' }}>{emp.dept}</span>
                          </div>
                        </div>
                      </td>
                      <td dangerouslySetInnerHTML={{ __html: shiftBadge(emp.shift) }} />
                      <td><span style={{ fontSize: 11, cursor: 'pointer', background: '#f8fafc', padding: '2px 6px', borderRadius: 5 }}>🕒 {t12(emp.ci)}</span></td>
                      <td><span style={{ fontSize: 11, cursor: 'pointer', background: '#f8fafc', padding: '2px 6px', borderRadius: 5 }}>🕒 {t12(emp.co)}</span></td>
                      <td dangerouslySetInnerHTML={{ __html: statusBadge(emp.status) }} />
                      <td dangerouslySetInnerHTML={{ __html: stateBadge(emp.state || 'submitted') }} />
                      <td><span className="notecell" title={emp.notes}>{emp.notes || '—'}</span></td>
                      <td><button className="lbtn" type="button">{emp.lates > 0 ? <span className="lnum">{emp.lates}</span> : <span style={{ color: '#9ca3af', fontFamily: 'monospace' }}>0</span>}</button></td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {(emp.state === 'draft' || emp.state === 'saved') && <button className="btn btn-sm btn-primary" onClick={() => submitAttendance(emp.code)}>Submit</button>}
                          {emp.state === 'submitted' && <>
                            <button className="btn btn-sm btn-secondary" onClick={() => unlockAttendance(emp.code)}>Unlock</button>
                            <button className="btn btn-sm btn-ghost" onClick={() => requestUnlockAttendance(emp.code)}>Request Unlock</button>
                          </>}
                          {emp.state === 'unlock_requested' && <button className="btn btn-sm btn-primary" onClick={() => unlockAttendance(emp.code)}>Approve Unlock</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="foot"><span id="hr-foot">{countHr} of {hrEmployees.length} staff · Click any field to edit inline</span><span id="hr-time">Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
          </div>
        </div>
      )}

      {activeTab === 'emp' && isEmployee && (
        <div id="hr">
          <div className="ph">
            <div>
              <div className="ptitle">👤 My Attendance</div>
              <div className="psub">Personal attendance summary · {formattedDate}</div>
            </div>
          </div>
          <div className="mcard">
            <div className="fbar">
              <div className="fitem"><span style={{ fontWeight: 700 }}>Name</span><span style={{ marginLeft: 4 }}>{employeeRecord.name}</span></div>
              <div className="fitem"><span style={{ fontWeight: 700 }}>Department</span><span style={{ marginLeft: 4 }}>{employeeRecord.dept}</span></div>
              <div className="fitem"><span style={{ fontWeight: 700 }}>Status</span><span style={{ marginLeft: 4 }}>{employeeRecord.status}</span></div>
              <div className="fitem"><span style={{ fontWeight: 700 }}>Shift</span><span style={{ marginLeft: 4 }}>{employeeRecord.shift}</span></div>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="tbl">
                <thead><tr>
                  <th style={{ width: 170 }}>Employee</th>
                  <th style={{ width: 80 }}>Shift</th>
                  <th style={{ width: 85 }}>Check In</th>
                  <th style={{ width: 85 }}>Check Out</th>
                  <th style={{ width: 85 }}>Status</th>
                  <th style={{ width: 85 }}>State</th>
                  <th style={{ width: 120 }}>Notes</th>
                  <th style={{ width: 55 }}>Lates</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr></thead>
                <tbody>
                  <tr>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div className="av" style={{ background: ng(employeeRecord.name) }}>{ini(employeeRecord.name)}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 11, color: '#1e1b4b' }}>{employeeRecord.name}</div>
                          <span className="chip">{employeeRecord.code}</span>
                        </div>
                      </div>
                    </td>
                    <td dangerouslySetInnerHTML={{ __html: shiftBadge(employeeRecord.shift) }} />
                    <td><span style={{ fontSize: 11, background: '#f8fafc', padding: '2px 6px', borderRadius: 5 }}>🕒 {t12(employeeRecord.ci)}</span></td>
                    <td><span style={{ fontSize: 11, background: '#f8fafc', padding: '2px 6px', borderRadius: 5 }}>🕒 {t12(employeeRecord.co)}</span></td>
                    <td dangerouslySetInnerHTML={{ __html: statusBadge(employeeRecord.status) }} />
                    <td dangerouslySetInnerHTML={{ __html: stateBadge(employeeRecord.state || 'acknowledged') }} />
                    <td><span className="notecell" title={employeeRecord.notes}>{employeeRecord.notes || '—'}</span></td>
                    <td><button className="lbtn" type="button">{employeeRecord.lates > 0 ? <span className="lnum">{employeeRecord.lates}</span> : <span style={{ color: '#9ca3af', fontFamily: 'monospace' }}>0</span>}</button></td>
                    <td>
                      {(employeeRecord.state === 'submitted') && <button className="btn btn-sm btn-success" onClick={() => acknowledgeAttendance(employeeRecord.code)}>Acknowledge</button>}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="foot"><span>Your attendance view is kept simple for employee role.</span><span>Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
          </div>
        </div>
      )}

      {activeTab === 'mod' && (isSuperAdmin || isHR) && (
        <div id="mod" className="ov">
          <div className="modal">
            <div className="mhead">
              <div>
                <div className="mt">➕ Add Attendance Entry</div>
                <div className="ms">Manually record attendance for any employee</div>
              </div>
              <button className="mclose" type="button" onClick={() => setActiveTab(isSuperAdmin ? 'sa' : 'hr')}>✕</button>
            </div>
            <div className="mbody">
              <div className="fg">
                <div className="fl">Employee *</div>
                <select className="fi" value={selectedEmployeeCode} onChange={(e) => setSelectedEmployeeCode(e.target.value)}>
                  <option value="">— Select Employee —</option>
                  {EMPS.map((emp) => (
                    <option key={emp.code} value={emp.code}>{`${emp.name} · ${emp.code} · ${emp.dept}`}</option>
                  ))}
                </select>
              </div>
              {selectedEmployee && (
                <div className="prev" id="m-prev">
                  <div className="av" id="m-av" style={{ width: 36, height: 36, borderRadius: 10, background: ng(selectedEmployee.name) }}>{ini(selectedEmployee.name)}</div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#1e1b4b' }} id="m-name">{selectedEmployee.name}</div>
                    <div style={{ fontSize: 10, color: '#6b7280' }} id="m-info">{selectedEmployee.code} · {selectedEmployee.dept}</div>
                  </div>
                  <div style={{ marginLeft: 'auto' }} id="m-shift-badge" dangerouslySetInnerHTML={{ __html: shiftBadge(selectedEmployee.shift) }} />
                </div>
              )}
              <div className="fg">
                <div className="fl">Date</div>
                <input type="date" className="fi" value={modalDate} onChange={(e) => setModalDate(e.target.value)} />
              </div>
              <div className="frow">
                <div className="fg"><div className="fl">Check In</div><input type="time" className="fi" value={modalIn} onChange={(e) => setModalIn(e.target.value)} /></div>
                <div className="fg"><div className="fl">Check Out</div><input type="time" className="fi" value={modalOut} onChange={(e) => setModalOut(e.target.value)} /></div>
              </div>
              <div className="fg">
                <div className="fl">Status</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 3 }}>
                  {MODAL_STATUS.map((status) => {
                    const active = modalStatus === status;
                    const colors: Record<EmployeeStatus, [string, string, string]> = {
                      Present: ['#d1fae5', '#065f46', '#a7f3d0'],
                      Late: ['#fef3c7', '#92400e', '#fde68a'],
                      Absent: ['#fee2e2', '#991b1b', '#fecaca'],
                      'On Leave': ['#ede9fe', '#3730a3', '#c4b5fd'],
                    };
                    const [bg, color, border] = colors[status];
                    return (
                      <button
                        key={status}
                        type="button"
                        className="stog"
                        style={{ background: active ? bg : '#f9fafb', color: active ? color : '#9ca3af', borderColor: active ? border : '#e5e7eb' }}
                        onClick={() => setModalStatus(status)}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="fg">
                <div className="fl">Notes (optional)</div>
                <textarea className="fi" rows={2} placeholder="Reason, remarks..." value={modalNotes} onChange={(e) => setModalNotes(e.target.value)} />
              </div>
            </div>
            <div className="mfoot">
              <button className="btn" type="button" onClick={() => setActiveTab(isSuperAdmin ? 'sa' : 'hr')}>Cancel</button>
              <button className="btn prim" type="button" id="save-btn" onClick={saveAttendance}>{saveLabel}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const deptBadge = (dept: string) => {
  const map: Record<string, string> = {
    Sales: '#ede9fe|#4338ca',
    Accounts: '#dbeafe|#1e40af',
    IT: '#d1fae5|#065f46',
    HR: '#fef3c7|#92400e',
    Warehouse: '#fff7ed|#c2410c',
    Marketing: '#fce7f3|#9d174d',
    Operations: '#f0fdf4|#166534',
    Engineering: '#f0f9ff|#0369a1',
  };
  const [bg, color] = (map[dept] || '#f3f4f6|#6b7280').split('|');
  return `<span style="font-size:9px;background:${bg};color:${color};padding:1px 7px;border-radius:20px;font-weight:700;">${dept}</span>`;
};

const shiftBadge = (shift: ShiftType) => {
  if (shift === 'Morning') return '<span class="shift sm">Morning</span>';
  if (shift === 'Evening') return '<span class="shift se">Evening</span>';
  return '<span class="shift sn">Night</span>';
};

const statusBadge = (status: EmployeeStatus) => {
  if (status === 'Present') return '<span class="stbadge sp">Present</span>';
  if (status === 'Late') return '<span class="stbadge sl">Late</span>';
  if (status === 'Absent') return '<span class="stbadge sa2">Absent</span>';
  return '<span class="stbadge so">On Leave</span>';
};

const stateBadge = (state: string) => {
  if (state === 'draft') return '<span class="stbadge" style="background:#f3f4f6;color:#6b7280;border-color:#d1d5db;">Draft</span>';
  if (state === 'saved') return '<span class="stbadge" style="background:#dbeafe;color:#1e40af;border-color:#bfdbfe;">Saved</span>';
  if (state === 'submitted') return '<span class="stbadge" style="background:#fef3c7;color:#92400e;border-color:#fde68a;">Submitted</span>';
  if (state === 'unlock_requested') return '<span class="stbadge" style="background:#fcd34d;color:#78350f;border-color:#fbbf24;">Unlock Requested</span>';
  if (state === 'acknowledged') return '<span class="stbadge" style="background:#d1fae5;color:#065f46;border-color:#a7f3d0;">Acknowledged</span>';
  return '<span class="stbadge" style="background:#f3f4f6;color:#6b7280;border-color:#d1d5db;">Unknown</span>';
};

export default Attendance;