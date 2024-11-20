import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set } from 'firebase/database';
import { Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  databaseURL: process.env.FIREBASE_DATABASE_URL // Penting untuk Realtime Database
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

export class FirebaseRateLimiter {
  private readonly HOURLY_LIMIT = 10;
  private readonly DAILY_LIMIT = 50;
  private db = getDatabase(app);

  async checkUserLimit(userId: string): Promise<boolean> {
    const now = Date.now();
    const userRef = ref(this.db, `rateLimits/${userId}`);
    
    try {
      const snapshot = await get(userRef);
      const data = snapshot.val();
      
      if (!data) {
        // User baru, buat data baru
        await set(userRef, {
          hourlyCount: 1,
          dailyCount: 1,
          hourlyReset: now + (60 * 60 * 1000),
          dailyReset: now + (24 * 60 * 60 * 1000)
        });
        return true;
      }

      // Reset counter jika sudah lewat waktunya
      if (now >= data.hourlyReset) {
        data.hourlyCount = 0;
        data.hourlyReset = now + (60 * 60 * 1000);
      }

      if (now >= data.dailyReset) {
        data.dailyCount = 0;
        data.dailyReset = now + (24 * 60 * 60 * 1000);
      }

      // Cek limit
      if (data.hourlyCount >= this.HOURLY_LIMIT || 
          data.dailyCount >= this.DAILY_LIMIT) {
        return false;
      }

      // Update counter
      data.hourlyCount++;
      data.dailyCount++;
      await set(userRef, data);

      return true;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return true; // Fallback ke allow jika ada error
    }
  }

  async getRemainingTime(userId: string): Promise<number> {
    const snapshot = await get(ref(this.db, `rateLimits/${userId}`));
    const data = snapshot.val();
    
    if (!data) return 0;
    
    const now = Date.now();
    return Math.max(data.hourlyReset - now, 0);
  }
} 