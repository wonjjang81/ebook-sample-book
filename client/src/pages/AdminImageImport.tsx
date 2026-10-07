import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { uploadProductImage, useProductImages } from '@/hooks/useProductImage';
import { getCatalogSamples } from '@/data/sampleData';
import { CheckCircle2, FolderUp, Loader2, ShieldCheck, TriangleAlert } from 'lucide-react';
import { useRef, useState } from 'react';

interface ImportItem {
  file: File;
  productId: string;
  productNo: string;
  name: string;
}

interface ImportSummary {
  uploaded: number;
  alreadyStored: number;
  unmatched: number;
  unsupported: number;
  failed: Array<{ productNo: string; message: string }>;
}

function getBrandFromPath(path: string): string | null {
  const segments = path.split(/[\\/]/).map((segment) => segment.toLocaleLowerCase('ko-KR'));
  if (segments.some((segment) => segment === '개나리')) return '개나리';
  if (segments.some((segment) => segment === '신한')) return '신한';
  if (segments.some((segment) => segment === 'lx')) return 'LX';
  return null;
}

function findCatalogSample(file: File, catalogSamples: ReturnType<typeof getCatalogSamples>) {
  const brand = getBrandFromPath(file.webkitRelativePath || file.name);
  if (!brand) return null;
  const stem = file.name.replace(/\.[^.]+$/, '').trim();
  const matches = catalogSamples.filter((sample) => {
    if (sample.brand !== brand) return false;
    return stem === sample.productNo
      || stem.startsWith(`${sample.productNo} `)
      || stem.startsWith(`${sample.productNo}_`)
      || stem.startsWith(`${sample.productNo}(`);
  });
  return matches.length === 1 ? matches[0] : null;
}

