import { useEffect } from 'react';

/**
 * 滚动性能优化Hook
 * 用于优化页面滚动性能和减少卡顿
 */
export function useScrollOptimization() {
  useEffect(() => {
    // 启用被动事件监听器以提升滚动性能
    const enablePassiveEvents = () => {
      let passiveSupported = false;
      
      try {
        const options = {
          get passive() {
            passiveSupported = true;
            return false;
          }
        } as EventListenerOptions;
        
        const testFunc = () => {};
        window.addEventListener('test' as any, testFunc, options);
        window.removeEventListener('test' as any, testFunc);
      } catch (err) {
        passiveSupported = false;
      }
      
      return passiveSupported;
    };

    const isPassiveSupported = enablePassiveEvents();

    // 优化滚动事件
    const optimizeScrollEvents = () => {
      let ticking = false;
      
      const updateScrollState = () => {
        // 更新滚动相关的状态
        ticking = false;
      };
      
      const onScroll = () => {
        if (!ticking) {
          requestAnimationFrame(updateScrollState);
          ticking = true;
        }
      };

      // 添加优化的滚动监听器
      document.addEventListener(
        'scroll', 
        onScroll, 
        isPassiveSupported ? { passive: true } : false
      );

      return () => {
        document.removeEventListener('scroll', onScroll);
      };
    };

         // 强制硬件加速
     const enableHardwareAcceleration = () => {
       const style = document.createElement('style');
       style.textContent = `
         /* 为所有可能导致重绘的元素启用硬件加速 */
         .container,
         .max-w-7xl,
         .mx-auto,
         .shadow-lg,
         .rounded-lg,
         .bg-white {
           transform: translateZ(0);
           backface-visibility: hidden;
           -webkit-backface-visibility: hidden;
         }
         
         /* 优化过渡动画 */
         .transition-all,
         .transition-colors,
         .transition-shadow,
         .transition-transform {
           will-change: auto;
         }
         
         /* 优化hover效果 */
         .nav-link:hover,
         .shadow-lg:hover,
         button:hover,
         a:hover {
           will-change: box-shadow, background-color;
         }
       `;
       document.head.appendChild(style);
       
       return () => {
         if (document.head.contains(style)) {
           document.head.removeChild(style);
         }
       };
     };

    // 应用优化
    const cleanupScroll = optimizeScrollEvents();
    const cleanupAcceleration = enableHardwareAcceleration();

    // 清理函数
    return () => {
      cleanupScroll();
      cleanupAcceleration();
    };
  }, []);
}

/**
 * 组件级别的性能优化
 */
export function useComponentOptimization() {
  useEffect(() => {
    // 为当前组件启用硬件加速
    const element = document.querySelector('[data-component-optimized]');
    if (element) {
      (element as HTMLElement).style.transform = 'translateZ(0)';
      (element as HTMLElement).style.backfaceVisibility = 'hidden';
    }
  }, []);
  
  return {
    // 返回优化的样式属性
    optimizedStyle: {
      transform: 'translateZ(0)',
      backfaceVisibility: 'hidden' as const,
      WebkitBackfaceVisibility: 'hidden' as const,
    }
  };
} 