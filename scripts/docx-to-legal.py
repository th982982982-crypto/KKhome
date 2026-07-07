#!/usr/bin/env python3
# Sinh src/legal-docs/<slug>/index.html từ các .docx trong thư mục "Tổng hợp".
# Template họ tt58/nd320: <script id="LD"> JSON + show()/renderContent(); gọi sẵn
# autolink()/applyDetails()/renderRefs() (do build-legal-crossrefs.py bơm vào).
import zipfile, re, os, json, html as htmllib, subprocess

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC  = os.path.join(ROOT, 'Tổng hợp')
OUT  = os.path.join(ROOT, 'src/legal-docs')
_mf = os.path.join(ROOT, 'scripts/forms-manifest.json')
FORMS = json.load(open(_mf, encoding='utf-8')) if os.path.exists(_mf) else {}

# slug -> (file, shortCode, subtitle, title, theme)
DOCS = {
 'luat-48' : ('Luật-48-2024-QH15.docx',  'Luật 48/2024', 'Thuế Giá trị gia tăng (GTGT)',
              'Luật 48/2024/QH15 — Luật Thuế Giá trị gia tăng'),
 'luat-149': ('Luật-149-2025-QH15.docx', 'Luật 149/2025', 'Sửa đổi, bổ sung Luật Thuế GTGT',
              'Luật 149/2025/QH15 — Sửa đổi, bổ sung một số điều của Luật Thuế GTGT'),
 'luat-109': ('Luật-109-2025-QH15.docx', 'Luật 109/2025', 'Thuế Thu nhập cá nhân (TNCN)',
              'Luật 109/2025/QH15 — Luật Thuế Thu nhập cá nhân'),
 'luat-09' : ('Luật-09-2026-QH16.docx',  'Luật 09/2026', 'Sửa đổi Luật Thuế TNCN, GTGT…',
              'Luật 09/2026/QH16 — Sửa đổi, bổ sung một số điều của Luật Thuế TNCN, Thuế GTGT'),
 'nd253'   : ('Nghị-định-253-2026-NĐ-CP.docx', 'NĐ 253/2026', 'Hướng dẫn Luật Thuế TNCN',
              'Nghị định 253/2026/NĐ-CP — Quy định chi tiết thi hành Luật Thuế thu nhập cá nhân'),
 'luat-108': ('Luật-108-2025-QH15.docx', 'Luật 108/2025', 'Quản lý thuế (mới)',
              'Luật 108/2025/QH15 — Luật Quản lý thuế'),
 'luat-38' : ('Luật-38-2019-QH14.docx',  'Luật 38/2019', 'Quản lý thuế (hiện hành)',
              'Luật 38/2019/QH14 — Luật Quản lý thuế'),
 'nd181'   : ('Nghị-định-181-2025-NĐ-CP.docx', 'NĐ 181/2025', 'Hướng dẫn Luật Thuế GTGT',
              'Nghị định 181/2025/NĐ-CP — Quy định chi tiết thi hành Luật Thuế GTGT'),
 'nd68'    : ('Nghị-định-68-2026-NĐ-CP.docx',  'NĐ 68/2026', 'Chính sách & quản lý thuế',
              'Nghị định 68/2026/NĐ-CP — Chính sách thuế và quản lý thuế'),
 'nd144'   : ('Nghị-định-144-2026-NĐ-CP.docx', 'NĐ 144/2026', 'Sửa đổi, bổ sung một số Nghị định',
              'Nghị định 144/2026/NĐ-CP — Sửa đổi, bổ sung một số điều các Nghị định về thuế'),
 'nd359'   : ('Nghị-định-359-2025-NĐ-CP.docx', 'NĐ 359/2025', 'Sửa đổi, bổ sung một số Nghị định',
              'Nghị định 359/2025/NĐ-CP — Sửa đổi, bổ sung một số điều các Nghị định về thuế'),
 'tt69'    : ('Thông-tư-69-2025-TT-BTC.docx', 'TT 69/2025', 'Hướng dẫn Luật Thuế GTGT',
              'Thông tư 69/2025/TT-BTC — Quy định chi tiết một số điều của Luật Thuế GTGT'),
 'tt18'    : ('Thông-tư-18-2026-TT-BTC.docx', 'TT 18/2026', 'Hồ sơ, thủ tục quản lý thuế',
              'Thông tư 18/2026/TT-BTC — Hồ sơ, thủ tục quản lý thuế'),
 # ----- Chum Thuế Tiêu thụ đặc biệt (TTĐB) -----
 'luat-66' : ('Luật-66-2025-QH15.docx', 'Luật 66/2025', 'Thuế Tiêu thụ đặc biệt (TTĐB)',
              'Luật 66/2025/QH15 — Luật Thuế Tiêu thụ đặc biệt'),
 'nd360'   : ('Nghị-định-360-2025-NĐ-CP.docx', 'NĐ 360/2025', 'Hướng dẫn Luật Thuế TTĐB',
              'Nghị định 360/2025/NĐ-CP — Quy định chi tiết thi hành Luật Thuế TTĐB'),
 'tt158'   : ('Thông-tư-158-2025-TT-BTC.docx', 'TT 158/2025', 'Hướng dẫn chi tiết NĐ 360 (TTĐB)',
              'Thông tư 158/2025/TT-BTC — Quy định chi tiết một số điều của NĐ 360/2025'),
 # ----- Chum Thuế Xuất nhập khẩu / Hải quan (XNK) -----
 'nd134'   : ('Nghị-định-134-2016-NĐ-CP.doc', 'NĐ 134/2016', 'Hướng dẫn Luật Thuế Xuất khẩu, Nhập khẩu',
              'Nghị định 134/2016/NĐ-CP — Quy định chi tiết và biện pháp thi hành Luật Thuế XNK'),
 'nd18'    : ('Nghị-định-18-2021-NĐ-CP.docx', 'NĐ 18/2021', 'Sửa đổi, bổ sung NĐ 134/2016 (Thuế XNK)',
              'Nghị định 18/2021/NĐ-CP — Sửa đổi, bổ sung một số điều của NĐ 134/2016'),
 'nd182'   : ('Nghị-định-182-2025-NĐ-CP.docx', 'NĐ 182/2025', 'Sửa đổi, bổ sung NĐ 134/2016 (Thuế XNK)',
              'Nghị định 182/2025/NĐ-CP — Sửa đổi, bổ sung một số điều của NĐ 134/2016'),
 'tt06'    : ('Thông-tư-06-2021-TT-BTC.doc', 'TT 06/2021', 'Hướng dẫn quản lý thuế hàng hóa XNK',
              'Thông tư 06/2021/TT-BTC — Hướng dẫn thi hành về quản lý thuế đối với hàng hóa XNK'),
 'tt39'    : ('Thông-tư-39-2018-TT-BTC.docx', 'TT 39/2018', 'Sửa đổi TT 38/2015 (thủ tục hải quan)',
              'Thông tư 39/2018/TT-BTC — Sửa đổi, bổ sung TT 38/2015 về thủ tục hải quan'),
 # ----- Chum Lao động / BHXH / Công đoàn -----
 'blld-45' : ('Bộ-luật-45-2019-QH14.docx', 'BLLD 45/2019', 'Bộ Luật Lao động',
              'Bộ luật 45/2019/QH14 — Bộ Luật Lao động'),
 'luat-84' : ('Luật-84-2015-QH13.doc', 'Luật 84/2015', 'An toàn, vệ sinh lao động',
              'Luật 84/2015/QH13 — Luật An toàn, vệ sinh lao động'),
 'luat-74' : ('Luật-74-2025-QH15.docx', 'Luật 74/2025', 'Việc làm',
              'Luật 74/2025/QH15 — Luật Việc làm'),
 'luat-41' : ('Luật-41-2024-QH15.docx', 'Luật 41/2024', 'Bảo hiểm xã hội',
              'Luật 41/2024/QH15 — Luật Bảo hiểm xã hội'),
 'luat-25' : ('Luật-25-2008-QH12.doc', 'Luật 25/2008', 'Bảo hiểm y tế',
              'Luật 25/2008/QH12 — Luật Bảo hiểm y tế'),
 'luat-50' : ('Luật-50-2024-QH15.docx', 'Luật 50/2024', 'Công đoàn',
              'Luật 50/2024/QH15 — Luật Công đoàn'),
 'nd293'   : ('Nghị-định-293-2025-NĐ-CP.docx', 'NĐ 293/2025', 'Lương tối thiểu vùng',
              'Nghị định 293/2025/NĐ-CP — Mức lương tối thiểu đối với người lao động'),
 'nd145'   : ('Nghị-định-145-2020-NĐ-CP.docx', 'NĐ 145/2020', 'Hướng dẫn Bộ Luật Lao động',
              'Nghị định 145/2020/NĐ-CP — Hướng dẫn thi hành Bộ luật Lao động về điều kiện LĐ'),
 'nd191'   : ('Nghị-định-191-2013-NĐ-CP.doc', 'NĐ 191/2013', 'Tài chính công đoàn (cũ)',
              'Nghị định 191/2013/NĐ-CP — Quy định chi tiết về tài chính công đoàn'),
 'nd105'   : ('Nghị-định-105-2026-NĐ-CP.docx', 'NĐ 105/2026', 'Tài chính công đoàn',
              'Nghị định 105/2026/NĐ-CP — Hướng dẫn thi hành Luật Công đoàn về tài chính công đoàn'),
 'qd595'   : ('Quyết-định-595-QĐ-BHXH.doc', 'QĐ 595/BHXH', 'Quy trình thu BHXH, BHYT, BHTN',
              'Quyết định 595/QĐ-BHXH — Ban hành Quy trình thu BHXH, BHYT, BHTN, TNLĐ-BNN'),
 'qd505'   : ('Quyết-định-505-QĐ-BHXH.docx', 'QĐ 505/BHXH', 'Sửa đổi Quy trình thu BHXH',
              'Quyết định 505/QĐ-BHXH — Sửa đổi, bổ sung Quy trình thu BHXH, BHYT, BHTN'),
 # ----- Chum Hóa đơn / Chứng từ -----
 'nd123'   : ('Nghị-định-123-2020-NĐ-CP.docx', 'NĐ 123/2020', 'Hóa đơn, chứng từ',
              'Nghị định 123/2020/NĐ-CP — Quy định về hóa đơn, chứng từ'),
 'nd70'    : ('Nghị-định-70-2025-NĐ-CP.docx', 'NĐ 70/2025', 'Sửa đổi NĐ 123/2020 về hóa đơn',
              'Nghị định 70/2025/NĐ-CP — Sửa đổi, bổ sung NĐ 123/2020 về hóa đơn, chứng từ'),
 'nd254'   : ('Nghị-định-254-2026-NĐ-CP.docx', 'NĐ 254/2026', 'Hóa đơn điện tử, chứng từ điện tử (thay NĐ 123, NĐ 70)',
              'Nghị định 254/2026/NĐ-CP — Quy định chi tiết thi hành Luật Quản lý thuế về hóa đơn điện tử, chứng từ điện tử'),
 # ----- Chum Chuyển giá / Giao dịch liên kết (TNDN) -----
 'nd132'   : ('Nghị-định-132-2020-NĐ-CP.docx', 'NĐ 132/2020', 'Quản lý thuế với DN có giao dịch liên kết',
              'Nghị định 132/2020/NĐ-CP — Quy định về quản lý thuế đối với doanh nghiệp có giao dịch liên kết'),
 # ----- Chum Doanh nghiệp -----
 'luat-59' : ('Luật-59-2020-QH14.docx', 'Luật 59/2020', 'Luật Doanh nghiệp',
              'Luật 59/2020/QH14 — Luật Doanh nghiệp'),
 # ----- Nghị quyết độc lập -----
 'nq110'   : ('Nghị-quyết-110-2025-UBTVQH15.docx', 'NQ 110/2025', 'Giảm trừ gia cảnh TNCN',
              'Nghị quyết 110/2025/UBTVQH15 — Về điều chỉnh mức giảm trừ gia cảnh của thuế thu nhập cá nhân'),
 # ----- Chum Quản lý thuế — bổ sung -----
 'nd20'    : ('Nghị-định-20-2025-NĐ-CP.docx', 'NĐ 20/2025', 'Sửa đổi, bổ sung NĐ 132/2020 (giao dịch liên kết)',
              'Nghị định 20/2025/NĐ-CP — Sửa đổi, bổ sung một số điều của NĐ 132/2020 về quản lý thuế với DN có giao dịch liên kết'),
 'nd252'   : ('Nghị-định-252-2026-NĐ-CP.docx', 'NĐ 252/2026', 'Hướng dẫn thi hành Luật Quản lý thuế',
              'Nghị định 252/2026/NĐ-CP — Quy định chi tiết một số điều và biện pháp thi hành Luật Quản lý thuế'),
 'tt87'    : ('Thông-tư-87-2026-TT-BTC.docx', 'TT 87/2026', 'Hướng dẫn Luật Thuế TNCN & NĐ 253/2026',
              'Thông tư 87/2026/TT-BTC — Quy định chi tiết một số điều của Luật Thuế TNCN và NĐ 253/2026/NĐ-CP'),
 # ----- Chum Quản lý thuế / TNDN / TNCN / TTĐB / Nhà thầu / XNK — bổ sung 2026-07 -----
 'nd126'   : ('Nghị-định-126-2020-NĐ-CP.doc', 'NĐ 126/2020', 'Hướng dẫn Luật Quản lý thuế',
              'Nghị định 126/2020/NĐ-CP — Quy định chi tiết một số điều của Luật Quản lý thuế'),
 'nd91'    : ('Nghị-định-91-2022-NĐ-CP.doc', 'NĐ 91/2022', 'Sửa đổi, bổ sung NĐ 126/2020 (quản lý thuế)',
              'Nghị định 91/2022/NĐ-CP — Sửa đổi, bổ sung một số điều của NĐ 126/2020/NĐ-CP quy định chi tiết một số điều của Luật Quản lý thuế'),
 'tt80'    : ('Thông-tư-80-2021-TT-BTC.doc', 'TT 80/2021', 'Hướng dẫn Luật Quản lý thuế & NĐ 126/2020',
              'Thông tư 80/2021/TT-BTC — Hướng dẫn thi hành một số điều của Luật Quản lý thuế và Nghị định số 126/2020/NĐ-CP'),
 'tt103'   : ('Thông-tư-103-2014-TT-BTC.doc', 'TT 103/2014', 'Thuế nhà thầu nước ngoài (FCT)',
              'Thông tư 103/2014/TT-BTC — Hướng dẫn thực hiện nghĩa vụ thuế áp dụng đối với tổ chức, cá nhân nước ngoài kinh doanh tại Việt Nam hoặc có thu nhập tại Việt Nam'),
 'luat03'  : ('Luật-03-2022-QH15.docx', 'Luật 03/2022', 'Sửa đổi 9 luật (gồm Luật Thuế TTĐB)',
              'Luật 03/2022/QH15 — Luật sửa đổi, bổ sung một số điều của Luật Đầu tư công, Luật Đầu tư theo phương thức đối tác công tư, Luật Đầu tư, Luật Nhà ở, Luật Đấu thầu, Luật Điện lực, Luật Doanh nghiệp, Luật Thuế tiêu thụ đặc biệt và Luật Thi hành án dân sự'),
 'luat-107': ('Luật-107-2016-QH13.doc', 'Luật 107/2016', 'Thuế xuất khẩu, nhập khẩu',
              'Luật 107/2016/QH13 — Luật Thuế xuất khẩu, thuế nhập khẩu'),
}

