// ==UserScript==
// @name Pegasus CS enhanced
// @version 3.8.8
// @author Jason
// @description 高亮負數庫存及輸入框關鍵詞，新增 GP 計算功能，並調整指定輸入框寬度
// @match https://shop.pegasus.hk/portal/orders/*
// @grant none
// @run-at document-start
// ==/UserScript==

(function() {
    'use strict';

    // 高亮負數庫存及關鍵詞（保持不變）
    function highlightText() { /* 原有代碼保持不變 */ }

    // GP計算功能（保持不變）
    function addGPColumn() { /* 原有代碼保持不變 */ }

    // 修正後的輸入框寬度調整功能
    function adjustSpecificInputWidth() {
        const targetLabels = ["運費", "手續費", "雜費", "附加費", "總額", "總成本"];
        targetLabels.forEach(label => {
            // 更精確的選擇器組合
            const inputElement = document.querySelector(`input.svelte-1dwz7uz:not([data-adjusted-width]):has(+ span:contains("${label}"))`);
            
            if (inputElement) {
                // 獲取計算寬度並強制覆蓋min-width
                const originalWidth = parseFloat(getComputedStyle(inputElement).width);
                inputElement.style.cssText = `
                    width: ${originalWidth / 2 + 50}px !important;
                    min-width: unset !important;
                    box-sizing: content-box !important;
                `;
                
                // 添加永久標記
                inputElement.dataset.adjustedWidth = 'true';
            }
        });
    }

    // 強化版的DOM監聽器
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            if (mutation.type === 'childList') {
                // 延遲執行確保DOM完全渲染
                setTimeout(() => {
                    highlightText();
                    addGPColumn();
                    adjustSpecificInputWidth();
                }, 100);
            }
        });
    });

    // 啟動腳本
    function initialize() {
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });

        // 初始執行 + 定期檢查
        const executeAll = () => {
            highlightText();
            addGPColumn();
            adjustSpecificInputWidth();
        };
        executeAll();
        setInterval(executeAll, 1500);
    }

    // 根據頁面狀態啟動
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
})();
