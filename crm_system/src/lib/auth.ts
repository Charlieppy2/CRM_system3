import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

// JWT密钥，在生产环境中应该使用环境变量
const JWT_SECRET = process.env.JWT_SECRET || 'crm_system_secret_key_2024';

export interface TokenPayload {
  userId: string;
  username: string;
  role: 'admin' | 'user' | 'trainer' | 'member';
}

// 生成JWT token
export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '7d', // 7天过期
  });
}

// 验证JWT token
export function verifyToken(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

// 从请求中获取token
export function getTokenFromRequest(request: NextRequest): string | null {
  // 首先从Authorization header中获取
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 从cookie中获取
  const token = request.cookies.get('auth_token')?.value;
  return token || null;
}

// 验证用户是否已登录
export function getAuthUser(request: NextRequest): TokenPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  
  return verifyToken(token);
}

// 检查用户是否有管理员权限
export function isAdmin(user: TokenPayload | null): boolean {
  return user?.role === 'admin';
}

// 公开路由列表（不需要认证的路由）
export const PUBLIC_ROUTES = [
  '/login',
  '/api/auth',
];

// 检查路径是否是公开路由
export function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(route => pathname.startsWith(route));
}

// 检查路径是否需要认证（除了公开路由，其他都需要认证）
export function isProtectedRoute(pathname: string): boolean {
  // 如果是公开路由，则不需要保护
  if (isPublicRoute(pathname)) {
    return false;
  }
  
  // 所有其他路由都需要认证
  return true;
} 