import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // 跳过静态资源和API路由
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // 获取认证token
  const token = request.cookies.get('auth_token')?.value;
  const hasValidToken = token && token.split('.').length === 3;

  // 如果是登录页面
  if (pathname === '/login') {
    // 已登录用户访问登录页，重定向到主页
    if (hasValidToken) {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // 未登录用户可以访问登录页
    return NextResponse.next();
  }

  // 其他所有页面都需要认证
  if (!hasValidToken) {
    // 添加自定义响应头作为执行证据
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.headers.set('X-Middleware-Executed', 'true');
    return response;
  }

  // 已登录用户可以访问其他页面
  const response = NextResponse.next();
  response.headers.set('X-Middleware-Executed', 'true');
  return response;
}

export const config = {
  matcher: [
    /*
     * 匹配所有路径，除了：
     * 1. /api 路由
     * 2. /_next (Next.js内部文件)
     * 3. 静态文件 (包含文件扩展名)
     */
    '/((?!api|_next|favicon.ico).*)',
  ],
}; 