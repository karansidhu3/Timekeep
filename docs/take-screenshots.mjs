// Run: node docs/take-screenshots.mjs
// Requires: npx playwright install chromium (one-time)
// Prereq: npm run dev must be running at localhost:3000

import { chromium } from 'playwright'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = __dirname

const MOBILE = { width: 375, height: 812, deviceScaleFactor: 2 }
const DESKTOP = { width: 1280, height: 900, deviceScaleFactor: 2 }

// Inject mock HTML into a live app page so compiled Tailwind CSS applies.
async function injectAndShot(page, html, outputPath, viewport = MOBILE) {
  await page.setViewportSize(viewport)
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
  await page.evaluate((h) => {
    document.documentElement.style.background = '#faf9f7'
    document.body.innerHTML = h
  }, html)
  await page.waitForTimeout(120)
  await page.screenshot({ path: outputPath, fullPage: false })
  console.log('✓', path.basename(outputPath))
}

// ── HTML templates ─────────────────────────────────────────────────────────────

const BOTTOM_NAV = (active = 'today') => `
  <nav class="fixed bottom-0 inset-x-0 bg-white border-t border-stone-100">
    <div class="flex" style="padding-bottom:20px">
      <a class="flex-1 flex flex-col items-center gap-1 py-3 ${active === 'today' ? 'text-stone-900' : 'text-stone-400'}">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="${active === 'today' ? 2 : 1.5}">
          <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
        </svg>
        <span class="text-xs font-medium">Today</span>
      </a>
      <a class="flex-1 flex flex-col items-center gap-1 py-3 ${active === 'schedule' ? 'text-stone-900' : 'text-stone-400'}">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="${active === 'schedule' ? 2 : 1.5}">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
        </svg>
        <span class="text-xs font-medium">Schedule</span>
      </a>
      <a class="flex-1 flex flex-col items-center gap-1 py-3 text-stone-400">
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
        </svg>
        <span class="text-xs font-medium">Sign out</span>
      </a>
    </div>
  </nav>
`

const DASHBOARD_HTML = `
<div class="min-h-screen bg-[#faf9f7]" style="padding-bottom:4.5rem">
  <div class="max-w-lg mx-auto px-4 pb-6" style="padding-top:max(2.5rem,1.5rem)">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-semibold text-stone-900">Hi, Karan</h1>
        <p class="text-sm text-stone-400">Thursday, June 5</p>
      </div>
    </div>
    <div class="space-y-3">
      <div class="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
        <p class="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Today's shift</p>
        <p class="text-stone-900 font-semibold text-3xl leading-none tracking-tight">9:00 AM</p>
        <p class="text-stone-400 font-medium text-xl leading-none tracking-tight mt-1.5">until 5:00 PM</p>
        <p class="text-sm text-stone-400 mt-3">8h 0m</p>
      </div>
      <button class="inline-flex items-center justify-center gap-2 rounded-xl font-medium bg-stone-900 text-white px-4 py-2.5 text-sm w-full" style="min-height:44px">
        Clock in
      </button>
    </div>
  </div>
  ${BOTTOM_NAV('today')}
</div>
`

const CLOCKED_IN_HTML = `
<div class="min-h-screen bg-[#faf9f7]" style="padding-bottom:4.5rem">
  <div class="max-w-lg mx-auto px-4 pb-6" style="padding-top:max(2.5rem,1.5rem)">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-xl font-semibold text-stone-900">Hi, Karan</h1>
        <p class="text-sm text-stone-400">Thursday, June 5</p>
      </div>
    </div>
    <div class="space-y-3">
      <div class="bg-white rounded-2xl border border-stone-200 shadow-sm p-5">
        <p class="text-xs font-semibold text-stone-400 uppercase tracking-widest mb-3">Today's shift</p>
        <p class="text-stone-900 font-semibold text-3xl leading-none tracking-tight">9:00 AM</p>
        <p class="text-stone-400 font-medium text-xl leading-none tracking-tight mt-1.5">until 5:00 PM</p>
        <p class="text-sm text-stone-400 mt-3">8h 0m</p>
      </div>
      <div class="space-y-3">
        <div class="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-green-800">Clocked in</p>
            <p class="text-xs text-green-600 mt-0.5">2h 14m elapsed</p>
          </div>
          <div class="w-2.5 h-2.5 rounded-full bg-green-500"></div>
        </div>
        <button class="inline-flex items-center justify-center gap-2 rounded-xl font-medium bg-stone-100 text-stone-800 px-4 py-2.5 text-sm w-full" style="min-height:44px">
          Clock out
        </button>
      </div>
    </div>
  </div>
  ${BOTTOM_NAV('today')}
</div>
`

