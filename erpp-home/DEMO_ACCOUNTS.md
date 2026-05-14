# 📋 Demo Accounts for Role-Based Access Testing

## 🎯 Account Overview

There are **5 main demo accounts** to test different roles and access levels:

---

## 1️⃣ **SUPERADMIN** - Full Company Access
- **Username:** `superadmin`
- **Password:** `admin123`
- **Access Level:** 
  - ✅ All branches (Head Office, Branch B, Branch C)
  - ✅ All departments
  - ✅ All employees
  - ✅ Full approval & editing rights
- **Dashboard:** SuperAdmin Dashboard (Overall company view)

---

## 2️⃣ **HEAD HR** - Full Company Access (Same as SuperAdmin)
- **Username:** `head_hr`
- **Password:** `headhr123`
- **Access Level:** 
  - ✅ All branches (Head Office, Branch B, Branch C)
  - ✅ All departments
  - ✅ All employees
  - ✅ Full approval & editing rights
- **Dashboard:** SuperAdmin Dashboard (Overall company view)
- **Note:** Functionally equivalent to SuperAdmin dashboard

---

## 3️⃣ **BRANCH HR** - Branch-Level Access
- **Username:** `branch_hr_ho`
- **Password:** `branch123`
- **Branch:** Head Office
- **Access Level:**
  - ✅ Only Head Office branch data
  - ✅ All departments within Head Office (Engineering, Marketing, HR, Finance)
  - ✅ All employees in Head Office
  - ✅ Approval & editing rights for their branch
- **Dashboard:** Branch Dashboard (Head Office data only)
- **Filtered View:** See only:
  - Employees: Ahmed Ali (EMP001), Sara Khan (EMP002), Usman Malik (EMP003), etc.
  - Attendance: Only Head Office records
  - Leave: Only Head Office leave requests

---

## 4️⃣ **DEPARTMENT HR** - Department-Level Access
- **Username:** `dept_hr_eng`
- **Password:** `dept123`
- **Branch:** Head Office
- **Department:** Engineering
- **Access Level:**
  - ✅ Only Engineering department in Head Office
  - ✅ Only Engineering employees
  - ✅ Approval & editing rights for their department
- **Dashboard:** Department Dashboard (Engineering data only)
- **Filtered View:** See only:
  - Employees: Ahmed Ali (EMP001), Zahra Khan (EMP007), Muhammad Saleem (EMP016), Iqbal Ahmed (EMP025)
  - Attendance: Only Engineering department records
  - Leave: Only Engineering leave requests

---

## 5️⃣ **EMPLOYEE** - Personal Data Only
- **Username:** `emp_001`
- **Password:** `emp123`
- **Employee ID:** EMP001 (Ahmed Ali)
- **Branch:** Head Office
- **Department:** Engineering
- **Access Level:**
  - ✅ Only their own personal data
  - ✅ Their attendance records
  - ✅ Their leave requests
  - ✅ Their payslips & penalties
  - ✅ Their profile information
- **Dashboard:** Employee Dashboard (Personal data only)
- **Limited View:** See only:
  - My Attendance: Only Ahmed Ali's attendance
  - My Leave: Only Ahmed Ali's leave requests
  - My Payslips: Only Ahmed Ali's payslips
  - My Profile: Only Ahmed Ali's profile

---

## 🧪 Testing Scenarios

### Scenario 1: Compare Superadmin vs Head HR
```
Login as: superadmin (admin123)
→ Navigate to Dashboard
→ See all branches & departments data

Logout & Login as: head_hr (headhr123)
→ Navigate to Dashboard
→ Should see identical data as Superadmin
```

### Scenario 2: Test Branch HR Filtering
```
Login as: branch_hr_ho (branch123)
→ Navigate to Dashboard
→ Should only see "Head Office" branch employees
→ Should see all departments within Head Office
→ Should NOT see Branch B or Branch C employees
```

