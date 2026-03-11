const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const MENUS_PATH = path.join(__dirname, '..', 'menus.json');

function readMenus() {
  const raw = fs.readFileSync(MENUS_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function writeMenus(menus) {
  fs.writeFileSync(MENUS_PATH, `${JSON.stringify(menus, null, 2)}\n`, 'utf8');
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('del-menu')
    .setDescription('메뉴를 삭제해요.')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('삭제할 메뉴 이름')
        .setRequired(true)
        .setMaxLength(50),
    ),

  async execute(interaction) {
    const name = interaction.options.getString('name', true).trim();

    if (!name) {
      await interaction.reply({
        content: '삭제할 메뉴 이름을 입력해 주세요.',
        ephemeral: true,
      });
      return;
    }

    const menus = readMenus();
    const index = menus.findIndex((menu) => menu.name.toLowerCase() === name.toLowerCase());

    if (index === -1) {
      await interaction.reply({
        content: `해당 메뉴를 찾지 못했어요: ${name}`,
        ephemeral: true,
      });
      return;
    }

    const [removed] = menus.splice(index, 1);
    writeMenus(menus);

    await interaction.reply(`🗑️ 메뉴를 삭제했어요: ${removed.name}`);
  },
};
