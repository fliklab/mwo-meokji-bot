const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const repoPath = path.join(__dirname, '..');
const cliPath = path.join(repoPath, 'cli-mwo-meokji.js');
const menusPath = path.join(repoPath, 'menus.json');

const originalMenus = fs.readFileSync(menusPath, 'utf8');

function runCli(args = [], input = '') {
  return spawnSync('node', [cliPath, ...args], {
    cwd: repoPath,
    input,
    encoding: 'utf8',
  });
}

afterEach(() => {
  fs.writeFileSync(menusPath, originalMenus, 'utf8');
});

describe('cli-mwo-meokji', () => {
  test('mwo는 3개 추천을 출력한다', () => {
    const result = runCli(['mwo']);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('오늘의 추천 메뉴예요!');

    const lines = result.stdout
      .split('\n')
      .filter((line) => /^\d+\.\s/.test(line.trim()));

    expect(lines).toHaveLength(3);
  });

  test('add는 메뉴를 추가한다', () => {
    const result = runCli(['add', '떡볶이', '분식']);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('메뉴를 추가했어요: 떡볶이 (분식)');

    const menus = JSON.parse(fs.readFileSync(menusPath, 'utf8'));
    expect(menus.some((m) => m.name === '떡볶이' && m.category === '분식')).toBe(true);
  });

  test('del은 메뉴를 삭제한다', () => {
    fs.writeFileSync(
      menusPath,
      JSON.stringify(
        [
          { name: '피자', category: '양식' },
          { name: '우동', category: '일식' },
        ],
        null,
        2,
      ) + '\n',
      'utf8',
    );

    const result = runCli(['del', '우동']);

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('메뉴를 삭제했어요: 우동');

    const menus = JSON.parse(fs.readFileSync(menusPath, 'utf8'));
    expect(menus.some((m) => m.name === '우동')).toBe(false);
  });
});
