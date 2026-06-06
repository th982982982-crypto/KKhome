// Phân loại tài liệu pháp luật theo file Excel "danh sach luat".
// Module client-safe: KHÔNG import node (path/fs). registry.ts giữ dữ liệu + filePath (server-only);
// catalog.ts chỉ chứa taxonomy + helper thuần để client (lọc, nhóm, thống kê) dùng được.
import type { LegalDoc } from './registry'

// Cập nhật mỗi khi thêm/sửa văn bản mới vào registry
export const REGISTRY_UPDATED_AT = '2026-06-06'

export type DocType =
  | 'Luật'
  | 'Nghị định'
  | 'Thông tư'
  | 'Văn bản hợp nhất'
  | 'Công văn'
  | 'Mẫu biểu'
  | 'Khác'

// Thứ tự hiển thị badge / bộ lọc theo Loại văn bản
export const DOCTYPE_ORDER: DocType[] = [
  'Luật',
  'Nghị định',
  'Thông tư',
  'Văn bản hợp nhất',
  'Công văn',
  'Mẫu biểu',
  'Khác',
]

// Thứ tự hiển thị các khu vực theo Phân loại (chủ đề)
export const CATEGORY_ORDER = [
  'Chế độ kế toán',
  'Thuế TNDN',
  'Thuế GTGT',
  'Thuế TNCN',
  'Thuế TTĐB',
  'Thuế XNK',
  'Quản lý thuế',
  'Thuế Nhà thầu (FCT)',
  'HKD, CNKD',
  'Khác',
] as const

export type Category = (typeof CATEGORY_ORDER)[number]

// Metadata trình bày cho từng chủ đề (mô tả ngắn + gradient cho icon)
export const CATEGORY_META: Record<string, { desc: string; gradient: string; iconColor: string }> = {
  'Chế độ kế toán': { desc: 'Hệ thống tài khoản, sổ sách, báo cáo tài chính', gradient: 'from-indigo-100 to-violet-50 dark:from-indigo-950/50 dark:to-violet-950/30', iconColor: 'text-indigo-600 dark:text-indigo-400' },
  'Thuế TNDN': { desc: 'Thuế thu nhập doanh nghiệp', gradient: 'from-emerald-100 to-teal-50 dark:from-emerald-950/50 dark:to-teal-950/30', iconColor: 'text-emerald-600 dark:text-emerald-400' },
  'Thuế GTGT': { desc: 'Thuế giá trị gia tăng', gradient: 'from-sky-100 to-cyan-50 dark:from-sky-950/50 dark:to-cyan-950/30', iconColor: 'text-sky-600 dark:text-sky-400' },
  'Thuế TNCN': { desc: 'Thuế thu nhập cá nhân', gradient: 'from-amber-100 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/30', iconColor: 'text-amber-600 dark:text-amber-400' },
  'Thuế TTĐB': { desc: 'Thuế tiêu thụ đặc biệt', gradient: 'from-rose-100 to-pink-50 dark:from-rose-950/50 dark:to-pink-950/30', iconColor: 'text-rose-600 dark:text-rose-400' },
  'Thuế XNK': { desc: 'Thuế xuất khẩu, nhập khẩu & hải quan', gradient: 'from-cyan-100 to-blue-50 dark:from-cyan-950/50 dark:to-blue-950/30', iconColor: 'text-cyan-600 dark:text-cyan-400' },
  'Quản lý thuế': { desc: 'Đăng ký, kê khai, nộp, thanh tra thuế', gradient: 'from-violet-100 to-purple-50 dark:from-violet-950/50 dark:to-purple-950/30', iconColor: 'text-violet-600 dark:text-violet-400' },
  'Thuế Nhà thầu (FCT)': { desc: 'Nghĩa vụ thuế nhà thầu nước ngoài', gradient: 'from-fuchsia-100 to-pink-50 dark:from-fuchsia-950/50 dark:to-pink-950/30', iconColor: 'text-fuchsia-600 dark:text-fuchsia-400' },
  'HKD, CNKD': { desc: 'Hộ kinh doanh, cá nhân kinh doanh', gradient: 'from-lime-100 to-green-50 dark:from-lime-950/50 dark:to-green-950/30', iconColor: 'text-lime-600 dark:text-lime-400' },
  'Khác': { desc: 'Nghị quyết và văn bản khác', gradient: 'from-slate-100 to-gray-50 dark:from-slate-900/60 dark:to-gray-900/40', iconColor: 'text-slate-600 dark:text-slate-400' },
}

