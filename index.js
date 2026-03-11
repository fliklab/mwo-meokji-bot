require('dotenv').config();

const { Client, GatewayIntentBits, REST, Routes } = require('discord.js');

const token = process.env.TOKEN;

if (!token) {
  console.error('TOKEN is missing. Please set it in .env');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Slash command registration scaffold (REST 준비)
const rest = new REST({ version: '10' }).setToken(token);
const slashCommands = [];

async function registerSlashCommands({ applicationId, guildId } = {}) {
  if (!applicationId) {
    console.warn('Skip slash command registration: applicationId is missing.');
    return;
  }

  const route = guildId
    ? Routes.applicationGuildCommands(applicationId, guildId)
    : Routes.applicationCommands(applicationId);

  await rest.put(route, { body: slashCommands });
  console.log('✅ Slash commands registered.');
}

void registerSlashCommands({
  applicationId: process.env.APPLICATION_ID,
  guildId: process.env.GUILD_ID,
}).catch((error) => {
  console.error('❌ Failed to register slash commands:', error);
});

client.login(token).catch((error) => {
  console.error('❌ Login failed:', error);
  process.exit(1);
});
