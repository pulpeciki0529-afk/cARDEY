const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Client, GatewayIntentBits, Collection } = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) { console.error('DISCORD_TOKEN not set in .env'); process.exit(1); }
const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// load commands
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath)) {
  if (!file.endsWith('.js')) continue;
  const cmd = require(path.join(commandsPath, file));
  if (cmd && cmd.data && cmd.execute) client.commands.set(cmd.data.name, cmd);
}

client.once('ready', () => {
  console.log(`Bot ready: ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;
  try {
    await cmd.execute(interaction);
  } catch (err) {
    console.error('Command error', err);
    try {
      if (interaction.replied || interaction.deferred) await interaction.followUp({ content: 'Błąd podczas wykonania komendy.', ephemeral: true });
      else await interaction.reply({ content: 'Błąd podczas wykonania komendy.', ephemeral: true });
    } catch(e){ console.error('Reply error', e); }
  }
});

client.login(TOKEN);
