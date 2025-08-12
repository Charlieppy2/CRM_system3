import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Account from '@/models/Account';

// 获取单个账户的详细信息
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const account = await Account.findById(id);
    
    if (!account) {
      return NextResponse.json(
        { success: false, message: '账户不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        _id: account._id,
        username: account.username,
        password: account.displayPassword || account.password, // 显示明文密码用于管理
        role: account.role,
        isActive: account.isActive,
        locations: account.locations,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        lastLogin: account.lastLogin
      }
    });
  } catch (error) {
    console.error('获取账户详情失败:', error);
    return NextResponse.json(
      { success: false, message: '获取账户详情失败' },
      { status: 500 }
    );
  }
}

// 删除账户
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const account = await Account.findById(id);
    
    if (!account) {
      return NextResponse.json(
        { success: false, message: '账户不存在' },
        { status: 404 }
      );
    }
    
    // 删除账户
    await Account.findByIdAndDelete(id);
    
    return NextResponse.json({
      success: true,
      message: '账户删除成功',
      data: {
        _id: account._id,
        username: account.username,
        role: account.role
      }
    });
  } catch (error) {
    console.error('删除账户失败:', error);
    return NextResponse.json(
      { success: false, message: '删除账户失败' },
      { status: 500 }
    );
  }
}

// 更新账户
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const { username, password, locations } = await request.json();
    
    // 验证输入
    if (!username || username.trim().length < 3) {
      return NextResponse.json(
        { success: false, message: '用户名至少需要3个字符' },
        { status: 400 }
      );
    }
    
    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: '密码至少需要6个字符' },
        { status: 400 }
      );
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
    
    const account = await Account.findById(id);
    
    if (!account) {
      return NextResponse.json(
        { success: false, message: '账户不存在' },
        { status: 404 }
      );
    }
    
    // 检查用户名是否已存在（排除当前账户）
    const existingAccount = await Account.findOne({ 
      username: username.trim(),
      _id: { $ne: id }
    });
    
    if (existingAccount) {
      return NextResponse.json(
        { success: false, message: '用户名已存在' },
        { status: 400 }
      );
    }
    
    // 更新账户信息
    account.username = username.trim();
    account.password = password;
    account.displayPassword = password; // 保存明文密码用于显示
    
    // 更新地区权限（如果提供的话）
    if (locations !== undefined) {
      account.locations = locations;
    }
    
    await account.save();
    
    return NextResponse.json({
      success: true,
      message: '账户更新成功',
      data: {
        _id: account._id,
        username: account.username,
        password: account.displayPassword || account.password,
        role: account.role,
        isActive: account.isActive,
        locations: account.locations,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt,
        lastLogin: account.lastLogin
      }
    });
  } catch (error) {
    console.error('更新账户失败:', error);
    return NextResponse.json(
      { success: false, message: '更新账户失败' },
      { status: 500 }
    );
  }
} 