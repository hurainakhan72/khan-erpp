import fs from 'fs';

const BASE = process.env.BASE_URL || 'http://localhost:3001';
const OUT = 'sweep_result.json';

function padEmp(n){ return 'EMP' + String(n).padStart(3,'0'); }

async function login(email,password){
  const r = await fetch(`${BASE}/api/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
  const j = await r.json().catch(()=>null);
  return { status: r.status, body: j };
}
async function session(token){
  const hdr = token? { Authorization: 'Bearer '+token } : {};
  const r = await fetch(`${BASE}/api/auth/session`,{headers: hdr});
  const j = await r.json().catch(()=>null);
  return { status: r.status, body: j };
}
async function listEmployees(token){
  const hdr = token? { Authorization: 'Bearer '+token } : {};
  const started = Date.now();
  const r = await fetch(`${BASE}/api/employees?page=1&limit=1000`,{headers: hdr});
  const ms = Date.now()-started;
  const j = await r.json().catch(()=>null);
  return { status: r.status, body: j, timeMs: ms };
}
async function getEmployee(token,id){
  const hdr = token? { Authorization: 'Bearer '+token } : {};
  const started = Date.now();
  const r = await fetch(`${BASE}/api/employees/${id}`,{headers: hdr});
  const ms = Date.now()-started;
  const j = await r.json().catch(()=>null);
  return { status: r.status, body: j, timeMs: ms };
}

(async ()=>{
  console.log('Starting full sweep...');
  const summary = { total:0, errors:[], leaks:[], slow:[], entries:[] };

  // fetch a superadmin token to list employee ids
  const sLogin = await login('superadmin@esspl.com.pk','SuperAdmin@123!');
  if(!sLogin.body || !sLogin.body.data || !sLogin.body.data.token){
    console.error('Superadmin login failed', sLogin.status, sLogin.body);
    process.exit(1);
  }
  const superToken = sLogin.body.data.token;
  // Paginate as superadmin to discover all employees
  const rows = [];
  let page = 1;
  const pageSize = 100;
  while (true) {
    const r = await fetch(`${BASE}/api/employees?page=${page}&limit=${pageSize}`, { headers: { Authorization: 'Bearer ' + superToken } });
    if (!r.ok) break;
    const j = await r.json().catch(()=>null);
    const part = j?.data?.data || j?.data?.employees || j?.data || j;
    if (!Array.isArray(part) || part.length === 0) break;
    rows.push(...part);
    if (part.length < pageSize) break;
    page++;
  }
  const totalEmployees = rows.length;
  console.log('Discovered', totalEmployees, 'employees');

  for(let i=1;i<=totalEmployees;i++){
    const empId = padEmp(i);
    // find name row for this emp
    const row = rows.find(r=>r.employee_id===empId)||rows[i-1]||{};
    const name = (row.name||'').trim() || '';
    const parts = name.split(/\s+/).filter(Boolean);
    const first = (parts[0]||'').toLowerCase().replace(/[^a-z]/g,'')||'user';
    const last = (parts[parts.length-1]||'').toLowerCase().replace(/[^a-z]/g,'')||'x';
    let email;
    if(i===1) email = 'superadmin@esspl.com.pk';
    else {
      // seed uses `${fn}.${ln}`.toLowerCase().replace(/[^a-z]/g,'') + i
      const local = (first + '.' + last).toLowerCase().replace(/[^a-z]/g,'') + i;
      email = `${local}@esspl.com.pk`;
    }
    const password = (i===1) ? 'SuperAdmin@123!' : (i===4 ? 'HrManager@123!' : 'Esspl@2024!');

    summary.total++;
    try{
      const lg = await login(email,password);
      const token = lg.body && lg.body.data && lg.body.data.token ? lg.body.data.token : null;
      const sess = await session(token);
      const role = sess.body && sess.body.data && sess.body.data.role ? sess.body.data.role : (sess.body && sess.body.data && sess.body.data.role_name) || null;
      const emp_session_id = sess.body && sess.body.data && sess.body.data.employee_id;

      const list = await listEmployees(token);
      const listCount = (list.body && (list.body.data?.data || list.body.data?.employees || list.body.data) ) ? (Array.isArray(list.body.data?.data) ? list.body.data.data.length : Array.isArray(list.body.data?.employees) ? list.body.data.employees.length : Array.isArray(list.body.data) ? list.body.data.length : Array.isArray(list.body)? list.body.length : 0) : 0;

      // choose another employee to test access
      const other = rows.find(r=>r.employee_id && r.employee_id!==empId) || rows[0];
      const otherId = other.employee_id || (rows[0] && rows[0].employee_id) || null;
      let otherDetail = null;
      if(otherId){
        otherDetail = await getEmployee(token, otherId);
      }

      // inspect otherDetail.body for sensitive fields
      const hasSensitive = otherDetail && otherDetail.body && typeof otherDetail.body === 'object' && JSON.stringify(otherDetail.body).match(/cnic|bank|salary|account|basic_salary|iban|account_number|medical|emergency|personal/i);

      const entry = {
        empIndex: i, empId, email, loginStatus: lg.status, sessionStatus: sess.status, role, emp_session_id,
        listStatus: list.status, listCount, listTimeMs: list.timeMs,
        otherDetailStatus: otherDetail? otherDetail.status : null,
        otherDetailTimeMs: otherDetail? otherDetail.timeMs : null,
        otherDetailContainsSensitive: !!hasSensitive,
      };
      summary.entries.push(entry);

      if(entry.loginStatus !== 200 || entry.sessionStatus !== 200) summary.errors.push(entry);
      // privacy leak: standard employee (role contains 'employee' exactly) should not see more than 1
      if(role && role.toLowerCase().includes('employee') && !role.toLowerCase().includes('hr') && entry.listCount>1) summary.leaks.push({entry, reason:'Employee saw multiple rows'});
      if(role && role.toLowerCase().includes('employee') && otherDetail && otherDetail.status===200 && entry.otherDetailContainsSensitive) summary.leaks.push({entry, reason:'Employee could fetch sensitive fields of another employee'});

      if(list.timeMs > 2000) summary.slow.push({entry, reason:'list slow'});
      if(otherDetail && otherDetail.timeMs > 2000) summary.slow.push({entry, reason:'detail slow'});

      // small delay to avoid hammering
      await new Promise(r=>setTimeout(r, 60));
    }catch(e){
      summary.errors.push({empIndex:i, empId, email, error:String(e)});
    }
    // periodic progress log
    if(i%50===0) console.log('Progress',i,'/',totalEmployees);
  }

  fs.writeFileSync(OUT, JSON.stringify(summary,null,2));
  console.log('Sweep finished. Results written to',OUT);
  console.log('Totals — inspected:', summary.total, 'errors:', summary.errors.length, 'leaks:', summary.leaks.length, 'slow:', summary.slow.length);
})();
