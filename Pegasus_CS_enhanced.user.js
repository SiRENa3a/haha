// ==UserScript==
// @name Pegasus CS enhanced
// @version 3.8.7
// @author Jason
// @description 高亮負數庫存及輸入框關鍵詞，新增 GP 計算功能，並調整指定輸入框寬度
// @match https://shop.pegasus.hk/portal/orders/*
// @grant none
// @run-at document-start
// ==/UserScript==

(function() {
    'use strict';

    // 高亮負數庫存
    function highlightText() {
        try {
            // 高亮負數庫存段落
            document.querySelectorAll('p:not(.pegasus-highlighted)').forEach(para => {
                if (para.innerText.includes("庫存 : -")) {
                    para.style.cssText = 'background-color: orange !important; color: red !important; font-weight: bold !important; font-size: 120% !important; text-decoration: underline !important;';
                    para.classList.add('pegasus-highlighted');
                }
            });

            // 高亮輸入框關鍵詞
            const keywords = [
                'AMD', 'Intel', 'A520', 'A620', 'B450', 'B550', 'B650', 'B840', 'B850',
                'B650E', 'X670', 'X670E', 'X870', 'X870E', 'H510', 'H610', 'H770',
                'B660', 'B760', 'B860', 'Z690', 'Z790', 'Z890',
                'E-ATX', 'ATX', 'MATX', 'ITX', 'Micro-ATX',
                'DDR4', 'DDR5',
                'Basic', 'Premium', 'SFX', 'SFX-L'
            ];

            document.querySelectorAll('input.svelte-1dwz7uz:not(.keyword-highlighted)').forEach(input => {
                const existingOverlay = input.parentNode.querySelector('.highlight-overlay');
                if (existingOverlay) existingOverlay.remove();

                const overlay = document.createElement('div');
                overlay.className = 'highlight-overlay';
                overlay.style.cssText = `
                    position: absolute;
                    top: ${input.offsetTop - 50}px;
                    left: ${input.offsetLeft + 50}px;
                    width: ${input.offsetWidth}px;
                    height: ${input.offsetHeight}px;
                    line-height: ${input.offsetHeight}px;
                    pointer-events: none;
                    white-space: nowrap;
                    overflow: hidden;
                `;

                const highlighted = keywords.filter(k => input.value.includes(k))
                    .map(k => `<span style="background:red;color:white;font-weight:bold;padding:2px;">${k}</span>`)
                    .join(' ');

                if (highlighted) {
                    overlay.innerHTML = highlighted;
                    input.parentNode.style.position = 'relative';
                    input.parentNode.appendChild(overlay);
                    input.classList.add('keyword-highlighted');
                }
            });
        } catch (err) {
            console.error('[高亮功能錯誤]', err);
        }
    }

    // GP計算功能
    function initGPCalculator() {
        try {
            const getInput = (text) => 
                Array.from(document.querySelectorAll('input.svelte-1dwz7uz'))
                    .find(input => input.parentNode.textContent.includes(text));

            const inputs = {
                total: getInput('總額'),
                fee: getInput('附加費'),
                cost: getInput('總成本')
            };

            if (!inputs.total || !inputs.fee || !inputs.cost) return;

            if (!document.querySelector('.gp-result')) {
                const gpDiv = document.createElement('div');
                gpDiv.innerHTML = `
                    <span style="font-weight:bold">GP: </span>
                    <span class="gp-result" style="font-weight:bold"></span>
                `;
                gpDiv.style.cssText = 'display: inline-block; margin-left: 10px;';
                inputs.cost.parentNode.insertBefore(gpDiv, inputs.cost.nextSibling);
            }

            const updateGP = () => {
                const gpResult = document.querySelector('.gp-result');
                if (!gpResult) return;

                const values = {
                    total: parseFloat(inputs.total.value) || 0,
                    fee: parseFloat(inputs.fee.value) || 0,
                    cost: parseFloat(inputs.cost.value) || 0
                };

                if ([values.total, values.fee, values.cost].some(isNaN)) {
                    gpResult.textContent = 'N/A';
                    gpResult.style.color = 'gray';
                } else {
                    const gp = values.total - values.fee - values.cost;
                    gpResult.textContent = gp.toFixed(1);
                    gpResult.style.color = gp >= 0 ? 'green' : 'red';
                }
            };

            // 即時更新監聽
            [inputs.total, inputs.fee, inputs.cost].forEach(input => {
                input.addEventListener('input', updateGP);
            });
            setInterval(updateGP, 1000);
            updateGP();
        } catch (err) {
            console.error('[GP計算錯誤]', err);
        }
    }

    // 調整輸入框寬度
    function adjustInputWidth() {
        try {
            const labels = ["運費", "手續費", "雜費", "附加費", "總額", "總成本"];
            labels.forEach(label => {
                const input = Array.from(document.querySelectorAll('input.svelte-1dwz7uz'))
                    .find(i => i.parentNode.textContent.includes(label));
                
                if (input && !input.dataset.resized) {
                    const originalWidth = parseFloat(getComputedStyle(input).width);
                    input.style.width = `${originalWidth / 2 + 50}px`;
                    input.dataset.resized = 'true';
                }
            });
        } catch (err) {
            console.error('[寬度調整錯誤]', err);
        }
    }

    // 主初始化函數
    const main = () => {
        highlightText();
        initGPCalculator();
        adjustInputWidth();
        
        // 設置DOM監聽
        new MutationObserver(mutations => {
            if (mutations.some(m => m.addedNodes.length > 0)) {
                highlightText();
                initGPCalculator();
                adjustInputWidth();
            }
        }).observe(document.body, {childList: true, subtree: true});

        // 設置定期檢查
        let retry = 0;
        const checker = () => {
            if (retry++ < 10) {
                highlightText();
                initGPCalculator();
                adjustInputWidth();
                setTimeout(checker, 1000);
            }
        };
        checker();
    };

    // 啟動腳本
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', main);
    } else {
        main();
    }
})();
