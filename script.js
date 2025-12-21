// --- 設定區 ---
const API_URL = "https://script.google.com/macros/s/AKfycbwtLdxy0Q_rSWuSlbuUTq-_lHDUqyykwlunXQGG3IXfrLfCy47_heRMQRwZDY8rJd0/exec";

let cart = {};
let menuDataCache = [];
let orderHistory = [];

let urlParams = new URLSearchParams(window.location.search);
const tableParam = urlParams.get('table') || "unknown";
const manageParam = urlParams.get('manage');

// 登入狀態
let isLoggedIn = false;
let currentUser = null;
let currentPassword = null;

document.addEventListener('DOMContentLoaded', function() {
    // 檢查登入狀態
    checkLoginStatus();
    render();
    // 處理瀏覽器後退/前進
    window.addEventListener('popstate', function() {
        const newUrlParams = new URLSearchParams(window.location.search);
        urlParams = newUrlParams; // 更新全局 urlParams
        render();
    });
});

function checkLoginStatus() {
    const user = localStorage.getItem('managerUser');
    const pass = localStorage.getItem('managerPassword');
    if (user && pass) {
        isLoggedIn = true;
        currentUser = user;
        currentPassword = pass;
    } else {
        isLoggedIn = false;
        currentUser = null;
        currentPassword = null;
    }
}

function showLoginModal() {
    document.getElementById('login-modal').style.display = 'block';
    document.getElementById('login-user').focus();
    // 添加Enter鍵登入
    const userInput = document.getElementById('login-user');
    const passInput = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn');
    const handleEnter = (e) => {
        if (e.key === 'Enter') {
            attemptLogin();
        }
    };
    userInput.addEventListener('keydown', handleEnter);
    passInput.addEventListener('keydown', handleEnter);
    // 清理事件監聽器當modal關閉
    const modal = document.getElementById('login-modal');
    const cleanup = () => {
        userInput.removeEventListener('keydown', handleEnter);
        passInput.removeEventListener('keydown', handleEnter);
        modal.removeEventListener('hidden', cleanup);
    };
    modal.addEventListener('hidden', cleanup); // 假設有hidden事件，或在hideModal中調用
}

function attemptLogin() {
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-password').value.trim();
    if (!user || !pass) {
        alert('請輸入帳號和密碼');
        return;
    }

    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.innerText = '驗證中...';

    fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
            action: "login",
            user: user,
            password: pass
        })
    })
    .then(res => res.json())
    .then(res => {
        if (res.result === "success") {
            // 登入成功，存到localStorage
            localStorage.setItem('managerUser', user);
            localStorage.setItem('managerPassword', pass);
            isLoggedIn = true;
            currentUser = user;
            currentPassword = pass;
            hideModal('login-modal');
            render(); // 重新render管理頁面
        } else {
            alert('登入失敗：' + res.message);
        }
    })
    .catch(e => {
        alert('登入失敗：' + e.message);
    })
    .finally(() => {
        btn.disabled = false;
        btn.innerText = '登入';
    });
}

function logout() {
    if (confirm('確定要登出嗎？')) {
        localStorage.removeItem('managerUser');
        localStorage.removeItem('managerPassword');
        isLoggedIn = false;
        currentUser = null;
        currentPassword = null;
        render();
    }
}

