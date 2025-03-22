// ==UserScript==
// @name Pegasus CS enhanced
// @version 3.9.3
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

    // 高亮核心功能模块
    const highlightModule = {
        init: function() {
            this.highlightNegativeStock();
            this.highlightKeywords();
        },

        highlightNegativeStock: function() {
            document.querySelectorAll('p:not(.pegasus-highlighted)').forEach(p => {
                if (p.textContent.includes('庫存 : -')) {
                    p.style.cssText = 'background: orange!important; color: red!important; font-weight: bold!important; font-size: 120%!important';
                    p.classList.add('pegasus-highlighted');
                }
            });
        },

        highlightKeywords: function() {
            const keywords = [
             'AMD', 'Intel', 'A520', 'A620', 'B450', 'B550', 'B650', 'B840', 'B850',
             'B650E', 'X670', 'X670E', 'X870', 'X870E', 'H510', 'H610', 'H770',
             'B660', 'B760', 'B860', 'Z690', 'Z790', 'Z890',
             ' E-ATX', ' ATX', ' MATX', ' ITX ', ' Micro-ATX',
             'DDR4', 'DDR5',
             'Basic', 'Premium', ' SFX', ' SFX-L'
         ];
            document.querySelectorAll('input.svelte-1dwz7uz').forEach(input => {
                if (input.parentNode.querySelector('.keyword-overlay')) return;

                const matches = keywords.filter(k => input.value.includes(k));
                if (matches.length > 0) {
                    const overlay = document.createElement('div');
                    overlay.className = 'keyword-overlay';
                    overlay.style.cssText = `
                        position: absolute;
                        left: ${input.offsetLeft + 35}px;
                        top: ${input.offsetTop - 45}px;
                        background: red;
                        color: white;
                        padding: 2px 5px;
                        border-radius: 3px;
                    `;
                    overlay.textContent = matches.join(', ');
                    input.parentNode.style.position = 'relative';
                    input.parentNode.appendChild(overlay);
                }
            });
        }
    };

    // GP计算模块
    const gpCalculator = {
        init: function() {
            const inputs = this.getRequiredInputs();
            if (!inputs) return;

            if (!document.querySelector('.gp-display')) {
                this.createGPDisplay(inputs.cost);
            }
            this.setupUpdateListener(inputs);
        },

        getRequiredInputs: function() {
            const total = this.findInputByLabel('總額');
            const fee = this.findInputByLabel('附加費');
            const cost = this.findInputByLabel('總成本');
            return total && fee && cost ? { total, fee, cost } : null;
        },

        findInputByLabel: function(labelText) {
            return Array.from(document.querySelectorAll('input.svelte-1dwz7uz'))
                .find(input => input.parentNode.textContent.includes(labelText));
        },

        createGPDisplay: function(target) {
            const container = document.createElement('div');
            container.className = 'gp-display';
            container.style.cssText = 'display: inline-block; margin-left: 15px;';
            container.innerHTML = `
                <span style="font-weight:bold">GP：</span>
                <span class="gp-value" style="font-weight:bold;color:green"></span>
            `;
            target.parentNode.insertBefore(container, target.nextSibling);
        },

        setupUpdateListener: function(inputs) {
            const updateHandler = () => {
                const total = parseFloat(inputs.total.value) || 0;
                const fee = parseFloat(inputs.fee.value) || 0;
                const cost = parseFloat(inputs.cost.value) || 0;
                const gpValue = total - fee - cost;

                const display = document.querySelector('.gp-value');
                if (display) {
                    display.textContent = gpValue.toFixed(1);
                    display.style.color = gpValue >= 0 ? 'green' : 'red';
                }
            };

            [inputs.total, inputs.fee, inputs.cost].forEach(input => {
                input.addEventListener('input', updateHandler);
            });
            updateHandler();
        }
    };

    // 输入框宽度调整模块
    const widthAdjuster = {
        targetLabels: ['運費', '手續費', '雜費', '附加費', '總額', '總成本'],
        
        init: function() {
            this.targetLabels.forEach(label => {
                const input = this.findInputByLabel(label);
                if (input && !input.dataset.widthAdjusted) {
                    this.adjustWidth(input);
                    input.dataset.widthAdjusted = true;
                }
            });
        },

        findInputByLabel: function(label) {
            return Array.from(document.querySelectorAll('input.svelte-1dwz7uz'))
                .find(input => input.parentNode.textContent.includes(label));
        },

        adjustWidth: function(input) {
            const style = window.getComputedStyle(input);
            const baseWidth = parseFloat(style.width);
            if (!isNaN(baseWidth)) {
                input.style.width = `${(baseWidth / 2) + 50}px`;
                input.style.minWidth = 'unset';
                input.style.boxSizing = 'content-box';
            }
        }
    };

    // 主控制器
    const mainController = {
        init: function() {
            // 立即执行一次
            this.executeModules();

            // 设置DOM监听
            new MutationObserver(() => this.executeModules())
                .observe(document.body, { childList: true, subtree: true });

            // 设置安全重试机制
            let retryCount = 0;
            const retryInterval = setInterval(() => {
                if (retryCount++ < 5) {
                    this.executeModules();
                } else {
                    clearInterval(retryInterval);
                }
            }, 1000);
        },

        executeModules: function() {
            try {
                highlightModule.init();
                gpCalculator.init();
                widthAdjuster.init();
            } catch (error) {
                console.error('[Pegasus CS] 模块执行错误:', error);
            }
        }
    };

    // 启动脚本
    if (document.readyState === 'complete') {
        mainController.init();
    } else {
        window.addEventListener('load', () => mainController.init());
    }
})();