# Ngày hiệu lực chuẩn (override khi parser không bắt được)
EFF = {
 'luat-48':'01/07/2025','luat-149':'01/01/2026','luat-109':'01/07/2026','luat-09':'01/01/2026',
 'luat-108':'01/07/2026','luat-38':'01/07/2020','nd181':'01/07/2025','nd68':'05/03/2026',
 'nd144':'20/06/2026','nd359':'01/01/2026','tt69':'01/07/2025','tt18':'05/03/2026',
 'luat-66':'01/01/2026','nd360':'01/01/2026','tt158':'01/01/2026',
 'nd134':'01/09/2016','nd18':'25/04/2021','nd182':'01/07/2025','tt06':'08/03/2021','tt39':'05/06/2018',
 # Lao động / BHXH / CĐ
 'blld-45':'01/01/2021','luat-84':'01/07/2016','luat-74':'01/07/2026','luat-41':'01/07/2025',
 'luat-25':'01/07/2009','luat-50':'01/07/2025','nd293':'01/01/2026','nd145':'01/02/2021',
 'nd191':'21/11/2013','nd105':'31/03/2026','qd595':'01/05/2017','qd505':'27/03/2020',
 # Hóa đơn / Chứng từ
 'nd123':'01/07/2022','nd70':'20/03/2025','nd254':'01/07/2026',
 # Thuế TNCN / Chuyển giá / Doanh nghiệp / Nghị quyết
 'nd253':'01/07/2026','nd132':'20/12/2020','luat-59':'01/01/2021','nq110':'01/01/2026',
 'nd20':'27/03/2025','nd252':'01/07/2026','tt87':'01/07/2026',
 # Quản lý thuế / TNDN / TNCN / TTĐB / Nhà thầu / XNK — bổ sung 2026-07
 'nd126':'05/12/2020','nd91':'30/10/2022','tt80':'01/01/2022','tt103':'01/10/2014',
 'luat03':'01/03/2022','luat-107':'01/09/2016',
}

