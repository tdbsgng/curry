// --- UI 渲染和模態框相關功能 ---

/**
 * 隱藏模態框
 * @param {string} id - 模態框ID
 */
function hideModal(id) { 
    document.getElementById(id).style.display = 'none'; 
}

/**
 * 自訂確認視窗（取代瀏覽器 confirm）
 * @param {string} message - 確認訊息
 * @param {boolean} allowHtml - 是否允許 HTML 內容（預設 false）
 * @returns {Promise<boolean>} 使用者選擇結果
 */
function customConfirm(message, allowHtml = false) {
    return new Promise((resolve) => {
        // 創建確認視窗 HTML
        const confirmId = 'custom-confirm-modal';
        let confirmModal = document.getElementById(confirmId);
        
        if (!confirmModal) {
            confirmModal = document.createElement('div');
            confirmModal.id = confirmId;
            confirmModal.className = 'modal';
            confirmModal.innerHTML = `
                <div class="modal-content">
                    <button class="close-btn" id="custom-confirm-close">&times;</button>
                    <h3 style="margin-top:0;">確認</h3>
                    <p id="custom-confirm-message" style="margin: 20px 0;"></p>
                    <div style="display: flex; gap: 10px;">
                        <button id="custom-confirm-ok" style="background:#28a745; color:white; padding:10px 20px; border:none; border-radius:5px; flex:1; cursor:pointer;">確定</button>
                        <button id="custom-confirm-cancel" style="background:#6c757d; color:white; padding:10px 20px; border:none; border-radius:5px; flex:1; cursor:pointer;">取消</button>
                    </div>
                </div>
            `;
            document.body.appendChild(confirmModal);
        }
        
        // 設置訊息（支援 HTML 或純文字）
        const messageEl = document.getElementById('custom-confirm-message');
        if (allowHtml) {
            messageEl.innerHTML = message;
        } else {
            messageEl.innerText = message;
        }
        
        // 設置按鈕事件
        const okBtn = document.getElementById('custom-confirm-ok');
        const cancelBtn = document.getElementById('custom-confirm-cancel');
        const closeBtn = document.getElementById('custom-confirm-close');
        
        const cleanup = () => {
            okBtn.removeEventListener('click', handleOk);
            cancelBtn.removeEventListener('click', handleCancel);
            closeBtn.removeEventListener('click', handleCancel);
            confirmModal.removeEventListener('click', handleBackgroundClick);
        };
        
        const handleOk = () => {
            hideModal(confirmId);
            cleanup();
            resolve(true);
        };
        
        const handleCancel = () => {
            hideModal(confirmId);
            cleanup();
            resolve(false);
        };
        
        const handleBackgroundClick = (e) => {
            if (e.target === confirmModal) {
                hideModal(confirmId);
                cleanup();
                resolve(false);
            }
        };
        
        okBtn.onclick = handleOk;
        cancelBtn.onclick = handleCancel;
        closeBtn.onclick = handleCancel;
        confirmModal.onclick = handleBackgroundClick;
        
        // 顯示視窗
        confirmModal.style.display = 'block';
        confirmModal.style.zIndex = '300';
    });
}

/**
 * 自訂提示視窗（取代瀏覽器 alert）
 * @param {string} message - 提示訊息
 * @returns {Promise<void>}
 */
