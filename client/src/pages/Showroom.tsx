import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getCatalogSamples, type Sample } from '@/data/sampleData';
import { getProductThumb, getProductPatternSrc, useProductImages } from '@/hooks/useProductImage';
import { MaterialPatternImage } from '@/components/MaterialPatternImage';
import { ShowroomFilmLayer } from '@/components/ShowroomFilmLayer';
import { readShowroomSelections } from '@/lib/showroomSelections';
import {
  ROOM_OPTIONS,
  BUILTIN_SHOWROOM_PHOTOS,
  SHOWROOM_PHOTO_SLOTS,
  getRoomSurfaces,
  getShowroomPhotoSurfaces,
  isSampleCompatibleWithSurface,
  sortPointsClockwise,
  type RoomType,
  type ShowroomPoint,
  type SurfaceType,
} from '@/lib/showroom';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  ImagePlus,
  Layers3,
  MousePointer2,
  Trash2,
  Undo2,
} from 'lucide-react';
import { useEffect, useMemo, useState, type MouseEvent as ReactMouseEvent } from 'react';
import { useLocation } from 'wouter';

interface AppliedLayer {
  id: string;
  surface: SurfaceType;
  surfaceLabel: string;
  sampleId: string;
  sampleName: string;
  sampleNo: string;
  textureUrl: string;
  points: ShowroomPoint[];
  maskUrl?: string;
}

