import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { deleteProductImage, uploadProductImage, useProductImages } from '@/hooks/useProductImage';
import { ROOM_OPTIONS, SHOWROOM_PHOTO_SLOTS } from '@/lib/showroom';
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';

export default function AdminShowroomPhotos() {
  const auth = useAdminAuth();
  const { images, refresh } = useProductImages();
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [busySlot, setBusySlot] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const handleUpload = async (slotId: string, file?: File) => {
    if (!file) return;
    setError(null);
    setNotice(null);
    setBusySlot(slotId);
    try {
      await uploadProductImage(slotId, file);
      await refresh();
      setNotice('쇼룸 사진을 서버에 저장했습니다. 방문자 화면에 바로 반영됩니다.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '쇼룸 사진을 저장하지 못했습니다.');
    } finally {
      setBusySlot(null);
    }
  };

  const handleDelete = async (slotId: string, label: string) => {
    if (!window.confirm(`${label} 사진을 쇼룸에서 제거할까요?`)) return;
    setError(null);
    setNotice(null);
    setBusySlot(slotId);
    try {
      await deleteProductImage(slotId);
      await refresh();
      setNotice(`${label} 사진을 제거했습니다.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '쇼룸 사진을 제거하지 못했습니다.');
    } finally {
      setBusySlot(null);
    }
  };

  if (auth.isLoading) return <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">관리자 권한을 확인하고 있습니다…</CardContent></Card>;
  if (!auth.isAdmin) {
    return (
      <Card className="mx-auto max-w-xl">
        <CardHeader><CardTitle>관리자 로그인이 필요합니다</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">쇼룸 사진은 관리자만 추가·교체·삭제할 수 있습니다.</p>
          {auth.error && <p role="alert" className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">{auth.error}</p>}
          <Button onClick={auth.signIn}>Google 계정으로 로그인</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h3 className="text-lg font-semibold">쇼룸 사진 관리</h3>
        <p className="mt-1 text-sm text-muted-foreground">거실·안방·주방·욕실의 미리보기 사진을 등록하세요. 각 공간에 최대 3장을 둘 수 있으며 방문자는 등록된 사진을 골라 자재를 적용합니다.</p>
      </div>
      {error && <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
      {ROOM_OPTIONS.map((room) => (
        <section key={room.id} className="space-y-3">
          <h4 className="font-semibold">{room.label}</h4>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SHOWROOM_PHOTO_SLOTS.filter((slot) => slot.roomId === room.id).map((slot) => {
              const image = images[slot.id];
              const isBusy = busySlot === slot.id;
              return (
                <Card key={slot.id} className="overflow-hidden">
                  <div className="aspect-[4/3] bg-slate-100">
                    {image ? <img src={image.thumbUrl} alt={`${slot.label} 쇼룸 사진`} className="h-full w-full object-cover" /> : <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground"><ImagePlus className="h-8 w-8" /><span className="text-sm">사진 미등록</span></div>}
                  </div>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between"><p className="font-medium">{slot.label}</p><Badge variant={image ? 'default' : 'outline'}>{image ? '사용 중' : '비어 있음'}</Badge></div>
                    <div className="flex gap-2">
                      <Button className="flex-1" size="sm" disabled={isBusy} onClick={() => inputRefs.current[slot.id]?.click()}>
                        {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        {image ? '사진 교체' : '사진 등록'}
                      </Button>
                      {image && <Button size="sm" variant="outline" disabled={isBusy} onClick={() => void handleDelete(slot.id, slot.label)} aria-label={`${slot.label} 삭제`}><Trash2 className="h-4 w-4" /></Button>}
                    </div>
                    <input
                      ref={(element) => { inputRefs.current[slot.id] = element; }}
                      hidden
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => { void handleUpload(slot.id, event.target.files?.[0]); event.target.value = ''; }}
                    />
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
      <p className="text-xs text-muted-foreground">사진은 방문자에게 공개되며, 저장·교체는 서버에서 관리자 권한으로 처리됩니다.</p>
    </div>
  );
}
