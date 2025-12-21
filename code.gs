// ==========================================
// 設定區
// ==========================================
const CONFIG = {
  TELEGRAM_BOT_TOKEN: "你的_TELEGRAM_BOT_TOKEN",
  OWNER_CHAT_ID: "你的_TELEGRAM_CHAT_ID",
  SHEET_NAME: "訂單紀錄",
  MENU_SHEET_NAME: "Menu"
};

// ==========================================
// 1. 處理 GET 請求 (提供菜單給前端網頁 或 訂單列表給管理頁面)
// ==========================================
function doGet(e) {
  const params = e.parameter;
  
  // 如果是管理頁面請求訂單列表
  if (params.action === 'getOrders') {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify([]))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const data = sheet.getDataRange().getValues();
    const orders = [];
    
    // 從第二列開始抓取 (跳過標題)
    for (let i = 1; i < data.length; i++) {
      if (data[i][0]) {
        orders.push({
          id: data[i][0],
          time: data[i][1],
          table: data[i][2],
          items: data[i][3],
          total: data[i][4],
          status: data[i][5]
        });
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify(orders))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  // 預設返回菜單數據
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.MENU_SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  const menu = [];
  
  // 從第二列開始抓取 (跳過標題)
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      menu.push({
        name: data[i][0],
        img: data[i][1],
        price: data[i][2]
      });
    }
  }
  
  return ContentService.createTextOutput(JSON.stringify(menu))
    .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// 2. 處理 POST 請求 (接收網頁訂單 & TG 按鈕回傳 & 管理頁面更新)
// ==========================================
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);

    // --- 情況 A: 處理來自 Telegram 按鈕的點擊 ---
    if (postData.callback_query) {
      return handleTGCallback(postData.callback_query);
    }

    // --- 情況 B: 處理來自管理頁面的訂單狀態更新 ---
    if (postData.action === 'updateOrderStatus') {
      const result = updateOrderStatusInSheet(postData.orderId, postData.status);
      return ContentService.createTextOutput(JSON.stringify({
        "result": "success",
        "message": result
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // --- 情況 C: 處理來自前端網頁的新訂單 ---
    const params = postData;
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
    
    // 如果表單不存在則建立
    if (!sheet) {
      sheet = ss.insertSheet(CONFIG.SHEET_NAME);
      sheet.appendRow(["訂單ID", "下單時間", "桌號", "明細", "總金額", "狀態"]);
    }

    // 產生唯一 ID (時間戳36進位 + 隨機碼)
    const orderId = generateUniqueId();
    const now = new Date();
    
    // 寫入試算表
    sheet.appendRow([
      orderId, 
      now, 
      params.table, 
      params.items, 
      params.total, 
      "待處理"
    ]);

    // 發送 Telegram 通知 (帶按鈕)
    sendTelegramWithButtons({
      orderId: orderId,
      table: params.table,
      items: params.items,
      total: params.total,
      time: Utilities.formatDate(now, "GMT+8", "HH:mm:ss")
    });

    return ContentService.createTextOutput(JSON.stringify({
      "result": "success", 
      "orderId": orderId
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      "result": "error", 
      "message": err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// 3. 核心功能函式
// ==========================================

/**
 * 產生唯一 Hash ID
 */
function generateUniqueId() {
  const part1 = new Date().getTime().toString(36).slice(-4); // 時間戳後4碼
  const part2 = Math.random().toString(36).substring(2, 5); // 隨機3碼
  return (part1 + part2).toUpperCase();
}

/**
 * 發送帶有「狀態更新按鈕」的 TG 通知
 */
function sendTelegramWithButtons(order) {
  const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/sendMessage`;
  
  const message = 
    `🔔 *新訂單通知 [${order.orderId}]*\n` +
    `━━━━━━━━━━━━━━\n` +
    `📍 *桌號：* ${order.table}\n` +
    `🍱 *明細：* ${order.items}\n` +
    `💰 *金額：* $${order.total}\n` +
    `⏰ *時間：* ${order.time}\n` +
    `━━━━━━━━━━━━━━\n` +
    `請選擇訂單操作：`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "✅ 已出餐", callback_data: `status:done:${order.orderId}` },
        { text: "❌ 取消單", callback_data: `status:cancel:${order.orderId}` }
      ]
    ]
  };

  const options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      chat_id: CONFIG.OWNER_CHAT_ID,
      text: message,
      parse_mode: "Markdown",
      reply_markup: keyboard
    })
  };

  UrlFetchApp.fetch(url, options);
}

/**
 * 處理 TG 按鈕回傳並更新試算表
 */
function handleTGCallback(callbackQuery) {
  const data = callbackQuery.data; // 格式 "status:action:orderId"
  const parts = data.split(':');
  const action = parts[1];
  const orderId = parts[2];
  const callbackId = callbackQuery.id;

  const newStatus = (action === 'done') ? "已出餐" : "已取消";
  const resultMessage = updateOrderStatusInSheet(orderId, newStatus);

  // 回應 Telegram (讓手機上方彈出小提示)
  const url = `https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`;
  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      callback_query_id: callbackId,
      text: resultMessage
    })
  });

  return ContentService.createTextOutput("OK");
}

/**
 * 更新試算表中的訂單狀態
 */
function updateOrderStatusInSheet(orderId, status) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(CONFIG.SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === orderId) {
      sheet.getRange(i + 1, 6).setValue(status); // 第 6 欄是「狀態」
      return `訂單 ${orderId} 已標記為 ${status}`;
    }
  }
  return "找不到該訂單 ID";
}