### Scenario 3: Test Department HR Filtering
```
Login as: dept_hr_eng (dept123)
→ Navigate to Dashboard
→ Should only see Engineering department employees
→ Should only see Head Office branch data
→ Employees visible: Ahmed Ali, Zahra Khan, Muhammad Saleem, Iqbal Ahmed
→ Should NOT see Sales, Marketing, or Finance data
```

### Scenario 4: Test Employee Personal Access
```
Login as: emp_001 (emp123)
→ Navigate to My Dashboard
→ Should only see Ahmed Ali's data
→ Should NOT see other employees' information
→ My Attendance: Only Ahmed Ali's records
→ My Leave: Only Ahmed Ali's requests
```

---

## 📊 Data Structure

### Branches Available:
- Head Office
- Branch B
- Branch C

### Departments:
- Engineering
- Marketing
- HR
- Sales
- Finance

### Sample Employees by Branch/Department:
| Branch | Department | Employees |
|--------|-----------|-----------|
| Head Office | Engineering | Ahmed Ali (EMP001), Zahra Khan (EMP007), Muhammad Saleem (EMP016), Iqbal Ahmed (EMP025) |
| Head Office | Marketing | Sara Khan (EMP002), Omar Khan (EMP014) |
| Head Office | HR | Usman Malik (EMP003), Ali Hassan (EMP006), Dina Ali (EMP028) |
| Head Office | Finance | Nida Malik (EMP011), Karim Hassan (EMP022) |
| Branch B | Sales | Fatima Raza (EMP004), Hassan Ali (EMP008), Aisha Ali (EMP015), Rayan Ahmed (EMP029) |
| Branch B | Finance | Bilal Ahmed (EMP005), Rashid Ahmed (EMP012), Zara Hassan (EMP026) |
| Branch B | Marketing | Amina Ahmed (EMP009), Yasmine Khan (EMP023) |
| Branch B | Engineering | Fariha Ahmed (EMP017) |
| Branch B | HR | Imran Ali (EMP020) |
| Branch C | Engineering | Tariq Khan (EMP010), Noor Ali (EMP024) |
| Branch C | Marketing | Hina Hassan (EMP013), Layla Hassan (EMP030) |
| Branch C | Sales | Saad Hassan (EMP018), Faisal Khan (EMP027) |
| Branch C | HR | Sana Ahmed (EMP021) |

---

## 🔐 Security Features

1. **Role-Based Access Control (RBAC)**
   - Each role has specific permissions
   - Data is automatically filtered based on role

2. **Branch-Level Isolation**
   - Branch HR can only access their assigned branch
   - Department HR can only access their assigned department

3. **Employee Data Privacy**
   - Employees can only see their own information
   - Personal dashboard shows only relevant data

4. **Audit Trail**
   - All actions are logged
   - Superadmin can view audit logs for compliance

---

## 🚀 How Role-Based Filtering Works

### Data Flow:
```
1. User logs in with credentials
2. AuthContext validates and stores:
   - user.role (super_admin, head_hr, branch_hr, department_hr, employee)
   - user.branch (if applicable)
   - user.departments (if applicable)

3. Components use roleBasedAccess utilities:
   - filterEmployeesByRole()
   - filterAttendanceByRole()
   - filterLeaveByRole()
   - getRoleAccessConfig()

4. Data is automatically filtered before display
```

### Example - Employees Page:
- **Superadmin:** Sees all 30 employees
- **Head HR:** Sees all 30 employees
- **Branch HR (Head Office):** Sees only Head Office employees (~15)
- **Department HR (Engineering):** Sees only Engineering employees in Head Office (~4)
- **Employee:** Sees only their own profile

---

## 📝 Notes

- All passwords are simple for demo purposes
- In production, use strong passwords and multi-factor authentication
- The `branch` field is `null` for Superadmin and Head HR (they access all branches)
- The `departments` field is `['All']` for Superadmin and Head HR

---

Last Updated: May 9, 2026
