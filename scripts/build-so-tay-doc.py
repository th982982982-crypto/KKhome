import json
import re
import os
import html as htmllib
import pypdf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PDF_PATH = os.path.join(ROOT, 'VBAN', 'Cuc-Thue_So-tay-thue-dien-tu-TNDN-2026.pdf')
OUT_DIR = os.path.join(ROOT, 'src', 'legal-docs', 'so-tay-tndn-2026')
SUMMARIES_FILE = os.path.join(ROOT, 'src', 'lib', 'legal', 'summaries.json')
CROSSREFS_FILE = os.path.join(ROOT, 'src', 'lib', 'legal', 'cross-refs.json')

# 1. Read PDF pages
reader = pypdf.PdfReader(PDF_PATH)
pages = [page.extract_text() or '' for page in reader.pages]

print(f"Extracted {len(pages)} pages from PDF.")

CHAPTERS_DEF = [
    {
        'num': 1,
        'label': 'Chủ đề 01',
        'title': 'Chính sách miễn thuế doanh nghiệp siêu nhỏ & quy định chuyển tiếp',
        'chuong': 'Chủ đề 01 — Miễn thuế DN siêu nhỏ & chuyển tiếp',
        'q_start': 1, 'q_end': 8,
        'overview_page': 4,
        'q_pages': [5, 6]
    },
    {
        'num': 2,
        'label': 'Chủ đề 02',
        'title': 'Thuế suất theo quy mô doanh thu & phương pháp xác định',
        'chuong': 'Chủ đề 02 — Thuế suất theo quy mô doanh thu',
        'q_start': 9, 'q_end': 12,
        'overview_page': 8,
        'q_pages': [9]
    },
    {
        'num': 3,
        'label': 'Chủ đề 03',
        'title': 'Thời điểm và phương pháp xác định doanh thu tính thuế',
        'chuong': 'Chủ đề 03 — Thời điểm & phương pháp tính doanh thu',
        'q_start': 13, 'q_end': 23,
        'overview_page': 11,
        'q_pages': [12, 13]
    },
    {
        'num': 4,
        'label': 'Chủ đề 04',
        'title': 'Chi phí được trừ & hạ ngưỡng thanh toán không dùng tiền mặt xuống 5 triệu đồng',
        'chuong': 'Chủ đề 04 — Điều kiện chi phí & thanh toán tiền mặt',
        'q_start': 24, 'q_end': 25,
        'overview_page': 15,
        'q_pages': [16]
    },
    {
        'num': 5,
        'label': 'Chủ đề 05',
        'title': 'Khấu trừ bổ sung R&D 200%, Quỹ KH&CN & chi phí cộng đồng',
        'chuong': 'Chủ đề 05 — Khuyến khích đầu tư, R&D & tài trợ',
        'q_start': 26, 'q_end': 46,
        'overview_page': 18,
        'q_pages': [19, 20, 21, 22]
    },
    {
        'num': 6,
        'label': 'Chủ đề 06',
        'title': 'Chi phí không được trừ & giới hạn khống chế nhân sự, tài chính',
        'chuong': 'Chủ đề 06 — Chi phí không được trừ & giới hạn khống chế',
        'q_start': 47, 'q_end': 69,
        'overview_page': 24,
        'q_pages': [25, 26, 27, 28]
    },
    {
        'num': 7,
        'label': 'Chủ đề 07',
        'title': 'Thu nhập chịu thuế khác & nguyên tắc chuyển lỗ tối đa 5 năm',
        'chuong': 'Chủ đề 07 — Thu nhập khác & nguyên tắc chuyển lỗ',
        'q_start': 70, 'q_end': 75,
        'overview_page': 30,
        'q_pages': [31]
    },
    {
        'num': 8,
        'label': 'Chủ đề 08',
        'title': 'Đặc quyền miễn thuế TNDN lĩnh vực xanh & an sinh xã hội',
        'chuong': 'Chủ đề 08 — Miễn thuế lĩnh vực xanh & an sinh xã hội',
        'q_start': 76, 'q_end': 88,
        'overview_page': 33,
        'q_pages': [34, 35]
    },
    {
        'num': 9,
        'label': 'Chủ đề 09',
        'title': 'Thuế suất ưu đãi 10%, 17%, thời gian miễn giảm & địa bàn ưu đãi',
        'chuong': 'Chủ đề 09 — Thuế suất ưu đãi & địa bàn',
        'q_start': 89, 'q_end': 100,
        'overview_page': 37,
        'q_pages': [38, 39]
    }
]

