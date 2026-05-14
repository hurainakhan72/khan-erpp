import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { formatPKR } from '../services/api';
import { Check, Lock, Upload, FileText, X, ChevronLeft, ChevronRight, UserPlus } from 'lucide-react';
import DecisionBanner from '../components/common/DecisionBanner';
import { useToastContext } from '../context/ToastContext';

// ─── Attractive CSS matching Dashboard aesthetic ──────────────────────────────
const S = `
  *{box-sizing:border-box;}
  @keyframes up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
  @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
  @keyframes slideR{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}
  @keyframes slideL{from{opacity:0;transform:translateX(-24px)}to{opacity:1;transform:translateX(0)}}

  .add-pg{font-family:'Segoe UI',system-ui,-apple-system,sans-serif;padding:22px 28px;background:#f0f2f8;min-height:100vh;}

  /* Header */
  .add-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:20px;flex-wrap:wrap;gap:12px;}
  .add-title{margin:0;font-size:27px;font-weight:800;color:#1e1b4b;line-height:1.15;}
  .add-sub{margin:4px 0 0;font-size:11px;color:#9ca3af;}

  /* Cards */
  .add-card{background:#fff;border-radius:16px;padding:20px 22px;box-shadow:0 1px 10px rgba(0,0,0,.07);animation:up .4s ease both;}
  .add-card-body{background:#fff;border-radius:16px;padding:24px 26px;box-shadow:0 1px 10px rgba(0,0,0,.07);min-height:300px;}

  /* Stepper */
  .step-track{display:flex;align-items:center;justify-content:center;gap:0;}
  .step-node{display:flex;flex-direction:column;align-items:center;min-width:62px;}
  .step-circle{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;transition:all .3s;}
  .step-circle.done{background:linear-gradient(135deg,#10b981,#059669);color:#fff;box-shadow:0 3px 10px rgba(16,185,129,.35);}
  .step-circle.active{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;box-shadow:0 3px 12px rgba(99,102,241,.4);}
  .step-circle.idle{background:#f1f5f9;color:#9ca3af;border:1.5px solid #e5e7eb;}
  .step-label{font-size:9px;margin-top:5px;font-weight:600;text-align:center;transition:color .3s;}
  .step-label.active{color:#6366f1;}
  .step-label.done{color:#10b981;}
  .step-label.idle{color:#9ca3af;}
  .step-line{flex:1;height:2px;margin:0 -4px;margin-bottom:18px;border-radius:2px;transition:background .4s;}
  .step-line.done{background:linear-gradient(90deg,#10b981,#6366f1);}
  .step-line.idle{background:#e5e7eb;}

  /* Progress bar */
  .add-progress-track{height:4px;background:#f1f5f9;border-radius:4px;overflow:hidden;margin-top:14px;}
  .add-progress-fill{height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6,#10b981);border-radius:4px;transition:width .5s cubic-bezier(.4,0,.2,1);}

  /* Form elements */
  .add-form-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:14px;}
  .add-form-row-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:14px;margin-bottom:14px;}
  .add-form-group{display:flex;flex-direction:column;}
  .add-label{font-size:11px;font-weight:700;color:#374151;margin-bottom:5px;letter-spacing:.02em;}
  .add-label span{color:#ef4444;}
  .add-input{height:38px;border:1.5px solid #e5e7eb;border-radius:10px;padding:0 12px;font-size:12px;color:#1e1b4b;outline:none;transition:border .15s,box-shadow .15s;background:#fafafa;font-family:inherit;}
  .add-input:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.12);background:#fff;}
  .add-input:disabled{background:#f8f9fb;color:#9ca3af;cursor:not-allowed;}
  .add-input.mono{font-family:'SF Mono',Consolas,monospace;font-size:11.5px;}
  .add-input.error{border-color:#ef4444;box-shadow:0 0 0 3px rgba(239,68,68,.1);}
  .add-textarea{border:1.5px solid #e5e7eb;border-radius:10px;padding:10px 12px;font-size:12px;color:#1e1b4b;outline:none;resize:vertical;transition:border .15s,box-shadow .15s;background:#fafafa;font-family:inherit;min-height:64px;}
  .add-textarea:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.12);background:#fff;}
  .add-textarea:disabled{background:#f8f9fb;color:#9ca3af;}
  .add-select{height:38px;border:1.5px solid #e5e7eb;border-radius:10px;padding:0 12px;font-size:12px;color:#1e1b4b;outline:none;background:#fafafa;cursor:pointer;transition:border .15s,box-shadow .15s;font-family:inherit;appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center;}
  .add-select:focus{border-color:#6366f1;box-shadow:0 0 0 3px rgba(99,102,241,.12);background-color:#fff;}
  .add-err{color:#ef4444;font-size:10px;margin-top:3px;}

  /* Step content animation */
  .step-slide-r{animation:slideR .3s ease both;}
  .step-slide-l{animation:slideL .3s ease both;}

  /* Section title inside form */
  .form-sec-head{display:flex;align-items:center;gap:7px;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid #f1f5f9;}
  .form-sec-title{font-size:13px;font-weight:700;color:#1e1b4b;}
  .form-sec-badge{padding:2px 9px;border-radius:20px;font-size:9px;font-weight:700;}

  /* Salary table */
  .sal-table{width:100%;border-collapse:collapse;border-radius:12px;overflow:hidden;border:1px solid #f1f5f9;}
  .sal-table thead tr{background:linear-gradient(135deg,#f8f9ff,#f3f4f6);}
  .sal-table th{padding:10px 14px;text-align:left;font-size:10px;font-weight:700;color:#6b7280;letter-spacing:.04em;text-transform:uppercase;}
  .sal-table td{padding:9px 14px;border-bottom:1px solid #f8f9fb;font-size:12px;color:#374151;vertical-align:middle;}
  .sal-table tbody tr:hover{background:#f5f7ff;}
  .sal-table tbody tr:last-child td{border-bottom:none;}
  .sal-total-box{background:linear-gradient(135deg,#eff6ff,#f5f3ff);border:1px solid #c7d2fe;border-radius:12px;padding:14px 18px;margin-top:12px;display:flex;justify-content:space-between;align-items:center;}
  .sal-total-label{font-size:13px;font-weight:700;color:#1e1b4b;}
  .sal-total-val{font-size:20px;font-weight:800;color:#6366f1;font-family:'SF Mono',Consolas,monospace;}

  /* Attachment row */
  .att-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid #f1f5f9;}
  .att-pill-green{background:#dcfce7;color:#166534;padding:3px 9px;border-radius:20px;font-size:9px;font-weight:700;}
  .att-pill-amber{background:#fef3c7;color:#d97706;padding:3px 9px;border-radius:20px;font-size:9px;font-weight:700;}
  .att-btn{height:28px;padding:0 12px;border:1px solid #e5e7eb;border-radius:8px;background:#fff;font-size:11px;color:#6366f1;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:4px;transition:all .12s;}
  .att-btn:hover{background:#eff6ff;border-color:#c7d2fe;}

  /* Account toggle */
  .acc-toggle{display:flex;gap:0;background:#f8f9fb;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;margin-bottom:18px;}
  .acc-toggle button{flex:1;padding:11px;border:none;cursor:pointer;font-weight:700;font-size:12px;transition:all .25s;}
  .acc-toggle .active{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;box-shadow:0 3px 10px rgba(99,102,241,.3);}
  .acc-toggle .idle{background:transparent;color:#6b7280;}

  /* Summary box */
  .summary-box{background:linear-gradient(135deg,#f8f9ff,#f5f3ff);border:1px solid #c7d2fe;border-radius:12px;padding:14px 16px;margin-top:16px;font-size:12px;color:#374151;line-height:1.7;}

  /* Checkbox / radio */
  .add-check-label{display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;color:#374151;}
  .add-radio-group{display:flex;gap:14px;margin-top:7px;}
  .add-radio-label{font-size:12.5px;cursor:pointer;display:flex;align-items:center;gap:4px;color:#374151;}

  /* Footer nav */
  .add-footer{display:flex;align-items:center;justify-content:space-between;margin-top:14px;padding:12px 0;}
  .add-cancel-btn{height:38px;padding:0 18px;border:1.5px solid #e5e7eb;border-radius:10px;background:#fff;font-size:12px;font-weight:600;color:#6b7280;cursor:pointer;display:flex;align-items:center;gap:6px;transition:all .15s;}
  .add-cancel-btn:hover{border-color:#6366f1;color:#6366f1;background:#f5f3ff;}
  .add-back-btn{height:38px;padding:0 18px;border:1.5px solid #e5e7eb;border-radius:10px;background:#fff;font-size:12px;font-weight:600;color:#374151;cursor:pointer;display:flex;align-items:center;gap:5px;transition:all .15s;}
  .add-back-btn:hover{border-color:#6366f1;color:#6366f1;}
  .add-next-btn{height:38px;padding:0 22px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border:none;border-radius:10px;color:#fff;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(99,102,241,.35);transition:opacity .15s,transform .15s;}
  .add-next-btn:hover{opacity:.9;transform:translateY(-1px);}
  .add-next-btn:disabled{opacity:.55;cursor:default;transform:none;}
  .add-save-btn{height:38px;padding:0 24px;background:linear-gradient(135deg,#10b981,#059669);border:none;border-radius:10px;color:#fff;font-size:12px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 4px 12px rgba(16,185,129,.35);transition:opacity .15s,transform .15s;}
  .add-save-btn:hover{opacity:.9;transform:translateY(-1px);}
  .add-save-btn:disabled{opacity:.55;cursor:default;transform:none;}

  /* Readonly field */
  .add-input-readonly{background:linear-gradient(135deg,#f8f9fb,#f3f4f6)!important;color:#9ca3af!important;}

  /* Step footer info */
  .step-info{font-size:12px;color:#9ca3af;font-weight:500;}
`;

