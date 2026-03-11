# 뭐먙지 Discord/CLI/Web Bot.

뭐먙지 Discord/CLI/Web Bot입니다. (Node.js + discord.js v14)

## 1) 설치

### npm
```bash
npm install
```

### yarn
```bash
yarn install
```

## 2) 환경 변수 설정

`.env.example`를 복사해서 `.env`를 만드세요.

```bash
cp .env.example .env
```

`.env` 예시:

```env
TOKEN=your_discord_bot_token
APPLICATION_ID=your_discord_application_id
GUILD_ID=optional_for_guild_register
```

- `TOKEN`: 디스코드 봇 토큰 (필수)
- `APPLICATION_ID`: 애플리케이션(봇) ID (권장, 명령어 등록용)
- `GUILD_ID`: 특정 서버에만 빠르게 명령어 등록할 때 사용 (선택)

## 3) 실행

```bash
npm start
```

또는

```bash
yarn start
```

실행 시:
- 봇 로그인
- 슬래시 명령어 등록 시도 (`APPLICATION_ID`가 있을 때)

## 4) 명령어 예시

예: `/menu`

응답 예시(Embed):

- **title**: 오늘 뭐 먹지?
- **description**: 랜덤 메뉴를 추천해드릴게요.
- **fields**:
  - 카테고리: 한식
  - 추천 메뉴: 제육볶음

## 5) 로컬 Mock 테스트 (TOKEN 없이)

실제 디스코드 접속 없이 기본 동작을 콘솔에서 점검할 수 있습니다.

```bash
MOCK_TEST=true node index.js
```

테스트 항목:
- 유효한 명령 실행 경로
- 없는 명령어 처리
- 명령 실행 에러 처리

## 6) 문제 해결

- `TOKEN is missing` 오류: `.env`에 `TOKEN` 설정 필요
- 슬래시 명령어 미등록: `APPLICATION_ID` 확인
- 특정 서버에서만 빠른 테스트: `GUILD_ID` 설정 후 실행
