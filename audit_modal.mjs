import { chromium } from 'playwright';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

const APPS = [
  { name: 'OUR APP', url: 'http://localhost:5173' },
  { name: 'EKN APP', url: 'https://ekn-ten.vercel.app' },
];

const MODULES = [
  { key: 'donHang', labels: ['Đơn hàng', 'Don hang', 'Orders'] },
  { key: 'banHang', labels: ['Bán hàng', 'Ban hang', 'Sales'] },
  { key: 'muaHang', labels: ['Mua hàng', 'Mua hang', 'Purchase'] },
  { key: 'traLaiBan', labels: ['Trả lại', 'Tra lai', 'Return'] },
  { key: 'quyTienMat', labels: ['Quỹ tiền mặt', 'Quy tien mat', 'Cash'] },
  { key: 'nganHang', labels: ['Ngân hàng', 'Ngan hang', 'Bank'] },
  { key: 'tongHop', labels: ['Tổng hợp', 'Tong hop', 'General'] },
  { key: 'taiSanCoDinh', labels: ['Tài sản cố định', 'Tai san', 'Fixed'] },
  { key: 'chiPhiTraTruoc', labels: ['Chi phí trả trước', 'Chi phi', 'Prepaid'] },
  { key: 'tienLuong', labels: ['Tiền lương', 'Tien luong', 'Payroll'] },
  { key: 'danhMuc', labels: ['Danh mục', 'Danh muc', 'Category'] },
  { key: 'kho', labels: ['Kho hàng', 'Kho', 'Inventory', 'Warehouse'] },
  { key: 'congNo', labels: ['Công nợ', 'Cong no', 'Receivable'] },
];

async function ensureScreenshotsDir() {
  if (!existsSync('/tmp/screenshots')) {
    await mkdir('/tmp/screenshots', { recursive: true });
  }
}

async function checkForModal(page) {
  try {
    // Check for various modal/dialog indicators
    const modalSelectors = [
      '[role="dialog"]',
      '[role="alertdialog"]',
      '.modal',
      '[class*="modal"]',
      '[class*="dialog"]',
      '[class*="overlay"]:not([class*="background"])',
      '[class*="Overlay"]',
      '[class*="Modal"]',
      '[class*="Dialog"]',
      '.ant-modal',
      '.ant-drawer',
      '[class*="drawer"]',
      '[class*="Drawer"]',
      // Fixed positioned elements that look like modals
    ];

    for (const selector of modalSelectors) {
      try {
        const el = await page.$(selector);
        if (el) {
          const visible = await el.isVisible();
          if (visible) {
            // Get title
            const title = await getModalTitle(page, el);
            return { found: true, title, selector };
          }
        }
      } catch (e) {
        // continue
      }
    }

    // Check for fixed positioned overlays with high z-index
    const fixedOverlay = await page.evaluate(() => {
      const allEls = document.querySelectorAll('*');
      for (const el of allEls) {
        const style = window.getComputedStyle(el);
        const zIndex = parseInt(style.zIndex) || 0;
        if (
          style.position === 'fixed' &&
          zIndex > 100 &&
          el.offsetWidth > 200 &&
          el.offsetHeight > 100 &&
          style.display !== 'none' &&
          style.visibility !== 'hidden' &&
          style.opacity !== '0'
        ) {
          // Get title from this element
          const headings = el.querySelectorAll('h1,h2,h3,h4,h5,[class*="title"],[class*="Title"],[class*="header"],[class*="Header"]');
          let title = '';
          for (const h of headings) {
            const text = h.textContent?.trim();
            if (text && text.length > 0 && text.length < 100) {
              title = text;
              break;
            }
          }
          if (!title) {
            // Try first text content
            title = el.querySelector('h1,h2,h3,h4')?.textContent?.trim() || '';
          }
          return { found: true, tag: el.tagName, className: el.className?.substring(0, 80), title };
        }
      }
      return { found: false };
    });

    if (fixedOverlay && fixedOverlay.found) {
      return { found: true, title: fixedOverlay.title, selector: `fixed[z>100] ${fixedOverlay.tag}.${fixedOverlay.className}` };
    }

    return { found: false };
  } catch (e) {
    return { found: false, error: e.message };
  }
}

