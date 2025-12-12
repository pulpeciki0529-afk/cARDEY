const { SlashCommandBuilder } = require('discord.js');
const { readJSON, writeJSON } = require('../utils/storage');
const path = require('path');

// --- KONFIGURACJA NAGRODY ---
const HOURLY_COINS_MIN = 50;
const HOURLY_COINS_MAX = 150;
const HOURLY_TOKENS_MIN = 0;
const HOURLY_TOKENS_MAX = 1;
const HOURLY_COOLDOWN_MS = 60 * 60 * 1000; // 1 godzina
// -------------------------------

module.exports = {
  data: new SlashCommandBuilder()
    .setName('drop_hourly')
    .setDescription('Odbierz nagrodę co godzinę'),

  async execute(interaction) {
    const uid = interaction.user.id;
    const users = readJSON(path.join('data', 'users.json'), {});
    users[uid] = users[uid] || { coins: 0, tokens: 0, inventory: [], items: {}, lastHourly: 0 };

    const now = Date.now();
    if (now - (users[uid].lastHourly || 0) < HOURLY_COOLDOWN_MS) {
      const leftMin = Math.ceil((HOURLY_COOLDOWN_MS - (now - users[uid].lastHourly)) / 1000 / 60);
      return interaction.reply({ content: `⏳ Już odebrałeś nagrodę godzinową! Spróbuj za ${leftMin} minut.`, ephemeral: true });
    }

    const coinsReward = Math.floor(Math.random() * (HOURLY_COINS_MAX - HOURLY_COINS_MIN + 1)) + HOURLY_COINS_MIN;
    const tokensReward = Math.floor(Math.random() * (HOURLY_TOKENS_MAX - HOURLY_TOKENS_MIN + 1)) + HOURLY_TOKENS_MIN;

    users[uid].coins += coinsReward;
    users[uid].tokens += tokensReward;
    users[uid].lastHourly = now;

    writeJSON(path.join('data', 'users.json'), users);
    return interaction.reply({ content: `✅ Otrzymałeś **${coinsReward} coins** i **${tokensReward} tokens** z nagrody godzinowej!` });
  }
};
