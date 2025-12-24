// --- 設定區 ---
const API_URL = "https://script.google.com/macros/s/AKfycbwtLdxy0Q_rSWuSlbuUTq-_lHDUqyykwlunXQGG3IXfrLfCy47_heRMQRwZDY8rJd0/exec";

// 全域狀態
let cart = {};
let menuDataCache = [];
let orderHistory = [];

// URL 參數
let urlParams = new URLSearchParams(window.location.search);
const tableParam = urlParams.get('table') || "unknown";
const manageParam = urlParams.get('manage');

// 登入狀態
let isLoggedIn = false;
let currentUser = null;
let currentPassword = null;

