import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { formatVersionString, scanTaiLieuDirectoryAsync } from '@/lib/tai-lieu-scanner'

export const dynamic = 'force-dynamic'

let inMemoryVersionsCache: Record<string, any[]> | null = null
let lastVersionsFetch = 0
const CACHE_TTL_MS = 2000

function getFilePath() {
  return path.join(process.cwd(), 'src', 'lib', 'tai-lieu-versions.json')
}

function getAdminSupabaseSafe() {
  try {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const url = rawUrl.replace(/\/(rest|auth|storage)\/v\d.*$/, '').replace(/\/$/, '')
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) return null
    return createSupabaseClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
      },
    })
  } catch {
    return null
  }
}

async function readVersionsData(forceRefresh = false): Promise<Record<string, any[]>> {
  const now = Date.now()
  if (!forceRefresh && inMemoryVersionsCache && (now - lastVersionsFetch < CACHE_TTL_MS)) {
    return inMemoryVersionsCache
  }

  // 1. Try Supabase Storage
  try {
    const supabase = getAdminSupabaseSafe()
    if (supabase) {
      const { data, error } = await supabase.storage.from('legal-forms').download('tai-lieu-config/versions.json')
      if (!error && data) {
        const text = await data.text()
        const parsed = JSON.parse(text)
        if (parsed && typeof parsed === 'object') {
          inMemoryVersionsCache = parsed
          lastVersionsFetch = Date.now()
          return parsed
        }
      }
    }
  } catch {}

  // 2. Fallback to local
  try {
    const p = getFilePath()
    if (fs.existsSync(p)) {
      const raw = fs.readFileSync(p, 'utf-8')
      const data = JSON.parse(raw)
      for (const k of Object.keys(data)) {
        if (Array.isArray(data[k])) {
          data[k] = data[k].map((v: any) => ({
            ...v,
            version: formatVersionString(v.version),
          }))
        }
      }
      inMemoryVersionsCache = data
      return data
    }
  } catch (err) {
    console.error('Error reading versions json:', err)
  }
  return {}
}

async function writeVersionsData(data: Record<string, any[]>): Promise<boolean> {
  inMemoryVersionsCache = data
  lastVersionsFetch = Date.now()

  // 1. Save to Supabase Storage
  try {
    const supabase = getAdminSupabaseSafe()
    if (supabase) {
      const jsonStr = JSON.stringify(data, null, 2)
      const buffer = Buffer.from(jsonStr, 'utf-8')
      await supabase.storage.from('legal-forms').upload('tai-lieu-config/versions.json', buffer, {
        contentType: 'application/json',
        upsert: true,
      })
    }
  } catch {}

  // 2. Try local
  try {
    const p = getFilePath()
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8')
  } catch {}

  return true
}

// GET /api/admin/tai-lieu/versions or ?id=tl_1
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const allData = await readVersionsData(true)

  if (id) {
    const list = allData[id] || [
      {
        version: 'Ver 2026.1',
        releaseDate: '2026-01-15',
        changelog: 'Phiên bản chuẩn hóa năm 2026.',
        updatedBy: 'Hệ thống KK HOME',
      },
    ]
    return NextResponse.json({ versions: list })
  }

  return NextResponse.json({ allVersions: allData })
}

// POST /api/admin/tai-lieu/versions
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    const isAdmin = Boolean(profile?.is_admin || (user.email ? user.email.toLowerCase().includes('admin') : false))
    if (!isAdmin) {
      return NextResponse.json({ error: 'Chỉ tài khoản admin mới có quyền cập nhật version' }, { status: 403 })
    }

    const body = await request.json()
    const { id, version, releaseDate, changelog } = body

    if (!id || !version || !changelog) {
      return NextResponse.json({ error: 'Vui lòng điền đầy đủ mã tài liệu, số version và nội dung thay đổi' }, { status: 400 })
    }

    const formattedVer = formatVersionString(version)
    const allData = await readVersionsData(true)
    const currentList = allData[id] ? [...allData[id]] : [
      {
        version: 'Ver 2026.1',
        releaseDate: '2026-01-15',
        changelog: 'Phiên bản chuẩn hóa ban đầu năm 2026.',
        updatedBy: 'Hệ thống KK HOME',
      },
    ]

    const newVersionRecord = {
      version: formattedVer,
      releaseDate: releaseDate || new Date().toISOString().split('T')[0],
      changelog: changelog.trim(),
      updatedBy: user.email || 'Admin KK HOME',
      createdAt: new Date().toISOString(),
    }

    const existingIdx = currentList.findIndex(
      (v: any) => v.version.toLowerCase() === newVersionRecord.version.toLowerCase()
    )

    if (existingIdx >= 0) {
      currentList[existingIdx] = newVersionRecord
    } else {
      currentList.unshift(newVersionRecord)
    }

    allData[id] = currentList
    await writeVersionsData(allData)

    // Also update catalog with new version
    try {
      await scanTaiLieuDirectoryAsync()
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Đã cập nhật phiên bản ${newVersionRecord.version} thành công!`,
      versions: currentList,
      allVersions: allData,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Lỗi server' }, { status: 500 })
  }
}

// DELETE /api/admin/tai-lieu/versions?id=...&version=...
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Chưa đăng nhập' }, { status: 401 })
    }

    const { data: profile } = await supabase.from('profiles').select('is_admin').eq('id', user.id).single()
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Chỉ tài khoản admin mới có quyền xóa version' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const version = searchParams.get('version')

    if (!id || !version) {
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })
    }

    const allData = await readVersionsData(true)
    if (allData[id]) {
      allData[id] = allData[id].filter((v: any) => v.version !== version)
      await writeVersionsData(allData)
    }

    return NextResponse.json({ success: true, allVersions: allData })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Lỗi server' }, { status: 500 })
  }
}
