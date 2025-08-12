import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';

interface Params {
  id: string;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<Params> }) {
  try {
    await connectDB();

    const { id } = await params;
    const { quota } = await request.json();

    // 验证输入
    if (typeof quota !== 'number' || quota < 0) {
      return NextResponse.json({
        success: false,
        message: '配额必须是非负数'
      }, { status: 400 });
    }

    // 查找并更新账户
    const account = await Account.findById(id);
    
    if (!account) {
      return NextResponse.json({
        success: false,
        message: '账户不存在'
      }, { status: 404 });
    }

    // 检查是否为会员账户
    if (account.role !== 'member') {
      return NextResponse.json({
        success: false,
        message: '只能更新会员账户的配额'
      }, { status: 400 });
    }

    // 更新配额
    account.quota = quota;
    await account.save();

    return NextResponse.json({
      success: true,
      data: account,
      message: '配额更新成功'
    });

  } catch (error: any) {
    console.error('更新配额失败:', error);
    return NextResponse.json({
      success: false,
      message: '更新配额失败',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
} 