// ==========================================
// 設定區
// ==========================================
const CONFIG = {
  SHEET_NAME: "訂單紀錄",
  MENU_SHEET_NAME: "Menu",
  USER_SHEET_NAME: "password", // 帳號密碼分頁
  HEADERS: ["訂單ID", "下單時間", "明細", "總金額", "狀態"]
};

// ==========================================
// 1. 處理 GET 請求 (讀取資料)
// ==========================================
function doGet(e) {
  const type = e.parameter.type;
  const user = e.parameter.user;
  const pass = e.parameter.password;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  try {
    // --- 公開資訊：不需要驗證 ---
    if (type === "menu") {
      const sheet = ss.getSheetByName(CONFIG.MENU_SHEET_NAME);
      const rawData = sheet.getDataRange().getValues();
      let data = [];
      for (let i = 1; i < rawData.length; i++) {
        if (rawData[i][0]) {
          data.push({ name: rawData[i][0], img: rawData[i][1], price: rawData[i][2] });
        }
      }
      return createJsonResponse({ status: "success", data: data });
    } else if (type === "table") {
      // 讀取特定桌號訂單
      const tableName = e.parameter.name;
      data = getSheetDataAsJson(ss.getSheetByName(tableName));
      return createJsonResponse({ status: "success", data: data });
    }

    // --- 管理端資訊：需要驗證 ---
    if (!verifyManager(user, pass)) {
      return createJsonResponse({ status: "error", message: "權限不足，請提供正確的管理員帳密" });
    }

    let data = [];
    if (type === "orders") {
      // 讀取總訂單紀錄
      data = getSheetDataAsJson(ss.getSheetByName(CONFIG.SHEET_NAME));
    } 

    return createJsonResponse({ status: "success", data: data });

  } catch (err) {
    return createJsonResponse({ status: "error", message: err.toString() });
  }
}

// ==========================================
// 2. 處理 POST 請求 (寫入/更新資料)
// ==========================================
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. 登入行為 (純驗證)
    if (action === "login") {
      if (verifyManager(params.user, params.password)) {
        return createJsonResponse({ result: "success", message: "登入成功" });
      } else {
        return createJsonResponse({ result: "error", message: "帳號或密碼錯誤" });
      }
    }

    // 2. 新增訂單 (通常由顧客發起，不強制驗證，或可根據需求調整)
    if (action === "addOrder") {
      const orderId = generateUniqueId();
      const now = new Date();
      const orderRow = [orderId, now, params.items, params.total, "待處理"];

      const tableSheet = getOrCreateSheet(ss, params.table.toString());
      tableSheet.appendRow(orderRow);

      return createJsonResponse({ result: "success", orderId: orderId });
    }

    // 3. 更新狀態 (管理端功能：強制驗證)
    if (action === "updateStatus") {
      if (!verifyManager(params.user, params.password)) {
        return createJsonResponse({ result: "error", message: "權限不足" });
      }
      const updateCount = updateOrderStatusInAllSheets(params.orderId, params.status);
      return createJsonResponse({ result: "success", updated: updateCount });
    }

    // 4. 結帳 (管理端功能：強制驗證)
    if (action === "checkout") {
      if (!verifyManager(params.user, params.password)) {
        return createJsonResponse({ result: "error", message: "權限不足" });
      }
      const result = checkoutTable(params.table);
      return createJsonResponse(result);
    }

    return createJsonResponse({ result: "error", message: "無效的操作指令" });

  } catch (err) {
    return createJsonResponse({ result: "error", message: err.toString() });
  }
}

// ==========================================
// 3. 工具函式
// ==========================================

// 驗證管理者帳密
function verifyManager(username, password) {
  if (!username || !password) return false;
  
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(CONFIG.USER_SHEET_NAME);
  if (!sheet) return false;

  const data = sheet.getDataRange().getValues();
  // 遍歷每一列比對 A 欄與 B 欄
  for (let i = 1; i < data.length; i++) {
    if (data[i][0].toString() === username.toString() && 
        data[i][1].toString() === password.toString()) {
      return true;
    }
  }
  return false;
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  ensureHeaders(sheet);
  return sheet;
}

function ensureHeaders(sheet) {
  const currentHeaders = sheet.getRange(1, 1, 1, CONFIG.HEADERS.length).getValues()[0];
  const needsUpdate = CONFIG.HEADERS.some((h, i) => h !== currentHeaders[i]);
  
  if (needsUpdate) {
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(CONFIG.HEADERS);
    } else {
      sheet.getRange(1, 1, 1, CONFIG.HEADERS.length).setValues([CONFIG.HEADERS]);
    }
    sheet.setFrozenRows(1);
  }
}

function getSheetDataAsJson(sheet) {
  if (!sheet) return [];
  ensureHeaders(sheet);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    let obj = {};
    headers.forEach((header, index) => {
      let val = data[i][index];
      // 處理日期格式
      if (val instanceof Date) {
        val = Utilities.formatDate(val, "GMT+8", "yyyy-MM-dd HH:mm:ss");
      }
      obj[header] = val;
    });
    rows.push(obj);
  }
  return rows;
}

function updateOrderStatusInAllSheets(orderId, status) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheets = ss.getSheets();
  let count = 0;

  sheets.forEach(sheet => {
    const sheetName = sheet.getName();
    if (sheetName === CONFIG.MENU_SHEET_NAME || sheetName === CONFIG.USER_SHEET_NAME) return;
    
    ensureHeaders(sheet);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIdx = headers.indexOf("訂單ID");
    const statusIdx = headers.indexOf("狀態");

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIdx] === orderId) {
        sheet.getRange(i + 1, statusIdx + 1).setValue(status);
        count++;
      }
    }
  });
  return count;
}

function generateUniqueId() {
  return "ORD-" + Math.random().toString(36).substring(2, 7).toUpperCase();
}

function checkoutTable(tableName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const tableSheet = ss.getSheetByName(tableName);
  if (!tableSheet) {
    return { result: "error", message: "桌號不存在" };
  }

  ensureHeaders(tableSheet);
  const data = tableSheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { result: "error", message: "該桌沒有訂單" };
  }

  const headers = data[0];
  const idIdx = headers.indexOf("訂單ID");
  const timeIdx = headers.indexOf("下單時間");
  const itemsIdx = headers.indexOf("明細");
  const totalIdx = headers.indexOf("總金額");
  const statusIdx = headers.indexOf("狀態");

  let completedOrders = [];
  let totalAmount = 0;
  let allItems = [];

  for (let i = 1; i < data.length; i++) {
    if (data[i][statusIdx] === "已出餐") {
      completedOrders.push(data[i]);
      totalAmount += parseFloat(data[i][totalIdx]) || 0;
      allItems.push(data[i][itemsIdx]);
    }
  }

  if (completedOrders.length === 0) {
    return { result: "error", message: "該桌沒有已完成的訂單" };
  }

  // 生成新訂單
  const orderId = generateUniqueId();
  const now = new Date();
  const combinedItems = allItems.join("; ");
  const logSheet = getOrCreateSheet(ss, CONFIG.SHEET_NAME);
  logSheet.appendRow([orderId, now, combinedItems, totalAmount, "已結帳"]);

  // 清空桌號分頁（保留 header）
  tableSheet.clearContents();
  ensureHeaders(tableSheet);

  return { result: "success", orderId: orderId, total: totalAmount };
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}