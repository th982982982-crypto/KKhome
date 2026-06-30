export interface ParsedDeclaration {
  mst: string
  tenNNT: string
  kyKKhai: string
  maTKhai: string
  declarationType: 'GTGT' | 'TNDN' | 'TNCN' | 'BCTC'
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
const SUPPORTED_MA_TKHAI: Record<string, 'GTGT' | 'TNDN' | 'TNCN' | 'BCTC'> = {
  '842': 'GTGT',  // 01/GTGT — Tờ khai GTGT (monthly)
  '892': 'TNDN',  // 03/TNDN — Quyết toán TNDN (annual)
  '864': 'TNCN',  // 05/KK-TNCN — Tờ khai TNCN (monthly)
  '953': 'TNCN',  // 05/QTT-TNCN — Quyết toán TNCN (annual)
  '402': 'BCTC',  // Báo cáo tài chính (TT200/2014/TT-BTC)
}

// Parse one XML sub-section (e.g. SoCuoiNam, NamNay) and return prefixed indicators
function parseSectionIndicators(
  xmlText: string,
  outerTag: string,
  innerTag: string,
  prefix: string,
  tags: string[]
): Record<string, number> {
  const outerRe = new RegExp(`<${outerTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${outerTag}>`, 'i')
  const outerM = xmlText.match(outerRe)
  if (!outerM) return {}
  const innerRe = new RegExp(`<${innerTag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${innerTag}>`, 'i')
  const innerM = outerM[1].match(innerRe)
  if (!innerM) return {}
  const result: Record<string, number> = {}
  for (const tag of tags) {
    const code = tag.replace(/^ct/i, '')
    result[`${prefix}_${code}`] = getIndicatorValue(innerM[1], tag)
  }
  return result
}

function parseBctcIndicators(xmlText: string): Record<string, number> {
  const CDKT_TAGS = [
    'ct100','ct110','ct111','ct112','ct120','ct121','ct122','ct123',
    'ct130','ct131','ct132','ct133','ct134','ct135','ct136','ct137','ct139',
    'ct140','ct141','ct149','ct150','ct151','ct152','ct153','ct154','ct155',
    'ct200','ct210','ct211','ct212','ct213','ct214','ct215','ct216','ct219',
    'ct220','ct221','ct222','ct223','ct224','ct225','ct226','ct227','ct228','ct229',
    'ct230','ct231','ct232','ct240','ct241','ct242',
    'ct250','ct251','ct252','ct253','ct254','ct255',
    'ct260','ct261','ct262','ct263','ct268','ct270',
    'ct300','ct310','ct311','ct312','ct313','ct314','ct315','ct316','ct317','ct318','ct319',
    'ct320','ct321','ct322','ct323','ct324',
    'ct330','ct331','ct332','ct333','ct334','ct335','ct336','ct337','ct338','ct339',
    'ct340','ct341','ct342','ct343',
    'ct400','ct410','ct411','ct411a','ct411b','ct412','ct413','ct414','ct415','ct416',
    'ct417','ct418','ct419','ct420','ct421','ct421a','ct421b','ct422',
    'ct430','ct431','ct432','ct440',
  ]
  const KQKD_TAGS = [
    'ct01','ct02','ct10','ct11','ct20','ct21','ct22','ct23','ct25','ct26',
    'ct30','ct31','ct32','ct40','ct50','ct51','ct52','ct60','ct70','ct71',
  ]
  const LCTT_TAGS = [
    'ct01','ct02','ct03','ct04','ct05','ct06','ct07',
    'ct20','ct21','ct22','ct23','ct24','ct25','ct26','ct27',
    'ct30','ct31','ct32','ct33','ct34','ct35','ct36',
    'ct40','ct50','ct60','ct61','ct70',
  ]

  return {
    ...parseSectionIndicators(xmlText, 'CDKT_HoatDongLienTuc', 'SoCuoiNam', 'CDKT_cuoi', CDKT_TAGS),
    ...parseSectionIndicators(xmlText, 'CDKT_HoatDongLienTuc', 'SoDauNam',  'CDKT_dau',  CDKT_TAGS),
    ...parseSectionIndicators(xmlText, 'PL_KQHDSXKD',          'NamNay',    'KQKD_nay',  KQKD_TAGS),
    ...parseSectionIndicators(xmlText, 'PL_KQHDSXKD',          'NamTruoc',  'KQKD_truoc',KQKD_TAGS),
    ...parseSectionIndicators(xmlText, 'PL_LCTTTT',             'NamNay',    'LCTT_nay',  LCTT_TAGS),
    ...parseSectionIndicators(xmlText, 'PL_LCTTTT',             'NamTruoc',  'LCTT_truoc',LCTT_TAGS),
  }
}

export function parseXmlText(xmlText: string): ParsedDeclaration {
  const maTKhai = getTagText(xmlText, 'maTKhai')
  if (!maTKhai) throw new Error('File XML không hợp lệ — không tìm thấy thẻ maTKhai')

  const declarationType = SUPPORTED_MA_TKHAI[maTKhai]
  if (!declarationType) {
    const tenTKhai = getTagText(xmlText, 'tenTKhai') || `maTKhai=${maTKhai}`
    throw new Error(`Không hỗ trợ loại tờ khai: "${tenTKhai}". Chỉ hỗ trợ: GTGT (01/GTGT), TNDN (03/TNDN), TNCN (05/KK-TNCN, 05/QTT-TNCN), BCTC (TT200).`)
  }

  const kyKKhai = getTagText(xmlText, 'kyKKhai')
  if (!kyKKhai) throw new Error('Không tìm thấy kỳ khai thuế')

  // "01/2024" → year="2024"; "2024" (annual) → year="2024"
  const taxYear = kyKKhai.includes('/') ? kyKKhai.split('/').pop()! : kyKKhai

  // BCTC uses a completely different multi-section indicator structure
  if (declarationType === 'BCTC') {
    return {
      mst: getTagText(xmlText, 'mst'),
      tenNNT: getTagText(xmlText, 'tenNNT'),
      kyKKhai,
      maTKhai,
      declarationType,
      loaiKhai: getTagText(xmlText, 'loaiTKhai'),
      soLan: getTagText(xmlText, 'soLan'),
      nguoiKy: getTagText(xmlText, 'nguoiKy'),
      taxYear,
      indicators: parseBctcIndicators(xmlText),
    }
  }

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
    tenNNT: getTagText(xmlText, 'tenNNT'),
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
