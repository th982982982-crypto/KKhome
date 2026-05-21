// ============================================================
// ACB Mail Scanner + Drive Auto-Share
// Deploy lên Google Apps Script, cùng account với Google Drive
// Script Properties cần set:
//   SUPABASE_URL  = https://jmrsyjurwcjjfjntreyq.supabase.co
//   SUPABASE_KEY  = <service_role_key>
// ============================================================

// ------------------------------------------------------------
// 1. Hàm chính — trigger mỗi 1 phút
// ------------------------------------------------------------
function scanACBMails() {
  var SUPABASE_URL = PropertiesService.getScriptProperties().getProperty('SUPABASE_URL');
  var SUPABASE_KEY = PropertiesService.getScriptProperties().getProperty('SUPABASE_KEY');

  Logger.log('scanACBMails started');

  var threads = GmailApp.search('from:mailalert@acb.com.vn newer_than:2d', 0, 20);
  Logger.log('Found ' + threads.length + ' threads');

  threads.forEach(function(thread) {
    var messages = thread.getMessages();

    messages.forEach(function(msg) {
      var body = msg.getPlainBody();
      var subject = msg.getSubject();
      var date = msg.getDate();

      Logger.log('Processing: ' + subject);

      var amountMatch = body.match(/\+([0-9,.]+)\s*VND/i);
      var codeMatch = body.match(/\b(DH\d{6,})\b/);

      Logger.log('Amount match: ' + (amountMatch ? amountMatch[1] : 'null'));
      Logger.log('Code match: ' + (codeMatch ? codeMatch[1] : 'null'));

      if (!amountMatch || !codeMatch) {
        Logger.log('No match, skipping');
        return;
      }

      var amount = parseFloat(amountMatch[1].replace(/,/g, ''));
      var orderCode = codeMatch[1];

      // Chỉ skip nếu đã confirm thành công (matched_order_id không null)
      var existing = supabaseGet(SUPABASE_URL, SUPABASE_KEY,
        '/bank_transactions?order_code=eq.' + orderCode + '&amount=eq.' + amount + '&matched_order_id=not.is.null&select=id'
      );
      if (existing && existing.length > 0) {
        Logger.log('Already confirmed: ' + orderCode);
        return;
      }

      // Insert hoặc cập nhật bank_transaction
      var txContent = body.match(/Nội dung giao dịch[:\s]+([^\n]+)/i);
      var transactionContent = txContent ? txContent[1].trim() : '';

      // Kiểm tra đã có record chưa (có thể chưa match)
      var existingTx = supabaseGet(SUPABASE_URL, SUPABASE_KEY,
        '/bank_transactions?order_code=eq.' + orderCode + '&amount=eq.' + amount + '&select=id'
      );

      if (!existingTx || existingTx.length === 0) {
        supabasePost(SUPABASE_URL, SUPABASE_KEY, '/bank_transactions', {
          order_code: orderCode,
          amount: amount,
          transaction_content: transactionContent,
          email_subject: subject,
          transaction_at: date.toISOString()
        });
        Logger.log('Inserted bank_transaction: ' + orderCode + ' / ' + amount);
      } else {
        Logger.log('Re-trying confirmation for: ' + orderCode);
      }

      // Tìm đơn khớp và confirm
      var orders = supabaseGet(SUPABASE_URL, SUPABASE_KEY,
        '/orders?order_code=eq.' + orderCode + '&total_amount=eq.' + amount + '&status=eq.pending&select=*'
      );
      Logger.log('Matching orders: ' + (orders ? orders.length : 0));

      if (orders && orders.length > 0) {
        confirmOrderAndShare(SUPABASE_URL, SUPABASE_KEY, orders[0]);
      }
    });
  });
}

