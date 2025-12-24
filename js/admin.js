// --- 管理功能 ---

/**
 * 渲染訂單管理頁面
 */
async function renderOrders() {
    const content = document.getElementById('content');
    
    // 始終顯示選擇桌子的界面
    content.innerHTML = `
        <div id="table-selection">
            <div class="table-block">
                <div class="table-block-content" onclick="selectTable('out')">外帶自取</div>
                <button class="table-add-btn" onclick="event.stopPropagation(); showMenuModalForTable('out')" title="新增餐點">+</button>
            </div>
            <div class="table-block">
                <div class="table-block-content" onclick="selectTable('1')">1 桌</div>
                <button class="table-add-btn" onclick="event.stopPropagation(); showMenuModalForTable('1')" title="新增餐點">+</button>
            </div>
            <div class="table-block">
                <div class="table-block-content" onclick="selectTable('2')">2 桌</div>
                <button class="table-add-btn" onclick="event.stopPropagation(); showMenuModalForTable('2')" title="新增餐點">+</button>
            </div>
            <div class="table-block">
                <div class="table-block-content" onclick="selectTable('3')">3 桌</div>
                <button class="table-add-btn" onclick="event.stopPropagation(); showMenuModalForTable('3')" title="新增餐點">+</button>
            </div>
            <div class="table-block">
                <div class="table-block-content" onclick="selectTable('4')">4 桌</div>
                <button class="table-add-btn" onclick="event.stopPropagation(); showMenuModalForTable('4')" title="新增餐點">+</button>
            </div>
            <div class="table-block">
                <div class="table-block-content" onclick="selectTable('5')">5 桌</div>
                <button class="table-add-btn" onclick="event.stopPropagation(); showMenuModalForTable('5')" title="新增餐點">+</button>
            </div>
        </div>
    `;
}

/**
 * 當前查看的桌號（用於模態框）
 */
let currentViewingTable = null;

/**
 * 選擇桌號 - 顯示訂單模態框
 * @param {string} table - 桌號
 */
async function selectTable(table) {
    currentViewingTable = table;
    await showOrdersModalForTable(table);
}

/**
 * 顯示指定桌號的訂單模態框
 * @param {string} table - 桌號
 */
async function showOrdersModalForTable(table) {
    const displayLabel = table === 'out' ? "外帶自取" : table + " 桌";
    document.getElementById('orders-modal-title').innerText = `訂單管理 - ${displayLabel}`;
    
    const ordersContainer = document.getElementById('orders-modal-container');
    ordersContainer.innerHTML = '<div style="text-align: center; padding: 20px;">正在載入訂單...</div>';
    
    const modal = document.getElementById('orders-modal');
    modal.style.display = 'block';
    
    try {
        const res = await fetchTableOrders(table, true);
        const orders = res.data || [];
        let totalCompleted = 0;
        orders.forEach(o => {
            if (o["狀態"] === "已出餐") {
                totalCompleted += parseFloat(o["總金額"]) || 0;
            }
        });
        
        if (orders.length === 0) {
            ordersContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">目前沒有訂單</div>';
        } else {
            ordersContainer.innerHTML = orders.reverse().map(o => `
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
                    <div class="order-actions">
                        <button onclick="updateStatus('${o["訂單ID"]}', '已出餐', '${table}')">完成</button>
                        <button onclick="updateStatus('${o["訂單ID"]}', '已取消', '${table}')">取消</button>
                    </div>
                </div>
            `).join('');
        }
        
        // 更新結帳按鈕的總金額
        document.getElementById('orders-modal-checkout-total').innerText = totalCompleted;
        
        // 根據總金額禁用/啟用結帳按鈕
        const checkoutBtn = document.getElementById('orders-modal-checkout-btn');
        if (checkoutBtn) {
            if (totalCompleted === 0) {
                checkoutBtn.disabled = true;
                checkoutBtn.style.opacity = '0.5';
                checkoutBtn.style.cursor = 'not-allowed';
            } else {
                checkoutBtn.disabled = false;
                checkoutBtn.style.opacity = '1';
                checkoutBtn.style.cursor = 'pointer';
            }
        }
        
    } catch (error) {
        ordersContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #dc3545;">載入訂單失敗</div>';
    }
    
    // 添加點擊背景關閉功能
    const closeModal = (e) => {
        if (e.target === modal) {
            hideModal('orders-modal');
            modal.removeEventListener('click', closeModal);
        }
    };
    modal.addEventListener('click', closeModal);
}

