require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, REST, Routes } = require('discord.js');

function runMockTests() {
  const results = [];

  function makeFakeInteraction(commandName) {
    return {
      commandName,
      replied: false,
      deferred: false,
      isChatInputCommand: () => true,
      async reply(payload) {
        this.replied = true;
        results.push({
          test: `${commandName}:reply`,
          ok: true,
          payload,
        });
      },
      async followUp(payload) {
        results.push({
          test: `${commandName}:followUp`,
          ok: true,
          payload,
        });
      },
    };
  }

  async function runInteraction(interaction, commands) {
    if (!interaction.isChatInputCommand()) return;

    const command = commands.get(interaction.commandName);

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
      await interaction.reply({
        content: '명령어 실행 중 오류가 발생했어요.',
        ephemeral: true,
      });
      results.push({
        test: `${interaction.commandName}:error-handling`,
        ok: true,
        error: error?.message || String(error),
      });
    }
  }

  const mockCommands = new Map();
  mockCommands.set('ok', {
    async execute(interaction) {
      await interaction.reply({ content: 'OK', ephemeral: true });
    },
  });

  mockCommands.set('boom', {
    async execute() {
      throw new Error('mock command failure');
    },
  });

  const tests = [
    { name: 'valid-command', interaction: makeFakeInteraction('ok') },
    { name: 'unknown-command', interaction: makeFakeInteraction('unknown') },
    { name: 'error-command', interaction: makeFakeInteraction('boom') },
  ];

  return Promise.all(
    tests.map(async (t) => {
      try {
        await runInteraction(t.interaction, mockCommands);
        results.push({ test: t.name, ok: true });
      } catch (error) {
        results.push({
          test: t.name,
          ok: false,
          error: error?.message || String(error),
        });
      }
    })
  ).then(() => {
    console.log('[MOCK_TEST] results:', JSON.stringify(results, null, 2));
    const failed = results.filter((r) => r.ok === false);
    if (failed.length > 0) {
      process.exitCode = 1;
    }
  });
}

if (process.env.MOCK_TEST === 'true') {
  void runMockTests();
  return;
}

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
let commandFiles = [];

try {
  commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
} catch (error) {
  console.error('❌ Failed to read commands directory:', error);
  process.exit(1);
}

const slashCommands = [];

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);

  try {
    const command = require(filePath);

    if (!command.data || !command.execute) {
      console.warn(`Skip invalid command module: ${file}`);
      continue;
    }

    client.commands.set(command.data.name, command);
    slashCommands.push(command.data.toJSON());
  } catch (error) {
    console.error(`❌ Failed to load command module (${file}):`, error);
  }
}

client.once('ready', () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  try {
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
  } catch (error) {
    console.error('❌ interactionCreate handler failed:', error);
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

  try {
    await rest.put(route, { body: slashCommands });
    console.log(`✅ Slash commands registered: ${slashCommands.length}개`);
  } catch (error) {
    console.error('❌ Failed to register slash commands:', error);
    throw error;
  }
}

void registerSlashCommands({
  applicationId: process.env.APPLICATION_ID,
  guildId: process.env.GUILD_ID,
}).catch(() => {
  // already logged
});

client.login(token).catch((error) => {
  console.error('❌ Login failed:', error);
  process.exit(1);
});
