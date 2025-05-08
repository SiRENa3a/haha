// ==UserScript==
// @name Pegasus CS enhanced
// @version 3.11.1
// @author Jason
// @description 高亮負數庫存及輸入框關鍵詞，GP 計算功能
// @match https://shop.pegasus.hk/portal/orders/*
// @exclude https://shop.pegasus.hk/portal/orders/*/invoice
// @match https://shop.pegasus.hk/portal
// @grant none
// @run-at document-end
// ==/UserScript==

(function () {
    'use strict';

    function highlightNegativeStock() {
        document.querySelectorAll('p:not(.pegasus-highlighted)').forEach(p => {
            if (p.textContent.includes('庫存 : -')) {
                p.style.cssText = 'background: orange!important; color: red!important; font-weight: bold!important; font-size: 120%!important';
                p.classList.add('pegasus-highlighted');
            }
        });
    }

    let keywordOverlays = [];
    function updateKeywordOverlayPositions() {
        keywordOverlays.forEach(({ input, overlay }) => {
            const rect = input.getBoundingClientRect();
            overlay.style.left = `${rect.left + window.scrollX + 65}px`;
            overlay.style.top = `${rect.top + window.scrollY - 25}px`;
        });
    }
    window.addEventListener('scroll', updateKeywordOverlayPositions);
    window.addEventListener('resize', updateKeywordOverlayPositions);

    function highlightKeywords() {
        const keywords = [
            'AMD', 'Intel', 'A520', 'A620', 'B450', 'B550', 'B650', 'B840', 'B850',
            'B650E', 'X670', 'X670E', 'X870', 'X870E', 'H510', 'H610', 'H770',
            'B660', 'B760', 'B860', 'Z690', 'Z790', 'Z890',
            ' E-ATX', ' ATX', ' MATX', ' ITX ', ' Micro-ATX',
            'DDR4', 'DDR5',
            'Basic', 'Premium', ' SFX', ' SFX-L'
        ];
        document.querySelectorAll('input.svelte-qrj5qa:not(.keyword-highlighted)').forEach(input => {
            const matches = keywords.filter(k => input.value.includes(k));
            if (matches.length > 0) {
                const rect = input.getBoundingClientRect();
                const overlay = document.createElement('div');
                overlay.className = 'highlight-overlay';
                overlay.style.position = 'absolute';
                overlay.style.left = `${rect.left + window.scrollX}px`;
                overlay.style.top = `${rect.top + window.scrollY - 25}px`;
                overlay.style.zIndex = '1000';
                overlay.style.pointerEvents = 'none';
                overlay.style.display = 'flex';
                overlay.style.gap = '4px';
                overlay.style.flexWrap = 'wrap';
                overlay.style.alignItems = 'center';

                overlay.innerHTML = matches.map(k => `<span style="background: yellow; padding: 1px 4px; border-radius: 4px; font-weight: bold; font-size: 12px; white-space: nowrap;">${k}</span>`).join('');

                document.body.appendChild(overlay);
                keywordOverlays.push({ input, overlay });
                input.classList.add('keyword-highlighted');
            }
        });
    }

    function adjustInputWidths() {
        const widthLabels = ['運費', '手續費', '雜費', '附加費', '總額', '總成本'];
        widthLabels.forEach(label => {
            const input = findInputByExactLabel(label);
            if (input && !input.dataset.widthAdjusted) {
                input.style.width = '120px';
                input.dataset.widthAdjusted = 'true';
            }
        });
    }

    function findInputByExactLabel(labelText) {
        const allElements = document.querySelectorAll('div, span, label');
        for (const el of allElements) {
            if (el.textContent.trim() === labelText) {
                const container = el.closest('div');
                if (container) {
                    const input = container.querySelector('input[type="number"]');
                    if (input) return input;
                }
            }
        }
        return null;
    }

    function setupGP() {
        const total = findInputByExactLabel('總額');
        const fee = findInputByExactLabel('附加費');
        const cost = findInputByExactLabel('總成本');

        console.log('[GP DEBUG] 總額 input:', total?.value);
        console.log('[GP DEBUG] 附加費 input:', fee?.value);
        console.log('[GP DEBUG] 總成本 input:', cost?.value);

        if (!total || !fee || !cost) {
            console.warn('[GP DEBUG] ❌ 找不到總額、附加費或總成本');
            return;
        }

        let gpContainer = document.querySelector('.gp-display');
        if (!gpContainer) {
            gpContainer = document.createElement('div');
            gpContainer.className = 'gp-display';
            gpContainer.style.position = 'absolute';
            gpContainer.style.fontWeight = 'bold';
            gpContainer.style.fontSize = '14px';
            gpContainer.style.background = '#f9f9f9';
            gpContainer.style.padding = '2px 6px';
            gpContainer.style.borderRadius = '4px';
            gpContainer.style.boxShadow = '0 0 3px rgba(0,0,0,0.15)';
            gpContainer.innerHTML = 'GP：<span class="gp-value">0.0</span>';
            document.body.appendChild(gpContainer);
        }

        function updatePositionAndValue() {
            const rect = cost.getBoundingClientRect();
            gpContainer.style.left = `${rect.right + window.scrollX + 10}px`;
            gpContainer.style.top = `${rect.top + window.scrollY}px`;

            const get = input => parseFloat(input.value.replace(/,/g, '')) || 0;
            const gp = get(total) - get(fee) - get(cost);

            const valueSpan = gpContainer.querySelector('.gp-value');
            valueSpan.textContent = gp.toFixed(1);
            valueSpan.style.color = gp >= 0 ? 'green' : 'red';
        }

        updatePositionAndValue();
        window.addEventListener('resize', updatePositionAndValue);
        window.addEventListener('scroll', updatePositionAndValue);
    }

    function initModules() {
        try {
            highlightNegativeStock();
            highlightKeywords();
            adjustInputWidths();
            setupGP();
        } catch (e) {
            console.error('[Pegasus Enhanced] Initialization error:', e);
        }
    }

    let lastRun = 0;
    const DEBOUNCE_DELAY = 1000;
    function safeInitModules() {
        const now = Date.now();
        if (now - lastRun < DEBOUNCE_DELAY) return;
        lastRun = now;
        initModules();
    }

    const observer = new MutationObserver(() => safeInitModules());
    observer.observe(document.body, { childList: true, subtree: true });

    // 持續刷新初始化
    setInterval(() => {
        safeInitModules();
    }, 500);

    initModules();

})();
