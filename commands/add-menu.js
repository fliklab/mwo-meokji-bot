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
    .setName('add-menu')
    .setDescription('메뉴를 추가해요.')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('추가할 메뉴 이름')
        .setRequired(true)
        .setMaxLength(50),
    )
    .addStringOption((option) =>
      option
        .setName('category')
        .setDescription('메뉴 카테고리 (선택)')
        .setRequired(false)
        .setMaxLength(30),
    ),

  async execute(interaction) {
    const name = interaction.options.getString('name', true).trim();
    const category = (interaction.options.getString('category') || '').trim();

    if (!name) {
      await interaction.reply({
        content: '메뉴 이름은 비어 있을 수 없어요.',
        ephemeral: true,
      });
      return;
    }

    const menus = readMenus();
    const exists = menus.some((menu) => menu.name.toLowerCase() === name.toLowerCase());

    if (exists) {
      await interaction.reply({
        content: `이미 있는 메뉴예요: ${name}`,
        ephemeral: true,
      });
      return;
    }

    menus.push({
      name,
      ...(category ? { category } : {}),
    });

    writeMenus(menus);

    await interaction.reply(`✅ 메뉴를 추가했어요: ${name}${category ? ` (${category})` : ''}`);
  },
};
