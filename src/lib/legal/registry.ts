import path from 'path'

export interface CrossRef {
  targetSlug: string
  label: string
  description: string
  targetAnchor?: string  // ID của điều khoản cụ thể trong tài liệu đích
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
      { targetSlug: 'tt99', label: 'Điều 9 — Chi phí được trừ → hạch toán TK 642', description: 'Xem TK 642 Chi phí QLDN trong TT99', targetAnchor: 's98' },
      { targetSlug: 'tt99', label: 'Điều 10 — Thuế suất 20% → hạch toán TK 821', description: 'Xem TK 821 Chi phí thuế TNDN (TT99)', targetAnchor: 's101' },
      { targetSlug: 'tt133', label: 'Điều 10 — Thuế suất 17% SME → TK 821 TT133', description: 'DN SME: xem TK 821 trong TT133', targetAnchor: 'tt133_67' },
      { targetSlug: 'tt58', label: 'Điều 10 — Thuế suất 15% DNSN → TT58 Điều 5', description: 'DN siêu nhỏ: xem Điều 5 TT58 về phương pháp nộp thuế', targetAnchor: 'tt58_5' },
      { targetSlug: 'tt152', label: 'Điều 2, 11 — Hộ kinh doanh nộp thuế', description: 'HKD: xem phạm vi và đối tượng áp dụng TT152', targetAnchor: 'tt152_1' },
      { targetSlug: 'tt99', label: 'Điều 12–14 — Ưu đãi thuế → TK 333 TT99', description: 'Hạch toán thuế phải nộp nhà nước (TK 333)', targetAnchor: 's67' },
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
      { targetSlug: 'luat-67', label: 'Điều 1 TT99 → Luật thuế (Điều 2 đối tượng)', description: 'Nghĩa vụ thuế xác định theo Luật 67/2025/QH15', targetAnchor: 'taxpayer' },
      { targetSlug: 'luat-67', label: 'TK 821 → Điều 10 thuế suất TNDN', description: 'Xem Điều 10 Luật 67: thuế suất 20%/17%/15%/10%', targetAnchor: 'rates' },
      { targetSlug: 'luat-67', label: 'TK 642 → Điều 9 chi phí được trừ', description: 'Xem Điều 9 Luật 67 về điều kiện chi phí hợp lệ', targetAnchor: 'expenses' },
      { targetSlug: 'luat-67', label: 'TK 333 → Điều 12–14 ưu đãi thuế', description: 'Xem ưu đãi thuế TNDN khi hạch toán TK 333', targetAnchor: 'incentive-rates' },
      { targetSlug: 'tt133', label: 'TT99 bổ sung TT133 — xem TT133 Điều 1', description: 'DN SME chuyển từ TT133 sang TT99', targetAnchor: 'tt133_1' },
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
      { targetSlug: 'luat-67', label: 'TK 821 → Điều 10 thuế suất 17% SME', description: 'DN nhỏ vừa (3–50 tỷ): thuế suất 17% theo Luật 67', targetAnchor: 'rates' },
      { targetSlug: 'luat-67', label: 'TK 642 → Điều 9 chi phí được trừ', description: 'Điều kiện chi phí QLDN được trừ khi tính thuế', targetAnchor: 'expenses' },
      { targetSlug: 'tt99', label: 'Tăng quy mô → chuyển sang TT99', description: 'DN vừa lớn: TT99 thay thế TT133 về kế toán', targetAnchor: 's0' },
      { targetSlug: 'tt58', label: 'DN siêu nhỏ → xem TT58 Điều 2', description: 'DNSN dưới ngưỡng SME: áp dụng TT58 thay TT133', targetAnchor: 'tt58_2' },
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
      { targetSlug: 'luat-67', label: 'Điều 5 → Thuế suất 15% (Điều 10 Luật 67)', description: 'DNSN ≤3 tỷ: thuế suất 15% theo Luật 67', targetAnchor: 'rates' },
      { targetSlug: 'luat-67', label: 'Điều 5–6 → Tính thuế theo % DT (Điều 11)', description: 'DNSN nộp thuế % doanh thu: xem Điều 11 Luật 67', targetAnchor: 'method' },
      { targetSlug: 'tt133', label: 'Tăng quy mô → chuyển sang TT133 Điều 1', description: 'DNSN tăng lên SME: xem phạm vi TT133', targetAnchor: 'tt133_1' },
      { targetSlug: 'tt99', label: 'Vượt ngưỡng siêu nhỏ → TT99', description: 'Khi vượt tiêu chí DNSN → chuyển sang TT99', targetAnchor: 's0' },
      { targetSlug: 'tt152', label: 'HKD thành lập DNSN → Điều 1 TT58', description: 'Hộ KD thành lập DN siêu nhỏ: xem phạm vi TT58', targetAnchor: 'tt58_1' },
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
      { targetSlug: 'luat-67', label: 'Điều 1 TT152 → Điều 2 đối tượng nộp thuế', description: 'HKD trong đối tượng nộp thuế: xem Điều 2 Luật 67', targetAnchor: 'taxpayer' },
      { targetSlug: 'luat-67', label: 'Điều 4–6 → Điều 11 tính thuế theo % DT', description: 'HKD tính thuế theo % doanh thu: xem Điều 11 Luật 67', targetAnchor: 'method' },
      { targetSlug: 'tt58', label: 'HKD thành lập DN siêu nhỏ → TT58 Điều 1', description: 'Khi HKD thành lập DN: chuyển sang TT58', targetAnchor: 'tt58_1' },
      { targetSlug: 'tt133', label: 'HKD thành lập DN nhỏ vừa → TT133 Điều 1', description: 'Khi HKD thành lập DN đủ tiêu chí SME: xem TT133', targetAnchor: 'tt133_1' },
    ],
  },
  // Thêm văn bản mới: bổ sung object và đặt file HTML vào src/legal-docs/[slug]/index.html
]

export function getDocBySlug(slug: string): LegalDoc | undefined {
  return LEGAL_DOCS.find((d) => d.slug === slug)
}
