// Danh mục biểu mẫu hợp nhất cho TẤT CẢ văn bản có biểu mẫu (dùng cho trang admin).
// - TT99: lấy từ tt99-forms.ts (106 mẫu, nhóm theo Phụ lục)
// - 8 văn bản còn lại: lấy từ forms-extra.json (sinh bởi scripts/build-forms-registry.py)
// Module client-safe: không import node.
import { TT99_FORMS, PL_LABELS } from './tt99-forms'
import extra from './forms-extra.json'

export interface FormItem {
  code: string
  title: string
  file: string // giá trị `file` truyền lên /api/legal/forms (TT99: tên đầy đủ; khác: mã)
  group: string // khóa nhóm (Phụ lục) — '' nếu không nhóm
  groupLabel: string // nhãn hiển thị của nhóm
}

export interface DocForms {
  slug: string
  label: string // nhãn ngắn (tab)
  fullLabel: string // mô tả đầy đủ
  forms: FormItem[]
}

const DOC_META: Record<string, { label: string; full: string }> = {
  tt99: { label: 'TT 99/2025', full: 'Chế độ kế toán doanh nghiệp' },
  tt133: { label: 'TT 133/2016', full: 'Kế toán DN nhỏ và vừa' },
  tt58: { label: 'TT 58/2026', full: 'Kế toán DN siêu nhỏ' },
  tt152: { label: 'TT 152/2025', full: 'Kế toán hộ kinh doanh' },
  tt20: { label: 'TT 20/2026', full: 'Hướng dẫn Luật Thuế TNDN & NĐ 320' },
  nd181: { label: 'NĐ 181/2025', full: 'Hướng dẫn Luật Thuế GTGT' },
  nd144: { label: 'NĐ 144/2026', full: 'Sửa đổi Nghị định về thuế' },
  tt69: { label: 'TT 69/2025', full: 'Hướng dẫn Luật Thuế GTGT' },
  tt158: { label: 'TT 158/2025', full: 'Hướng dẫn Luật Thuế TTĐB' },
  tt18: { label: 'TT 18/2026', full: 'Hồ sơ, thủ tục quản lý thuế' },
  tt06: { label: 'TT 06/2021', full: 'Quản lý thuế hàng hóa XNK' },
}

// Thứ tự hiển thị trong trang admin
export const FORMS_DOC_ORDER = ['tt99', 'tt133', 'tt58', 'tt152', 'tt20', 'nd181', 'nd144', 'tt69', 'tt158', 'tt18', 'tt06']

const extraMap = extra as Record<string, { code: string; title: string }[]>

function buildDoc(slug: string): DocForms {
  const meta = DOC_META[slug] ?? { label: slug.toUpperCase(), full: '' }

  if (slug === 'tt99') {
    const forms: FormItem[] = TT99_FORMS.map((f) => ({
      code: f.code,
      title: f.title,
      file: f.file,
      group: f.pl,
      groupLabel: PL_LABELS[f.pl] ?? f.pl,
    }))
    return { slug, label: meta.label, fullLabel: meta.full, forms }
  }

  const forms: FormItem[] = (extraMap[slug] ?? []).map((f) => ({
    code: f.code,
    title: f.title,
    file: f.code,
    group: '',
    groupLabel: 'Biểu mẫu',
  }))
  return { slug, label: meta.label, fullLabel: meta.full, forms }
}

export const FORMS_BY_DOC: Record<string, DocForms> = Object.fromEntries(
  FORMS_DOC_ORDER.map((slug) => [slug, buildDoc(slug)])
)

export const TOTAL_FORMS = FORMS_DOC_ORDER.reduce((n, s) => n + FORMS_BY_DOC[s].forms.length, 0)
