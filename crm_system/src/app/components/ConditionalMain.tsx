'use client';

import { usePathname } from 'next/navigation';
import React from 'react';
import { useSidebar } from '@/contexts/SidebarContext';

interface ConditionalMainProps {
  children: React.ReactNode;
}

export default function ConditionalMain({ children }: ConditionalMainProps) {
  const pathname = usePathname();
  const { isCollapsed, isMobile } = useSidebar();
  
  // 需要全屏布局的页面（不需要容器约束）
  const fullScreenPages = [
    '/login',
    '/unauthorized'
  ];
  
  // 检查当前页面是否需要全屏布局
  const isFullScreenPage = fullScreenPages.some(page => 
    pathname === page || pathname.startsWith(page + '/')
  );
  
  if (isFullScreenPage) {
    // 全屏页面：不添加容器约束和侧边栏边距
    return (
      <main 
        style={{
          transform: 'translateZ(0)',
          willChange: 'scroll-position'
        }}
      >
        {children}
      </main>
    );
  }
  
  // 计算左边距
  const getLeftMargin = () => {
    if (isMobile) {
      return 'ml-0'; // 移动端不需要边距
    }
    return isCollapsed ? 'ml-16' : 'ml-64';
  };
  
  // 普通页面：使用容器约束并添加侧边栏边距
  return (
    <main 
      className={`transition-all duration-300 ${getLeftMargin()}`}
      style={{
        transform: 'translateZ(0)',
        willChange: 'scroll-position'
      }}
    >
      <div className={`container mx-auto px-4 py-6 ${isMobile ? 'pt-16' : ''}`}>
        {children}
      </div>
    </main>
  );
} 