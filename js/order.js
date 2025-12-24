// --- 訂單相關功能 ---

/**
 * 顯示訂單歷史
 */
async function showHistory() {
    document.getElementById('history-list').innerHTML = "正在載入訂單...";
    document.getElementById('history-modal').style.display = 'block';
    
    try {
        const res = await fetchTableOrders(tableParam, false);
        const orders = res.data || [];
        const historyList = orders.reverse().map(o => `
            <div class="order-card status-${getStatusClass(o["狀態"])}">
                <div class="order-header">
                    <span>訂單 ${o["訂單ID"]}</span>
                    <span class="order-status">${o["狀態"]}</span>
                </div>
                <div class="order-details">
                    <div><strong>時間:</strong> ${new Date(o["下單時間"]).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                    <div><strong>明細:</strong> ${o["明細"]}</div>
                    <div><strong>金額:</strong> $${o["總金額"]}</div>
                </div>
            </div>
        `).join('') || "尚無紀錄";
        document.getElementById('history-list').innerHTML = historyList;
    } catch (error) {
        document.getElementById('history-list').innerHTML = "無法載入訂單";
    }
}

/**
 * 獲取狀態樣式類別
 * @param {string} status - 訂單狀態
 * @returns {string} CSS 類別名稱
 */
function getStatusClass(status) {
    if (status === '已出餐') return 'completed';
    if (status === '已取消') return 'cancelled';
    return 'pending';
}

