# ADMIN_CORE.GS — Hệ Thống Điều Hành SaaS Dành Cho Quản Trị Viên

## Cấu hình ban đầu

```javascript
const TEMPLATE_DATABASE_SS_ID = "MÃ_ID_FILE_SAAS_TEMPLATE_DATABASE_CỦA_BẠN";
const SYSTEM_ROOT_FOLDER_ID = "1fXemtmQJeGviJNb9nXTz0WLOZXVI2iuo";
```

- `TEMPLATE_DATABASE_SS_ID`: ID file Spreadsheet mẫu (SaaS_Template_Database) dùng để nhân bản khi tạo tài khoản mới.
- `SYSTEM_ROOT_FOLDER_ID`: ID thư mục gốc trên Google Drive để chứa các thư mục con của từng khách hàng.

---

## Menu Admin (onOpen)

Khi mở file Google Sheet Master, tự động tạo menu **🚀 QUẢN LÝ SAAS** gồm:

| Menu Item | Hàm gọi |
|---|---|
| 🔑 Gia hạn gói cước Khách hàng | `ui_GiaHanTenant` |
| 🔒 Khóa tài khoản (Ngừng dịch vụ) | `ui_KhoaTenant` |
| 🔓 Mở khóa tài khoản | `ui_MoKhoaTenant` |
| ➕ Tạo thủ công tài khoản khách | `ui_TaoTenantThuCong` |

---

## Module 1 — Gia Hạn Thuê Bao

**Hàm:** `ui_GiaHanTenant()`

**Luồng xử lý:**
1. Nhập Username cần gia hạn.
2. Nhập số ngày gia hạn thêm (VD: 30, 90, 365).
3. Tìm dòng khớp trong sheet `M_Tenants`.
4. Tính ngày hết hạn mới:
   - Nếu tài khoản **còn hạn** → cộng thêm từ ngày hết hạn hiện tại.
   - Nếu tài khoản **đã hết hạn** → cộng thêm từ hôm nay.
5. Ghi đè các cột:
   - **Cột F** (index 6): Ngày hết hạn mới.
   - **Cột G** (index 7): Trạng thái `ACTIVE`.
   - **Cột E** (index 5): Gói `PREMIUM`.

---

## Module 2 — Khóa / Mở Khóa Tài Khoản

**Hàm:** `ui_KhoaTenant()` / `ui_MoKhoaTenant()`  
**Hàm dùng chung:** `executeChangeStatus(statusTarget, successMsgPrefix)`

**Luồng xử lý:**
1. Nhập Username cần xử lý.
2. Tìm dòng khớp trong sheet `M_Tenants`.
3. Ghi đè **Cột G** (index 7) bằng giá trị trạng thái:
   - Khóa → `LOCKED`
   - Mở khóa → `ACTIVE`

---

## Module 3 — Tạo Thủ Công Tài Khoản

**Hàm:** `ui_TaoTenantThuCong()`

**Luồng xử lý:**
1. Nhập Username và Password khởi tạo.
2. Kiểm tra trùng tên trên sheet `M_Tenants`.
3. Nhân bản file Spreadsheet mẫu → đặt tên `Tax_DB_<username>`.
4. Tạo thư mục mới trong thư mục gốc → đặt tên `Storage_XML_<username>`.
5. Tính ngày hết hạn = hôm nay + 365 ngày.
6. Ghi dòng mới vào sheet `M_Tenants`:

| Cột | Nội dung |
|---|---|
| A | Username |
| B | Password |
| C | ID Spreadsheet DB của khách |
| D | ID Folder lưu trữ của khách |
| E | `PREMIUM` |
| F | Ngày hết hạn (hôm nay + 365) |
| G | `ACTIVE` |

---

## Cấu trúc Sheet M_Tenants

| Cột | Index (0-based) | Nội dung |
|---|---|---|
| A | 0 | Username |
| B | 1 | Password |
| C | 2 | Spreadsheet DB ID |
| D | 3 | Folder ID |
| E | 4 | Gói dịch vụ (FREE / PREMIUM) |
| F | 5 | Ngày hết hạn |
| G | 6 | Trạng thái (ACTIVE / LOCKED) |

---

## Script đầy đủ