/**
 * 更新訂單狀態
 * @param {string} id - 訂單ID
 * @param {string} newStatus - 新狀態
 * @param {string} table - 桌號
 */
async function updateStatus(id, newStatus, table) {
    if(!(await customConfirm(`確定要將訂單 ${id} 改為 ${newStatus} 嗎？`))) return;

    try {
        await updateOrderStatus(id, newStatus);
        await customAlert("狀態更新成功");
        // 重新載入該桌的訂單模態框
        if (table) {
            await showOrdersModalForTable(table);
        }
    } catch (error) {
        await customAlert("狀態更新失敗：" + error.message);
    }
}

/**
 * 顯示結帳模態框（從訂單模態框調用）
 * 現在直接調用結帳確認，不再顯示中間的結帳模態框
 */
async function showCheckoutModalFromOrders() {
    if (!currentViewingTable) return;
    
    // 檢查是否有已完成訂單
    try {
        const res = await fetchTableOrders(currentViewingTable, true);
        const orders = res.data || [];
        let totalCompleted = 0;
        orders.forEach(o => {
            if (o["狀態"] === "已出餐") {
                totalCompleted += parseFloat(o["總金額"]) || 0;
            }
        });
        
        if (totalCompleted === 0) {
            await customAlert("沒有已完成訂單，無法結帳");
            return;
        }
    } catch (error) {
        await customAlert("無法載入訂單數據");
        return;
    }
    
    // 直接調用結帳函數，它會顯示確認視窗
    await checkoutTable();
}

/**
 * 結帳
 */
async function checkoutTable() {
    if (!currentViewingTable) return;
    
    try {
        // 先獲取訂單數據，檢查是否有未完成的訂單
        const res = await fetchTableOrders(currentViewingTable, true);
        const orders = res.data || [];
        let totalCompleted = 0;
        let hasPendingOrders = false;
        
        orders.forEach(o => {
            if (o["狀態"] === "已出餐") {
                totalCompleted += parseFloat(o["總金額"]) || 0;
            } else if (o["狀態"] !== "已取消") {
                // 狀態不是"已出餐"也不是"已取消"，就是未完成的訂單
                hasPendingOrders = true;
            }
        });
        
        const displayLabel = currentViewingTable === 'out' ? "外帶自取" : currentViewingTable + " 桌";
        let confirmMessage = `確定要為 ${displayLabel} 結帳嗎？這將合併所有已完成訂單並清空桌號。`;
        
        // 如果有未完成的訂單，添加紅字警告
        if (hasPendingOrders) {
            confirmMessage = `確定要為 ${displayLabel} 結帳嗎？這將合併所有已完成訂單並清空桌號。<br><span style="color: #dc3545; font-weight: bold;">⚠️ 注意：有尚未完成或取消的訂單！</span>`;
        }
        
        if (!(await customConfirm(confirmMessage, true))) return;

        const checkoutRes = await checkoutAPI(currentViewingTable);
        if (checkoutRes.result === "success") {
            await customAlert(`結帳成功！總金額 $${checkoutRes.total}，訂單ID：${checkoutRes.orderId}`);
            hideModal('orders-modal');
            // 重新載入訂單列表
            if (currentViewingTable) {
                await showOrdersModalForTable(currentViewingTable);
            }
            currentViewingTable = null;
        } else {
            await customAlert("結帳失敗：" + checkoutRes.message);
        }
    } catch (e) {
        await customAlert("結帳失敗：" + e.message);
    }
}

/**
 * 顯示指定桌號的菜單模態框
 * @param {string} table - 桌號
 */
let currentTableForMenu = null;
let modalCart = {};