def clean_noise(text):
    lines = []
    for line in text.split('\n'):
        s = line.strip()
        if not s:
            continue
        if 'BỘ TÀI CHÍNH – CỤC THUẾ' in s or 'SỔ TAY THUẾ DOANH NGHIỆP' in s:
            continue
        if 'NGHỊ ĐỊNH 320/2025' in s or '141/2026/NĐ-CP' in s:
            continue
        if re.match(r'^Trang\s+\d+\s*/\s*45$', s):
            continue
        if re.search(r'CHỦ ĐỀ\s+\d+\s*/.*?PHẦN\s+[IVXLCDM]+', s):
            continue
        lines.append(s)
    return '\n'.join(lines)

outline = []
summaries_map = {}

# Process 9 Chapters
for ch in CHAPTERS_DEF:
    ch_num = ch['num']
    ch_id = f"cd_{ch_num}"
    
    # 1. Overview item
    ov_raw = clean_noise(pages[ch['overview_page'] - 1])
    # Build blocks for overview
    ov_lines = [l.strip() for l in ov_raw.split('\n') if l.strip()]
    ov_blocks = []
    ov_summary_text = ""
    points = []
    
    # Extract paragraphs and note points
    mode = 'intro'
    intro_paras = []
    curr_p = []
    for line in ov_lines:
        if 'TỔNG QUAN CHÍNH SÁCH' in line or 'Tóm tắt chính sách' in line:
            continue
        if 'CÁC ĐIỂM CỐT LÕI' in line:
            if curr_p:
                intro_paras.append(' '.join(curr_p))
                curr_p = []
            mode = 'points'
            continue
        if 'Văn bản áp dụng chủ đạo' in line:
            if curr_p:
                if mode == 'points':
                    points.append(' '.join(curr_p).lstrip('✔💡•- '))
                else:
                    intro_paras.append(' '.join(curr_p))
                curr_p = []
            mode = 'van_ban'
            intro_paras.append(line)
            continue
            
        if mode == 'intro':
            if line.endswith('.'):
                curr_p.append(line)
                intro_paras.append(' '.join(curr_p))
                curr_p = []
            else:
                curr_p.append(line)
        elif mode == 'points':
            if line.startswith('✔') or line.startswith('💡') or line.startswith('•'):
                if curr_p:
                    points.append(' '.join(curr_p).lstrip('✔💡•- '))
                    curr_p = []
                curr_p.append(line)
            else:
                curr_p.append(line)
    if curr_p:
        if mode == 'points':
            points.append(' '.join(curr_p).lstrip('✔💡•- '))
        else:
            intro_paras.append(' '.join(curr_p))

    ov_blocks.append({'k': 'h3', 't': f"Tổng quan {ch['title']}"})
    for p in intro_paras:
        ov_blocks.append({'k': 'p', 't': p})
    if points:
        ov_blocks.append({'k': 'h3', 't': 'Các điểm cốt lõi doanh nghiệp cần đặc biệt lưu ý:'})
        for pt in points:
            ov_blocks.append({'k': 'p', 't': f"✔ {pt}"})

    outline.append({
        'id': ch_id,
        'label': ch['label'],
        'shortTitle': f"Tổng quan: {ch['title']}",
        'chuong': ch['chuong'],
        'content': ov_blocks
    })
    
    tldr_ov = intro_paras[0] if intro_paras else ch['title']
    summaries_map[ch_id] = {
        'tldr': tldr_ov[:250],
        'points': points[:4] if points else [tldr_ov[:120]]
    }

    # 2. Questions in this chapter
    raw_q_text = ""
    for p_idx in ch['q_pages']:
        raw_q_text += "\n" + clean_noise(pages[p_idx - 1])
    
    for q_num in range(ch['q_start'], ch['q_end'] + 1):
        q_id = f"st_{q_num}"
        # Match starting at CÂU {q_num}
        m_start = re.search(rf'(?m)^CÂU\s+{q_num}\b\s*(.*?)$', raw_q_text)
        if not m_start:
            m_start = re.search(rf'CÂU\s+{q_num}\b\s*([^\n]+)', raw_q_text)
            
        start_pos = m_start.start()
        if q_num < ch['q_end']:
            m_next = re.search(rf'(?m)^CÂU\s+{q_num+1}\b', raw_q_text[start_pos+6:])
            if not m_next:
                m_next = re.search(rf'CÂU\s+{q_num+1}\b', raw_q_text[start_pos+6:])
            end_pos = start_pos + 6 + m_next.start() if m_next else len(raw_q_text)
        else:
            end_pos = len(raw_q_text)
            
        block = raw_q_text[start_pos:end_pos].strip()
        
        # Parse Question Title, Answer, Legal Basis
        # Title is from start until "TRẢ LỜI"
        q_title_match = re.search(r'CÂU\s+\d+\s+(.*?)(?=\bTRẢ LỜI\b|$)', block, re.DOTALL)
        q_title = q_title_match.group(1).strip().replace('\n', ' ') if q_title_match else f"Tình huống số {q_num}"
        # Clean multiple spaces
        q_title = re.sub(r'\s+', ' ', q_title)
        
        ans_part = block[block.find("TRẢ LỜI")+7:].strip() if "TRẢ LỜI" in block else block
        
        # Separate legal basis
        legal_basis = ""
        m_legal = re.search(r'(CĂN CỨ PHÁP LÝ:?\s*.*)$', ans_part, re.DOTALL | re.IGNORECASE)
        if m_legal:
            legal_basis = m_legal.group(1).strip().replace('\n', ' ')
            legal_basis = re.sub(r'\s+', ' ', legal_basis)
            ans_text = ans_part[:m_legal.start()].strip()
        else:
            ans_text = ans_part
            
        ans_clean = re.sub(r'\s+', ' ', ans_text.replace('\n', ' ')).strip()
        
        # Content blocks
        q_blocks = [
            {'k': 'h3', 't': f"CÂU {q_num}: {q_title}"},
            {'k': 'p', 't': f"<b>TRẢ LỜI:</b>"},
            {'k': 'p', 't': ans_clean}
        ]
        if legal_basis:
            q_blocks.append({'k': 'p', 't': f"<b>{legal_basis}</b>"})
            
        outline.append({
            'id': q_id,
            'label': f"Câu {q_num}",
            'shortTitle': q_title,
            'chuong': ch['chuong'],
            'content': q_blocks
        })
        
        # Summaries for question
        tldr_q = ans_clean[:220]
        pts_q = []
        if legal_basis:
            pts_q.append(legal_basis[:180])
        pts_q.append(f"Áp dụng cho doanh nghiệp xử lý thuế TNDN năm 2026.")
        
        summaries_map[q_id] = {
            'tldr': tldr_q,
            'points': pts_q
        }

