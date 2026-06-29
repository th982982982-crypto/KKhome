function getTag(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = xml.match(re)
  return m ? m[1].trim() : ''
}

function getAllBlocks(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>[\\s\\S]*?<\\/${tag}>`, 'gi')
  return xml.match(re) ?? []
}

export interface PaymentRow {
  ndungNop: string
  maNdkt: string
  maChuong: string
  kyThue: string
  tienPnop: number
  ghiChu: string
}

export interface ParsedPayment {
  idCtu: string
  soGnt: string
  maThamChieu: string
  mst: string
  tenNNop: string
  hthucNop: string
  tenCqt: string
  maNhangNop: string
  tenNhangNop: string
  stkNhangNop: string
  ngayLap: string       // "14/07/2025" → stored as date string
  tongTien: number
  chiTiet: PaymentRow[]
}

export function parsePaymentXml(xml: string): ParsedPayment {
  const hdr = getTag(xml, 'CHUNGTU_HDR')
  if (!hdr) throw new Error('File XML không hợp lệ — không tìm thấy thẻ CHUNGTU_HDR')

  const mst = getTag(hdr, 'MST_NNOP')
  if (!mst) throw new Error('Không tìm thấy MST người nộp')

  const tongTienStr = getTag(hdr, 'TONG_TIEN')
  const tongTien = parseFloat(tongTienStr) || 0

  // Parse all detail rows
  const rowBlocks = getAllBlocks(xml, 'ROW_CTIET')
  const chiTiet: PaymentRow[] = rowBlocks.map((block) => ({
    ndungNop: getTag(block, 'NDUNG_NOP'),
    maNdkt: getTag(block, 'MA_NDKT'),
    maChuong: getTag(block, 'MA_CHUONG'),
    kyThue: getTag(block, 'KY_THUE'),
    tienPnop: parseFloat(getTag(block, 'TIEN_PNOP')) || 0,
    ghiChu: getTag(block, 'GHI_CHU'),
  }))

  return {
    idCtu: getTag(hdr, 'ID_CTU'),
    soGnt: getTag(hdr, 'SO_GNT'),
    maThamChieu: getTag(hdr, 'MA_THAMCHIEU'),
    mst,
    tenNNop: getTag(hdr, 'TEN_NNOP'),
    hthucNop: getTag(hdr, 'HTHUC_NOP'),
    tenCqt: getTag(hdr, 'TEN_CQT'),
    maNhangNop: getTag(hdr, 'MA_NHANG_NOP'),
    tenNhangNop: getTag(hdr, 'TEN_NHANG_NOP'),
    stkNhangNop: getTag(hdr, 'STK_NHANG_NOP'),
    ngayLap: getTag(hdr, 'NGAY_LAP'),
    tongTien,
    chiTiet,
  }
}

// Convert "14/07/2025" → "2025-07-14" for Postgres date
export function parseVnDate(s: string): string | null {
  const parts = s.split('/')
  if (parts.length !== 3) return null
  const [d, m, y] = parts
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
}
