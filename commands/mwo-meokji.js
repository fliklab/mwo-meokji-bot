const { SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const MENUS_PATH = path.join(__dirname, '..', 'menus.json');

function shuffleWithMathRandom(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function readMenus() {
  const raw = fs.readFileSync(MENUS_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mwo-meokji')
    .setDescription('메뉴 3개를 랜덤 추천해요.'),

  async execute(interaction) {
    const menus = readMenus();

    if (menus.length === 0) {
      await interaction.reply('추천할 메뉴가 없어요. `/add-menu`로 먼저 메뉴를 추가해 주세요.');
      return;
    }

    const picked = shuffleWithMathRandom(menus).slice(0, Math.min(3, menus.length));
    const lines = picked.map((item, idx) => `${idx + 1}. ${item.name}${item.category ? ` (${item.category})` : ''}`);

    await interaction.reply(`🍽️ 오늘의 추천 메뉴예요!\n${lines.join('\n')}`);
  },
};