# 3. Add Appendices
# Lời kết & Khuyến nghị (Page 40-41)
p40_text = clean_noise(pages[39])
p41_text = clean_noise(pages[40])
loi_ket_blocks = [
    {'k': 'h3', 't': 'LỜI KẾT TỪ BAN BIÊN SOẠN — KHUYẾN NGHỊ QUẢN TRỊ THUẾ 2026'},
    {'k': 'p', 't': 'Sự tương tác chính sách giữa Nghị định số 320/2025/NĐ-CP và Nghị định số 141/2026/NĐ-CP tạo khung quản trị thuế mới cho doanh nghiệp năm 2026. Việc nắm vững ngưỡng miễn thuế, biểu thuế suất theo quy mô, điều kiện chi phí được trừ và nguyên tắc ưu đãi địa bàn giúp doanh nghiệp chủ động dòng tiền, giảm rủi ro bị loại chi phí và bảo toàn quyền lợi hợp pháp.'},
    {'k': 'p', 't': '⚖ <b>THƯỢNG TÔN PHÁP LUẬT:</b> Tuân thủ nghiêm ngặt các quy định về điều kiện chi phí được trừ, hóa đơn điện tử hợp pháp và thanh toán qua ngân hàng để triệt tiêu mọi rủi ro xử phạt.'},
    {'k': 'p', 't': '⚡ <b>SỐ HÓA BỘ LỌC HÓA ĐƠN:</b> Hạ ngưỡng thanh toán xuống 5 triệu đồng đòi hỏi chuyển đổi số ngay trong quy trình kiểm soát mua hàng và tích hợp phần mềm kế toán tự động cảnh báo.'},
    {'k': 'p', 't': '📈 <b>TỐI ƯU ƯU ĐÃI & DÒNG TIỀN:</b> Tận dụng triệt để chính sách miễn thuế DN siêu nhỏ, khấu trừ bổ sung R&D (200%), trích lập Quỹ KH&CN và ưu đãi thuế suất địa bàn để tái đầu tư mở rộng.'},
    {'k': 'h3', 't': 'CHECKLIST 03 NHÓM GIẢI PHÁP QUẢN TRỊ CẤP BÁCH NĂM 2026:'},
    {'k': 'p', 't': '1. <b>Chủ động thiết lập bộ lọc giao dịch tự động trong bộ phận kế toán:</b> Với việc hạ ngưỡng thanh toán không dùng tiền mặt xuống 5 triệu đồng, doanh nghiệp cần tích hợp phần mềm hóa đơn điện tử có khả năng cảnh báo giao dịch cộng gộp trong ngày vượt mức quy định. Bộ phận mua hàng phải thanh toán qua ngân hàng đối với mọi hóa đơn từ 5 triệu đồng trở lên.'},
    {'k': 'p', 't': '2. <b>Hoàn thiện cấu trúc hồ sơ chứng minh chi phí đặc thù:</b> Doanh nghiệp áp dụng khấu trừ bổ sung chi phí R&D (tối đa 200%) hoặc trích lập Quỹ KH&CN phải có báo cáo nghiên cứu khả thi, hóa đơn thiết bị thí nghiệm và danh sách nhân sự dự án lưu trữ nội bộ đầy đủ.'},
    {'k': 'p', 't': '3. <b>Định vị chính xác địa bàn ưu đãi và phân bổ thu nhập dịch vụ:</b> Tách bạch doanh thu phát sinh tại địa bàn thực hiện dự án và doanh thu ngoài địa bàn để bảo vệ quyền lợi ưu đãi thuế suất khi quyết toán.'}
]
outline.append({
    'id': 'loi_ket',
    'label': 'Lời kết',
    'shortTitle': 'Lời kết & Khuyến nghị quản trị thuế 2026',
    'chuong': 'Phần kết — Khuyến nghị & Phụ lục',
    'content': loi_ket_blocks
})
summaries_map['loi_ket'] = {
    'tldr': 'Tổng kết các nguyên tắc thượng tôn pháp luật, số hóa bộ lọc hóa đơn từ 5 triệu và checklist 3 nhóm giải pháp quản trị cấp bách cho doanh nghiệp.',
    'points': [
        'Hạ ngưỡng thanh toán không dùng tiền mặt xuống 5 triệu đồng.',
        'Khấu trừ bổ sung chi phí R&D tối đa 200% và Quỹ KH&CN.',
        'Định vị chính xác địa bàn ưu đãi và quản trị dòng tiền.'
    ]
}

