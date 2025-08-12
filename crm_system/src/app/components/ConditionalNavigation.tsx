'use client';

import { usePathname } from 'next/navigation';
import Navigation from './Navigation';

export default function ConditionalNavigation() {
  const pathname = usePathname();
  
  // 不显示导航栏的页面列表
  const hideNavigationPages = [
    '/login',
    '/unauthorized'
  ];
  
  // 检查当前页面是否应该隐藏导航栏
  const shouldHideNavigation = hideNavigationPages.some(page => 
    pathname === page || pathname.startsWith(page + '/')
  );
  
  // 如果需要隐藏导航栏，返回null
  if (shouldHideNavigation) {
    return null;
  }
  
  // 否则显示导航栏
  return <Navigation />;
} 