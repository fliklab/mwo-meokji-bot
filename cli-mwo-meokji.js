#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { Command } = require('commander');
const inquirer = require('inquirer');

const MENUS_PATH = path.join(__dirname, 'menus.json');

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

function formatPicked(picked) {
  return picked
    .map((item, idx) => `${idx + 1}. ${item.name}${item.category ? ` (${item.category})` : ''}`)
    .join('\n');
}

function recommend(prefix = '🍽️ 오늘의 추천 메뉴예요!') {
  const menus = readMenus();

  if (menus.length === 0) {
    console.log('추천할 메뉴가 없어요. add 명령으로 메뉴를 먼저 추가해 주세요.');
    return;
  }

  const picked = shuffle(menus).slice(0, Math.min(3, menus.length));
  console.log(`${prefix}\n${formatPicked(picked)}`);
}

async function addMenu(nameArg, categoryArg) {
  let name = (nameArg || '').trim();
  let category = (categoryArg || '').trim();

  if (!name) {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '추가할 메뉴 이름을 입력해 주세요:',
      },
      {
        type: 'input',
        name: 'category',
        message: '카테고리(선택):',
      },
    ]);
    name = (answer.name || '').trim();
    category = (answer.category || '').trim();
  }

  if (!name) {
    console.log('메뉴 이름은 비어 있을 수 없어요.');
    return;
  }

  const menus = readMenus();
  const exists = menus.some((menu) => menu.name.toLowerCase() === name.toLowerCase());

  if (exists) {
    console.log(`이미 있는 메뉴예요: ${name}`);
    return;
  }

  menus.push({
    name,
    ...(category ? { category } : {}),
  });
  writeMenus(menus);

  console.log(`✅ 메뉴를 추가했어요: ${name}${category ? ` (${category})` : ''}`);
}

async function delMenu(nameArg) {
  let name = (nameArg || '').trim();

  if (!name) {
    const menus = readMenus();

    if (menus.length === 0) {
      console.log('삭제할 메뉴가 없어요.');
      return;
    }

    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'name',
        message: '삭제할 메뉴를 선택해 주세요:',
        choices: menus.map((menu) => menu.name),
      },
    ]);

    name = (answer.name || '').trim();
  }

  if (!name) {
    console.log('삭제할 메뉴 이름을 입력해 주세요.');
    return;
  }

  const menus = readMenus();
  const index = menus.findIndex((menu) => menu.name.toLowerCase() === name.toLowerCase());

  if (index === -1) {
    console.log(`해당 메뉴를 찾지 못했어요: ${name}`);
    return;
  }

  const [removed] = menus.splice(index, 1);
  writeMenus(menus);

  console.log(`🗑️ 메뉴를 삭제했어요: ${removed.name}`);
}

const program = new Command();

program.name('cli-mwo-meokji').description('뭐 먹지 CLI').version('1.0.0');

program.command('mwo').description('메뉴 3개 추천').action(() => recommend());

program.command('다시').description('메뉴 3개 다시 추천').action(() => recommend('🔄 다시 골라봤어요!'));

program
  .command('add [name] [category]')
  .description('메뉴 추가')
  .action(async (name, category) => {
    await addMenu(name, category);
  });

program
  .command('del [name]')
  .description('메뉴 삭제')
  .action(async (name) => {
    await delMenu(name);
  });

program.parseAsync(process.argv);

module.exports = {
  readMenus,
  writeMenus,
  recommend,
  addMenu,
  delMenu,
};
