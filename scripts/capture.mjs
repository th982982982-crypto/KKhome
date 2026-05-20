// Visual capture script using Playwright headless chromium.
// Usage: node scripts/capture.mjs [before|after]
// Requires: npm run dev to be running at http://localhost:3000

import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

// Parse .env.local for credentials/base URL
const envPath = join(root, '.env.local')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#') && l.includes('='))
    .map((l) => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    })
)

const baseUrl = env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

const phase = process.argv[2] === 'after' ? 'after' : 'before'
const outDir = join(root, 'screenshots', phase)
mkdirSync(outDir, { recursive: true })

const ADMIN_EMAIL = 'admin@kkhome.com'
const ADMIN_PASSWORD = 'admin123'

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]

// Pages to capture: { path, name, auth: 'none' | 'admin', cart?: boolean }
const PAGES = [
  { path: '/', name: 'home', auth: 'none' },
  { path: '/templates', name: 'templates', auth: 'none' },
  { path: '/packages', name: 'packages', auth: 'none' },
  { path: '/cart', name: 'cart-empty', auth: 'none' },
  { path: '/cart', name: 'cart-filled', auth: 'none', cart: true },
  { path: '/login', name: 'login', auth: 'none' },
  { path: '/register', name: 'register', auth: 'none' },
  { path: '/dashboard', name: 'dashboard-admin', auth: 'admin' },
  { path: '/admin', name: 'admin-home', auth: 'admin' },
  { path: '/admin/templates', name: 'admin-templates', auth: 'admin' },
  { path: '/admin/orders', name: 'admin-orders', auth: 'admin' },
  { path: '/admin/sync', name: 'admin-sync', auth: 'admin' },
  { path: '/checkout', name: 'checkout', auth: 'admin', cart: true },
]

async function loginViaUI(context, email, password) {
  const page = await context.newPage()
  await page.goto(baseUrl + '/login', { waitUntil: 'domcontentloaded' })
  await page.fill('input[type="email"]', email)
  await page.fill('input[type="password"]', password)
  await Promise.all([
    page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 }),
    page.click('button[type="submit"]'),
  ])
  await page.close()
}

async function injectCart(page) {
  await page.addInitScript(() => {
    const items = [
      {
        type: 'template',
        id: 'demo-tpl-1',
        name: 'Quản lý chấm công nhân viên',
        sale_price: 199000,
        original_price: 299000,
        thumbnail_url: null,
      },
      {
        type: 'template',
        id: 'demo-tpl-2',
        name: 'Tính lương tự động Excel',
        sale_price: 149000,
        original_price: 249000,
        thumbnail_url: null,
      },
    ]
    localStorage.setItem('cart-storage', JSON.stringify({ state: { items }, version: 0 }))
  })
}

async function capturePage(context, pageConfig, viewport) {
  const page = await context.newPage()
  await page.setViewportSize({ width: viewport.width, height: viewport.height })
  if (pageConfig.cart) await injectCart(page)

  const url = baseUrl + pageConfig.path
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 })
    await page.waitForTimeout(500)
    const file = join(outDir, `${pageConfig.name}-${viewport.name}.png`)
    await page.screenshot({ path: file, fullPage: true })
    console.log(`  ✓ ${pageConfig.name} @ ${viewport.name}`)
  } catch (err) {
    console.log(`  ✗ ${pageConfig.name} @ ${viewport.name}: ${err.message}`)
  } finally {
    await page.close()
  }
}

async function main() {
  console.log(`Capturing → screenshots/${phase}/`)
  const browser = await chromium.launch({ headless: true })
  try {
    // Two contexts: guest (no auth) and admin (logged in)
    const guestCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } })
    const adminCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } })

    try {
      await loginViaUI(adminCtx, ADMIN_EMAIL, ADMIN_PASSWORD)
      console.log(`Logged in as ${ADMIN_EMAIL}`)
    } catch (err) {
      console.warn(`Admin login failed: ${err.message}. Admin pages will be skipped.`)
    }

    for (const pageConfig of PAGES) {
      console.log(`→ ${pageConfig.path} (${pageConfig.name})`)
      const ctx = pageConfig.auth === 'admin' ? adminCtx : guestCtx
      for (const viewport of VIEWPORTS) {
        await capturePage(ctx, pageConfig, viewport)
      }
    }

    await guestCtx.close()
    await adminCtx.close()
  } finally {
    await browser.close()
  }

  console.log(`\nDone. Screenshots in screenshots/${phase}/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