# Cache .docx convert từ .doc (textutil, macOS)
DOC_CACHE = os.path.join(ROOT, 'scripts', '.doc-cache')
def ensure_docx(path):
    if path.lower().endswith('.docx'):
        return path
    os.makedirs(DOC_CACHE, exist_ok=True)
    out = os.path.join(DOC_CACHE, os.path.splitext(os.path.basename(path))[0] + '.docx')
    subprocess.run(['textutil', '-convert', 'docx', '-output', out, path], check=True)
    return out

# ----------------- docx parsing -----------------
def runtext(frag):
    frag = frag.replace('<w:tab/>', ' ').replace('<w:br/>', '\n').replace('<w:br ', '\n<w:br ')
    # <w:t> hoặc <w:t ...> — KHÔNG khớp <w:tab>/<w:tabs> (phải có ' ' hoặc '>' ngay sau 't')
    txt = ''.join(re.findall(r'<w:t(?:\s[^>]*)?>(.*?)</w:t>', frag, re.DOTALL))
    return htmllib.unescape(txt)

def is_bold(p):
    # bold nếu có <w:b/> hoặc <w:b ...> không bị tắt
    return bool(re.search(r'<w:b\b(?![^>]*w:val="(?:0|false)")', p))

def pstyle(p):
    m = re.search(r'<w:pStyle w:val="([^"]+)"', p)
    return m.group(1) if m else ''