function customAlert(message) {
    return new Promise((resolve) => {
        // 創建提示視窗 HTML
        const alertId = 'custom-alert-modal';
        let alertModal = document.getElementById(alertId);
        
        if (!alertModal) {
            alertModal = document.createElement('div');
            alertModal.id = alertId;
            alertModal.className = 'modal';
            alertModal.innerHTML = `
                <div class="modal-content">
                    <button class="close-btn" id="custom-alert-close">&times;</button>
                    <h3 style="margin-top:0;">提示</h3>
                    <p id="custom-alert-message" style="margin: 20px 0;"></p>
                    <button id="custom-alert-ok" style="background:#28a745; color:white; padding:10px 20px; border:none; border-radius:5px; width:100%; cursor:pointer;">確定</button>
                </div>
            `;
            document.body.appendChild(alertModal);
        }
        
        // 設置訊息
        document.getElementById('custom-alert-message').innerText = message;
        
        // 設置按鈕事件
        const okBtn = document.getElementById('custom-alert-ok');
        const closeBtn = document.getElementById('custom-alert-close');
        
        const cleanup = () => {
            okBtn.removeEventListener('click', handleOk);
            closeBtn.removeEventListener('click', handleOk);
            alertModal.removeEventListener('click', handleBackgroundClick);
        };
        
        const handleOk = () => {
            hideModal(alertId);
            cleanup();
            resolve();
        };
        
        const handleBackgroundClick = (e) => {
            if (e.target === alertModal) {
                hideModal(alertId);
                cleanup();
                resolve();
            }
        };
        
        okBtn.onclick = handleOk;
        closeBtn.onclick = handleOk;
        alertModal.onclick = handleBackgroundClick;
        
        // 顯示視窗
        alertModal.style.display = 'block';
        alertModal.style.zIndex = '300';
    });
}

/**
 * 顯示圖片模態框
 * @param {string} src - 圖片來源
 */
function showImageModal(src) {
    document.getElementById('modal-image').src = src;
    document.getElementById('image-modal').style.display = 'block';
    
    // 添加點擊背景關閉功能
    const modal = document.getElementById('image-modal');
    const closeModal = (e) => {
        if (e.target === modal) {
            hideModal('image-modal');
            modal.removeEventListener('click', closeModal);
        }
    };
    modal.addEventListener('click', closeModal);
}

/**
 * 渲染主頁面
 */
