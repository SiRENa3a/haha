// ==UserScript==
// @name         Pegasus 首页优化增强版
// @version      1.2.6
// @author       Jason
// @updateURL https://github.com/SiRENa3a/haha/raw/refs/heads/main/Pegasus%20%E9%A6%96%E9%A1%B5%E4%BC%98%E5%8C%96%E5%A2%9E%E5%BC%BA%E7%89%88.user.js
// @downloadURL https://github.com/SiRENa3a/haha/raw/refs/heads/main/Pegasus%20%E9%A6%96%E9%A1%B5%E4%BC%98%E5%8C%96%E5%A2%9E%E5%BC%BA%E7%89%88.user.js
// @description  禁用輪播組件，確保穩定運行
// @match        https://shop.pegasus.hk/
// @exclude      https://shop.pegasus.hk/portal/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pegasus.hk
// @grant        unsafeWindow
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // 第一階段：搶占式樣式注入
    const antiFlickerCSS = `
        swiper-container,
        swiper-slide,
        [class*="carousel"],
        [class*="swiper"],
        /* 新增屏蔽區域 */
        .container.svelte-vc3ghx,
        section.home-product.svelte-1x9eh70,
        section.home-hot.svelte-1x9eh70 {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            opacity: 0 !important;
            pointer-events: none !important;
        }
    `;
    document.head.appendChild(document.createElement('style')).textContent = antiFlickerCSS;

    // 第二階段：防御性 DOM 監控
    const observer = new MutationObserver(mutations => {
        mutations.forEach(mutation => {
            // 靜態節點移除
            const unwantedElements = [...mutation.addedNodes].filter(node =>
                node.nodeType === 1 && (
                    node.matches('swiper-container, swiper-slide, .container.svelte-vc3ghx, section.home-product.svelte-1x9eh70, section.home-hot.svelte-1x9eh70') ||
                    node.classList?.contains('swiper') ||
                    node.classList?.contains('carousel')
                )
            );

            unwantedElements.forEach(el => {
                el.parentNode?.removeChild(el);
                console.log('[DOM監控] 移除元素:', el);
            });

            // 動態屬性防護
            const dynamicTargets = [
                '.container.svelte-vc3ghx',
                'section.home-product.svelte-1x9eh70',
                'section.home-hot.svelte-1x9eh70'
            ];
            if (mutation.type === 'attributes' && dynamicTargets.some(selector =>
                mutation.target.matches(selector)
            )) {
                mutation.target.remove();
            }
        });
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'data-svelte-h']
    });

    // 第三階段：運行時防護
    const disableSwiperInitialization = () => {
        Object.defineProperty(unsafeWindow, 'Swiper', {
            get: () => undefined,
            set: () => console.warn('[Swiper] 初始化被阻止'),
            configurable: false
        });

        // 增強清理週期
        setInterval(() => {
            const targets = [
                '.swiper-container', '.swiper-wrapper',
                '.container.svelte-vc3ghx',
                'section.home-product.svelte-1x9eh70',
                'section.home-hot.svelte-1x9eh70'
            ];
            document.querySelectorAll(targets.join(',')).forEach(el => el.remove());
        }, 800);
    };

    // 第四階段：加載可靠性保障
    const initGuard = () => {
        disableSwiperInitialization();

        let retryCount = 0;
        const guardCheck = setInterval(() => {
            if (retryCount++ > 12) clearInterval(guardCheck);

            const elements = document.querySelectorAll(`
                swiper-container, swiper-slide,
                .container.svelte-vc3ghx,
                section.home-product.svelte-1x9eh70,
                section.home-hot.svelte-1x9eh70
            `);
            if (elements.length > 0) {
                elements.forEach(el => el.remove());
                console.log(`[重試機制] 第${retryCount}次清理殘留元素`);
            }
        }, 250);
    };

    // 第五階段：網絡層攔截
    const originalCreateElement = document.createElement.bind(document);
    document.createElement = function(tagName, options) {
        const element = originalCreateElement(tagName, options);
        if (tagName.toLowerCase() === 'script') {
            element.addEventListener('load', () => {
                const blockedResources = [
                    'swiper', 'home-product', 'home-hot'
                ];
                if (blockedResources.some(keyword => element.src.includes(keyword))) {
                    console.log('[腳本攔截] 阻止相關腳本運行:', element.src);
                    element.remove();
                }
            });
        }
        return element;
    };

    // Cookie 過期日期設定函數
    function setCookie(cName, cValue, expDays) {
        let date = new Date();
        date.setTime(date.getTime() + (expDays * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = cName + "=" + cValue + "; " + expires + "; path=/";
    }

    // 執行入口
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initGuard);
        setCookie('popUpNotShow', 'true', 999999);
    } else {
        initGuard();
        setCookie('popUpNotShow', 'true', 999999);
    }
})();
