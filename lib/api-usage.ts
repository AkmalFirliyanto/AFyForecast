import { sendDiscordAlert } from "./notifications";

interface APIUsageStats {
  totalRequests: number;
  totalCost: number;
  requestsByEndpoint: Record<string, number>;
}

export class APIUsageTracker {
  private static instance: APIUsageTracker;
  private usageStats: APIUsageStats = {
    totalRequests: 0,
    totalCost: 0,
    requestsByEndpoint: {}
  };

  // Cost per request (dalam USD)
  private readonly COST_PER_REQUEST = 0.0001;
  
  // Budget harian (dalam USD)
  private readonly DAILY_BUDGET = 1;

  private constructor() {
    // Reset stats setiap hari
    setInterval(this.resetDailyStats.bind(this), 24 * 60 * 60 * 1000);
  }

  static getInstance(): APIUsageTracker {
    if (!APIUsageTracker.instance) {
      APIUsageTracker.instance = new APIUsageTracker();
    }
    return APIUsageTracker.instance;
  }

  async trackRequest(endpoint: string): Promise<boolean> {
    this.usageStats.totalRequests++;
    this.usageStats.requestsByEndpoint[endpoint] = 
      (this.usageStats.requestsByEndpoint[endpoint] || 0) + 1;
    
    const newCost = this.usageStats.totalRequests * this.COST_PER_REQUEST;
    
    // Cek budget
    if (newCost > this.DAILY_BUDGET) {
      await sendDiscordAlert({
        type: 'WARNING',
        message: 'Daily API budget exceeded!',
        details: this.usageStats
      });
      return false;
    }
    
    this.usageStats.totalCost = newCost;
    return true;
  }

  private resetDailyStats() {
    this.usageStats = {
      totalRequests: 0,
      totalCost: 0,
      requestsByEndpoint: {}
    };
  }

  getStats(): APIUsageStats {
    return { ...this.usageStats };
  }
} 