def is_heading(p):
    # tiêu đề điều/chương: in đậm HOẶC dùng style Heading
    return is_bold(p) or pstyle(p).lower().startswith('heading')

def cell_text(tc):
    paras = re.findall(r'<w:p\b.*?</w:p>', tc, re.DOTALL)
    lines = [runtext(p).strip() for p in paras]
    return '\n'.join([l for l in lines if l]) or runtext(tc).strip()

def parse_table(tbl):
    rows = []
    for tr in re.findall(r'<w:tr\b.*?</w:tr>', tbl, re.DOTALL):
        cells = [cell_text(tc) for tc in re.findall(r'<w:tc\b.*?</w:tc>', tr, re.DOTALL)]
        if cells:
            rows.append(cells)
    return rows

DIEU_RE = re.compile(r'^Điều\s+(\d+)\s*\.\s*(.*)$', re.DOTALL)
CHUONG_RE = re.compile(r'^Chương\s+([IVXLCDM\d]+)\b\s*(.*)$', re.IGNORECASE)
MUC_RE = re.compile(r'^Mục\s+(\d+)\b\s*\.?\s*(.*)$')

def parse_docx(path, slug):
    xml = zipfile.ZipFile(path).read('word/document.xml').decode('utf-8', 'ignore')
    # tách body, lấy <w:tbl> và <w:p> top-level theo thứ tự (bỏ <w:p> trong bảng)
    body = re.search(r'<w:body\b.*?</w:body>', xml, re.DOTALL)
    body = body.group(0) if body else xml
    tbl_spans = [(m.start(), m.end(), m.group(0)) for m in re.finditer(r'<w:tbl\b.*?</w:tbl>', body, re.DOTALL)]
    def in_table(pos):
        return any(s <= pos < e for s, e, _ in tbl_spans)
    tokens = []  # (pos, kind, data)
    for m in re.finditer(r'<w:p\b.*?</w:p>', body, re.DOTALL):
        if in_table(m.start()):
            continue
        tokens.append((m.start(), 'p', m.group(0)))
    for s, e, t in tbl_spans:
        tokens.append((s, 'tbl', t))
    tokens.sort(key=lambda x: x[0])

    outline = []
    seen_ids = {}  # đảm bảo id duy nhất (VB sửa đổi trích lại "Điều X." bị trùng)
    cur = None
    chuong = ''
    muc = ''
    pending_chuong = None  # ('Chương I', maybe title)
    effective = ''
    sign_date = ''  # ngày ký ban hành (fallback khi 'hiệu lực kể từ ngày ký')

    def push_p(t):
        nonlocal effective
        if not effective:
            mm = re.search(r'hiệu lực thi hành (?:kể từ|từ)?\s*ngày\s+([0-9]{1,2})\s*tháng\s*([0-9]{1,2})\s*năm\s*([0-9]{4})', t)
            if mm:
                effective = f"{int(mm.group(1)):02d}/{int(mm.group(2)):02d}/{mm.group(3)}"
        if cur is not None and t.strip():
            cur['content'].append({'k': 'p', 't': t.strip()})

    for pos, kind, raw in tokens:
        if kind == 'tbl':
            rows = parse_table(raw)
            if cur is not None and rows:
                cur['content'].append({'k': 'tbl', 'rows': rows})
            continue
        t = runtext(raw).strip()
        if not t:
            continue
        # Bắt đầu phụ lục/biểu mẫu (PHỤ LỤC, DANH MỤC) → dừng (forms làm đợt sau)
        if re.match(r'^(PHỤ LỤC|DANH MỤC)\b', t) and len(t) < 50:
            break
        if not sign_date:
            ms = re.search(r'(?:Hà Nội|Thành phố Hồ Chí Minh)\s*,?\s*ngày\s+([0-9]{1,2})\s*tháng\s*([0-9]{1,2})\s*năm\s*([0-9]{4})', t)
            if ms:
                sign_date = f"{int(ms.group(1)):02d}/{int(ms.group(2)):02d}/{ms.group(3)}"
        head = is_heading(raw)
        # resolve pending chương title
        if pending_chuong is not None:
            label, lab_title = pending_chuong
            if head and not DIEU_RE.match(t) and not CHUONG_RE.match(t) and not MUC_RE.match(t):
                chuong = f"{label} — {t}"
                pending_chuong = None
                continue
            else:
                chuong = (f"{label} — {lab_title}" if lab_title else label)
                pending_chuong = None
        mch = CHUONG_RE.match(t) if head else None
        mdi = DIEU_RE.match(t) if head else None
        mmu = MUC_RE.match(t) if head else None
        if mdi:
            n = int(mdi.group(1))
            rest = re.sub(r'\s+', ' ', mdi.group(2)).strip()
            base = f"{slug}_{n}"
            seen_ids[base] = seen_ids.get(base, -1) + 1
            aid = base if seen_ids[base] == 0 else f"{base}-{seen_ids[base]}"
            cur = {
                'id': aid, 'no': n, 'code': f"Điều {n}",
                'title': f"Điều {n}. {rest}" if rest else f"Điều {n}",
                'shortTitle': rest, 'chuong': chuong, 'muc': muc, 'level': 1, 'content': []
            }
            outline.append(cur)
        elif mch:
            pending_chuong = (f"Chương {mch.group(1)}", re.sub(r'\s+', ' ', mch.group(2)).strip())
            muc = ''
        elif mmu:
            muc = re.sub(r'\s+', ' ', t).strip()
        else:
            push_p(t)
    return outline, (effective or sign_date)

