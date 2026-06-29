export interface ParsedDeclaration {
  mst: string
  kyKKhai: string
  maTKhai: string
  declarationType: 'GTGT' | 'TNDN' | 'TNCN'
  loaiKhai: string
  soLan: string
  nguoiKy: string
  taxYear: string
  indicators: Record<string, number>
}

// Works in both browser (client) and Node.js (server) — no DOMParser needed.
function getTagText(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const m = xml.match(re)
  return m ? m[1].trim() : ''
}

function getIndicatorValue(xml: string, tag: string): number {
  const text = getTagText(xml, tag)
  if (!text) return 0
  const num = parseFloat(text.replace(/,/g, ''))
  return isNaN(num) ? 0 : num
}

// Only these maTKhai are tax declarations with structured indicator rows.
// Others (373=bảng kê chứng từ, 302=đăng ký NPT, 402=BCTC, 892≠953, etc.) are rejected.
const SUPPORTED_MA_TKHAI: Record<string, 'GTGT' | 'TNDN' | 'TNCN'> = {
  '842': 'GTGT',  // 01/GTGT — Tờ khai GTGT (monthly)
  '892': 'TNDN',  // 03/TNDN — Quyết toán TNDN (annual)
  '864': 'TNCN',  // 05/KK-TNCN — Tờ khai TNCN (monthly)
  '953': 'TNCN',  // 05/QTT-TNCN — Quyết toán TNCN (annual)
}

export function parseXmlText(xmlText: string): ParsedDeclaration {
  const maTKhai = getTagText(xmlText, 'maTKhai')
  if (!maTKhai) throw new Error('File XML không hợp lệ — không tìm thấy thẻ maTKhai')

  const declarationType = SUPPORTED_MA_TKHAI[maTKhai]
  if (!declarationType) {
    const tenTKhai = getTagText(xmlText, 'tenTKhai') || `maTKhai=${maTKhai}`
    throw new Error(`Không hỗ trợ loại tờ khai: "${tenTKhai}". Chỉ hỗ trợ: GTGT (01/GTGT), TNDN (03/TNDN), TNCN (05/KK-TNCN, 05/QTT-TNCN).`)
  }

  const kyKKhai = getTagText(xmlText, 'kyKKhai')
  if (!kyKKhai) throw new Error('Không tìm thấy kỳ khai thuế')

  // "01/2024" → year="2024"; "2024" (annual) → year="2024"
  const taxYear = kyKKhai.includes('/') ? kyKKhai.split('/').pop()! : kyKKhai

  let indicatorTags: string[] = []

  if (declarationType === 'GTGT') {
    indicatorTags = [
      'ct21','ct22','ct23','ct24','ct23a','ct24a','ct25',
      'ct26','ct27','ct28','ct29','ct30','ct31','ct32','ct33','ct32a','ct34','ct35',
      'ct36','ct37','ct38','ct39a','ct40a','ct40b','ct40','ct41','ct42','ct43',
    ]
  } else if (declarationType === 'TNDN') {
    indicatorTags = [
      'ct04','ct05','ct06','ct07','ct08','ct09','ct10','ct11','ct12','ct13',
      'ct14','ct15','ct16','ct17','ct18','ct19','ct20','ct21','ct22','ctA1',
      'ctB1','ctB2','ctB3','ctB4','ctB5','ctB6','ctB7','ctB8','ctB9','ctB10',
      'ctB11','ctB12','ctB13','ctB14','ctB15',
      'ctC1','ctC2','ctC3','ctC3a','ctC3c','ctC4','ctC5','ctC6','ctC7','ctC8',
      'ctC8a','ctC9','ctC10','ctC11','ctC12','ctC13','ctC14','ctC15','ctC16','ctC17',
      'ctD1','ctD2','ctD3','ctD4','ctD5','ctD6','ctD7','ctD8',
      'ctE1','ctE2','ctE3','ctE4','ctE5','ctE6',
    ]
  } else {
    // TNCN: both 05/KK-TNCN (monthly, maTKhai=864) and 05/QTT-TNCN (annual, maTKhai=953)
    indicatorTags = [
      'ct15','ct16','ct17','ct18','ct19','ct20','ct21','ct22','ct23',
      'ct24','ct25','ct26','ct27','ct28','ct29','ct30','ct31','ct32',
    ]
  }

  const indicators: Record<string, number> = {}
  for (const tag of indicatorTags) {
    const code = tag.replace(/^ct/i, '')
    indicators[code] = getIndicatorValue(xmlText, tag)
  }

  return {
    mst: getTagText(xmlText, 'mst'),
    kyKKhai,
    maTKhai,
    declarationType,
    loaiKhai: getTagText(xmlText, 'loaiTKhai'),
    soLan: getTagText(xmlText, 'soLan'),
    nguoiKy: getTagText(xmlText, 'nguoiKy'),
    taxYear,
    indicators,
  }
}
