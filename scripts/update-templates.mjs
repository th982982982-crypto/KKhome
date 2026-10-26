import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

const TAI_LIEU_SRC_DIR = path.join(ROOT_DIR, 'Tai Lieu')
const PUBLIC_TAI_LIEU_DIR = path.join(ROOT_DIR, 'public', 'tai-lieu')
const DATA_FILE = path.join(ROOT_DIR, 'src', 'lib', 'tai-lieu-data.ts')
const VERSIONS_FILE = path.join(ROOT_DIR, 'src', 'lib', 'tai-lieu-versions.json')

const BASE_CATEGORIES = [
  '01_NHAN_SU_VA_TIEN_LUONG',
  '02_KE_TOAN_VA_TAI_CHINH',
  '03_THUE_VA_PHAP_LY_DOANH_NGHIEP',
  '04_BAO_HIEM_XA_HOI'
]

const TEMPLATE_DESCRIPTIONS = {
  'NS01': 'Sổ quản lý theo dõi toàn bộ lao động trong doanh nghiệp theo quy định Bộ luật Lao động 2019 và NĐ 145/2020.',
  'NS02': 'Hệ thống tự động sinh Hợp đồng lao động, Phụ lục HĐLĐ, Cam kết bảo mật thông tin & Hợp đồng đào tạo.',
  'NS03': 'Mẫu hợp đồng giao khoán công việc theo thời vụ, công nhật hoặc khối lượng bàn giao độc lập.',
  'NS04': 'Mẫu hợp đồng dịch vụ tư vấn với cá nhân (thuộc đối tượng khấu trừ 10% thuế TNCN).',
  'NS05': 'Bảng chấm công tự động 31 ngày, tổng hợp công thực tế, nghỉ phép, lễ tết, tăng ca OT và làm đêm.',
  'NS06': 'Bảng tính lương tự động liên kết chấm công, tự động khấu trừ thuế TNCN lũy tiến và tỷ lệ trích nộp BHXH.',
  'NS07': 'Nội quy lao động doanh nghiệp chuẩn 2026 hoàn chỉnh các chương: Kỷ luật, An toàn, Quấy rối tình dục nơi làm việc.',
  'NS08': 'Bộ hồ sơ 09 biểu mẫu hành chính nộp Sở/Phòng LĐ-TB&XH để đăng ký Nội quy lao động.',
  'NS09': 'Quy chế chi phúc lợi nội bộ hoàn chỉnh: ốm đau, hiếu hỷ, sinh nhật, du lịch, thưởng con em.',
  'NS10': 'Trọn bộ hồ sơ căn cứ và bảng kê chi tặng quà lễ tết cho cán bộ nhân viên đủ điều kiện chi phí hợp lý.',
  'KPI': 'Bảng chỉ số đánh giá hiệu quả công việc (KPI) chi tiết cho từng vị trí chức danh với trọng số tự động.',
  'KT01': 'Hệ thống sổ kế toán Excel theo Thông tư 99/2025/TT-BTC hoàn chỉnh Nhật ký chung, Sổ cái, BCTC.',
  'KT02': 'Bộ Báo cáo tài chính chuẩn Thông tư 133/2016/TT-BTC tích hợp thuyết minh BCTC tự động.',
  'KT03': 'Bảng tính và phân bổ khấu hao TSCĐ tự động theo chuẩn mực kế toán và quy định thuế TNDN hiện hành.',
  'KT04': 'Sổ chi tiết theo dõi và tự động phân bổ chi phí trả trước dài hạn / ngắn hạn tài khoản 242.',
  'KT05': 'Trọn bộ hồ sơ pháp lý thanh lý TSCĐ: Quyết định, Biên bản họp hội đồng, Biên bản đánh giá và thanh lý.',
  'KT06': 'File tính giá thành sản xuất, tập hợp chi phí 621, 622, 627 và phân bổ chi phí dở dang cuối kỳ TK 154.',
  'KT07': 'Hệ thống quản lý công nợ khách hàng, nhà cung cấp và phân tích tuổi nợ quá hạn.',
  'KT08': 'Sổ theo dõi tiến độ thực hiện, nghiệm thu và thanh toán các Hợp đồng kinh tế.',
  'KT09': 'Mẫu hợp đồng vay vốn doanh nghiệp chặt chẽ về lãi suất và điều khoản giao dịch liên kết.',
  'KT10': 'Mẫu hợp đồng thuê nhà xưởng, văn phòng kinh doanh đầy đủ điều khoản bàn giao và thuế.',
  'KT11': 'Hợp đồng thuê tài sản, máy móc phục vụ hoạt động sản xuất kinh doanh.',
  'KT12': 'Quy chế chi tiêu nội bộ: phân quyền duyệt chi, định mức công tác phí, tiếp khách, điện thoại.',
  'KT13': 'Quy chế quản lý hàng tồn kho: thủ tục nhập - xuất, kiểm kê kho và trích lập dự phòng.',
  'KT14': 'Quy trình mua hàng và thanh toán: đối chiếu 3 bên Đề nghị - Phiếu nhập - Hóa đơn GTGT.',
  'TH01': 'Ma trận 57 khoản mục lương, phụ cấp, thưởng, phúc lợi đối chiếu đồng thời 3 nghĩa vụ Thuế & BHXH.',
  'TH02': 'Công văn 6436/CT-PC hướng dẫn những quy định cốt lõi người nộp thuế cần biết theo luật mới.',
  'TH03': 'Công văn 10311/CTNBI hướng dẫn chính sách thuế TNCN đối với các khoản chi trả nhân viên.',
  'TH04': 'Công văn 2590/BTC hướng dẫn chính sách thuế GTGT dịch vụ xuất khẩu cho Doanh nghiệp Chế xuất.',
  'TH05': 'Tài liệu hướng dẫn thủ tục giải thể, tạm ngừng, chấm dứt và khôi phục hiệu lực Mã số thuế.',
  'TH06': 'Tài liệu tập huấn quy trình đăng ký Hộ kinh doanh điện tử qua mạng của Bộ Kế hoạch Đầu tư.',
  'BH01': 'Bảng phân định chi tiết các khoản thu nhập tính đóng và miễn đóng BHXH bắt buộc theo Luật BHXH mới nhất.',
  'BH02': 'Hợp đồng lao động với người cao tuổi/nghỉ hưu: không đóng BHXH, chi trả phụ cấp BHXH trực tiếp vào lương.',
  'BH03': 'Hợp đồng mẫu thuê dịch vụ kế toán thuế và đại lý thực hiện thủ tục bảo hiểm xã hội.'
}

