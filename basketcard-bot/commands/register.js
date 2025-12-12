// run: node commands/register.js
require('dotenv').config();
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v10');
const { SlashCommandBuilder } = require('@discordjs/builders');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID; // optional

if (!TOKEN || !CLIENT_ID) {
  console.error('Set DISCORD_TOKEN and CLIENT_ID in .env');
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName('open')
    .setDescription('Otwórz paczkę kart')
    .addStringOption(o => o.setName('pack').setDescription('standard, pro, allstar, limited'))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('event')
    .setDescription('Event system')
    .addSubcommand(s => s.setName('list').setDescription('Lista eventów'))
    .addSubcommand(s => s.setName('active').setDescription('Aktywne eventy'))
    .addSubcommand(s => s.setName('cards').setDescription('Limited dostępne teraz'))
    .addSubcommand(s => s.setName('start').setDescription('Włącz event').addStringOption(o => o.setName('name').setRequired(true)))
    .addSubcommand(s => s.setName('stop').setDescription('Wyłącz event').addStringOption(o => o.setName('name').setRequired(true)))
    .toJSON()
];

(async () => {
  const rest = new REST({ version: '10' }).setToken(TOKEN);
  try {
    console.log('Rejestruję komendy...');
    if (GUILD_ID) {
      await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
      console.log('Zarejestrowano komendy (GUILD).');
    } else {
      await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });
      console.log('Zarejestrowano komendy (GLOBAL).');
    }
  } catch (e) {
    console.error(e);
  }
})();
