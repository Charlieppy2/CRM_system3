import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // 获取认证用户
    const authUser = getAuthUser(request);
    
    if (!authUser) {
      return NextResponse.json(
        { success: false, message: '未登录' },
        { status: 401 }
      );
    }

    await connectDB();

    // 从数据库获取最新的用户信息
    const user = await Account.findById(authUser.userId).select('-password');
    
    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: '用户不存在或已禁用' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: (user._id as any).toString(),
        username: user.username,
        role: user.role,
        locations: user.locations || [],
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
} 