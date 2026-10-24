import { Pool } from 'pg';

export let db: Pool | null = null;

export const connect_DB = async (): Promise<Pool> => {
    console.log('🔌 Connecting to the database...');
    console.log('User:', process.env.DB_USER);
    console.log('Password:', process.env.DB_PASSWORD);
    console.log('Host:', process.env.DB_HOST);
    console.log('Database:', process.env.DB_NAME);
    console.log('Port:', process.env.DB_PORT);
    try{
        db = new Pool ({
            max: 50,
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            port: parseInt(process.env.DB_PORT || '5432'),  
        });

        db.on('error', (err) => {
            console.error('⚠️ Unexpected error on idle pg client:', err.message);
        });

        const client = await db.connect();
        console.log('✅ Connected to the database successfully!');
        
        client.release(); // คืนระบบเชื่อมต่อกลับเข้า Pool เพื่อให้คนอื่นใช้ต่อได้
        return db;
    }catch (error) {
        console.error('❌ Error connecting to the database:', error);
        throw error;
    }
};