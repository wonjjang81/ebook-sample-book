import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getCatalogSamples } from '@/data/sampleData';
import { cn } from '@/lib/utils';
import { analyzeWhiteReference, findSimilarMaterials, type ImageSignature, type MaterialMatch, type WhiteCalibration } from '@/lib/imageMaterialMatcher';
import { ArrowLeft, Camera, CheckCircle2, ImagePlus, Loader2, RefreshCw, ScanSearch, ShieldCheck, Upload, SunMedium } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'wouter';

export default function PhotoMaterialFinder() {
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const whiteRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [signature, setSignature] = useState<ImageSignature | null>(null);
  const [matches, setMatches] = useState<MaterialMatch[]>([]);
  const [analyzedCount, setAnalyzedCount] = useState(0);
  const [error, setError] = useState('');
  const [whitePreview, setWhitePreview] = useState<string | null>(null);
  const [calibration, setCalibration] = useState<WhiteCalibration | null>(null);
  const [isCalibrating, setIsCalibrating] = useState(false);

  useEffect(() => () => { if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);
  useEffect(() => () => { if (whitePreview?.startsWith('blob:')) URL.revokeObjectURL(whitePreview); }, [whitePreview]);

  const selectWhiteReference = async (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setWhitePreview((current) => { if (current?.startsWith('blob:')) URL.revokeObjectURL(current); return url; });
    setIsCalibrating(true);
    setError('');
    try {
      setCalibration(await analyzeWhiteReference(url));
    } catch {
      setCalibration(null);
      setError('화이트 기준 사진을 분석하지 못했습니다. 다시 촬영해 주세요.');
    } finally {
      setIsCalibrating(false);
    }
  };

  const selectFile = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('JPG, PNG, WebP 등 이미지 파일을 선택해 주세요.'); return; }
    if (file.size > 20 * 1024 * 1024) { setError('사진은 20MB 이하만 분석할 수 있습니다.'); return; }
    setPreview((current) => {
      if (current?.startsWith('blob:')) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    setFileName(file.name);
    setMatches([]);
    setSignature(null);
    setError('');
    setProgress(0);
  };

  const analyze = async () => {
    if (!preview) return;
    setIsAnalyzing(true);
    setError('');
    setMatches([]);
    try {
      const result = await findSimilarMaterials(preview, getCatalogSamples(), (completed, total) => setProgress(Math.round((completed / total) * 100)), calibration ?? undefined);
      setSignature(result.signature);
      setMatches(result.matches);
      setAnalyzedCount(result.analyzed);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '사진 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <main className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Button variant="ghost" onClick={() => navigate('/')}><ArrowLeft className="mr-2 h-4 w-4" />샘플북</Button>
          <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3.5 w-3.5" />기기 내 분석</Badge>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        <section className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><ScanSearch className="h-7 w-7" /></div>
          <h1 className="text-3xl font-bold tracking-tight">사진으로 유사 자재 찾기</h1>
          <p className="mx-auto mt-2 max-w-2xl text-muted-foreground">현장 벽면이나 원하는 질감을 정면에서 촬영하세요. 색상·명도·질감·패턴을 분석해 카탈로그에서 가까운 제품을 추천합니다.</p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
          <Card>
            <CardContent className="p-5">
              <div className="mb-5 rounded-xl border bg-muted/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 font-semibold"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">1</span>화이트 기준 설정</div>
                    <p className="mt-1 text-xs text-muted-foreground">같은 위치·조명에서 무광 흰색 카드를 먼저 촬영하면 현장 색 편향을 보정합니다.</p>
                  </div>
                  <Button size="sm" variant={calibration ? 'outline' : 'default'} onClick={() => whiteRef.current?.click()} disabled={isCalibrating}>
                    {isCalibrating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <SunMedium className="mr-2 h-4 w-4" />}{calibration ? '다시 촬영' : '기준 촬영'}
                  </Button>
                </div>
                {calibration && (
                  <div className="mt-3 grid gap-3 rounded-lg bg-background p-3 sm:grid-cols-[auto_1fr]">
                    {whitePreview && <img src={whitePreview} alt="화이트 기준" className="h-16 w-20 rounded-md object-cover" />}
                    <div>
                      <div className="flex items-center justify-between text-sm"><span>보정 신뢰도</span><strong className={calibration.confidence >= 70 ? 'text-emerald-600' : 'text-amber-600'}>{calibration.confidence}%</strong></div>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${calibration.confidence}%` }} /></div>
                      {calibration.warnings.length > 0 ? <p className="mt-2 text-xs text-amber-700">{calibration.warnings.join(' ')}</p> : <p className="mt-2 text-xs text-emerald-700">기준 촬영 품질이 양호합니다.</p>}
                    </div>
                  </div>
                )}
              </div>
              <div className="mb-3 flex items-center gap-2 font-semibold"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">2</span>자재 표면 촬영</div>
              {!preview ? (
                <div
                  className={cn('flex min-h-96 flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-colors', isDragging ? 'border-primary bg-primary/5' : 'border-border')}
                  onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(event) => { event.preventDefault(); setIsDragging(false); selectFile(event.dataTransfer.files[0]); }}
                >
                  <ImagePlus className="mb-4 h-12 w-12 text-muted-foreground" />
                  <h2 className="text-lg font-semibold">분석할 사진을 추가하세요</h2>
                  <p className="mt-1 text-sm text-muted-foreground">파일을 끌어 놓거나 아래 버튼을 이용하세요.</p>
                  <div className="mt-6 flex flex-wrap justify-center gap-2">
                    <Button onClick={() => inputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />사진 선택</Button>
                    <Button variant="outline" onClick={() => cameraRef.current?.click()}><Camera className="mr-2 h-4 w-4" />바로 촬영</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative overflow-hidden rounded-xl bg-black/5">
                    <img src={preview} alt="분석 대상" className="h-96 w-full object-contain" />
                    {isAnalyzing && <div className="absolute inset-x-0 top-0 h-0.5 animate-pulse bg-primary" style={{ width: `${progress}%` }} />}
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="min-w-0 truncate text-sm text-muted-foreground">{fileName}</span>
                    <Button variant="ghost" size="sm" onClick={() => { setPreview(null); setMatches([]); setSignature(null); }}><RefreshCw className="mr-2 h-4 w-4" />사진 변경</Button>
                  </div>
                  <Button className="w-full" size="lg" disabled={isAnalyzing} onClick={analyze}>
                    {isAnalyzing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />카탈로그 비교 중 {progress}%</> : <><ScanSearch className="mr-2 h-4 w-4" />유사 자재 분석</>}
                  </Button>
                </div>
              )}
              <input ref={inputRef} hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => selectFile(event.target.files?.[0])} />
              <input ref={cameraRef} hidden type="file" accept="image/*" capture="environment" onChange={(event) => selectFile(event.target.files?.[0])} />
              <input ref={whiteRef} hidden type="file" accept="image/*" capture="environment" onChange={(event) => selectWhiteReference(event.target.files?.[0])} />
              {error && <p role="alert" className="mt-3 rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            </CardContent>
          </Card>

          <div className="space-y-4">
            {matches.length === 0 ? (
              <Card className="h-full"><CardContent className="flex min-h-96 flex-col items-center justify-center p-8 text-center text-muted-foreground"><ScanSearch className="mb-4 h-10 w-10 opacity-40" /><p className="font-medium text-foreground">추천 결과가 여기에 표시됩니다</p><p className="mt-1 text-sm">그림자와 반사를 줄이고 자재 표면을 크게 촬영하면 정확도가 높아집니다.</p></CardContent></Card>
            ) : (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><h2 className="text-xl font-bold">유사 자재 추천</h2><p className="text-sm text-muted-foreground">카탈로그 {analyzedCount}개 제품 비교 · {calibration ? `화이트 보정 ${calibration.confidence}%` : '무보정 분석'}</p></div>
                  {signature && <div className="flex items-center gap-2 text-sm"><span>감지 주조색</span><span className="h-7 w-7 rounded-full border shadow-inner" style={{ backgroundColor: `rgb(${signature.averageRgb.join(',')})` }} /></div>}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {matches.map((match, index) => (
                    <Card key={match.sample.id} className="overflow-hidden transition-shadow hover:shadow-lg">
                      <button className="w-full text-left" onClick={() => navigate(`/sample/${match.sample.id}`)}>
                        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                          <img src={match.sample.image} alt={match.sample.name} loading="lazy" className="h-full w-full object-cover transition-transform hover:scale-105" />
                          <Badge className="absolute left-3 top-3">{index + 1}위</Badge>
                          <span className="absolute bottom-3 right-3 rounded-full bg-black/75 px-2.5 py-1 text-sm font-bold text-white">{match.score}%</span>
                        </div>
                        <div className="space-y-2 p-4">
                          <div><p className="font-mono text-xs text-muted-foreground">{match.sample.productNo}</p><h3 className="font-semibold">{match.sample.name}</h3></div>
                          <div className="flex flex-wrap gap-1">{match.reasons.map((reason) => <Badge key={reason} variant="outline" className="gap-1 text-[11px]"><CheckCircle2 className="h-3 w-3" />{reason}</Badge>)}</div>
                        </div>
                      </button>
                    </Card>
                  ))}
                </div>
                <p className="rounded-lg border bg-background p-3 text-xs text-muted-foreground">추천 점수는 촬영 환경에 따른 시각적 유사도이며 제품 동일성을 보증하지 않습니다. 품번과 실물 샘플을 최종 확인하세요.</p>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