export default function AdminImageImport() {
  const auth = useAdminAuth();
  const { images, isLoading: areImagesLoading, error: serverImageError, refresh } = useProductImages();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<ImportItem[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [progress, setProgress] = useState({ complete: 0, total: 0 });
  const [isScanning, setIsScanning] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [scanCounts, setScanCounts] = useState({ unmatched: 0, unsupported: 0, alreadyStored: 0 });

  const chooseFolder = () => {
    const input = inputRef.current;
    if (!input) return;
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');
    input.click();
  };

  const scanFiles = async (files: FileList | null) => {
    if (!files) return;
    setIsScanning(true);
    setSummary(null);
    setItems([]);
    const supported: ImportItem[] = [];
    const catalogSamples = getCatalogSamples(true);
    let unmatched = 0;
    let unsupported = 0;
    let alreadyStored = 0;
    const candidates = new Map<string, ImportItem[]>();
    for (const file of Array.from(files)) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        unsupported += 1;
        continue;
      }
      const sample = findCatalogSample(file, catalogSamples);
      if (!sample) {
        unmatched += 1;
        continue;
      }
      const candidate = { file, productId: sample.id, productNo: sample.productNo, name: sample.name };
      const list = candidates.get(sample.id) ?? [];
      list.push(candidate);
      candidates.set(sample.id, list);
    }
    for (const [productId, matches] of Array.from(candidates.entries())) {
      matches.sort((left, right) => left.file.name.localeCompare(right.file.name, 'ko-KR'));
      if (images[productId]) {
        alreadyStored += matches.length;
        continue;
      }
      supported.push(matches[0]);
      unmatched += matches.length - 1;
    }
    supported.sort((left, right) => left.productNo.localeCompare(right.productNo, 'ko-KR'));
    setItems(supported);
    setScanCounts({ unmatched, unsupported, alreadyStored });
    setIsScanning(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const startUpload = async () => {
    if (!auth.isAdmin || serverImageError || areImagesLoading || !items.length || isUploading) return;
    setIsUploading(true);
    setSummary(null);
    setProgress({ complete: 0, total: items.length });
    const result: ImportSummary = { uploaded: 0, alreadyStored: 0, unmatched: scanCounts.unmatched, unsupported: scanCounts.unsupported, failed: [] };
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      try {
        await uploadProductImage(item.productId, item.file);
        result.uploaded += 1;
      } catch (caught) {
        result.failed.push({ productNo: item.productNo, message: caught instanceof Error ? caught.message : '저장 실패' });
      }
      setProgress({ complete: index + 1, total: items.length });
    }
    result.alreadyStored = scanCounts.alreadyStored;
    setSummary(result);
    setItems([]);
    await refresh();
    setIsUploading(false);
  };

  if (auth.isLoading) return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">관리자 권한을 확인하고 있습니다…</CardContent></Card>;
  if (!auth.isAdmin) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-5 w-5 text-blue-600" />관리자 로그인이 필요합니다</div>
          <p className="text-sm text-muted-foreground">제품 이미지는 관리자 확인 후 서버에 저장됩니다.</p>
          {auth.error && <p role="alert" className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">{auth.error}</p>}
          <Button onClick={auth.signIn}>Google 계정으로 로그인</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <div>
        <h3 className="text-lg font-semibold">브랜드 폴더 이미지 일괄 업로드</h3>
        <p className="mt-1 text-sm text-muted-foreground">폴더 경로에서 브랜드와 파일명에서 품번을 찾아 제품 샘플에 연결합니다. 서버에 이미 이미지가 있는 제품은 건너뛰며, 새 이미지는 제품당 한 장만 저장합니다.</p>
      </div>
      {serverImageError && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">서버 이미지 목록을 읽지 못했습니다. 기존 이미지를 덮어쓰지 않도록 일괄 업로드를 막았습니다. {serverImageError}</p>}

      <Card><CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" disabled={isScanning || isUploading || areImagesLoading || Boolean(serverImageError)} onClick={chooseFolder}><FolderUp className="mr-2 h-4 w-4" />도배 폴더 선택</Button>
          <input ref={inputRef} hidden type="file" multiple onChange={(event) => { void scanFiles(event.target.files); }} />
          {isScanning && <span className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />품번을 연결하고 있습니다…</span>}
        </div>
        <div className="rounded-lg border bg-slate-50 p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">폴더 규칙</p>
          <p className="mt-1">브랜드 이름(개나리·신한·LX)이 경로에 있고, 이미지 파일명이 카탈로그 품번으로 시작해야 자동 연결됩니다.</p>
          <p className="mt-1">ZIP 파일은 이 화면에서 풀리지 않습니다. 신한 ZIP은 먼저 압축을 푼 뒤, 이미지가 든 상위 폴더를 선택하세요.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline">대기 {items.length}</Badge>
          <Badge variant="secondary">서버 저장됨 {scanCounts.alreadyStored}</Badge>
          <Badge variant="outline">품번 불일치·중복 {scanCounts.unmatched}</Badge>
          <Badge variant="outline">ZIP·지원하지 않는 파일 {scanCounts.unsupported}</Badge>
        </div>
        {items.length > 0 && (
          <div className="max-h-72 overflow-auto rounded-lg border">
            {items.slice(0, 100).map((item) => <div key={item.productId} className="flex items-center justify-between gap-3 border-b px-3 py-2 text-sm last:border-0"><span className="font-mono text-xs">{item.productNo}</span><span className="min-w-0 flex-1 truncate text-right">{item.name}</span></div>)}
            {items.length > 100 && <div className="p-3 text-center text-xs text-muted-foreground">외 {items.length - 100}개 제품</div>}
          </div>
        )}
        {isUploading && <div className="space-y-2"><div className="flex justify-between text-sm"><span>서버 저장 중</span><span>{progress.complete} / {progress.total}</span></div><progress className="h-2 w-full" value={progress.complete} max={progress.total} /></div>}
        <Button disabled={!items.length || isUploading || isScanning || areImagesLoading || Boolean(serverImageError)} onClick={() => void startUpload()}>{isUploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />저장 중…</> : `${items.length}개 제품 서버에 저장`}</Button>
      </CardContent></Card>

      {summary && <Card><CardContent className="space-y-3 p-5">
        <div className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-5 w-5 text-emerald-600" />업로드 결과</div>
        <div className="flex flex-wrap gap-2 text-xs"><Badge>{summary.uploaded}개 저장</Badge><Badge variant="secondary">{summary.alreadyStored}개 기존 이미지 유지</Badge><Badge variant="outline">{summary.unmatched}개 불일치·중복</Badge><Badge variant="outline">{summary.unsupported}개 미지원 파일</Badge><Badge variant={summary.failed.length ? 'destructive' : 'outline'}>{summary.failed.length}개 실패</Badge></div>
        {summary.failed.length > 0 && <div className="max-h-48 overflow-auto rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">{summary.failed.map((failure) => <p key={`${failure.productNo}:${failure.message}`} className="flex gap-2 py-1"><TriangleAlert className="h-3.5 w-3.5 shrink-0" /><span>{failure.productNo}: {failure.message}</span></p>)}</div>}
      </CardContent></Card>}
    </div>
  );
}
