// Quy ước lưu trữ biểu mẫu trên Supabase Storage (bucket "legal-forms") — dùng chung
// cho cả route tải về (/api/legal/forms) và route admin upload (/api/admin/legal/upload-form),
// đảm bảo file admin upload đè đúng file người dùng tải.
//
//   TT99  -> folder gốc:  word/<tên đầy đủ>.docx | excel/<tên đầy đủ>.xlsx
//   Khác  -> theo doc:     <doc>/word/<mã>.docx   | <doc>/excel/<mã>.xlsx
//
// `file` là giá trị truyền lên API: TT99 = tên file đầy đủ (kèm .docx); doc khác = mã biểu mẫu.

export interface FormStorage {
  folder: string // thư mục trong bucket
  name: string // tên file đích
  ext: 'docx' | 'xlsx'
  path: string // folder/name
}

export function resolveFormStorage(doc: string, file: string, type: 'word' | 'excel'): FormStorage {
  const ext: 'docx' | 'xlsx' = type === 'excel' ? 'xlsx' : 'docx'

  let name: string
  if (/\.(docx|xlsx)$/i.test(file)) {
    // Đã có đuôi (TT99): đổi .docx -> .xlsx khi cần
    name = type === 'excel' ? file.replace(/\.docx$/i, '.xlsx') : file
  } else {
    // Chỉ là mã biểu mẫu: gắn đuôi
    name = `${file}.${ext}`
  }

  const sub = type === 'word' ? 'word' : 'excel'
  const folder = doc === 'tt99' ? sub : `${doc}/${sub}`
  return { folder, name, ext, path: `${folder}/${name}` }
}