```javascript
// =========================================================================
// 🚀 FILE: ADMIN_CORE.GS - HỆ THỐNG ĐIỀU HÀNH SAAS DÀNH CHO QUẢN TRỊ VIÊN
// =========================================================================

const TEMPLATE_DATABASE_SS_ID = "MÃ_ID_FILE_SAAS_TEMPLATE_DATABASE_CỦA_BẠN";
const SYSTEM_ROOT_FOLDER_ID = "1fXemtmQJeGviJNb9nXTz0WLOZXVI2iuo"; 

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('🚀 QUẢN LÝ SAAS')
      .addItem('🔑 Gia hạn gói cước Khách hàng', 'ui_GiaHanTenant')
      .addSeparator()
      .addItem('🔒 Khóa tài khoản (Ngừng dịch vụ)', 'ui_KhoaTenant')
      .addItem('🔓 Mở khóa tài khoản', 'ui_MoKhoaTenant')
      .addSeparator()
      .addItem('➕ Tạo thủ công tài khoản khách', 'ui_TaoTenantThuCong')
      .addToUi();
}

// =========================================================================
// ⚡ MODULE 1: GIA HẠN THUÊ BAO KHÁCH HÀNG
// =========================================================================
function ui_GiaHanTenant() {
  var ui = SpreadsheetApp.getUi();
  var userPrompt = ui.prompt('GIA HẠN DỊCH VỤ', 'Nhập Tên tài khoản (Username) muốn gia hạn:', ui.ButtonSet.OK_CANCEL);
  if (userPrompt.getSelectedButton() !== ui.Button.OK) return;
  var username = userPrompt.getResponseText().trim();
  
  var daysPrompt = ui.prompt('HẠN ĐỊNH THỜI GIAN', 'Nhập số ngày muốn gia hạn thêm (Ví dụ: 30, 90, 365):', ui.ButtonSet.OK_CANCEL);
  if (daysPrompt.getSelectedButton() !== ui.Button.OK) return;
  var days = parseInt(daysPrompt.getResponseText().trim());
  
  if (isNaN(days) || days <= 0) {
    ui.alert('❌ Lỗi', 'Số ngày gia hạn không hợp lệ!', ui.ButtonSet.OK);
    return;
  }
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("M_Tenants");
  var data = sheet.getDataRange().getValues();
  var found = false;
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim().toLowerCase() === username.toLowerCase()) {
      var currentExpiry = new Date(data[i][5]);
      var today = new Date();
      
      var baseDate = (currentExpiry > today) ? currentExpiry : today;
      baseDate.setDate(baseDate.getDate() + days);
      
      sheet.getRange(i + 1, 6).setValue(baseDate);
      sheet.getRange(i + 1, 7).setValue("ACTIVE");
      sheet.getRange(i + 1, 5).setValue("PREMIUM");
      
      ui.alert('🎉 Thành công', 'Đã gia hạn thành công tài khoản ' + username + ' thêm ' + days + ' ngày.\nHạn dùng mới: ' + Utilities.formatDate(baseDate, SpreadsheetApp.getActiveSpreadsheet().getSpreadsheetTimeZone(), "dd/MM/yyyy"), ui.ButtonSet.OK);
      found = true;
      break;
    }
  }
  if (!found) ui.alert('❌ Thất bại', 'Không tìm thấy tên tài khoản này trên hệ thống Master!', ui.ButtonSet.OK);
}

// =========================================================================
// ⚡ MODULE 2: KHÓA / MỞ KHÓA TÀI KHOẢN KHÁCH HÀNG
// =========================================================================
function ui_KhoaTenant() {
  executeChangeStatus("LOCKED", "Đã KHÓA quyền truy cập của tài khoản ");
}

function ui_MoKhoaTenant() {
  executeChangeStatus("ACTIVE", "Đã MỞ KHÓA thành công cho tài khoản ");
}

function executeChangeStatus(statusTarget, successMsgPrefix) {
  var ui = SpreadsheetApp.getUi();
  var prompt = ui.prompt('CẬP NHẬT TRẠNG THÁI', 'Nhập Tên tài khoản (Username) cần xử lý:', ui.ButtonSet.OK_CANCEL);
  if (prompt.getSelectedButton() !== ui.Button.OK) return;
  var username = prompt.getResponseText().trim();
  
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("M_Tenants");
  var data = sheet.getDataRange().getValues();
  var found = false;
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim().toLowerCase() === username.toLowerCase()) {
      sheet.getRange(i + 1, 7).setValue(statusTarget);
      ui.alert('✅ Thông báo', successMsgPrefix + username + "!", ui.ButtonSet.OK);
      found = true;
      break;
    }
  }
  if (!found) ui.alert('❌ Thất bại', 'Không tìm thấy tên tài khoản này!', ui.ButtonSet.OK);
}

// =========================================================================
// ⚡ MODULE 3: TẠO THỦ CÔNG TÀI KHOẢN
// =========================================================================
function ui_TaoTenantThuCong() {
  var ui = SpreadsheetApp.getUi();
  var userPrompt = ui.prompt('TẠO TÀI KHOẢN', 'Nhập Tên tài khoản muốn tạo:', ui.ButtonSet.OK_CANCEL);
  if (userPrompt.getSelectedButton() !== ui.Button.OK) return;
  var username = userPrompt.getResponseText().trim();
  
  var passPrompt = ui.prompt('MẬT KHẨU', 'Nhập Mật khẩu khởi tạo:', ui.ButtonSet.OK_CANCEL);
  if (passPrompt.getSelectedButton() !== ui.Button.OK) return;
  var password = passPrompt.getResponseText().trim();

  if (!username || !password) { ui.alert('Lỗi', 'Tài khoản hoặc mật khẩu không được bỏ trống!', ui.ButtonSet.OK); return; }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("M_Tenants");
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0].toString().trim().toLowerCase() === username.toLowerCase()) {
      ui.alert('❌ Thất bại', 'Tên tài khoản này đã tồn tại trên hệ thống Master!', ui.ButtonSet.OK);
      return;
    }
  }
  
  try {
    var templateFile = DriveApp.getFileById(TEMPLATE_DATABASE_SS_ID);
    var clientDbCopy = templateFile.makeCopy("Tax_DB_" + username);
    var clientSsId = clientDbCopy.getId();
    
    var rootFolder = DriveApp.getFolderById(SYSTEM_ROOT_FOLDER_ID);
    var clientFolder = rootFolder.createFolder("Storage_XML_" + username);
    var clientFolderId = clientFolder.getId();
    
    var expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 365);
    
    sheet.appendRow([username, password, clientSsId, clientFolderId, "PREMIUM", expiryDate, "ACTIVE"]);
    ui.alert('🎉 Thành công', 'Đã cấp lập phân hệ SaaS cho tài khoản ' + username + ' thành công!', ui.ButtonSet.OK);
  } catch (err) {
    ui.alert('❌ Lỗi hệ thống', err.toString(), ui.ButtonSet.OK);
  }
}
```