// Màu badge theo Loại văn bản
export const DOCTYPE_BADGE: Record<DocType, string> = {
  'Luật': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
  'Nghị định': 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300',
  'Thông tư': 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300',
  'Văn bản hợp nhất': 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  'Công văn': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300',
  'Mẫu biểu': 'bg-pink-100 text-pink-700 dark:bg-pink-950/50 dark:text-pink-300',
  'Khác': 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
}

// Taxonomy theo slug — nguồn duy nhất gán Phân loại + Loại VB cho các văn bản đã biên dịch (registry).
type Taxon = { docType: DocType; categories: Category[]; hasForms?: boolean }
export const DOC_TAXONOMY: Record<string, Taxon> = {
  // Chế độ kế toán
  tt99: { docType: 'Thông tư', categories: ['Chế độ kế toán'], hasForms: true },
  tt133: { docType: 'Thông tư', categories: ['Chế độ kế toán'], hasForms: true },
  tt58: { docType: 'Thông tư', categories: ['Chế độ kế toán'], hasForms: true },
  tt152: { docType: 'Thông tư', categories: ['Chế độ kế toán', 'HKD, CNKD'], hasForms: true },
  // Thuế TNDN
  'luat-67': { docType: 'Luật', categories: ['Thuế TNDN'] },
  nd320: { docType: 'Nghị định', categories: ['Thuế TNDN'] },
  tt20: { docType: 'Thông tư', categories: ['Thuế TNDN'], hasForms: true },
  // Thuế GTGT
  'luat-48': { docType: 'Luật', categories: ['Thuế GTGT'] },
  'luat-149': { docType: 'Luật', categories: ['Thuế GTGT'] },
  nd181: { docType: 'Nghị định', categories: ['Thuế GTGT'], hasForms: true },
  nd359: { docType: 'Nghị định', categories: ['Thuế GTGT'] },
  nd144: { docType: 'Nghị định', categories: ['Thuế GTGT'], hasForms: true },
  tt69: { docType: 'Thông tư', categories: ['Thuế GTGT'], hasForms: true },
  // Thuế TNCN
  'luat-109': { docType: 'Luật', categories: ['Thuế TNCN'] },
  'luat-09': { docType: 'Luật', categories: ['Thuế TNDN', 'Thuế GTGT', 'Thuế TNCN', 'Thuế TTĐB'] },
  // Thuế TTĐB
  'luat-66': { docType: 'Luật', categories: ['Thuế TTĐB'] },
  nd360: { docType: 'Nghị định', categories: ['Thuế TTĐB'] },
  tt158: { docType: 'Thông tư', categories: ['Thuế TTĐB'], hasForms: true },
  // Thuế XNK
  nd134: { docType: 'Nghị định', categories: ['Thuế XNK'] },
  nd18: { docType: 'Nghị định', categories: ['Thuế XNK'] },
  nd182: { docType: 'Nghị định', categories: ['Thuế XNK'] },
  tt39: { docType: 'Thông tư', categories: ['Thuế XNK'] },
  tt06: { docType: 'Thông tư', categories: ['Thuế XNK'], hasForms: true },
  // Quản lý thuế
  'luat-108': { docType: 'Luật', categories: ['Quản lý thuế'] },
  'luat-38': { docType: 'Luật', categories: ['Quản lý thuế'] },
  nd68: { docType: 'Nghị định', categories: ['Quản lý thuế', 'HKD, CNKD'] },
  tt18: { docType: 'Thông tư', categories: ['Quản lý thuế', 'HKD, CNKD'], hasForms: true },
}

// Hình dạng nhẹ, serializable để truyền từ Server Component → Client Component
export interface CatalogDoc {
  slug: string
  title: string
  shortTitle: string
  description: string
  effectiveDate: string
  docType: DocType
  categories: string[]
  status: 'available' | 'coming-soon'
  hasForms: boolean
  crossRefsCount: number
}