# Phụ lục I: Hệ thống văn bản (Page 42)
pl1_blocks = [
    {'k': 'h3', 't': 'PHỤ LỤC I: HỆ THỐNG VĂN BẢN CẤP LUẬT & NGHỊ ĐỊNH ĐƯỢC TRÍCH DẪN'},
    {'k': 'p', 't': 'Danh mục đầy đủ 07 Luật và 08 Nghị định được trích dẫn trong 100 câu hỏi nghiệp vụ thuế TNDN:'},
    {'k': 'p', 't': '<b>1. CÁC VĂN BẢN CẤP LUẬT:</b>'},
    {'k': 'p', 't': '• Luật Thuế Thu nhập doanh nghiệp số 14/2008/QH12 (và Luật Thuế TNDN số 67/2025/QH15).'},
    {'k': 'p', 't': '• Luật Quản lý thuế số 108/2025/QH15 & Luật Quản lý thuế số 38/2019/QH14 (sửa đổi bởi Luật 56/2024/QH15).'},
    {'k': 'p', 't': '• Luật Doanh nghiệp số 59/2020/QH14 & Luật Hỗ trợ Doanh nghiệp nhỏ và vừa số 04/2017/QH14.'},
    {'k': 'p', 't': '• Luật Công nghệ cao số 21/2008/QH12 & Luật Khoa học & Công nghệ số 29/2013/QH13.'},
    {'k': 'p', 't': '• Luật Đầu tư số 61/2020/QH14.'},
    {'k': 'p', 't': '<b>2. CÁC NGHỊ ĐỊNH HƯỚNG DẪN CỐT LÕI:</b>'},
    {'k': 'p', 't': '• Nghị định số 320/2025/NĐ-CP — Quy định chi tiết thi hành Luật Thuế Thu nhập doanh nghiệp.'},
    {'k': 'p', 't': '• Nghị định số 141/2026/NĐ-CP — Sửa đổi, bổ sung một số điều của Nghị định số 320/2025/NĐ-CP.'},
    {'k': 'p', 't': '• Nghị định số 126/2020/NĐ-CP & Nghị định số 91/2022/NĐ-CP — Hướng dẫn Luật Quản lý thuế.'},
    {'k': 'p', 't': '• Nghị định số 132/2020/NĐ-CP — Quản lý thuế đối với doanh nghiệp có giao dịch liên kết.'},
    {'k': 'p', 't': '• Nghị định số 80/2021/NĐ-CP — Hướng dẫn Luật Hỗ trợ Doanh nghiệp nhỏ và vừa.'}
]
outline.append({
    'id': 'pl_1',
    'label': 'Phụ lục I',
    'shortTitle': 'Phụ lục I: Hệ thống văn bản Luật & Nghị định trích dẫn',
    'chuong': 'Phần kết — Khuyến nghị & Phụ lục',
    'content': pl1_blocks
})
summaries_map['pl_1'] = {
    'tldr': 'Danh mục 07 văn bản Luật và 08 Nghị định điều chỉnh toàn diện chính sách thuế TNDN và quản lý thuế.',
    'points': [
        'Luật Thuế TNDN số 14/2008 và 67/2025.',
        'Nghị định 320/2025/NĐ-CP & Nghị định 141/2026/NĐ-CP.',
        'Luật Quản lý thuế số 108/2025 và 38/2019.'
    ]
}

