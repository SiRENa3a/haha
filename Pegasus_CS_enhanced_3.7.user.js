// ==UserScript==
// @name Pegasus CS enhanced
// @version 3.7
// @author Jason
// @description 高亮負數庫存及輸入框關鍵詞，新增 GP 計算功能（顯示在總成本右方，顯示一位小數，GP 值為粗體）
// @match https://shop.pegasus.hk/portal/orders/*
// @grant none
// ==/UserScript==

function highlightText() {
    // 高亮負數庫存
    const paras = document.querySelectorAll('p:not(.pegasus-highlighted)');
    paras.forEach(para => {
        const text = para.innerText;
        const highlightText = "庫存 : -";
        if (text.includes(highlightText)) {
            para.style.backgroundColor = "orange";
            para.style.color = "red";
            para.style.fontWeight = "bold";
            para.style.fontSize = "120%";
            para.style.textDecoration = "underline";
            para.classList.add('pegasus-highlighted');
        }
    });

    // 高亮輸入框中的關鍵詞
    const keywords = [
        'AMD', 'Intel', 'A520', 'A620', 'B450', 'B550', 'B650', 'B840', 'B850',
        'B650E', 'X670', 'X670E', 'X870', 'X870E', 'H510', 'H610', 'H770',
        'B660', 'B760', 'B860', 'Z690', 'Z790', 'Z890',
        'E-ATX', 'ATX', 'MATX', 'ITX', 'Micro-ATX',
        'DDR4', 'DDR5',
        'Basic', 'Premium', 'SFX', 'SFX-L'
    ];
    const inputs = document.querySelectorAll('input.svelte-1dwz7uz:not(.keyword-highlighted)');

    inputs.forEach(input => {
        const originalValue = input.value;

        // 清除之前的覆蓋層（如果存在）
        let existingOverlay = input.parentNode.querySelector('.highlight-overlay');
        if (existingOverlay) {
            existingOverlay.remove();
        }

        // 創建一個新的覆蓋層
        const overlay = document.createElement('div');
        overlay.classList.add('highlight-overlay');
        overlay.style.position = 'absolute';
        overlay.style.top = `${input.offsetTop - 50}px`; // 向上移動 50px
        overlay.style.left = `${input.offsetLeft + 50}px`; // 向右移動 50px
        overlay.style.width = `${input.offsetWidth}px`;
        overlay.style.height = `${input.offsetHeight}px`;
        overlay.style.lineHeight = `${input.offsetHeight}px`;
        overlay.style.pointerEvents = 'none'; // 防止覆蓋層影響輸入框操作
        overlay.style.whiteSpace = 'nowrap';
        overlay.style.overflow = 'hidden';

        // 提取並高亮關鍵詞
        let highlightedContent = '';
        keywords.forEach(keyword => {
            if (originalValue.includes(keyword)) {
                highlightedContent += `<span style="background-color: red; color: white; font-weight: bold; padding: 2px;">${keyword}</span> `;
            }
        });

        // 如果有匹配的關鍵詞，將其插入覆蓋層
        if (highlightedContent) {
            overlay.innerHTML = highlightedContent.trim();
            input.parentNode.style.position = 'relative'; // 確保父容器是相對定位
            input.parentNode.appendChild(overlay);
            input.classList.add('keyword-highlighted'); // 標記已處理過的輸入框
        }
    });
}

// 新增 GP 計算功能
function addGPColumn() {
    // 獲取「總額」和「總成本」輸入框，根據父元素文本內容進行選擇
    const totalAmountInput = Array.from(document.querySelectorAll('input[type="number"].svelte-1dwz7uz')).find(input => {
        return input.parentNode.textContent.includes("總額");
    });

    const totalCostInput = Array.from(document.querySelectorAll('input[type="number"].svelte-1dwz7uz')).find(input => {
        return input.parentNode.textContent.includes("總成本");
    });

    if (totalAmountInput && totalCostInput) {
        // 檢查是否已經存在 GP 資料欄位，避免重複添加
        if (!document.querySelector('.gp-result')) {
            const gpWrapper = document.createElement('div');
            gpWrapper.style.display = "inline-block";
            gpWrapper.style.marginLeft = "10px";

            const gpLabel = document.createElement('span');
            gpLabel.textContent = "GP: ";
            gpLabel.style.fontWeight = "bold";

            const gpResult = document.createElement('span');
            gpResult.className = "gp-result";
            gpResult.textContent = ""; // 初始化為空
            gpResult.style.fontWeight = "bold"; // 設置 GP 值為粗體

            gpWrapper.appendChild(gpLabel);
            gpWrapper.appendChild(gpResult);

            // 將 GP 放置在「總成本」輸入框右方（同一行）
            totalCostInput.parentNode.insertBefore(gpWrapper, totalCostInput.nextSibling);

            // 動態更新 GP 值（總額 - 總成本）
            function updateGP() {
                const totalAmount = parseFloat(totalAmountInput.value) || 0;
                const totalCost = parseFloat(totalCostInput.value) || 0;
                const gpValue = totalAmount - totalCost;
                gpResult.textContent = gpValue.toFixed(1); // 顯示一位小數
                gpResult.style.color = gpValue >= 0 ? "green" : "red"; // 正值為綠色，負值為紅色
            }

            // 初始化 GP 值（因為輸入框是 disabled 狀態，因此無需監聽事件）
            updateGP();
        }
    }
}

// 每秒執行一次高亮函數，檢測新內容並添加 GP 資料欄位
setInterval(() => {
    highlightText();
    addGPColumn();
}, 1000);
