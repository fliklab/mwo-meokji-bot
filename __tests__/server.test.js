const fs = require('node:fs');
const path = require('node:path');
const { app } = require('../server');

const menusPath = path.join(__dirname, '..', 'menus.json');
const originalMenus = fs.readFileSync(menusPath, 'utf8');

let server;
let baseUrl;

beforeAll((done) => {
  server = app.listen(0, () => {
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

afterEach(() => {
  fs.writeFileSync(menusPath, originalMenus, 'utf8');
});

describe('web server api', () => {
  test('GET /recommend returns embed-like JSON with 3 menus', async () => {
    const res = await fetch(`${baseUrl}/recommend`);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(data.embeds)).toBe(true);
    expect(Array.isArray(data.menus)).toBe(true);
    expect(data.menus.length).toBe(3);
  });

  test('POST /add-menu adds a new menu', async () => {
    const res = await fetch(`${baseUrl}/add-menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '비빔국수', category: '한식' }),
    });
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.message).toContain('메뉴를 추가했어요: 비빔국수 (한식)');

    const menus = JSON.parse(fs.readFileSync(menusPath, 'utf8'));
    expect(menus.some((m) => m.name === '비빔국수' && m.category === '한식')).toBe(true);
  });

  test('POST /del-menu deletes a menu', async () => {
    fs.writeFileSync(
      menusPath,
      `${JSON.stringify([{ name: '칼국수', category: '한식' }], null, 2)}\n`,
      'utf8',
    );

    const res = await fetch(`${baseUrl}/del-menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '칼국수' }),
    });

    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.message).toContain('메뉴를 삭제했어요: 칼국수');

    const menus = JSON.parse(fs.readFileSync(menusPath, 'utf8'));
    expect(menus).toHaveLength(0);
  });
});