# Phụ lục II: Ma trận đối chiếu (Page 43)
pl2_blocks = [
    {'k': 'h3', 't': 'PHỤ LỤC II: MA TRẬN ĐỐI CHIẾU ĐIỀU KHOẢN NGHỊ ĐỊNH 320/2025 & NGHỊ ĐỊNH 141/2026'},
    {'k': 'p', 't': 'Bảng tra cứu đối chiếu trực tiếp 16 Điều khoản cốt lõi của Nghị định 320/2025/NĐ-CP & Nghị định 141/2026/NĐ-CP với 100 câu hỏi tình huống:'},
    {'k': 'p', 't': '• <b>Điều 2 (Người nộp thuế & tiêu chuẩn DN siêu nhỏ):</b> Câu 1, Câu 2, Câu 3, Câu 4, Câu 5.'},
    {'k': 'p', 't': '• <b>Điều 3 (Thu nhập chịu thuế khác):</b> Câu 70, Câu 75.'},
    {'k': 'p', 't': '• <b>Điều 4 (Thu nhập miễn thuế TNDN & bổ sung bởi NĐ 141):</b> Câu 1 đến Câu 8, Câu 76 đến Câu 88.'},
    {'k': 'p', 't': '• <b>Điều 6 (Phương pháp xác định thu nhập tính thuế):</b> Câu 71.'},
    {'k': 'p', 't': '• <b>Điều 7 (Nguyên tắc xác định lỗ và chuyển lỗ liên tục 5 năm):</b> Câu 72, Câu 73.'},
    {'k': 'p', 't': '• <b>Điều 8 (Thời điểm & phương pháp xác định doanh thu tính thuế):</b> Câu 13 đến Câu 23.'},
    {'k': 'p', 't': '• <b>Điều 9 (Các khoản chi được trừ & ưu đãi R&D 200%):</b> Câu 24 đến Câu 46.'},
    {'k': 'p', 't': '• <b>Điều 10 (Các khoản chi không được trừ & giới hạn khống chế):</b> Câu 47 đến Câu 69.'},
    {'k': 'p', 't': '• <b>Điều 11 (Biểu thuế suất 15%, 17% theo quy mô doanh thu):</b> Câu 9 đến Câu 12.'},
    {'k': 'p', 't': '• <b>Điều 14 đến 20 (Ưu đãi thuế suất 10%, 17%, địa bàn & ngành nghề):</b> Câu 89 đến Câu 100.'}
]
outline.append({
    'id': 'pl_2',
    'label': 'Phụ lục II',
    'shortTitle': 'Phụ lục II: Ma trận đối chiếu điều khoản Nghị định 320 & 141',
    'chuong': 'Phần kết — Khuyến nghị & Phụ lục',
    'content': pl2_blocks
})
summaries_map['pl_2'] = {
    'tldr': 'Ma trận đối chiếu liên kết trực tiếp giữa các điều khoản của NĐ 320/2025 và NĐ 141/2026 với từng câu hỏi trong 100 tình huống.',
    'points': [
        'Đối chiếu điều 2, 4 (Miễn thuế DN siêu nhỏ).',
        'Đối chiếu điều 8 (Doanh thu tính thuế).',
        'Đối chiếu điều 9, 10 (Chi phí được trừ và không được trừ).',
        'Đối chiếu điều 11, 14-20 (Thuế suất và ưu đãi thuế).'
    ]
}

