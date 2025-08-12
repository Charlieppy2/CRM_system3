const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 数据库连接URI
const MONGODB_URI = 'mongodb+srv://hung51607602:Qang86rejdSczeIB@cluster0.ugimcd0.mongodb.net/crm-system?retryWrites=true&w=majority&appName=Cluster0';

// 账号Schema（复制自Account.ts）
const AccountSchema = new mongoose.Schema({
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
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
    required: [true, '请指定用户角色']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  collection: 'account management'
});

// 密码加密中间件
AccountSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

const Account = mongoose.model('Account', AccountSchema);

async function initializeAdmin() {
  try {
    console.log('正在连接数据库...');
    await mongoose.connect(MONGODB_URI);
    console.log('数据库连接成功');

    // 检查是否已存在管理员账号
    const existingAdmin = await Account.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('管理员账号已存在:');
      console.log(`用户名: ${existingAdmin.username}`);
      console.log(`角色: ${existingAdmin.role}`);
      console.log(`创建时间: ${existingAdmin.createdAt}`);
      return;
    }

    // 创建默认管理员账号
    console.log('正在创建默认管理员账号...');
    const adminAccount = new Account({
      username: 'admin',
      password: 'password123',
      role: 'admin',
      isActive: true,
    });

    await adminAccount.save();
    console.log('✅ 默认管理员账号创建成功！');
    console.log('登录信息:');
    console.log('用户名: admin');
    console.log('密码: password123');
    console.log('角色: 管理员');
  } catch (error) {
    console.error('❌ 初始化失败:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('数据库连接已关闭');
  }
}

// 运行初始化
initializeAdmin(); 