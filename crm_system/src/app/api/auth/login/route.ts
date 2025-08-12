import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';
import { generateToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { username, password } = await request.json();

    // 验证输入
    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: '请提供用户名和密码' },
        { status: 400 }
      );
    }

    // 查找用户
    const user = await Account.findOne({ 
      username: username.toLowerCase().trim(),
      isActive: true 
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 验证密码
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, message: '用户名或密码错误' },
        { status: 401 }
      );
    }

    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();

    // 生成JWT token
    const token = generateToken({
      userId: (user._id as any).toString(),
      username: user.username,
      role: user.role,
    });

    // 创建响应
    const response = NextResponse.json({
      success: true,
      message: '登录成功',
      user: {
        id: (user._id as any).toString(),
        username: user.username,
        role: user.role,
        locations: user.locations || [],
        lastLogin: user.lastLogin,
      },
    });

    // 设置cookie
    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7天
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('登录错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
} 