# Lược đồ kiểm soát rủi ro & Cổng tra cứu (Page 44)
luoc_do_blocks = [
    {'k': 'h3', 't': 'LƯỢC ĐỒ KIỂM SOÁT RỦI RO & CỔNG TRA CỨU ĐIỆN TỬ QUỐC GIA'},
    {'k': 'p', 't': '<b>🔄 QUY TRÌNH 4 BƯỚC RÀ SOÁT NGHĨA VỤ THUẾ TNDN TRƯỚC KHI KHÓA SỔ:</b>'},
    {'k': 'p', 't': '<b>01. Bước 1 — Rà soát thanh toán không dùng tiền mặt:</b> Kiểm tra toàn bộ hóa đơn từ 5 triệu đồng trở lên trong kỳ. Đảm bảo 100% có ủy nhiệm chi hoặc chứng từ chuyển khoản hợp lệ từ tài khoản công ty.'},
    {'k': 'p', 't': '<b>02. Bước 2 — Kiểm soát các khoản chi khống chế:</b> Đối chiếu chi phí phúc lợi không vượt quá 01 tháng lương bình quân thực tế; trang phục không quá 5 triệu đồng/người/năm; trần lãi vay giao dịch liên kết dưới 30% EBITDA.'},
    {'k': 'p', 't': '<b>03. Bước 3 — Chuẩn hóa hồ sơ ưu đãi & chi phí R&D:</b> Tập hợp thuyết minh dự án nghiên cứu, hóa đơn thiết bị thí nghiệm cho khoản khấu trừ bổ sung 200% và chứng từ dự án tại địa bàn ưu đãi thuế.'},
    {'k': 'p', 't': '<b>04. Bước 4 — Quyết toán và chuyển lỗ đúng quy định:</b> Lập phụ lục chuyển lỗ theo mẫu quy định, chuyển lỗ liên tục tối đa 5 năm và đối chiếu số thuế tạm nộp 4 quý (đạt tối thiểu 80% số quyết toán năm).'},
    {'k': 'h3', 't': '🌐 HỆ THỐNG CỔNG TRA CỨU ĐIỆN TỬ CHÍNH THỨC CỦA NGÀNH THUẾ:'},
    {'k': 'p', 't': '• Cổng Thuế điện tử: <a href="https://thuedientu.gdt.gov.vn" target="_blank" rel="noopener">thuedientu.gdt.gov.vn</a>'},
    {'k': 'p', 't': '• Cổng TTĐT Tổng cục Thuế: <a href="https://www.gdt.gov.vn" target="_blank" rel="noopener">gdt.gov.vn</a>'},
    {'k': 'p', 't': '• Cổng Văn bản QPPL Chính phủ: <a href="https://vanban.chinhphu.vn" target="_blank" rel="noopener">vanban.chinhphu.vn</a>'},
    {'k': 'p', 't': '• Tổng đài hỗ trợ Người nộp thuế: 1800 1567 / (024) 39712555'}
]
outline.append({
    'id': 'luoc_do',
    'label': 'Lược đồ rủi ro',
    'shortTitle': 'Lược đồ kiểm soát rủi ro & Cổng tra cứu quốc gia',
    'chuong': 'Phần kết — Khuyến nghị & Phụ lục',
    'content': luoc_do_blocks
})
summaries_map['luoc_do'] = {
    'tldr': 'Quy trình 4 bước kiểm soát rủi ro thuế TNDN trước kỳ quyết toán và các kênh tra cứu thuế điện tử chính thức.',
    'points': [
        'Bước 1: Rà soát thanh toán không dùng tiền mặt (5 triệu).',
        'Bước 2: Kiểm soát các khoản chi khống chế.',
        'Bước 3: Chuẩn hóa hồ sơ ưu đãi & chi phí R&D 200%.',
        'Bước 4: Quyết toán và chuyển lỗ đúng quy định.'
    ]
}

