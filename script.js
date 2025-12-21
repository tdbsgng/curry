// --- 設定區 ---
const API_URL = "https://script.google.com/macros/s/AKfycbwL21_dUA6HbsAOkqBDdRuvXUCZgTdxNw8R0s9DrQXIIcVSq4yd-ttInuY6mZGMsP1r/exec";

let cart = {};
let menuDataCache = [];
let orderHistory = [];

// 取得網址參數
const urlParams = new URLSearchParams(window.location.search);
const tableParam = urlParams.get('table');
const manageParam = urlParams.get('manage');

// 等待 DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', function() {
    // 檢查是否為管理模式
    if (manageParam === '1') {
        renderManagementPage();
    } else {
        // 正常點餐模式
        // 顯示桌號或外帶
        if (tableParam === 'out') {
            document.getElementById('displayTable').innerText = "外帶自取";
        } else {
            document.getElementById('displayTable').innerText = "桌號：" + (tableParam || "未選取");
        }

        // 初始化：向後端抓取菜單
        fetch(API_URL).then(res => res.json()).then(data => {
            menuDataCache = data;
            renderMenu();
        }).catch(() => { document.getElementById('loading').innerText = "無法載入菜單，請檢查後端設定"; });
    }
});

function renderMenu() {
    const container = document.getElementById('menu-container');
    document.getElementById('loading').style.display = 'none';
    container.innerHTML = menuDataCache.map(item => {
        const qty = cart[item.name]?.qty || 0;
        let img = item.img?.includes("drive.google.com") ? "https://drive.google.com/thumbnail?id=" + item.img.match(/[-\w]{25,}/)[0] + "&sz=w400" : (item.img || "");
        return `<div class="menu-card">
            <img src="${img}" class="item-img">
            <div class="item-details"><strong>${item.name}</strong><br><span style="color:var(--primary-color)">$${item.price}</span></div>
            <div class="qty-controls">
                ${qty > 0 ? `<button class="qty-btn btn-minus" onclick="updateQty('${item.name}', -1)">-</button><span class="qty-num">${qty}</span>` : ''}
                <button class="qty-btn btn-plus" onclick="updateQty('${item.name}', 1)">+</button>
            </div>
        </div>`;
    }).join('');
    updateCartBar();
}

function updateQty(name, change) {
    if (!cart[name]) cart[name] = { price: menuDataCache.find(i => i.name === name).price, qty: 0 };
    cart[name].qty += change;
    if (cart[name].qty <= 0) delete cart[name];
    renderMenu();
    if(document.getElementById('cart-modal').style.display === 'block') showCart();
}

function updateCartBar() {
    let count = 0, total = 0;
    for (let n in cart) { count += cart[n].qty; total += cart[n].price * cart[n].qty; }
    document.getElementById('cart-count').innerText = count;
    document.getElementById('cart-total').innerText = total;
}

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

function sendOrder() {
    const items = Object.keys(cart).map(n => `${n}x${cart[n].qty}`).join(", ");
    if (!items) return;
    const btn = document.getElementById('submit-btn');
    btn.disabled = true; btn.innerText = "傳送中...";

    fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
            table: document.getElementById('displayTable').innerText,
            items: items,
            total: document.getElementById('modal-total').innerText
        })
    }).then(() => {
        alert('訂單已送出！');
        orderHistory.push({ time: new Date().toLocaleTimeString(), details: items });
        cart = {}; renderMenu(); hideModal('cart-modal');
        btn.disabled = false; btn.innerText = "確認送出點餐";
    }).catch(e => { alert("送單失敗"); btn.disabled = false; });
}

function showHistory() {
    document.getElementById('history-list').innerHTML = orderHistory.map(h => `<div><small>${h.time}</small><br>${h.details}</div><hr>`).join('') || "尚無紀錄";
    document.getElementById('history-modal').style.display = 'block';
}

function hideModal(id) { document.getElementById(id).style.display = 'none'; }

// --- 管理模式函數 ---
function renderManagementPage() {
    // 隱藏點餐相關元素
    const menuContainer = document.getElementById('menu-container');
    const cartBar = document.getElementById('cart-bar');
    const loading = document.getElementById('loading');
    const headerTitle = document.getElementById('header-title');
    const historyBtn = document.querySelector('.history-btn');

    if (menuContainer) menuContainer.style.display = 'none';
    if (cartBar) cartBar.style.display = 'none';
    if (loading) loading.style.display = 'none';

    // 修改標題
    if (headerTitle) headerTitle.innerHTML = "訂單管理";
    if (historyBtn) historyBtn.style.display = 'none';

    // 顯示管理介面（暫時顯示 To be implemented）
    if (menuContainer) {
        menuContainer.style.display = 'block';
        menuContainer.innerHTML = "<h2>To be implemented</h2><p>訂單管理頁面開發中...</p>";
    }

    // 調用後端函數（目前不做任何事）
    fetchOrders();
}

function fetchOrders() {
    // 定義 call 後端的函數：獲取目前接受到的訂單
    // 假設後端 API：GET ${API_URL}?action=getOrders
    // 返回格式：[{id, table, time, items, total, status}, ...]
    console.log("Fetching orders from backend...");

    // 實際實現時：
    // fetch(API_URL + '?action=getOrders')
    //     .then(res => res.json())
    //     .then(orders => {
    //         renderOrderList(orders);
    //     })
    //     .catch(error => {
    //         console.error('Failed to fetch orders:', error);
    //     });
}