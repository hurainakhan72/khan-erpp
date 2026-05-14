import fs from 'fs';
import path from 'path';
import { chromium } from 'playwright';

const ROOT = path.resolve(process.cwd(), '..');
const EMP_FILE = path.join(ROOT, 'EMS-backend', 'employees_full.json');
const OUT_JSON = path.join(ROOT, 'EMS-backend', 'sweep_browser_result.json');
const OUT_CSV = path.join(ROOT, 'EMS-backend', 'sweep_browser_report.csv');

function makeEmail(name, idx){
  if(idx===1) return 'superadmin@esspl.com.pk';
  const parts = (name||'').split(/\s+/).filter(Boolean);
  const fn = parts[0] || 'user';
  const ln = parts[parts.length-1] || 'user';
  const local = (fn + '.' + ln).toLowerCase().replace(/[^a-z]/g,'') + idx;
  return `${local}@esspl.com.pk`;
}

async function run(){
  const argv = Object.fromEntries(process.argv.slice(2).map(s=>{ const [k,v]=s.split('='); return [k.replace(/^--/,'') , v===undefined?true:v]; }));
  const delay = parseInt(argv.delay||argv.d||'150',10);
  const headless = argv.headless===undefined ? true : String(argv.headless) !== 'false' && argv.headless !== '0';

  const raw = fs.readFileSync(EMP_FILE, 'utf8');
  const employees = JSON.parse(raw);
  const accounts = employees.map((e, i)=>{
    const idx = i+1;
    const email = makeEmail(e.name, idx);
    const password = idx===1 ? 'SuperAdmin@123!' : (idx===4||idx===5) ? 'HrManager@123!' : 'Esspl@2024!';
    return { empId: e.employee_id, name: e.name, email, password };
  });

  let browser;
  try{
    browser = await chromium.launch({ headless });
  }catch(e){
    console.warn('standard chromium.launch failed, retrying with channel chrome:', String(e));
    browser = await chromium.launch({ channel: 'chrome', headless });
  }
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];
  for(const [idx, acct] of accounts.entries()){
    try{
      await context.clearCookies();
      await page.goto('http://localhost:8081/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.evaluate(()=>{ localStorage.clear(); sessionStorage.clear(); });
      // fill login - resilient selectors
      const emailSel = 'input[placeholder="you@company.com"]';
      const passSel = 'input[placeholder="Enter password"]';
      if(await page.$(emailSel)){
        await page.fill(emailSel, acct.email).catch(()=>{});
        await page.fill(passSel, acct.password).catch(()=>{});
      } else {
        const inputs = await page.$$('input'); if(inputs.length>=2){ await inputs[0].fill(acct.email).catch(()=>{}); await inputs[1].fill(acct.password).catch(()=>{}); }
      }
      const btn = await page.$('button:has-text("Sign In")') || await page.$('button:has-text("Sign in")') || await page.$('button[type=submit]');
      if(btn) await btn.click().catch(()=>{});
      await page.waitForTimeout(Math.max(500, delay));

      // session via API
      let session = null;
      try{ session = await page.evaluate(async ()=>{ try{ const r=await fetch('/api/auth/session'); return await r.json(); }catch(e){ return { error: String(e) } } }); }catch(e){ session = { error: String(e) } }
      const loginOk = !!(session && (session.data || session.user || session.role || session.email));

      await page.goto('http://localhost:8081/employees', { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(()=>{});
      await page.waitForTimeout(400);
      const info = await page.evaluate(()=>{
        const table = document.querySelector('table');
        const rowCount = table ? (table.querySelectorAll('tbody tr')||[]).length : 0;
        const editVisible = !!(Array.from(document.querySelectorAll('button, a')).some(b=>/edit/i.test(b.textContent||'')));
        const deleteVisible = !!(Array.from(document.querySelectorAll('button, a')).some(b=>/delete/i.test(b.textContent||'')));
        return { rowCount, editVisible, deleteVisible };
      });

      results.push({ index: idx+1, empId: acct.empId, email: acct.email, name: acct.name, password: acct.password, loginOk, session, employeesVisible: info.rowCount, editVisible: info.editVisible, deleteVisible: info.deleteVisible, timestamp: new Date().toISOString() });
      await page.waitForTimeout(delay);
    }catch(err){ results.push({ index: idx+1, empId: acct.empId, email: acct.email, name: acct.name, error: String(err), timestamp: new Date().toISOString() }); }
  }

  await browser.close();

  const summary = {
    summary: 'complete',
    discovered_employees: accounts.length,
    runAt: new Date().toISOString(),
    resultsCount: results.length,
    successes: results.filter(r=>r.loginOk).length,
    failures: results.filter(r=>!r.loginOk).length,
    browserChecks: results,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(summary, null, 2));

  const csvLines = ['index,email,empId,name,loginOk,employeesVisible,editVisible,deleteVisible,error'];
  for(const r of results){
    const err = r.error ? r.error.replace(/\n/g,' ').replace(/"/g,'') : '';
    csvLines.push(`${r.index},${r.email},${r.empId},"${(r.name||'').replace(/"/g,'')}",${!!r.loginOk},${r.employeesVisible||0},${!!r.editVisible},${!!r.deleteVisible},"${err}"`);
  }
  fs.writeFileSync(OUT_CSV, csvLines.join('\n'));
  console.log('UI sweep finished. Results:', OUT_JSON, OUT_CSV);
}

run().catch(e=>{ console.error(e); process.exit(1); });