print(f"Built outline with {len(outline)} items (9 chapters overviews + 100 questions + 4 appendices).")

# 4. Read Template and Generate HTML
import importlib.util
spec = importlib.util.spec_from_file_location('dtl', os.path.join(ROOT, 'scripts', 'docx-to-legal.py'))
dtl = importlib.util.module_from_spec(spec)
spec.loader.exec_module(dtl)
TEMPLATE = dtl.TEMPLATE

meta = {
    'title': 'Sổ tay Thuế điện tử TNDN 2026 — 100 tình huống theo NĐ 320/2025 & NĐ 141/2026',
    'shortCode': 'Sổ tay TNDN 2026',
    'subtitle': '100 tình huống thực thi thuế TNDN theo NĐ 320/2025 & NĐ 141/2026',
    'slug': 'so-tay-tndn-2026',
    'effectiveDate': '01/01/2026',
    'scope': 'Tra cứu toàn diện 100 tình huống nghiệp vụ thuế TNDN theo Nghị định số 320/2025/NĐ-CP và Nghị định số 141/2026/NĐ-CP do Cục Thuế / Ban Pháp chế biên soạn.',
    'description': '100 tình huống thực thi thuế TNDN theo NĐ 320/2025 & NĐ 141/2026',
    'related': ['nd320', 'luat-67', 'luat-108', 'luat-38']
}

payload = {'meta': meta, 'outline': outline}
data_json = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))

html = (TEMPLATE.replace('__SHORT__', htmllib.escape(meta['shortCode']))
                .replace('__SUB__', htmllib.escape(meta['subtitle']))
                .replace('__FORMS_TAB__', '')
                .replace('__FORMS_SEC__', '')
                .replace('__FORMS_JS__', '')
                .replace('__DATA__', data_json))

os.makedirs(OUT_DIR, exist_ok=True)
out_html_path = os.path.join(OUT_DIR, 'index.html')
with open(out_html_path, 'w', encoding='utf-8') as f:
    f.write(html)
print(f"Written HTML to: {out_html_path} ({len(html)} bytes)")

# 5. Update summaries.json
with open(SUMMARIES_FILE, 'r', encoding='utf-8') as f:
    all_summaries = json.load(f)

