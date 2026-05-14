import React, { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard, Users, CalendarCheck, CalendarDays, DollarSign, TrendingUp,
  Settings, Building2, Briefcase, Monitor, MapPin, UserCheck, ClipboardList,
  Clock, CalendarRange, Wallet, AlertTriangle, FormInput, ShieldCheck, Bell,
  ScrollText, LogOut, ChevronDown, ChevronRight, Zap
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { useToastContext } from '../../context/ToastContext';
import logo from '../../images/logo.png';

type SidebarLink = {
  to: string;
  icon: React.ComponentType<any>;
  label: string;
  badge?: string;
  comingSoon?: boolean;
};

export default function Sidebar() {
  const { user, activeRole, logout } = useAuth();
  const { allAttendanceToday, leaveRequests } = useData();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const location = useLocation();
  const isSettingsActive = location.pathname.startsWith('/settings');

  const getUserInitials = (name = '') => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return '';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const initials = getUserInitials(user?.username || '');

  const superAdminLinks: SidebarLink[] = [
    { to: '/launchpad', icon: Zap, label: 'Launchpad', comingSoon: true },
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/hr/branch-dashboard', icon: Building2, label: 'Branch HR Dashboard' },
    { to: '/overview', icon: Monitor, label: 'Overview', comingSoon: true },
    { to: '/saved-reports', icon: ScrollText, label: 'Saved Reports', comingSoon: true },
    { to: '/attendance-head-review', icon: ShieldCheck, label: 'Head HR Review' },
    { to: '/attendance-report', icon: ClipboardList, label: 'Final Attendance Report' },
    { to: '/directory', icon: MapPin, label: 'Directory' },
    { to: '/employees', icon: Users, label: 'Employees' },
    { to: '/attendance', icon: CalendarCheck, label: 'Attendance', badge: '3' },
    { to: '/leave', icon: CalendarDays, label: 'Leave', badge: '3' },
    { to: '/payroll', icon: DollarSign, label: 'Payroll' },
    { to: '/leave-wallet', icon: Wallet, label: 'Leave Wallet' },
    { to: '/penalty-ledger', icon: ClipboardList, label: 'Penalty Ledger' },
    { to: '/announcements', icon: Zap, label: 'Announcements' },
    { to: '/calendar', icon: CalendarRange, label: 'Calendar Events', comingSoon: true },
    { to: '/accounts', icon: ShieldCheck, label: 'HR Accounts' },
    { to: '/audit-log', icon: ScrollText, label: 'Audit Log' },
  ];

  // Head HR - Same as Superadmin (Full Company Access)
  const headHrLinks: SidebarLink[] = superAdminLinks;

  // Branch HR - Branch level access (no branch-dashboard link here)
  const branchHrLinks: SidebarLink[] = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/directory', icon: MapPin, label: 'Directory' },
    { to: '/employees', icon: Users, label: 'Employees' },
    { to: '/attendance', icon: CalendarCheck, label: 'Attendance', badge: '3' },
    { to: '/leave', icon: CalendarDays, label: 'Leave', badge: '3' },
    { to: '/payroll', icon: DollarSign, label: 'Payroll' },
    { to: '/leave-wallet', icon: Wallet, label: 'Leave Wallet' },
    { to: '/penalty-ledger', icon: ClipboardList, label: 'Penalty Ledger' },
    { to: '/announcements', icon: Zap, label: 'Announcements' },
  ];

  // Department HR - Department level access
  const departmentHrLinks: SidebarLink[] = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/directory', icon: MapPin, label: 'Directory' },
    { to: '/employees', icon: Users, label: 'Employees' },
    { to: '/attendance', icon: CalendarCheck, label: 'Attendance', badge: '3' },
    { to: '/leave', icon: CalendarDays, label: 'Leave', badge: '3' },
    { to: '/payroll', icon: DollarSign, label: 'Payroll' },
    { to: '/leave-wallet', icon: Wallet, label: 'Leave Wallet' },
    { to: '/penalty-ledger', icon: ClipboardList, label: 'Penalty Ledger' },
  ];

  // Select menu based on role
  const mainLinks = 
    activeRole === 'super_admin' ? superAdminLinks :
    activeRole === 'head_hr' ? headHrLinks :
    activeRole === 'branch_hr' ? branchHrLinks :
    activeRole === 'department_hr' ? departmentHrLinks :
    [];

  const { showToast } = useToastContext();

  const settingsLinks = [
    { to: '/settings/departments', label: 'Departments' },
    { to: '/settings/designations', label: 'Designations' },
    { to: '/settings/job-statuses', label: 'Job Statuses' },
    { to: '/settings/reporting-managers', label: 'Reporting Mgrs' },
    { to: '/settings/work-modes', label: 'Work Modes' },
    { to: '/settings/work-locations', label: 'Work Locations' },
    { to: '/settings/employment-types', label: 'Emp. Types' },
    { to: '/settings/shifts', label: 'Shifts' },
    { to: '/settings/leave-types', label: 'Leave Types' },
    { to: '/settings/leave-policies', label: 'Leave Policies' },
    { to: '/settings/payroll-components', label: 'Salary Components' },
    { to: '/settings/penalties-config', label: 'Penalties Config' },
    { to: '/settings/tax-config', label: 'Tax Config' },
    { to: '/settings/global-days', label: 'Global Days' },
  ];

  const adminLinks = [
    { to: '/accounts', icon: ShieldCheck, label: 'HR Accounts' },
    { to: '/audit-log', icon: ScrollText, label: 'Audit Log' },
    { to: '/settings/custom-fields', icon: FormInput, label: 'Custom Fields' },
  ];

  const liveAttendance = useMemo(() => {
    const total = allAttendanceToday.length || 1;
    const present = allAttendanceToday.filter((row: any) => row.status === 'Present').length;
    return Math.round((present / total) * 100);
  }, [allAttendanceToday]);

  const pendingLeave = leaveRequests.filter((row: any) => row.status === 'Pending').length;

  return (
    <div className="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-row">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img src={logo} alt="Company Logo" className="sb-logo-img" />
            <div>
              <div className="sb-title">EMS</div>
              <div className="sb-subtitle">Employee Management</div>
            </div>
          </div>
        </div>
        {/* Prototype wala pura section yahan se remove kar diya gaya hai */}
      </div>

      <div className="sb-sec">
        <div className="sb-lbl">Core Modules</div>
        {mainLinks.map(link => (
          link.comingSoon ? (
            <div key={link.to} className={`nav-a`} onClick={() => showToast('Coming soon', 'error')} style={{ cursor: 'pointer' }}>
              <link.icon size={14} className="nav-ico" />
              {link.label}
              {link.badge && <span className="nav-badge">{link.badge}</span>}
            </div>
          ) : (
            <NavLink key={link.to} to={link.to} className={({ isActive }) => `nav-a ${isActive ? 'active' : ''}`}>
              <link.icon size={14} className="nav-ico" />
              {link.label}
              {link.badge && <span className="nav-badge">{link.badge}</span>}
            </NavLink>
          )
        ))}
      </div>

      <div className="sb-div" />
      <div className="sb-sec">
        <div className="sb-lbl">Live Status</div>
        <div className="card" style={{ padding: 12, borderRadius: 14, marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--t2)', marginBottom: 7 }}>
            <div className="sb-env-dot" style={{ background: liveAttendance >= 50 ? 'var(--greens)' : 'var(--amber)', boxShadow: '0 6px 14px rgba(15,23,42,.08)' }} />
            <Clock size={13} />
            Attendance Live
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--t1)' }}>{liveAttendance}%</div>
          <div style={{ fontSize: 10, color: 'var(--t3)' }}>Present ratio for today</div>
        </div>
        <div className="card" style={{ padding: 12, borderRadius: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--t2)', marginBottom: 7 }}>
            <div className="sb-env-dot" style={{ background: pendingLeave > 0 ? 'var(--red)' : undefined, boxShadow: pendingLeave > 0 ? '0 6px 14px rgba(239,68,68,.12)' : undefined }} />
            <Bell size={13} />
            Notifications
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--t1)' }}>{pendingLeave}</div>
          <div style={{ fontSize: 10, color: 'var(--t3)' }}>Pending leave requests</div>
        </div>
      </div>

      {(activeRole === 'super_admin' || activeRole === 'head_hr') && (
        <>
          <div className="sb-div" />
          <div className="sb-sec">
            <button
              className="collapsible-toggle"
              onClick={() => setSettingsOpen(!settingsOpen)}
              style={{ color: isSettingsActive ? '#90caf9' : 'var(--sb-lbl)' }}
            >
              {settingsOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
              System Configuration
            </button>
            {settingsOpen && (
              <>
                {settingsLinks.map(link => (
                  <NavLink key={link.to} to={link.to} className={({ isActive }) => `nav-a ${isActive ? 'active' : ''}`}>
                    <Settings size={14} className="nav-ico" />
                    {link.label}
                  </NavLink>
                ))}
                {activeRole === 'super_admin' && (
                  <NavLink to="/settings/custom-fields" className={({ isActive }) => `nav-a ${isActive ? 'active' : ''}`}>
                    <FormInput size={14} className="nav-ico" />
                    Custom Fields
                  </NavLink>
                )}
              </>
            )}
          </div>
        </>
      )}

      {activeRole === 'super_admin' && (
        <>
          <div className="sb-div" />
          <div className="sb-sec">
            {adminLinks.map(link => (
              <NavLink key={link.to} to={link.to} className={({ isActive }) => `nav-a ${isActive ? 'active' : ''}`}>
                <link.icon size={14} className="nav-ico" />
                {link.label}
              </NavLink>
            ))}
          </div>
        </>
      )}

      {/* Workflow Role UI removed per request */}

      <div className="sb-bottom">
        <div className="sb-user">
          <div className="sb-chip" onClick={logout}>
            <div className="sb-av">{initials}</div>
            <div>
              <div className="sb-un">{user?.username}</div>
              <div className="sb-ur">{activeRole}</div>
            </div>
            <LogOut size={14} style={{ marginLeft: 'auto', color: 'rgba(15,23,42,.5)' }} />
          </div>
        </div>
      </div>
    </div>
  );
}



















