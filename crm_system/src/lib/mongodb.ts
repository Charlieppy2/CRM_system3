import mongoose from 'mongoose';

// 從環境變量獲取數據庫連接字符串，如果沒有則使用默認值
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://hung51607602:Qang86rejdSczeIB@cluster0.ugimcd0.mongodb.net/crm-system?retryWrites=true&w=majority&appName=Cluster0';

declare global {
  var mongoose: { conn: any; promise: any } | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  try {
    if (cached.conn) {
      console.log('使用緩存的數據庫連接');
      return cached.conn;
    }

    if (!cached.promise) {
      const opts = {
        bufferCommands: false,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      console.log('正在連接數據庫...');
      cached.promise = mongoose.connect(MONGODB_URI, opts);
    }

    cached.conn = await cached.promise;
    console.log('數據庫連接成功');
    return cached.conn;
  } catch (error) {
    console.error('數據庫連接失敗:', error);
    cached.promise = null;
    throw new Error(`數據庫連接失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
  }
}

export default connectDB; 