// ============================================================
// ACB Mail Scanner + Drive Auto-Share
// Deploy lên Google Apps Script, cùng account với Google Drive
// Cần set Script Properties:
//   SUPABASE_URL  = https://jmrsyjurwcjjfjntreyq.supabase.co
//   SUPABASE_KEY  = <service_role_key>
// ============================================================

var SUPABASE_URL = PropertiesService.getScriptProperties().getProperty('SUPABASE_URL');
var SUPABASE_KEY = PropertiesService.getScriptProperties().getProperty('SUPABASE_KEY');

// ------------------------------------------------------------
// 1. Hàm chính — đặt trigger chạy mỗi 1 phút
// ------------------------------------------------------------
function scanACBMails() {
  var threads = GmailApp.search('from:mailalert@acb.com.vn is:unread', 0, 20);

  threads.forEach(function(thread) {
    var msg = thread.getMessages()[0];
    var body = msg.getPlainBody();
    var subject = msg.getSubject();
    var date = msg.getDate();

    // Parse amount: "Ghi có +2,000.00 VND"
    var amountMatch = body.match(/Ghi có \+([0-9,]+(?:\.[0-9]+)?)\s*VND/i);
    // Parse order code: DHxxxxxx pattern
    var codeMatch = body.match(/\b(DH\d{6,})\b/);

    if (!amountMatch || !codeMatch) {
      thread.markRead();
      return;
    }

    var amount = parseFloat(amountMatch[1].replace(/,/g, ''));
    var orderCode = codeMatch[1];
    var txContent = body.match(/Nội dung giao dịch[:\s]+([^\n]+)/i);
    var transactionContent = txContent ? txContent[1].trim() : '';

    // Tránh insert trùng: kiểm tra đã có chưa
    var existing = supabaseGet('/bank_transactions?order_code=eq.' + orderCode + '&amount=eq.' + amount + '&select=id');
    if (existing && existing.length > 0) {
      thread.markRead();
      return;
    }

    // Lưu vào bank_transactions
    supabasePost('/bank_transactions', {
      order_code: orderCode,
      amount: amount,
      transaction_content: transactionContent,
      email_subject: subject,
      transaction_at: date.toISOString()
    });

    // Tìm đơn khớp
    var orders = supabaseGet(
      '/orders?order_code=eq.' + orderCode + '&total_amount=eq.' + amount + '&status=eq.pending&select=*'
    );

    if (orders && orders.length > 0) {
      confirmOrderAndShare(orders[0]);
    }

    thread.markRead();
  });
}

// ------------------------------------------------------------
// 2. Xác nhận đơn + tạo user_purchases + share Drive
// ------------------------------------------------------------
function confirmOrderAndShare(order) {
  var now = new Date().toISOString();

  // Update order → confirmed
  supabasePatch('/orders?id=eq.' + order.id, {
    status: 'confirmed',
    confirmed_at: now
  });

  // Tạo user_purchases
  var items = order.items; // JSON array
  var purchases = items.map(function(item) {
    return {
      user_id: order.user_id,
      purchase_type: item.type,
      template_id: item.type === 'template' ? item.id : null,
      package_id: item.type === 'package' ? item.id : null,
      order_id: order.id
    };
  });
  supabasePost('/user_purchases', purchases);

  // Lấy tất cả template IDs (bao gồm từ package)
  var templateIds = items
    .filter(function(i) { return i.type === 'template'; })
    .map(function(i) { return i.id; });

  var packageIds = items
    .filter(function(i) { return i.type === 'package'; })
    .map(function(i) { return i.id; });

  if (packageIds.length > 0) {
    var pkgTemplates = supabaseGet(
      '/package_templates?package_id=in.(' + packageIds.join(',') + ')&select=template_id'
    );
    if (pkgTemplates) {
      pkgTemplates.forEach(function(pt) { templateIds.push(pt.template_id); });
    }
  }

  if (templateIds.length === 0) return;

  // Lấy embed URLs của templates
  var templates = supabaseGet(
    '/templates?id=in.(' + templateIds.join(',') + ')&select=id,name,google_sheet_embed_url'
  );

  if (!templates) return;

  // Share từng file Drive với email khách
  templates.forEach(function(t) {
    var fileId = extractDriveFileId(t.google_sheet_embed_url);
    if (!fileId) return;
    try {
      DriveApp.getFileById(fileId).addViewer(order.email);
      Logger.log('Shared ' + t.name + ' with ' + order.email);
    } catch(e) {
      Logger.log('Share error for ' + t.name + ': ' + e.message);
    }
  });

  // Cập nhật matched_order_id trong bank_transactions
  supabasePatch('/bank_transactions?order_code=eq.' + order.order_code + '&amount=eq.' + order.total_amount, {
    matched_order_id: order.id
  });

  Logger.log('Order ' + order.order_code + ' confirmed and Drive shared to ' + order.email);
}

// ------------------------------------------------------------
// 3. HTTP endpoint — manual confirm cũng share Drive
// POST body: { email: string, fileIds: string[] }
// ------------------------------------------------------------
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var email = payload.email;
    var fileIds = payload.fileIds || [];

    fileIds.forEach(function(id) {
      try { DriveApp.getFileById(id).addViewer(email); } catch(err) {}
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(e) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: e.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function extractDriveFileId(url) {
  if (!url) return null;
  var m = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  return m ? m[1] : null;
}

function supabaseGet(path) {
  var res = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1' + path, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) return null;
  return JSON.parse(res.getContentText());
}

function supabasePost(path, body) {
  UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1' + path, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });
}

function supabasePatch(path, body) {
  UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1' + path, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    },
    payload: JSON.stringify(body),
    muteHttpExceptions: true
  });
}

// ------------------------------------------------------------
// Setup: chạy hàm này 1 lần để tạo trigger tự động
// ------------------------------------------------------------
function setupTrigger() {
  // Xóa trigger cũ nếu có
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'scanACBMails') {
      ScriptApp.deleteTrigger(t);
    }
  });
  // Tạo trigger mới: mỗi 1 phút
  ScriptApp.newTrigger('scanACBMails')
    .timeBased()
    .everyMinutes(1)
    .create();
  Logger.log('Trigger created: scanACBMails every 1 minute');
}