const SCHEDULE_HTML = `
<div class="min-h-screen bg-[#faf9f7]" style="padding-bottom:4.5rem">
  <div class="max-w-lg mx-auto px-4 pb-6" style="padding-top:max(2.5rem,1.5rem)">
    <div class="flex items-center justify-between mb-1">
      <h1 class="text-xl font-semibold text-stone-900">Schedule</h1>
      <div class="flex items-center gap-1">
        <button class="w-10 h-10 flex items-center justify-center rounded-xl text-stone-500">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        </button>
        <button class="w-10 h-10 flex items-center justify-center rounded-xl text-stone-500">
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
    <p class="text-sm text-stone-400 mb-6">Jun 2 – Jun 8</p>
    <div class="divide-y divide-stone-100">
      ${[
        { day: 'Mon', date: 'Jun 2', shift: '9:00 AM – 5:00 PM', dur: '8h 0m', today: false },
        { day: 'Tue', date: 'Jun 3', shift: '9:00 AM – 5:00 PM', dur: '8h 0m', today: false },
        { day: 'Wed', date: 'Jun 4', shift: '9:00 AM – 5:00 PM', dur: '8h 0m', today: false },
        { day: 'Thu', date: 'Jun 5', shift: '9:00 AM – 5:00 PM', dur: '8h 0m', today: true },
        { day: 'Fri', date: 'Jun 6', shift: null, dur: null, today: false },
        { day: 'Sat', date: 'Jun 7', shift: null, dur: null, today: false },
        { day: 'Sun', date: 'Jun 8', shift: null, dur: null, today: false },
      ].map(({ day, date, shift, dur, today }) => `
        <div class="flex gap-4 py-4 ${today ? 'bg-white -mx-4 px-4 rounded-xl' : ''}">
          <div class="w-14 flex-shrink-0 pt-0.5">
            <p class="text-xs font-bold uppercase tracking-wide ${today ? 'text-stone-900' : 'text-stone-400'}">${day}</p>
            <p class="text-sm mt-0.5 ${today ? 'text-stone-600 font-medium' : 'text-stone-400'}">${date}</p>
            ${today ? '<p class="text-[10px] font-semibold text-stone-900 uppercase tracking-wide mt-0.5">Today</p>' : ''}
          </div>
          <div class="flex-1 min-w-0 pt-0.5">
            ${shift ? `
              <div>
                <p class="text-sm font-semibold ${today ? 'text-stone-900' : 'text-stone-700'}">${shift}</p>
                <p class="text-xs text-stone-400 mt-0.5">${dur}</p>
              </div>
            ` : `<p class="text-sm text-stone-400">Off</p>`}
          </div>
        </div>
      `).join('')}
    </div>
  </div>
  ${BOTTOM_NAV('schedule')}
</div>
`

const ADMIN_SCHEDULE_HTML = `
<div class="min-h-screen bg-[#faf9f7] flex">
  <!-- Sidebar -->
  <aside class="flex flex-col fixed top-0 left-0 h-full w-56 bg-white border-r border-stone-200 py-6 px-3">
    <a class="px-3 mb-8 block">
      <span class="text-base font-semibold text-stone-900 tracking-tight">Timekeep</span>
      <span class="block text-xs text-stone-400 font-medium">Admin</span>
    </a>
    <nav class="flex-1 space-y-0.5">
      ${[
        { label: 'Dashboard', active: false },
        { label: 'Schedule', active: true },
        { label: 'Templates', active: false },
        { label: 'Employees', active: false },
        { label: 'Time entries', active: false },
      ].map(({ label, active }) => `
        <a class="block px-3 py-2 rounded-lg text-sm font-medium ${active ? 'bg-stone-100 text-stone-900' : 'text-stone-500'}">${label}</a>
      `).join('')}
    </nav>
    <div class="pt-4 border-t border-stone-100">
      <button class="w-full text-left px-3 py-2 text-sm text-stone-400 rounded-lg">Sign out</button>
    </div>
  </aside>
  <!-- Main -->
  <main class="flex-1 min-w-0 ml-56">
    <div class="max-w-4xl mx-auto px-6 pb-10" style="padding-top:max(2.5rem,1.5rem)">
      <div class="mb-8">
        <div class="flex items-center justify-between mb-1">
          <h1 class="text-2xl font-semibold text-stone-900">Schedule</h1>
          <button class="inline-flex items-center justify-center gap-2 rounded-xl font-medium bg-stone-100 text-stone-800 px-3 py-2.5 text-sm" style="min-height:44px">+ New shift</button>
        </div>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <p class="text-sm text-stone-400">Jun 2 – Jun 8</p>
            <a class="text-xs text-stone-400">Templates →</a>
          </div>
          <div class="flex items-center gap-1">
            <button class="w-10 h-10 flex items-center justify-center rounded-xl text-stone-500">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
            </button>
            <button class="w-10 h-10 flex items-center justify-center rounded-xl text-stone-500">
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div class="space-y-4">
        ${[
          { label: 'Monday, Jun 2', today: false, shifts: [{ name: 'Karan', time: '9:00 AM – 5:00 PM' }, { name: 'Randeep', time: '12:00 PM – 8:00 PM' }] },
          { label: 'Tuesday, Jun 3', today: false, shifts: [{ name: 'Karan', time: '9:00 AM – 5:00 PM' }] },
          { label: 'Wednesday, Jun 4', today: false, shifts: [{ name: 'Randeep', time: '9:00 AM – 5:00 PM' }] },
          { label: 'Thursday, Jun 5', today: true, shifts: [{ name: 'Karan', time: '9:00 AM – 5:00 PM' }, { name: 'Randeep', time: '10:00 AM – 6:00 PM' }] },
          { label: 'Friday, Jun 6', today: false, shifts: [] },
        ].map(({ label, today, shifts }) => `
          <div>
            <p class="text-xs font-semibold uppercase tracking-wide mb-2 ${today ? 'text-stone-900' : 'text-stone-400'}">${label}${today ? ' · Today' : ''}</p>
            ${shifts.length === 0
              ? `<p class="text-sm text-stone-400 pl-1 mb-4">No shifts</p>`
              : `<div class="space-y-2 mb-4">
                  ${shifts.map(s => `
                    <div class="bg-white rounded-2xl border border-stone-200 shadow-sm p-4 flex items-center justify-between">
                      <div>
                        <p class="text-sm font-medium text-stone-900">${s.name}</p>
                        <p class="text-xs text-stone-500 mt-0.5">${s.time}</p>
                      </div>
                      <a class="text-sm text-stone-400 px-3 py-3 rounded-xl flex items-center" style="min-height:44px">Edit</a>
                    </div>
                  `).join('')}
                </div>`
            }
          </div>
        `).join('')}
      </div>
    </div>
  </main>
</div>
`