# ----------------- HTML template -----------------
TEMPLATE = r"""<!doctype html><html lang="vi"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>__SHORT__ — __SUB__</title>
<style>
:root{--pr:#1e40af;--pr2:#0ea5e9;--bg:#f0f4f8;--card:#fff;--tx:#1e293b;--mu:#64748b;--bd:#e2e8f0;--sw:300px}
*{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,Arial,sans-serif;background:var(--bg);color:var(--tx);font-size:14px}
.tb{position:fixed;top:0;left:0;right:0;height:56px;background:linear-gradient(90deg,#1e3a8a,#0ea5e9);display:flex;align-items:center;gap:14px;padding:0 16px;z-index:90;color:#fff}
.tb-logo{font-weight:800;font-size:15px;line-height:1.1}.tb-logo small{display:block;font-weight:500;font-size:11px;opacity:.85}
.tb-search{flex:1;max-width:340px;display:flex;align-items:center;gap:6px;background:rgba(255,255,255,.16);border-radius:8px;padding:6px 10px}
.tb-search input{flex:1;border:0;background:transparent;color:#fff;outline:none;font-size:13px}.tb-search input::placeholder{color:rgba(255,255,255,.7)}
.tabs{display:flex;gap:6px;margin-left:auto}.tab{border:0;background:rgba(255,255,255,.14);color:#fff;padding:6px 12px;border-radius:8px;cursor:pointer;font-size:13px}
.tab.on{background:#fff;color:#1e3a8a;font-weight:700}
.wrap{display:flex;padding-top:56px;min-height:100vh}
.sb{width:var(--sw);position:fixed;top:56px;bottom:0;left:0;overflow-y:auto;background:#fff;border-right:1px solid var(--bd);padding:8px 0}
.ns{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.4px;color:#1e40af;padding:10px 14px 4px;position:sticky;top:0;background:#fff}
.nm{font-size:11px;font-style:italic;color:var(--mu);padding:4px 16px}
.ni{display:flex;align-items:flex-start;gap:7px;font-size:12.5px;padding:6px 14px;cursor:pointer;border-left:3px solid transparent;color:#334155}
.ni:hover{background:#f1f5f9}.ni.on{background:#eff6ff;border-left-color:#1e40af;color:#1e3a8a;font-weight:700}
.ni .dot{width:6px;height:6px;border-radius:50%;background:#94a3b8;margin-top:5px;flex:none}.ni.on .dot{background:#1e40af}
.main{margin-left:var(--sw);flex:1;padding:22px 28px;max-width:920px}
.sec{display:none}.sec.on{display:block}
.bc{font-size:11.5px;color:var(--mu);margin-bottom:8px}
.at{font-size:20px;font-weight:800;color:#1e3a8a;margin:0 0 14px}
.ac{font-size:14px;line-height:1.78}.ac p{margin:0 0 10px}
.ct{border-collapse:collapse;width:100%;margin:10px 0;font-size:13px}
.ct th,.ct td{border:1px solid var(--bd);padding:6px 9px;text-align:left;vertical-align:top}.ct th{background:#eff6ff;font-weight:700}
.hgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin:16px 0}
.sc{background:#fff;border:1px solid var(--bd);border-radius:12px;padding:14px}.sc b{font-size:22px;color:#1e40af;display:block}.sc span{font-size:12px;color:var(--mu)}
.db{background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px 14px;margin:14px 0;font-size:13.5px;line-height:1.7}
.tag{display:inline-block;font-size:11px;background:#dbeafe;color:#1e40af;border-radius:14px;padding:3px 10px;margin:3px 4px 0 0}
.hint{color:var(--mu);font-style:italic;padding:40px 8px}
h1.ht{font-size:22px;color:#1e3a8a;margin:0 0 6px}
.form-row{display:flex;align-items:center;gap:10px;padding:9px 4px;border-bottom:1px solid var(--bd);flex-wrap:wrap}
.form-code{font-family:ui-monospace,Menlo,monospace;font-size:12px;font-weight:700;color:#1e40af;background:#eff6ff;border-radius:6px;padding:2px 8px;min-width:96px;text-align:center}
.form-title{flex:1;font-size:13.5px;min-width:200px}
.form-note{font-size:11.5px;color:var(--mu);font-style:italic;width:100%}
.dl-grp{display:flex;gap:6px}
.dl-btn{font-size:12px;border:1px solid #c7d2fe;background:#eef2ff;color:#3730a3;border-radius:7px;padding:4px 10px;cursor:pointer;text-decoration:none;white-space:nowrap}
.dl-btn.dl-x{border-color:#bbf7d0;background:#ecfdf5;color:#047857}
.dl-btn:hover{filter:brightness(.97)}.dl-btn.loading{opacity:.6;pointer-events:none}
.sp{display:inline-block;width:10px;height:10px;border:2px solid currentColor;border-right-color:transparent;border-radius:50%;animation:spin .6s linear infinite;vertical-align:-1px}
@keyframes spin{to{transform:rotate(360deg)}}
</style></head>
<body>
<div class="tb">
  <div class="tb-logo">__SHORT__<small>__SUB__</small></div>
  <div class="tb-search">🔍<input id="q" placeholder="Tìm điều khoản..." oninput="search(this.value)"></div>
  <div class="tabs">
    <button class="tab on" id="tab-main" onclick="tab('main',this)">📖 Nội dung</button>
__FORMS_TAB__
    <button class="tab" id="tab-home" onclick="tab('home',this)">🏛️ Tổng quan</button>
  </div>
</div>
<div class="wrap">
  <div class="sb" id="sb"></div>
  <div class="main">
    <div class="sec on" id="s-main"><div id="av" class="hint">← Chọn điều khoản từ danh sách bên trái</div></div>
__FORMS_SEC__
    <div class="sec" id="s-home"></div>
  </div>
</div>
<script id="LD" type="application/json">__DATA__</script>
<script>
var D=JSON.parse(document.getElementById('LD').textContent);
var cur=null;
function e(s){return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function fmtPara(t){
  var x=e(t).replace(/\n/g,'<br>');
  // đậm tiền tố "1." / "a)" / "Điều N."
  x=x.replace(/^(\d+\.|[a-zđ]\)|Điều\s+\d+\.)/,'<strong>$1</strong>');
  return x;
}
function renderContent(content,q){
  var h='';
  (content||[]).forEach(function(b){
    if(b.k==='tbl'){
      h+='<table class="ct">';
      (b.rows||[]).forEach(function(r,ri){
        h+='<tr>';
        r.forEach(function(c){var tag=ri===0?'th':'td';h+='<'+tag+'>'+e(c).replace(/\n/g,'<br>')+'</'+tag+'>';});
        h+='</tr>';
      });
      h+='</table>';
    } else {
      h+='<p>'+fmtPara(b.t||'')+'</p>';
    }
  });
  return h;
}
function buildSb(filter){
  filter=(filter||'').toLowerCase().trim();
  var sb=document.getElementById('sb'),h='',lastC='',lastM='';
  (D.outline||[]).forEach(function(a){
    if(filter){
      var hay=((a.title||'')+' '+(a.content||[]).map(function(b){return b.t||''}).join(' ')).toLowerCase();
      if(hay.indexOf(filter)<0)return;
    }
    if((a.chuong||'')!==lastC){lastC=a.chuong||'';lastM='';if(lastC)h+='<div class="ns">'+e(lastC)+'</div>';}
    if((a.muc||'')!==lastM){lastM=a.muc||'';if(lastM)h+='<div class="nm">'+e(lastM)+'</div>';}
    h+='<div class="ni'+(a.id===cur?' on':'')+'" data-id="'+a.id+'" onclick="show(\''+a.id+'\')"><span class="dot"></span><span>'+e(a.code)+(a.shortTitle?'. '+e(a.shortTitle):'')+'</span></div>';
  });
  sb.innerHTML=h||'<div class="hint" style="padding:14px">Không có kết quả.</div>';
}
function show(id){
  var a=null,o=D.outline||[];
  for(var i=0;i<o.length;i++){if(o[i].id===id){a=o[i];break;}}
  if(!a)return;
  cur=id;
  tab('main',document.getElementById('tab-main'));
  buildSb(document.getElementById('q').value);
  var bc=[a.chuong,a.muc,a.code].filter(Boolean).map(e).join(' › ');
  var h='<div class="bc">'+bc+'</div><div class="at">'+e(a.title)+'</div>';
  h+='<div class="ac">'+applyDetails(id,autolink(renderContent(a.content,'')))+'</div>';
  h+=renderRefs(id);
  document.getElementById('av').className='';
  document.getElementById('av').innerHTML=h;
  var n=document.querySelector('.ni[data-id="'+id+'"]');if(n)n.scrollIntoView({block:'nearest'});
  if(history.replaceState)history.replaceState(null,'','#'+id);
}
function search(v){buildSb(v);}
function tab(t,btn){
  document.querySelectorAll('.sec').forEach(function(s){s.classList.remove('on')});
  document.querySelectorAll('.tab').forEach(function(b){b.classList.remove('on')});
  document.getElementById('s-'+t).classList.add('on');
  if(btn)btn.classList.add('on');
  if(t==='home')buildHome();
  if(t==='forms'&&typeof buildForms==='function')buildForms();
}
function buildHome(){
  var m=D.meta||{},o=D.outline||[];
  var chs={};o.forEach(function(a){if(a.chuong)chs[a.chuong]=1});
  var h='<h1 class="ht">'+e(m.title||'')+'</h1>';
  if(m.scope)h+='<p style="color:#475569">'+e(m.scope)+'</p>';
  h+='<div class="hgrid">';
  h+='<div class="sc"><b>'+o.length+'</b><span>Điều</span></div>';
  h+='<div class="sc"><b>'+Object.keys(chs).length+'</b><span>Chương</span></div>';
  if(m.effectiveDate)h+='<div class="sc"><b style="font-size:15px">'+e(m.effectiveDate)+'</b><span>Hiệu lực</span></div>';
  h+='</div>';
  if(m.description)h+='<div class="db">'+e(m.description)+'</div>';
  if(m.related&&m.related.length){h+='<div style="margin-top:10px">';m.related.forEach(function(r){h+='<span class="tag">'+e(r)+'</span>'});h+='</div>';}
  document.getElementById('s-home').innerHTML=h;
}
__FORMS_JS__
function initHash(){
  var id=(location.hash||'').replace('#','');
  var ok=(D.outline||[]).some(function(a){return a.id===id});
  buildSb('');
  if(ok)show(id);else if((D.outline||[]).length)show(D.outline[0].id);
}
initHash();
</script>
</body></html>
"""

