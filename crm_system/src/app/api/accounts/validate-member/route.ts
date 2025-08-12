import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const searchParams = request.nextUrl.searchParams;
    const name = searchParams.get('name');
    const contact = searchParams.get('contact');

    if (!name || !contact) {
      return NextResponse.json({
        success: false,
        message: '请提供会员姓名和联系方式'
      }, { status: 400 });
    }

    // 根据姓名和联系方式查找会员
    // 这里我们同时检查phone和email字段
    const member = await Account.findOne({
      role: 'member',
      memberName: name,
      $or: [
        { phone: contact },
        { email: contact }
      ]
    });

    if (!member) {
      return NextResponse.json({
        success: false,
        message: '找不到匹配的会员记录'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        _id: member._id,
        username: member.username,
        memberName: member.memberName,
        phone: member.phone,
        email: member.email,
        quota: member.quota,
        isActive: member.isActive
      },
      message: '会员验证成功'
    });

  } catch (error: any) {
    console.error('验证会员失败:', error);
    return NextResponse.json({
      success: false,
      message: '验证会员时出错',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    }, { status: 500 });
  }
} 