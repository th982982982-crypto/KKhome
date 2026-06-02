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
      { targetSlug: 'nd320', label: 'Hướng dẫn chi tiết → Nghị định 320/2025', description: 'NĐ 320 quy định chi tiết thi hành Luật 67', targetAnchor: 'nd320_1' },
      { targetSlug: 'nd320', label: 'Điều 9 — Chi phí được trừ → NĐ 320 Điều 9–10', description: 'Chi tiết chi được trừ/không được trừ', targetAnchor: 'nd320_9' },
      { targetSlug: 'nd320', label: 'Điều 10 — Thuế suất → NĐ 320 Điều 11', description: 'Chi tiết thuế suất', targetAnchor: 'nd320_11' },
      { targetSlug: 'tt20', label: 'Thủ tục/hồ sơ → Thông tư 20/2026', description: 'TT 20 hướng dẫn hồ sơ chi được trừ, ưu đãi', targetAnchor: 'tt20_1' },
      { targetSlug: 'tt99', label: 'Điều 9 — Chi phí được trừ → hạch toán TK 642', description: 'Xem TK 642 Chi phí QLDN trong TT99', targetAnchor: 's98' },
      { targetSlug: 'tt99', label: 'Điều 10 — Thuế suất 20% → hạch toán TK 821', description: 'Xem TK 821 Chi phí thuế TNDN (TT99)', targetAnchor: 's101' },
      { targetSlug: 'tt133', label: 'Điều 10 — Thuế suất 17% SME → TK 821 TT133', description: 'DN SME: xem TK 821 trong TT133', targetAnchor: 'tt133_67' },
      { targetSlug: 'tt58', label: 'Điều 10 — Thuế suất 15% DNSN → TT58 Điều 5', description: 'DN siêu nhỏ: xem Điều 5 TT58 về phương pháp nộp thuế', targetAnchor: 'tt58_5' },
      { targetSlug: 'tt152', label: 'Điều 2, 11 — Hộ kinh doanh nộp thuế', description: 'HKD: xem phạm vi và đối tượng áp dụng TT152', targetAnchor: 'tt152_1' },
      { targetSlug: 'tt99', label: 'Điều 12–14 — Ưu đãi thuế → TK 333 TT99', description: 'Hạch toán thuế phải nộp nhà nước (TK 333)', targetAnchor: 's67' },
    ],
  },
  {
    slug: 'nd320',
    title: 'NĐ 320/2025/NĐ-CP — Hướng dẫn chi tiết Luật Thuế TNDN',
    shortTitle: 'NĐ 320/2025',
    description: 'Nghị định quy định chi tiết thi hành Luật Thuế TNDN 67/2025, hiệu lực 15/12/2025. 26 điều, 6 chương.',
    effectiveDate: '2025-12-15',
    filePath: path.join(process.cwd(), 'src/legal-docs/nd320/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'luat-67', label: 'Căn cứ → Luật 67/2025 (Điều 2 đối tượng)', description: 'NĐ chi tiết hóa Luật Thuế TNDN', targetAnchor: 'taxpayer' },
      { targetSlug: 'tt20', label: 'Hồ sơ/thủ tục → Thông tư 20/2026', description: 'TT 20 hướng dẫn hồ sơ chi tiết của NĐ', targetAnchor: 'tt20_1' },
      { targetSlug: 'tt99', label: 'Điều 9 — Chi phí được trừ → TK 642 (TT99)', description: 'Hạch toán chi phí QLDN', targetAnchor: 's98' },
      { targetSlug: 'tt99', label: 'Điều 11 — Thuế suất → TK 821 (TT99)', description: 'Hạch toán thuế TNDN phải nộp', targetAnchor: 's101' },
    ],
  },
  {
    slug: 'tt20',
    title: 'TT 20/2026/TT-BTC — Hướng dẫn Luật TNDN & NĐ 320/2025',
    shortTitle: 'TT 20/2026',
    description: 'Thông tư hướng dẫn hồ sơ/thủ tục theo Luật 67 và NĐ 320, hiệu lực 12/03/2026. 10 điều.',
    effectiveDate: '2026-03-12',
    filePath: path.join(process.cwd(), 'src/legal-docs/tt20/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'nd320', label: 'Căn cứ → Nghị định 320/2025', description: 'TT 20 hướng dẫn chi tiết NĐ 320', targetAnchor: 'nd320_1' },
      { targetSlug: 'luat-67', label: 'Điều 3 — Hồ sơ chi được trừ → Luật Đ9', description: 'Chứng từ chi phí được trừ', targetAnchor: 'expenses' },
      { targetSlug: 'luat-67', label: 'Điều 4 — Hồ sơ ưu đãi → Luật Đ12–14', description: 'Hồ sơ hưởng ưu đãi thuế', targetAnchor: 'incentive-rates' },
      { targetSlug: 'tt99', label: 'Điều 9 — Quỹ KHCN → hạch toán (TT99)', description: 'Hạch toán Quỹ phát triển KHCN', targetAnchor: 's67' },
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
    theme: 'dark',
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
  // ===== Chum thuế GTGT / TNCN / Quản lý thuế =====
  {
    slug: 'luat-48',
    title: 'Luật 48/2024/QH15 — Luật Thuế Giá trị gia tăng',
    shortTitle: 'Luật 48/2024',
    description: 'Luật Thuế GTGT, hiệu lực 01/07/2025. Đối tượng chịu/không chịu thuế, thuế suất, khấu trừ, hoàn thuế.',
    effectiveDate: '2025-07-01',
    filePath: path.join(process.cwd(), 'src/legal-docs/luat-48/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'nd181', label: 'Hướng dẫn chi tiết → Nghị định 181/2025', description: 'NĐ 181 quy định chi tiết thi hành Luật GTGT', targetAnchor: 'nd181_1' },
      { targetSlug: 'tt69', label: 'Hồ sơ, thủ tục → Thông tư 69/2025', description: 'TT 69 hướng dẫn hồ sơ chi tiết Luật GTGT', targetAnchor: 'tt69_1' },
      { targetSlug: 'luat-149', label: 'Sửa đổi, bổ sung → Luật 149/2025', description: 'Luật 149/2025 sửa đổi một số điều Luật GTGT', targetAnchor: 'luat-149_1' },
      { targetSlug: 'luat-67', label: 'GTGT đầu vào → Chi được trừ TNDN (Luật 67 Đ9)', description: 'Liên hệ chi phí được trừ khi tính thuế TNDN', targetAnchor: 'dieu-9' },
    ],
  },
  {
    slug: 'luat-149',
    title: 'Luật 149/2025/QH15 — Sửa đổi, bổ sung Luật Thuế GTGT',
    shortTitle: 'Luật 149/2025',
    description: 'Sửa đổi, bổ sung một số điều của Luật Thuế GTGT 48/2024.',
    effectiveDate: '2026-01-01',
    filePath: path.join(process.cwd(), 'src/legal-docs/luat-149/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'luat-48', label: 'Văn bản gốc → Luật Thuế GTGT 48/2024', description: 'Luật được sửa đổi', targetAnchor: 'luat-48_1' },
    ],
  },
  {
    slug: 'luat-109',
    title: 'Luật 109/2025/QH15 — Luật Thuế Thu nhập cá nhân',
    shortTitle: 'Luật 109/2025',
    description: 'Luật Thuế TNCN (mới), hiệu lực 01/07/2026. Thu nhập chịu thuế, biểu thuế, giảm trừ, quyết toán.',
    effectiveDate: '2026-07-01',
    filePath: path.join(process.cwd(), 'src/legal-docs/luat-109/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'luat-09', label: 'Sửa đổi, bổ sung → Luật 09/2026', description: 'Luật 09/2026 sửa đổi Luật TNCN', targetAnchor: 'luat-09_1' },
      { targetSlug: 'luat-108', label: 'Quản lý, kê khai, nộp thuế → Luật QLT 108/2025', description: 'Thủ tục quản lý thuế áp dụng cho TNCN', targetAnchor: 'luat-108_1' },
      { targetSlug: 'tt152', label: 'Hộ/cá nhân kinh doanh → TT 152/2025', description: 'Kế toán hộ kinh doanh nộp thuế', targetAnchor: 'tt152_1' },
    ],
  },
  {
    slug: 'luat-09',
    title: 'Luật 09/2026/QH16 — Sửa đổi Luật Thuế TNCN, GTGT',
    shortTitle: 'Luật 09/2026',
    description: 'Sửa đổi, bổ sung một số điều của Luật Thuế TNCN, Thuế GTGT và một số luật thuế khác.',
    effectiveDate: '2026-01-01',
    filePath: path.join(process.cwd(), 'src/legal-docs/luat-09/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'luat-109', label: 'Văn bản gốc → Luật Thuế TNCN 109/2025', description: 'Luật được sửa đổi', targetAnchor: 'luat-109_1' },
      { targetSlug: 'luat-48', label: 'Văn bản gốc → Luật Thuế GTGT 48/2024', description: 'Luật được sửa đổi', targetAnchor: 'luat-48_1' },
    ],
  },
  {
    slug: 'luat-108',
    title: 'Luật 108/2025/QH15 — Luật Quản lý thuế',
    shortTitle: 'Luật 108/2025',
    description: 'Luật Quản lý thuế (mới), hiệu lực 01/07/2026. Đăng ký, kê khai, nộp, hoàn, thanh tra, cưỡng chế thuế.',
    effectiveDate: '2026-07-01',
    filePath: path.join(process.cwd(), 'src/legal-docs/luat-108/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'nd68', label: 'Hướng dẫn → Nghị định 68/2026', description: 'Chính sách thuế và quản lý thuế', targetAnchor: 'nd68_1' },
      { targetSlug: 'tt18', label: 'Hồ sơ, thủ tục → Thông tư 18/2026', description: 'TT 18 hướng dẫn hồ sơ, thủ tục quản lý thuế', targetAnchor: 'tt18_1' },
      { targetSlug: 'luat-38', label: 'Thay thế → Luật Quản lý thuế 38/2019', description: 'Luật QLT trước đây', targetAnchor: 'luat-38_1' },
      { targetSlug: 'luat-67', label: 'Áp dụng cho mọi sắc thuế (TNDN, GTGT, TNCN)', description: 'Quản lý thuế áp dụng chung', targetAnchor: 'dieu-1' },
    ],
  },
  {
    slug: 'luat-38',
    title: 'Luật 38/2019/QH14 — Luật Quản lý thuế',
    shortTitle: 'Luật 38/2019',
    description: 'Luật Quản lý thuế hiện hành (2019), 152 điều. Được thay thế bởi Luật 108/2025 từ 01/07/2026.',
    effectiveDate: '2020-07-01',
    filePath: path.join(process.cwd(), 'src/legal-docs/luat-38/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'luat-108', label: 'Được thay thế bởi → Luật QLT 108/2025', description: 'Luật QLT mới (hiệu lực 01/07/2026)', targetAnchor: 'luat-108_1' },
    ],
  },
  {
    slug: 'nd181',
    title: 'NĐ 181/2025/NĐ-CP — Hướng dẫn Luật Thuế GTGT',
    shortTitle: 'NĐ 181/2025',
    description: 'Nghị định quy định chi tiết thi hành Luật Thuế GTGT 48/2024, hiệu lực 01/07/2025.',
    effectiveDate: '2025-07-01',
    filePath: path.join(process.cwd(), 'src/legal-docs/nd181/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'luat-48', label: 'Căn cứ → Luật Thuế GTGT 48/2024', description: 'NĐ chi tiết hóa Luật GTGT', targetAnchor: 'luat-48_1' },
      { targetSlug: 'tt69', label: 'Hồ sơ, thủ tục → Thông tư 69/2025', description: 'TT 69 hướng dẫn chi tiết NĐ 181', targetAnchor: 'tt69_1' },
    ],
  },
  {
    slug: 'nd68',
    title: 'NĐ 68/2026/NĐ-CP — Chính sách thuế và quản lý thuế',
    shortTitle: 'NĐ 68/2026',
    description: 'Nghị định về chính sách thuế và quản lý thuế, hiệu lực kể từ ngày ký (05/03/2026).',
    effectiveDate: '2026-03-05',
    filePath: path.join(process.cwd(), 'src/legal-docs/nd68/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'luat-108', label: 'Căn cứ → Luật Quản lý thuế 108/2025', description: 'NĐ hướng dẫn quản lý thuế', targetAnchor: 'luat-108_1' },
      { targetSlug: 'tt18', label: 'Hồ sơ, thủ tục → Thông tư 18/2026', description: 'TT 18 hướng dẫn chi tiết', targetAnchor: 'tt18_1' },
    ],
  },
  {
    slug: 'nd144',
    title: 'NĐ 144/2026/NĐ-CP — Sửa đổi một số Nghị định về thuế',
    shortTitle: 'NĐ 144/2026',
    description: 'Sửa đổi, bổ sung một số điều của các Nghị định về thuế.',
    effectiveDate: '2026-06-20',
    filePath: path.join(process.cwd(), 'src/legal-docs/nd144/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'nd181', label: 'Liên quan → Nghị định 181/2025 (GTGT)', description: 'NĐ hướng dẫn Luật GTGT', targetAnchor: 'nd181_1' },
    ],
  },
  {
    slug: 'nd359',
    title: 'NĐ 359/2025/NĐ-CP — Sửa đổi một số Nghị định về thuế',
    shortTitle: 'NĐ 359/2025',
    description: 'Sửa đổi, bổ sung một số điều của các Nghị định về thuế.',
    effectiveDate: '2026-01-01',
    filePath: path.join(process.cwd(), 'src/legal-docs/nd359/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'nd181', label: 'Liên quan → Nghị định 181/2025 (GTGT)', description: 'NĐ hướng dẫn Luật GTGT', targetAnchor: 'nd181_1' },
    ],
  },
  {
    slug: 'tt69',
    title: 'TT 69/2025/TT-BTC — Hướng dẫn Luật Thuế GTGT',
    shortTitle: 'TT 69/2025',
    description: 'Thông tư quy định chi tiết một số điều của Luật Thuế GTGT và NĐ 181/2025, hiệu lực 01/07/2025.',
    effectiveDate: '2025-07-01',
    filePath: path.join(process.cwd(), 'src/legal-docs/tt69/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'nd181', label: 'Căn cứ → Nghị định 181/2025', description: 'TT 69 hướng dẫn chi tiết NĐ 181', targetAnchor: 'nd181_1' },
      { targetSlug: 'luat-48', label: 'Căn cứ → Luật Thuế GTGT 48/2024', description: 'Hướng dẫn thi hành Luật GTGT', targetAnchor: 'luat-48_1' },
    ],
  },
  {
    slug: 'tt18',
    title: 'TT 18/2026/TT-BTC — Hồ sơ, thủ tục quản lý thuế',
    shortTitle: 'TT 18/2026',
    description: 'Thông tư quy định hồ sơ, thủ tục quản lý thuế, hiệu lực kể từ ngày ký (05/03/2026).',
    effectiveDate: '2026-03-05',
    filePath: path.join(process.cwd(), 'src/legal-docs/tt18/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'luat-108', label: 'Căn cứ → Luật Quản lý thuế 108/2025', description: 'Hướng dẫn thi hành Luật QLT', targetAnchor: 'luat-108_1' },
      { targetSlug: 'nd68', label: 'Liên quan → Nghị định 68/2026', description: 'Chính sách & quản lý thuế', targetAnchor: 'nd68_1' },
    ],
  },
  // ===== Chum Thuế Tiêu thụ đặc biệt (TTĐB) =====
  {
    slug: 'luat-66',
    title: 'Luật 66/2025/QH15 — Luật Thuế Tiêu thụ đặc biệt',
    shortTitle: 'Luật 66/2025',
    description: 'Luật Thuế TTĐB, hiệu lực 01/01/2026. Đối tượng chịu thuế, giá tính thuế, thuế suất, hoàn/giảm thuế.',
    effectiveDate: '2026-01-01',
    filePath: path.join(process.cwd(), 'src/legal-docs/luat-66/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'nd360', label: 'Hướng dẫn chi tiết → Nghị định 360/2025', description: 'NĐ 360 quy định chi tiết thi hành Luật TTĐB', targetAnchor: 'nd360_1' },
      { targetSlug: 'tt158', label: 'Hồ sơ, thủ tục → Thông tư 158/2025', description: 'TT 158 hướng dẫn hồ sơ chi tiết', targetAnchor: 'tt158_1' },
      { targetSlug: 'luat-48', label: 'Hàng chịu TTĐB cũng chịu GTGT → Luật 48', description: 'Giá tính thuế GTGT gồm cả thuế TTĐB (Luật 48 Đ7)', targetAnchor: 'luat-48_7' },
      { targetSlug: 'luat-108', label: 'Kê khai, nộp, hoàn thuế → Luật QLT 108', description: 'Quản lý thuế áp dụng cho TTĐB', targetAnchor: 'luat-108_1' },
    ],
  },
  {
    slug: 'nd360',
    title: 'NĐ 360/2025/NĐ-CP — Hướng dẫn Luật Thuế TTĐB',
    shortTitle: 'NĐ 360/2025',
    description: 'Nghị định quy định chi tiết thi hành Luật Thuế TTĐB 66/2025, hiệu lực 01/01/2026.',
    effectiveDate: '2026-01-01',
    filePath: path.join(process.cwd(), 'src/legal-docs/nd360/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'luat-66', label: 'Căn cứ → Luật Thuế TTĐB 66/2025', description: 'NĐ chi tiết hóa Luật TTĐB', targetAnchor: 'luat-66_1' },
      { targetSlug: 'tt158', label: 'Hồ sơ, thủ tục → Thông tư 158/2025', description: 'TT 158 hướng dẫn chi tiết NĐ 360', targetAnchor: 'tt158_1' },
    ],
  },
  {
    slug: 'tt158',
    title: 'TT 158/2025/TT-BTC — Hướng dẫn chi tiết NĐ 360 (TTĐB)',
    shortTitle: 'TT 158/2025',
    description: 'Thông tư quy định chi tiết một số điều của NĐ 360/2025 về thuế TTĐB, hiệu lực 01/01/2026. Có biểu mẫu hồ sơ.',
    effectiveDate: '2026-01-01',
    filePath: path.join(process.cwd(), 'src/legal-docs/tt158/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'nd360', label: 'Căn cứ → Nghị định 360/2025', description: 'TT 158 hướng dẫn chi tiết NĐ 360', targetAnchor: 'nd360_1' },
      { targetSlug: 'luat-66', label: 'Căn cứ → Luật Thuế TTĐB 66/2025', description: 'Hướng dẫn thi hành Luật TTĐB', targetAnchor: 'luat-66_1' },
    ],
  },
  // ===== Chum Thuế Xuất nhập khẩu / Hải quan (XNK) =====
  {
    slug: 'nd134',
    title: 'NĐ 134/2016/NĐ-CP — Hướng dẫn Luật Thuế Xuất khẩu, Nhập khẩu',
    shortTitle: 'NĐ 134/2016',
    description: 'Nghị định quy định chi tiết và biện pháp thi hành Luật Thuế XNK 107/2016. Đối tượng chịu thuế, miễn/giảm/hoàn thuế XNK.',
    effectiveDate: '2016-09-01',
    filePath: path.join(process.cwd(), 'src/legal-docs/nd134/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'nd18', label: 'Sửa đổi, bổ sung → Nghị định 18/2021', description: 'NĐ 18/2021 sửa đổi NĐ 134', targetAnchor: 'nd18_1' },
      { targetSlug: 'nd182', label: 'Sửa đổi, bổ sung → Nghị định 182/2025', description: 'NĐ 182/2025 sửa đổi NĐ 134', targetAnchor: 'nd182_1' },
      { targetSlug: 'luat-48', label: 'Thuế NK trong giá tính thuế GTGT → Luật 48 Đ7', description: 'Giá tính GTGT hàng NK gồm thuế nhập khẩu', targetAnchor: 'luat-48_7' },
      { targetSlug: 'luat-108', label: 'Kê khai, nộp, hoàn thuế → Luật QLT 108', description: 'Quản lý thuế áp dụng cho thuế XNK', targetAnchor: 'luat-108_1' },
    ],
  },
  {
    slug: 'nd18',
    title: 'NĐ 18/2021/NĐ-CP — Sửa đổi, bổ sung NĐ 134/2016 (Thuế XNK)',
    shortTitle: 'NĐ 18/2021',
    description: 'Sửa đổi, bổ sung một số điều của NĐ 134/2016 về thuế xuất khẩu, nhập khẩu, hiệu lực 25/04/2021.',
    effectiveDate: '2021-04-25',
    filePath: path.join(process.cwd(), 'src/legal-docs/nd18/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'nd134', label: 'Văn bản gốc → Nghị định 134/2016', description: 'Nghị định được sửa đổi', targetAnchor: 'nd134_1' },
    ],
  },
  {
    slug: 'nd182',
    title: 'NĐ 182/2025/NĐ-CP — Sửa đổi, bổ sung NĐ 134/2016 (Thuế XNK)',
    shortTitle: 'NĐ 182/2025',
    description: 'Sửa đổi, bổ sung một số điều của NĐ 134/2016 về thuế xuất khẩu, nhập khẩu, hiệu lực 01/07/2025.',
    effectiveDate: '2025-07-01',
    filePath: path.join(process.cwd(), 'src/legal-docs/nd182/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'nd134', label: 'Văn bản gốc → Nghị định 134/2016', description: 'Nghị định được sửa đổi', targetAnchor: 'nd134_1' },
    ],
  },
  {
    slug: 'tt06',
    title: 'TT 06/2021/TT-BTC — Hướng dẫn quản lý thuế hàng hóa XNK',
    shortTitle: 'TT 06/2021',
    description: 'Thông tư hướng dẫn thi hành về quản lý thuế đối với hàng hóa xuất khẩu, nhập khẩu, hiệu lực 08/03/2021.',
    effectiveDate: '2021-03-08',
    filePath: path.join(process.cwd(), 'src/legal-docs/tt06/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'nd134', label: 'Liên quan → Nghị định 134/2016 (Thuế XNK)', description: 'Hướng dẫn quản lý thuế hàng hóa XNK', targetAnchor: 'nd134_1' },
      { targetSlug: 'luat-108', label: 'Căn cứ → Luật Quản lý thuế', description: 'Quản lý thuế hàng hóa XNK', targetAnchor: 'luat-108_1' },
    ],
  },
  {
    slug: 'tt39',
    title: 'TT 39/2018/TT-BTC — Sửa đổi TT 38/2015 (thủ tục hải quan)',
    shortTitle: 'TT 39/2018',
    description: 'Sửa đổi, bổ sung TT 38/2015 về thủ tục hải quan, kiểm tra, giám sát hải quan, thuế XNK, hiệu lực 05/06/2018.',
    effectiveDate: '2018-06-05',
    filePath: path.join(process.cwd(), 'src/legal-docs/tt39/index.html'),
    theme: 'light',
    crossRefs: [
      { targetSlug: 'nd134', label: 'Liên quan → Nghị định 134/2016 (Thuế XNK)', description: 'Thủ tục hải quan & thuế XNK', targetAnchor: 'nd134_1' },
    ],
  },
  // Thêm văn bản mới: bổ sung object và đặt file HTML vào src/legal-docs/[slug]/index.html
]

export function getDocBySlug(slug: string): LegalDoc | undefined {
  return LEGAL_DOCS.find((d) => d.slug === slug)
}
