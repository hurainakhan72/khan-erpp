import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import { DataProvider } from "./context/DataContext";

// Layouts
import MainLayout from "./layouts/MainLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Launchpad from "./pages/Launchpad";
import Employees from "./pages/Employees";
import AddEmployee from "./pages/AddEmployee";
import EmployeeDetail from "./pages/EmployeeDetail";
import Attendance from "./pages/Attendance";
import DutyRoster from "./pages/DutyRoster";
import Leave from "./pages/Leave";
import Payroll from "./pages/Payroll";
import Promotions from "./pages/Promotions";
import Accounts from "./pages/Accounts";
import AuditLog from "./pages/AuditLog";
import BranchHRDashboard from "./pages/BranchHRDashboard";
import HeadOfficeHR from "./pages/HeadOfficeHR";
import AttendanceReport from "./pages/AttendanceReport";
import OverviewPage from "./pages/Overview";
import SavedReports from "./pages/SavedReports";
import PenaltyWorkflow from "./pages/PenaltyWorkflow";
import LeaveCapacity from "./pages/LeaveCapacity";
import AttendanceVerification from "./pages/AttendanceVerification";
import LeaveWalletHistory from "./pages/LeaveWalletHistory";
import PenaltyLedger from "./pages/PenaltyLedger";
import AnnouncementsFeed from "./pages/AnnouncementsFeed";
import Directory from "./pages/Directory";
import EmployeeWidgets from "./pages/EmployeeWidgets";
import Calendar from "./pages/Calendar";

// Employee Specific Pages
import MyDashboard from "./pages/MyDashboard";
import MyAttendance from "./pages/MyAttendance";
import MyPayslips from "./pages/MyPayslips";
import MyLeave from "./pages/MyLeave";
import MyPenalties from "./pages/MyPenalties";
import MyProfile from "./pages/MyProfile";

// Settings
import {
  DepartmentsPage,
  DesignationsPage,
  WorkModesPage,
  WorkLocationsPage,
  EmploymentTypesPage,
  JobStatusesPage,
  ReportingManagersPage,
  ShiftsPage,
  LeaveTypesPage,
  LeavePoliciesPage,
  PayrollComponentsPage,
  PenaltiesConfigPage,
  TaxConfigPage,
  GlobalDaysPage,
} from "./pages/settings/AllSettings";
import CustomFields from "./pages/settings/CustomFields";

/**
 * 1. Protected Route Wrapper
 * Checks if user is logged in.
 */
const ProtectedRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const { user, activeRole, loading } = useAuth();

  if (loading) return <div>Loading...</div>; // Ya koi professional spinner

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(activeRole)) {
    return <Navigate to={activeRole === "employee" ? "/my-dashboard" : "/dashboard"} replace />;
  }

  return <Outlet />;
};

/**
 * 2. Root Redirect Logic
 */
function RootRedirect() {
  const { user, activeRole } = useAuth();
  if (!user) return <Navigate to="/login" />;
  
  // Route based on role
  if (activeRole === "employee") {
    return <Navigate to="/my-dashboard" />;
  } else if (activeRole === "department_hr") {
    return <Navigate to="/dashboard" />; // Department HR sees filtered dashboard
  } else if (activeRole === "branch_hr") {
    return <Navigate to="/dashboard" />; // Branch HR sees filtered dashboard
  } else {
    // super_admin, head_hr
    return <Navigate to="/launchpad" />;
  }
}