// 1. Sync files between "Tai Lieu" and "public/tai-lieu"
export function syncDirectories() {
  const syncStats = { syncedToPublic: 0, syncedToTaiLieu: 0 }
  if (!fs.existsSync(TAI_LIEU_SRC_DIR) || !fs.existsSync(PUBLIC_TAI_LIEU_DIR)) {
    return syncStats
  }

  function walkAndCopy(sourceDir, targetDir, isToPublic = true) {
    if (!fs.existsSync(sourceDir)) return

    const entries = fs.readdirSync(sourceDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === '_BACKUP_GOC' || entry.name === '__pycache__' || entry.name === 'static' || entry.name === 'templates') {
        continue
      }
      const srcPath = path.join(sourceDir, entry.name)
      const tgtPath = path.join(targetDir, entry.name)

      if (entry.isDirectory()) {
        if (!fs.existsSync(tgtPath)) {
          fs.mkdirSync(tgtPath, { recursive: true })
        }
        walkAndCopy(srcPath, tgtPath, isToPublic)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (!['.docx', '.xlsx', '.pdf'].includes(ext)) {
          continue
        }

        let shouldCopy = false
        if (!fs.existsSync(tgtPath)) {
          // If syncing back from public to Tai Lieu, don't copy generated PDF previews
          if (!isToPublic && ext === '.pdf') {
            const docxSibling = path.join(sourceDir, entry.name.replace(/\.pdf$/i, '.docx'))
            const xlsxSibling = path.join(sourceDir, entry.name.replace(/\.pdf$/i, '.xlsx'))
            if (fs.existsSync(docxSibling) || fs.existsSync(xlsxSibling)) {
              continue
            }
          }
          shouldCopy = true
        } else {
          const srcStat = fs.statSync(srcPath)
          const tgtStat = fs.statSync(tgtPath)
          if (srcStat.mtimeMs > tgtStat.mtimeMs + 2000) {
            shouldCopy = true
          }
        }

        if (shouldCopy) {
          const tgtParent = path.dirname(tgtPath)
          if (!fs.existsSync(tgtParent)) fs.mkdirSync(tgtParent, { recursive: true })
          fs.copyFileSync(srcPath, tgtPath)
          if (isToPublic) syncStats.syncedToPublic++
          else syncStats.syncedToTaiLieu++
        }
      }
    }
  }

  walkAndCopy(TAI_LIEU_SRC_DIR, PUBLIC_TAI_LIEU_DIR, true)
  walkAndCopy(PUBLIC_TAI_LIEU_DIR, TAI_LIEU_SRC_DIR, false)
  return syncStats
}

