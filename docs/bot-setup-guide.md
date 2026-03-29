# Discord 봇 생성 및 서버 초대 가이드

## 1. 봇 생성

[Discord Developer Portal](https://discord.com/developers/applications)에서 **New Application**을 클릭하여 봇을 생성합니다.

![봇 생성](https://github.com/user-attachments/assets/3adfbc38-2d21-43e1-89b5-e85d3e264f62)

## 2. Bot 토큰 발급

**Bot** 탭에서 **Reset Token**을 클릭하여 토큰을 발급합니다. 토큰은 생성 시 한 번만 볼 수 있으니 바로 `.env` 파일에 저장하세요.

![토큰 발급](https://github.com/user-attachments/assets/569c0b9f-cffe-4022-8442-70c03c8594f5)

## 3. Privileged Gateway Intents 활성화

**Bot** 탭 하단의 **Privileged Gateway Intents**에서 아래 토글을 활성화합니다:

- **Server Members Intent** — 서버 멤버 이벤트 수신에 필요
- **Message Content Intent** — 메시지 내용 읽기에 필요

![권한 설정](https://github.com/user-attachments/assets/59ba7141-ae20-4dfb-8019-77aeb22fc6b6)

## 4. OAuth2 초대 URL 생성

**OAuth2 > URL Generator**에서:

1. Scopes: `bot`, `applications.commands` 체크
2. Bot Permissions: `Send Messages` 체크
3. 하단에 생성된 URL을 복사

![URL 생성](https://github.com/user-attachments/assets/2473e2bb-988b-4f54-8a26-6b4914bb0d87)

## 5. 서버에 초대

복사한 URL을 브라우저에 붙여넣고, 초대할 서버를 선택하여 봇을 추가합니다.

![서버 초대](https://github.com/user-attachments/assets/636702ad-0d1f-4549-a780-557fe59e49a9)
