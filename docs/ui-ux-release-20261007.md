# UI/UX 릴리스 및 격리 Preview 배포 기록

2026-10-07 기준. 운영 전환 전 검증 기록이며 운영 배포 완료 보고서가 아니다.

## 소스와 배포

- 브랜치: `codex/ui-ux-release-20261007` (GitHub 푸시).
- UI/기존 운영 소스 선별 통합: `82d5794`.
- 원격 main `24d1ebf` 병합 및 시공관리 연동 보존: `b8cba67`.
- Preview: https://ebook-sample-book-preview.tubebluemoon.workers.dev/
- Preview Worker 버전: `73ba5399-2c82-45f5-8518-2315364c6276`.
- 운영의 기존 버전(복귀 기준): `12c6400b-aa7a-44b1-b305-f7f576ddcaf4`.
- 별도 Preview D1에 두 마이그레이션 적용 성공. 운영 DB에는 마이그레이션을 실행하지 않았다.
- Preview에는 R2를 연결하지 않는다. POST/PUT/DELETE 이미지 요청 차단. 운영 이미지 데이터가 없으므로 일부 카드의 이미지 없음은 예상 결과이다.

## 검증

타입 검사와 Vite production 빌드 통과. Vitest 23개 파일/83개 테스트 통과. 대형 청크 경고는 남아 있다.

| Preview 점검 | HTTP |
|---|---|
| `/` | 200 |
| `/api/auth/me` | 200 |
| `/api/product-images` | 200 |
| `/api/auth/google/start` | 503: OAuth 미설정 |
| 이미지 POST | 403: Preview 쓰기 차단 |

## 백업 및 복구 기준

로컬 비공개 경로 `.release-private/20261007/`는 Git에서 제외했다. 전체 스키마와 영속 데이터만 백업하며 로그인 세션/OAuth 시도 데이터는 복구하지 않는다. SQLite quick_check 및 foreign_key_check 통과. 계정 1개, 멤버십 1개, 이미지 메타데이터 962개, 이미지 버전 962개가 운영 조회 건수와 일치했다. R2 이미지 본문은 변경하지 않았다.

- `schema.sql` SHA256: `A700BBBB6EAA02B68DAA5B9CF991065A407EF5A78E4EB6BBB174242DB79253A7`.
- `recovery-data.sql` SHA256: `E8DA7F36F81723422EB24443ED41473FA986519588865C14307AF17EFC7C01D7`.
- 복구 검사 스크립트: 같은 비공개 폴더의 `verify-recovery.mjs`.

## 남은 Google OAuth 설정과 운영 전환

1. E-샘플북 Google Cloud 프로젝트에 Preview용 웹 OAuth 클라이언트를 준비한다. 전용 클라이언트를 권장하며 운영 키를 코드나 채팅에 복사하지 않는다.
2. 승인된 리디렉션 URI에 다음을 등록한다:
   `https://ebook-sample-book-preview.tubebluemoon.workers.dev/api/auth/google/callback`
3. Cloudflare의 **ebook-sample-book-preview** Worker 설정에 `GOOGLE_CLIENT_ID`, Worker Secret `GOOGLE_CLIENT_SECRET`을 저장한다. **ebook-sample-book 운영 Worker와 혼동하지 않는다.**
4. Preview에서 지정 관리자 계정으로 실제 로그인하여 서버 인증된 사용자/소유자 권한과 로그아웃을 확인한다. 비관리자 거부와 미인증 변경 거부도 확인한다.
5. 검증 성공 후 원격 main 변경 여부를 재확인하고 릴리스 브랜치를 main에 반영하여 운영 배포한다. 대시보드 변수·비밀키를 보존하며 Preview 설정을 운영에 적용하지 않는다.
6. 운영에서 화면/이미지 조회·미인증 변경 거부·관리자 로그인·로그아웃을 재확인한다. 실패 시 위 운영 버전으로 복귀하고 DB 복구는 필요한 경우에만 별도 검토한다.

현재 실제 OAuth 로그인 검증은 미완료다. building-google-team-auth의 격리 로그인 검증 게이트에 따라 운영 전환을 보류한다.

## 정식 릴리스 기준 및 기존 이미지 표시 추가

사용자 요청에 따라 Preview의 UI/UX를 정식 배포판의 구현 기준으로 유지한다. 운영 반영 시에는 Preview 프록시가 아닌 기존 `server/sites.ts`와 운영 D1/R2 설정을 사용한다. 운영 주소 유지 방향을 안내했으며 주소 변경 자체는 수행하지 않았다.

Preview 이미지 조회는 운영의 공개 이미지 API에만 읽기 전용으로 연결했다. 목록 및 검증된 원본/썸네일 경로만 허용하고 쿠키·인증 헤더·쿼리를 전달하지 않는다. 리디렉션도 따르지 않는다. 관리자 사용량 조회는 운영으로 전달하지 않는다. 업로드/삭제 차단과 별도 D1, R2 미바인딩을 유지한다.

- 최신 Preview 버전: `7622be38-7e31-4748-b412-025fcc72396a`.
- 실제 조회: 이미지 962개, 썸네일 GET 200, Preview 이미지 POST 403.
- 타입 검사 통과, 전체 회귀 테스트 23개 파일/87개 통과.
- 실제 브라우저에서 스케치 15053-1 카드 이미지 표시 확인. 캡처: `design-review-20261007/preview-server-images.png` (상위 작업공간).
- Cloudflare의 동일 영역 Worker 공개 호출에 필요한 `global_fetch_strictly_public` 호환성 설정을 Preview에만 적용했다. 근거: https://developers.cloudflare.com/workers/observability/errors/ 및 https://developers.cloudflare.com/workers/runtime-apis/fetch/
- 운영 Worker, DB, R2 객체, 관리자 로그인 설정은 변경하지 않았다. 정식 운영 배포는 격리 로그인 검증 후 진행한다.