// 2. Read existing items from src/lib/tai-lieu-data.ts
export function readExistingItems() {
  if (!fs.existsSync(DATA_FILE)) return []
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8')
    const match = raw.match(/export const TAI_LIEU_ITEMS: TaiLieuItem\[\] = (\[[\s\S]*?\])(?:;|\s*$)/)
    if (match) {
      return JSON.parse(match[1])
    }
  } catch (err) {
    console.error('Lỗi khi đọc file tai-lieu-data.ts:', err)
  }
  return []
}

// Versioning helpers
export function getFileHash(filePath) {
  try {
    const buffer = fs.readFileSync(filePath)
    return crypto.createHash('md5').update(buffer).digest('hex')
  } catch {
    return ''
  }
}

export function formatVersionString(ver) {
  if (!ver) return 'Ver 2026.1'
  ver = ver.trim()
  if (/^v\d/i.test(ver)) {
    return 'Ver ' + ver.slice(1)
  }
  if (!ver.toLowerCase().startsWith('ver')) {
    return 'Ver ' + ver
  }
  return ver.replace(/^ver\s*/i, 'Ver ')
}

export function getNextVersion(currentVer) {
  const normalized = formatVersionString(currentVer)
  const matchYear = normalized.match(/Ver\s+(\d{4})\.(\d+)/i)
  if (matchYear) {
    const year = matchYear[1]
    const num = parseInt(matchYear[2], 10) + 1
    return `Ver ${year}.${num}`
  }
  const matchGeneral = normalized.match(/Ver\s+(\d+)\.(\d+)/i)
  if (matchGeneral) {
    const major = matchGeneral[1]
    const minor = parseInt(matchGeneral[2], 10) + 1
    return `Ver ${major}.${minor}`
  }
  const matchSingle = normalized.match(/Ver\s+(\d+)/i)
  if (matchSingle) {
    return `Ver ${matchSingle[1]}.1`
  }
  return `${normalized}.1`
}

