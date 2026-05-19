export interface SheetRow {
  [key: string]: string
}

const COLUMN_MAP: Record<string, string> = {
  'tên': 'name', 'ten': 'name', 'name': 'name', 'tên template': 'name', 'tiêu đề': 'name',
  'slug': 'slug',
  'mô tả': 'description', 'mo ta': 'description', 'description': 'description', 'mô tả sản phẩm': 'description',
  'danh mục': 'category', 'danh muc': 'category', 'category': 'category', 'loại': 'category',
  'giá bán': 'sale_price', 'gia ban': 'sale_price', 'sale price': 'sale_price', 'giá': 'sale_price', 'price': 'sale_price',
  'giá gốc': 'original_price', 'gia goc': 'original_price', 'original price': 'original_price', 'giá cũ': 'original_price',
  'link ảnh': 'thumbnail_url', 'ảnh': 'thumbnail_url', 'thumbnail': 'thumbnail_url', 'hình': 'thumbnail_url', 'image': 'thumbnail_url',
  'link embed': 'google_sheet_embed_url', 'embed url': 'google_sheet_embed_url', 'link xem': 'google_sheet_embed_url', 'sheet url': 'google_sheet_embed_url',
  'link copy': 'google_sheet_copy_url', 'copy url': 'google_sheet_copy_url', 'link tải': 'google_sheet_copy_url',
  'link video': 'tutorial_video_url', 'video': 'tutorial_video_url', 'youtube': 'tutorial_video_url', 'hướng dẫn': 'tutorial_video_url',
  'tags': 'tags', 'tag': 'tags', 'từ khóa': 'tags',
  'hiển thị': 'is_published', 'hien thi': 'is_published', 'published': 'is_published', 'active': 'is_published',
  'thứ tự': 'sort_order', 'thu tu': 'sort_order', 'order': 'sort_order', 'sort': 'sort_order',
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim()
}

export function mapHeaders(headers: string[]): Record<number, string> {
  const mapping: Record<number, string> = {}
  headers.forEach((header, index) => {
    const normalized = normalizeHeader(header)
    const field = COLUMN_MAP[normalized]
    if (field) mapping[index] = field
  })
  return mapping
}

export function parseSheetRows(headers: string[], rows: string[][]): SheetRow[] {
  const mapping = mapHeaders(headers)
  return rows.map((row) => {
    const record: SheetRow = {}
    Object.entries(mapping).forEach(([indexStr, field]) => {
      const index = parseInt(indexStr)
      const value = row[index]?.trim() ?? ''
      if (value) record[field] = value
    })
    return record
  }).filter((r) => r.name)
}

export async function fetchCatalogSheet(): Promise<{ headers: string[]; rows: string[][] }> {
  const spreadsheetId = process.env.GOOGLE_SHEET_CATALOG_ID
  const apiKey = process.env.GOOGLE_SHEETS_API_KEY

  if (!spreadsheetId || !apiKey) {
    throw new Error('Missing GOOGLE_SHEET_CATALOG_ID or GOOGLE_SHEETS_API_KEY')
  }

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:Z1000?key=${apiKey}`
  const res = await fetch(url, { next: { revalidate: 0 } })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Google Sheets API error: ${res.status} - ${text}`)
  }

  const data = await res.json()
  const values: string[][] = data.values ?? []

  if (values.length < 2) return { headers: [], rows: [] }

  return { headers: values[0], rows: values.slice(1) }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export function transformToTemplate(row: SheetRow) {
  const slug = row.slug || slugify(row.name || '')
  return {
    slug,
    name: row.name || '',
    description: row.description || null,
    category: row.category || null,
    thumbnail_url: row.thumbnail_url || null,
    google_sheet_embed_url: row.google_sheet_embed_url || null,
    google_sheet_copy_url: row.google_sheet_copy_url || null,
    tutorial_video_url: row.tutorial_video_url || null,
    sale_price: row.sale_price ? parseFloat(row.sale_price.replace(/[^0-9.]/g, '')) : null,
    original_price: row.original_price ? parseFloat(row.original_price.replace(/[^0-9.]/g, '')) : null,
    tags: row.tags ? row.tags.split(',').map((t) => t.trim()).filter(Boolean) : null,
    is_published: !row.is_published || ['true', '1', 'x', 'yes', 'có', 'co'].includes(row.is_published.toLowerCase()),
    sort_order: row.sort_order ? parseInt(row.sort_order) : 0,
  }
}
