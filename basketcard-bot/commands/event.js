const { SlashCommandBuilder } = require('@discordjs/builders');
const { readJSON, writeJSON } = require('../utils/storage');
const path = require('path');
const { PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('event')
    .setDescription('Eventy (lista, active, cards, start, stop)')
    .addSubcommand(s => s.setName('list').setDescription('Lista eventów'))
    .addSubcommand(s => s.setName('active').setDescription('Aktywne eventy'))
    .addSubcommand(s => s.setName('cards').setDescription('Limited dostępne teraz'))
    .addSubcommand(s => s.setName('start').setDescription('Włącz event').addStringOption(o => o.setName('name').setRequired(true)))
    .addSubcommand(s => s.setName('stop').setDescription('Wyłącz event').addStringOption(o => o.setName('name').setRequired(true))),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();
    const cards = readJSON(path.join('data', 'cards.json'), []);
    const ev = readJSON(path.join('data', 'events.json'), { active_events: [] });

    if (sub === 'list') {
      const all = [...new Set(cards.filter(c => c.rarity === 'Limited' && c.event_required).map(c => c.event_required))];
      return interaction.reply({ content: `Eventy (zdefiniowane w kartach):\n${all.join('\n') || 'Brak'}`, ephemeral: true });
    }

    if (sub === 'active') {
      return interaction.reply({ content: `Aktywne eventy:\n${ev.active_events.join('\n') || 'Brak'}`, ephemeral: true });
    }

    if (sub === 'cards') {
      const pool = cards.filter(c => c.rarity === 'Limited' && ev.active_events.includes(c.event_required));
      return interaction.reply({ content: `Limited dostępne teraz:\n${pool.map(c => c.name).join('\n') || 'Brak'}`, ephemeral: true });
    }

    // admin actions
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({ content: 'Tylko admin może zarządzać eventami.', ephemeral: true });
    }

    const name = interaction.options.getString('name');
    if (sub === 'start') {
      if (!ev.active_events.includes(name)) ev.active_events.push(name);
      writeJSON(path.join('data', 'events.json'), ev);
      return interaction.reply({ content: `Event **${name}** włączony.` });
    }

    if (sub === 'stop') {
      ev.active_events = ev.active_events.filter(e => e !== name);
      writeJSON(path.join('data', 'events.json'), ev);
      return interaction.reply({ content: `Event **${name}** wyłączony.` });
    }
  }
};
