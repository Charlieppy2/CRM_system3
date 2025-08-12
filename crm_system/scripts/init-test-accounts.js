const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 连接数据库
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_system');
    console.log('✅ MongoDB 连接成功');
  } catch (error) {
    console.error('❌ MongoDB 连接失败:', error);
    process.exit(1);
  }
};

// 定义 Account Schema
const AccountSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minLength: 3,
    maxLength: 50
  },
  password: {
    type: String,
    required: true,
    minLength: 6
  },
  displayPassword: {
    type: String,
    required: true,
    minLength: 6
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'trainer', 'member'],
    default: 'user',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date
  }
});

// 密码加密中间件
AccountSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    if (!this.displayPassword) {
      this.displayPassword = this.password;
    }
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const Account = mongoose.model('Account', AccountSchema);

// 测试账户数据
const testAccounts = [
  {
    username: 'admin',
    password: 'password123',
    displayPassword: 'password123',
    role: 'admin'
  },
  {
    username: 'trainer1',
    password: 'trainer123',
    displayPassword: 'trainer123',
    role: 'trainer'
  },
  {
    username: 'trainer2',
    password: 'trainer456',
    displayPassword: 'trainer456',
    role: 'trainer'
  },
  {
    username: 'member1',
    password: 'member123',
    displayPassword: 'member123',
    role: 'member'
  },
  {
    username: 'member2',
    password: 'member456',
    displayPassword: 'member456',
    role: 'member'
  }
];

// 初始化测试账户
const initTestAccounts = async () => {
  try {
    console.log('🚀 开始初始化测试账户...');

    for (const accountData of testAccounts) {
      // 检查账户是否已存在
      const existingAccount = await Account.findOne({ username: accountData.username });
      
      if (existingAccount) {
        console.log(`⚠️ 账户 ${accountData.username} 已存在，跳过创建`);
        continue;
      }

      // 创建新账户
      const newAccount = new Account(accountData);
      await newAccount.save();
      
      console.log(`✅ 创建 ${accountData.role} 账户: ${accountData.username}`);
    }

    console.log('\n🎉 测试账户初始化完成！');
    console.log('\n📋 可用测试账户：');
    console.log('┌─────────────┬─────────────┬─────────────┐');
    console.log('│   用户名    │    密码     │    角色     │');
    console.log('├─────────────┼─────────────┼─────────────┤');
    console.log('│ admin       │ password123 │ 管理員      │');
    console.log('│ trainer1    │ trainer123  │ 教練        │');
    console.log('│ trainer2    │ trainer456  │ 教練        │');
    console.log('│ member1     │ member123   │ 會員        │');
    console.log('│ member2     │ member456   │ 會員        │');
    console.log('└─────────────┴─────────────┴─────────────┘');
    console.log('\n🔐 权限说明：');
    console.log('• 管理員：可以访问所有功能');
    console.log('• 教練：只能访问首頁和出席管理');
    console.log('• 會員：权限配置中');

  } catch (error) {
    console.error('❌ 初始化测试账户失败:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n📴 数据库连接已断开');
  }
};

// 运行脚本
const run = async () => {
  await connectDB();
  await initTestAccounts();
};

run().catch(console.error); 