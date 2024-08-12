# discord_bot_dt

## 버전

1.0.2 (2024-08-12)


## 업데이트 내용

### 1.0.1 (2024-08-12)

- `commands/shop/bdoshop.js`에서 아이템 검색 기능 개선
- `commands/utility/help.js`에서 명령어 목록 업데이트
  - `execute` 함수에서 명령어 목록 응답 기능 추가
- `commands/utility/tts.js`에서 텍스트 음성 변환 기능 추가 및 개선
  - `reduceRepeatedChars` 함수 추가
  - `extractUserName` 함수 추가 : [임시] 등의 괄호 내부 문자를 제외한 유저명 반환
  - `AudioPlayerStatus.Idle` 이벤트 핸들러에서 파일 삭제 및 큐 재생 기능 추가
  - `speed` tts속도설정 명렁어를 통한 재생속도 변경 기능 추가
- 로그 기능 추가 및 개선
  - `logs.js`에서 로그 메시지 포맷 및 파일 경로 설정
  - `info`, `error`, `warn`, `duplicate` 함수 추가
  - 로그 파일 경로 설정 및 로그 메시지 저장 기능 추가
  - 로그 파일(DB)로 변경

### 1.0.0 (2024-08-11)
- 초기 릴리스
- `commands/utility/tts.js`에서 텍스트 음성 변환 기능 약간의 개선
- 아이템 ID 검색 기능 추가 (`bdoShop`)
  - `index.js`에서 `interactionCreate` 이벤트 핸들러 추가
  - 버튼 상호작용 처리 로직 추가
  - `interaction.customId`를 이용한 아이템 ID 추출 및 응답 기능 추가
- tts 기능 추가(`tts.js`)
- 도움말 설정
- 개발환경 설정

### 개발자
@YooByWk


## 사용된 라이브러리 및 라이선스

- **@discordjs/voice@0.17.0**: MIT License
- **axios@1.7.3**: MIT License
- **discord.js@14.15.3**: Apache License 2.0
- **dotenv@16.4.5**: BSD-2-Clause License
- **ffmpeg-static@5.2.0**: MIT License
- **fluent-ffmpeg@2.1.3**: MIT License
- **gtts@0.2.1**: MIT License
- **SQLite**: Public Domain