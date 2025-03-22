// ==UserScript==
// @name Pegasus CS enhanced
// @version 3.9.0
// @description 完整功能修正版：高亮库存/关键词/GP计算/输入框调整
// @match https://shop.pegasus.hk/portal/orders/*
// @grant none
// @run-at document-end
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
                    p.style.cssText = 'background: orange!important; color: red!important; font-weight: bold!important;';
                    p.classList.add('pegasus-highlighted');
                }
            });
        },

        highlightKeywords: function() {
            const keywords = ['AMD', 'Intel', 'DDR4', 'DDR5', 'ATX', 'MATX'];
            document.querySelectorAll('input.svelte-1dwz7uz').forEach(input => {
                if (input.parentNode.querySelector('.keyword-overlay')) return;

                const matches = keywords.filter(k => input.value.includes(k));
                if (matches.length > 0) {
                    const overlay = document.createElement('div');
                    overlay.className = 'keyword-overlay';
                    overlay.style.cssText = `
                        position: absolute;
                        left: ${input.offsetLeft + 50}px;
                        top: ${input.offsetTop - 10}px;
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
                .find(input => {
                    const labelElement = input.closest('div').querySelector(':scope > span');
                    return labelElement && labelElement.textContent.trim() === labelText;
                });
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

    // 输入框宽度调整模块 (专项强化修正)
    const widthAdjuster = {
        config: {
            targetLabels: ["運費", "手續費", "雜費", "附加費", "總額", "總成本"],
            widthFormula: baseWidth => (baseWidth / 2) + 50
        },

        init: function() {
            this.observer = new MutationObserver(this.handleMutations.bind(this));
            this.observer.observe(document.body, {
                childList: true,
                subtree: true,
                attributeFilter: ['class']
            });
            this.processAllInputs();
            this.retryCounter = 0;
            this.startRetryMechanism();
        },

        processAllInputs: function() {
            this.config.targetLabels.forEach(label => {
                const input = this.findInputByExactLabel(label);
                if (input && !input.dataset.widthAdjusted) {
                    this.applyWidthAdjustment(input);
                }
            });
        },

        findInputByExactLabel: function(label) {
            return Array.from(document.querySelectorAll('input.svelte-1dwz7uz'))
                .find(input => {
                    const labelElement = input.closest('div').querySelector(':scope > span');
                    return labelElement && labelElement.textContent.trim() === label;
                });
        },

        applyWidthAdjustment: function(input) {
            const style = window.getComputedStyle(input);
            
            // 计算原始宽度 (优先使用计算样式，失败时使用offsetWidth)
            const baseWidth = parseFloat(style.width) || 
                             input.offsetWidth - 
                             parseFloat(style.paddingLeft) - 
                             parseFloat(style.paddingRight);

            // 应用新宽度
            if (!isNaN(baseWidth)) {
                input.style.cssText = `
                    width: ${this.config.widthFormula(baseWidth)}px !important;
                    min-width: unset !important;
                    max-width: unset !important;
                    box-sizing: content-box !important;
                `;
                input.dataset.widthAdjusted = 'true';
                console.log(`已調整輸入框寬度: ${input.parentNode.textContent.trim()}`, input.style.width);
            }
        },

        handleMutations: function(mutations) {
            mutations.forEach(mutation => {
                if (mutation.type === 'childList') {
                    this.processAllInputs();
                }
            });
        },

        startRetryMechanism: function() {
            const retryInterval = setInterval(() => {
                if (this.retryCounter++ < 10) {
                    this.processAllInputs();
                } else {
                    clearInterval(retryInterval);
                    console.warn('達到最大重試次數');
                }
            }, 1500);
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
