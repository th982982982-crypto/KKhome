export interface TaiLieuItem {
  id: string
  code: string
  title: string
  filename: string
  category: string
  categoryLabel: string
  year: number
  description: string
  featured?: boolean
  isHot?: boolean
  fileType: "xlsx" | "docx" | "pdf"
  fileSize: string
  downloadUrl: string
  tags: string[]
}

export function getPreviewPdfUrl(item: TaiLieuItem): string {
  if (item.fileType === 'pdf') return item.downloadUrl
  return item.downloadUrl.replace(/\.(docx|xlsx)$/i, '.pdf')
}

export const TAI_LIEU_ITEMS: TaiLieuItem[] = [
  {
    "id": "tl_1",
    "code": "NS01",
    "title": "Sổ Quản Lý Lao Động 2026",
    "filename": "NS01_So_Quan_Ly_Lao_Dong.xlsx",
    "category": "nhan_su",
    "categoryLabel": "Nhân sự",
    "year": 2026,
    "description": "Sổ quản lý, theo dõi toàn bộ lao động trong doanh nghiệp theo quy định Bộ luật Lao động và NĐ 145/2020.",
    "featured": true,
    "isHot": true,
    "fileType": "xlsx",
    "fileSize": "39.6 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/01_Ho_So_Lao_Dong_Va_Hop_Dong/NS01_So_Quan_Ly_Lao_Dong.xlsx",
    "tags": [
      "Nhân sự",
      "Sổ lao động",
      "Bắt buộc"
    ]
  },
  {
    "id": "tl_2",
    "code": "NS02",
    "title": "Hệ Thống Tạo Hợp Đồng Lao Động Tự Động",
    "filename": "NS02_He_Thong_Tao_Hop_Dong_Lao_Dong_Tu_Dong.xlsx",
    "category": "nhan_su",
    "categoryLabel": "Nhân sự",
    "year": 2026,
    "description": "Công cụ Excel tự động tạo HĐLĐ không xác định thời hạn, có thời hạn, phụ lục HĐLĐ và cam kết bảo mật.",
    "featured": true,
    "isHot": true,
    "fileType": "xlsx",
    "fileSize": "545.7 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/01_Ho_So_Lao_Dong_Va_Hop_Dong/NS02_He_Thong_Tao_Hop_Dong_Lao_Dong_Tu_Dong.xlsx",
    "tags": [
      "HĐLĐ",
      "Excel tự động",
      "Hot"
    ]
  },
  {
    "id": "tl_3",
    "code": "NS03",
    "title": "Hợp Đồng Giao Khoán Công Việc Mẫu",
    "filename": "NS03_Hop_Dong_Giao_Khoan_Cong_Viec.docx",
    "category": "hop_dong",
    "categoryLabel": "Hợp đồng",
    "year": 2026,
    "description": "Mẫu hợp đồng giao khoán công việc theo thời vụ, công nhật hoặc khối lượng bàn giao độc lập.",
    "featured": true,
    "isHot": false,
    "fileType": "docx",
    "fileSize": "165.8 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/01_Ho_So_Lao_Dong_Va_Hop_Dong/NS03_Hop_Dong_Giao_Khoan_Cong_Viec.docx",
    "tags": [
      "Khoán việc",
      "Hợp đồng"
    ]
  },
  {
    "id": "tl_4",
    "code": "NS04",
    "title": "Hợp Đồng Dịch Vụ Chuyên Gia Cá Nhân",
    "filename": "NS04_Hop_Dong_Dich_Vu_Chuyen_Gia_Ca_Nhan.docx",
    "category": "hop_dong",
    "categoryLabel": "Hợp đồng",
    "year": 2026,
    "description": "Mẫu hợp đồng dịch vụ tư vấn với cá nhân (thuộc đối tượng khấu trừ 10% thuế TNCN).",
    "featured": false,
    "isHot": false,
    "fileType": "docx",
    "fileSize": "113.3 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/01_Ho_So_Lao_Dong_Va_Hop_Dong/NS04_Hop_Dong_Dich_Vu_Chuyen_Gia_Ca_Nhan.docx",
    "tags": [
      "Dịch vụ",
      "Cá nhân"
    ]
  },
  {
    "id": "tl_5",
    "code": "NS05",
    "title": "Bảng Chấm Công Tự Động 2026",
    "filename": "NS05_Bang_Cham_Cong_Tu_Dong_2026.xlsx",
    "category": "nhan_su",
    "categoryLabel": "Nhân sự",
    "year": 2026,
    "description": "Bảng chấm công tự động 31 ngày, tổng hợp công thực tế, nghỉ phép, lễ tết, tăng ca OT và làm đêm.",
    "featured": true,
    "isHot": true,
    "fileType": "xlsx",
    "fileSize": "338.0 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/02_Cham_Cong_Va_Tinh_Luong/NS05_Bang_Cham_Cong_Tu_Dong_2026.xlsx",
    "tags": [
      "Chấm công",
      "Excel 2026",
      "Tự động"
    ]
  },
  {
    "id": "tl_6",
    "code": "NS06",
    "title": "Bảng Lương Tự Động 2026 (Tính Thuế TNCN & BHXH Mới)",
    "filename": "NS06_Bang_Luong_Tu_Dong_2026.xlsx",
    "category": "nhan_su",
    "categoryLabel": "Nhân sự",
    "year": 2026,
    "description": "Bảng tính lương tự động liên kết chấm công, tự động khấu trừ thuế TNCN lũy tiến và tỷ lệ trích nộp BHXH.",
    "featured": true,
    "isHot": true,
    "fileType": "xlsx",
    "fileSize": "663.4 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/02_Cham_Cong_Va_Tinh_Luong/NS06_Bang_Luong_Tu_Dong_2026.xlsx",
    "tags": [
      "Bảng lương",
      "Thuế TNCN",
      "BHXH 2026"
    ]
  },
  {
    "id": "tl_7",
    "code": "NS07",
    "title": "Nội Quy Lao Động Doanh Nghiệp Chuẩn 2026",
    "filename": "NS07_Quy_Dinh_Noi_Quy_Lao_Dong_2026.docx",
    "category": "nhan_su",
    "categoryLabel": "Nhân sự",
    "year": 2026,
    "description": "Nội quy lao động doanh nghiệp chuẩn 2026 hoàn chỉnh các chương: Kỷ luật, An toàn, Quấy rối tình dục nơi làm việc.",
    "featured": true,
    "isHot": true,
    "fileType": "docx",
    "fileSize": "62.0 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/03_Noi_Quy_Quy_Che_Phuc_Loi/NS07_Quy_Dinh_Noi_Quy_Lao_Dong_2026.docx",
    "tags": [
      "Nội quy",
      "Quy chế",
      "Doanh nghiệp"
    ]
  },
  {
    "id": "tl_8",
    "code": "NS09",
    "title": "Quy Chế Chi Phúc Lợi Cho Người Lao Động",
    "filename": "NS09_Quy_Che_Chi_Phuc_Loi_Nguoi_Lao_Dong.docx",
    "category": "nhan_su",
    "categoryLabel": "Nhân sự",
    "year": 2026,
    "description": "Quy chế chi phúc lợi: đám hiếu, hỷ, sinh nhật, du lịch teambuilding, khen thưởng con em NLĐ đạt chuẩn thuế TNDN.",
    "featured": false,
    "isHot": true,
    "fileType": "docx",
    "fileSize": "19.9 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/03_Noi_Quy_Quy_Che_Phuc_Loi/NS09_Quy_Che_Chi_Phuc_Loi_Nguoi_Lao_Dong.docx",
    "tags": [
      "Phúc lợi",
      "Quy chế"
    ]
  },
  {
    "id": "tl_9",
    "code": "NS10",
    "title": "Bộ Biểu Mẫu Chi Tặng Quà Lễ, Tết & Trung Thu",
    "filename": "NS10_Bo_Bieu_Mau_Chi_Tang_Qua_Le_Tet.docx",
    "category": "nhan_su",
    "categoryLabel": "Nhân sự",
    "year": 2026,
    "description": "Hồ sơ quyết định chi quà, danh sách nhận quà và chứng từ kế toán thuế hợp lý hợp lệ.",
    "featured": false,
    "isHot": false,
    "fileType": "docx",
    "fileSize": "49.8 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/03_Noi_Quy_Quy_Che_Phuc_Loi/NS10_Bo_Bieu_Mau_Chi_Tang_Qua_Le_Tet.docx",
    "tags": [
      "Quà tặng",
      "Lễ tết"
    ]
  },
  {
    "id": "tl_10",
    "code": "NS08",
    "title": "Hồ Sơ Đăng Ký NQLD: 01 Quyet Dinh Ban Hanh NQLD",
    "filename": "NS08_01_Quyet_Dinh_Ban_Hanh_NQLD.docx",
    "category": "nhan_su",
    "categoryLabel": "Nhân sự",
    "year": 2026,
    "description": "Trọn bộ 09 biểu mẫu hành chính (Quyết định, Biên bản lấy ý kiến, Niêm yết...) nộp cơ quan quản lý lao động.",
    "featured": false,
    "isHot": false,
    "fileType": "docx",
    "fileSize": "42.0 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/03_Noi_Quy_Quy_Che_Phuc_Loi/Ho_So_Dang_Ky_NQLD/NS08_01_Quyet_Dinh_Ban_Hanh_NQLD.docx",
    "tags": [
      "Thủ tục",
      "Đăng ký NQLĐ"
    ]
  },
  {
    "id": "tl_11",
    "code": "NS08",
    "title": "Hồ Sơ Đăng Ký NQLD: 02 Van Ban Lay Y Kien To Chuc Dai Dien NLD",
    "filename": "NS08_02_Van_Ban_Lay_Y_Kien_To_Chuc_Dai_Dien_NLD.docx",
    "category": "nhan_su",
    "categoryLabel": "Nhân sự",
    "year": 2026,
    "description": "Trọn bộ 09 biểu mẫu hành chính (Quyết định, Biên bản lấy ý kiến, Niêm yết...) nộp cơ quan quản lý lao động.",
    "featured": false,
    "isHot": false,
    "fileType": "docx",
    "fileSize": "42.8 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/03_Noi_Quy_Quy_Che_Phuc_Loi/Ho_So_Dang_Ky_NQLD/NS08_02_Van_Ban_Lay_Y_Kien_To_Chuc_Dai_Dien_NLD.docx",
    "tags": [
      "Thủ tục",
      "Đăng ký NQLĐ"
    ]
  },
  {
    "id": "tl_12",
    "code": "NS08",
    "title": "Hồ Sơ Đăng Ký NQLD: 03 Bien Ban Hop Lay Y Kien",
    "filename": "NS08_03_Bien_Ban_Hop_Lay_Y_Kien.docx",
    "category": "nhan_su",
    "categoryLabel": "Nhân sự",
    "year": 2026,
    "description": "Trọn bộ 09 biểu mẫu hành chính (Quyết định, Biên bản lấy ý kiến, Niêm yết...) nộp cơ quan quản lý lao động.",
    "featured": false,
    "isHot": false,
    "fileType": "docx",
    "fileSize": "42.4 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/03_Noi_Quy_Quy_Che_Phuc_Loi/Ho_So_Dang_Ky_NQLD/NS08_03_Bien_Ban_Hop_Lay_Y_Kien.docx",
    "tags": [
      "Thủ tục",
      "Đăng ký NQLĐ"
    ]
  },
  {
    "id": "tl_13",
    "code": "NS08",
    "title": "Hồ Sơ Đăng Ký NQLD: 04 Van Ban Gop Y Cua To Chuc Dai Dien NLD",
    "filename": "NS08_04_Van_Ban_Gop_Y_Cua_To_Chuc_Dai_Dien_NLD.docx",
    "category": "nhan_su",
    "categoryLabel": "Nhân sự",
    "year": 2026,
    "description": "Trọn bộ 09 biểu mẫu hành chính (Quyết định, Biên bản lấy ý kiến, Niêm yết...) nộp cơ quan quản lý lao động.",
    "featured": false,
    "isHot": false,
    "fileType": "docx",
    "fileSize": "41.6 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/03_Noi_Quy_Quy_Che_Phuc_Loi/Ho_So_Dang_Ky_NQLD/NS08_04_Van_Ban_Gop_Y_Cua_To_Chuc_Dai_Dien_NLD.docx",
    "tags": [
      "Thủ tục",
      "Đăng ký NQLĐ"
    ]
  },
  {
    "id": "tl_14",
    "code": "NS08",
    "title": "Hồ Sơ Đăng Ký NQLD: 05 Van Ban De Nghi Dang Ky NQLD",
    "filename": "NS08_05_Van_Ban_De_Nghi_Dang_Ky_NQLD.docx",
    "category": "nhan_su",
    "categoryLabel": "Nhân sự",
    "year": 2026,
    "description": "Trọn bộ 09 biểu mẫu hành chính (Quyết định, Biên bản lấy ý kiến, Niêm yết...) nộp cơ quan quản lý lao động.",
    "featured": false,
    "isHot": false,
    "fileType": "docx",
    "fileSize": "42.9 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/03_Noi_Quy_Quy_Che_Phuc_Loi/Ho_So_Dang_Ky_NQLD/NS08_05_Van_Ban_De_Nghi_Dang_Ky_NQLD.docx",
    "tags": [
      "Thủ tục",
      "Đăng ký NQLĐ"
    ]
  },
  {
    "id": "tl_15",
    "code": "NS08",
    "title": "Hồ Sơ Đăng Ký NQLD: 06 Thong Bao Ket Qua Dang Ky NQLD",
    "filename": "NS08_06_Thong_Bao_Ket_Qua_Dang_Ky_NQLD.docx",
    "category": "nhan_su",
    "categoryLabel": "Nhân sự",
    "year": 2026,
    "description": "Trọn bộ 09 biểu mẫu hành chính (Quyết định, Biên bản lấy ý kiến, Niêm yết...) nộp cơ quan quản lý lao động.",
    "featured": false,
    "isHot": false,
    "fileType": "docx",
    "fileSize": "41.6 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/03_Noi_Quy_Quy_Che_Phuc_Loi/Ho_So_Dang_Ky_NQLD/NS08_06_Thong_Bao_Ket_Qua_Dang_Ky_NQLD.docx",
    "tags": [
      "Thủ tục",
      "Đăng ký NQLĐ"
    ]
  },
  {
    "id": "tl_16",
    "code": "NS08",
    "title": "Hồ Sơ Đăng Ký NQLD: 07 Thong Bao Noi Bo Ve Hieu Luc NQLD",
    "filename": "NS08_07_Thong_Bao_Noi_Bo_Ve_Hieu_Luc_NQLD.docx",
    "category": "nhan_su",
    "categoryLabel": "Nhân sự",
    "year": 2026,
    "description": "Trọn bộ 09 biểu mẫu hành chính (Quyết định, Biên bản lấy ý kiến, Niêm yết...) nộp cơ quan quản lý lao động.",
    "featured": false,
    "isHot": false,
    "fileType": "docx",
    "fileSize": "41.9 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/03_Noi_Quy_Quy_Che_Phuc_Loi/Ho_So_Dang_Ky_NQLD/NS08_07_Thong_Bao_Noi_Bo_Ve_Hieu_Luc_NQLD.docx",
    "tags": [
      "Thủ tục",
      "Đăng ký NQLĐ"
    ]
  },
  {
    "id": "tl_17",
    "code": "NS08",
    "title": "Hồ Sơ Đăng Ký NQLD: 08 Bien Ban Niem Yet Va Pho Bien NQLD",
    "filename": "NS08_08_Bien_Ban_Niem_Yet_Va_Pho_Bien_NQLD.docx",
    "category": "nhan_su",
    "categoryLabel": "Nhân sự",
    "year": 2026,
    "description": "Trọn bộ 09 biểu mẫu hành chính (Quyết định, Biên bản lấy ý kiến, Niêm yết...) nộp cơ quan quản lý lao động.",
    "featured": false,
    "isHot": false,
    "fileType": "docx",
    "fileSize": "42.5 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/03_Noi_Quy_Quy_Che_Phuc_Loi/Ho_So_Dang_Ky_NQLD/NS08_08_Bien_Ban_Niem_Yet_Va_Pho_Bien_NQLD.docx",
    "tags": [
      "Thủ tục",
      "Đăng ký NQLĐ"
    ]
  },
  {
    "id": "tl_18",
    "code": "NS08",
    "title": "Hồ Sơ Đăng Ký NQLD: 09 Checklist Ho So Dang Ky NQLD",
    "filename": "NS08_09_Checklist_Ho_So_Dang_Ky_NQLD.docx",
    "category": "nhan_su",
    "categoryLabel": "Nhân sự",
    "year": 2026,
    "description": "Trọn bộ 09 biểu mẫu hành chính (Quyết định, Biên bản lấy ý kiến, Niêm yết...) nộp cơ quan quản lý lao động.",
    "featured": false,
    "isHot": false,
    "fileType": "docx",
    "fileSize": "43.0 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/03_Noi_Quy_Quy_Che_Phuc_Loi/Ho_So_Dang_Ky_NQLD/NS08_09_Checklist_Ho_So_Dang_Ky_NQLD.docx",
    "tags": [
      "Thủ tục",
      "Đăng ký NQLĐ"
    ]
  },
  {
    "id": "tl_19",
    "code": "KPI01",
    "title": "Bảng Đánh Giá KPI — Khoi Quan Ly Dieu Hanh 17 Vi Tri",
    "filename": "KPI01_Khoi_Quan_Ly_Dieu_Hanh_17_Vi_Tri.xlsx",
    "category": "kpi",
    "categoryLabel": "Đánh giá KPI",
    "year": 2026,
    "description": "Hệ thống chỉ số KPI tiêu chuẩn theo từng phòng ban chức năng, có trọng số và xếp loại tự động.",
    "featured": true,
    "isHot": true,
    "fileType": "xlsx",
    "fileSize": "42.5 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/04_He_Thong_Danh_Gia_KPI_Cac_Phong_Ban/KPI01_Khoi_Quan_Ly_Dieu_Hanh_17_Vi_Tri.xlsx",
    "tags": [
      "KPI",
      "Hiệu suất"
    ]
  },
  {
    "id": "tl_20",
    "code": "KPI02",
    "title": "Bảng Đánh Giá KPI — Phong Nhan Su 13 Vi Tri",
    "filename": "KPI02_Phong_Nhan_Su_13_Vi_Tri.xlsx",
    "category": "kpi",
    "categoryLabel": "Đánh giá KPI",
    "year": 2026,
    "description": "Hệ thống chỉ số KPI tiêu chuẩn theo từng phòng ban chức năng, có trọng số và xếp loại tự động.",
    "featured": true,
    "isHot": true,
    "fileType": "xlsx",
    "fileSize": "81.1 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/04_He_Thong_Danh_Gia_KPI_Cac_Phong_Ban/KPI02_Phong_Nhan_Su_13_Vi_Tri.xlsx",
    "tags": [
      "KPI",
      "Hiệu suất"
    ]
  },
  {
    "id": "tl_21",
    "code": "KPI03",
    "title": "Bảng Đánh Giá KPI — Phong Tai Chinh Ke Toan 06 Vi Tri",
    "filename": "KPI03_Phong_Tai_Chinh_Ke_Toan_06_Vi_Tri.xlsx",
    "category": "kpi",
    "categoryLabel": "Đánh giá KPI",
    "year": 2026,
    "description": "Hệ thống chỉ số KPI tiêu chuẩn theo từng phòng ban chức năng, có trọng số và xếp loại tự động.",
    "featured": true,
    "isHot": true,
    "fileType": "xlsx",
    "fileSize": "47.8 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/04_He_Thong_Danh_Gia_KPI_Cac_Phong_Ban/KPI03_Phong_Tai_Chinh_Ke_Toan_06_Vi_Tri.xlsx",
    "tags": [
      "KPI",
      "Hiệu suất"
    ]
  },
  {
    "id": "tl_22",
    "code": "KPI04",
    "title": "Bảng Đánh Giá KPI — Phong Hanh Chinh 07 Vi Tri",
    "filename": "KPI04_Phong_Hanh_Chinh_07_Vi_Tri.xlsx",
    "category": "kpi",
    "categoryLabel": "Đánh giá KPI",
    "year": 2026,
    "description": "Hệ thống chỉ số KPI tiêu chuẩn theo từng phòng ban chức năng, có trọng số và xếp loại tự động.",
    "featured": true,
    "isHot": true,
    "fileType": "xlsx",
    "fileSize": "52.9 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/04_He_Thong_Danh_Gia_KPI_Cac_Phong_Ban/KPI04_Phong_Hanh_Chinh_07_Vi_Tri.xlsx",
    "tags": [
      "KPI",
      "Hiệu suất"
    ]
  },
  {
    "id": "tl_23",
    "code": "KPI05",
    "title": "Bảng Đánh Giá KPI — Phong Marketing 08 Vi Tri",
    "filename": "KPI05_Phong_Marketing_08_Vi_Tri.xlsx",
    "category": "kpi",
    "categoryLabel": "Đánh giá KPI",
    "year": 2026,
    "description": "Hệ thống chỉ số KPI tiêu chuẩn theo từng phòng ban chức năng, có trọng số và xếp loại tự động.",
    "featured": true,
    "isHot": true,
    "fileType": "xlsx",
    "fileSize": "58.6 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/04_He_Thong_Danh_Gia_KPI_Cac_Phong_Ban/KPI05_Phong_Marketing_08_Vi_Tri.xlsx",
    "tags": [
      "KPI",
      "Hiệu suất"
    ]
  },
  {
    "id": "tl_24",
    "code": "KPI06",
    "title": "Bảng Đánh Giá KPI — Phong Mua Hang 06 Vi Tri",
    "filename": "KPI06_Phong_Mua_Hang_06_Vi_Tri.xlsx",
    "category": "kpi",
    "categoryLabel": "Đánh giá KPI",
    "year": 2026,
    "description": "Hệ thống chỉ số KPI tiêu chuẩn theo từng phòng ban chức năng, có trọng số và xếp loại tự động.",
    "featured": true,
    "isHot": true,
    "fileType": "xlsx",
    "fileSize": "48.4 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/04_He_Thong_Danh_Gia_KPI_Cac_Phong_Ban/KPI06_Phong_Mua_Hang_06_Vi_Tri.xlsx",
    "tags": [
      "KPI",
      "Hiệu suất"
    ]
  },
  {
    "id": "tl_25",
    "code": "KPI07",
    "title": "Bảng Đánh Giá KPI — Phong Kho Van Logistics 07 Vi Tri",
    "filename": "KPI07_Phong_Kho_Van_Logistics_07_Vi_Tri.xlsx",
    "category": "kpi",
    "categoryLabel": "Đánh giá KPI",
    "year": 2026,
    "description": "Hệ thống chỉ số KPI tiêu chuẩn theo từng phòng ban chức năng, có trọng số và xếp loại tự động.",
    "featured": true,
    "isHot": true,
    "fileType": "xlsx",
    "fileSize": "53.0 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/04_He_Thong_Danh_Gia_KPI_Cac_Phong_Ban/KPI07_Phong_Kho_Van_Logistics_07_Vi_Tri.xlsx",
    "tags": [
      "KPI",
      "Hiệu suất"
    ]
  },
  {
    "id": "tl_26",
    "code": "KPI08",
    "title": "Bảng Đánh Giá KPI — Phong Xuat Nhap Khau 06 Vi Tri",
    "filename": "KPI08_Phong_Xuat_Nhap_Khau_06_Vi_Tri.xlsx",
    "category": "kpi",
    "categoryLabel": "Đánh giá KPI",
    "year": 2026,
    "description": "Hệ thống chỉ số KPI tiêu chuẩn theo từng phòng ban chức năng, có trọng số và xếp loại tự động.",
    "featured": true,
    "isHot": true,
    "fileType": "xlsx",
    "fileSize": "47.9 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/04_He_Thong_Danh_Gia_KPI_Cac_Phong_Ban/KPI08_Phong_Xuat_Nhap_Khau_06_Vi_Tri.xlsx",
    "tags": [
      "KPI",
      "Hiệu suất"
    ]
  },
  {
    "id": "tl_27",
    "code": "KPI09",
    "title": "Bảng Đánh Giá KPI — Phong Ky Thuat RD 06 Vi Tri",
    "filename": "KPI09_Phong_Ky_Thuat_RD_06_Vi_Tri.xlsx",
    "category": "kpi",
    "categoryLabel": "Đánh giá KPI",
    "year": 2026,
    "description": "Hệ thống chỉ số KPI tiêu chuẩn theo từng phòng ban chức năng, có trọng số và xếp loại tự động.",
    "featured": true,
    "isHot": true,
    "fileType": "xlsx",
    "fileSize": "48.1 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/04_He_Thong_Danh_Gia_KPI_Cac_Phong_Ban/KPI09_Phong_Ky_Thuat_RD_06_Vi_Tri.xlsx",
    "tags": [
      "KPI",
      "Hiệu suất"
    ]
  },
  {
    "id": "tl_28",
    "code": "KPI10",
    "title": "Bảng Đánh Giá KPI — Phong Phap Che KSNB 06 Vi Tri",
    "filename": "KPI10_Phong_Phap_Che_KSNB_06_Vi_Tri.xlsx",
    "category": "kpi",
    "categoryLabel": "Đánh giá KPI",
    "year": 2026,
    "description": "Hệ thống chỉ số KPI tiêu chuẩn theo từng phòng ban chức năng, có trọng số và xếp loại tự động.",
    "featured": true,
    "isHot": true,
    "fileType": "xlsx",
    "fileSize": "47.8 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/04_He_Thong_Danh_Gia_KPI_Cac_Phong_Ban/KPI10_Phong_Phap_Che_KSNB_06_Vi_Tri.xlsx",
    "tags": [
      "KPI",
      "Hiệu suất"
    ]
  },
  {
    "id": "tl_29",
    "code": "KPI11",
    "title": "Bảng Đánh Giá KPI — Khoi Du An Xay Dung 12 Vi Tri",
    "filename": "KPI11_Khoi_Du_An_Xay_Dung_12_Vi_Tri.xlsx",
    "category": "kpi",
    "categoryLabel": "Đánh giá KPI",
    "year": 2026,
    "description": "Hệ thống chỉ số KPI tiêu chuẩn theo từng phòng ban chức năng, có trọng số và xếp loại tự động.",
    "featured": true,
    "isHot": true,
    "fileType": "xlsx",
    "fileSize": "78.5 KB",
    "downloadUrl": "/tai-lieu/01_NHAN_SU_VA_TIEN_LUONG/04_He_Thong_Danh_Gia_KPI_Cac_Phong_Ban/KPI11_Khoi_Du_An_Xay_Dung_12_Vi_Tri.xlsx",
    "tags": [
      "KPI",
      "Hiệu suất"
    ]
  },
  {
    "id": "tl_30",
    "code": "KT01",
    "title": "Phần Mềm Kế Toán Excel Chuẩn Thông Tư 99/2025",
    "filename": "KT01_Phan_Mem_Ke_Toan_Excel_TT99.xlsx",
    "category": "ke_toan",
    "categoryLabel": "Kế toán - Thuế",
    "year": 2026,
    "description": "Hệ thống sổ kế toán Excel đầy đủ Nhật ký chung, Sổ cái, Bảng cân đối tài khoản và BCTC theo TT 99.",
    "featured": true,
    "isHot": true,
    "fileType": "xlsx",
    "fileSize": "799.2 KB",
    "downloadUrl": "/tai-lieu/02_KE_TOAN_VA_TAI_CHINH/01_So_Sach_Va_Phan_Mem_Ke_Toan/KT01_Phan_Mem_Ke_Toan_Excel_TT99.xlsx",
    "tags": [
      "TT 99/2025",
      "Phần mềm Excel",
      "Hot"
    ]
  },
  {
    "id": "tl_31",
    "code": "KT02",
    "title": "Bộ Báo Cáo Tài Chính Thông Tư 133/2016",
    "filename": "KT02_Bo_Bao_Cao_Tai_Chinh_TT133.xlsx",
    "category": "ke_toan",
    "categoryLabel": "Kế toán - Thuế",
    "year": 2026,
    "description": "Bộ mẫu Báo cáo tài chính doanh nghiệp nhỏ và vừa theo TT 133: B01a, B02, B03 và Thuyết minh BCTC.",
    "featured": false,
    "isHot": true,
    "fileType": "xlsx",
    "fileSize": "55.8 KB",
    "downloadUrl": "/tai-lieu/02_KE_TOAN_VA_TAI_CHINH/02_Bao_Cao_Tai_Chinh/KT02_Bo_Bao_Cao_Tai_Chinh_TT133.xlsx",
    "tags": [
      "BCTC",
      "TT 133"
    ]
  },
  {
    "id": "tl_32",
    "code": "KT03",
    "title": "Bảng Theo Dõi & Trích Khấu Hao TSCĐ Tự Động",
    "filename": "KT03_Bang_Tinh_Khau_Hao_Tai_San_Co_Dinh.xlsx",
    "category": "ke_toan",
    "categoryLabel": "Kế toán - Thuế",
    "year": 2026,
    "description": "Bảng tính khấu hao tài sản cố định phương pháp đường thẳng chuẩn Thông tư 45/2013/TT-BTC.",
    "featured": false,
    "isHot": true,
    "fileType": "xlsx",
    "fileSize": "142.2 KB",
    "downloadUrl": "/tai-lieu/02_KE_TOAN_VA_TAI_CHINH/03_Tai_San_Co_Dinh_Va_Chi_Phi_Tra_Truoc/KT03_Bang_Tinh_Khau_Hao_Tai_San_Co_Dinh.xlsx",
    "tags": [
      "TSCĐ",
      "Khấu hao"
    ]
  },
  {
    "id": "tl_33",
    "code": "KT04",
    "title": "Sổ Theo Dõi & Phân Bổ Chi Phí Trả Trước (TK 242)",
    "filename": "KT04_So_Theo_Doi_Phan_Bo_Chi_Phi_Tra_Truoc_242.xlsx",
    "category": "ke_toan",
    "categoryLabel": "Kế toán - Thuế",
    "year": 2026,
    "description": "Sổ quản lý phân bổ công cụ dụng cụ, tiền thuê nhà, bảo hiểm trả trước vào chi phí từng kỳ.",
    "featured": false,
    "isHot": false,
    "fileType": "xlsx",
    "fileSize": "143.3 KB",
    "downloadUrl": "/tai-lieu/02_KE_TOAN_VA_TAI_CHINH/03_Tai_San_Co_Dinh_Va_Chi_Phi_Tra_Truoc/KT04_So_Theo_Doi_Phan_Bo_Chi_Phi_Tra_Truoc_242.xlsx",
    "tags": [
      "TK 242",
      "Phân bổ"
    ]
  },
  {
    "id": "tl_34",
    "code": "KT05",
    "title": "Trọn Bộ Hồ Sơ Pháp Lý Thanh Lý TSCĐ 2026",
    "filename": "KT05_Bo_Ho_So_Thanh_Ly_Tai_San_Co_Dinh_2026.docx",
    "category": "ke_toan",
    "categoryLabel": "Kế toán - Thuế",
    "year": 2026,
    "description": "Hồ sơ thanh lý tài sản: Quyết định thành lập hội đồng, biên bản thẩm định, biên bản thanh lý và hóa đơn.",
    "featured": true,
    "isHot": true,
    "fileType": "docx",
    "fileSize": "54.1 KB",
    "downloadUrl": "/tai-lieu/02_KE_TOAN_VA_TAI_CHINH/03_Tai_San_Co_Dinh_Va_Chi_Phi_Tra_Truoc/KT05_Bo_Ho_So_Thanh_Ly_Tai_San_Co_Dinh_2026.docx",
    "tags": [
      "Thanh lý TSCĐ",
      "Hồ sơ thuế"
    ]
  },
  {
    "id": "tl_35",
    "code": "KT06",
    "title": "Công Cụ Tính Giá Thành Sản Xuất & Đối Chiếu TK 154",
    "filename": "KT06_Cong_Cu_Tinh_Gia_Thanh_San_Xuat.xlsx",
    "category": "ke_toan",
    "categoryLabel": "Kế toán - Thuế",
    "year": 2026,
    "description": "Công cụ tính giá thành sản xuất, tập hợp chi phí 621, 622, 627 và kiểm soát dở dang cuối kỳ.",
    "featured": false,
    "isHot": false,
    "fileType": "xlsx",
    "fileSize": "158.5 KB",
    "downloadUrl": "/tai-lieu/02_KE_TOAN_VA_TAI_CHINH/04_Ke_Toan_Gia_Thanh_San_Xuat/KT06_Cong_Cu_Tinh_Gia_Thanh_San_Xuat.xlsx",
    "tags": [
      "Giá thành",
      "TK 154"
    ]
  },
  {
    "id": "tl_36",
    "code": "KT07",
    "title": "Hệ Thống Quản Lý Công Nợ & Phân Tích Tuổi Nợ",
    "filename": "KT07_He_Thong_Quan_Ly_Cong_No_Va_Tuoi_No.xlsx",
    "category": "ke_toan",
    "categoryLabel": "Kế toán - Thuế",
    "year": 2026,
    "description": "Bảng theo dõi công nợ phải thu, phải trả và biểu đồ cảnh báo tuổi nợ quá hạn chi tiết.",
    "featured": false,
    "isHot": true,
    "fileType": "xlsx",
    "fileSize": "158.6 KB",
    "downloadUrl": "/tai-lieu/02_KE_TOAN_VA_TAI_CHINH/05_Quan_Ly_Cong_No_Hop_Dong_Kinh_Te/KT07_He_Thong_Quan_Ly_Cong_No_Va_Tuoi_No.xlsx",
    "tags": [
      "Công nợ",
      "Tuổi nợ"
    ]
  },
  {
    "id": "tl_37",
    "code": "KT08",
    "title": "Sổ Theo Dõi & Quản Trị Hợp Đồng Kinh Tế",
    "filename": "KT08_So_Theo_Doi_Quan_Tri_Hop_Dong_Kinh_Te.xlsx",
    "category": "ke_toan",
    "categoryLabel": "Kế toán - Thuế",
    "year": 2026,
    "description": "Sổ quản lý hợp đồng kinh tế, theo dõi tiến độ nghiệm thu và lịch trình thanh toán nhà cung cấp/khách hàng.",
    "featured": false,
    "isHot": false,
    "fileType": "xlsx",
    "fileSize": "141.1 KB",
    "downloadUrl": "/tai-lieu/02_KE_TOAN_VA_TAI_CHINH/05_Quan_Ly_Cong_No_Hop_Dong_Kinh_Te/KT08_So_Theo_Doi_Quan_Tri_Hop_Dong_Kinh_Te.xlsx",
    "tags": [
      "HĐ kinh tế",
      "Sổ theo dõi"
    ]
  },
  {
    "id": "tl_38",
    "code": "KT09",
    "title": "Hợp Đồng Vay Vốn Giữa Các Doanh Nghiệp",
    "filename": "KT09_Hop_Dong_Vay_Von_Doanh_Nghiep.docx",
    "category": "hop_dong",
    "categoryLabel": "Hợp đồng",
    "year": 2026,
    "description": "Mẫu hợp đồng vay vốn doanh nghiệp chặt chẽ về lãi suất và điều khoản giao dịch liên kết.",
    "featured": false,
    "isHot": false,
    "fileType": "docx",
    "fileSize": "49.1 KB",
    "downloadUrl": "/tai-lieu/02_KE_TOAN_VA_TAI_CHINH/05_Quan_Ly_Cong_No_Hop_Dong_Kinh_Te/KT09_Hop_Dong_Vay_Von_Doanh_Nghiep.docx",
    "tags": [
      "Vay vốn",
      "Hợp đồng"
    ]
  },
  {
    "id": "tl_39",
    "code": "KT10",
    "title": "Hợp Đồng Thuê Văn Phòng / Mặt Bằng Nhà Xưởng",
    "filename": "KT10_Hop_Dong_Thue_Van_Phong_Nha_Xuong.docx",
    "category": "hop_dong",
    "categoryLabel": "Hợp đồng",
    "year": 2026,
    "description": "Mẫu hợp đồng thuê nhà xưởng, văn phòng kinh doanh đầy đủ điều khoản bàn giao và thuế.",
    "featured": false,
    "isHot": false,
    "fileType": "docx",
    "fileSize": "51.8 KB",
    "downloadUrl": "/tai-lieu/02_KE_TOAN_VA_TAI_CHINH/05_Quan_Ly_Cong_No_Hop_Dong_Kinh_Te/KT10_Hop_Dong_Thue_Van_Phong_Nha_Xuong.docx",
    "tags": [
      "Thuê nhà",
      "Văn phòng"
    ]
  },
  {
    "id": "tl_40",
    "code": "KT11",
    "title": "Hợp Đồng Thuê Máy Móc, Thiết Bị, Xe Ô Tô",
    "filename": "KT11_Hop_Dong_Thue_May_Moc_Thiet_Bi_Xe.docx",
    "category": "hop_dong",
    "categoryLabel": "Hợp đồng",
    "year": 2026,
    "description": "Hợp đồng thuê tài sản, máy móc phục vụ hoạt động sản xuất kinh doanh.",
    "featured": false,
    "isHot": false,
    "fileType": "docx",
    "fileSize": "50.7 KB",
    "downloadUrl": "/tai-lieu/02_KE_TOAN_VA_TAI_CHINH/05_Quan_Ly_Cong_No_Hop_Dong_Kinh_Te/KT11_Hop_Dong_Thue_May_Moc_Thiet_Bi_Xe.docx",
    "tags": [
      "Thuê tài sản",
      "Xe ô tô"
    ]
  },
  {
    "id": "tl_41",
    "code": "KT12",
    "title": "Quy Chế Chi Tiêu Nội Bộ Doanh Nghiệp 2026",
    "filename": "KT12_Quy_Che_Chi_Tieu_Noi_Bo_Doanh_Nghiep.docx",
    "category": "ke_toan",
    "categoryLabel": "Kế toán - Thuế",
    "year": 2026,
    "description": "Quy chế phân quyền duyệt chi, định mức công tác phí, tiếp khách, điện thoại chuẩn chi phí được trừ.",
    "featured": true,
    "isHot": true,
    "fileType": "docx",
    "fileSize": "54.2 KB",
    "downloadUrl": "/tai-lieu/02_KE_TOAN_VA_TAI_CHINH/06_Quy_Trinh_Quy_Che_Van_Hanh/KT12_Quy_Che_Chi_Tieu_Noi_Bo_Doanh_Nghiep.docx",
    "tags": [
      "Chi tiêu nội bộ",
      "Quy chế"
    ]
  },
  {
    "id": "tl_42",
    "code": "KT13",
    "title": "Quy Chế Quản Lý Hàng Tồn Kho 2026",
    "filename": "KT13_Quy_Che_Quan_Ly_Hang_Ton_Kho_2026.docx",
    "category": "ke_toan",
    "categoryLabel": "Kế toán - Thuế",
    "year": 2026,
    "description": "Quy chế kiểm soát nhập - xuất - tồn, quy trình kiểm kê định kỳ và xử lý hao hụt dự phòng giảm giá.",
    "featured": false,
    "isHot": false,
    "fileType": "docx",
    "fileSize": "21.9 KB",
    "downloadUrl": "/tai-lieu/02_KE_TOAN_VA_TAI_CHINH/06_Quy_Trinh_Quy_Che_Van_Hanh/KT13_Quy_Che_Quan_Ly_Hang_Ton_Kho_2026.docx",
    "tags": [
      "Tồn kho",
      "Kho vận"
    ]
  },
  {
    "id": "tl_43",
    "code": "KT14",
    "title": "Quy Trình Mua Hàng & Thanh Toán Nhà Cung Cấp",
    "filename": "KT14_Quy_Trinh_Mua_Hang_Va_Thanh_Toan_NCC.docx",
    "category": "ke_toan",
    "categoryLabel": "Kế toán - Thuế",
    "year": 2026,
    "description": "Quy trình kiểm soát đề nghị mua sắm, thẩm định báo giá và đối chiếu 3 bên trước khi thanh toán.",
    "featured": false,
    "isHot": false,
    "fileType": "docx",
    "fileSize": "24.0 KB",
    "downloadUrl": "/tai-lieu/02_KE_TOAN_VA_TAI_CHINH/06_Quy_Trinh_Quy_Che_Van_Hanh/KT14_Quy_Trinh_Mua_Hang_Va_Thanh_Toan_NCC.docx",
    "tags": [
      "Mua hàng",
      "Thanh toán"
    ]
  },
  {
    "id": "tl_44",
    "code": "TH01",
    "title": "Ma Trận Kiểm Soát 57 Khoản Chi Tiền Lương, Thuế & BHXH",
    "filename": "TH01_Ma_Tran_Kiem_Soat_3_Nghia_Vu_Thue_Va_BHXH.pdf",
    "category": "thue",
    "categoryLabel": "Kế toán - Thuế",
    "year": 2026,
    "description": "Công cụ ma trận kiểm soát đồng thời 3 nghĩa vụ: Thuế TNCN, BHXH bắt buộc và Chi phí được trừ Thuế TNDN.",
    "featured": true,
    "isHot": true,
    "fileType": "pdf",
    "fileSize": "178.7 KB",
    "downloadUrl": "/tai-lieu/03_THUE_VA_PHAP_LY_DOANH_NGHIEP/01_Chinh_Sach_Thue_TNDN_TNCN_GTGT/TH01_Ma_Tran_Kiem_Soat_3_Nghia_Vu_Thue_Va_BHXH.pdf",
    "tags": [
      "Ma trận 57 khoản",
      "Hot",
      "Cập nhật 2026"
    ]
  },
  {
    "id": "tl_45",
    "code": "TH01",
    "title": "Ma Trận Kiểm Soát 57 Khoản Chi Tiền Lương, Thuế & BHXH",
    "filename": "TH01_Ma_Tran_Kiem_Soat_57_Khoan_Chi_Luong_BHXH_Thue_KK_HOME.xlsx",
    "category": "thue",
    "categoryLabel": "Kế toán - Thuế",
    "year": 2026,
    "description": "Công cụ ma trận kiểm soát đồng thời 3 nghĩa vụ: Thuế TNCN, BHXH bắt buộc và Chi phí được trừ Thuế TNDN.",
    "featured": true,
    "isHot": true,
    "fileType": "xlsx",
    "fileSize": "9.7 KB",
    "downloadUrl": "/tai-lieu/03_THUE_VA_PHAP_LY_DOANH_NGHIEP/01_Chinh_Sach_Thue_TNDN_TNCN_GTGT/TH01_Ma_Tran_Kiem_Soat_57_Khoan_Chi_Luong_BHXH_Thue_KK_HOME.xlsx",
    "tags": [
      "Ma trận 57 khoản",
      "Hot",
      "Cập nhật 2026"
    ]
  },
  {
    "id": "tl_46",
    "code": "TH02",
    "title": "Công Văn 6436/CT-PC: Hướng Dẫn Những Điểm Cốt Lõi NNT Cần Biết",
    "filename": "TH02_CV6436_CT_Nhung_Dieu_NNT_Can_Biet_Luat_Moi.pdf",
    "category": "thue",
    "categoryLabel": "Thuế & Pháp lý",
    "year": 2026,
    "description": "Cẩm nang tuyên truyền phổ biến những điểm mới cơ bản nhất người nộp thuế cần nắm theo Luật Quản lý thuế mới.",
    "featured": false,
    "isHot": false,
    "fileType": "pdf",
    "fileSize": "4040.6 KB",
    "downloadUrl": "/tai-lieu/03_THUE_VA_PHAP_LY_DOANH_NGHIEP/01_Chinh_Sach_Thue_TNDN_TNCN_GTGT/TH02_CV6436_CT_Nhung_Dieu_NNT_Can_Biet_Luat_Moi.pdf",
    "tags": [
      "CV 6436",
      "Cục Thuế"
    ]
  },
  {
    "id": "tl_47",
    "code": "TH03",
    "title": "Công Văn 10311/CTNBI: Chính Sách Thuế TNCN Với Chi Phí Lao Động",
    "filename": "TH03_CV10311_CTNBI_Chinh_Sach_Thue_TNCN.pdf",
    "category": "thue",
    "categoryLabel": "Thuế & Pháp lý",
    "year": 2026,
    "description": "Công văn hướng dẫn về tính thuế TNCN đối với các khoản chi trả phúc lợi và phụ cấp người lao động.",
    "featured": false,
    "isHot": false,
    "fileType": "pdf",
    "fileSize": "1985.6 KB",
    "downloadUrl": "/tai-lieu/03_THUE_VA_PHAP_LY_DOANH_NGHIEP/01_Chinh_Sach_Thue_TNDN_TNCN_GTGT/TH03_CV10311_CTNBI_Chinh_Sach_Thue_TNCN.pdf",
    "tags": [
      "CV 10311",
      "Thuế TNCN"
    ]
  },
  {
    "id": "tl_48",
    "code": "TH04",
    "title": "Công Văn 2590/BTC: Thuế GTGT Dịch Vụ Xuất Khẩu Doanh Nghiệp EPE",
    "filename": "TH04_CV2590_BTC_Thue_GTGT_Dich_Vu_Xuat_Khau_EPE.pdf",
    "category": "thue",
    "categoryLabel": "Thuế & Pháp lý",
    "year": 2026,
    "description": "Văn bản của Bộ Tài chính hướng dẫn chính sách thuế GTGT dịch vụ xuất khẩu cho doanh nghiệp chế xuất.",
    "featured": false,
    "isHot": false,
    "fileType": "pdf",
    "fileSize": "3847.6 KB",
    "downloadUrl": "/tai-lieu/03_THUE_VA_PHAP_LY_DOANH_NGHIEP/01_Chinh_Sach_Thue_TNDN_TNCN_GTGT/TH04_CV2590_BTC_Thue_GTGT_Dich_Vu_Xuat_Khau_EPE.pdf",
    "tags": [
      "CV 2590",
      "Thuế GTGT"
    ]
  },
  {
    "id": "tl_49",
    "code": "TH05",
    "title": "Cẩm Nang Hướng Dẫn Giải Thể & Khôi Phục Mã Số Thuế",
    "filename": "TH05_Tai_Lieu_Huong_Dan_Giai_The_Khoi_Phuc_MST.pdf",
    "category": "thue",
    "categoryLabel": "Thuế & Pháp lý",
    "year": 2026,
    "description": "Tài liệu chi tiết các bước và hồ sơ thực hiện khi giải thể, tạm ngừng hoặc khôi phục hiệu lực MST.",
    "featured": false,
    "isHot": false,
    "fileType": "pdf",
    "fileSize": "786.7 KB",
    "downloadUrl": "/tai-lieu/03_THUE_VA_PHAP_LY_DOANH_NGHIEP/02_Thu_Tuc_Ma_So_Thue_Va_Dang_Ky_Kinh_Doanh/TH05_Tai_Lieu_Huong_Dan_Giai_The_Khoi_Phuc_MST.pdf",
    "tags": [
      "Mã số thuế",
      "Giải thể"
    ]
  },
  {
    "id": "tl_50",
    "code": "TH06",
    "title": "Tài Liệu Tập Huấn Đăng Ký Hộ Kinh Doanh Điện Tử Qua Mạng",
    "filename": "TH06_Tai_Lieu_Tap_Huan_Dang_Ky_Ho_Kinh_Doanh_Qua_Mang.pdf",
    "category": "thue",
    "categoryLabel": "Thuế & Pháp lý",
    "year": 2026,
    "description": "Tài liệu tập huấn quy trình đăng ký HKD điện tử qua cổng thông tin quốc gia của Cục Phát triển DN.",
    "featured": false,
    "isHot": false,
    "fileType": "pdf",
    "fileSize": "1633.8 KB",
    "downloadUrl": "/tai-lieu/03_THUE_VA_PHAP_LY_DOANH_NGHIEP/02_Thu_Tuc_Ma_So_Thue_Va_Dang_Ky_Kinh_Doanh/TH06_Tai_Lieu_Tap_Huan_Dang_Ky_Ho_Kinh_Doanh_Qua_Mang.pdf",
    "tags": [
      "Hộ kinh doanh",
      "ĐKKD"
    ]
  },
  {
    "id": "tl_51",
    "code": "BH01",
    "title": "Bảng Tra Cứu Căn Cứ Đóng & Miễn Đóng BHXH Bắt Buộc Mới",
    "filename": "BH01_Ma_Tran_Kiem_Soat_57_Khoan_Chi_Luong_BHXH_Thue_KK_HOME.xlsx",
    "category": "bhxh",
    "categoryLabel": "Bảo hiểm Xã hội",
    "year": 2026,
    "description": "Bảng phân định chi tiết các khoản thu nhập tính đóng và miễn đóng BHXH bắt buộc theo Luật BHXH mới nhất.",
    "featured": true,
    "isHot": true,
    "fileType": "xlsx",
    "fileSize": "9.7 KB",
    "downloadUrl": "/tai-lieu/04_BAO_HIEM_XA_HOI/01_Chinh_Sach_Va_Can_Cu_Trich_Dong_BHXH/BH01_Ma_Tran_Kiem_Soat_57_Khoan_Chi_Luong_BHXH_Thue_KK_HOME.xlsx",
    "tags": [
      "Căn cứ đóng BHXH",
      "Luật mới"
    ]
  },
  {
    "id": "tl_52",
    "code": "BH02",
    "title": "Hợp Đồng Lao Động Người Đang Hưởng Lương Hưu",
    "filename": "BH02_Hop_Dong_Lao_Dong_Nguoi_Huong_Luong_Huu.docx",
    "category": "bhxh",
    "categoryLabel": "Bảo hiểm Xã hội",
    "year": 2026,
    "description": "Hợp đồng lao động với người cao tuổi/nghỉ hưu: không đóng BHXH, chi trả phụ cấp BHXH trực tiếp vào lương.",
    "featured": false,
    "isHot": true,
    "fileType": "docx",
    "fileSize": "20.2 KB",
    "downloadUrl": "/tai-lieu/04_BAO_HIEM_XA_HOI/02_Che_Do_Lao_Dong_Dac_Thu/BH02_Hop_Dong_Lao_Dong_Nguoi_Huong_Luong_Huu.docx",
    "tags": [
      "Hưu trí",
      "HĐLĐ"
    ]
  },
  {
    "id": "tl_53",
    "code": "BH03",
    "title": "Hợp Đồng Dịch Vụ Kế Toán, Thuế & Thủ Tục BHXH",
    "filename": "BH03_Hop_Dong_Dich_Vu_Ke_Toan_BHXH_Thue_TNCN.docx",
    "category": "bhxh",
    "categoryLabel": "Bảo hiểm Xã hội",
    "year": 2026,
    "description": "Hợp đồng mẫu thuê dịch vụ kế toán thuế và đại lý thực hiện thủ tục bảo hiểm xã hội.",
    "featured": false,
    "isHot": false,
    "fileType": "docx",
    "fileSize": "117.7 KB",
    "downloadUrl": "/tai-lieu/04_BAO_HIEM_XA_HOI/02_Che_Do_Lao_Dong_Dac_Thu/BH03_Hop_Dong_Dich_Vu_Ke_Toan_BHXH_Thue_TNCN.docx",
    "tags": [
      "Thuê dịch vụ",
      "HĐ đại lý"
    ]
  }
];