export function readVersionsData() {
  if (!fs.existsSync(VERSIONS_FILE)) return {}
  try {
    const raw = fs.readFileSync(VERSIONS_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    console.error('Lỗi khi đọc file tai-lieu-versions.json:', err)
  }
  return {}
}

export function writeVersionsData(data) {
  try {
    fs.writeFileSync(VERSIONS_FILE, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.error('Lỗi khi ghi tai-lieu-versions.json:', err)
    return false
  }
}

// 3. Scan templates from public/tai-lieu
export function scanTemplates() {
  if (!fs.existsSync(PUBLIC_TAI_LIEU_DIR)) {
    return { items: [], bumpedItems: [] }
  }

  const existingItems = readExistingItems()
  const existingMap = new Map()
  let maxIdNum = 0

  for (const item of existingItems) {
    existingMap.set(item.filename, item)
    existingMap.set(item.downloadUrl, item)
    const idMatch = item.id.match(/^tl_(\d+)$/)
    if (idMatch) {
      const num = parseInt(idMatch[1], 10)
      if (num > maxIdNum) maxIdNum = num
    }
  }

  // Load versions data
  const allVersions = readVersionsData()
  let versionsChanged = false
  const bumpedItems = []

  const foundFiles = []

  function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name.startsWith('~$')) continue
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (['.docx', '.xlsx', '.pdf'].includes(ext)) {
          foundFiles.push({
            filename: entry.name,
            fullPath,
            ext,
            relPath: path.relative(PUBLIC_TAI_LIEU_DIR, fullPath).replace(/\\/g, '/'),
            stat: fs.statSync(fullPath)
          })
        }
      }
    }
  }

  walk(PUBLIC_TAI_LIEU_DIR)

  // Map files by directory to detect matching preview PDFs
  const dirFileMap = new Map()
  for (const f of foundFiles) {
    const dir = path.dirname(f.relPath)
    if (!dirFileMap.has(dir)) dirFileMap.set(dir, new Set())
    dirFileMap.get(dir).add(f.filename)
  }

  // Filter out PDFs that are previews of docx/xlsx in the same folder
  const primaryFiles = foundFiles.filter((f) => {
    if (f.ext !== '.pdf') return true
    const dir = path.dirname(f.relPath)
    const baseWithoutExt = f.filename.slice(0, -4)
    const set = dirFileMap.get(dir)
    if (!set) return true
    const hasDocx = set.has(`${baseWithoutExt}.docx`)
    const hasXlsx = set.has(`${baseWithoutExt}.xlsx`)
    return !hasDocx && !hasXlsx
  })

  const newItems = []
  let nextIdCounter = maxIdNum + 1

  for (const f of primaryFiles) {
    const fn = f.filename
    const dir = path.dirname(f.relPath)
    const baseWithoutExt = path.basename(fn, f.ext)
    const topFolder = f.relPath.split('/')[0] || ''

    // Calculate file content hash for version tracking
    const fileHash = getFileHash(f.fullPath)

    // Check if there is a preview PDF in the same directory
    const dirFiles = dirFileMap.get(dir) || new Set()
    const hasPreviewPdf = f.ext === '.pdf' || dirFiles.has(`${baseWithoutExt}.pdf`)

    // Extract code (e.g. NS01, KPI01, KT05, NS08_01, TH01, BH02)
    const codeMatch = fn.match(/^([A-Z0-9]+(?:_\d+)?)/)
    let code = codeMatch ? codeMatch[1] : 'BM'
    if (fn.includes('KPI')) {
      const parts = fn.split('_')
      code = parts[0] || 'KPI'
    }

    // Determine category
    let category = 'nhan_su'
    let categoryLabel = 'Nhân sự'

    if (topFolder.includes('01_NHAN_SU') || dir.includes('01_NHAN_SU')) {
      if (fn.includes('KPI') || code.startsWith('KPI')) {
        category = 'kpi'
        categoryLabel = 'KPI'
      } else if (fn.includes('Hop_Dong') || fn.includes('Khoan_Viec') || ['NS03', 'NS04'].includes(code)) {
        category = 'hop_dong'
        categoryLabel = 'Hợp đồng'
      } else {
        category = 'nhan_su'
        categoryLabel = 'Nhân sự'
      }
    } else if (topFolder.includes('02_KE_TOAN') || dir.includes('02_KE_TOAN')) {
      if (fn.includes('Hop_Dong') || ['KT09', 'KT10', 'KT11'].includes(code)) {
        category = 'hop_dong'
        categoryLabel = 'Hợp đồng'
      } else {
        category = 'ke_toan'
        categoryLabel = 'Kế toán'
      }
    } else if (topFolder.includes('03_THUE') || dir.includes('03_THUE')) {
      category = 'thue'
      categoryLabel = 'Thuế & Pháp lý'
    } else if (topFolder.includes('04_BAO_HIEM') || dir.includes('04_BAO_HIEM')) {
      category = 'bhxh'
      categoryLabel = 'Bảo hiểm XH'
    }

    // Formatted file size
    const sizeKB = f.stat.size / 1024
    const fileSize = sizeKB < 1024 ? `${sizeKB.toFixed(1)} KB` : `${(sizeKB / 1024).toFixed(1)} MB`

    // Download URL
    const downloadUrl = `/tai-lieu/${f.relPath}`

    // Existing match
    const existing = existingMap.get(fn) || existingMap.get(downloadUrl)
    const itemId = existing ? existing.id : `tl_${nextIdCounter++}`

    // Year extraction
    const yearMatch = fn.match(/\b(202\d)\b/)
    const year = existing?.year || (yearMatch ? parseInt(yearMatch[1], 10) : 2026)

    // Version management
    const verHistory = allVersions[itemId] ? [...allVersions[itemId]] : []
    let currentVersion = 'Ver 2026.1'

    if (verHistory.length === 0) {
      currentVersion = `Ver ${year}.1`
      const baseEntry = {
        version: currentVersion,
        releaseDate: `${year}-01-15`,
        changelog: `Phiên bản biểu mẫu chuẩn hóa năm ${year} áp dụng tại KK HOME.`,
        updatedBy: 'Hệ thống KK HOME',
        fileHash,
        fileSize,
        createdAt: new Date().toISOString()
      }
      allVersions[itemId] = [baseEntry]
      versionsChanged = true
    } else {
      // Normalize all versions
      for (const v of verHistory) {
        v.version = formatVersionString(v.version)
      }
      const latestVer = verHistory[0]
      currentVersion = latestVer.version

      // Detect if file content has changed
      if (latestVer.fileHash && fileHash && latestVer.fileHash !== fileHash) {
        const nextVer = getNextVersion(latestVer.version)
        const todayStr = new Date().toISOString().split('T')[0]
        const newVersionRecord = {
          version: nextVer,
          releaseDate: todayStr,
          changelog: `Cập nhật nội dung tệp biểu mẫu từ thư mục (Dung lượng: ${fileSize}).`,
          updatedBy: 'Hệ thống KK HOME (Tự động cập nhật)',
          fileHash,
          fileSize,
          createdAt: new Date().toISOString()
        }
        verHistory.unshift(newVersionRecord)
        allVersions[itemId] = verHistory
        currentVersion = nextVer
        versionsChanged = true
        bumpedItems.push({
          id: itemId,
          code,
          filename: fn,
          oldVersion: latestVer.version,
          newVersion: nextVer
        })
      } else if (!latestVer.fileHash && fileHash) {
        latestVer.fileHash = fileHash
        latestVer.fileSize = fileSize
        allVersions[itemId] = verHistory
        versionsChanged = true
      }
    }

    if (existing) {
      newItems.push({
        ...existing,
        id: itemId,
        filename: fn,
        fileType: f.ext.replace('.', ''),
        fileSize,
        downloadUrl,
        hasPreviewPdf,
        version: currentVersion,
        fileHash,
        lastModified: f.stat.mtime.toISOString()
      })
    } else {
      // Create new template item
      let title = fn
        .replace(new RegExp(`^${code}_?`, 'i'), '')
        .replace(/\.(docx|xlsx|pdf)$/i, '')
        .replace(/_/g, ' ')
        .trim()

      if (!title) title = code

      let description = `Biểu mẫu chuẩn hóa dành cho ${categoryLabel} — KK HOME.`
      for (const [k, desc] of Object.entries(TEMPLATE_DESCRIPTIONS)) {
        if (code === k || fn.startsWith(k) || code.startsWith(k)) {
          description = desc
          break
        }
      }

      const tags = [categoryLabel]
      if (f.ext === '.xlsx') tags.push('Excel')
      if (f.ext === '.docx') tags.push('Word')
      if (f.ext === '.pdf') tags.push('PDF')
      if (category === 'hop_dong') tags.push('Hợp đồng')
      if (category === 'kpi') tags.push('KPI')

      newItems.push({
        id: itemId,
        code,
        title,
        filename: fn,
        category,
        categoryLabel,
        year,
        description,
        featured: false,
        isHot: false,
        fileType: f.ext.replace('.', ''),
        fileSize,
        downloadUrl,
        tags,
        hasPreviewPdf,
        version: currentVersion,
        fileHash,
        lastModified: f.stat.mtime.toISOString()
      })
    }
  }

  // Save versions data if updated
  if (versionsChanged) {
    writeVersionsData(allVersions)
  }

  // Sort items nicely
  const catOrder = { nhan_su: 1, hop_dong: 2, kpi: 3, ke_toan: 4, thue: 5, bhxh: 6 }
  newItems.sort((a, b) => {
    const oA = catOrder[a.category] || 99
    const oB = catOrder[b.category] || 99
    if (oA !== oB) return oA - oB
    return a.code.localeCompare(b.code, undefined, { numeric: true })
  })

  return { items: newItems, bumpedItems, allVersions }
}

