import path from 'path'

export interface CrossRef {
  targetSlug: string
  label: string
  description: string
}

export interface LegalDoc {
  slug: string
  title: string
  shortTitle: string
  description: string
  effectiveDate: string
  filePath: string
  theme: 'light' | 'dark'
  crossRefs: CrossRef[]
}

export const LEGAL_DOCS: LegalDoc[] = [
  {
    slug: 'luat-67',
    title: 'Luật 67/2025/QH15 — Thuế Thu nhập Doanh nghiệp',
    shortTitle: 'Luật 67/2025',
    description: 'Luật Thuế TNDN mới, hiệu lực 01/10/2025. Quy định thuế suất, chi phí được trừ, ưu đãi thuế.',
    effectiveDate: '2025-10-01',
    filePath: path.join(process.cwd(), 'src/legal-docs/luat-67/index.html'),
    theme: 'light',
    crossRefs: [
      {
        targetSlug: 'tt99',
        label: 'Điều 9 — Chi phí được trừ',
        description: 'Xem hướng dẫn hạch toán các khoản chi phí được trừ theo TT99',
      },
      {
        targetSlug: 'tt99',
        label: 'Điều 10 — Thuế suất TNDN',
        description: 'Xem bút toán hạch toán thuế TNDN phải nộp (TK 3334) tại TT99',
      },
      {
        targetSlug: 'tt99',
        label: 'Điều 12–14 — Ưu đãi thuế',
        description: 'Xem hạch toán thu nhập được miễn/giảm thuế tại TT99',
      },
      {
        targetSlug: 'tt99',
        label: 'Điều 17 — Quỹ KHCN',
        description: 'Xem hạch toán trích lập và sử dụng Quỹ Khoa học Công nghệ tại TT99',
      },
    ],
  },
  {
    slug: 'tt99',
    title: 'TT 99/2025/TT-BTC — Chế độ Kế toán Doanh nghiệp',
    shortTitle: 'TT 99/2025',
    description: 'Thông tư kế toán DN thay thế TT200/2014, hiệu lực 01/01/2026. Gồm hệ thống TK, biểu mẫu, sổ sách.',
    effectiveDate: '2026-01-01',
    filePath: path.join(process.cwd(), 'src/legal-docs/tt99/index.html'),
    theme: 'dark',
    crossRefs: [
      {
        targetSlug: 'luat-67',
        label: 'Điều 1 TT99 → Luật thuế',
        description: 'Nghĩa vụ thuế của DN xác định theo Luật 67/2025/QH15',
      },
      {
        targetSlug: 'luat-67',
        label: 'Thuế suất TNDN (20%/15%/10%)',
        description: 'Xem Điều 10 Luật 67 về các mức thuế suất áp dụng',
      },
      {
        targetSlug: 'luat-67',
        label: 'Chi phí được trừ khi tính thuế',
        description: 'Xem Điều 9 Luật 67 về điều kiện chi phí hợp lệ',
      },
      {
        targetSlug: 'luat-67',
        label: 'Ưu đãi thuế TNDN',
        description: 'Xem Điều 12–14 Luật 67 về điều kiện được hưởng ưu đãi',
      },
    ],
  },
  // Thêm văn bản mới tại đây — chỉ cần bổ sung object và đặt file HTML vào src/legal-docs/[slug]/index.html
]

export function getDocBySlug(slug: string): LegalDoc | undefined {
  return LEGAL_DOCS.find((d) => d.slug === slug)
}
