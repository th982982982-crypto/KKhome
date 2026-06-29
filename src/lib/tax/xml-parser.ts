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

function getTagValue(doc: Document, tagName: string): string {
  const el = doc.getElementsByTagName(tagName)[0]
  return el?.textContent?.trim() ?? '0'
}

function parseIndicators(root: Element, tags: string[]): Record<string, number> {
  const result: Record<string, number> = {}
  for (const tag of tags) {
    const el = root.querySelector(tag) ?? findDeep(root, tag)
    const raw = el?.textContent?.trim() ?? '0'
    const code = tag.replace(/^ct/i, '')
    result[code] = parseFloat(raw) || 0
  }
  return result
}

function findDeep(root: Element, tagName: string): Element | null {
  const lower = tagName.toLowerCase()
  const all = root.getElementsByTagName('*')
  for (let i = 0; i < all.length; i++) {
    if (all[i].tagName.toLowerCase() === lower) return all[i]
  }
  return null
}

export function parseXmlText(xmlText: string): ParsedDeclaration {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlText, 'text/xml')

  const maTKhai = getTagValue(doc, 'maTKhai')
  const declarationType: 'GTGT' | 'TNDN' | 'TNCN' =
    maTKhai === '842' ? 'GTGT' : maTKhai === '892' ? 'TNDN' : 'TNCN'

  const kyKKhai = getTagValue(doc, 'kyKKhai')
  const taxYear = kyKKhai.includes('/') ? kyKKhai.split('/').pop() ?? '' : kyKKhai

  let indicators: Record<string, number> = {}

  if (declarationType === 'GTGT') {
    const tags = [
      'ct21','ct22','ct23','ct24','ct23a','ct24a','ct25','ct26','ct27','ct28',
      'ct29','ct30','ct31','ct32','ct33','ct32a','ct34','ct35','ct36','ct37',
      'ct38','ct39a','ct40a','ct40b','ct40','ct41','ct42','ct43',
    ]
    indicators = parseIndicators(doc.documentElement, tags)
  } else if (declarationType === 'TNDN') {
    const tags = [
      'ct04','ct05','ct06','ct07','ct08','ct09','ct10','ct11','ct12','ct13',
      'ct14','ct15','ct16','ct17','ct18','ct19','ct20','ct21','ct22','ctA1',
      'ctB1','ctB2','ctB3','ctB4','ctB5','ctB6','ctB7','ctB8','ctB9','ctB10',
      'ctB11','ctB12','ctB13','ctB14','ctB15',
      'ctC1','ctC2','ctC3','ctC3a','ctC3c','ctC4','ctC5','ctC6','ctC7','ctC8',
      'ctC8a','ctC9','ctC10','ctC11','ctC12','ctC13','ctC14','ctC15','ctC16','ctC17',
      'ctD1','ctD2','ctD3','ctD4','ctD5','ctD6','ctD7','ctD8',
      'ctE1','ctE2','ctE3','ctE4','ctE5','ctE6',
    ]
    indicators = parseIndicators(doc.documentElement, tags)
  } else {
    const tags = [
      'ct16','ct17','ct18','ct19','ct20','ct21','ct22','ct23',
      'ct24','ct25','ct26','ct27','ct28','ct29','ct30','ct31','ct32',
    ]
    indicators = parseIndicators(doc.documentElement, tags)
  }

  return {
    mst: getTagValue(doc, 'mst'),
    kyKKhai,
    maTKhai,
    declarationType,
    loaiKhai: getTagValue(doc, 'loaiTKhai'),
    soLan: getTagValue(doc, 'soLan'),
    nguoiKy: getTagValue(doc, 'nguoiKy'),
    taxYear,
    indicators,
  }
}
