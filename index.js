require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');

const token = process.env.TOKEN;

if (!token) {
  console.error('TOKEN is missing. Please set it in .env');
  process.exit(1);
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith('.js'));

const slashCommands = [];

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  if (!command.data || !command.execute) {
    console.warn(`Skip invalid command module: ${file}`);
    continue;
  }

  client.commands.set(command.data.name, command);
  slashCommands.push(command.data.toJSON());
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = client.commands.get(interaction.commandName);

  if (!command) {
    await interaction.reply({
      content: '알 수 없는 명령어예요.',
      ephemeral: true,
    });
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ Command failed (${interaction.commandName}):`, error);

    const errorReply = {
      content: '명령어 실행 중 오류가 발생했어요.',
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(errorReply);
    } else {
      await interaction.reply(errorReply);
    }
  }
});

const rest = new REST({ version: '10' }).setToken(token);

async function registerSlashCommands({ applicationId, guildId } = {}) {
  if (!applicationId) {
    console.warn('Skip slash command registration: applicationId is missing.');
    return;
  }

  const route = guildId
    ? Routes.applicationGuildCommands(applicationId, guildId)
    : Routes.applicationCommands(applicationId);

  await rest.put(route, { body: slashCommands });
  console.log(`✅ Slash commands registered: ${slashCommands.length}개`);
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