// ------------------------------------------------------------
// 2. Xác nhận đơn + tạo user_purchases + share Drive
// ------------------------------------------------------------
function confirmOrderAndShare(SUPABASE_URL, SUPABASE_KEY, order) {
  var now = new Date().toISOString();

  // Update order → confirmed
  supabasePatch(SUPABASE_URL, SUPABASE_KEY, '/orders?id=eq.' + order.id, {
    status: 'confirmed',
    confirmed_at: now
  });
  Logger.log('Order confirmed: ' + order.order_code);

  // Tạo user_purchases
  var items = order.items;
  var purchases = items.map(function(item) {
    return {
      user_id: order.user_id,
      purchase_type: item.type,
      template_id: item.type === 'template' ? item.id : null,
      package_id: item.type === 'package' ? item.id : null,
      order_id: order.id
    };
  });
  supabasePost(SUPABASE_URL, SUPABASE_KEY, '/user_purchases', purchases);

  // Lấy tất cả template IDs
  var templateIds = items
    .filter(function(i) { return i.type === 'template'; })
    .map(function(i) { return i.id; });

  var packageIds = items
    .filter(function(i) { return i.type === 'package'; })
    .map(function(i) { return i.id; });

  if (packageIds.length > 0) {
    var pkgTemplates = supabaseGet(SUPABASE_URL, SUPABASE_KEY,
      '/package_templates?package_id=in.(' + packageIds.join(',') + ')&select=template_id'
    );
    if (pkgTemplates) {
      pkgTemplates.forEach(function(pt) { templateIds.push(pt.template_id); });
    }
  }

  if (templateIds.length > 0) {
    // Lấy cả embed_url và copy_url
    var templates = supabaseGet(SUPABASE_URL, SUPABASE_KEY,
      '/templates?id=in.(' + templateIds.join(',') + ')&select=id,name,google_sheet_embed_url,google_sheet_copy_url'
    );

    if (templates) {
      templates.forEach(function(t) {
        // Ưu tiên embed_url, fallback sang copy_url
        var fileId = extractDriveFileId(t.google_sheet_embed_url) || extractDriveFileId(t.google_sheet_copy_url);
        if (!fileId) {
          Logger.log('No file ID for: ' + t.name);
          return;
        }
        try {
          DriveApp.getFileById(fileId).addViewer(order.email);
          Logger.log('Shared ' + t.name + ' (' + fileId + ') with ' + order.email);
        } catch(e) {
          Logger.log('Share error for ' + t.name + ': ' + e.message);
        }
      });
    }
  }

  // Cập nhật matched_order_id
  supabasePatch(SUPABASE_URL, SUPABASE_KEY,
    '/bank_transactions?order_code=eq.' + order.order_code + '&amount=eq.' + order.total_amount,
    { matched_order_id: order.id }
  );

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
      try { DriveApp.getFileById(id).addViewer(email); } catch(err) {
        Logger.log('doPost share error: ' + err.message);
      }
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

function supabaseGet(SUPABASE_URL, SUPABASE_KEY, path) {
  var res = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1' + path, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'Content-Type': 'application/json'
    },
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) {
    Logger.log('GET error ' + res.getResponseCode() + ': ' + res.getContentText());
    return null;
  }
  return JSON.parse(res.getContentText());
}

function supabasePost(SUPABASE_URL, SUPABASE_KEY, path, body) {
  var res = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1' + path, {
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
  if (res.getResponseCode() >= 400) {
    Logger.log('POST error ' + res.getResponseCode() + ': ' + res.getContentText());
  }
}

function supabasePatch(SUPABASE_URL, SUPABASE_KEY, path, body) {
  var res = UrlFetchApp.fetch(SUPABASE_URL + '/rest/v1' + path, {
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
  if (res.getResponseCode() >= 400) {
    Logger.log('PATCH error ' + res.getResponseCode() + ': ' + res.getContentText());
  }
}

// ------------------------------------------------------------
// Setup: chạy hàm này 1 lần để tạo trigger tự động
// ------------------------------------------------------------
function setupTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'scanACBMails') {
      ScriptApp.deleteTrigger(t);
    }
  });
  ScriptApp.newTrigger('scanACBMails')
    .timeBased()
    .everyMinutes(1)
    .create();
  Logger.log('Trigger created: scanACBMails every 1 minute');
}
