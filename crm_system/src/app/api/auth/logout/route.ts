import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // 创建响应
    const response = NextResponse.json({
      success: true,
      message: '注销成功',
    });

    // 清除cookie
    response.cookies.set('auth_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0, // 立即过期
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('注销错误:', error);
    return NextResponse.json(
      { success: false, message: '服务器内部错误' },
      { status: 500 }
    );
  }
} 