import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { updateTemplates } from './update-templates.mjs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT_DIR = path.resolve(__dirname, '..')

const TAI_LIEU_SRC_DIR = path.join(ROOT_DIR, 'Tai Lieu')
const PUBLIC_TAI_LIEU_DIR = path.join(ROOT_DIR, 'public', 'tai-lieu')
const VBAN_DIR = path.join(ROOT_DIR, 'VBAN')

let debounceTimer = null

function handleDirChange(folderLabel, filename) {
  if (!filename) return
  const ext = path.extname(filename).toLowerCase()
  if (filename.startsWith('.') || filename.startsWith('~$') || filename.includes('_BACKUP_GOC')) {
    return
  }
  if (!['.docx', '.xlsx', '.pdf'].includes(ext)) {
    return
  }

  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    const timestamp = new Date().toLocaleTimeString('vi-VN')
    console.log(`\n[${timestamp}] 🔔 Phát hiện thay đổi trong "${folderLabel}": ${filename}`)
    console.log('⚡ Đang tự động cập nhật biểu mẫu...')
    try {
      const res = updateTemplates()
      if (res.bumpedItems && res.bumpedItems.length > 0) {
        for (const b of res.bumpedItems) {
          console.log(`⭐ [NÂNG CẤP PHIÊN BẢN] ${b.filename}: ${b.oldVersion} -> ${b.newVersion}`)
        }
      }
      console.log(`✅ [${new Date().toLocaleTimeString('vi-VN')}] Tự động cập nhật hoàn tất! Hiện có ${res.count} biểu mẫu.`)
    } catch (err) {
      console.error('❌ Lỗi khi tự động cập nhật:', err)
    }
  }, 600)
}

console.log('\n===============================================================')
console.log('       KK HOME - TRÌNH THEO DÕI TỰ ĐỘNG THƯ MỤC BIỂU MẪU       ')
console.log('===============================================================')
console.log(`[+] Đang theo dõi thư mục: ${TAI_LIEU_SRC_DIR}`)
console.log(`[+] Đang theo dõi thư mục: ${PUBLIC_TAI_LIEU_DIR}`)
console.log('Khi bạn thêm, sửa hoặc xóa file biểu mẫu (.docx, .xlsx, .pdf):')
console.log('Hệ thống sẽ TỰ ĐỘNG đồng bộ và cập nhật danh mục ngay lập tức!')
console.log('Nhấn Ctrl + C để dừng.')
console.log('===============================================================\n')

// Initial run
updateTemplates()

// Watch Tai Lieu directory if exists
if (fs.existsSync(TAI_LIEU_SRC_DIR)) {
  try {
    fs.watch(TAI_LIEU_SRC_DIR, { recursive: true }, (event, filename) => {
      handleDirChange('Tai Lieu', filename)
    })
  } catch (err) {
    console.warn('Không thể thiết lập watch cho thư mục Tai Lieu:', err.message)
  }
}

// Watch public/tai-lieu directory if exists
if (fs.existsSync(PUBLIC_TAI_LIEU_DIR)) {
  try {
    fs.watch(PUBLIC_TAI_LIEU_DIR, { recursive: true }, (event, filename) => {
      handleDirChange('public/tai-lieu', filename)
    })
  } catch (err) {
    console.warn('Không thể thiết lập watch cho thư mục public/tai-lieu:', err.message)
  }
}

// Watch VBAN directory if exists
if (fs.existsSync(VBAN_DIR)) {
  try {
    fs.watch(VBAN_DIR, { recursive: true }, (event, filename) => {
      if (filename && filename.endsWith('.docx') && !filename.startsWith('~$')) {
        const timestamp = new Date().toLocaleTimeString('vi-VN')
        console.log(`\n[${timestamp}] 📜 Phát hiện văn bản pháp luật trong VBAN: ${filename}`)
        console.log('💡 Gợi ý: Có thể chạy "python scripts/docx-to-legal.py" để tích hợp vào thư viện pháp luật.')
      }
    })
  } catch (err) {
    console.warn('Không thể thiết lập watch cho thư mục VBAN:', err.message)
  }
}
