# 쇼룸 운영 배포 기록

- 운영: https://ebook-sample-book.tubebluemoon.workers.dev/showroom
- Worker 버전: `edbb1387-b6b5-429e-a7b5-57e7da41eb22`
- 복귀 기준: `d10c15e9-f4e6-4696-a065-d0c55bacbb29`
- 프런트엔드: `index-CTO7OrK0.js`
- 명령: `wrangler deploy --config wrangler.jsonc --keep-vars`

## 반영 사항

주방 싱크대(상부장·하부장), 현관 신발장(문·서라운드 몰딩) 기본 사진과 알파 마스크 등록. 해당 사진은 필름 전용 채널만 제공. 원본 밝기를 분석한 명암·자연광 레이어 합성. 선택·찜 자재의 중복 없는 목록과 출처 배지 제공. 앞서 구현한 영림 패턴 카테고리 직결 UI도 포함.

## 검증과 데이터 보호

- 타입 검사, 테스트 103개, production 빌드 성공. 기존 대형 청크 경고 유지.
- 운영 `/showroom`, 신규 사진 및 마스크 200. 실제 브라우저에서 새 주방 사진, 상·하부장 채널, 선택·찜 목록 확인.
- 미인증 `/api/product-images/usage` 401, 교차 출처 로그아웃 403.
- 비공개 백업 `.release-private/showroom-release-20261007/`: 전체 스키마 및 영속 데이터. 세션/OAuth 시도 토큰은 제외. quick_check ok, foreign_key_check 없음. 사용자/멤버십 1/1, 이미지/버전 962/962.
- 스키마 SHA256 `A700BBBB6EAA02B68DAA5B9CF991065A407EF5A78E4EB6BBB174242DB79253A7`.
- 데이터 SHA256 `E0039B48C4169D1CB5CA6A030971DCB1AE4C090650AB49C96C7A864EA692B0E0`.
- DB 마이그레이션, R2 객체 수정, OAuth 설정 변경 없음. 변수·Secret 보존. 새 사진은 Worker 정적 자산으로 배포됨.
- 기존 릴리스에서 격리 및 운영 Google 로그인 검증 완료 기록을 유지. 이번 변경은 인증 코드 변경이 없으며, 새 실제 Google 로그인/로그아웃 검증은 수행하지 않았음.
- 배포 후 사용자 요청으로 실행 코드·사진·마스크·회귀 테스트·이 기록을 릴리스 브랜치에 선별 커밋/푸시한다. 관련 없는 로컬 변경과 비공개 백업은 제외한다.
