// --- API 呼叫相關功能 ---

/**
 * 呼叫 API
 * @param {string} method - HTTP 方法 ('GET' 或 'POST')
 * @param {Object} params - 請求參數
 * @returns {Promise} API 回應
 */
async function callAPI(method, params = {}) {
    const options = {
        method: method
    };

    if (method === 'GET') {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${API_URL}?${queryString}` : API_URL;
        return fetch(url).then(res => res.json());
    } else {
        options.body = JSON.stringify(params);
        return fetch(API_URL, options).then(res => res.json());
    }
}

/**
 * 獲取菜單資料
 * @returns {Promise} 菜單資料
 */
async function fetchMenu() {
    return callAPI('GET', { type: 'menu' });
}

/**
 * 獲取桌號訂單
 * @param {string} tableName - 桌號
 * @param {boolean} requireAuth - 是否需要驗證
 * @returns {Promise} 訂單資料
 */
async function fetchTableOrders(tableName, requireAuth = false) {
    const params = { type: 'table', name: tableName };
    if (requireAuth && currentUser && currentPassword) {
        params.user = currentUser;
        params.password = currentPassword;
    }
    return callAPI('GET', params);
}

/**
 * 送出訂單
 * @param {string} items - 訂單項目字串
 * @param {string} total - 總金額
 * @returns {Promise} API 回應
 */
async function submitOrder(items, total) {
    return callAPI('POST', {
        action: "addOrder",
        table: tableParam,
        items: items,
        total: total
    });
}

/**
 * 登入
 * @param {string} user - 帳號
 * @param {string} password - 密碼
 * @returns {Promise} API 回應
 */
async function loginAPI(user, password) {
    return callAPI('POST', {
        action: "login",
        user: user,
        password: password
    });
}

/**
 * 更新訂單狀態
 * @param {string} orderId - 訂單ID
 * @param {string} status - 新狀態
 * @returns {Promise} API 回應
 */
async function updateOrderStatus(orderId, status) {
    return callAPI('POST', {
        action: "updateStatus",
        orderId: orderId,
        status: status,
        user: currentUser,
        password: currentPassword
    });
}

/**
 * 結帳
 * @param {string} table - 桌號
 * @returns {Promise} API 回應
 */
async function checkoutAPI(table) {
    return callAPI('POST', {
        action: "checkout",
        table: table,
        user: currentUser,
        password: currentPassword
    });
}

