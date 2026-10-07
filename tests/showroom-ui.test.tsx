import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { MainLayout, SidebarLabel } from '../client/src/components/Layout';
import { SampleCard } from '../client/src/components/SampleCard';
import { ProductImagesProvider } from '../client/src/hooks/useProductImage';

afterEach(() => vi.unstubAllGlobals());

function renderLayout(mobile: boolean, saved: string | null) {
  vi.stubGlobal('window', { matchMedia: () => ({ matches: mobile }) });
  vi.stubGlobal('localStorage', { getItem: () => saved });
  return renderToStaticMarkup(<MainLayout sidebar={<SidebarLabel>쇼룸</SidebarLabel>}>목록</MainLayout>);
}

describe('쇼룸 UI 회귀 검증', () => {
  it('모바일에서는 기존 데스크톱 열림 설정과 관계없이 사이드바를 닫고 열기 버튼을 제공한다', () => {
    const html = renderLayout(true, 'true');
    expect(html).toContain('aria-label="카테고리 메뉴 열기"');
    expect(html).toContain('hidden md:flex');
    expect(html).not.toContain('>쇼룸</span>');
  });

  it('데스크톱에서는 저장된 닫힘 상태를 유지한다', () => {
    expect(renderLayout(false, 'false')).toContain('aria-expanded="false"');
  });

  it('잘못된 저장 값으로 화면 전체가 중단되지 않는다', () => {
    expect(renderLayout(false, '{invalid')).toContain('aria-expanded="true"');
  });

  it('카드에는 키보드 진입점과 상태가 있는 44px 선택·찜 버튼을 유지한다', () => {
    const html = renderToStaticMarkup(<ProductImagesProvider autoLoad={false}>
      <SampleCard sample={{ id: 'ui-test', productNo: '001', name: '테스트 벽지', brand: 'LX', line: '디아망', specs: [], image: '' }} onClick={() => {}} onSelect={() => {}} onLike={() => {}} isSelected />
    </ProductImagesProvider>);
    expect(html).toContain('role="link"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('w-11 h-11');
    expect(html).not.toContain('hover:scale-105');
  });
});
