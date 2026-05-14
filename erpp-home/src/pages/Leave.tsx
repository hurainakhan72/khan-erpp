 import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { getStatusColor } from '../services/api';
import { getVisibleEmployees } from '../utils/utils';
import { Plus, Check, X, Pencil, RotateCcw, CalendarDays, Users, Clock, ThumbsUp, ThumbsDown, AlertTriangle, Shield } from 'lucide-react';
import Modal from '../components/common/Modal';
import DecisionBanner from '../components/common/DecisionBanner';
import { useToastContext } from '../context/ToastContext';

// ─── Stat card CSS (same pattern as Promotions) ───────────────────────────────
const STAT_CSS = `
  @keyframes lv-fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
  .lv-stat-card {
    border-radius:14px; padding:16px 18px; color:#fff;
    position:relative; overflow:hidden;
    animation: lv-fadeUp .35s ease both;
  }
  .lv-stat-card::after {
    content:''; position:absolute; width:70px; height:70px;
    border-radius:50%; background:rgba(255,255,255,.08);
    bottom:-15px; right:-15px;
  }
`;

function calcDays(from: string, to: string): number {
  if (!from || !to) return 0;
  const a = new Date(from), b = new Date(to);
  if (b < a) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
}

const getInitials = (name: string) => {
  return name.split(' ').filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase();
};

