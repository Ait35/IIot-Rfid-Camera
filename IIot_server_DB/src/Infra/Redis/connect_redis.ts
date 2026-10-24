import 'dotenv/config';
import { createClient } from 'redis';

const redis = createClient({
    url : process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD || 'admin'
});

redis.on('error', (err) => console.error('Redis Client Error', err));

export default redis;