async function getModalTitle(page, modalEl) {
  try {
    const titleSelectors = [
      'h1', 'h2', 'h3', 'h4',
      '[class*="title"]', '[class*="Title"]',
      '[class*="header"]', '[class*="Header"]',
      '.modal-title', '.dialog-title',
    ];
    for (const sel of titleSelectors) {
      try {
        const titleEl = await modalEl.$(sel);
        if (titleEl) {
          const text = await titleEl.textContent();
          if (text && text.trim().length > 0 && text.trim().length < 150) {
            return text.trim();
          }
        }
      } catch (e) {
        // continue
      }
    }
    // Try to get first meaningful text
    const text = await modalEl.textContent();
    if (text) {
      const lines = text.trim().split('\n').map(l => l.trim()).filter(l => l.length > 0);
      return lines[0]?.substring(0, 80) || '';
    }
  } catch (e) {
    // ignore
  }
  return '';
}

async function closeModal(page) {
  try {
    // Try pressing Escape first
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Check if modal is still open
    const modalCheck = await checkForModal(page);
    if (!modalCheck.found) return true;

    // Try clicking X button
    const closeSelectors = [
      'button[aria-label="Close"]',
      'button[aria-label="close"]',
      '[class*="close"]',
      '[class*="Close"]',
      'button:has-text("×")',
      'button:has-text("✕")',
      'button:has-text("X")',
      '[class*="modal"] button:first-child',
      '[role="dialog"] button:first-child',
    ];

    for (const sel of closeSelectors) {
      try {
        const btn = await page.$(sel);
        if (btn) {
          const visible = await btn.isVisible();
          if (visible) {
            await btn.click();
            await page.waitForTimeout(300);
            const check = await checkForModal(page);
            if (!check.found) return true;
          }
        }
      } catch (e) {
        // continue
      }
    }

    // Try clicking outside the modal (backdrop)
    await page.mouse.click(10, 10);
    await page.waitForTimeout(300);

    return true;
  } catch (e) {
    return false;
  }
}

async function findAndClickDemo(page, appName) {
  try {
    // Look for demo button
    const demoSelectors = [
      'button:has-text("Demo")',
      'button:has-text("demo")',
      'button:has-text("Dùng thử")',
      'a:has-text("Demo")',
      '[class*="demo"]',
    ];

    for (const sel of demoSelectors) {
      try {
        const btn = await page.$(sel);
        if (btn) {
          const visible = await btn.isVisible();
          if (visible) {
            console.log(`  [${appName}] Found Demo button with selector: ${sel}`);
            await btn.click();
            await page.waitForTimeout(2000);
            return true;
          }
        }
      } catch (e) {
        // continue
      }
    }

    // Try finding by text content
    const allButtons = await page.$$('button, a');
    for (const btn of allButtons) {
      try {
        const text = await btn.textContent();
        if (text && (text.toLowerCase().includes('demo') || text.includes('Dùng thử') || text.includes('thử nghiệm'))) {
          const visible = await btn.isVisible();
          if (visible) {
            console.log(`  [${appName}] Found Demo button with text: "${text.trim()}"`);
            await btn.click();
            await page.waitForTimeout(2000);
            return true;
          }
        }
      } catch (e) {
        // continue
      }
    }

    console.log(`  [${appName}] Demo button NOT FOUND`);
    return false;
  } catch (e) {
    console.log(`  [${appName}] Error finding demo button: ${e.message}`);
    return false;
  }
}

