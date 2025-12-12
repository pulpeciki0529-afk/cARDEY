const { SlashCommandBuilder } = require('@discordjs/builders');
const { readJSON, writeJSON } = require('../utils/storage');
const path = require('path');

const packDefs = {
  standard: { count: 3, weights: { Common: 80, Uncommon: 10, Rare: 7, Epic: 3 } },
  pro: { count: 5, weights: { Rare: 50, Epic: 35, Legendary: 15 } },
  allstar: { count: 7, weights: { Epic: 40, Legendary: 40, Mythic: 20 } },
  limited: { count: 3, weights: { Epic: 50, Legendary: 30, Mythic: 15, Limited: 5 } }
};

function rollRarity(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [k, w] of entries) {
    if (r < w) return k;
    r -= w;
  }
  return entries[0][0];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('open')
    .setDescription('Otwórz paczkę kart')
    .addStringOption(o => o.setName('pack').setDescription('standard, pro, allstar, limited')),

  async execute(interaction) {
    await interaction.deferReply();
    const packName = (interaction.options.getString('pack') || 'standard').toLowerCase();
    const def = packDefs[packName] || packDefs['standard'];

    const cards = readJSON(path.join('data', 'cards.json'), []);
    const events = readJSON(path.join('data', 'events.json'), { active_events: [] });
    const users = readJSON(path.join('data', 'users.json'), {});

    // cooldown
    const COOLDOWN = parseInt(process.env.OPEN_COOLDOWN_SECONDS || '10', 10);
    const uid = interaction.user.id;
    users[uid] = users[uid] || { lastOpen: 0, coins: 0, inventory: [] };
    const now = Date.now();
    if (now - (users[uid].lastOpen || 0) < COOLDOWN * 1000) {
      return interaction.editReply({ content: `Odczekaj jeszcze ${Math.ceil((COOLDOWN*1000 - (now - users[uid].lastOpen))/1000)}s zanim otworzysz paczkę.` });
    }

    users[uid].lastOpen = now;

    const results = [];
    for (let i = 0; i < def.count; i++) {
      let rarity = rollRarity(def.weights);
      if (rarity === 'Limited') {
        const pool = cards.filter(c => c.rarity === 'Limited' && events.active_events.includes(c.event_required));
        if (pool.length === 0) rarity = 'Mythic';
        else { results.push(pool[Math.floor(Math.random()*pool.length)]); continue; }
      }
      const pool = cards.filter(c => c.rarity === rarity);
      if (pool.length === 0) results.push(cards[Math.floor(Math.random()*cards.length)]);
      else results.push(pool[Math.floor(Math.random()*pool.length)]);
    }

    // give some coins
    users[uid].coins = (users[uid].coins || 0) + Math.floor(Math.random()*50)+10;
    // add cards to inventory (store only name + rarity to keep small)
    for (const c of results) users[uid].inventory.push({ name: c.name, rarity: c.rarity });

    writeJSON(path.join('data', 'users.json'), users);

    const text = results.map(r => `${r.name} (${r.rarity})`).join('\n');
    await interaction.editReply({ content: `Otworzyłeś paczkę **${packName}**:\n${text}` });
  }
};
