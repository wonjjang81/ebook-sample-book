import { describe, expect, it } from 'vitest';
import {
  IMAGE_STORAGE_LIMIT_BYTES,
  isWithinImageStorageLimit,
  validateImageFile,
  validateProductId,
} from '../server/productImages';

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00]);

describe('서버 이미지 업로드 검증', () => {
  it('정상 JPEG와 제품 ID를 허용한다', () => {
    expect(validateProductId('lohas-87493-1')).toBe('lohas-87493-1');
    expect(validateImageFile(jpeg, 'image/jpeg', 20 * 1024 * 1024)).toBe('jpg');
  });

  it('경로 문자가 포함된 제품 ID를 거부한다', () => {
    expect(() => validateProductId('../secret')).toThrow(/제품 ID/);
    expect(() => validateProductId('a/b')).toThrow(/제품 ID/);
  });

  it('MIME 선언과 실제 파일 헤더가 다르면 거부한다', () => {
    expect(() => validateImageFile(jpeg, 'image/png', 20 * 1024 * 1024)).toThrow(/형식/);
  });

  it('크기 제한을 넘으면 거부한다', () => {
    expect(() => validateImageFile(new Uint8Array(21), 'image/jpeg', 20)).toThrow(/용량/);
  });

  it('계정 무료 한도보다 낮은 앱 저장 상한을 넘지 못하게 한다', () => {
    expect(IMAGE_STORAGE_LIMIT_BYTES).toBe(8_000_000_000);
    expect(isWithinImageStorageLimit(7_999_999_999, 1)).toBe(true);
    expect(isWithinImageStorageLimit(8_000_000_000, 1)).toBe(false);
    expect(isWithinImageStorageLimit(-1, 1)).toBe(false);
  });
});
