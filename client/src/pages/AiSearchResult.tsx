/**
 * AiSearchResult.tsx
 * AI 자재 검색 결과 화면
 *
 * 기능:
 * - sessionStorage에서 이미지 데이터 읽어 API 호출
 * - 단일/앙상블 모드 자동 선택
 * - 유사도 순 결과 카드 표시
 * - Fallback(온라인 검색) 안내
 * - 결과 제품 상세페이지로 이동
 */

import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { ChevronLeft, Camera, ExternalLink, AlertCircle, Loader2, Star, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { matchSingle, matchEnsemble, type MatchResult, type MatchedMaterial } from '@/lib/materialMatcherApi';
import { ALL_SAMPLES } from '@/data/sampleData';

type SearchStatus = 'loading' | 'success' | 'fallback' | 'error';

// Base64 dataURL → File 변환
function dataUrlToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], filename, { type: mime });
}

// 유사도 → 색상 클래스
function getSimilarityColor(score: number) {
  if (score >= 0.85) return 'text-green-600 bg-green-50 border-green-200';
  if (score >= 0.70) return 'text-blue-600 bg-blue-50 border-blue-200';
  return 'text-orange-600 bg-orange-50 border-orange-200';
}

// 유사도 → 텍스트
function getSimilarityLabel(score: number) {
  if (score >= 0.85) return '매우 유사';
  if (score >= 0.70) return '유사';
  return '참고';
}

