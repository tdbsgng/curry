// --- 主入口和初始化 ---

// 初始化應用程式
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

