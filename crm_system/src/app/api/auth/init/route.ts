import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';

export async function POST() {
  try {
    await connectDB();

    // 检查是否已存在管理员账号
    const existingAdmin = await Account.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      return NextResponse.json({
        success: true,
        message: '管理员账号已存在',
        alreadyExists: true,
      });
    }

    // 创建默认管理员账号
    const adminAccount = new Account({
      username: 'admin',
      password: 'password123', // 密码会自动加密
      role: 'admin',
      isActive: true,
    });

    await adminAccount.save();

    return NextResponse.json({
      success: true,
      message: '默认管理员账号创建成功',
      account: {
        username: 'admin',
        role: 'admin',
      },
    });
  } catch (error) {
    console.error('初始化账号错误:', error);
    return NextResponse.json(
      { success: false, message: '创建管理员账号失败' },
      { status: 500 }
    );
  }
} 