function render() {
    // 確保登入 modal 存在
    if (!document.getElementById('login-modal')) {
        document.body.insertAdjacentHTML('beforeend', '<div id="login-modal" class="modal"><div class="modal-content"><h3 style="margin-top:0;">管理員登入</h3><input type="text" id="login-user" placeholder="帳號" style="width:100%; padding:10px; margin:10px 0; border-radius:5px; border:1px solid #ccc; box-sizing:border-box;"><input type="password" id="login-password" placeholder="密碼" style="width:100%; padding:10px; margin:10px 0; border-radius:5px; border:1px solid #ccc; box-sizing:border-box;"><button id="login-btn" style="background:var(--primary-color); width:100%; padding:15px; color:white; border:none; border-radius:10px; margin-top:10px; box-sizing:border-box;" onclick="attemptLogin()">登入</button><button style="background:none; width:100%; border:none; color:#888; margin-top:10px; box-sizing:border-box;" onclick="hideModal(\'login-modal\')">取消</button></div></div>');
    }

    const container = document.getElementById('container');
    
    if (manageParam === '1') {
        // 管理模式
        if (!isLoggedIn) {
            showLoginModal();
            return;
        }
        container.innerHTML = `
            <div id="header-area">
                <h2 id="header-title">訂單管理</h2>
                <button id="logout-btn" class="history-btn" onclick="logout()" style="background:#f44336; color:white;">登出</button>
            </div>
            <div id="content">
                <div style="color: white; font-weight: bold; text-align: center;">正在載入訂單...</div>
            </div>
            <div id="checkout-modal" class="modal">
                <div class="modal-content">
                    <button class="close-btn" onclick="hideModal('checkout-modal')">&times;</button>
                    <h3 style="margin-top:0;">結帳</h3>
                    <p>已完成訂單總金額：$<span id="checkout-total-modal">0</span></p>
                    <button onclick="checkoutTable()" style="background:#28a745; color:white; padding:10px 20px; border:none; border-radius:5px; width:100%;">完成結帳</button>
                    <button style="background:none; width:100%; border:none; color:#888; margin-top:10px;" onclick="hideModal('checkout-modal')">取消</button>
                </div>
            </div>
            <div id="menu-modal" class="modal">
                <div class="modal-content menu-modal-content">
                    <button class="close-btn" onclick="hideModal('menu-modal')">&times;</button>
                    <h3 id="menu-modal-title" style="margin-top:0;">新增餐點</h3>
                    <div id="menu-modal-container" style="max-height: 50vh; overflow-y: auto; margin-bottom: 15px;"></div>
                    <div class="menu-modal-cart-bar">
                        <div>已選 <span id="menu-modal-cart-count">0</span> 項，$<span id="menu-modal-cart-total">0</span></div>
                    </div>
                    <button id="menu-modal-submit-btn" onclick="sendOrderFromModal()" style="background:var(--primary-color); width:100%; padding:15px; color:white; border:none; border-radius:10px; margin-top:10px;">確認送出</button>
                    <button style="background:none; width:100%; border:none; color:#888; margin-top:10px;" onclick="hideModal('menu-modal')">取消</button>
                </div>
            </div>
            <div id="orders-modal" class="modal">
                <div class="modal-content orders-modal-content">
                    <button class="close-btn" onclick="hideModal('orders-modal')">&times;</button>
                    <h3 id="orders-modal-title" style="margin-top:0;">訂單管理</h3>
                    <div id="orders-modal-container" style="max-height: 55vh; overflow-y: auto; margin-bottom: 15px;"></div>
                    <div class="orders-modal-footer">
                        <div class="orders-modal-total">
                            <span>已完成訂單總金額：$<span id="orders-modal-checkout-total">0</span></span>
                        </div>
                        <button id="orders-modal-checkout-btn" onclick="showCheckoutModalFromOrders()" style="background:var(--primary-color); color:white; padding:10px 20px; border:none; border-radius:5px; width:100%; margin-top:10px;">結帳</button>
                    </div>
                </div>
            </div>
        `;
        renderOrders();
    } else {
        // 點餐模式
        container.innerHTML = `
            <div id="header-area">
                <h2 id="header-title"><span id="displayTable">載入中</span></h2>
                <button id="history-btn" class="history-btn" onclick="showHistory()"><span class="material-icons" style="font-size:18px;margin-right:4px">history</span>查看訂單</button>
            </div>
            <div id="menu-container">
                <div style="color: white; font-weight: bold; text-align: center;">正在載入菜單...</div>
            </div>
            <div id="cart-bar" class="cart-bar">
                <div>已選 <span id="cart-count">0</span> 項，$<span id="cart-total">0</span></div>
                <button style="background:var(--accent-color); border:none; padding:10px 20px; border-radius:25px; font-weight:bold;" onclick="showCart()">購物車</button>
            </div>
            <div id="cart-modal" class="modal"><div class="modal-content"><h3 style="margin-top:0;">確認訂單</h3><div id="cart-items-list"></div><hr><div style="text-align:right; font-weight:bold;">總計：$<span id="modal-total">0</span></div><button id="submit-btn" style="background:var(--primary-color); width:100%; padding:15px; color:white; border:none; border-radius:10px; margin-top:10px;" onclick="sendOrder()">確認送出點餐</button><button style="background:none; width:100%; border:none; color:#888; margin-top:10px;" onclick="hideModal('cart-modal')">取消</button></div></div>
            <div id="history-modal" class="modal"><div class="modal-content"><h3>已送出訂單</h3><div id="history-list">暫無</div><button style="background:#333; color:white; width:100%; padding:10px; border:none; border-radius:10px; margin-top:15px;" onclick="hideModal('history-modal')">關閉</button></div></div>
            <div id="image-modal" class="modal"><div class="modal-content image-modal-content"><img id="modal-image" src="" alt=""><button class="close-btn" onclick="hideModal('image-modal')">&times;</button></div></div>
        `;
        // 顯示桌號
        const displayLabel = tableParam === 'out' ? "外帶自取" : tableParam + " 桌";
        document.getElementById('displayTable').innerText = displayLabel;

        // 載入菜單
        loadMenu();
    }
}