// 5 văn bản có trong file Excel nhưng chưa biên dịch → hiển thị thẻ "Sắp cập nhật".
export const COMING_SOON: CatalogDoc[] = [
  { slug: 'soon-luat-107', title: 'Luật 107/2016/QH13 — Luật Thuế Xuất khẩu, Nhập khẩu', shortTitle: 'Luật 107/2016', description: 'Luật Thuế XNK hiện hành. Đối tượng chịu thuế, biểu thuế, miễn/giảm/hoàn thuế xuất nhập khẩu.', effectiveDate: '2016-09-01', docType: 'Luật', categories: ['Thuế XNK'], status: 'coming-soon', hasForms: false, crossRefsCount: 0 },
  { slug: 'soon-tt38', title: 'TT 38/2015/TT-BTC — Thủ tục hải quan, thuế XNK', shortTitle: 'TT 38/2015', description: 'Thủ tục hải quan; kiểm tra, giám sát hải quan; thuế xuất khẩu, nhập khẩu và quản lý thuế hàng hóa XNK.', effectiveDate: '2015-04-01', docType: 'Thông tư', categories: ['Thuế XNK'], status: 'coming-soon', hasForms: false, crossRefsCount: 0 },
  { slug: 'soon-tt103', title: 'TT 103/2014/TT-BTC — Thuế nhà thầu nước ngoài', shortTitle: 'TT 103/2014', description: 'Nghĩa vụ thuế áp dụng đối với tổ chức, cá nhân nước ngoài kinh doanh hoặc có thu nhập tại Việt Nam.', effectiveDate: '2014-10-01', docType: 'Thông tư', categories: ['Thuế Nhà thầu (FCT)'], status: 'coming-soon', hasForms: false, crossRefsCount: 0 },
  { slug: 'soon-nq110', title: 'Nghị quyết 110/2025/UBTVQH15 — Giảm trừ gia cảnh TNCN', shortTitle: 'NQ 110/2025', description: 'Điều chỉnh mức giảm trừ gia cảnh của thuế thu nhập cá nhân.', effectiveDate: '2026-01-01', docType: 'Khác', categories: ['Thuế TNCN'], status: 'coming-soon', hasForms: false, crossRefsCount: 0 },
  { slug: 'soon-nq204', title: 'Nghị quyết 204/2025/QH15 — Giảm thuế GTGT', shortTitle: 'NQ 204/2025', description: 'Chính sách giảm thuế giá trị gia tăng.', effectiveDate: '2026-01-01', docType: 'Khác', categories: ['Thuế GTGT'], status: 'coming-soon', hasForms: false, crossRefsCount: 0 },
]

const FALLBACK: Taxon = { docType: 'Khác', categories: ['Khác'] }

// Gộp dữ liệu registry (server) với taxonomy + các mục "sắp có" thành danh mục serializable.
export function buildCatalog(docs: LegalDoc[]): CatalogDoc[] {
  const available: CatalogDoc[] = docs.map((d) => {
    const t = DOC_TAXONOMY[d.slug] ?? FALLBACK
    return {
      slug: d.slug,
      title: d.title,
      shortTitle: d.shortTitle,
      description: d.description,
      effectiveDate: d.effectiveDate,
      docType: t.docType,
      categories: t.categories,
      status: 'available',
      hasForms: !!t.hasForms,
      crossRefsCount: d.crossRefs.length,
    }
  })
  return [...available, ...COMING_SOON]
}

// Nhóm danh mục theo CATEGORY_ORDER; bỏ chủ đề rỗng. Văn bản đa chủ đề xuất hiện ở nhiều nhóm.
export function groupByCategory(catalog: CatalogDoc[]): { category: string; docs: CatalogDoc[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    docs: catalog.filter((d) => d.categories.includes(category)),
  })).filter((g) => g.docs.length > 0)
}

export interface LegalStats {
  total: number
  available: number
  comingSoon: number
  withForms: number
  byDocType: Record<string, number>
  latestEffectiveDate?: string
}

export function computeStats(catalog: CatalogDoc[]): LegalStats {
  const available = catalog.filter((d) => d.status === 'available')
  const byDocType: Record<string, number> = {}
  for (const t of DOCTYPE_ORDER) byDocType[t] = available.filter((d) => d.docType === t).length
  const latestEffectiveDate = available
    .map((d) => d.effectiveDate)
    .filter(Boolean)
    .sort()
    .at(-1)
  return {
    total: catalog.length,
    available: available.length,
    comingSoon: catalog.length - available.length,
    withForms: available.filter((d) => d.hasForms).length,
    byDocType,
    latestEffectiveDate,
  }
}
