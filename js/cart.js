// --- 購物車相關功能 ---

/**
 * 更新數量
 * @param {string} name - 商品名稱
 * @param {number} change - 數量變化
 */
function updateQty(name, change) {
    if (!cart[name]) {
        const item = menuDataCache.find(i => i.name === name);
        cart[name] = { price: item.price, qty: 0 };
    }
    cart[name].qty += change;
    if (cart[name].qty <= 0) delete cart[name];
    
    // 只更新數量顯示，不重新渲染整個列表
    updateQtyDisplay(name);
    updateCartBar();
    if(document.getElementById('cart-modal').style.display === 'block') showCart();
}

/**
 * 更新單個商品的數量顯示（不重新渲染整個列表）
 * @param {string} name - 商品名稱
 */
function updateQtyDisplay(name) {
    const qty = cart[name]?.qty || 0;
    const menuContainer = document.getElementById('menu-container');
    const itemCards = menuContainer.querySelectorAll('.menu-card');
    
    itemCards.forEach(card => {
        const itemNameEl = card.querySelector('.item-details strong');
        if (itemNameEl && itemNameEl.textContent === name) {
            const qtyControls = card.querySelector('.qty-controls');
            if (qty > 0) {
                // 如果數量 > 0，顯示減號按鈕和數量
                if (!qtyControls.querySelector('.btn-minus')) {
                    qtyControls.innerHTML = `
                        <button class="qty-btn btn-minus" onclick="updateQty('${name}', -1)">-</button>
                        <span class="qty-num">${qty}</span>
                        <button class="qty-btn btn-plus" onclick="updateQty('${name}', 1)">+</button>
                    `;
                } else {
                    // 只更新數量數字
                    const qtyNum = qtyControls.querySelector('.qty-num');
                    if (qtyNum) {
                        qtyNum.textContent = qty;
                    }
                }
            } else {
                // 如果數量 = 0，只顯示加號按鈕
                qtyControls.innerHTML = `
                    <button class="qty-btn btn-plus" onclick="updateQty('${name}', 1)">+</button>
                `;
            }
        }
    });
}

/**
 * 更新購物車欄
 */
function updateCartBar() {
    let count = 0, total = 0;
    for (let n in cart) { 
        count += cart[n].qty; 
        total += cart[n].price * cart[n].qty; 
    }
    document.getElementById('cart-count').innerText = count;
    document.getElementById('cart-total').innerText = total;
}

/**
 * 顯示購物車
 */
function showCart() {
    let listHtml = "", total = 0;
    for (let n in cart) {
        total += cart[n].price * cart[n].qty;
        listHtml += `<div class="cart-item-row"><span>${n} x ${cart[n].qty}</span><span>$${cart[n].price * cart[n].qty}</span></div>`;
    }
    document.getElementById('cart-items-list').innerHTML = listHtml || "購物車空空如也";
    document.getElementById('modal-total').innerText = total;
    document.getElementById('cart-modal').style.display = 'block';
}

/**
 * 送出訂單
 */
async function sendOrder() {
    const items = Object.keys(cart).map(n => `${n}x${cart[n].qty}`).join(", ");
    if (!items) return;
    
    const btn = document.getElementById('submit-btn');
    btn.disabled = true; 
    btn.innerText = "傳送中...";

    try {
        const total = document.getElementById('modal-total').innerText;
        const res = await submitOrder(items, total);
        
        if (res.result === "success") {
            await customAlert('訂單已送出！單號：' + res.orderId);
            orderHistory.push({ 
                time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), 
                details: items 
            });
            cart = {}; 
            renderMenu(); 
            hideModal('cart-modal');
        } else {
            throw new Error(res.message);
        }
    } catch (e) { 
        await customAlert("送單失敗: " + e.message); 
    } finally {
        btn.disabled = false; 
        btn.innerText = "確認送出點餐";
    }
}

