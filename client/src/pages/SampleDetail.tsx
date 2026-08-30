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

export default function SampleDetail() {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/sample/:id');
  const sampleId = params?.id ?? '';

  const [isImageExpanded, setIsImageExpanded] = useState(false);
  const [isProductSelected, setIsProductSelected] = useState(false);
  const [isProductLiked, setIsProductLiked] = useState(false);

  // 업로드된 이미지 상태 (null이면 기본 이미지 사용)
  const [thumbSrc, setThumbSrc] = useState<string | null>(null);
  const [origSrc, setOrigSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sample = findSampleById(sampleId);

  // 페이지 로드 시 저장된 이미지 불러오기
  useEffect(() => {
    if (!sampleId) return;
    setThumbSrc(getStoredThumb(sampleId));
    setOrigSrc(getStoredOrig(sampleId));
  }, [sampleId]);

  // 같은 라인의 인접 제품 (이전/다음 탐색)
  const linemates = sample
    ? ALL_SAMPLES.filter((s) => s.line === sample.line && s.categoryId === sample.categoryId)
    : [];
  const currentIdx = linemates.findIndex((s) => s.id === sampleId);
  const prevSample = currentIdx > 0 ? linemates[currentIdx - 1] : null;
  const nextSample = currentIdx < linemates.length - 1 ? linemates[currentIdx + 1] : null;

  const handleGoBack = () => navigate('/');

  // 실제 표시할 이미지 소스
  const displayThumb = thumbSrc ?? sample?.image ?? '';
  const displayOrig  = origSrc  ?? sample?.image ?? '';

  // 파일 처리 공통 함수
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
    } catch (e) {
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
  const hasCustomImage = !!thumbSrc;

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

              {/* 메인 이미지 — 드래그&드롭 영역 */}
              <div
                className={cn(
                  'aspect-square rounded-xl overflow-hidden bg-muted relative group shadow-md transition-all',
                  isDragOver ? 'ring-4 ring-blue-400 ring-offset-2 scale-[1.01]' : '',
                  isUploading ? 'cursor-wait' : displayThumb ? 'cursor-zoom-in' : 'cursor-pointer'
                )}
                onClick={() => !isUploading && displayThumb && setIsImageExpanded(true)}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
              >
                {/* 이미지 */}
                {displayThumb ? (
                  <img
                    src={displayThumb}
                    alt={sample.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-slate-100 text-slate-500">
                    <ImagePlus className="h-12 w-12" />
                    <div className="text-center"><p className="font-semibold">이미지 미등록</p><p className="mt-1 text-xs">아래 버튼에서 직접 업로드하세요.</p></div>
                  </div>
                )}

                {/* 업로드 중 오버레이 */}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                    <span className="text-white text-sm font-medium">이미지 처리 중...</span>
                  </div>
                )}

                {/* 드래그 오버 오버레이 */}
                {isDragOver && !isUploading && (
                  <div className="absolute inset-0 bg-blue-500/40 flex flex-col items-center justify-center gap-2 pointer-events-none">
                    <ImagePlus className="w-12 h-12 text-white drop-shadow-lg" />
                    <span className="text-white text-sm font-semibold">이미지를 놓으세요</span>
                  </div>
                )}

                {/* 호버 시 줌 아이콘 */}
                {displayThumb && !isUploading && !isDragOver && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                )}

                {/* 품번 오버레이 */}
                <div className="absolute bottom-3 left-3 bg-black/50 text-white text-xs font-mono px-2 py-1 rounded">
                  {sample.productNo}
                </div>

                {/* 사용자 업로드 배지 */}
                {hasCustomImage && (
                  <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow">
                    사용자 이미지
                  </div>
                )}
              </div>

              {/* 업로드 에러 메시지 */}
              {uploadError && (
                <p className="text-xs text-red-500 text-center">{uploadError}</p>
              )}

              {/* 이미지 업로드 버튼 영역 */}
              <div className="grid grid-cols-2 gap-2">
                {/* 이미지 교체 버튼 */}
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

                {/* 다운로드 버튼 */}
                {displayOrig ? (
                  <a href={displayOrig} download={`${sample.productNo}.jpg`} className="w-full">
                    <Button variant="outline" size="sm" className="gap-1.5 w-full">
                      <Download className="w-3.5 h-3.5" />
                      다운로드
                    </Button>
                  </a>
                ) : (
                  <Button variant="outline" size="sm" className="gap-1.5 w-full" disabled>
                    <Download className="w-3.5 h-3.5" />
                    이미지 없음
                  </Button>
                )}
              </div>

              {/* 기본 이미지로 복원 버튼 (업로드된 이미지가 있을 때만) */}
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

              {/* 안내 텍스트 */}
              <p className="text-xs text-muted-foreground text-center leading-relaxed">
                이미지를 드래그&드롭하거나 버튼을 클릭하여 교체할 수 있습니다.<br />
                카드용 이미지는 자동으로 400×400으로 조정됩니다.
              </p>

              {/* 숨겨진 파일 입력 */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {/* 같은 라인 이전/다음 탐색 */}
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
                    {prevSample ? prevSample.name : '이전'}
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
                    {nextSample ? nextSample.name : '다음'}
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              )}

              {/* 같은 라인 썸네일 그리드 */}
              {linemates.length > 1 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2 font-medium">
                    {sample.line} 컬렉션 ({linemates.length}종)
                  </p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {linemates.map((s) => {
                      const storedThumb = getStoredThumb(s.id);
                      return (
                        <div
                          key={s.id}
                          onClick={() => navigate(`/sample/${s.id}`)}
                          className={cn(
                            'aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all',
                            s.id === sampleId
                              ? 'border-blue-500 shadow-md scale-105'
                              : 'border-transparent hover:border-gray-300'
                          )}
                          title={s.name}
                        >
                          {(storedThumb ?? s.image) ? (
                            <img
                              src={storedThumb ?? s.image}
                              alt={s.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400"><ImagePlus className="h-4 w-4" /></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Details */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                <Badge>{categoryName}</Badge>
                <Badge variant="secondary">{sample.brand}</Badge>
                {sample.collection && <Badge variant="outline">{sample.collection}</Badge>}
                <Badge variant="outline">{sample.line}</Badge>
                {sample.specs.map((spec) => (
                  <Badge key={spec} variant="outline" className="text-xs bg-gray-50">
                    {spec}
                  </Badge>
                ))}
              </div>
              <h1 className="text-3xl font-bold text-foreground mb-1">{sample.name}</h1>
              <p className="text-base text-muted-foreground font-mono">{sample.productNo}</p>
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
                        <p className="font-semibold">{sample.collection ?? sample.line}</p>
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
                          <p className="text-sm text-muted-foreground font-medium mb-1">자재 유형</p>
                          <p className="font-semibold">{sample.materialType}</p>
                        </div>
                      )}
                      {sample.collection && (
                        <div className="border-b border-border pb-3">
                          <p className="text-sm text-muted-foreground font-medium mb-1">제품 계열</p>
                          <p className="font-semibold">{sample.line}</p>
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
              </TabsContent>

              <TabsContent value="description" className="space-y-4">
                <Card>
                  <CardContent className="pt-6">
                    {sample.description ? (
                      <div className="space-y-4 text-foreground leading-relaxed">
                        <p>{sample.description}</p>
                        {sample.detailSections?.map((section) => (
                          <div key={section.title}>
                            <p className="font-semibold text-lg">{section.title}</p>
                            <p className="mt-1">{section.description}</p>
                          </div>
                        ))}
                        {sample.sourceLabel && <p className="border-t pt-4 text-xs text-muted-foreground">자료 기준: {sample.sourceLabel}</p>}
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

      {/* Image Zoom Modal — 원본 해상도 유지 */}
      {isImageExpanded && displayOrig && (
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
              style={{
                maxWidth: '95vw',
                maxHeight: '90vh',
                objectFit: 'contain',
                /* 원본 해상도 유지: width/height를 강제하지 않음 */
              }}
              onClick={(e) => e.stopPropagation()}
            />
            {/* 닫기 버튼 */}
            <button
              onClick={() => setIsImageExpanded(false)}
              className="absolute top-3 right-3 bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            {/* 하단 정보 */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/60 text-white text-sm px-4 py-1.5 rounded-full">
              <span>{sample.name}</span>
              <span className="text-white/50">·</span>
              <span className="font-mono">{sample.productNo}</span>
              {hasCustomImage && (
                <>
                  <span className="text-white/50">·</span>
                  <span className="text-blue-300 text-xs">사용자 업로드 이미지 (원본)</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
