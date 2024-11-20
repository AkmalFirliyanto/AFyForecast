interface AlertConfig {
  type: 'INFO' | 'WARNING' | 'ERROR';
  message: string;
  details?: any;
}

export async function sendDiscordAlert({ type, message, details }: AlertConfig) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const color = {
    INFO: 3447003,     // Biru
    WARNING: 16776960, // Kuning
    ERROR: 15158332    // Merah
  }[type];

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: `AFy Forecast ${type}`,
          description: message,
          color: color,
          fields: details ? Object.entries(details).map(([key, value]) => ({
            name: key,
            value: JSON.stringify(value),
            inline: true
          })) : [],
          timestamp: new Date().toISOString()
        }]
      })
    });
  } catch (error) {
    console.error('Failed to send Discord alert:', error);
  }
} 