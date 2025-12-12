const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { readJSON, writeJSON } = require('../utils/storage');
const path = require('path');

const shopItems = [
  { name: 'Standard Pack', type: 'pack', pack: 'standard', cost: 500, currency: 'coins', description: 'Otwórz paczkę standard' },
  { name: 'Pro Pack', type: 'pack', pack: 'pro', cost: 1500, currency: 'coins', description: 'Otwórz paczkę pro' },
  { name: 'All-Star Pack', type: 'pack', pack: 'allstar', cost: 3000, currency: 'coins', description: 'Otwórz paczkę allstar' },
  { name: 'Limited Pack', type: 'pack', pack: 'limited', cost: 5, currency: 'tokens', description: 'Otwórz paczkę limited (eventy)' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('shop')
    .setDescription('Pokaż sklep i kupuj paczki / itemy'),

  async execute(interaction) {
    const uid = interaction.user.id;
    const users = readJSON(path.join('data', 'users.json'), {});
    users[uid] = users[uid] || { coins: 0, tokens: 0, inventory: [], items: {} };

    const embed = new EmbedBuilder()
      .setTitle('🏀 BasketCard Shop')
      .setDescription('Kliknij przycisk aby kupić paczkę lub item')
      .setColor('Green');

    shopItems.forEach(item => {
      embed.addFields({ name: `${item.name} - ${item.cost} ${item.currency}`, value: item.description });
    });

    const row = new ActionRowBuilder();
    shopItems.forEach((item, index) => {
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`buy_${index}`)
          .setLabel(item.name)
          .setStyle(ButtonStyle.Primary)
      );
    });

    await interaction.reply({ embeds: [embed], components: [row] });

    const collector = interaction.channel.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async i => {
      if (i.user.id !== uid) return i.reply({ content: 'To nie Twoje przyciski!', ephemeral: true });

      const index = parseInt(i.customId.split('_')[1]);
      const item = shopItems[index];

      if (users[uid][item.currency] < item.cost) {
        return i.reply({ content: `Nie masz wystarczająco ${item.currency} aby kupić ${item.name}`, ephemeral: true });
      }

      users[uid][item.currency] -= item.cost;

      if (item.type === 'pack') {
        // dodaj pack do inventory jakby był kupiony
        users[uid].inventory.push({ name: `${item.name} (Kupiony)`, rarity: 'Purchased' });
      } else if (item.type === 'item') {
        users[uid].items[item.id] = (users[uid].items[item.id] || 0) + 1;
      }

      writeJSON(path.join('data', 'users.json'), users);
      await i.reply({ content: `Kupiłeś **${item.name}** za ${item.cost} ${item.currency}!`, ephemeral: true });
    });
  }
};
