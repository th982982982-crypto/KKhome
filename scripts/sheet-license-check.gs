// ============================================================
// KKHome License Check — nhúng vào mỗi Google Sheet template
// Hướng dẫn:
//   1. Extensions → Apps Script → dán script này vào
//   2. Thay TEMPLATE_ID bằng UUID của template trong Supabase
//   3. Lưu và đóng Apps Script editor
//   Khách mua sẽ tự kích hoạt qua menu KKHome
// ============================================================

// ⚠️ THAY BẰNG UUID CỦA TEMPLATE TRONG SUPABASE
var TEMPLATE_ID = 'REPLACE_WITH_TEMPLATE_UUID';
var API_BASE    = 'https://hkdkkhome.com';

// ------------------------------------------------------------
// Chạy tự động khi mở file
// ------------------------------------------------------------
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('KKHome')
    .addItem('Kích hoạt License', 'showActivateDialog')
    .addItem('Kiểm tra License', 'checkLicense')
    .addToUi();

  checkLicense();
}

// ------------------------------------------------------------
// Kiểm tra license với backend
// ------------------------------------------------------------
function checkLicense() {
  var props = PropertiesService.getDocumentProperties();
  var key   = props.getProperty('LICENSE_KEY');
  var email = Session.getActiveUser().getEmail();

  if (!key) {
    showLockOverlay('Vui lòng kích hoạt license để sử dụng.');
    return;
  }
  if (!email) {
    showLockOverlay('Không lấy được email Google. Hãy cấp quyền cho script và thử lại.');
    return;
  }

  var url = API_BASE + '/api/license/validate'
          + '?key='         + encodeURIComponent(key)
          + '&email='       + encodeURIComponent(email.toLowerCase().trim())
          + '&template_id=' + encodeURIComponent(TEMPLATE_ID);

  try {
    var res  = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    var data = JSON.parse(res.getContentText());

    if (data.valid) {
      unlockSheets();
    } else {
      showLockOverlay(data.message || 'License không hợp lệ.');
    }
  } catch(e) {
    showLockOverlay('Lỗi kết nối. Kiểm tra internet và thử lại.');
  }
}

// ------------------------------------------------------------
// Dialog nhập license key
// ------------------------------------------------------------
function showActivateDialog() {
  var ui     = SpreadsheetApp.getUi();
  var result = ui.prompt(
    'Kích hoạt License',
    'Nhập license key của bạn (dạng KKH-XXXX-XXXX):',
    ui.ButtonSet.OK_CANCEL
  );
  if (result.getSelectedButton() !== ui.Button.OK) return;

  var key = result.getResponseText().trim();
  if (!key) return;

  PropertiesService.getDocumentProperties().setProperty('LICENSE_KEY', key);
  checkLicense();
}

// ------------------------------------------------------------
// Khóa: ẩn tất cả sheet, hiện sheet LOCK
// ------------------------------------------------------------
function showLockOverlay(message) {
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();

  // Ẩn tất cả sheet trừ sheet LOCK
  sheets.forEach(function(s) {
    if (s.getName() !== '🔒 License') s.hideSheet();
  });

  // Tạo hoặc lấy sheet LOCK
  var lock = ss.getSheetByName('🔒 License');
  if (!lock) {
    lock = ss.insertSheet('🔒 License', 0);
    lock.getRange('A1:Z50').setBackground('#1a1a2e');

    var titleCell = lock.getRange('B3');
    titleCell.setValue('⛔ Chưa kích hoạt License')
      .setFontSize(18).setFontWeight('bold').setFontColor('#ffffff');

    var msgCell = lock.getRange('B5');
    msgCell.setFontSize(12).setFontColor('#cccccc');

    lock.getRange('B7').setValue('👉 Menu KKHome → Kích hoạt License → nhập key của bạn.')
      .setFontSize(11).setFontColor('#aaaaaa');

    lock.setColumnWidth(1, 30);
    lock.setColumnWidth(2, 500);
  }

  lock.getRange('B5').setValue(message);
  lock.showSheet();
  ss.setActiveSheet(lock);
}

// ------------------------------------------------------------
// Mở khóa: ẩn sheet LOCK, hiện tất cả sheet còn lại
// ------------------------------------------------------------
function unlockSheets() {
  var ss     = SpreadsheetApp.getActiveSpreadsheet();
  var sheets = ss.getSheets();

  sheets.forEach(function(s) { s.showSheet(); });

  var lock = ss.getSheetByName('🔒 License');
  if (lock) lock.hideSheet();

  SpreadsheetApp.getUi().alert('✅ License hợp lệ! Chào mừng bạn.');
}
