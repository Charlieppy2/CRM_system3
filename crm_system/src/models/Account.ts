import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAccount extends Document {
  username: string;          // 用户名
  password: string;          // 密码 (加密后，用于验证)
  displayPassword: string;   // 明文密码 (用于管理界面显示)
  role: 'admin' | 'user' | 'trainer' | 'member';    // 角色：管理员、普通用户、教练、会员
  isActive: boolean;         // 账号是否激活
  locations: string[];       // 地区权限：['灣仔', '黃大仙', '石門']
  lastLogin?: Date;          // 最后登录时间
  
  // 会员专用字段
  memberName?: string;       // 会员真实姓名
  phone?: string;           // 电话号码
  email?: string;           // 邮箱地址
  quota?: number;           // 剩余配额
  
  createdAt: Date;
  updatedAt: Date;
  
  // 方法
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const AccountSchema: Schema = new Schema({
  username: {
    type: String,
    required: [true, '请提供用户名'],
    unique: true,
    trim: true,
    minLength: [3, '用户名至少需要3个字符'],
    maxLength: [50, '用户名不能超过50个字符']
  },
  password: {
    type: String,
    required: [true, '请提供密码'],
    minLength: [6, '密码至少需要6个字符']
  },
  displayPassword: {
    type: String,
    required: [true, '请提供显示密码'],
    minLength: [6, '密码至少需要6个字符']
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'trainer', 'member'],
    default: 'user',
    required: [true, '请指定用户角色']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  locations: {
    type: [String],
    enum: ['灣仔', '黃大仙', '石門'],
    default: []
  },
  lastLogin: {
    type: Date
  },
  
  // 会员专用字段
  memberName: {
    type: String,
    required: function(this: IAccount) {
      return this.role === 'member';
    },
    trim: true,
    maxLength: [100, '会员姓名不能超过100个字符']
  },
  phone: {
    type: String,
    required: function(this: IAccount) {
      return this.role === 'member';
    },
    trim: true,
    maxLength: [20, '电话号码不能超过20个字符']
  },
  email: {
    type: String,
    required: function(this: IAccount) {
      return this.role === 'member';
    },
    trim: true,
    lowercase: true,
    maxLength: [100, '邮箱地址不能超过100个字符'],
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请提供有效的邮箱地址']
  },
  quota: {
    type: Number,
    required: function(this: IAccount) {
      return this.role === 'member';
    },
    min: [0, '配额不能为负数'],
    default: 0
  }
}, {
  timestamps: true, // 自动添加 createdAt 和 updatedAt
  collection: 'account management' // 使用指定的 collection 名称
});

// 密码加密中间件
AccountSchema.pre<IAccount>('save', async function(next) {
  // 只在密码被修改时才加密
  if (!this.isModified('password')) return next();
  
  try {
    // 保存明文密码到displayPassword字段（如果还没有设置的话）
    if (!this.displayPassword) {
      this.displayPassword = this.password as string;
    }
    
    // 加密password字段用于验证
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password as string, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// 比较密码的方法
AccountSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// 创建索引（username已经通过unique自动创建索引）
AccountSchema.index({ role: 1 });
AccountSchema.index({ isActive: 1 });
AccountSchema.index({ memberName: 1 });
AccountSchema.index({ phone: 1 });
AccountSchema.index({ email: 1 });

// 删除现有模型（如果存在）并重新创建
if (mongoose.models.Account) {
  delete mongoose.models.Account;
}

export default mongoose.model<IAccount>('Account', AccountSchema); 