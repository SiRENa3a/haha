// ==UserScript==
// @name Pegasus CS enhanced
// @version 3.9.12
// @description 高亮負數庫存及輸入框關鍵詞，新增 GP 計算功能，並調整指定輸入框寬度
// @match https://shop.pegasus.hk/portal/orders/*
// @match https://shop.pegasus.hk/portal
// @grant unsafeWindow
// @run-at document-start
// ==/UserScript==

(function () {
    'use strict';

    // 高亮核心功能模块
    const highlightModule = {
        init: function () {
            this.highlightNegativeStock();
            this.highlightKeywords();
        },

        highlightNegativeStock: function () {
            document.querySelectorAll('p:not(.pegasus-highlighted)').forEach(p => {
                if (p.textContent.includes('庫存 : -')) {
                    p.style.cssText = 'background: orange!important; color: red!important; font-weight: bold!important; font-size: 120%!important';
                    p.classList.add('pegasus-highlighted');
                }
            });
        },

        highlightKeywords: function () {
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
                let highlightedContent = '';

                // 提取并高亮关键词
                keywords.forEach(keyword => {
                    if (originalValue.includes(keyword)) {
                        highlightedContent += `<span style="background-color: yellow; font-weight: bold;">${keyword}</span> `;
                    }
                });

                if (highlightedContent) {
                    // 创建覆盖层显示高亮内容
                    const overlay = document.createElement('div');
                    overlay.classList.add('highlight-overlay');
                    overlay.style.position = 'absolute';
                    overlay.style.top = `${input.offsetTop - 45}px`; // 向上移动 10px
                    overlay.style.left = `${input.offsetLeft}px`;
                    overlay.style.width = `${input.offsetWidth}px`;
                    overlay.style.height = `${input.offsetHeight}px`;
                    overlay.style.lineHeight = `${input.offsetHeight}px`;
                    overlay.style.pointerEvents = 'none'; // 防止覆盖层影响输入框操作
                    overlay.style.whiteSpace = 'nowrap';
                    overlay.style.overflow = 'hidden';
                    overlay.innerHTML = highlightedContent.trim();

                    input.parentNode.style.position = 'relative'; // 确保父容器是相对定位
                    input.parentNode.appendChild(overlay);
                    input.classList.add('keyword-highlighted'); // 标记已处理过的输入框
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
                this.setupUpdateListener(inputs);
            }
        },

        getRequiredInputs: function() {
            const total = this.findInputByLabel('總額');
            const fee = this.findInputByLabel('附加費');
            const cost = this.findInputByLabel('總成本');
            return total && fee && cost ? { total, fee, cost } : null;
        },

        findInputByLabel: function(labelText) {
            // 改進搜索方法，支持多種不同的 DOM 結構
            let input = Array.from(document.querySelectorAll('input.svelte-1dwz7uz'))
            .find(input => {
                // 檢查當前節點、父節點和祖父節點的文本
                const parentText = input.parentNode ? input.parentNode.textContent : '';
                const grandParentText = input.parentNode && input.parentNode.parentNode ?
                      input.parentNode.parentNode.textContent : '';
                return parentText.includes(labelText) || grandParentText.includes(labelText);
            });

            return input;
        },

       createGPDisplay: function() {
           // 移除可能已存在的 GP 顯示元素
           const existingDisplay = document.querySelector('.gp-display');
           if (existingDisplay) {
               existingDisplay.remove();
           }

           // 尋找所有包含「總成本」文字的元素
           const elements = Array.from(document.querySelectorAll('*'));
           const costLabelElement = elements.find(el =>
                                                  el.textContent && el.textContent.includes('總成本')
                                                 );

           if (!costLabelElement) {
               console.error('找不到「總成本」標籤');
               return;
           }

           // 尋找與「總成本」相關的輸入框
           let costInput = null;

           // 1. 檢查是否有兄弟元素是輸入框
           let sibling = costLabelElement.nextElementSibling;
           while (sibling) {
               if (sibling.tagName === 'INPUT') {
                   costInput = sibling;
                   break;
               }
               sibling = sibling.nextElementSibling;
           }

           // 2. 如果沒找到，檢查父元素下的輸入框
           if (!costInput) {
               const parentInputs = costLabelElement.parentElement.querySelectorAll('input');
               if (parentInputs.length > 0) {
                   costInput = parentInputs[0];
               }
           }

           // 3. 如果還沒找到，嘗試查詢最接近的輸入框
           if (!costInput) {
               costInput = document.querySelector('input[placeholder*="成本"], input[name*="cost"], input[id*="cost"]');
           }

           if (!costInput) {
               console.error('找不到「總成本」輸入框');
               return;
           }

           // 創建 GP 顯示元素
           const container = document.createElement('div');
           container.className = 'gp-display';
           container.style.cssText = 'position: absolute; white-space: nowrap; z-index: 1000;';
           container.innerHTML = `GP：<span class="gp-value" style="color: green;">0.0</span>`;

           // 計算位置並設置
           const rect = costInput.getBoundingClientRect();
           container.style.left = (rect.right + 10) + 'px';
           container.style.top = (rect.top + window.scrollY + rect.height/2 - 10) + 'px';

           // 添加到文檔中
           document.body.appendChild(container);

           // 添加窗口 resize 和滾動事件監聽器來更新位置
           const updatePosition = () => {
               const newRect = costInput.getBoundingClientRect();
               container.style.left = (newRect.right + 10) + 'px';
               container.style.top = (newRect.top + window.scrollY + newRect.height/2 - 10) + 'px';
           };

           window.addEventListener('resize', updatePosition);
           window.addEventListener('scroll', updatePosition);

           // 保存引用以便後續更新
           this.gpDisplayElement = container;
           this.costInputElement = costInput;
       },

        setupUpdateListener: function(inputs) {
            const updateHandler = () => {
                try {
                    // 移除可能存在的千位分隔符，並轉換為數字
                    const total = parseFloat(inputs.total.value.replace(/,/g, '')) || 0;
                    const fee = parseFloat(inputs.fee.value.replace(/,/g, '')) || 0;
                    const cost = parseFloat(inputs.cost.value.replace(/,/g, '')) || 0;

                    // 計算 GP 值
                    const gpValue = total - fee - cost;

                    // 更新顯示
                    const display = document.querySelector('.gp-value');
                    if (display) {
                        display.textContent = gpValue.toFixed(1);
                        display.style.color = gpValue >= 0 ? 'green' : 'red';
                    }
                } catch (error) {
                    console.error("GP 計算出錯:", error);
                }
            };

            // 增加多種事件監聽以確保捕獲所有變化
            ['input', 'change', 'blur'].forEach(eventType => {
                [inputs.total, inputs.fee, inputs.cost].forEach(input => {
                    if (input) {
                        input.removeEventListener(eventType, updateHandler); // 避免重複添加
                        input.addEventListener(eventType, updateHandler);
                    }
                });
            });

            // 初始化計算一次
            updateHandler();

            // 添加備用定期更新機制
            setInterval(updateHandler, 2000);
        }
    };

    // 输入框宽度调整模块
    const widthAdjuster = {
        targetLabels: ['運費', '手續費', '雜費', '附加費', '總額', '總成本'],
        init: function () {
            this.targetLabels.forEach(label => {
                const input = this.findInputByLabel(label);
                if (input && !input.dataset.widthAdjusted) {
                    this.adjustWidth(input);
                    input.dataset.widthAdjusted = true;
                }
            });
        },

        findInputByLabel: function (label) {
            return Array.from(document.querySelectorAll('input.svelte-1dwz7uz'))
                .find(input => input.parentNode.textContent.includes(label));
        },

        adjustWidth: function (input) {
            const style = window.getComputedStyle(input);
            const baseWidth = parseFloat(style.width);
            if (!isNaN(baseWidth)) {
                input.style.width = `${baseWidth / 1.5}px`; // 调整宽度为原宽度的1.5倍
                input.style.minWidth = '';
                input.style.boxSizing = '';
            }
        }
    };

    // 主控制器
    const mainController = {
        init: function () {
            this.executeModules();

            new MutationObserver(() => this.executeModules())
                .observe(document.body, { childList: true, subtree: true });

            let retryCount = 0;
            const retryInterval = setInterval(() => {
                if (retryCount++ < 5) {
                    this.executeModules();
                } else {
                    clearInterval(retryInterval);
                }
            }, 500);
        },

        executeModules: function () {
            try {
                highlightModule.init();
                gpCalculator.init();
                widthAdjuster.init();
            } catch (error) {
                console.error('[Pegasus CS] 模块执行错误:', error);
            }
        }
    };

    if (document.readyState === 'complete') {
        mainController.init();
    } else {
        window.addEventListener('load', () => mainController.init());
    }
})();