FORMS_TAB = '    <button class="tab" id="tab-forms" onclick="tab(\'forms\',this)">📥 Biểu mẫu</button>'
FORMS_SEC = '    <div class="sec" id="s-forms"></div>'
FORMS_JS = r'''function buildForms(){
  var el=document.getElementById('s-forms');
  if(!D.forms||!D.forms.length){el.innerHTML='<div class="hint">Không có biểu mẫu.</div>';return;}
  var h='<div class="db">📥 '+D.forms.length+' biểu mẫu — tải bản Word (.docx) hoặc Excel (.xlsx).</div>',pl='';
  D.forms.forEach(function(f){
    if(f.pl&&f.pl!==pl){h+='<div class="ns">'+e(f.pl)+'</div>';pl=f.pl;}
    h+='<div class="form-row"><span class="form-code">'+e(f.code)+'</span><span class="form-title">'+e(f.title)+'</span>'+
       '<span class="dl-grp"><a class="dl-btn" data-doc="'+D.meta.slug+'" data-file="'+e(f.code)+'" data-type="word">⬇ Word</a>'+
       '<a class="dl-btn dl-x" data-doc="'+D.meta.slug+'" data-file="'+e(f.code)+'" data-type="excel">⬇ Excel</a></span>'+
       (f.note?'<span class="form-note">'+e(f.note)+'</span>':'')+'</div>';
  });
  el.innerHTML=h;
}
document.addEventListener('click',async function(ev){
  var btn=ev.target.closest('a.dl-btn');if(!btn||btn.classList.contains('loading'))return;ev.preventDefault();
  var doc=btn.getAttribute('data-doc'),file=btn.getAttribute('data-file'),type=btn.getAttribute('data-type'),orig=btn.innerHTML;
  btn.classList.add('loading');btn.innerHTML='<span class="sp"></span> ...';
  try{
    var res=await fetch('/api/legal/forms?doc='+encodeURIComponent(doc)+'&file='+encodeURIComponent(file)+'&type='+type,{credentials:'include'});
    if(!res.ok)throw 0;var blob=await res.blob();var a=document.createElement('a');var u=URL.createObjectURL(blob);
    a.href=u;a.download=file+(type==='excel'?'.xlsx':'.docx');document.body.appendChild(a);a.click();document.body.removeChild(a);
    setTimeout(function(){URL.revokeObjectURL(u)},2000);
  }catch(_){alert('Chưa có file biểu mẫu này hoặc lỗi tải. File có thể chưa được upload lên hệ thống.');}
  finally{setTimeout(function(){btn.innerHTML=orig;btn.classList.remove('loading')},700);}
});'''

