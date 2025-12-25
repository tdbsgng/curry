// --- 菜單相關功能 ---

/**
 * 通用渲染菜單函數
 * @param {string} containerId - 容器 ID
 * @param {Object} cartObj - 購物車對象
 * @param {string} updateQtyFunc - 更新數量函數名稱
 * @param {Function} updateCartBarFunc - 更新購物車欄函數
 */
function renderMenuGeneric(containerId, cartObj, updateQtyFunc, updateCartBarFunc) {
    const menuContainer = document.getElementById(containerId);
    if (!menuContainer) {
        console.error(`找不到容器: ${containerId}`);
        return;
    }
    
    menuContainer.innerHTML = menuDataCache.map(item => {
        const qty = cartObj[item.name]?.qty || 0;
        let img = item.img?.includes("drive.google.com") ? "https://drive.google.com/thumbnail?id=" + item.img.match(/[-\w]{25,}/)[0] + "&sz=w400" : (item.img || "");
        return `<div class="menu-card">
            <img src="${img}" class="item-img" onclick="showImageModal('${img}')">
            <div class="item-details"><strong>${item.name}</strong><br><span style="color:var(--primary-color)">$${item.price}</span></div>
            <div class="qty-controls">
                ${qty > 0 ? `<button class="qty-btn btn-minus" onclick="${updateQtyFunc}('${item.name}', -1)">-</button><span class="qty-num">${qty}</span>` : ''}
                <button class="qty-btn btn-plus" onclick="${updateQtyFunc}('${item.name}', 1)">+</button>
            </div>
        </div>`;
    }).join('');
    if (updateCartBarFunc) {
        updateCartBarFunc();
    }
}

/**
 * 模組化菜單組件 - 初始化並渲染菜單頁面
 * @param {Object} options - 配置選項
 * @param {string} options.containerId - 容器 ID（必填）
 * @param {Object} options.cartObj - 購物車對象（必填）
 * @param {string} options.updateQtyFunc - 更新數量函數名稱（必填）
 * @param {Function} options.updateCartBarFunc - 更新購物車欄函數（可選）
 * @param {Function} options.onError - 錯誤處理回調（可選）
 * @returns {Promise<void>}
 */
async function initMenuPage(options) {
    const {
        containerId,
        cartObj,
        updateQtyFunc,
        updateCartBarFunc,
        onError
    } = options;
    
    // 驗證必填參數
    if (!containerId || !cartObj || !updateQtyFunc) {
        const error = 'initMenuPage: 缺少必填參數 (containerId, cartObj, updateQtyFunc)';
        console.error(error);
        if (onError) onError(error);
        return;
    }
    
    const menuContainer = document.getElementById(containerId);
    if (!menuContainer) {
        const error = `找不到容器: ${containerId}`;
        console.error(error);
        if (onError) onError(error);
        return;
    }
    
    // 顯示載入中
    menuContainer.innerHTML = '<div style="text-align: center; padding: 20px; color: #666;">正在載入菜單...</div>';
    
    try {
        // 確保菜單資料已載入
        if (menuDataCache.length === 0) {
            const res = await fetchMenu();
            if (res.status === "success") {
                menuDataCache = res.data;
            } else {
                throw new Error('無法載入菜單資料');
            }
        }
        
        // 渲染菜單
        renderMenuGeneric(containerId, cartObj, updateQtyFunc, updateCartBarFunc);
    } catch (error) {
        const errorMsg = `無法載入菜單：${error.message}`;
        menuContainer.innerHTML = `<div style="text-align:center; padding:20px; color:#dc3545;">${errorMsg}</div>`;
        if (onError) onError(error);
    }
}

/**
 * 渲染菜單（用戶點餐模式）
 */
function renderMenu() {
    renderMenuGeneric('menu-container', cart, 'updateQty', updateCartBar);
}

/**
 * 載入菜單資料（用戶點餐模式）
 */
async function loadMenu() {
    await initMenuPage({
        containerId: 'menu-container',
        cartObj: cart,
        updateQtyFunc: 'updateQty',
        updateCartBarFunc: updateCartBar,
        onError: (error) => {
            console.error('載入菜單失敗:', error);
        }
    });
}

