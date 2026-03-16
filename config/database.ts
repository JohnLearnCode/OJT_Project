import { MongoClient, Db, Collection, Document } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;
let isConnecting = false;

/**
 * Kết nối đến MongoDB
 */
export const connectDB = async (): Promise<Db> => {
  try {
    // Lấy thông tin kết nối từ environment variables
    const MONGODB_URI = process.env.MONGODB_URI;
    const DB_NAME = process.env.DB_NAME;

    if (!MONGODB_URI) {
      throw new Error('❌ MONGODB_URI không được định nghĩa trong file .env');
    }

    if (!DB_NAME) {
      throw new Error('❌ DB_NAME không được định nghĩa trong file .env');
    }

    // Nếu đã kết nối, trả về instance hiện tại
    if (db) {
      return db;
    }

    // Nếu đang kết nối, đợi
    if (isConnecting) {
      while (!db) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return db;
    }

    isConnecting = true;

    console.log('🔄 Đang kết nối đến MongoDB...');
    console.log(`📍 Host: ${MONGODB_URI.includes('mongodb.net') ? 'MongoDB Atlas' : 'Local MongoDB'}`);
    console.log(`📦 Database: ${DB_NAME}`);
    
    // Tạo MongoDB client nếu chưa có
    if (!client) {
      client = new MongoClient(MONGODB_URI);
    }
    
    // Kết nối đến MongoDB cluster
    await client.connect();
    
    // Lấy database instance
    db = client.db(DB_NAME);
    
    // Test connection bằng cách ping
    await db.admin().ping();
    
    console.log('✅ Kết nối MongoDB thành công!');
    
    isConnecting = false;
    return db;
    
  } catch (error: any) {
    isConnecting = false;
    console.error('❌ Lỗi kết nối MongoDB:', error.message);
    
    // Gợi ý lỗi thường gặp
    if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
      console.error('💡 Kiểm tra username/password trong MONGODB_URI');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('💡 Kiểm tra connection string và internet');
    } else if (error.message.includes('ETIMEDOUT') || error.message.includes('timed out')) {
      console.error('💡 Kiểm tra IP whitelist trong MongoDB Atlas Network Access');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('💡 MongoDB local chưa chạy hoặc MONGODB_URI sai');
    }
    
    throw error;
  }
};

/**
 * Lấy collection từ database
 */
export const getCollection = <T extends Document>(collectionName: string): Collection<T> => {
  if (!db) {
    throw new Error('Database chưa được kết nối. Gọi connectDB() trước.');
  }
  return db.collection<T>(collectionName);
};

/**
 * Đóng kết nối database
 */
export const closeDB = async (): Promise<void> => {
  try {
    if (client) {
      await client.close();
      db = null;
      console.log('✅ Đã đóng kết nối MongoDB');
    }
  } catch (error: any) {
    console.error('❌ Lỗi khi đóng kết nối:', error.message);
    throw error;
  }
};

/**
 * Lấy database instance (nếu đã kết nối)
 */
export const getDB = (): Db => {
  if (!db) {
    throw new Error('Database chưa được kết nối. Gọi connectDB() trước.');
  }
  return db;
};

// Xử lý đóng kết nối khi process kết thúc
process.on('SIGINT', async () => {
  await closeDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDB();
  process.exit(0);
});