export default function Showroom() {
  const [, navigate] = useLocation();
  const [room, setRoom] = useState<RoomType>('living');
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [selectedSamples, setSelectedSamples] = useState<Sample[]>([]);
  const [savedSources, setSavedSources] = useState({ selected: new Set<string>(), liked: new Set<string>() });
  const [activeSurface, setActiveSurface] = useState<SurfaceType>('wall');
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const [draftPoints, setDraftPoints] = useState<ShowroomPoint[]>([]);
  const [layers, setLayers] = useState<AppliedLayer[]>([]);
  const [opacity, setOpacity] = useState(64);
  const [showApplied, setShowApplied] = useState(true);
  const [showAllChannels, setShowAllChannels] = useState(true);
  const [error, setError] = useState('');
  const { images, isLoading: isImagesLoading } = useProductImages();

  useEffect(() => {
    const refresh = () => {
      const sources = readShowroomSelections(localStorage);
      setSavedSources(sources);
      setSelectedSamples(getCatalogSamples().filter(sample => sources.all.has(sample.id)));
    };
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const surfaces = getShowroomPhotoSurfaces(room, activePhotoId);
  const activeSurfaceInfo = surfaces.find((surface) => surface.id === activeSurface) ?? surfaces[0];
  const roomPhotoSlots = SHOWROOM_PHOTO_SLOTS.filter((slot) => slot.roomId === room);
  const activePhoto = roomPhotoSlots.find((slot) => slot.id === activePhotoId) ?? null;
  const builtinPhoto = activePhoto ? BUILTIN_SHOWROOM_PHOTOS[activePhoto.id] : undefined;
  const photoUrl = activePhoto ? images[activePhoto.id]?.originalUrl ?? builtinPhoto?.image ?? null : null;
  const photoName = builtinPhoto?.label ?? activePhoto?.label ?? '';
  const activeMask = activePhoto && !images[activePhoto.id] ? builtinPhoto?.masks[activeSurface] : undefined;
  const visibleLayers = showAllChannels ? layers : layers.filter((layer) => layer.surface === activeSurface);
  const compatibleSamples = useMemo(
    () => selectedSamples.filter((sample) => isSampleCompatibleWithSurface(sample, activeSurface)),
    [activeSurface, selectedSamples, images],
  );
  const activeSample = compatibleSamples.find((sample) => sample.id === activeSampleId) ?? compatibleSamples[0] ?? null;

  useEffect(() => {
    if (!surfaces.some(surface => surface.id === activeSurface)) {
      setActiveSurface(surfaces[0].id);
      setDraftPoints([]);
    }
  }, [room, activePhotoId, activeSurface]);

  useEffect(() => {
    // A server override can arrive after the built-in photo has already rendered.
    // Regions belong to the exact photo, never carry them over to a replacement.
    setLayers([]);
    setDraftPoints([]);
    setError('');
  }, [photoUrl]);

  useEffect(() => {
    if (!compatibleSamples.some((sample) => sample.id === activeSampleId)) {
      setActiveSampleId(compatibleSamples[0]?.id ?? null);
    }
  }, [activeSampleId, compatibleSamples]);

  useEffect(() => {
    if (roomPhotoSlots.some((slot) => slot.id === activePhotoId && (images[slot.id] || BUILTIN_SHOWROOM_PHOTOS[slot.id]))) return;
    const available = roomPhotoSlots.find((slot) => images[slot.id] || BUILTIN_SHOWROOM_PHOTOS[slot.id]);
    setActivePhotoId(available?.id ?? null);
  }, [activePhotoId, images, roomPhotoSlots]);

  const selectRoom = (nextRoom: RoomType) => {
    setRoom(nextRoom);
    const firstSurface = getRoomSurfaces(nextRoom)[0];
    setActiveSurface(firstSurface.id);
    const firstAvailablePhoto = SHOWROOM_PHOTO_SLOTS.find((slot) => slot.roomId === nextRoom && (images[slot.id] || BUILTIN_SHOWROOM_PHOTOS[slot.id]));
    setActivePhotoId(firstAvailablePhoto?.id ?? null);
    setDraftPoints([]);
    setLayers([]);
  };

  const addPoint = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (activeMask) return;
    if (!photoUrl || !activeSample) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const point = {
      x: Math.max(0, Math.min(100, ((event.clientX - bounds.left) / bounds.width) * 100)),
      y: Math.max(0, Math.min(100, ((event.clientY - bounds.top) / bounds.height) * 100)),
    };
    const nextPoints = [...draftPoints, point];
    if (nextPoints.length < 4) {
      setDraftPoints(nextPoints);
      return;
    }
    setLayers((current) => [...current, {
      id: crypto.randomUUID(),
      surface: activeSurface,
      surfaceLabel: activeSurfaceInfo.label,
      sampleId: activeSample.id,
      sampleName: activeSample.name,
      sampleNo: activeSample.productNo,
      textureUrl: getProductThumb(activeSample.id, activeSample.image),
      points: sortPointsClockwise(nextPoints),
    }]);
    setDraftPoints([]);
  };

  const removeLayer = (id: string) => setLayers((current) => current.filter((layer) => layer.id !== id));
  const applyMaskedSample = () => {
    if (!activeMask || !activeSample) return;
    const textureUrl = getProductPatternSrc(activeSample.id, activeSample.image);
    if (!textureUrl) { setError('이 자재에 등록된 이미지가 없습니다. 이미지가 있는 필름을 선택하세요.'); return; }
    setError('');
    setLayers(current => [...current.filter(layer => layer.surface !== activeSurface), {
      id: crypto.randomUUID(), surface: activeSurface, surfaceLabel: activeSurfaceInfo.label,
      sampleId: activeSample.id, sampleName: activeSample.name, sampleNo: activeSample.productNo,
      textureUrl, points: [], maskUrl: activeMask,
    }]);
    setShowApplied(true);
  };

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3">
          <Button variant="ghost" onClick={() => navigate('/')}><ArrowLeft className="mr-2 h-4 w-4" />샘플북</Button>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1"><Layers3 className="h-3.5 w-3.5" />E샘플북 쇼룸</Badge>
            <Button size="sm" variant="outline" onClick={() => navigate('/admin?tab=showroom')}>관리자 사진 관리</Button>
            {layers.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => setShowApplied((value) => !value)}>
                {showApplied ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                {showApplied ? '원본 보기' : '적용 보기'}
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6">
        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">선택 샘플 공간 적용</h1>
              <p className="mt-1 text-sm text-muted-foreground">공간 사진을 고르고, 벽·바닥·가구 채널을 나눠 적용 영역을 지정하세요.</p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="공간 선택">
              {ROOM_OPTIONS.map((option) => (
                <Button key={option.id} size="sm" variant={room === option.id ? 'default' : 'outline'} onClick={() => selectRoom(option.id)}>{option.label}</Button>
              ))}
            </div>
          </div>
          <div className="mb-4 grid gap-2 sm:grid-cols-3">
            {roomPhotoSlots.map((slot) => {
              const photo = images[slot.id];
              const builtin = BUILTIN_SHOWROOM_PHOTOS[slot.id];
              return (
                <button key={slot.id} type="button" disabled={!photo && !builtin} onClick={() => { setActivePhotoId(slot.id); setDraftPoints([]); setLayers([]); setError(''); }} className={cn('overflow-hidden rounded-xl border text-left transition-colors disabled:cursor-not-allowed disabled:opacity-55', activePhotoId === slot.id ? 'border-blue-600 ring-2 ring-blue-600' : 'hover:border-blue-300')}>
                  <div className="aspect-[4/3] bg-slate-100">{photo || builtin ? <img src={photo?.thumbUrl ?? builtin.image} alt={`${slot.label} 미리보기`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-xs text-muted-foreground">사진 준비 중</div>}</div>
                  <div className="flex items-center justify-between gap-2 px-3 py-2"><span className="text-sm font-medium">{builtin?.label ?? slot.label}</span>{activePhotoId === slot.id && <Check className="h-4 w-4 text-blue-600" />}</div>
                </button>
              );
            })}
          </div>
          {!roomPhotoSlots.some((slot) => images[slot.id] || BUILTIN_SHOWROOM_PHOTOS[slot.id]) && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed bg-slate-50 px-4 py-3">
              <p className="text-sm text-muted-foreground">{isImagesLoading ? '쇼룸 사진을 불러오고 있습니다…' : `${ROOM_OPTIONS.find((option) => option.id === room)?.label} 사진이 아직 등록되지 않았습니다.`}</p>
              <Button size="sm" variant="outline" onClick={() => navigate('/admin?tab=showroom')}>사진 관리</Button>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-3">
            {surfaces.map((surface) => (
              <button
                key={surface.id}
                type="button"
                onClick={() => { setActiveSurface(surface.id); setDraftPoints([]); }}
                className={cn(
                  'rounded-xl border px-4 py-3 text-left transition-colors',
                  activeSurface === surface.id ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'bg-white hover:border-blue-300',
                )}
              >
                <span className="flex items-center justify-between gap-2 font-semibold">{surface.label}<span className="flex items-center gap-1">{activeSurface === surface.id && <Check className="h-4 w-4 text-blue-600" />}<Badge variant="secondary" className="px-1.5">{layers.filter((layer) => layer.surface === surface.id).length}</Badge></span></span>
                <span className="mt-1 block text-xs text-muted-foreground">{surface.materialLabel} 적용</span>
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="overflow-hidden">
            <CardContent className="p-4 sm:p-5">
              {!photoUrl ? (
                <div className="flex min-h-[520px] flex-col items-center justify-center rounded-xl border-2 border-dashed bg-slate-50 p-8 text-center">
                  <ImagePlus className="mb-4 h-14 w-14 text-slate-400" />
                  <h2 className="text-lg font-semibold">등록된 {ROOM_OPTIONS.find((option) => option.id === room)?.label} 사진이 없습니다</h2>
                  <p className="mt-1 max-w-md text-sm text-muted-foreground">관리자가 공간 사진을 등록하면 여기에서 사진을 선택해 샘플을 적용할 수 있습니다.</p>
                  <Button className="mt-5" variant="outline" onClick={() => navigate('/admin?tab=showroom')}>관리자 사진 관리</Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div
                    className={cn('relative mx-auto max-h-[72vh] w-fit max-w-full overflow-hidden rounded-xl bg-slate-900', activeSample && 'cursor-crosshair')}
                    onClick={addPoint}
                    role="application"
                    aria-label="샘플 적용 영역 지정"
                  >
                    <img src={photoUrl} alt={`${room} 인테리어`} className="block max-h-[72vh] max-w-full select-none object-contain" draggable={false} />
                    {showApplied && visibleLayers.filter(layer => layer.maskUrl).map(layer => (
                      <ShowroomFilmLayer key={layer.id} photoUrl={photoUrl} maskUrl={layer.maskUrl!} textureUrl={layer.textureUrl} label={layer.surfaceLabel} opacity={opacity} />
                    ))}
                    <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                      <defs>
                        {layers.filter(layer => !layer.maskUrl).map((layer) => (
                          <pattern key={layer.id} id={`texture-${layer.id}`} patternUnits="userSpaceOnUse" width="24" height="24">
                            <image href={layer.textureUrl} x="0" y="0" width="24" height="24" preserveAspectRatio="xMidYMid slice" />
                          </pattern>
                        ))}
                      </defs>
                      {showApplied && visibleLayers.filter(layer => !layer.maskUrl).map((layer) => (
                        <polygon
                          key={layer.id}
                          points={layer.points.map((point) => `${point.x},${point.y}`).join(' ')}
                          fill={`url(#texture-${layer.id})`}
                          stroke="rgba(255,255,255,.8)"
                          strokeWidth=".25"
                          opacity={opacity / 100}
                          style={{ mixBlendMode: 'multiply' }}
                        />
                      ))}
                      {draftPoints.length > 0 && (
                        <>
                          <polyline points={draftPoints.map((point) => `${point.x},${point.y}`).join(' ')} fill="none" stroke="#2563eb" strokeWidth=".6" strokeDasharray="1.5 1" />
                          {draftPoints.map((point, index) => <circle key={`${point.x}-${point.y}`} cx={point.x} cy={point.y} r="1.2" fill="#2563eb" stroke="white" strokeWidth=".35" />)}
                        </>
                      )}
                    </svg>
                    {activeSample && !activeMask && draftPoints.length === 0 && (
                      <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/70 px-3 py-1.5 text-xs font-medium text-white">
                        <MousePointer2 className="h-3.5 w-3.5" />첫 번째 모서리를 누르세요
                      </div>
                    )}
                  </div>
                  {activeMask && <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-blue-50 p-3"><p className="text-sm">{activeSurfaceInfo.label} 알파 영역 준비 완료 · 선택한 필름만 변경합니다.</p><Button disabled={!activeSample} onClick={applyMaskedSample}>{activeSurfaceInfo.label}에 필름 적용</Button></div>}
                  {activePhoto && images[activePhoto.id] && builtinPhoto && <p className="text-xs text-muted-foreground">관리자가 교체한 사진입니다. 기존 사진용 알파 마스크는 사용하지 않으며 네 모서리로 적용 영역을 지정하세요.</p>}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <span className="max-w-[50%] truncate text-sm text-muted-foreground">{photoName}</span>
                    <div className="flex flex-wrap gap-2">
                      {draftPoints.length > 0 && <Button size="sm" variant="outline" onClick={() => setDraftPoints((current) => current.slice(0, -1))}><Undo2 className="mr-2 h-4 w-4" />점 취소</Button>}
                      {(layers.length > 0 || draftPoints.length > 0) && <Button size="sm" variant="ghost" className="text-red-600" onClick={() => { setLayers([]); setDraftPoints([]); }}><Trash2 className="mr-2 h-4 w-4" />전체 초기화</Button>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-lg border bg-slate-50 px-3 py-2">
                    <label htmlFor="showroom-opacity" className="whitespace-nowrap text-sm font-medium">질감 강도</label>
                    <input id="showroom-opacity" type="range" min="25" max="95" value={opacity} onChange={(event) => setOpacity(Number(event.target.value))} className="w-full accent-blue-600" />
                    <span className="w-10 text-right text-sm text-muted-foreground">{opacity}%</span>
                  </div>
                </div>
              )}
              {error && <p role="alert" className="mt-3 rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
            </CardContent>
          </Card>

          <aside className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div><p className="font-semibold">{activeSurfaceInfo.label} 샘플</p><p className="text-xs text-muted-foreground">{activeSurfaceInfo.materialLabel}</p></div>
                  <Badge variant="outline">선택·찜 {compatibleSamples.length}</Badge>
                </div>
                {compatibleSamples.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-5 text-center">
                    <p className="text-sm font-medium">적용할 샘플이 없습니다</p>
                    <p className="mt-1 text-xs text-muted-foreground">샘플북에서 {activeSurfaceInfo.materialLabel} 제품을 선택하거나 찜하세요.</p>
                    <Button size="sm" className="mt-3" onClick={() => navigate('/')}>샘플 선택하기</Button>
                  </div>
                ) : (
                  <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                    {compatibleSamples.map((sample) => {
                      const selected = sample.id === activeSample?.id;
                      const thumbnail = getProductPatternSrc(sample.id, sample.image);
                      return (
                        <button
                          key={sample.id}
                          type="button"
                          onClick={() => { setActiveSampleId(sample.id); setDraftPoints([]); }}
                          className={cn('flex w-full items-center gap-3 rounded-xl border p-2 text-left transition-colors', selected ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'hover:border-blue-300')}
                        >
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {thumbnail ? <MaterialPatternImage src={thumbnail} alt={sample.name} className="h-full w-full" /> : <div className="flex h-full items-center justify-center"><ImagePlus className="h-5 w-5 text-muted-foreground" /></div>}
                          </div>
                          <div className="min-w-0 flex-1"><p className="truncate text-xs font-mono text-muted-foreground">{sample.productNo}</p><p className="line-clamp-2 text-sm font-semibold">{sample.name}</p><div className="mt-1 flex gap-1">{savedSources.selected.has(sample.id) && <Badge variant="outline">선택</Badge>}{savedSources.liked.has(sample.id) && <Badge variant="secondary">찜</Badge>}</div></div>
                          {selected && <Check className="h-4 w-4 shrink-0 text-blue-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="mb-3 flex items-center justify-between gap-2"><div><p className="font-semibold">표면 채널별 적용</p><p className="text-xs text-muted-foreground">채널별 영역이 서로 독립적으로 유지됩니다.</p></div><Badge variant="secondary">전체 {layers.length}</Badge></div>
                <Button className="mb-3 w-full" size="sm" variant="outline" onClick={() => setShowAllChannels((value) => !value)}>{showAllChannels ? '현재 채널만 미리보기' : '전체 채널 미리보기'}</Button>
                {layers.length === 0 ? <p className="text-sm text-muted-foreground">{activeMask ? (room === 'kitchen' ? '필름을 선택하고 적용 버튼을 누르세요. 상부장과 하부장은 각각 다른 자재를 적용할 수 있습니다.' : '필름을 선택하고 적용 버튼을 누르세요. 가구문과 서라운드 몰딩에 함께 적용됩니다.') : '현재 채널에서 사진 모서리 네 곳을 누르면 선택 샘플이 적용됩니다.'}</p> : (
                  <div className="space-y-4">
                    {surfaces.map((surface) => {
                      const channelLayers = [...layers].reverse().filter((layer) => layer.surface === surface.id);
                      return <section key={surface.id} className="space-y-2">
                        <button type="button" onClick={() => { setActiveSurface(surface.id); setDraftPoints([]); }} className={cn('flex w-full items-center justify-between rounded-md px-2 py-1 text-left text-sm font-semibold', activeSurface === surface.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50')}><span>{surface.label} 채널</span><Badge variant="outline">{channelLayers.length}</Badge></button>
                        {channelLayers.map((layer) => (
                          <div key={layer.id} className="flex items-center gap-2 rounded-lg border p-2">
                            <MaterialPatternImage src={getProductPatternSrc(layer.sampleId, layer.textureUrl)} alt={layer.sampleName} className="h-10 w-10 shrink-0 rounded" />
                            <div className="min-w-0 flex-1"><p className="text-xs text-muted-foreground">{layer.sampleNo}</p><p className="truncate text-sm font-medium">{layer.sampleName}</p></div>
                            <button type="button" onClick={() => removeLayer(layer.id)} className="rounded p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600" aria-label={`${layer.sampleName} 적용 삭제`}><Trash2 className="h-4 w-4" /></button>
                          </div>
                        ))}
                      </section>;
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </aside>
        </section>

        <p className="text-center text-xs text-muted-foreground">화면 합성은 색상과 질감 비교를 위한 미리보기입니다. 실제 시공 결과는 조명·표면 상태·시공 방향에 따라 달라질 수 있습니다.</p>
      </div>
    </main>
  );
}
