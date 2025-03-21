// ==UserScript==
// @name Pegasus CS enhanced
// @version 3.8.3
// @author Jason
// @updateURL https://github.com/SiRENa3a/haha/raw/refs/heads/main/Pegasus_CS_enhanced.user.js
// @downloadURL https://github.com/SiRENa3a/haha/raw/refs/heads/main/Pegasus_CS_enhanced.user.js
// @description 高亮負數庫存及輸入框關鍵詞，新增 GP 計算功能，並調整指定輸入框寬度（減半再加 50px）
// @match https://shop.pegasus.hk/portal/orders/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pegasus.hk
// @grant none
// @run-at document-start
// ==/UserScript==

(function() {
    'use strict';

    // 高亮負數庫存
    function highlightText() {
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
    }

    // 新增 GP 計算功能
    function addGPColumn() {
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

                function updateGP() {
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
                }

                setInterval(updateGP, 1000);
            }
        }
    }

    // 調整指定輸入框寬度功能
    function adjustSpecificInputWidth() {
        const targetLabels = ["運費", "手續費", "雜費", "附加費", "總額", "總成本"];
        targetLabels.forEach(label => {
            const inputElement = Array.from(document.querySelectorAll('input.svelte-1dwz7uz')).find(input =>
                input.parentNode.textContent.includes(label)
            );

            if (inputElement && !inputElement.dataset.adjustedWidth) { // 檢查是否已經調整過寬度
                // 獲取原始寬度並計算新寬度（減半再加 10px）
                const originalWidth = parseFloat(window.getComputedStyle(inputElement).width);
                const newWidth = originalWidth / 2 + 10;

                inputElement.style.width = `${newWidth}px`;
                inputElement.dataset.adjustedWidth = true; // 標記此輸入框已被調整過
            }
        });
    }

    // 使用 MutationObserver 監控 DOM 變化
    const observer = new MutationObserver(() => {
        highlightText();
        addGPColumn();
        adjustSpecificInputWidth();
    });

    observer.observe(document.body, { childList: true, subtree: true });

    document.addEventListener('DOMContentLoaded', () => {
        highlightText();
        addGPColumn();
        adjustSpecificInputWidth();
    });
})();