all_summaries['so-tay-tndn-2026'] = summaries_map
with open(SUMMARIES_FILE, 'w', encoding='utf-8') as f:
    json.dump(all_summaries, f, ensure_ascii=False, indent=2)
print(f"Updated summaries.json with {len(summaries_map)} items for so-tay-tndn-2026.")

# 6. Update cross-refs.json
with open(CROSSREFS_FILE, 'r', encoding='utf-8') as f:
    all_crossrefs = json.load(f)

# Article-level crossrefs linking questions to NĐ 320 and others
so_tay_refs = {}
for q_num in range(1, 9):
    so_tay_refs[f"st_{q_num}"] = [
        {'targetSlug': 'nd320', 'targetAnchor': 'nd320_4', 'label': 'Căn cứ → NĐ 320 Điều 4 (bổ sung bởi NĐ 141)', 'description': 'Quy định miễn thuế DN siêu nhỏ doanh thu ≤ 1 tỷ đồng'},
        {'targetSlug': 'nd320', 'targetAnchor': 'nd320_2', 'label': 'Căn cứ → NĐ 320 Điều 2', 'description': 'Tiêu chuẩn người nộp thuế và doanh nghiệp siêu nhỏ'}
    ]
for q_num in range(9, 13):
    so_tay_refs[f"st_{q_num}"] = [
        {'targetSlug': 'nd320', 'targetAnchor': 'nd320_11', 'label': 'Căn cứ → NĐ 320 Điều 11', 'description': 'Biểu thuế suất thuế TNDN theo quy mô doanh thu 15% và 17%'}
    ]
for q_num in range(13, 24):
    so_tay_refs[f"st_{q_num}"] = [
        {'targetSlug': 'nd320', 'targetAnchor': 'nd320_8', 'label': 'Căn cứ → NĐ 320 Điều 8', 'description': 'Thời điểm và phương pháp xác định doanh thu tính thuế TNDN'}
    ]
for q_num in range(24, 47):
    so_tay_refs[f"st_{q_num}"] = [
        {'targetSlug': 'nd320', 'targetAnchor': 'nd320_9', 'label': 'Căn cứ → NĐ 320 Điều 9', 'description': 'Các khoản chi phí được trừ khi xác định thu nhập chịu thuế TNDN & ưu đãi R&D 200%'}
    ]
for q_num in range(47, 70):
    so_tay_refs[f"st_{q_num}"] = [
        {'targetSlug': 'nd320', 'targetAnchor': 'nd320_10', 'label': 'Căn cứ → NĐ 320 Điều 10', 'description': 'Các khoản chi phí không được trừ & giới hạn khống chế nhân sự, tài chính'}
    ]
for q_num in range(70, 76):
    so_tay_refs[f"st_{q_num}"] = [
        {'targetSlug': 'nd320', 'targetAnchor': 'nd320_7', 'label': 'Căn cứ → NĐ 320 Điều 7', 'description': 'Nguyên tắc xác định lỗ và chuyển lỗ liên tục tối đa 5 năm'}
    ]
for q_num in range(76, 89):
    so_tay_refs[f"st_{q_num}"] = [
        {'targetSlug': 'nd320', 'targetAnchor': 'nd320_4', 'label': 'Căn cứ → NĐ 320 Điều 4', 'description': 'Thu nhập được miễn thuế TNDN lĩnh vực xanh, an sinh xã hội'}
    ]
for q_num in range(89, 101):
    so_tay_refs[f"st_{q_num}"] = [
        {'targetSlug': 'nd320', 'targetAnchor': 'nd320_19', 'label': 'Căn cứ → NĐ 320 Điều 14–20', 'description': 'Thuế suất ưu đãi 10%, 17%, địa bàn ưu đãi và thời gian miễn giảm thuế'}
    ]

all_crossrefs['so-tay-tndn-2026'] = so_tay_refs
with open(CROSSREFS_FILE, 'w', encoding='utf-8') as f:
    json.dump(all_crossrefs, f, ensure_ascii=False, indent=2)
print(f"Updated cross-refs.json with article-level refs for so-tay-tndn-2026.")

print("Done building so-tay-tndn-2026 base doc.")