// 4. Write items to src/lib/tai-lieu-data.ts
export function writeTaiLieuData(items) {
  const content = `export interface TaiLieuItem {
  id: string
  code: string
  title: string
  filename: string
  category: string
  categoryLabel: string
  year: number
  description: string
  featured?: boolean
  isHot?: boolean
  fileType: "xlsx" | "docx" | "pdf"
  fileSize: string
  downloadUrl: string
  tags: string[]
  lastModified?: string
  hasPreviewPdf?: boolean
  version?: string
  fileHash?: string
}

export function getPreviewPdfUrl(item: TaiLieuItem): string {
  if (item.fileType === 'pdf') return item.downloadUrl
  return item.downloadUrl.replace(/\\.(docx|xlsx)$/i, '.pdf')
}

export const TAI_LIEU_ITEMS: TaiLieuItem[] = ${JSON.stringify(items, null, 2)};
`

  fs.writeFileSync(DATA_FILE, content, 'utf-8')
}

// 5. Main runner
export function updateTemplates() {
  console.log('\n===============================================================')
  console.log('       KK HOME - TỰ ĐỘNG ĐỒNG BỘ & CẬP NHẬT BIỂU MẪU           ')
  console.log('===============================================================')
  const startTime = Date.now()

  // 1. Sync directories
  console.log('1. Đang kiểm tra đồng bộ giữa thư mục "Tai Lieu" và "public/tai-lieu"...')
  const syncStats = syncDirectories()
  if (syncStats.syncedToPublic > 0 || syncStats.syncedToTaiLieu > 0) {
    console.log(`   -> Đã đồng bộ ${syncStats.syncedToPublic} tệp sang public/tai-lieu`)
    console.log(`   -> Đã đồng bộ ${syncStats.syncedToTaiLieu} tệp sang Tai Lieu`)
  } else {
    console.log('   -> Hai thư mục đã đồng bộ hoàn toàn.')
  }

  // 2. Scan and rebuild catalog
  console.log('2. Đang quét các tệp biểu mẫu trong thư mục...')
  const oldItems = readExistingItems()
  const scanResult = scanTemplates()
  const items = scanResult.items
  const bumpedItems = scanResult.bumpedItems || []

  const oldFilenames = new Set(oldItems.map((i) => i.filename))
  const newFilenames = new Set(items.map((i) => i.filename))

  const added = items.filter((i) => !oldFilenames.has(i.filename))
  const removed = oldItems.filter((i) => !newFilenames.has(i.filename))

  if (added.length > 0) {
    console.log(`   [+] Phát hiện ${added.length} biểu mẫu mới:`)
    for (const it of added) {
      console.log(`       - [${it.code}] ${it.filename} (${it.categoryLabel}) [${it.version || 'Ver 2026.1'}]`)
    }
  }

  if (bumpedItems.length > 0) {
    console.log(`   [⭐] Phát hiện cập nhật nội dung tệp & ĐÃ TỰ ĐỘNG NÂNG CẤP PHIÊN BẢN (Ver):`)
    for (const b of bumpedItems) {
      console.log(`       - [${b.code}] ${b.filename}: ${b.oldVersion} -> ${b.newVersion}`)
    }
  }

  if (removed.length > 0) {
    console.log(`   [-] Đã xóa ${removed.length} biểu mẫu khỏi thư mục:`)
    for (const it of removed) {
      console.log(`       - [${it.code}] ${it.filename}`)
    }
  }

  // 3. Write data file
  writeTaiLieuData(items)
  console.log(`3. Đã cập nhật file dữ liệu src/lib/tai-lieu-data.ts thành công!`)

  // 4. Statistics
  const stats = {
    total: items.length,
    nhanSu: items.filter((i) => i.category === 'nhan_su').length,
    hopDong: items.filter((i) => i.category === 'hop_dong').length,
    kpi: items.filter((i) => i.category === 'kpi').length,
    keToan: items.filter((i) => i.category === 'ke_toan').length,
    thue: items.filter((i) => i.category === 'thue').length,
    bhxh: items.filter((i) => i.category === 'bhxh').length
  }

  console.log('---------------------------------------------------------------')
  console.log(`TỔNG SỐ BIỂU MẪU HIỆN HÀNH: ${stats.total}`)
  console.log(`- Nhân sự:        ${stats.nhanSu}`)
  console.log(`- Hợp đồng:       ${stats.hopDong}`)
  console.log(`- Đánh giá KPI:   ${stats.kpi}`)
  console.log(`- Kế toán:        ${stats.keToan}`)
  console.log(`- Thuế & Pháp lý: ${stats.thue}`)
  console.log(`- Bảo hiểm XH:    ${stats.bhxh}`)
  console.log(`Thời gian xử lý: ${((Date.now() - startTime) / 1000).toFixed(2)}s`)
  console.log('===============================================================\n')

  return { success: true, count: items.length, added, removed, bumpedItems, stats, items }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  updateTemplates()
}