export default function AiSearchResult() {
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<SearchStatus>('loading');
  const [results, setResults] = useState<MatchedMaterial[]>([]);
  const [fallbackImageUrl, setFallbackImageUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [capturedPreviews, setCapturedPreviews] = useState<string[]>([]);
  const [isEnsemble, setIsEnsemble] = useState(false);

  useEffect(() => {
    const run = async () => {
      try {
        const rawImages = sessionStorage.getItem('matchImages');
        const mode = sessionStorage.getItem('matchMode') || 'single';

        if (!rawImages) {
          navigate('/ai-search');
          return;
        }

        const imageDataUrls: string[] = JSON.parse(rawImages);
        setCapturedPreviews(imageDataUrls);
        setIsEnsemble(mode === 'ensemble');

        const files = imageDataUrls.map((url, i) =>
          dataUrlToFile(url, `capture_${i}.jpg`)
        );

        let result: MatchResult;
        if (mode === 'ensemble' && files.length > 1) {
          result = await matchEnsemble(files);
        } else {
          result = await matchSingle(files[0]);
        }

        if (result.fallback_required) {
          // Fallback: 온라인 검색 유도
          setStatus('fallback');
          if (result.fallback_image_base64) {
            setFallbackImageUrl(`data:image/jpeg;base64,${result.fallback_image_base64}`);
          }
        } else if (result.results && result.results.length > 0) {
          setResults(result.results);
          setStatus('success');
        } else {
          setStatus('fallback');
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || '검색 중 오류가 발생했습니다.');
      }
    };

    run();
  }, [navigate]);

  // 결과 제품을 sampleData에서 찾아 상세페이지로 이동
  const handleProductClick = (material: MatchedMaterial) => {
    // productNo로 샘플 데이터에서 매칭
    const sample = ALL_SAMPLES.find(
      (s) => s.productNo === material.code || s.id === String(material.id)
    );
    if (sample) {
      navigate(`/sample/${sample.id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/ai-search')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-base font-bold">검색 결과</h1>
          <p className="text-xs text-muted-foreground">
            {isEnsemble ? `앙상블 검색 (${capturedPreviews.length}장)` : '단일 이미지 검색'}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/ai-search')}>
          <Camera className="w-4 h-4 mr-1" />
          재촬영
        </Button>
      </div>

      <div className="flex-1 max-w-2xl mx-auto w-full px-4 py-4 space-y-4">

        {/* 촬영 이미지 미리보기 */}
        {capturedPreviews.length > 0 && (
          <div className="flex gap-2">
            {capturedPreviews.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`촬영 ${idx + 1}`}
                className="w-16 h-16 object-cover rounded-lg border border-border"
              />
            ))}
            <div className="flex-1 flex items-center">
              <p className="text-sm text-muted-foreground">
                {isEnsemble
                  ? `${capturedPreviews.length}장의 이미지로 앙상블 검색`
                  : '1장의 이미지로 검색'}
              </p>
            </div>
          </div>
        )}

        {/* 로딩 */}
        {status === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <p className="text-sm text-muted-foreground">AI가 유사한 자재를 검색하고 있습니다...</p>
            <p className="text-xs text-muted-foreground">MobileNetV3 모델로 특징을 분석 중입니다</p>
          </div>
        )}

        {/* 검색 성공 */}
        {status === 'success' && results.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-muted-foreground">
                유사 자재 {results.length}개 발견
              </h2>
              <Badge variant="secondary" className="text-xs">
                유사도 순
              </Badge>
            </div>

            {results.map((material, idx) => {
              const sample = ALL_SAMPLES.find(
                (s) => s.productNo === material.code
              );
              const similarityPct = Math.round(material.similarity_score * 100);
              const colorClass = getSimilarityColor(material.similarity_score);
              const label = getSimilarityLabel(material.similarity_score);

              return (
                <div
                  key={material.id}
                  onClick={() => handleProductClick(material)}
                  className={cn(
                    'flex gap-3 p-3 rounded-xl border bg-card cursor-pointer transition-all hover:shadow-md hover:border-blue-300',
                    idx === 0 && 'ring-2 ring-blue-500 ring-offset-1'
                  )}
                >
                  {/* 순위 */}
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground">
                    {idx === 0 ? <Star className="w-4 h-4 text-yellow-500" /> : idx + 1}
                  </div>

                  {/* 썸네일 */}
                  <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-muted border border-border">
                    {(sample?.image || material.thumbnail) ? (
                      <img
                        src={sample?.image || material.thumbnail}
                        alt={material.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                        No img
                      </div>
                    )}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{material.name}</p>
                        <p className="text-xs text-muted-foreground">{material.code}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {material.color_tags && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              {material.color_tags}
                            </Badge>
                          )}
                          {material.pattern_tag && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0">
                              {material.pattern_tag}
                            </Badge>
                          )}
                        </div>
                      </div>
                      {/* 유사도 */}
                      <div className={cn('flex-shrink-0 text-center px-2 py-1 rounded-lg border text-xs font-bold', colorClass)}>
                        <div className="text-base leading-none">{similarityPct}%</div>
                        <div className="mt-0.5 text-xs font-normal">{label}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <p className="text-xs text-center text-muted-foreground pt-2">
              제품을 클릭하면 상세 정보를 확인할 수 있습니다
            </p>
          </div>
        )}

        {/* Fallback: 유사 자재 없음 → 온라인 검색 유도 */}
        {status === 'fallback' && (
          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <AlertCircle className="w-10 h-10 text-orange-400" />
              <div>
                <p className="font-semibold">유사한 자재를 찾지 못했습니다</p>
                <p className="text-sm text-muted-foreground mt-1">
                  DB에 등록된 자재와 유사도가 낮습니다.<br />
                  아래 이미지로 온라인 검색을 시도해 보세요.
                </p>
              </div>
            </div>

            {fallbackImageUrl && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">검색용 보정 이미지</p>
                <img
                  src={fallbackImageUrl}
                  alt="Fallback 검색 이미지"
                  className="w-full max-w-xs mx-auto rounded-xl border border-border"
                />
              </div>
            )}

            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  const query = encodeURIComponent('벽지 자재 유사 검색');
                  window.open(`https://www.google.com/search?q=${query}&tbm=isch`, '_blank');
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Google 이미지 검색
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/ai-search')}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                다시 촬영하기
              </Button>
            </div>
          </div>
        )}

        {/* 오류 */}
        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 py-12 text-center">
            <AlertCircle className="w-10 h-10 text-red-400" />
            <div>
              <p className="font-semibold text-red-600">검색 오류</p>
              <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
            </div>
            <Button variant="outline" onClick={() => navigate('/ai-search')}>
              <RefreshCw className="w-4 h-4 mr-2" />
              다시 시도
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
