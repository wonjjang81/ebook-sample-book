import { describe, expect, it } from 'vitest';
import { isSafeReturnTo, validateGoogleClaims } from '../server/auth';

const baseClaims = {
  sub: 'google-sub-1',
  email: 'tubebluemoon@gmail.com',
  email_verified: true,
  nonce: 'expected-nonce',
  iss: 'https://accounts.google.com',
};

describe('Google 관리자 인증 검증', () => {
  it('지정된 검증 계정과 nonce만 허용한다', () => {
    expect(validateGoogleClaims(baseClaims, {
      adminEmail: 'tubebluemoon@gmail.com',
      nonce: 'expected-nonce',
    })).toEqual({ sub: 'google-sub-1', email: 'tubebluemoon@gmail.com' });
  });

  it('다른 이메일, 미검증 이메일, nonce 불일치를 거부한다', () => {
    expect(() => validateGoogleClaims({ ...baseClaims, email: 'other@example.com' }, {
      adminEmail: 'tubebluemoon@gmail.com', nonce: 'expected-nonce',
    })).toThrow(/허용되지 않은/);
    expect(() => validateGoogleClaims({ ...baseClaims, email_verified: false }, {
      adminEmail: 'tubebluemoon@gmail.com', nonce: 'expected-nonce',
    })).toThrow(/확인되지 않은/);
    expect(() => validateGoogleClaims({ ...baseClaims, nonce: 'replayed' }, {
      adminEmail: 'tubebluemoon@gmail.com', nonce: 'expected-nonce',
    })).toThrow(/nonce/);
  });

  it('동일 출처의 상대 경로만 로그인 복귀 주소로 허용한다', () => {
    expect(isSafeReturnTo('/sample/lohas-87493-1?tab=image')).toBe(true);
    expect(isSafeReturnTo('//evil.example')).toBe(false);
    expect(isSafeReturnTo('https://evil.example')).toBe(false);
    expect(isSafeReturnTo('/\\evil')).toBe(false);
  });
});