function render() {
    // 確保登入 modal 存在
    if (!document.getElementById('login-modal')) {
        document.body.insertAdjacentHTML('beforeend', '<div id="login-modal" class="modal"><div class="modal-content"><h3 style="margin-top:0;">管理員登入</h3><input type="text" id="login-user" placeholder="帳號" style="width:100%; padding:10px; margin:10px 0; border-radius:5px; border:1px solid #ccc;"><input type="password" id="login-password" placeholder="密碼" style="width:100%; padding:10px; margin:10px 0; border-radius:5px; border:1px solid #ccc;"><button id="login-btn" style="background:var(--primary-color); width:100%; padding:15px; color:white; border:none; border-radius:10px; margin-top:10px;" onclick="attemptLogin()">登入</button><button style="background:none; width:100%; border:none; color:#888; margin-top:10px;" onclick="hideModal(\'login-modal\')">取消</button></div></div>');
    }

    const container = document.getElementById('container');
    if (manageParam === '1') {
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
        `;
        renderOrders();
    } else {
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
        fetch(`${API_URL}?type=menu`)
            .then(res => res.json())
            .then(res => {
                if(res.status === "success") {
                    menuDataCache = res.data;
                    renderMenu();
                }
            })
            .catch(() => { 
                document.getElementById('menu-container').innerHTML = '<div style="text-align:center; color:white;">無法載入菜單，請檢查後端設定</div>';
            });
    }
}

// --- 點餐邏輯 ---
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

function updateQty(name, change) {
    if (!cart[name]) {
        const item = menuDataCache.find(i => i.name === name);
        cart[name] = { price: item.price, qty: 0 };
    }
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

// 2. 修改下單邏輯：加入 action: "addOrder"
function sendOrder() {
    const items = Object.keys(cart).map(n => `${n}x${cart[n].qty}`).join(", ");
    if (!items) return;
    
    const btn = document.getElementById('submit-btn');
    btn.disabled = true; btn.innerText = "傳送中...";

    const payload = {
        action: "addOrder",
        table: tableParam, // 使用純桌號
        items: items,
        total: document.getElementById('modal-total').innerText
    };

    fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(payload)
    })
    .then(res => res.json())
    .then(res => {
        if(res.result === "success") {
            alert('訂單已送出！單號：' + res.orderId);
            orderHistory.push({ time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }), details: items });
            cart = {}; renderMenu(); hideModal('cart-modal');
        } else {
            throw new Error(res.message);
        }
    })
    .catch(e => { alert("送單失敗: " + e.message); })
    .finally(() => {
        btn.disabled = false; btn.innerText = "確認送出點餐";
    });
}

function hideModal(id) { document.getElementById(id).style.display = 'none'; }

function showHistory() {
    document.getElementById('history-list').innerHTML = "正在載入訂單...";
    document.getElementById('history-modal').style.display = 'block';
    
    // 從後端獲取該桌的訂單
    fetch(`${API_URL}?type=table&name=${tableParam}`)
        .then(res => res.json())
        .then(res => {
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
        })
        .catch(() => {
            document.getElementById('history-list').innerHTML = "無法載入訂單";
        });
}

// --- 管理模式 ---

// 3. 實作管理員讀取訂單 (GET ?type=orders)
function renderOrders() {
    const content = document.getElementById('content');
    const tableParam = urlParams.get('table');
    if (!tableParam) {
        // 顯示選擇桌子的界面
        content.innerHTML = `
            <div id="table-selection">
                <div class="table-block" onclick="selectTable('out')">外帶自取</div>
                <div class="table-block" onclick="selectTable('1')">1 桌</div>
                <div class="table-block" onclick="selectTable('2')">2 桌</div>
                <div class="table-block" onclick="selectTable('3')">3 桌</div>
                <div class="table-block" onclick="selectTable('4')">4 桌</div>
                <div class="table-block" onclick="selectTable('5')">5 桌</div>
            </div>
        `;
    } else {
        // 顯示該桌的訂單
        content.innerHTML = `<div style="color: white; font-weight: bold; text-align: center;">正在載入訂單...</div>`;
        fetch(`${API_URL}?type=table&name=${tableParam}&user=${encodeURIComponent(currentUser)}&password=${encodeURIComponent(currentPassword)}`)
            .then(res => res.json())
            .then(res => {
                const orders = res.data || [];
                let totalCompleted = 0;
                orders.forEach(o => {
                    if (o["狀態"] === "已出餐") {
                        totalCompleted += parseFloat(o["總金額"]) || 0;
                    }
                });
                if (orders.length === 0) {
                    content.innerHTML = `
                        <div class="manage-controls">
                            <button onclick="goBackToManage()">返回</button>
                            <button onclick="showCheckoutModal()">結帳</button>
                        </div>
                        <p style="color: white; font-weight: bold; text-align: center;">目前沒有訂單</p>
                    `;
                    return;
                }
                content.innerHTML = `
                    <div class="manage-controls">
                        <button onclick="goBackToManage()">返回</button>
                        <button onclick="showCheckoutModal()">結帳</button>
                    </div>
                    ${orders.reverse().map(o => `
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
                                <button onclick="updateStatus('${o["訂單ID"]}', '已出餐')">完成</button>
                                <button onclick="updateStatus('${o["訂單ID"]}', '已取消')">取消</button>
                            </div>
                        </div>
                    `).join('')}
                `;
            });
    }
}

// 4. 實作更新訂單狀態 (POST action: "updateStatus")
function updateStatus(id, newStatus) {
    if(!confirm(`確定要將訂單 ${id} 改為 ${newStatus} 嗎？`)) return;

    fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
            action: "updateStatus",
            orderId: id,
            status: newStatus,
            user: currentUser,
            password: currentPassword
        })
    })
    .then(res => res.json())
    .then(() => {
        alert("狀態更新成功");
        renderOrders(); // 重新整理列表
    });
}

function selectTable(table) {
    const newUrl = window.location.pathname + '?manage=1&table=' + table;
    window.history.pushState(null, '', newUrl);
    // 更新 urlParams
    urlParams.set('table', table);
    renderOrders();
}

function getStatusClass(status) {
    if (status === '已出餐') return 'completed';
    if (status === '已取消') return 'cancelled';
    return 'pending';
}

function goBackToManage() {
    const newUrl = window.location.pathname + '?manage=1';
    window.history.pushState(null, '', newUrl);
    // 更新 urlParams
    urlParams.delete('table');
    renderOrders();
}


function showCheckoutModal() {
    const tableParam = urlParams.get('table');
    if (!tableParam) return;

    // 重新獲取訂單數據來計算總金額
    fetch(`${API_URL}?type=table&name=${tableParam}&user=${encodeURIComponent(currentUser)}&password=${encodeURIComponent(currentPassword)}`)
        .then(res => res.json())
        .then(res => {
            const orders = res.data || [];
            let totalCompleted = 0;
            orders.forEach(o => {
                if (o["狀態"] === "已出餐") {
                    totalCompleted += parseFloat(o["總金額"]) || 0;
                }
            });
            document.getElementById('checkout-total-modal').innerText = totalCompleted;
            document.getElementById('checkout-modal').style.display = 'block';

            // 添加點擊背景關閉功能
            const modal = document.getElementById('checkout-modal');
            const closeModal = (e) => {
                if (e.target === modal) {
                    hideModal('checkout-modal');
                    modal.removeEventListener('click', closeModal);
                }
            };
            modal.addEventListener('click', closeModal);
        })
        .catch(() => {
            alert("無法載入訂單數據");
        });
}

function checkoutTable() {
    const tableParam = urlParams.get('table');
    if (!confirm(`確定要為 ${tableParam} 桌結帳嗎？這將合併所有已完成訂單並清空桌號。`)) return;

    fetch(API_URL, {
        method: "POST",
        body: JSON.stringify({
            action: "checkout",
            table: tableParam,
            user: currentUser,
            password: currentPassword
        })
    })
    .then(res => res.json())
    .then(res => {
        if (res.result === "success") {
            alert(`結帳成功！總金額 $${res.total}，訂單ID：${res.orderId}`);
            hideModal('checkout-modal'); // 隱藏modal
            renderOrders(); // 重新整理
        } else {
            alert("結帳失敗：" + res.message);
        }
    })
    .catch(e => {
        alert("結帳失敗：" + e.message);
    });
}

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