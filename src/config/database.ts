import { DataSource } from 'typeorm';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create TypeORM data source
export const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    entities: [path.join(__dirname, '../entities/**/*.{ts,js}')],
    migrations: [path.join(__dirname, '../migrations/**/*.{ts,js}')],
    synchronize: process.env.NODE_ENV === 'production' ? true : false, // 自動スキーマ作成（本番は非推奨）
    logging: process.env.NODE_ENV !== 'production',
    ssl: process.env.DB_SSL === 'true', // 必要に応じて SSL を有効化
});

/*
postgres起動コマンド(PowerShell)
pg_ctl start -D "C:\Program Files\PostgreSQL\15\data"

*/

// Initialize database connection
export const initializeDatabase = async (): Promise<void> => {
    try {
        await AppDataSource.initialize();
        console.log('Database connection established successfully');
    } catch (error) {
        console.error('Error connecting to database:', error);
        throw error;
    }
};
