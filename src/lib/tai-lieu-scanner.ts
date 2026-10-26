import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { TAI_LIEU_ITEMS, type TaiLieuItem } from './tai-lieu-data'

const ROOT_DIR = process.cwd()
const TAI_LIEU_SRC_DIR = path.join(ROOT_DIR, 'Tai Lieu')
const PUBLIC_TAI_LIEU_DIR = path.join(ROOT_DIR, 'public', 'tai-lieu')
const DATA_FILE = path.join(ROOT_DIR, 'src', 'lib', 'tai-lieu-data.ts')
const VERSIONS_FILE = path.join(ROOT_DIR, 'src', 'lib', 'tai-lieu-versions.json')
const METADATA_FILE = path.join(ROOT_DIR, 'src', 'lib', 'tai-lieu-metadata.json')

export function getFileHash(filePath: string): string {
  try {
    const buffer = fs.readFileSync(filePath)
    return crypto.createHash('md5').update(buffer).digest('hex')
  } catch {
    return ''
  }
}

export function formatVersionString(ver?: string): string {
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

export function getNextVersion(currentVer: string): string {
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

export function readVersionsData(): Record<string, any[]> {
  if (!fs.existsSync(VERSIONS_FILE)) return {}
  try {
    const raw = fs.readFileSync(VERSIONS_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    console.error('Lỗi khi đọc file tai-lieu-versions.json:', err)
  }
  return {}
}

export function writeVersionsData(data: Record<string, any[]>): boolean {
  try {
    fs.writeFileSync(VERSIONS_FILE, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.error('Lỗi khi ghi tai-lieu-versions.json:', err)
    return false
  }
}

export interface TaiLieuMetadataOverride {
  title?: string
  code?: string
  description?: string
  category?: string
  categoryLabel?: string
  year?: number
  tags?: string[]
  featured?: boolean
  isHot?: boolean
  highlights?: string[]
  isHidden?: boolean
  googleSheetUrl?: string
  googleDocUrl?: string
  googleDriveUrl?: string
}

export function readMetadataOverrides(): Record<string, TaiLieuMetadataOverride> {
  if (!fs.existsSync(METADATA_FILE)) return {}
  try {
    const raw = fs.readFileSync(METADATA_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch (err) {
    console.error('Lỗi khi đọc file tai-lieu-metadata.json:', err)
  }
  return {}
}

export function writeMetadataOverrides(data: Record<string, TaiLieuMetadataOverride>): boolean {
  try {
    fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.error('Lỗi khi ghi tai-lieu-metadata.json:', err)
    return false
  }
}

export function isTaiLieuPublic(): boolean {
  try {
    const data = readMetadataOverrides()
    if ((data as any).__settings?.isPublic !== undefined) {
      return Boolean((data as any).__settings.isPublic)
    }
  } catch {}
  return true // Mặc định mở công khai để người khác có thể xem
}

export function setTaiLieuPublic(isPublic: boolean): boolean {
  try {
    const data = readMetadataOverrides()
    ;(data as any).__settings = { ...(data as any).__settings, isPublic }
    return writeMetadataOverrides(data)
  } catch {
    return false
  }
}

const TEMPLATE_DESCRIPTIONS: Record<string, string> = {
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

export function syncTaiLieuDirectories() {
  const syncStats = { syncedToPublic: 0, syncedToTaiLieu: 0 }
  if (!fs.existsSync(TAI_LIEU_SRC_DIR) || !fs.existsSync(PUBLIC_TAI_LIEU_DIR)) {
    return syncStats
  }

  function walkAndCopy(sourceDir: string, targetDir: string, isToPublic: boolean) {
    if (!fs.existsSync(sourceDir)) return
    const entries = fs.readdirSync(sourceDir, { withFileTypes: true })
    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === '_BACKUP_GOC' || entry.name === '__pycache__' || entry.name === 'static' || entry.name === 'templates') {
        continue
      }
      const srcPath = path.join(sourceDir, entry.name)
      const tgtPath = path.join(targetDir, entry.name)

      if (entry.isDirectory()) {
        if (!fs.existsSync(tgtPath)) fs.mkdirSync(tgtPath, { recursive: true })
        walkAndCopy(srcPath, tgtPath, isToPublic)
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase()
        if (!['.docx', '.xlsx', '.pdf'].includes(ext)) continue

        let shouldCopy = false
        if (!fs.existsSync(tgtPath)) {
          if (!isToPublic && ext === '.pdf') {
            const docxSibling = path.join(sourceDir, entry.name.replace(/\.pdf$/i, '.docx'))
            const xlsxSibling = path.join(sourceDir, entry.name.replace(/\.pdf$/i, '.xlsx'))
            if (fs.existsSync(docxSibling) || fs.existsSync(xlsxSibling)) continue
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

export function scanTaiLieuDirectory(): TaiLieuItem[] {
  if (!fs.existsSync(PUBLIC_TAI_LIEU_DIR)) {
    return TAI_LIEU_ITEMS
  }

  try {
    const existingMap = new Map<string, TaiLieuItem>()
    let maxIdNum = 0

    for (const item of TAI_LIEU_ITEMS) {
      existingMap.set(item.filename, item)
      existingMap.set(item.downloadUrl, item)
      const idMatch = item.id.match(/^tl_(\d+)$/)
      if (idMatch) {
        const num = parseInt(idMatch[1], 10)
        if (num > maxIdNum) maxIdNum = num
      }
    }

    const foundFiles: Array<{
      filename: string
      fullPath: string
      ext: string
      relPath: string
      stat: fs.Stats
    }> = []

    function walk(dir: string) {
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
              stat: fs.statSync(fullPath),
            })
          }
        }
      }
    }

    walk(PUBLIC_TAI_LIEU_DIR)

    const dirFileMap = new Map<string, Set<string>>()
    for (const f of foundFiles) {
      const dir = path.dirname(f.relPath)
      if (!dirFileMap.has(dir)) dirFileMap.set(dir, new Set())
      dirFileMap.get(dir)!.add(f.filename)
    }

    const primaryFiles = foundFiles.filter((f) => {
      if (f.ext !== '.pdf') return true
      const dir = path.dirname(f.relPath)
      const baseWithoutExt = f.filename.slice(0, -4)
      const set = dirFileMap.get(dir)
      if (!set) return true
      return !set.has(`${baseWithoutExt}.docx`) && !set.has(`${baseWithoutExt}.xlsx`)
    })

    const allVersions = readVersionsData()
    const allMetadata = readMetadataOverrides()
    let versionsChanged = false

    const newItems: TaiLieuItem[] = []
    let nextIdCounter = maxIdNum + 1

    for (const f of primaryFiles) {
      const fn = f.filename
      const dir = path.dirname(f.relPath)
      const baseWithoutExt = path.basename(fn, f.ext)
      const topFolder = f.relPath.split('/')[0] || ''

      const fileHash = getFileHash(f.fullPath)
      const dirFiles = dirFileMap.get(dir) || new Set<string>()
      const hasPreviewPdf = f.ext === '.pdf' || dirFiles.has(`${baseWithoutExt}.pdf`)

      const codeMatch = fn.match(/^([A-Z0-9]+(?:_\d+)?)/)
      let code = codeMatch ? codeMatch[1] : 'BM'
      if (fn.includes('KPI')) {
        const parts = fn.split('_')
        code = parts[0] || 'KPI'
      }

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

      const sizeKB = f.stat.size / 1024
      const fileSize = sizeKB < 1024 ? `${sizeKB.toFixed(1)} KB` : `${(sizeKB / 1024).toFixed(1)} MB`
      const downloadUrl = `/tai-lieu/${f.relPath}`

      const existing = existingMap.get(fn) || existingMap.get(downloadUrl)
      const itemId = existing ? existing.id : `tl_${nextIdCounter++}`

      const yearMatch = fn.match(/\b(202\d)\b/)
      const year = existing?.year || (yearMatch ? parseInt(yearMatch[1], 10) : 2026)

      // Versioning management
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
          createdAt: new Date().toISOString(),
        }
        allVersions[itemId] = [baseEntry]
        versionsChanged = true
      } else {
        for (const v of verHistory) {
          v.version = formatVersionString(v.version)
        }
        const latestVer = verHistory[0]
        currentVersion = latestVer.version

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
            createdAt: new Date().toISOString(),
          }
          verHistory.unshift(newVersionRecord)
          allVersions[itemId] = verHistory
          currentVersion = nextVer
          versionsChanged = true
        } else if (!latestVer.fileHash && fileHash) {
          latestVer.fileHash = fileHash
          latestVer.fileSize = fileSize
          allVersions[itemId] = verHistory
          versionsChanged = true
        }
      }

      let item: TaiLieuItem

      if (existing) {
        item = {
          ...existing,
          id: itemId,
          filename: fn,
          fileType: f.ext.replace('.', '') as 'xlsx' | 'docx' | 'pdf',
          fileSize,
          downloadUrl,
          hasPreviewPdf,
          version: currentVersion,
          fileHash,
          lastModified: f.stat.mtime.toISOString(),
        }
      } else {
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

        item = {
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
          fileType: f.ext.replace('.', '') as 'xlsx' | 'docx' | 'pdf',
          fileSize,
          downloadUrl,
          tags,
          hasPreviewPdf,
          version: currentVersion,
          fileHash,
          lastModified: f.stat.mtime.toISOString(),
        }
      }

      // Merge metadata overrides if any
      const meta = allMetadata[itemId] || allMetadata[fn] || allMetadata[downloadUrl]
      if (meta) {
        if (meta.title) item.title = meta.title
        if (meta.code) item.code = meta.code
        if (meta.description) item.description = meta.description
        if (meta.category) item.category = meta.category
        if (meta.categoryLabel) item.categoryLabel = meta.categoryLabel
        if (meta.year) item.year = meta.year
        if (meta.tags) item.tags = meta.tags
        if (meta.featured !== undefined) item.featured = meta.featured
        if (meta.isHot !== undefined) item.isHot = meta.isHot
        if (meta.highlights !== undefined) item.highlights = meta.highlights
        if (meta.isHidden !== undefined) item.isHidden = meta.isHidden
        if (meta.googleSheetUrl !== undefined) item.googleSheetUrl = meta.googleSheetUrl
        if (meta.googleDocUrl !== undefined) item.googleDocUrl = meta.googleDocUrl
        if (meta.googleDriveUrl !== undefined) item.googleDriveUrl = meta.googleDriveUrl
      }

      newItems.push(item)
    }

    if (versionsChanged) {
      writeVersionsData(allVersions)
    }

    const catOrder: Record<string, number> = { nhan_su: 1, hop_dong: 2, kpi: 3, ke_toan: 4, thue: 5, bhxh: 6 }
    newItems.sort((a, b) => {
      const oA = catOrder[a.category] || 99
      const oB = catOrder[b.category] || 99
      if (oA !== oB) return oA - oB
      return a.code.localeCompare(b.code, undefined, { numeric: true })
    })

    return newItems
  } catch (err) {
    console.error('Lỗi khi quét thư mục biểu mẫu:', err)
    return TAI_LIEU_ITEMS
  }
}

export function writeTaiLieuDataFile(items: TaiLieuItem[]): boolean {
  try {
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
  highlights?: string[]
  isHidden?: boolean
  googleSheetUrl?: string
  googleDocUrl?: string
  googleDriveUrl?: string
}

export function getPreviewPdfUrl(item: TaiLieuItem): string {
  if (item.fileType === 'pdf') return item.downloadUrl
  return item.downloadUrl.replace(/\\.(docx|xlsx)$/i, '.pdf')
}

export const TAI_LIEU_ITEMS: TaiLieuItem[] = ${JSON.stringify(items, null, 2)};
`
    fs.writeFileSync(DATA_FILE, content, 'utf-8')
    return true
  } catch (err) {
    console.error('Lỗi khi ghi tai-lieu-data.ts:', err)
    return false
  }
}

export function syncAndUpdateAll() {
  const syncStats = syncTaiLieuDirectories()
  const items = scanTaiLieuDirectory()
  writeTaiLieuDataFile(items)
  return {
    success: true,
    count: items.length,
    syncStats,
    items,
  }
}
