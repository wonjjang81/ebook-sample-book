import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(new URL('../client/src/pages/EbookViewer.tsx', import.meta.url), 'utf8');

describe('sample viewer header', () => {
  it('removes the duplicated category manager and step selectors', () => {
    expect(source).not.toContain('카테고리 빠른 관리');
    expect(source).not.toContain('사이드바에서 편집 활성화 후 카테고리를 관리할 수 있습니다.');
    expect(source).not.toContain('placeholder="제품라인 선택"');
  });

  it('keeps search and sorting controls in the header', () => {
    expect(source).toContain('placeholder="품번이나 제품명으로 검색..."');
    expect(source).toContain('<SortButtons sort={browseSort} setter={setBrowseSort} />');
  });
});