const App = () => (
  <DataProvider>
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<RootRedirect />} />

            {/* --- ADMIN & HR ROUTES (MainLayout) --- */}
            <Route element={<ProtectedRoute allowedRoles={["super_admin", "head_hr", "branch_hr", "department_hr"]} />}>
              <Route element={<MainLayout />}>
                {/* Shared routes: both HR and SuperAdmin */}
                <Route path="/launchpad" element={<Launchpad />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/directory" element={<Directory />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/employees/add" element={<AddEmployee />} />
                <Route path="/employees/:id" element={<EmployeeDetail />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/duty-roster" element={<DutyRoster />} />
                <Route path="/leave" element={<Leave />} />
                <Route path="/payroll" element={<Payroll />} />
                <Route path="/promotions" element={<Promotions />} />
                <Route path="/leave-wallet" element={<LeaveWalletHistory />} />
                <Route path="/penalty-ledger" element={<PenaltyLedger />} />
                <Route path="/announcements" element={<AnnouncementsFeed />} />
                <Route path="/calendar" element={<Calendar />} />
                
                {/* HR Workflow Pages: Branch HR executes, SuperAdmin watches */}
                <Route element={<ProtectedRoute allowedRoles={["super_admin", "head_hr"]} />}>
                  <Route path="/hr/branch-dashboard" element={<BranchHRDashboard />} />
                </Route>
                <Route path="/attendance-verification" element={<AttendanceVerification />} />
                <Route path="/attendance-head-review" element={<HeadOfficeHR />} />
                <Route path="/overview" element={<OverviewPage />} />
                <Route path="/saved-reports" element={<SavedReports />} />
                <Route path="/leave-capacity" element={<LeaveCapacity />} />
                <Route path="/penalty-workflow" element={<PenaltyWorkflow />} />
                
                {/* Final Report & Oversight */}
                <Route path="/attendance-report" element={<AttendanceReport />} />
                
                {/* Configuration Pages */}
                <Route path="/settings/departments" element={<DepartmentsPage />} />
                <Route path="/settings/reporting-managers" element={<ReportingManagersPage />} />
                <Route path="/settings/designations" element={<DesignationsPage />} />
                <Route path="/settings/work-modes" element={<WorkModesPage />} />
                <Route path="/settings/work-locations" element={<WorkLocationsPage />} />
                <Route path="/settings/employment-types" element={<EmploymentTypesPage />} />
                <Route path="/settings/job-statuses" element={<JobStatusesPage />} />
                <Route path="/settings/shifts" element={<ShiftsPage />} />
                <Route path="/settings/leave-types" element={<LeaveTypesPage />} />
                <Route path="/settings/leave-policies" element={<LeavePoliciesPage />} />
                <Route path="/settings/payroll-components" element={<PayrollComponentsPage />} />
                <Route path="/settings/penalties-config" element={<PenaltiesConfigPage />} />
                <Route path="/settings/tax-config" element={<TaxConfigPage />} />
                <Route path="/settings/global-days" element={<GlobalDaysPage />} />
                
                {/* SuperAdmin + Head HR Only */}
                <Route element={<ProtectedRoute allowedRoles={["super_admin", "head_hr"]} />}>
                  <Route path="/accounts" element={<Accounts />} />
                  <Route path="/audit-log" element={<AuditLog />} />
                  <Route path="/settings/custom-fields" element={<CustomFields />} />
                </Route>
              </Route>
            </Route>

            {/* --- EMPLOYEE ROUTES (EmployeeLayout) --- */}
            <Route element={<ProtectedRoute allowedRoles={["employee"]} />}>
              <Route element={<EmployeeLayout />}>
                <Route path="/my-dashboard" element={<MyDashboard />} />
                <Route path="/my-attendance" element={<MyAttendance />} />
                <Route path="/my-payslips" element={<MyPayslips />} />
                <Route path="/my-leave" element={<MyLeave />} />
                <Route path="/my-penalties" element={<MyPenalties />} />
                <Route path="/my-profile" element={<MyProfile />} />
                <Route path="/my-widgets" element={<EmployeeWidgets />} />
                <Route path="/my-leave-wallet" element={<LeaveWalletHistory />} />
                <Route path="/my-directory" element={<Directory />} />
              </Route>
            </Route>

            {/* 404 Redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  </DataProvider>
);

export default App;