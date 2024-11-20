import axios from 'axios';

class DiscordBot {
  private static instance: DiscordBot;
  private readonly webhookUrl: string;

  private constructor() {
    this.webhookUrl = process.env.DISCORD_WEBHOOK_URL || '';
  }

  public static getInstance(): DiscordBot {
    if (!DiscordBot.instance) {
      DiscordBot.instance = new DiscordBot();
    }
    return DiscordBot.instance;
  }

  public async sendNotification(message: string, type: 'INFO' | 'WARNING' | 'ERROR' = 'INFO') {
    try {
      const colors = {
        INFO: 0x3498db,
        WARNING: 0xf1c40f,
        ERROR: 0xe74c3c
      };

      await axios.post(this.webhookUrl, {
        embeds: [{
          title: `Notification - ${type}`,
          description: message,
          color: colors[type],
          timestamp: new Date().toISOString(),
          footer: {
            text: 'AFy Forecast Bot'
          }
        }]
      });
    } catch (error) {
      console.error('Failed to send Discord notification:', error);
    }
  }

  public isReady(): boolean {
    return true;
  }

  public async pingBot(): Promise<string> {
    try {
      if (!this.webhookUrl) {
        return 'Bot tidak aktif: Webhook URL tidak ditemukan';
      }

      // Kirim ping message ke webhook
      await this.sendNotification('Ping test', 'INFO');
      return 'Bot aktif!';
    } catch (error) {
      console.error('Ping error:', error);
      return 'Bot tidak aktif: ' + (error instanceof Error ? error.message : 'Unknown error');
    }
  }

  public getStatus(): string {
    return this.webhookUrl ? 'Online' : 'Offline';
  }
}

export const discordBot = DiscordBot.getInstance();