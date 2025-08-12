import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';

// 获取账户列表（根据角色筛选）
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    
    let query: any = { isActive: true };
    if (role) {
      query.role = role;
    }
    
    const accounts = await Account.find(query)
      .select('-password') // 不返回密码字段
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      success: true,
      data: accounts
    });
  } catch (error) {
    console.error('获取账户列表失败:', error);
    return NextResponse.json(
      { success: false, message: '获取账户列表失败' },
      { status: 500 }
    );
  }
}

// 添加新账户
export async function POST(request: NextRequest) {
  try {
    const { username, password, role, locations, memberName, phone, email, quota } = await request.json();
    
    // 验证必填字段
    if (!username || !password || !role) {
      return NextResponse.json(
        { success: false, message: '账号名、密码和角色都是必填项' },
        { status: 400 }
      );
    }

    // 如果是会员角色，验证会员专用字段
    if (role === 'member') {
      if (!memberName || !phone || !email) {
        return NextResponse.json(
          { success: false, message: '会员账户需要提供姓名、电话和邮箱' },
          { status: 400 }
        );
      }

      // 验证邮箱格式
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!emailRegex.test(email)) {
        return NextResponse.json(
          { success: false, message: '请提供有效的邮箱地址' },
          { status: 400 }
        );
      }
    }
    
    // 验证地区权限（如果提供的话）
    const validLocations = ['灣仔', '黃大仙', '石門'];
    if (locations && Array.isArray(locations)) {
      const invalidLocations = locations.filter((loc: string) => !validLocations.includes(loc));
      if (invalidLocations.length > 0) {
        return NextResponse.json(
          { success: false, message: '包含无效的地区权限' },
          { status: 400 }
        );
      }
    }
    
    await connectDB();
    
    // 检查用户名是否已存在
    const existingAccount = await Account.findOne({ username });
    if (existingAccount) {
      return NextResponse.json(
        { success: false, message: '该账号名已存在' },
        { status: 400 }
      );
    }
    
    // 创建新账户
    const newAccountData: any = {
      username,
      password,
      displayPassword: password, // 保存明文密码用于显示
      role,
      isActive: true,
      locations: locations || [] // 地区权限，默认为空数组
    };

    // 如果是会员角色，添加会员专用字段
    if (role === 'member') {
      newAccountData.memberName = memberName;
      newAccountData.phone = phone;
      newAccountData.email = email;
      newAccountData.quota = quota || 0; // 默认配额为0
    }

    const newAccount = new Account(newAccountData);
    
    await newAccount.save();
    
    // 返回创建的账户信息（不包含加密密码）
    const accountData: any = {
      _id: newAccount._id,
      username: newAccount.username,
      role: newAccount.role,
      isActive: newAccount.isActive,
      locations: newAccount.locations,
      createdAt: newAccount.createdAt,
      updatedAt: newAccount.updatedAt
    };

    // 如果是会员，添加会员字段到返回数据
    if (newAccount.role === 'member') {
      accountData.memberName = newAccount.memberName;
      accountData.phone = newAccount.phone;
      accountData.email = newAccount.email;
      accountData.quota = newAccount.quota;
    }
    
    return NextResponse.json({
      success: true,
      message: '账户创建成功',
      data: accountData
    });
  } catch (error) {
    console.error('创建账户失败:', error);
    return NextResponse.json(
      { success: false, message: '创建账户失败' },
      { status: 500 }
    );
  }
} 