async function showMenuModalForTable(table) {
    currentTableForMenu = table;
    modalCart = {}; // 重置模態框購物車
    
    // 確保菜單資料已載入
    if (menuDataCache.length === 0) {
        try {
            const res = await fetchMenu();
            if (res.status === "success") {
                menuDataCache = res.data;
            }
        } catch (error) {
            await customAlert("無法載入菜單");
            return;
        }
    }
    
    // 顯示模態框
    const modal = document.getElementById('menu-modal');
    modal.style.display = 'block';
    
    // 更新標題
    const displayLabel = table === 'out' ? "外帶自取" : table + " 桌";
    document.getElementById('menu-modal-title').innerText = `新增餐點 - ${displayLabel}`;
    
    // 渲染菜單
    renderMenuInModal();
    
    // 添加點擊背景關閉功能
    const closeModal = (e) => {
        if (e.target === modal) {
            hideModal('menu-modal');
            modal.removeEventListener('click', closeModal);
        }
    };
    modal.addEventListener('click', closeModal);
}

/**
 * 在模態框中渲染菜單
 */
function renderMenuInModal() {
    const menuContainer = document.getElementById('menu-modal-container');
    menuContainer.innerHTML = menuDataCache.map(item => {
        const qty = modalCart[item.name]?.qty || 0;
        let img = item.img?.includes("drive.google.com") ? "https://drive.google.com/thumbnail?id=" + item.img.match(/[-\w]{25,}/)[0] + "&sz=w200" : (item.img || "");
        return `<div class="menu-card-small">
            <img src="${img}" class="item-img-small" onclick="showImageModal('${img}')">
            <div class="item-details-small">
                <strong>${item.name}</strong><br>
                <span style="color:var(--primary-color)">$${item.price}</span>
            </div>
            <div class="qty-controls">
                ${qty > 0 ? `<button class="qty-btn btn-minus" onclick="updateModalQty('${item.name}', -1)">-</button><span class="qty-num">${qty}</span>` : ''}
                <button class="qty-btn btn-plus" onclick="updateModalQty('${item.name}', 1)">+</button>
            </div>
        </div>`;
    }).join('');
    updateModalCartBar();
}

/**
 * 更新模態框中的數量
 * @param {string} name - 商品名稱
 * @param {number} change - 數量變化
 */
function updateModalQty(name, change) {
    if (!modalCart[name]) {
        const item = menuDataCache.find(i => i.name === name);
        modalCart[name] = { price: item.price, qty: 0 };
    }
    modalCart[name].qty += change;
    if (modalCart[name].qty <= 0) delete modalCart[name];
    renderMenuInModal();
}

/**
 * 更新模態框購物車欄
 */
function updateModalCartBar() {
    let count = 0, total = 0;
    for (let n in modalCart) { 
        count += modalCart[n].qty; 
        total += modalCart[n].price * modalCart[n].qty; 
    }
    document.getElementById('menu-modal-cart-count').innerText = count;
    document.getElementById('menu-modal-cart-total').innerText = total;
}

/**
 * 從模態框送出訂單
 */
async function sendOrderFromModal() {
    if (Object.keys(modalCart).length === 0) {
        await customAlert("請先選擇餐點");
        return;
    }
    
    const items = Object.keys(modalCart).map(n => `${n}x${modalCart[n].qty}`).join(", ");
    const total = Object.keys(modalCart).reduce((sum, n) => sum + modalCart[n].price * modalCart[n].qty, 0);
    
    const btn = document.getElementById('menu-modal-submit-btn');
    btn.disabled = true; 
    btn.innerText = "傳送中...";

    try {
        const res = await submitOrderForTable(currentTableForMenu, items, total);
        
        if (res.result === "success") {
            await customAlert('訂單已送出！單號：' + res.orderId);
            modalCart = {};
            hideModal('menu-modal');
            // 如果當前正在查看該桌的訂單模態框，重新載入
            if (currentViewingTable === currentTableForMenu) {
                await showOrdersModalForTable(currentTableForMenu);
            }
        } else {
            throw new Error(res.message);
        }
    } catch (e) { 
        await customAlert("送單失敗: " + e.message); 
    } finally {
        btn.disabled = false; 
        btn.innerText = "確認送出";
    }
}

/**
 * 為指定桌號送出訂單
 * @param {string} table - 桌號
 * @param {string} items - 訂單項目字串
 * @param {number} total - 總金額
 * @returns {Promise} API 回應
 */
async function submitOrderForTable(table, items, total) {
    return callAPI('POST', {
        action: "addOrder",
        table: table,
        items: items,
        total: total
    });
}