async function navigateToModule(page, module, appName) {
  try {
    // Look in sidebar/nav for module links
    const navSelectors = [
      'nav a', 'aside a', '[class*="sidebar"] a', '[class*="Sidebar"] a',
      '[class*="menu"] a', '[class*="Menu"] a', '[class*="nav"] a',
      'nav button', 'aside button', '[class*="sidebar"] button',
      '[class*="menu"] li', '[class*="nav"] li',
    ];

    for (const label of module.labels) {
      // Try direct text match
      const selectors = [
        `a:has-text("${label}")`,
        `button:has-text("${label}")`,
        `li:has-text("${label}")`,
        `[class*="nav"]:has-text("${label}")`,
        `[class*="menu"]:has-text("${label}")`,
        `[class*="sidebar"]:has-text("${label}")`,
      ];

      for (const sel of selectors) {
        try {
          const el = await page.$(sel);
          if (el) {
            const visible = await el.isVisible();
            if (visible) {
              console.log(`  [${appName}] Navigating to ${module.key} via: "${label}"`);
              await el.click();
              await page.waitForTimeout(1500);
              return { found: true, label };
            }
          }
        } catch (e) {
          // continue
        }
      }
    }

    // Try searching all links/buttons
    const allNavItems = await page.$$('a, button, [role="menuitem"], [role="tab"]');
    for (const item of allNavItems) {
      try {
        const text = await item.textContent();
        if (text) {
          const trimmed = text.trim();
          for (const label of module.labels) {
            if (trimmed.toLowerCase().includes(label.toLowerCase()) ||
                trimmed.includes(label)) {
              const visible = await item.isVisible();
              if (visible) {
                const tagName = await item.evaluate(el => el.tagName);
                // Avoid clicking body links, prefer nav items
                const inNav = await item.evaluate(el => {
                  let parent = el.parentElement;
                  while (parent) {
                    const tag = parent.tagName?.toLowerCase();
                    const cls = parent.className?.toLowerCase() || '';
                    if (['nav', 'aside'].includes(tag) ||
                        cls.includes('sidebar') || cls.includes('menu') || cls.includes('nav')) {
                      return true;
                    }
                    parent = parent.parentElement;
                  }
                  return false;
                });

                if (inNav) {
                  console.log(`  [${appName}] Found ${module.key} nav item: "${trimmed.substring(0, 50)}"`);
                  await item.click();
                  await page.waitForTimeout(1500);
                  return { found: true, label: trimmed };
                }
              }
            }
          }
        }
      } catch (e) {
        // continue
      }
    }

    return { found: false };
  } catch (e) {
    return { found: false, error: e.message };
  }
}

async function getTableRows(page) {
  try {
    // Try various table row selectors
    const rowSelectors = [
      'table tbody tr',
      '[class*="table"] tbody tr',
      '[class*="Table"] tbody tr',
      '[role="row"]:not([role="columnheader"])',
      '[class*="row"]:not([class*="header"]):not([class*="Header"])',
    ];

    for (const sel of rowSelectors) {
      try {
        const rows = await page.$$(sel);
        const visibleRows = [];
        for (const row of rows) {
          const visible = await row.isVisible();
          if (visible) {
            visibleRows.push(row);
          }
        }
        if (visibleRows.length > 0) {
          return visibleRows;
        }
      } catch (e) {
        // continue
      }
    }

    return [];
  } catch (e) {
    return [];
  }
}

