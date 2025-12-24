// --- 登入/登出相關功能 ---

/**
 * 檢查登入狀態
 */
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

/**
 * 顯示登入模態框
 */
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
    modal.addEventListener('hidden', cleanup);
}

/**
 * 嘗試登入
 */
async function attemptLogin() {
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-password').value.trim();
    if (!user || !pass) {
        await customAlert('請輸入帳號和密碼');
        return;
    }

    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.innerText = '驗證中...';

    try {
        const res = await loginAPI(user, pass);
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
            await customAlert('登入失敗：' + res.message);
        }
    } catch (e) {
        await customAlert('登入失敗：' + e.message);
    } finally {
        btn.disabled = false;
        btn.innerText = '登入';
    }
}

/**
 * 登出
 */
async function logout() {
    if (await customConfirm('確定要登出嗎？')) {
        localStorage.removeItem('managerUser');
        localStorage.removeItem('managerPassword');
        isLoggedIn = false;
        currentUser = null;
        currentPassword = null;
        render();
    }
}

