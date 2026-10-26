import { NextRequest, NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import { createClient } from '@/lib/supabase/server'
import { formatVersionString, scanTaiLieuDirectory, writeTaiLieuDataFile } from '@/lib/tai-lieu-scanner'

export const dynamic = 'force-dynamic'

function getFilePath() {
  return path.join(process.cwd(), 'src', 'lib', 'tai-lieu-versions.json')
}

function readVersionsData(): Record<string, any[]> {
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
      return data
    }
  } catch (err) {
    console.error('Error reading versions json:', err)
  }
  return {}
}

function writeVersionsData(data: Record<string, any[]>) {
  try {
    const p = getFilePath()
    fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch (err) {
    console.error('Error writing versions json:', err)
    return false
  }
}

// GET /api/admin/tai-lieu/versions or ?id=tl_1
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  const allData = readVersionsData()

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
    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Chỉ tài khoản admin mới có quyền cập nhật version' }, { status: 403 })
    }

    const body = await request.json()
    const { id, version, releaseDate, changelog } = body

    if (!id || !version || !changelog) {
      return NextResponse.json({ error: 'Vui lòng điền đầy đủ mã tài liệu, số version và nội dung thay đổi' }, { status: 400 })
    }

    const formattedVer = formatVersionString(version)
    const allData = readVersionsData()
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
    writeVersionsData(allData)

    // Also update tai-lieu-data.ts with new version
    try {
      const items = scanTaiLieuDirectory()
      writeTaiLieuDataFile(items)
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

    const allData = readVersionsData()
    if (allData[id]) {
      allData[id] = allData[id].filter((v: any) => v.version !== version)
      writeVersionsData(allData)
    }

    return NextResponse.json({ success: true, allVersions: allData })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Lỗi server' }, { status: 500 })
  }
}
