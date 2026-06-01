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
      { targetSlug: 'tt99', label: 'Điều 9 — Chi phí được trừ', description: 'Hướng dẫn hạch toán chi phí được trừ tại TT99' },
      { targetSlug: 'tt99', label: 'Điều 10 — Thuế suất TNDN 20%', description: 'Bút toán thuế TNDN phải nộp (TK 3334) tại TT99' },
      { targetSlug: 'tt133', label: 'Điều 10 — Thuế suất 17% cho SME', description: 'DN nhỏ vừa áp dụng TT133 + thuế suất 17% Luật 67' },
      { targetSlug: 'tt58', label: 'Điều 10 — Thuế suất 15% cho DNSN', description: 'DN siêu nhỏ áp dụng TT58 + thuế suất 15% Luật 67' },
      { targetSlug: 'tt152', label: 'Điều 2, 11 — Hộ kinh doanh nộp thuế', description: 'HKD áp dụng TT152 + tính thuế theo % doanh thu (Điều 11)' },
      { targetSlug: 'tt99', label: 'Điều 12–14 — Ưu đãi thuế', description: 'Hạch toán thu nhập được miễn/giảm thuế tại TT99' },
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
      { targetSlug: 'luat-67', label: 'Nghĩa vụ thuế → Luật 67', description: 'Điều 1 TT99: nghĩa vụ thuế xác định theo Luật 67/2025/QH15' },
      { targetSlug: 'luat-67', label: 'Thuế suất TNDN 20%/15%/10%', description: 'Xem Điều 10 Luật 67 về các mức thuế suất áp dụng' },
      { targetSlug: 'tt133', label: 'TT99 bổ sung TT133 (SME)', description: 'DN nhỏ vừa có thể chuyển từ TT133 sang TT99 khi tăng quy mô' },
      { targetSlug: 'tt58', label: 'DNSN vượt ngưỡng → TT99', description: 'Khi DN siêu nhỏ vượt tiêu chí → chuyển sang TT99' },
    ],
  },
  {
    slug: 'tt133',
    title: 'TT 133/2016/TT-BTC — Kế toán DN Nhỏ và Vừa',
    shortTitle: 'TT 133/2016',
    description: 'Chế độ kế toán cho DN nhỏ và vừa, hiệu lực 01/01/2017. Gồm 93 điều: hệ thống TK, BCTC, chứng từ, sổ sách.',
    effectiveDate: '2017-01-01',
    filePath: path.join(process.cwd(), 'src/legal-docs/tt133/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'tt99', label: 'Chuyển sang TT99 khi tăng quy mô', description: 'TT99 thay thế TT200/2014 và bổ sung TT133 cho DN vừa lớn' },
      { targetSlug: 'tt58', label: 'DNSN trong nhóm SME → TT58', description: 'DN siêu nhỏ dưới ngưỡng SME áp dụng TT58 thay TT133' },
      { targetSlug: 'luat-67', label: 'Thuế suất TNDN 17% cho SME', description: 'Điều 10 Luật 67: DN nhỏ vừa (3–50 tỷ) áp thuế suất 17%' },
      { targetSlug: 'luat-67', label: 'Chi phí được trừ (Điều 9)', description: 'Điều kiện chi phí hợp lệ khi hạch toán theo TT133' },
    ],
  },
  {
    slug: 'tt58',
    title: 'TT 58/2026/TT-BTC — Kế toán DN Siêu nhỏ',
    shortTitle: 'TT 58/2026',
    description: 'Chế độ kế toán đơn giản hóa cho DN siêu nhỏ, hiệu lực 01/07/2026. Thay thế TT132/2018.',
    effectiveDate: '2026-07-01',
    filePath: path.join(process.cwd(), 'src/legal-docs/tt58/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'tt133', label: 'Nâng cấp → TT133 khi tăng quy mô', description: 'DNSN tăng quy mô lên SME → chuyển sang TT133' },
      { targetSlug: 'tt99', label: 'DNSN vượt ngưỡng → TT99', description: 'Khi vượt tiêu chí siêu nhỏ lên DN lớn hơn → áp dụng TT99' },
      { targetSlug: 'luat-67', label: 'Thuế TNDN 15% (Điều 10)', description: 'DNSN có doanh thu ≤3 tỷ → thuế suất 15% theo Luật 67' },
      { targetSlug: 'luat-67', label: 'Tính thuế theo % doanh thu (Điều 11)', description: 'DNSN nộp thuế % DT → xem Điều 11 Luật 67' },
      { targetSlug: 'tt152', label: 'HKD thành lập DNSN → TT58', description: 'Hộ kinh doanh chuyển thành DN siêu nhỏ → áp dụng TT58' },
    ],
  },
  {
    slug: 'tt152',
    title: 'TT 152/2025/TT-BTC — Kế toán Hộ Kinh doanh',
    shortTitle: 'TT 152/2025',
    description: 'Chế độ kế toán cho hộ kinh doanh và cá nhân kinh doanh, hiệu lực 01/01/2026. Thay thế TT88/2021.',
    effectiveDate: '2026-01-01',
    filePath: path.join(process.cwd(), 'src/legal-docs/tt152/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'luat-67', label: 'HKD nộp thuế TNDN (Điều 2, 11)', description: 'Điều 2 Luật 67: HKD trong đối tượng nộp thuế; Điều 11: tính thuế %' },
      { targetSlug: 'tt58', label: 'Thành lập DN siêu nhỏ → TT58', description: 'Khi HKD thành lập DN siêu nhỏ → chuyển sang áp dụng TT58' },
      { targetSlug: 'tt133', label: 'Thành lập DN nhỏ vừa → TT133', description: 'Khi HKD thành lập DN đủ điều kiện SME → áp dụng TT133' },
    ],
  },
  // Thêm văn bản mới: bổ sung object và đặt file HTML vào src/legal-docs/[slug]/index.html
]

export function getDocBySlug(slug: string): LegalDoc | undefined {
  return LEGAL_DOCS.find((d) => d.slug === slug)
}