const MODAL_HTML = `
<div class="min-h-screen bg-[#faf9f7]">
  <!-- Page behind modal (blurred/dimmed) -->
  <div style="position:fixed;inset:0;background:rgba(0,0,0,0.3);display:flex;align-items:flex-end;justify-content:center;z-index:50">
    <div style="background:white;border-radius:16px 16px 0 0;width:100%;padding:24px;padding-bottom:max(2rem,20px);box-shadow:0 -4px 40px rgba(0,0,0,0.12)">
      <!-- drag handle -->
      <div class="w-10 h-1 bg-stone-200 rounded-full mx-auto mb-5"></div>
      <h2 class="text-base font-semibold text-stone-900 mb-5">New shift</h2>
      <div class="space-y-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-stone-700">Employee</label>
          <select class="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm bg-white text-stone-900" style="min-height:44px">
            <option>Select employee…</option>
            <option selected>Karan</option>
            <option>Randeep</option>
          </select>
        </div>
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-stone-700">Date</label>
          <input type="text" value="2025-06-05" class="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm bg-white text-stone-900" style="min-height:44px" readonly />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-stone-700">Start time</label>
            <select class="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm bg-white text-stone-900" style="min-height:44px">
              <option>9:00 AM</option>
            </select>
          </div>
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-stone-700">End time</label>
            <select class="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm bg-white text-stone-900" style="min-height:44px">
              <option>5:00 PM</option>
            </select>
          </div>
        </div>
        <div class="flex gap-2 pt-1">
          <button class="flex-1 inline-flex items-center justify-center rounded-xl font-medium bg-stone-100 text-stone-800 px-4 py-2.5 text-sm" style="min-height:44px">Cancel</button>
          <button class="flex-1 inline-flex items-center justify-center rounded-xl font-medium bg-stone-900 text-white px-4 py-2.5 text-sm" style="min-height:44px">Create shift</button>
        </div>
      </div>
    </div>
  </div>
</div>
`

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ ...MOBILE })
  const page = await ctx.newPage()

  // 1. Login — name picker (real page)
  await page.setViewportSize(MOBILE)
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' })
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/screen-login-names.png` })
  console.log('✓ screen-login-names.png')

  // 2. Login — PIN keypad (click first employee name)
  const firstEmployee = page.locator('button').first()
  await firstEmployee.click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${OUT}/screen-login-pin.png` })
  console.log('✓ screen-login-pin.png')

  // 3. Dashboard (clock-in ready)
  await injectAndShot(page, DASHBOARD_HTML, `${OUT}/screen-dashboard.png`)

  // 4. Hero — clocked-in state (more content, more interesting for hero)
  await injectAndShot(page, CLOCKED_IN_HTML, `${OUT}/hero.png`)

  // 5. Employee schedule
  await injectAndShot(page, SCHEDULE_HTML, `${OUT}/screen-employee-schedule.png`)

  // 6. New shift modal
  await injectAndShot(page, MODAL_HTML, `${OUT}/screen-new-shift-modal.png`)

  // 7. Admin schedule — desktop viewport
  await injectAndShot(page, ADMIN_SCHEDULE_HTML, `${OUT}/screen-admin-schedule.png`, DESKTOP)

  await browser.close()
  console.log('\nAll screenshots saved to docs/')
}

main().catch(e => { console.error(e); process.exit(1) })