export default function Leave() {
  const { leaveRequests: data, setLeaveRequests: setData, employees, leaveTypes } = useData();
  const { user, activeRole } = useAuth();
  const [tab, setTab] = useState('all');
  const { showToast } = useToastContext();
  const visibleEmployees = useMemo(() => getVisibleEmployees(user, activeRole, employees), [user, activeRole, employees]);
  const visibleEmployeeIds = useMemo(() => new Set(visibleEmployees.map((e: any) => e.id)), [visibleEmployees]);
  const getEmployeeAvatar = (id: string) => {
    const emp = visibleEmployees.find((e: any) => e.id === id);
    return emp?.avatar || getInitials(emp?.name || '');
  };
  const [newModal, setNewModal] = useState(false);
  const [editModal, setEditModal] = useState<any | null>(null);
  const [earlyModal, setEarlyModal] = useState<any | null>(null);
  const [rejectModal, setRejectModal] = useState<any | null>(null);
  const [approveModal, setApproveModal] = useState<any | null>(null);
  const [rejectComment, setRejectComment] = useState('');
  const [approvedAmount, setApprovedAmount] = useState('');
  const [saving, setSaving] = useState(false);
  const [newEmp, setNewEmp] = useState('');
  const [newType, setNewType] = useState('Annual');
  const [newFrom, setNewFrom] = useState('');
  const [newTo, setNewTo] = useState('');
  const [newReason, setNewReason] = useState('');
  const [newRequestedAmount, setNewRequestedAmount] = useState('');
  const [editType, setEditType] = useState('');
  const [editFrom, setEditFrom] = useState('');
  const [editTo, setEditTo] = useState('');
  const [editReason, setEditReason] = useState('');
  const [editRequestedAmount, setEditRequestedAmount] = useState('');
  const [earlyDate, setEarlyDate] = useState('');
  const [calDeptFilter, setCalDeptFilter] = useState('');

  // ── Leave Capacity & Policy Enforcement ───────────────────────────────
  const leaveCapacityConfig = useMemo(() => ({
    // Department-wise max % leave allowed at a time
    'IT': { maxConcurrentPercent: 30, maxDaysPerMonth: 5 },
    'HR': { maxConcurrentPercent: 25, maxDaysPerMonth: 4 },
    'Finance': { maxConcurrentPercent: 20, maxDaysPerMonth: 3 },
    'Operations': { maxConcurrentPercent: 35, maxDaysPerMonth: 6 },
    'Sales': { maxConcurrentPercent: 40, maxDaysPerMonth: 8 },
    'Marketing': { maxConcurrentPercent: 35, maxDaysPerMonth: 6 },
    'default': { maxConcurrentPercent: 25, maxDaysPerMonth: 4 }
  }), []);

  // Check for overlapping leaves
  const checkOverlap = (empId: string, fromDate: string, toDate: string, excludeId?: string): boolean => {
    const empLeaves = data.filter((l: any) =>
      l.empId === empId &&
      l.status === 'Approved' &&
      l.id !== excludeId
    );

    const newFrom = new Date(fromDate);
    const newTo = new Date(toDate);

    return empLeaves.some((leave: any) => {
      const leaveFrom = new Date(leave.from);
      const leaveTo = new Date(leave.to);

      // Check if dates overlap
      return (newFrom <= leaveTo && newTo >= leaveFrom);
    });
  };

  // Check department capacity constraints
  const checkCapacityConstraints = (empId: string, fromDate: string, toDate: string): { allowed: boolean; reason?: string } => {
    const emp = employees.find((e: any) => e.id === empId);
    if (!emp) return { allowed: false, reason: 'Employee not found' };

    const deptConfig = leaveCapacityConfig[emp.department] || leaveCapacityConfig.default;
    const requestedDays = calcDays(fromDate, toDate);

    // Check max days per month
    const fromMonth = new Date(fromDate).getMonth();
    const toMonth = new Date(toDate).getMonth();

    if (fromMonth === toMonth) {
      // Same month - check monthly limit
      const monthLeaves = data.filter((l: any) =>
        l.empId === empId &&
        l.status === 'Approved' &&
        new Date(l.from).getMonth() === fromMonth &&
        new Date(l.from).getFullYear() === new Date(fromDate).getFullYear()
      );

      const totalMonthDays = monthLeaves.reduce((sum: number, l: any) => sum + l.days, 0) + requestedDays;

      if (totalMonthDays > deptConfig.maxDaysPerMonth) {
        return {
          allowed: false,
          reason: `Exceeds department monthly limit (${deptConfig.maxDaysPerMonth} days for ${emp.department})`
        };
      }
    }

    // Check concurrent leave percentage
    const deptEmployees = employees.filter((e: any) => e.department === emp.department).length;
    const concurrentLeaves = data.filter((l: any) =>
      l.status === 'Approved' &&
      employees.find((e: any) => e.id === l.empId)?.department === emp.department &&
      checkOverlap(l.empId, fromDate, toDate)
    );

    const concurrentPercent = ((concurrentLeaves.length + 1) / deptEmployees) * 100;

    if (concurrentPercent > deptConfig.maxConcurrentPercent) {
      return {
        allowed: false,
        reason: `Exceeds department concurrent leave limit (${deptConfig.maxConcurrentPercent}% for ${emp.department})`
      };
    }

    return { allowed: true };
  };

  // Force end overlapping leaves (for urgent cases)
  const forceEndLeave = (leaveId: string, endDate: string) => {
    setData(prev => prev.map((l: any) =>
      l.id === leaveId
        ? { ...l, to: endDate, days: calcDays(l.from, endDate), status: 'Force Ended' }
        : l
    ));
    showToast('Leave force-ended successfully');
  };

  const counts = useMemo(() => ({
    total: data.filter((l: any) => visibleEmployeeIds.has(l.empId)).length,
    pending: data.filter((l: any) => visibleEmployeeIds.has(l.empId) && l.status === 'Pending').length,
    approved: data.filter((l: any) => visibleEmployeeIds.has(l.empId) && l.status === 'Approved').length,
    rejected: data.filter((l: any) => visibleEmployeeIds.has(l.empId) && l.status === 'Rejected').length,
    onLeaveToday: 2,
  }), [data, visibleEmployeeIds]);

  const visibleData = data.filter((l: any) => visibleEmployeeIds.has(l.empId));
  const filtered = tab === 'all' ? visibleData : tab === 'calendar' ? visibleData : tab === 'balances' ? visibleData : visibleData.filter((l: any) => l.status.toLowerCase() === tab);

  function handleApprove(id: string) { const req = data.find((l: any) => l.id === id); setApproveModal(req); setApprovedAmount(''); }
  function handleConfirmApprove() {
    if (!approveModal || !approvedAmount.trim()) { showToast('Please enter approved amount', 'error'); return; }
    setSaving(true);
    setTimeout(() => {
      setData(prev => prev.map((l: any) => l.id === approveModal.id ? { ...l, status: 'Approved', approvedAmount: parseFloat(approvedAmount), approvedBy: user.id } : l));
      setSaving(false);
      setApproveModal(null);
      setApprovedAmount('');
      showToast('Leave approved');
    }, 600);
  }
  function handleReject(id: string) {
    if (!rejectComment.trim()) { showToast('Please provide a reason for rejection', 'error'); return; }
    setData(prev => prev.map((l: any) => l.id === id ? { ...l, status: 'Rejected' } : l));
    showToast('Leave rejected', 'error');
    setRejectModal(null); setRejectComment('');
  }

  function openEdit(row: any) { setEditType(row.leaveType); setEditFrom(row.from); setEditTo(row.to); setEditReason(row.reason); setEditRequestedAmount(row.requestedAmount || ''); setEditModal(row); }

  function saveEdit() {
    if (!editModal) return;
    setSaving(true);
    setTimeout(() => { setData(prev => prev.map((l: any) => l.id === editModal.id ? { ...l, leaveType: editType, from: editFrom, to: editTo, days: calcDays(editFrom, editTo), reason: editReason, requestedAmount: parseFloat(editRequestedAmount) || 0 } : l)); setSaving(false); setEditModal(null); showToast('Leave request updated'); }, 600);
  }

  function openEarly(row: any) { setEarlyDate(''); setEarlyModal(row); }

  function confirmEarly() {
    if (!earlyModal || !earlyDate) return;
    setSaving(true);
    setTimeout(() => { const actualDays = calcDays(earlyModal.from, earlyDate); setData(prev => prev.map((l: any) => l.id === earlyModal.id ? { ...l, to: earlyDate, days: actualDays } : l)); setSaving(false); setEarlyModal(null); showToast('Early return recorded'); }, 600);
  }

  const newDays = calcDays(newFrom, newTo);

  function submitNew() {
    if (!newEmp || !newFrom || !newTo || !newReason || !newRequestedAmount) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    // Check for overlapping leaves
    if (checkOverlap(newEmp, newFrom, newTo)) {
      showToast('Leave dates overlap with existing approved leave', 'error');
      return;
    }

    // Check capacity constraints
    const capacityCheck = checkCapacityConstraints(newEmp, newFrom, newTo);
    if (!capacityCheck.allowed) {
      showToast(capacityCheck.reason || 'Capacity constraint violation', 'error');
      return;
    }

    setSaving(true);
    setTimeout(() => {
      const emp = employees.find((e: any) => e.id === newEmp);
      setData(prev => [{
        id: 'LR' + String(prev.length + 1).padStart(3, '0'),
        empId: newEmp,
        empName: emp?.name || '',
        leaveType: newType,
        from: newFrom,
        to: newTo,
        days: newDays,
        reason: newReason,
        requestedAmount: parseFloat(newRequestedAmount),
        appliedOn: new Date().toISOString().split('T')[0],
        status: 'Pending'
      }, ...prev]);
      setSaving(false);
      setNewModal(false);
      setNewEmp('');
      setNewType('Annual');
      setNewFrom('');
      setNewTo('');
      setNewReason('');
      setNewRequestedAmount('');
      showToast('Leave request submitted successfully');
    }, 600);
  }

  const earlyOrigDays = earlyModal ? calcDays(earlyModal.from, earlyModal.to) : 0;
  const earlyActual = earlyModal && earlyDate ? calcDays(earlyModal.from, earlyDate) : earlyOrigDays;
  const earlyRestore = earlyOrigDays - earlyActual;

  // Leave balance overview
  const empBalances = visibleEmployees.map((e: any) => {
    const empLeaves = data.filter((l: any) => visibleEmployeeIds.has(l.empId) && l.empId === e.id && l.status === 'Approved');
    const annual = empLeaves.filter((l: any) => l.leaveType === 'Annual').reduce((s: number, l: any) => s + l.days, 0);
    const casual = empLeaves.filter((l: any) => l.leaveType === 'Casual').reduce((s: number, l: any) => s + l.days, 0);
    const medical = empLeaves.filter((l: any) => l.leaveType.includes('Medical') || l.leaveType.includes('Sick')).reduce((s: number, l: any) => s + l.days, 0);
    return { id: e.id, name: e.name, dept: e.department, annual: { used: annual, total: 12 }, casual: { used: casual, total: 12 }, medical: { used: medical, total: 8 } };
  });

  // Calendar data
  const approvedLeaves = visibleData.filter((l: any) => l.status === 'Approved' && (!calDeptFilter || visibleEmployees.find((e: any) => e.id === l.empId)?.department === calDeptFilter));
  const calDays = Array.from({ length: 31 }, (_, i) => i + 1);
  const leaveColors: Record<string, string> = { Annual: 'var(--pl)', Casual: 'var(--greenl)', Sick: 'var(--redl)', Medical: 'var(--redl)' };

  // ── Stat card definitions (same shape as Promotions) ──
  const statCards = [
    {
      label: 'Total Requests',
      val: counts.total,
      sub: 'All time',
      icon: <CalendarDays size={16} color="#fff" />,
      grad: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
      glow: 'rgba(99,102,241,.3)',
    },
    {
      label: 'Pending',
      val: counts.pending,
      sub: 'Awaiting action',
      icon: <Clock size={16} color="#fff" />,
      grad: 'linear-gradient(135deg,#f97316,#fbbf24)',
      glow: 'rgba(249,115,22,.3)',
    },
    {
      label: 'Approved',
      val: counts.approved,
      sub: 'This period',
      icon: <ThumbsUp size={16} color="#fff" />,
      grad: 'linear-gradient(135deg,#10b981,#34d399)',
      glow: 'rgba(16,185,129,.3)',
    },
    {
      label: 'Rejected',
      val: counts.rejected,
      sub: 'This period',
      icon: <ThumbsDown size={16} color="#fff" />,
      grad: 'linear-gradient(135deg,#ec4899,#f43f5e)',
      glow: 'rgba(236,72,153,.3)',
    },
    {
      label: 'On Leave Today',
      val: counts.onLeaveToday,
      sub: 'Currently absent',
      icon: <Users size={16} color="#fff" />,
      grad: 'linear-gradient(135deg,#14b8a6,#06b6d4)',
      glow: 'rgba(20,184,166,.3)',
    },
  ];

  return (
    <div>
      <style>{STAT_CSS}</style>

      <div className="pg-head">
        <div><div className="pg-greet">Leave Management</div><div className="pg-sub">Manage leave requests and approvals</div></div>
        <button className="btn btn-primary" onClick={() => setNewModal(true)}><Plus size={13} /> New Leave Request</button>
      </div>

      {/* ── Gradient Stat Cards (Promotions style) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 18 }}>
        {statCards.map((c, i) => (
          <div
            key={i}
            className="lv-stat-card"
            style={{ background: c.grad, boxShadow: `0 8px 24px ${c.glow}`, animationDelay: `${i * 0.07}s` }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(255,255,255,.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
              {c.icon}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{c.val}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,.85)', marginTop: 4 }}>{c.label}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,.6)', marginTop: 2 }}>{c.sub}</div>
          </div>
        ))}
      </div>

      {/* ── Leave Capacity & Policy Overview ── */}
      <div className="card" style={{ marginBottom: 18 }}>
        <div className="ch">
          <div className="ct">
            <div className="ct-ico orange">
              <Shield size={13} />
            </div>
            Leave Capacity & Policy Enforcement
          </div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>
            Department-wise capacity limits & concurrent leave monitoring
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          {Object.entries(leaveCapacityConfig).filter(([dept]) => dept !== 'default').map(([dept, config]) => {
            const deptEmployees = employees.filter((e: any) => e.department === dept);
            const deptLeaves = data.filter((l: any) =>
              l.status === 'Approved' &&
              deptEmployees.some((e: any) => e.id === l.empId)
            );

            // Current month concurrent leaves
            const currentMonth = new Date().getMonth();
            const currentYear = new Date().getFullYear();
            const currentConcurrent = deptLeaves.filter((l: any) => {
              const leaveMonth = new Date(l.from).getMonth();
              const leaveYear = new Date(l.from).getFullYear();
              return leaveMonth === currentMonth && leaveYear === currentYear;
            }).length;

            const concurrentPercent = deptEmployees.length > 0 ? (currentConcurrent / deptEmployees.length) * 100 : 0;
            const isNearLimit = concurrentPercent >= config.maxConcurrentPercent * 0.8;

            return (
              <div key={dept} style={{
                padding: 16,
                border: `1px solid ${isNearLimit ? 'var(--redl)' : 'var(--border)'}`,
                borderRadius: 8,
                background: isNearLimit ? 'var(--redll)' : 'var(--card-bg)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 700, color: 'var(--t1)' }}>{dept}</div>
                  {isNearLimit && <AlertTriangle size={16} color="var(--red)" />}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 12 }}>
                  <div>
                    <div style={{ color: 'var(--t3)', marginBottom: 4 }}>Concurrent Leave</div>
                    <div style={{ fontWeight: 600, color: isNearLimit ? 'var(--red)' : 'var(--t1)' }}>
                      {currentConcurrent}/{deptEmployees.length} ({concurrentPercent.toFixed(1)}%)
                    </div>
                    <div style={{ color: 'var(--t3)', fontSize: 10 }}>Limit: {config.maxConcurrentPercent}%</div>
                  </div>

                  <div>
                    <div style={{ color: 'var(--t3)', marginBottom: 4 }}>Monthly Limit</div>
                    <div style={{ fontWeight: 600, color: 'var(--t1)' }}>
                      {config.maxDaysPerMonth} days
                    </div>
                    <div style={{ color: 'var(--t3)', fontSize: 10 }}>per employee</div>
                  </div>
                </div>

                {isNearLimit && (
                  <div style={{
                    marginTop: 12,
                    padding: 8,
                    background: 'var(--redll)',
                    border: '1px solid var(--redl)',
                    borderRadius: 6,
                    fontSize: 11,
                    color: 'var(--red)'
                  }}>
                    ⚠️ Approaching capacity limit - Review new requests carefully
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 16, padding: 12, background: 'var(--inp)', borderRadius: 8 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', marginBottom: 8 }}>
            Policy Enforcement Active:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 11, color: 'var(--t3)' }}>
            <span>✅ Overlap Detection</span>
            <span>✅ Capacity Constraints</span>
            <span>✅ Department Limits</span>
            <span>✅ Automatic Balance Updates</span>
            <span>✅ Force End Leave (Admin Only)</span>
          </div>
        </div>
      </div>

      <div className="tabs">
        {['all', 'pending', 'approved', 'rejected', 'calendar', 'balances'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'calendar' ? '📅 Calendar' : t === 'balances' ? '📊 Balances' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Calendar View */}
      {tab === 'calendar' && (
        <div className="card">
          <div className="ch">
            <div className="ct"><div className="ct-ico blue"><CalendarDays size={13} /></div>March 2026 — Leave Calendar</div>
            <select className="input select-input" style={{ width: 160 }} value={calDeptFilter} onChange={e => setCalDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {['Engineering', 'Marketing', 'HR', 'Sales', 'Finance'].map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center' }}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d, i) => <div key={i} style={{ fontSize: 10, fontWeight: 700, color: 'var(--t3)', padding: 6 }}>{d}</div>)}
            {calDays.map(day => {
              const dateStr = `2026-03-${String(day).padStart(2, '0')}`;
              const leaves = approvedLeaves.filter((l: any) => l.from <= dateStr && l.to >= dateStr);
              return (
                <div key={day} style={{ padding: 6, borderRadius: 6, background: leaves.length > 0 ? 'var(--pl)' : 'var(--inp)', minHeight: 50, textAlign: 'left' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t2)' }}>{day}</div>
                  {leaves.slice(0, 2).map((l: any, i: number) => (
                    <div key={i} style={{ fontSize: 8, padding: '1px 3px', borderRadius: 3, background: leaveColors[l.leaveType] || 'var(--steell)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${l.empName} - ${l.leaveType}`}>{l.empName?.split(' ')[0]}</div>
                  ))}
                  {leaves.length > 2 && <div style={{ fontSize: 7, color: 'var(--t3)', marginTop: 1 }}>+{leaves.length - 2} more</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Balance Overview */}
      {tab === 'balances' && (
        <div className="card">
          <div className="ch">
            <div className="ct"><div className="ct-ico green"><Users size={13} /></div>Leave Balance Overview</div>
            <button className="btn btn-sm btn-ghost">Export</button>
          </div>
          <table>
            <thead><tr><th>Employee</th><th>Department</th><th>Annual (used/total)</th><th>Casual (used/total)</th><th>Medical (used/total)</th></tr></thead>
            <tbody>
              {empBalances.map((e, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 600 }}>
                    <div className="table-avatar-cell">
                      <div className="table-avatar table-avatar-small">{getEmployeeAvatar(e.id)}</div>
                      <div>
                        <div>{e.name}</div>
                        <div className="mono" style={{ fontSize: 10, color: 'var(--t3)' }}>{e.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>{e.dept}</td>
                  <td className="mono"><span style={{ color: (e.annual.total - e.annual.used) < 3 ? 'var(--red)' : 'var(--t1)' }}>{e.annual.used}/{e.annual.total}</span>{(e.annual.total - e.annual.used) < 3 && <span style={{ fontSize: 9, color: 'var(--red)', marginLeft: 4 }}>⚠ Low</span>}</td>
                  <td className="mono"><span style={{ color: (e.casual.total - e.casual.used) < 3 ? 'var(--red)' : 'var(--t1)' }}>{e.casual.used}/{e.casual.total}</span></td>
                  <td className="mono"><span style={{ color: (e.medical.total - e.medical.used) < 3 ? 'var(--red)' : 'var(--t1)' }}>{e.medical.used}/{e.medical.total}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Table views */}
      {!['calendar', 'balances'].includes(tab) && (
        <div className="card">
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--t3)' }}><CalendarDays size={32} style={{ margin: '0 auto 8px', opacity: .4 }} /><div style={{ fontSize: 13 }}>No leave requests found</div></div>
          ) : (
            <table>
              <thead><tr><th>Employee</th><th>Type</th><th>From</th><th>To</th><th>Days</th><th>Reason</th><th>Requested Amount</th><th>Approved Amount</th><th>Approved By</th><th>Applied</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {filtered.map((l: any) => (
                  <tr key={l.id}>
                    <td style={{ fontWeight: 600 }}>
                      <div className="table-avatar-cell">
                        <div className="table-avatar table-avatar-small">{getEmployeeAvatar(l.empId)}</div>
                        <div>
                          <div>{l.empName}</div>
                          <div className="mono" style={{ fontSize: 10, color: 'var(--t3)' }}>{l.empId}</div>
                        </div>
                      </div>
                    </td>
                    <td>{l.leaveType}</td><td className="mono">{l.from}</td><td className="mono">{l.to}</td><td className="mono">{l.days}</td>
                    <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.reason}</td>
                    <td className="mono">{l.requestedAmount ? `$${l.requestedAmount}` : '-'}</td>
                    <td className="mono">{l.approvedAmount ? `$${l.approvedAmount}` : '-'}</td>
                    <td>{l.approvedBy ? employees.find((e: any) => e.id === l.approvedBy)?.name || l.approvedBy : '-'}</td>
                    <td className="mono">{l.appliedOn}</td>
                    <td><span className={`pill ${getStatusColor(l.status)}`}>{l.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {l.status === 'Pending' && <>
                          <button className="ico-btn" title="Approve" style={{ background: 'var(--greenl)', color: 'var(--green)', border: 'none', width: 28, height: 28 }} onClick={() => handleApprove(l.id)}><Check size={13} /></button>
                          <button className="ico-btn" title="Reject" style={{ background: 'var(--redl)', color: 'var(--red)', border: 'none', width: 28, height: 28 }} onClick={() => setRejectModal(l)}><X size={13} /></button>
                          <button className="ico-btn" title="Edit" style={{ width: 28, height: 28 }} onClick={() => openEdit(l)}><Pencil size={13} /></button>
                        </>}
                        {l.status === 'Approved' && (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="btn btn-sm btn-ghost" onClick={() => openEarly(l)}>
                              <RotateCcw size={12} /> Early Return
                            </button>
                            {activeRole === 'super_admin' && (
                              <button
                                className="btn btn-sm btn-danger"
                                onClick={() => {
                                  const endDate = prompt('Enter force end date (YYYY-MM-DD):', l.to);
                                  if (endDate && endDate !== l.to) {
                                    forceEndLeave(l.id, endDate);
                                  }
                                }}
                              >
                                <AlertTriangle size={12} /> Force End
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Reject modal with comment */}
      <Modal open={!!rejectModal} onClose={() => setRejectModal(null)} title="Reject Leave Request" footer={<><button className="btn btn-secondary" onClick={() => setRejectModal(null)}>Cancel</button><button className="btn btn-danger" onClick={() => handleReject(rejectModal?.id)}>Reject</button></>}>
        <div style={{ fontSize: 12.5, marginBottom: 12 }}><strong>{rejectModal?.empName}</strong> — {rejectModal?.leaveType} Leave ({rejectModal?.from} to {rejectModal?.to})</div>
        <div className="form-group"><label className="form-label">Reason for Rejection *</label><textarea className="input" rows={3} value={rejectComment} onChange={e => setRejectComment(e.target.value)} placeholder="Required — provide reason..." /></div>
      </Modal>

      <Modal open={newModal} onClose={() => setNewModal(false)} title="New Leave Request" footer={<><button className="btn btn-secondary" onClick={() => setNewModal(false)}>Cancel</button><button className="btn btn-primary" onClick={submitNew} disabled={saving}>{saving ? 'Submitting...' : 'Submit Request'}</button></>}>
        <div className="form-group"><label className="form-label">Employee *</label><select className="input select-input" value={newEmp} onChange={e => setNewEmp(e.target.value)}><option value="">Select employee...</option>{visibleEmployees.map((e: any) => <option key={e.id} value={e.id}>{e.name} ({e.id})</option>)}</select></div>
        <div className="form-group"><label className="form-label">Leave Type</label><select className="input select-input" value={newType} onChange={e => setNewType(e.target.value)}>{leaveTypes.filter((t: any) => t.active).map((t: any) => <option key={t.code} value={t.name.replace(' Leave', '')}>{t.name}</option>)}</select></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group"><label className="form-label">From Date *</label><input className="input" type="date" value={newFrom} onChange={e => setNewFrom(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">To Date *</label><input className="input" type="date" value={newTo} onChange={e => setNewTo(e.target.value)} /></div>
        </div>
        {newFrom && newTo && <div style={{ fontSize: 12, marginBottom: 8, color: 'var(--p)', fontWeight: 600 }}>Days Requested: <span className="mono">{newDays}</span></div>}
        {newEmp && <div style={{ fontSize: 11, color: 'var(--t3)', marginBottom: 8 }}>Remaining balance shown on approval screen</div>}
        <div className="form-group"><label className="form-label">Reason *</label><textarea className="input" rows={3} value={newReason} onChange={e => setNewReason(e.target.value)} placeholder="Enter reason for leave..." /></div>
        <div className="form-group"><label className="form-label">Requested Amount *</label><input className="input" type="number" step="0.01" value={newRequestedAmount} onChange={e => setNewRequestedAmount(e.target.value)} placeholder="Enter requested amount..." /></div>
      </Modal>

      <Modal open={!!editModal} onClose={() => setEditModal(null)} title="Edit Leave Request" footer={<><button className="btn btn-secondary" onClick={() => setEditModal(null)}>Cancel</button><button className="btn btn-primary" onClick={saveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button></>}>
        <DecisionBanner>DECISION NEEDED — HR Edit Permissions: Which fields can HR edit? Please confirm in meeting.</DecisionBanner>
        <div style={{ marginTop: 12 }} />
        <div className="form-group"><label className="form-label">Employee</label><input className="input" value={editModal?.empName || ''} disabled style={{ opacity: .7 }} /></div>
        <div className="form-group"><label className="form-label">Leave Type</label><select className="input select-input" value={editType} onChange={e => setEditType(e.target.value)}>{leaveTypes.filter((t: any) => t.active).map((t: any) => <option key={t.code} value={t.name.replace(' Leave', '')}>{t.name}</option>)}</select></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div className="form-group"><label className="form-label">From</label><input className="input" type="date" value={editFrom} onChange={e => setEditFrom(e.target.value)} /></div>
          <div className="form-group"><label className="form-label">To</label><input className="input" type="date" value={editTo} onChange={e => setEditTo(e.target.value)} /></div>
        </div>
        {editFrom && editTo && <div style={{ fontSize: 12, marginBottom: 8, color: 'var(--p)', fontWeight: 600 }}>Days: <span className="mono">{calcDays(editFrom, editTo)}</span></div>}
        <div className="form-group"><label className="form-label">Reason</label><textarea className="input" rows={3} value={editReason} onChange={e => setEditReason(e.target.value)} /></div>
        <div className="form-group"><label className="form-label">Requested Amount</label><input className="input" type="number" step="0.01" value={editRequestedAmount} onChange={e => setEditRequestedAmount(e.target.value)} /></div>
      </Modal>

      <Modal open={!!earlyModal} onClose={() => setEarlyModal(null)} title="Mark Early Return" footer={<><button className="btn btn-secondary" onClick={() => setEarlyModal(null)}>Cancel</button><button className="btn btn-primary" onClick={confirmEarly} disabled={saving || !earlyDate}>{saving ? 'Saving...' : 'Confirm Early Return'}</button></>}>
        <div style={{ background: 'var(--inp)', padding: 12, borderRadius: 'var(--rsm)', marginBottom: 12, fontSize: 12.5 }}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{earlyModal?.empName} — {earlyModal?.leaveType} Leave</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--t3)' }}>Original: {earlyModal?.from} to {earlyModal?.to} ({earlyOrigDays} days)</div>
        </div>
        <div className="form-group"><label className="form-label">Employee returned on:</label><input className="input" type="date" value={earlyDate} onChange={e => setEarlyDate(e.target.value)} min={earlyModal?.from} max={earlyModal?.to} /></div>
        {earlyDate && <div style={{ display: 'flex', gap: 20, fontSize: 12.5, padding: '8px 0' }}><div>Days Actually Taken: <strong className="mono">{earlyActual}</strong></div><div>Days to Restore: <strong className="mono" style={{ color: 'var(--green)' }}>{earlyRestore > 0 ? earlyRestore : 0}</strong></div></div>}
        <div style={{ fontSize: 11, color: 'var(--t3)', marginTop: 8 }}>The original leave approval is preserved. The early return date is recorded separately.</div>
      </Modal>

      <Modal open={!!approveModal} onClose={() => setApproveModal(null)} title="Approve Leave Request" footer={<><button className="btn btn-secondary" onClick={() => setApproveModal(null)}>Cancel</button><button className="btn btn-primary" onClick={handleConfirmApprove} disabled={saving || !approvedAmount.trim()}>{saving ? 'Approving...' : 'Approve'}</button></>} >
        <div style={{ background: 'var(--inp)', padding: 12, borderRadius: 'var(--rsm)', marginBottom: 12, fontSize: 12.5 }}>
          <div style={{ fontWeight: 600, marginBottom: 2 }}>{approveModal?.empName} — {approveModal?.leaveType} Leave</div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--t3)' }}>From: {approveModal?.from} to {approveModal?.to} ({approveModal?.days} days)</div>
          <div style={{ fontSize: 11, color: 'var(--t3)' }}>Requested Amount: ${approveModal?.requestedAmount || 0}</div>
        </div>
        <div className="form-group"><label className="form-label">Approved Amount *</label><input className="input" type="number" step="0.01" value={approvedAmount} onChange={e => setApprovedAmount(e.target.value)} placeholder="Enter approved amount..." /></div>
      </Modal>
    </div>
  );
}

