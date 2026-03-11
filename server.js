const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;
const MENUS_PATH = path.join(__dirname, 'menus.json');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function readMenus() {
  const raw = fs.readFileSync(MENUS_PATH, 'utf8');
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed) ? parsed : [];
}

function writeMenus(menus) {
  fs.writeFileSync(MENUS_PATH, `${JSON.stringify(menus, null, 2)}\n`, 'utf8');
}

function shuffle(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickThreeMenus() {
  const menus = readMenus();
  return shuffle(menus).slice(0, Math.min(3, menus.length));
}

function formatMenuLine(menu, idx) {
  return `${idx + 1}. ${menu.name}${menu.category ? ` (${menu.category})` : ''}`;
}

app.get('/recommend', (req, res) => {
  const picked = pickThreeMenus();

  if (picked.length === 0) {
    return res.status(404).json({
      content: '추천할 메뉴가 없어요. 먼저 메뉴를 추가해 주세요.',
      embeds: [
        {
          title: '🍽️ 오늘의 추천 메뉴',
          description: '추천할 메뉴가 없습니다.',
          color: 15158332,
        },
      ],
      menus: [],
    });
  }

  return res.json({
    content: '🍽️ 오늘의 추천 메뉴예요!',
    embeds: [
      {
        title: '🍽️ 오늘의 추천 메뉴',
        description: picked.map(formatMenuLine).join('\n'),
        color: 5763719,
      },
    ],
    menus: picked,
  });
});

app.post('/add-menu', (req, res) => {
  const name = (req.body?.name || '').trim();
  const category = (req.body?.category || '').trim();

  if (!name) {
    return res.status(400).json({ message: 'name은 필수입니다.' });
  }

  const menus = readMenus();
  const exists = menus.some((menu) => menu.name.toLowerCase() === name.toLowerCase());

  if (exists) {
    return res.status(409).json({ message: `이미 있는 메뉴예요: ${name}` });
  }

  const newMenu = {
    name,
    ...(category ? { category } : {}),
  };

  menus.push(newMenu);
  writeMenus(menus);

  return res.status(201).json({
    message: `메뉴를 추가했어요: ${name}${category ? ` (${category})` : ''}`,
    menu: newMenu,
  });
});

app.post('/del-menu', (req, res) => {
  const name = (req.body?.name || '').trim();

  if (!name) {
    return res.status(400).json({ message: 'name은 필수입니다.' });
  }

  const menus = readMenus();
  const index = menus.findIndex((menu) => menu.name.toLowerCase() === name.toLowerCase());

  if (index === -1) {
    return res.status(404).json({ message: `해당 메뉴를 찾지 못했어요: ${name}` });
  }

  const [removed] = menus.splice(index, 1);
  writeMenus(menus);

  return res.json({ message: `메뉴를 삭제했어요: ${removed.name}`, menu: removed });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Web server listening on http://localhost:${PORT}`);
  });
}

module.exports = { app, readMenus, writeMenus, pickThreeMenus };
