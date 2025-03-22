// ==UserScript==
// @name Pegasus CS enhanced
// @version 3.8.5
// @author Jason
// @updateURL https://github.com/SiRENa3a/haha/raw/refs/heads/main/Pegasus_CS_enhanced.user.js
// @downloadURL https://github.com/SiRENa3a/haha/raw/refs/heads/main/Pegasus_CS_enhanced.user.js
// @description 高亮負數庫存及輸入框關鍵詞，新增 GP 計算功能，並調整指定輸入框寬度
// @match https://shop.pegasus.hk/portal/orders/*
// @icon https://www.google.com/s2/favicons?sz=64&domain=pegasus.hk
// @grant unsafeWindow
// @run-at document-start
// ==/UserScript==

(function() {
    'use strict';
    
    // 腳本初始化狀態追蹤
    let scriptInitialized = false;
    let retryCount = 0;
    const MAX_RETRIES = 10;
    
    // 第一階段：立即執行的初始化
    function initializeScript() {
        try {
            console.log('[Pegasus CS] 腳本初始化開始');
            
            // 添加錯誤處理的全局捕獲
            window.addEventListener('error', function(e) {
                console.error('[Pegasus CS] 捕獲到全局錯誤:', e.message);
                return false;
            });
            
            // 啟動主函數
            executeMainFunctions();
            
            console.log('[Pegasus CS] 腳本初始化完成');
        } catch (err) {
            console.error('[Pegasus CS] 初始化錯誤:', err);
            // 初始化失敗，將通過重試機制再次嘗試
        }
    }
    
    // 第二階段：主要功能執行
    function executeMainFunctions() {
        // 添加防禦性 DOM 監控
        setupMutationObserver();
        
        // 執行一次所有核心功能
        runAllCoreFunctions();
        
        // 設置周期性檢查和功能執行
        setupPeriodicExecution();
    }
    
    // 設置 DOM 變化監控
    function setupMutationObserver() {
        try {
            const observer = new MutationObserver((mutations) => {
                if (!scriptInitialized) {
                    runAllCoreFunctions();
                }
            });
            
            observer.observe(document.documentElement, {
                childList: true,
                subtree: true,
                attributes: true,
                attributeFilter: ['class', 'style']
            });
            
            console.log('[Pegasus CS] DOM 監控已啟動');
        } catch (err) {
            console.error('[Pegasus CS] 設置 DOM 監控失敗:', err);
        }
    }
    
    // 設置周期性執行
    function setupPeriodicExecution() {
        // 替代 setInterval，使用遞歸 setTimeout 提高可靠性
        function recursiveExecution() {
            try {
                // 檢查腳本是否已成功初始化
                if (!scriptInitialized) {
                    if (retryCount < MAX_RETRIES) {
                        retryCount++;
                        console.log(`[Pegasus CS] 第 ${retryCount} 次嘗試初始化`);
                        runAllCoreFunctions();
                    } else {
                        console.warn('[Pegasus CS] 達到最大重試次數');
                    }
                } else {
                    // 腳本已初始化，僅執行需要持續更新的功能
                    updateDynamicContent();
                }
                
                // 設置下一次執行
                setTimeout(recursiveExecution, 1000);
            } catch (err) {
                console.error('[Pegasus CS] 周期執行錯誤:', err);
                // 出錯後仍繼續嘗試
                setTimeout(recursiveExecution, 1000);
            }
        }
        
        // 開始周期性執行
        setTimeout(recursiveExecution, 1000);
    }
    
    // 執行所有核心功能
    function runAllCoreFunctions() {
        try {
            // 檢查關鍵元素是否存在
            const totalAmountInput = Array.from(document.querySelectorAll('input[type="number"].svelte-1dwz7uz')).find(input => {
                return input.parentNode.textContent.includes("總額");
            });
            
            const totalCostInput = Array.from(document.querySelectorAll('input[type="number"].svelte-1dwz7uz')).find(input => {
                return input.parentNode.textContent.includes("總成本");
            });
            
            // 如果關鍵元素存在，執行所有功能並標記初始化成功
            if (totalAmountInput && totalCostInput) {
                highlightText();
                addGPColumn();
                adjustSpecificInputWidth();
                
                // 標記腳本已成功初始化
                scriptInitialized = true;
                console.log('[Pegasus CS] 腳本功能已成功執行');
            }
        } catch (err) {
            console.error('[Pegasus CS] 執行核心功能失敗:', err);
        }
    }
    
    // 只更新需要動態更新的內容
    function updateDynamicContent() {
        try {
            // 在這裡只調用需要持續更新的功能
            updateGPCalculation();
        } catch (err) {
            console.error('[Pegasus CS] 更新動態內容失敗:', err);
        }
    }
    
    // 高亮負數庫存及關鍵詞
    function highlightText() {
        try {
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
            
            // 高亮關鍵詞
            const keywords = [
                'AMD', 'Intel', 'A520', 'A620', 'B450', 'B550', 'B650', 'B840', 'B850',
                'B650E', 'X670', 'X670E', 'X870', 'X870E', 'H510', 'H610', 'H770',
                'B660', 'B760', 'B860', 'Z690', 'Z790', 'Z890',
                ' E-ATX', ' ATX', ' MATX', ' ITX ', ' Micro-ATX',
                'DDR4', 'DDR5',
                'Basic', 'Premium', ' SFX', ' SFX-L'
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
        } catch (err) {
            console.error('[Pegasus CS] 高亮功能執行失敗:', err);
        }
    }
    
    // 添加 GP 功能
    function addGPColumn() {
        try {
            function getInputs() {
                const totalAmountInput = Array.from(document.querySelectorAll('input[type="number"].svelte-1dwz7uz')).find(input => {
                    return input.parentNode.textContent.includes("總額");
                });

                const additionalFeeInput = Array.from(document.querySelectorAll('input[type="number"].svelte-1dwz7uz')).find(input => {
                    return input.parentNode.textContent.includes("附加費");
                });

                const totalCostInput = Array.from(document.querySelectorAll('input[type="number"].svelte-1dwz7uz')).find(input => {
                    return input.parentNode.textContent.includes("總成本");
                });

                return { totalAmountInput, additionalFeeInput, totalCostInput };
            }

            const { totalAmountInput, additionalFeeInput, totalCostInput } = getInputs();

            if (totalAmountInput && additionalFeeInput && totalCostInput) {
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

                    totalCostInput.parentNode.insertBefore(gpWrapper, totalCostInput.nextSibling);
                    
                    // 初始化 GP 值
                    updateGPCalculation();
                }
            }
        } catch (err) {
            console.error('[Pegasus CS] 添加 GP 功能失敗:', err);
        }
    }
    
    // 更新 GP 計算
    function updateGPCalculation() {
        try {
            const gpResult = document.querySelector('.gp-result');
            if (!gpResult) return;
            
            function getInputs() {
                const totalAmountInput = Array.from(document.querySelectorAll('input[type="number"].svelte-1dwz7uz')).find(input => {
                    return input.parentNode.textContent.includes("總額");
                });

                const additionalFeeInput = Array.from(document.querySelectorAll('input[type="number"].svelte-1dwz7uz')).find(input => {
                    return input.parentNode.textContent.includes("附加費");
                });

                const totalCostInput = Array.from(document.querySelectorAll('input[type="number"].svelte-1dwz7uz')).find(input => {
                    return input.parentNode.textContent.includes("總成本");
                });

                return { totalAmountInput, additionalFeeInput, totalCostInput };
            }
            
            const { totalAmountInput, additionalFeeInput, totalCostInput } = getInputs();
            if (totalAmountInput && additionalFeeInput && totalCostInput) {
                const totalAmount = parseFloat(totalAmountInput.value) || 0;
                const additionalFee = parseFloat(additionalFeeInput.value) || 0;
                const totalCost = parseFloat(totalCostInput.value) || 0;

                if (isNaN(totalAmount) || isNaN(additionalFee) || isNaN(totalCost)) {
                    gpResult.textContent = 'N/A';
                    gpResult.style.color = 'gray';
                } else {
                    const gpValue = totalAmount - additionalFee - totalCost;
                    gpResult.textContent = gpValue.toFixed(1);
                    gpResult.style.color = gpValue >= 0 ? "green" : "red";
                }
            }
        } catch (err) {
            console.error('[Pegasus CS] GP 計算更新失敗:', err);
        }
    }
    
    // 調整輸入框寬度
    function adjustSpecificInputWidth() {
        try {
            const targetLabels = ["運費", "手續費", "雜費", "附加費", "總額", "總成本"];
            targetLabels.forEach(label => {
                const inputElement = Array.from(document.querySelectorAll('input.svelte-1dwz7uz')).find(input =>
                    input.parentNode.textContent.includes(label)
                );

                if (inputElement && !inputElement.dataset.adjustedWidth) {
                    // 獲取原始寬度並計算新寬度（減半再加 50px）
                    const originalWidth = parseFloat(window.getComputedStyle(inputElement).width);
                    const newWidth = originalWidth / 2 + 50;

                    inputElement.style.width = `${newWidth}px`;
                    inputElement.dataset.adjustedWidth = true; // 標記此輸入框已被調整過
                }
            });
        } catch (err) {
            console.error('[Pegasus CS] 調整輸入框寬度失敗:', err);
        }
    }
    
    // 初始化腳本
    initializeScript();
})();