const STEPS = ['Employee Info', 'Extra Info', 'Bank', 'Medical', 'Job Info', 'User Creation'];

const STEP_COLORS = [
  '#6366f1','#ec4899','#f97316','#14b8a6','#10b981','#a855f7','#06b6d4','#8b5cf6'
];

export default function AddEmployee() {
  const navigate = useNavigate();
  const { showToast } = useToastContext();
  const { departments, designations, employmentTypes, jobStatuses, workModes, workLocations, shifts, reportingManagers, addEmployee } = useData();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [direction, setDirection] = useState<'left' | 'right'>('right');
  const [animating, setAnimating] = useState(false);

  // ── All logic identical to original ──────────────────────────────────────────
  const handleNumberChange = (val: string, setter: (v: string) => void) => {
    const digits = val.replace(/\D/g, '');
    if (digits.length <= 11) setter(digits);
  };
  const handleTextChange = (val: string, setter: (v: string) => void) => {
    const letters = val.replace(/[^a-zA-Z\s]/g, '');
    setter(letters);
  };

  const [fullName, setFullName] = useState('');
  const [employeeIdInput, setEmployeeIdInput] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [cnic, setCnic] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Male');
  const [contact1, setContact1] = useState('');
  const [contact2, setContact2] = useState('');
  const [ice1, setIce1] = useState('');
  const [ice2, setIce2] = useState('');
  const [permAddress, setPermAddress] = useState('');
  const [postAddress, setPostAddress] = useState('');
  const [sameAddress, setSameAddress] = useState(false);
  const [bankName, setBankName] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Online Transfer');
  const [dept, setDept] = useState(departments[0] || '');
  const [desig, setDesig] = useState(designations[0] || '');
  const [empType, setEmpType] = useState(employmentTypes[0] || '');
  const [jobStat, setJobStat] = useState(jobStatuses[0] || '');
  const [wMode, setWMode] = useState(workModes[0] || '');
  const [wLoc, setWLoc] = useState(workLocations[0] || '');
  const [rm, setRm] = useState(reportingManagers[0] || '');
  const [shift, setShift] = useState(shifts[0]?.name || '');
  const [doj, setDoj] = useState('');
  const [doe, setDoe] = useState('');
  const [probationEndDate, setProbationEndDate] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');
  const [commissionEligible, setCommissionEligible] = useState(false);
  const [salBasic, setSalBasic] = useState(0);
  const [salHouse, setSalHouse] = useState(0);
  const [salMedical, setSalMedical] = useState(0);
  const [salConveyance, setSalConveyance] = useState(0);
  const [salCommission, setSalCommission] = useState(0);
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [chronic, setChronic] = useState('');
  const [medications, setMedications] = useState('');
  const [accountMethod, setAccountMethod] = useState<'A' | 'B'>('A');
  const [username, setUsername] = useState('');
  const [tempPassword, setTempPassword] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedShift = shifts.find((s: any) => s.name === shift);
  const totalSalary = salBasic + salHouse + salMedical + salConveyance + (commissionEligible ? salCommission : 0);

  const formatCnic = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 13);
    if (digits.length <= 5) return digits;
    if (digits.length <= 12) return digits.slice(0, 5) + '-' + digits.slice(5);
    return digits.slice(0, 5) + '-' + digits.slice(5, 12) + '-' + digits.slice(12);
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 0) { if (!fullName.trim()) e.fullName = 'Required'; if (!cnic.trim()) e.cnic = 'Required'; }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const goNext = () => { if (!validate()) return; if (step < STEPS.length - 1) { setDirection('right'); setAnimating(true); setTimeout(() => { setStep(step + 1); setAnimating(false); }, 300); } };
  const goBack = () => { if (step > 0) { setDirection('left'); setAnimating(true); setTimeout(() => { setStep(step - 1); setAnimating(false); }, 300); } };

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      addEmployee({
        // Use a stable UUID for internal id and keep `employee_id` for human-readable short id
        id: (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : 'EMP' + String(Date.now()).slice(-3),
        employee_id: employeeIdInput || 'EMP' + String(Date.now()).slice(-3),
        name: fullName, fatherName, dob, cnic, gender, department: dept, designation: desig,
        employmentType: empType, jobStatus: jobStat, workMode: wMode, workLocation: wLoc,
        shift, reportingManager: rm, dateOfJoining: doj, dateOfExit: doe || undefined,
        probation_end_date: probationEndDate || undefined,
        contract_end_date: contractEndDate || undefined,
        contact1, contact2, emergency1: ice1, emergency2: ice2,
        permanentAddress: permAddress, postalAddress: sameAddress ? permAddress : postAddress,
        bankName, bankAccount, paymentMode, bloodGroup, allergies, chronicConditions: chronic,
        medications, avatar: fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
        commissionEligible,
        salary: { basic: salBasic, houseRent: salHouse, medical: salMedical, conveyance: salConveyance, commission: commissionEligible ? salCommission : 0 },
        // metadata timestamps
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      setSaving(false); showToast('Employee saved successfully'); navigate('/employees');
    }, 800);
  };

  // ── Step colors for section badge ──
  const stepColor = STEP_COLORS[step];

  // ── renderStep (restructured to match backend 6-step workflow) ─────────────────
  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div className={direction === 'right' ? 'step-slide-r' : 'step-slide-l'}>
          <div className="form-sec-head">
            <span style={{ fontSize: 18 }}>👤</span>
            <span className="form-sec-title">Employee Information</span>
            <span className="form-sec-badge" style={{ background: '#eff6ff', color: '#6366f1', marginLeft: 'auto' }}>Step 1 of 6</span>
          </div>
          <div className="add-form-row-3">
            <div className="add-form-group">
              <label className="add-label">Employee ID</label>
              <div style={{ position: 'relative' }}>
                <input className="add-input mono add-input-readonly" value="EMP006" disabled />
                <Lock size={12} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
              </div>
            </div>
            <div className="add-form-group">
              <label className="add-label">Full Name <span>*</span></label>
              <input className={`add-input${errors.fullName ? ' error' : ''}`} placeholder="Enter full name" value={fullName} onChange={e => setFullName(e.target.value)} />
              {errors.fullName && <div className="add-err">{errors.fullName}</div>}
            </div>
            <div className="add-form-group">
              <label className="add-label">Father Name</label>
              <input className="add-input" value={fatherName} onChange={e => setFatherName(e.target.value)} />
            </div>
          </div>
          <div className="add-form-row-3">
            <div className="add-form-group">
              <label className="add-label">CNIC <span>*</span></label>
              <input className={`add-input mono${errors.cnic ? ' error' : ''}`} placeholder="00000-0000000-0" value={cnic} onChange={e => setCnic(formatCnic(e.target.value))} />
              {errors.cnic && <div className="add-err">{errors.cnic}</div>}
            </div>
            <div className="add-form-group">
              <label className="add-label">Date of Birth</label>
              <input className="add-input" type="date" value={dob} onChange={e => setDob(e.target.value)} />
            </div>
            <div className="add-form-group">
              <label className="add-label">Gender</label>
              <select className="add-select" value={gender} onChange={e => setGender(e.target.value)}>
                <option>Male</option><option>Female</option>
              </select>
            </div>
          </div>
        </div>
      );

      case 1: return (
        <div className={direction === 'right' ? 'step-slide-r' : 'step-slide-l'}>
          <div className="form-sec-head">
            <span style={{ fontSize: 18 }}>📞</span>
            <span className="form-sec-title">Extra Information</span>
            <span className="form-sec-badge" style={{ background: '#fdf2f8', color: '#db2777', marginLeft: 'auto' }}>Step 2 of 6</span>
          </div>
          <div className="add-form-row">
            <div className="add-form-group"><label className="add-label">Contact 1 *</label><input className="add-input" value={contact1} onChange={e => handleNumberChange(e.target.value, setContact1)} /></div>
            <div className="add-form-group"><label className="add-label">Contact 2</label><input className="add-input" value={contact2} onChange={e => handleNumberChange(e.target.value, setContact2)} /></div>
          </div>
          <div className="add-form-row">
            <div className="add-form-group"><label className="add-label">ICE 1</label><input className="add-input" value={ice1} onChange={e => handleNumberChange(e.target.value, setIce1)} /></div>
            <div className="add-form-group"><label className="add-label">ICE 2</label><input className="add-input" value={ice2} onChange={e => handleNumberChange(e.target.value, setIce2)} /></div>
          </div>
          <div className="add-form-group" style={{ marginBottom: 10 }}>
            <label className="add-label">Permanent Address</label>
            <textarea className="add-textarea" rows={2} value={permAddress} onChange={e => setPermAddress(e.target.value)} />
          </div>
          <label className="add-check-label" style={{ marginBottom: 10 }}>
            <input type="checkbox" checked={sameAddress} onChange={e => { setSameAddress(e.target.checked); if (e.target.checked) setPostAddress(permAddress); }} />
            Same as permanent address
          </label>
          <div className="add-form-group">
            <label className="add-label">Postal Address</label>
            <textarea className="add-textarea" rows={2} value={sameAddress ? permAddress : postAddress} onChange={e => setPostAddress(e.target.value)} disabled={sameAddress} />
          </div>
        </div>
      );

      case 2: return (
        <div className={direction === 'right' ? 'step-slide-r' : 'step-slide-l'}>
          <div className="form-sec-head">
            <span style={{ fontSize: 18 }}>🏦</span>
            <span className="form-sec-title">Bank Details</span>
            <span className="form-sec-badge" style={{ background: '#fff7ed', color: '#c2410c', marginLeft: 'auto' }}>Step 3 of 6</span>
          </div>
          <div className="add-form-row">
            <div className="add-form-group">
              <label className="add-label">Bank Name</label>
              <input className="add-input" placeholder="e.g. HBL, Alfalah" value={bankName} onChange={e => handleTextChange(e.target.value, setBankName)} />
            </div>
            <div className="add-form-group">
              <label className="add-label">Account Number</label>
              <input className="add-input mono" placeholder="Numbers only" value={bankAccount} onChange={e => handleNumberChange(e.target.value, setBankAccount)} />
            </div>
          </div>
          <div className="add-form-group">
            <label className="add-label">Payment Mode</label>
            <select className="add-select" value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
              <option>Cash</option><option>Online Transfer</option><option>Cheque</option>
            </select>
          </div>
        </div>
      );

      case 3: return (
        <div className={direction === 'right' ? 'step-slide-r' : 'step-slide-l'}>
          <div className="form-sec-head">
            <span style={{ fontSize: 18 }}>🩺</span>
            <span className="form-sec-title">Medical Information</span>
            <span className="form-sec-badge" style={{ background: '#fdf4ff', color: '#a21caf', marginLeft: 'auto' }}>Step 4 of 6</span>
          </div>
          <div className="add-form-row">
            <div className="add-form-group">
              <label className="add-label">Blood Group</label>
              <select className="add-select" value={bloodGroup} onChange={e => setBloodGroup(e.target.value)}>
                <option value="">Select</option>
                {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="add-form-group">
              <label className="add-label">Allergies</label>
              <textarea className="add-textarea" rows={2} placeholder="No numbers allowed" value={allergies} onChange={e => handleTextChange(e.target.value, setAllergies)} />
            </div>
          </div>
          <div className="add-form-row">
            <div className="add-form-group">
              <label className="add-label">Chronic Conditions</label>
              <textarea className="add-textarea" rows={2} placeholder="No numbers allowed" value={chronic} onChange={e => handleTextChange(e.target.value, setChronic)} />
            </div>
            <div className="add-form-group">
              <label className="add-label">Medications</label>
              <textarea className="add-textarea" rows={2} placeholder="No numbers allowed" value={medications} onChange={e => handleTextChange(e.target.value, setMedications)} />
            </div>
          </div>
        </div>
      );

      case 4: return (
        <div className={direction === 'right' ? 'step-slide-r' : 'step-slide-l'}>
          <div className="form-sec-head">
            <span style={{ fontSize: 18 }}>💼</span>
            <span className="form-sec-title">Job Information</span>
            <span className="form-sec-badge" style={{ background: '#f0fdf4', color: '#15803d', marginLeft: 'auto' }}>Step 5 of 6</span>
          </div>
          <div className="add-form-row-3">
            <div className="add-form-group"><label className="add-label">Department *</label><select className="add-select" value={dept} onChange={e => setDept(e.target.value)}>{departments.map((d: string) => <option key={d}>{d}</option>)}</select></div>
            <div className="add-form-group"><label className="add-label">Designation *</label><select className="add-select" value={desig} onChange={e => setDesig(e.target.value)}>{designations.map((d: string) => <option key={d}>{d}</option>)}</select></div>
            <div className="add-form-group"><label className="add-label">Employment Type</label><select className="add-select" value={empType} onChange={e => setEmpType(e.target.value)}>{employmentTypes.map((d: string) => <option key={d}>{d}</option>)}</select></div>
          </div>
          <div className="add-form-row-3">
            <div className="add-form-group"><label className="add-label">Job Status</label><select className="add-select" value={jobStat} onChange={e => setJobStat(e.target.value)}>{jobStatuses.map((d: string) => <option key={d}>{d}</option>)}</select></div>
            <div className="add-form-group"><label className="add-label">Work Location *</label><select className="add-select" value={wLoc} onChange={e => setWLoc(e.target.value)}>{workLocations.map((d: string) => <option key={d}>{d}</option>)}</select></div>
            <div className="add-form-group"><label className="add-label">Work Mode</label><select className="add-select" value={wMode} onChange={e => setWMode(e.target.value)}>{workModes.map((d: string) => <option key={d}>{d}</option>)}</select></div>
          </div>
          <div className="add-form-row-3">
            <div className="add-form-group"><label className="add-label">Reporting Manager *</label><select className="add-select" value={rm} onChange={e => setRm(e.target.value)}>{reportingManagers.map((d: string) => <option key={d}>{d}</option>)}</select></div>
            <div className="add-form-group"><label className="add-label">Shift *</label><select className="add-select" value={shift} onChange={e => setShift(e.target.value)}>{shifts.map((s: any) => <option key={s.name}>{s.name}</option>)}</select></div>
            <div className="add-form-group"><label className="add-label">Timing</label><input className="add-input mono add-input-readonly" value={selectedShift ? `${selectedShift.start} – ${selectedShift.end} PKT` : ''} readOnly /></div>
          </div>
          <div className="add-form-row-3">
            <div className="add-form-group"><label className="add-label">Date of Joining *</label><input className="add-input" type="date" value={doj} onChange={e => setDoj(e.target.value)} /></div>
            <div className="add-form-group"><label className="add-label">Date of Exit</label><input className="add-input" type="date" value={doe} onChange={e => setDoe(e.target.value)} /></div>
            <div className="add-form-group">
              <label className="add-label">Commission Eligible</label>
              <div className="add-radio-group">
                <label className="add-radio-label"><input type="radio" checked={commissionEligible} onChange={() => setCommissionEligible(true)} /> Yes</label>
                <label className="add-radio-label"><input type="radio" checked={!commissionEligible} onChange={() => setCommissionEligible(false)} /> No</label>
              </div>
            </div>
          </div>

          {/* Salary Structure Section */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b', marginBottom: 16 }}>💰 Salary Structure</div>
            <div style={{ fontSize: 11, color: '#9ca3af', marginBottom: 12 }}>Salary components are configurable from Settings → Payroll Components</div>
            <table className="sal-table">
              <thead><tr><th>Component</th><th>Monthly Amount (PKR)</th><th>Include</th></tr></thead>
              <tbody>
                <tr><td>Basic Salary</td><td><input className="add-input mono" type="number" value={salBasic || ''} onChange={e => setSalBasic(+e.target.value)} style={{ width: 160 }} /></td><td><input type="checkbox" defaultChecked /></td></tr>
                <tr><td>House Rent</td><td><input className="add-input mono" type="number" value={salHouse || ''} onChange={e => setSalHouse(+e.target.value)} style={{ width: 160 }} /></td><td><input type="checkbox" defaultChecked /></td></tr>
                <tr><td>Medical</td><td><input className="add-input mono" type="number" value={salMedical || ''} onChange={e => setSalMedical(+e.target.value)} style={{ width: 160 }} /></td><td><input type="checkbox" defaultChecked /></td></tr>
                <tr><td>Conveyance</td><td><input className="add-input mono" type="number" value={salConveyance || ''} onChange={e => setSalConveyance(+e.target.value)} style={{ width: 160 }} /></td><td><input type="checkbox" defaultChecked /></td></tr>
                {commissionEligible && <tr><td>Commission</td><td><input className="add-input mono" type="number" value={salCommission || ''} onChange={e => setSalCommission(+e.target.value)} style={{ width: 160 }} /></td><td><input type="checkbox" defaultChecked /></td></tr>}
              </tbody>
            </table>
            <div className="sal-total-box">
              <span className="sal-total-label">Total Monthly Package</span>
              <span className="sal-total-val">{formatPKR(totalSalary)}</span>
            </div>
          </div>
        </div>
      );

      case 5: return (
        <div className={direction === 'right' ? 'step-slide-r' : 'step-slide-l'}>
          <div className="form-sec-head">
            <span style={{ fontSize: 18 }}>🔐</span>
            <span className="form-sec-title">User Creation</span>
            <span className="form-sec-badge" style={{ background: '#f5f3ff', color: '#7c3aed', marginLeft: 'auto' }}>Step 6 of 6</span>
          </div>
          <div className="acc-toggle">
            <button className={accountMethod === 'A' ? 'active' : 'idle'} onClick={() => setAccountMethod('A')}>HR Creates Credentials</button>
            <button className={accountMethod === 'B' ? 'active' : 'idle'} onClick={() => setAccountMethod('B')}>Send Invite Link</button>
          </div>
          {accountMethod === 'A' ? (
            <div>
              <div className="add-form-group" style={{ marginBottom: 14 }}>
                <label className="add-label">Username</label>
                <input className="add-input" value={username || fullName.toLowerCase().replace(/\s+/g, '.')} onChange={e => setUsername(e.target.value)} />
              </div>
              <div className="add-form-group">
                <label className="add-label">Temporary Password</label>
                <input className="add-input" type="password" value={tempPassword} onChange={e => setTempPassword(e.target.value)} />
              </div>
            </div>
          ) : (
            <div>
              <div className="add-form-group" style={{ marginBottom: 10 }}>
                <label className="add-label">Employee Email</label>
                <input className="add-input" type="email" value={empEmail} onChange={e => setEmpEmail(e.target.value)} />
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af' }}>Employee will receive a link and set their own password.</div>
            </div>
          )}

          {/* Attachments Section */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #f1f5f9' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#1e1b4b', marginBottom: 16 }}>📎 Required Attachments</div>
            <input type="file" id="file-upload" style={{ display: 'none' }} onChange={(e) => alert('File Selected: ' + e.target.files?.[0].name)} />
            {[
              { label: 'CNIC Copy', status: 'uploaded', file: 'cnic_scan.pdf' },
              { label: 'Profile Photo', status: 'uploaded', file: 'photo.jpg' },
              { label: 'Employment Contract', status: 'missing' },
            ].map((att, i) => (
              <div key={i} className="att-row">
                <FileText size={16} color="#9ca3af" />
                <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1e1b4b' }}>{att.label}</span>
                {att.status === 'uploaded' ? (
                  <>
                    <span className="att-pill-green">✓ Uploaded — {att.file}</span>
                    <button className="att-btn" onClick={() => window.open('#', '_blank')}>View</button>
                  </>
                ) : (
                  <>
                    <span className="att-pill-amber">⚠ Missing</span>
                    <button className="att-btn" onClick={() => document.getElementById('file-upload')?.click()}>
                      <Upload size={11} /> Upload
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          {fullName && (
            <div className="summary-box">
              <strong style={{ color: '#1e1b4b' }}>{fullName}</strong>
              <span style={{ color: '#6b7280' }}> · {dept} · {desig} · {shift}</span><br />
              <span style={{ color: '#6366f1', fontWeight: 700 }}>Total Package: {formatPKR(totalSalary)}/month</span>
              {doj && <span style={{ color: '#9ca3af' }}> · Joining: {doj}</span>}
            </div>
          )}
        </div>
      );

      default: return null;
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{S}</style>
      <div className="add-pg">

        {/* ══ HEADER ══════════════════════════════════════════════════════════ */}
        <div className="add-head">
          <div>
            <p style={{ margin: 0, fontSize: 12, color: '#9ca3af' }}>Employees</p>
            <h1 className="add-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <UserPlus size={24} color="#6366f1" />
              Add Employee
            </h1>
            <p className="add-sub">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
          </div>
        </div>

        {/* ══ STEPPER CARD ════════════════════════════════════════════════════ */}
        <div className="add-card" style={{ marginBottom: 14 }}>
          <div className="step-track">
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <div className="step-node">
                  <div className={`step-circle ${i < step ? 'done' : i === step ? 'active' : 'idle'}`}>
                    {i < step ? <Check size={13} /> : i + 1}
                  </div>
                  <div className={`step-label ${i < step ? 'done' : i === step ? 'active' : 'idle'}`}>{s}</div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`step-line ${i < step ? 'done' : 'idle'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="add-progress-track">
            <div className="add-progress-fill" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
          </div>
        </div>

        {/* ══ STEP CONTENT CARD ═══════════════════════════════════════════════ */}
        <div className="add-card-body">
          {renderStep()}
        </div>

        {/* ══ FOOTER NAV ══════════════════════════════════════════════════════ */}
        <div className="add-footer">
          <button className="add-cancel-btn" onClick={() => navigate('/employees')}>
            <X size={13} /> Cancel
          </button>
          <span className="step-info">Step {step + 1} of {STEPS.length} — {STEPS[step]}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            {step > 0 && (
              <button className="add-back-btn" onClick={goBack}>
                <ChevronLeft size={13} /> Back
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button className="add-next-btn" onClick={goNext}>
                Next <ChevronRight size={13} />
              </button>
            ) : (
              <button className="add-save-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : <><Check size={13} /> Save Employee</>}
              </button>
            )}
          </div>
        </div>

      </div>
    </>
  );
}