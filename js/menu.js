// --- 菜單相關功能 ---

/**
 * 渲染菜單
 */
function renderMenu() {
    const menuContainer = document.getElementById('menu-container');
    menuContainer.innerHTML = menuDataCache.map(item => {
        const qty = cart[item.name]?.qty || 0;
        let img = item.img?.includes("drive.google.com") ? "https://drive.google.com/thumbnail?id=" + item.img.match(/[-\w]{25,}/)[0] + "&sz=w400" : (item.img || "");
        return `<div class="menu-card">
            <img src="${img}" class="item-img" onclick="showImageModal('${img}')">
            <div class="item-details"><strong>${item.name}</strong><br><span style="color:var(--primary-color)">$${item.price}</span></div>
            <div class="qty-controls">
                ${qty > 0 ? `<button class="qty-btn btn-minus" onclick="updateQty('${item.name}', -1)">-</button><span class="qty-num">${qty}</span>` : ''}
                <button class="qty-btn btn-plus" onclick="updateQty('${item.name}', 1)">+</button>
            </div>
        </div>`;
    }).join('');
    updateCartBar();
}

/**
 * 載入菜單資料
 */
async function loadMenu() {
    try {
        const res = await fetchMenu();
        if (res.status === "success") {
            menuDataCache = res.data;
            renderMenu();
        }
    } catch (error) {
        document.getElementById('menu-container').innerHTML = '<div style="text-align:center; color:white;">無法載入菜單，請檢查後端設定</div>';
    }
}

