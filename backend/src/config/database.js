import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/easyTest';

export const connectDatabase = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ MongoDB连接成功');
    console.log(`📊 数据库: ${mongoose.connection.name}`);
    console.log(`🔗 连接地址: ${MONGODB_URI}`);
    
    // 监听连接事件
    mongoose.connection.on('error', (error) => {
      console.error('❌ MongoDB连接错误:', error);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB连接断开');
    });
    
    // 优雅关闭
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔄 MongoDB连接已关闭');
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error);
    process.exit(1);
  }
};

export default connectDatabase; 