async function findAddButton(page) {
  try {
    const addSelectors = [
      'button:has-text("Thêm mới")',
      'button:has-text("+ Thêm")',
      'button:has-text("Thêm")',
      'button:has-text("Add")',
      'button:has-text("Tạo mới")',
      'button:has-text("Tạo")',
      'button:has-text("New")',
      'button:has-text("+")',
      '[class*="add"] button',
      '[class*="btn-add"]',
      'button[class*="primary"]',
      'button[class*="btn-primary"]',
    ];

    for (const sel of addSelectors) {
      try {
        const btns = await page.$$(sel);
        for (const btn of btns) {
          const visible = await btn.isVisible();
          if (visible) {
            const text = await btn.textContent();
            return { button: btn, text: text?.trim() || '', selector: sel };
          }
        }
      } catch (e) {
        // continue
      }
    }

    // Search all buttons for add-like text
    const allBtns = await page.$$('button');
    for (const btn of allBtns) {
      try {
        const text = await btn.textContent();
        const visible = await btn.isVisible();
        if (visible && text) {
          const t = text.trim().toLowerCase();
          if (t.includes('thêm') || t.includes('tạo') || t.includes('add') || t.includes('new') || t === '+') {
            return { button: btn, text: text.trim(), selector: 'button[text]' };
          }
        }
      } catch (e) {
        // continue
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}

async function auditModule(page, module, appName, screenshotPrefix) {
  const result = {
    rowClick: { found: false, title: '', error: null },
    addButton: { found: false, title: '', error: null, buttonText: '' },
  };

  try {
    // Check for table rows
    const rows = await getTableRows(page);
    if (rows.length === 0) {
      result.rowClick = { found: false, title: '', note: 'NO ROWS' };
    } else {
      // Click first row
      try {
        await rows[0].click();
        await page.waitForTimeout(600);

        const modalCheck = await checkForModal(page);
        result.rowClick = {
          found: modalCheck.found,
          title: modalCheck.title || '',
          selector: modalCheck.selector || '',
        };

        if (modalCheck.found) {
          // Take screenshot
          try {
            const screenshotPath = `/tmp/screenshots/${screenshotPrefix}_${module.key}_row.png`;
            await page.screenshot({ path: screenshotPath });
            result.rowClick.screenshot = screenshotPath;
          } catch (e) {
            // ignore screenshot errors
          }
          await closeModal(page);
          await page.waitForTimeout(400);
        }
      } catch (e) {
        result.rowClick = { found: false, error: e.message };
      }
    }

    // Find and click add button
    try {
      const addBtn = await findAddButton(page);
      if (!addBtn) {
        result.addButton = { found: false, title: '', note: 'ADD BUTTON NOT FOUND' };
      } else {
        result.addButton.buttonText = addBtn.text;
        await addBtn.button.click();
        await page.waitForTimeout(600);

        const modalCheck = await checkForModal(page);
        result.addButton = {
          ...result.addButton,
          found: modalCheck.found,
          title: modalCheck.title || '',
          selector: modalCheck.selector || '',
        };

        if (modalCheck.found) {
          // Take screenshot
          try {
            const screenshotPath = `/tmp/screenshots/${screenshotPrefix}_${module.key}_add.png`;
            await page.screenshot({ path: screenshotPath });
            result.addButton.screenshot = screenshotPath;
          } catch (e) {
            // ignore screenshot errors
          }
          await closeModal(page);
          await page.waitForTimeout(400);
        }
      }
    } catch (e) {
      result.addButton = { found: false, error: e.message };
    }
  } catch (e) {
    result.error = e.message;
  }

  return result;
}

async function auditApp(browser, app) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`AUDITING: ${app.name} (${app.url})`);
  console.log('='.repeat(60));

  const results = {};
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  try {
    // Load app
    console.log(`\nLoading ${app.url}...`);
    await page.goto(app.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Print page title to confirm loaded
    const title = await page.title();
    console.log(`Page title: "${title}"`);

    // Take initial screenshot
    await page.screenshot({ path: `/tmp/screenshots/${app.name.replace(/\s+/g, '_')}_initial.png` });

    // Click Demo button
    console.log('\nLooking for Demo button...');
    const demoClicked = await findAndClickDemo(page, app.name);
    if (demoClicked) {
      console.log('  Demo data loaded');
      await page.screenshot({ path: `/tmp/screenshots/${app.name.replace(/\s+/g, '_')}_after_demo.png` });
    }
    await page.waitForTimeout(1000);

    // Audit each module
    for (const module of MODULES) {
      console.log(`\n--- Module: ${module.key} ---`);

      // Try to navigate to module
      const navResult = await navigateToModule(page, module, app.name);

      if (!navResult.found) {
        console.log(`  [${app.name}] NAV NOT FOUND for ${module.key}`);
        results[module.key] = { navFound: false };
        continue;
      }

      await page.waitForTimeout(500);

      // Take screenshot of module
      await page.screenshot({
        path: `/tmp/screenshots/${app.name.replace(/\s+/g, '_')}_${module.key}_page.png`
      });

      // Audit the module
      const prefix = app.name.replace(/\s+/g, '_');
      const moduleResult = await auditModule(page, module, app.name, prefix);
      results[module.key] = { navFound: true, navLabel: navResult.label, ...moduleResult };
    }
  } catch (e) {
    console.log(`Error auditing ${app.name}: ${e.message}`);
  } finally {
    await context.close();
  }

  return results;
}

function printResults(allResults) {
  console.log('\n\n');
  console.log('='.repeat(70));
  console.log('AUDIT RESULTS SUMMARY');
  console.log('='.repeat(70));

  for (const module of MODULES) {
    const ourApp = allResults['OUR APP']?.[module.key];
    const eknApp = allResults['EKN APP']?.[module.key];

    console.log(`\nMODULE: ${module.key}`);

    // OUR APP
    console.log('  OUR APP:');
    if (!ourApp || !ourApp.navFound) {
      console.log('    - NAV NOT FOUND');
    } else {
      const rowNote = ourApp.rowClick?.note || '';
      const rowModal = ourApp.rowClick?.found;
      const rowTitle = ourApp.rowClick?.title || '';
      console.log(`    - Click row → MODAL opens: ${rowModal ? 'YES' : (rowNote || 'NO')}${rowTitle ? ` [${rowTitle}]` : ''}`);

      const addNote = ourApp.addButton?.note || '';
      const addModal = ourApp.addButton?.found;
      const addTitle = ourApp.addButton?.title || '';
      const addBtnText = ourApp.addButton?.buttonText ? ` (button: "${ourApp.addButton.buttonText}")` : '';
      console.log(`    - Click "+ Thêm"${addBtnText} → MODAL opens: ${addModal ? 'YES' : (addNote || 'NO')}${addTitle ? ` [${addTitle}]` : ''}`);
    }

    // EKN APP
    console.log('  EKN APP:');
    if (!eknApp || !eknApp.navFound) {
      console.log('    - NAV NOT FOUND');
    } else {
      const rowNote = eknApp.rowClick?.note || '';
      const rowModal = eknApp.rowClick?.found;
      const rowTitle = eknApp.rowClick?.title || '';
      console.log(`    - Click row → MODAL opens: ${rowModal ? 'YES' : (rowNote || 'NO')}${rowTitle ? ` [${rowTitle}]` : ''}`);

      const addNote = eknApp.addButton?.note || '';
      const addModal = eknApp.addButton?.found;
      const addTitle = eknApp.addButton?.title || '';
      const addBtnText = eknApp.addButton?.buttonText ? ` (button: "${eknApp.addButton.buttonText}")` : '';
      console.log(`    - Click "+ Thêm"${addBtnText} → MODAL opens: ${addModal ? 'YES' : (addNote || 'NO')}${addTitle ? ` [${addTitle}]` : ''}`);
    }

    // DIFFERENCE
    console.log('  DIFFERENCE:');
    const diffs = [];

    if (!ourApp?.navFound && eknApp?.navFound) {
      diffs.push('Our app missing this module navigation');
    } else if (ourApp?.navFound && eknApp?.navFound) {
      const ourRow = ourApp?.rowClick?.found;
      const eknRow = eknApp?.rowClick?.found;
      const ourAdd = ourApp?.addButton?.found;
      const eknAdd = eknApp?.addButton?.found;

      if (eknRow && !ourRow && ourApp?.rowClick?.note !== 'NO ROWS') {
        diffs.push('EKN opens modal on row click, OUR APP does NOT');
      } else if (!eknRow && ourRow) {
        diffs.push('OUR APP opens modal on row click, EKN does NOT');
      }

      if (eknAdd && !ourAdd) {
        diffs.push('EKN opens form/modal on Add button, OUR APP does NOT');
      } else if (!eknAdd && ourAdd) {
        diffs.push('OUR APP opens form on Add button, EKN does NOT');
      }

      if (!ourApp?.addButton?.note && !eknApp?.addButton?.note) {
        if (ourAdd && eknAdd) {
          const ourT = ourApp?.addButton?.title || '';
          const eknT = eknApp?.addButton?.title || '';
          if (ourT !== eknT && ourT && eknT) {
            diffs.push(`Add modal titles differ: OUR="${ourT}" vs EKN="${eknT}"`);
          }
        }
      }
    }

    if (diffs.length === 0) {
      console.log('    (none detected or both missing nav)');
    } else {
      diffs.forEach(d => console.log(`    - ${d}`));
    }

    console.log('  ' + '-'.repeat(60));
  }
}

async function main() {
  await ensureScreenshotsDir();

  const browser = await chromium.launch({ headless: true });
  const allResults = {};

  try {
    for (const app of APPS) {
      const results = await auditApp(browser, app);
      allResults[app.name] = results;
    }
  } finally {
    await browser.close();
  }

  printResults(allResults);

  console.log('\n\nRaw results JSON:');
  console.log(JSON.stringify(allResults, null, 2));
}

main().catch(console.error);