def build_one(slug):
    fn, short, sub, title = DOCS[slug]
    path = ensure_docx(os.path.join(SRC, fn))
    outline, eff = parse_docx(path, slug)
    # scope/description từ Điều 1
    scope = ''
    if outline:
        first = outline[0]
        if first.get('shortTitle', '').lower().startswith('phạm vi'):
            scope = ' '.join(b['t'] for b in first['content'] if b['k'] == 'p')[:400]
    meta = {
        'title': title, 'shortCode': short, 'subtitle': sub, 'slug': slug,
        'effectiveDate': EFF.get(slug, eff), 'scope': scope,
        'description': sub, 'related': []
    }
    forms = FORMS.get(slug, [])
    payload = {'meta': meta, 'outline': outline}
    if forms:
        payload['forms'] = forms
    data = json.dumps(payload, ensure_ascii=False, separators=(',', ':'))
    html = (TEMPLATE.replace('__SHORT__', htmllib.escape(short))
                    .replace('__SUB__', htmllib.escape(sub))
                    .replace('__FORMS_TAB__', FORMS_TAB if forms else '')
                    .replace('__FORMS_SEC__', FORMS_SEC if forms else '')
                    .replace('__FORMS_JS__', FORMS_JS if forms else '')
                    .replace('__DATA__', data))
    d = os.path.join(OUT, slug)
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'index.html'), 'w', encoding='utf-8').write(html)
    nch = len({a['chuong'] for a in outline if a['chuong']})
    return len(outline), nch, eff

if __name__ == '__main__':
    print("Generating legal docs from docx...")
    for slug in DOCS:
        try:
            n, nch, eff = build_one(slug)
            print(f"  {slug:9} điều={n:3} chương={nch:2} hiệu lực={eff or '?'}")
        except Exception as ex:
            print(f"  {slug:9} ERROR: {ex}")
    print("Done.")
