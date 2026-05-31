import { useLocation, useRoute } from 'wouter';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, Download, X, ZoomIn, Check, Heart,
  ChevronLeft, ChevronRight, Upload, Trash2, ImagePlus, Loader2
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { findSampleById, getCategoryName, ALL_SAMPLES } from '@/data/sampleData';
import {
  getStoredThumb, getStoredOrig,
  uploadProductImage, deleteProductImage
} from '@/hooks/useProductImage';

// 색상 계열 그룹핑 함수
function getColorGroup(colorName: string): string {
  const c = colorName.replace(/\s/g, '');
  if (c.includes('그린')) return '그린 계열';
  if (c.includes('골드')) return '골드 계열';
  if (c.includes('블루')) return '블루 계열';
  if (c.includes('그레이') || c.includes('쿨그레이')) return '그레이 계열';
  if (c.includes('베이지') || c.includes('그레이지')) return '베이지 계열';
  if (c.includes('아이보리')) return '아이보리 계열';
  if (c.includes('화이트')) return '화이트 계열';
  return '기타';
}

export default function SampleDetail() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/sample/:id');
  const sampleId = params?.id ?? '';

  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isProductSelected, setIsProductSelected] = useState(false);
  const [isProductLiked, setIsProductLiked] = useState(false);
  const [collectionTab, setCollectionTab] = useState<'유사색상' | '패턴'>('유사색상');

  const [thumbSrc, setThumbSrc] = useState<string | null>(null);
  const [origSrc, setOrigSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sample = findSampleById(sampleId);

  useEffect(() => {
    if (!sampleId) return;
    setThumbSrc(getStoredThumb(sampleId));
    setOrigSrc(getStoredOrig(sampleId));
  }, [sampleId]);

  // 현재 제품의 collectionCategory에 맞게 기본 탭 설정
  useEffect(() => {
    if (sample?.collectionCategory) {
      const cat = sample.collectionCategory === '유사색상' ? '유사색상' : '패턴';
      setCollectionTab(cat);
    }
  }, [sample]);

  // 같은 라인의 인접 제품 (이전/다음 탐색)
  const linemates = sample
    ? ALL_SAMPLES.filter((s) => s.line === sample.line && s.categoryId === sample.categoryId)
    : [];
  const currentIdx = linemates.findIndex((s) => s.id === sampleId);
  const prevSample = currentIdx > 0 ? linemates[currentIdx - 1] : null;
  const nextSample = currentIdx < linemates.length - 1 ? linemates[currentIdx + 1] : null;

  // 같은 카테고리의 도배 전체 제품
  const categoryAll = ALL_SAMPLES.filter(
    (s) => s.categoryId === (sample?.categoryId ?? 1)
  );

  // 유사색상: 같은 colorGroup 제품들
  const currentColorGroup = sample?.colorGroup ?? getColorGroup(sample?.color ?? '');
  const similarColorProducts = categoryAll.filter(
    (s) => s.collectionCategory === '유사색상' &&
      (s.colorGroup ?? getColorGroup(s.color ?? '')) === currentColorGroup
  );
  const patternProducts = categoryAll.filter((s) => s.collectionCategory === '패턴');

  const handleGoBack = () => navigate('/');

  const displayThumb = thumbSrc ?? sample?.image ?? '';
  const displayOrig  = origSrc  ?? sample?.image ?? '';
  const hasNoImage = !thumbSrc && (!sample?.image || sample.image === '');
  const hasCustomImage = !!thumbSrc;

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('이미지 파일만 업로드할 수 있습니다.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setUploadError('파일 크기는 20MB 이하여야 합니다.');
      return;
    }
    setUploadError(null);
    setIsUploading(true);
    try {
      const { thumb, orig } = await uploadProductImage(sampleId, file);
      setThumbSrc(thumb);
      setOrigSrc(orig);
    } catch {
      setUploadError('이미지 저장 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDeleteImage = () => {
    deleteProductImage(sampleId);
    setThumbSrc(null);
    setOrigSrc(null);
  };

  if (!sample) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-xl text-muted-foreground">제품을 찾을 수 없습니다.</p>
          <Button onClick={handleGoBack} variant="outline" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const categoryName = getCategoryName(sample.categoryId ?? 1);

  // 컬렉션 탭에 표시할 제품 목록
  const collectionTabProducts: Record<string, typeof categoryAll> = {
    '유사색상': similarColorProducts,
    '패턴': patternProducts,
  };
  const currentTabProducts = collectionTabProducts[collectionTab] ?? [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card sticky top-0 z-20">
        <div className="container py-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={handleGoBack} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            뒤로가기
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{categoryName}</Badge>
              <Badge variant="outline">{sample.brand}</Badge>
              <span className="font-mono text-sm text-muted-foreground">{sample.productNo}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsProductSelected(!isProductSelected)}
                className={cn(
                  'w-8 h-8 rounded transition-all duration-200 flex items-center justify-center',
                  isProductSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-blue-50'
                )}
                title="선택"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsProductLiked(!isProductLiked)}
                className={cn(
                  'w-8 h-8 rounded transition-all duration-200 flex items-center justify-center',
                  isProductLiked
                    ? 'bg-red-500 text-white'
                    : 'bg-white text-gray-600 border border-gray-300 hover:bg-red-50'
                )}
                title="찜하기"
              >
                <Heart className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Image */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-3">

              {/* 메인 이미지 */}
              <div
                className={cn(
                  'aspect-square rounded-xl overflow-hidden bg-muted relative group shadow-md transition-all',
                  isDragOver ? 'ring-4 ring-blue-400 ring-offset-2 scale-[1.01]' : '',
                  isUploading ? 'cursor-wait' : hasNoImage ? 'cursor-pointer' : 'cursor-zoom-in'
                )}
                onClick={() => {
                  if (isUploading) return;
                  if (hasNoImage) fileInputRef.current?.click();
                  else setIsImageExpanded(true);
                }}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
              >
                {hasNoImage ? (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gray-50 border-2 border-dashed border-gray-300">
                    <ImagePlus className="w-12 h-12 text-gray-300" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-500">이미지를 업로드하세요</p>
                      <p className="text-xs text-gray-400 mt-1">클릭하거나 드래그&드롭</p>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/30 text-white text-xs font-mono px-2 py-1 rounded">
                      {sample.productNo}
                    </div>
                  </div>
                ) : (
                  <>
                    <img
                      src={displayThumb}
                      alt={sample.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                        <Loader2 className="w-10 h-10 text-white animate-spin" />
                        <span className="text-white text-sm font-medium">이미지 처리 중...</span>
                      </div>
                    )}
                    {isDragOver && !isUploading && (
                      <div className="absolute inset-0 bg-blue-500/40 flex flex-col items-center justify-center gap-2 pointer-events-none">
                        <ImagePlus className="w-12 h-12 text-white drop-shadow-lg" />
                        <span className="text-white text-sm font-semibold">이미지를 놓으세요</span>
                      </div>
                    )}
                    {!isUploading && !isDragOver && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                        <ZoomIn className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs font-mono px-2 py-1 rounded">
                      {sample.productNo}
                    </div>
                    {hasCustomImage && (
                      <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow">
                        사용자 이미지
                      </div>
                    )}
                  </>
                )}
              </div>

              {uploadError && (
                <p className="text-xs text-red-500 text-center">{uploadError}</p>
              )}

              {/* 업로드 버튼 */}
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="default"
                  size="sm"
                  className="gap-1.5 w-full"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-3.5 h-3.5" />
                  {hasCustomImage ? '이미지 교체' : '이미지 업로드'}
                </Button>
                <a
                  href={hasNoImage ? undefined : displayOrig}
                  download={hasNoImage ? undefined : `${sample.productNo}.jpg`}
                  className={cn('w-full', hasNoImage && 'pointer-events-none opacity-40')}
                >
                  <Button variant="outline" size="sm" className="gap-1.5 w-full" disabled={hasNoImage}>
                    <Download className="w-3.5 h-3.5" />
                    다운로드
                  </Button>
                </a>
              </div>

              {hasCustomImage && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full gap-1.5 text-red-500 hover:text-red-600 hover:bg-red-50"
                  onClick={handleDeleteImage}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  기본 이미지로 복원
                </Button>
              )}

              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                이미지를 드래그&드롭하거나 버튼을 클릭하여 업로드할 수 있습니다.<br />
                카드용 이미지는 자동으로 400×400으로 조정됩니다.
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* 이전/다음 탐색 */}
              {linemates.length > 1 && (
                <div className="flex items-center justify-between gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!prevSample}
                    onClick={() => prevSample && navigate(`/sample/${prevSample.id}`)}
                    className="flex-1 gap-1 text-xs"
                  >
                    <ChevronLeft className="w-3 h-3" />
                    {prevSample ? prevSample.productNo : '이전'}
                  </Button>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {currentIdx + 1} / {linemates.length}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={!nextSample}
                    onClick={() => nextSample && navigate(`/sample/${nextSample.id}`)}
                    className="flex-1 gap-1 text-xs"
                  >
                    {nextSample ? nextSample.productNo : '다음'}
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* 컬렉션 분류 썸네일 탭 */}
              <div className="pt-1">
                  {/* 탭 버튼 */}
                  <div className="flex gap-1 mb-2">
                    {(['유사색상', '패턴'] as const).map((tab) => {
                      const count = collectionTabProducts[tab]?.length ?? 0;
                      return (
                        <button
                          key={tab}
                          onClick={() => setCollectionTab(tab)}
                          className={cn(
                            'flex-1 text-xs py-1.5 px-1 rounded-md font-medium transition-colors border',
                            collectionTab === tab
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                          )}
                        >
                          {tab}
                          <span className={cn(
                            'ml-1 text-xs',
                            collectionTab === tab ? 'text-blue-100' : 'text-gray-400'
                          )}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* 탭 설명 */}
                  {collectionTab === '유사색상' && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {currentColorGroup} 제품 ({similarColorProducts.length}종)
                    </p>
                  )}
                  {collectionTab === '패턴' && (
                    <p className="text-xs text-muted-foreground mb-2">
                      패턴·텍스처·직물·타일 제품 ({patternProducts.length}종)
                    </p>
                  )}

                  {/* 썸네일 그리드 */}
                  <div className="grid grid-cols-4 gap-1.5 max-h-64 overflow-y-auto">
                    {currentTabProducts.map((s) => {
                      const storedThumb = getStoredThumb(s.id);
                      const thumbToShow = storedThumb ?? s.image;
                      const noImg = !storedThumb && (!s.image || s.image === '');
                      return (
                        <div
                          key={s.id}
                          onClick={() => navigate(`/sample/${s.id}`)}
                          className={cn(
                            'aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all relative',
                            s.id === sampleId
                              ? 'border-blue-500 shadow-md scale-105'
                              : 'border-transparent hover:border-gray-300'
                          )}
                          title={`${s.productNo} ${s.color ?? ''}`}
                        >
                          {noImg ? (
                            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                              {s.colorHex ? (
                                <div
                                  className="w-full h-full"
                                  style={{ backgroundColor: s.colorHex }}
                                />
                              ) : (
                                <ImagePlus className="w-4 h-4 text-gray-300" />
                              )}
                            </div>
                          ) : (
                            <img
                              src={thumbToShow}
                              alt={s.name}
                              className="w-full h-full object-cover"
                            />
                          )}
                          {/* 색상 칩 오버레이 (이미지 없을 때만) */}
                          {noImg && s.color && (
                            <div className="absolute bottom-0 left-0 right-0 bg-black/40 text-white text-center"
                              style={{ fontSize: '7px', padding: '1px 0' }}>
                              {s.color}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {currentTabProducts.length === 0 && (
                      <p className="col-span-4 text-xs text-muted-foreground text-center py-4">
                        해당 분류의 제품이 없습니다.
                      </p>
                    )}
                  </div>
              </div>

            </div>
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge>{categoryName}</Badge>
                <Badge variant="secondary">{sample.brand}</Badge>
                <Badge variant="outline">{sample.line}</Badge>
                {sample.materialType && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {sample.materialType}
                  </Badge>
                )}
                {sample.collectionCategory && (
                  <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                    {sample.collectionCategory}
                  </Badge>
                )}
                {sample.specs.map((spec) => (
                  <Badge key={spec} variant="outline" className="text-xs bg-gray-50">
                    {spec}
                  </Badge>
                ))}
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-1">{sample.name}</h1>
              <p className="text-base text-muted-foreground font-mono">{sample.productNo}</p>
              {sample.collectionName && (
                <p className="text-sm text-muted-foreground mt-1">
                  컬렉션: <span className="font-medium text-foreground">{sample.collectionName}</span>
                </p>
              )}
            </div>

            <Tabs defaultValue="specs" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="specs">제품 사양</TabsTrigger>
                <TabsTrigger value="description">상세 설명</TabsTrigger>
              </TabsList>

              <TabsContent value="specs" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">기본 정보</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border-b border-border pb-3">
                        <p className="text-sm text-muted-foreground font-medium mb-1">브랜드</p>
                        <p className="font-semibold">{sample.brand}</p>
                      </div>
                      <div className="border-b border-border pb-3">
                        <p className="text-sm text-muted-foreground font-medium mb-1">컬렉션</p>
                        <p className="font-semibold">{sample.collectionName ?? sample.line}</p>
                      </div>
                      <div className="border-b border-border pb-3">
                        <p className="text-sm text-muted-foreground font-medium mb-1">품번</p>
                        <p className="font-semibold font-mono">{sample.productNo}</p>
                      </div>
                      <div className="border-b border-border pb-3">
                        <p className="text-sm text-muted-foreground font-medium mb-1">공정</p>
                        <p className="font-semibold">{categoryName}</p>
                      </div>
                      {sample.materialType && (
                        <div className="border-b border-border pb-3">
                          <p className="text-sm text-muted-foreground font-medium mb-1">재질</p>
                          <p className="font-semibold">{sample.materialType}</p>
                        </div>
                      )}
                      <div className="border-b border-border pb-3">
                        <p className="text-sm text-muted-foreground font-medium mb-1">분류</p>
                        <p className="font-semibold">{sample.collectionCategory ?? '-'}</p>
                      </div>
                      {/* 색상 */}
                      {sample.color && (
                        <div className="border-b border-border pb-3 col-span-2">
                          <p className="text-sm text-muted-foreground font-medium mb-1">색상</p>
                          <div className="flex items-center gap-2">
                            {sample.colorHex && (
                              <div
                                className="w-6 h-6 rounded-full border border-gray-200 shadow-sm flex-shrink-0"
                                style={{ backgroundColor: sample.colorHex }}
                              />
                            )}
                            <span className="font-semibold">{sample.color}</span>
                            {sample.colorGroup && (
                              <span className="text-xs text-muted-foreground">({sample.colorGroup})</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">스펙 태그</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {sample.specs.map((spec) => (
                        <span
                          key={spec}
                          className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700 border border-blue-200"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* 트랜디 친환경 인증 */}
                {isTrendy && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">친환경 인증</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { title: '환경표지 인증', desc: '환경부 공식 환경표지 인증 제품' },
                          { title: '친환경 건축자재 인증', desc: '친환경 건축자재 품질 인증 제품' },
                          { title: '8대 중금속 불검출', desc: '납, 카드뮴, 크롬, 안티몬, 비소, 바륨, 셀레늄, 수은 전 항목 불검출' },
                        ].map((item) => (
                          <div key={item.title} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-100">
                            <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-green-800">{item.title}</p>
                              <p className="text-xs text-green-600 mt-0.5">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="description" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    {isTrendy ? (
                      <div className="space-y-5 text-foreground leading-relaxed">
                        {sample.description ? (
                          <div>
                            <p className="font-semibold text-lg mb-2">
                              {sample.collectionName ?? sample.line}
                            </p>
                            <p className="text-muted-foreground">{sample.description}</p>
                          </div>
                        ) : (
                          <p>GNI개나리 트랜디 <strong>{sample.name}</strong> 제품입니다.</p>
                        )}

                        <div className="border-t border-border pt-4 space-y-4">
                          <p className="font-semibold text-base">트랜디 프리미엄 합지 특징</p>
                          <div className="grid grid-cols-1 gap-3">
                            {[
                              {
                                color: 'emerald',
                                title: '피톤치드 함유',
                                desc: '피톤치드가 함유되어 있어 실내 유해 물질을 감소시켜 지친 몸과 마음을 회복시켜 줍니다. 항균효과, 스트레스 완화, 집중력 향상, 진정작용의 효과가 있습니다.',
                              },
                              {
                                color: 'sky',
                                title: '수성잉크 인쇄',
                                desc: '합지제품에 수성잉크를 사용하여 만든 제품으로 발암물질 걱정없이 공간을 상쾌하게 합니다. 믿고 선택할 수 있는 진정한 친환경 제품입니다.',
                              },
                              {
                                color: 'purple',
                                title: '오염방지 코팅',
                                desc: '항균코팅층이 적용되어 오염 방지 기능을 제공합니다. 일상적인 오염에도 깨끗한 상태를 유지할 수 있습니다.',
                              },
                            ].map((item) => (
                              <div key={item.title} className={`p-4 bg-${item.color}-50 rounded-lg border border-${item.color}-100`}>
                                <p className={`font-semibold text-${item.color}-800 mb-1`}>{item.title}</p>
                                <p className={`text-sm text-${item.color}-700`}>{item.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border-t border-border pt-4">
                          <p className="font-semibold text-base mb-3">제품 구조층</p>
                          <div className="space-y-1.5">
                            {['수성인쇄층', '항균코팅층', '종이층', '피톤치드층', '종이층'].map((layer, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
                                <span className="text-sm text-muted-foreground">{layer}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : sample.line === '프리모' ? (
                      <div className="space-y-4 text-foreground leading-relaxed">
                        <p className="font-semibold text-lg">차원이 다른 시공성</p>
                        <p>부직포 사용으로 업그레이드 된 시공성을 제공합니다. 프리모는 숨죽임 1시간 경과 후에도 벽지 폭의 변화가 적어 시공 후에도 이음 부위의 벌어짐과 이음 부위 표시가 잘 보이지 않습니다.</p>
                        <p className="font-semibold text-lg">뛰어난 두께감과 커버력</p>
                        <p>일반 벽지와 차별화되는 두께감과 단단한 표면처리를 통해 찍힘과 긁힘에 강한 품질로 어떠한 벽면에도 커버링이 탁월합니다.</p>
                        <p className="font-semibold text-lg">완벽한 입체 표현</p>
                        <p>리얼한 표면 질감을 살려내어 섬세한 엠보와 고급스러운 깊이감으로 공간을 보다 입체적이고 풍부하게 해줍니다.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 text-foreground leading-relaxed">
                        <p>GNI개나리 방염벽지 <strong>{sample.line}</strong> 컬렉션 제품입니다.</p>
                        <p>전 제품 방염 인증을 받은 안전한 벽지로, 화재 발생 시 유독가스 발생을 억제합니다.</p>
                        <p>품번 <strong className="font-mono">{sample.productNo}</strong>은 {sample.name} 컬러웨이입니다.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {isImageExpanded && !hasNoImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsImageExpanded(false)}
        >
          <div
            className="relative flex items-center justify-center"
            style={{ maxWidth: '95vw', maxHeight: '95vh' }}
          >
            <img
              src={displayOrig}
              alt={sample.name}
              className="rounded-lg shadow-2xl"
              style={{ maxWidth: '95vw', maxHeight: '90vh', objectFit: 'contain' }}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setIsImageExpanded(false)}
              className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 text-white text-sm px-4 py-1.5 rounded-full">
              <span>{sample.name}</span>
              <span className="text-white/50">·</span>
              <span className="font-mono">{sample.productNo}</span>
              {sample.color && (
                <>
                  <span className="text-white/50">·</span>
                  {sample.colorHex && (
                    <div className="w-3 h-3 rounded-full border border-white/40" style={{ backgroundColor: sample.colorHex }} />
                  )}
                  <span>{sample.color}</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
