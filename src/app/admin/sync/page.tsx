import { SyncSheets } from '@/components/admin/sync-sheets'
import { RefreshCw } from 'lucide-react'

export default function AdminSyncPage() {
  return (
    <div className="px-4 sm:px-6 lg:px-10 py-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-gray-400 text-sm mb-1.5">
          <RefreshCw className="w-4 h-4" />
          <span>Đồng bộ</span>
        </div>
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">Đồng bộ Google Sheets</h1>
        <p className="text-gray-500 mt-1">
          Hệ thống tự động đọc cột từ Google Sheet, khớp tên cột và đồng bộ vào database.
        </p>
      </div>
      <SyncSheets />
    </div>
  )
}
