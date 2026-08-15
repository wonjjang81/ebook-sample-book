import { useState } from 'react';
import { useLocation } from 'wouter';
import { MainLayout, SidebarContent, SidebarHeader, SidebarNav, SidebarNavItem } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Upload, Edit2, Trash2, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { CATEGORIES, deleteCatalogSample, exportCatalogBundle, getCatalogSamples, importCatalogBundle, saveCatalogSample, type EditableSample } from '@/data/sampleData';

const ADMIN_MENU = [
  { id: 'samples', label: '샘플 관리' },
  { id: 'categories', label: '카테고리 관리' },
  { id: 'upload', label: 'PDF 업로드' },
  { id: 'settings', label: '설정' },
];

const MOCK_CATEGORIES = [
  { id: 1, name: '도배', count: 12 },
  { id: 2, name: '타일', count: 8 },
  { id: 3, name: '필름', count: 15 },
  { id: 4, name: '장판', count: 6 },
  { id: 5, name: '마루', count: 10 },
];

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [activeMenu, setActiveMenu] = useState('samples');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [samples, setSamples] = useState(() => getCatalogSamples(true));
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ productNo: '', name: '', brand: '', line: '', categoryId: 1, specs: '', image: '', status: 'published' as 'published' | 'draft' });

  const refreshSamples = () => setSamples(getCatalogSamples(true));
  const openNewSample = () => {
    setEditingId(null);
    setForm({ productNo: '', name: '', brand: '', line: '', categoryId: 1, specs: '', image: '', status: 'published' });
    setEditorOpen(true);
  };
  const openEditSample = (sample: EditableSample) => {
    setEditingId(sample.id);
    setForm({ productNo: sample.productNo, name: sample.name, brand: sample.brand, line: sample.line, categoryId: sample.categoryId, specs: sample.specs.join(', '), image: sample.image, status: sample.status });
    setEditorOpen(true);
  };
  const submitSample = () => {
    if (!form.productNo.trim() || !form.name.trim() || !form.brand.trim()) return;
    const sample: EditableSample = {
      id: editingId ?? `custom-${Date.now()}`,
      productNo: form.productNo.trim(),
      name: form.name.trim(),
      brand: form.brand.trim(),
      line: form.line.trim() || '기타',
      categoryId: form.categoryId,
      specs: form.specs.split(',').map((value) => value.trim()).filter(Boolean),
      image: form.image.trim(),
      status: form.status,
      isCustom: editingId ? samples.find((sample) => sample.id === editingId)?.isCustom : true,
    };
    saveCatalogSample(sample);
    refreshSamples();
    setEditorOpen(false);
  };
  const downloadBackup = () => {
    const url = URL.createObjectURL(new Blob([exportCatalogBundle()], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `sample-book-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const restoreBackup = async (file?: File) => {
    if (!file) return;
    try {
      importCatalogBundle(await file.text());
      refreshSamples();
      window.alert('샘플북 백업을 불러왔습니다.');
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '백업 파일을 불러오지 못했습니다.');
    }
  };

  return (
    <MainLayout
      sidebar={
        <SidebarContent>
          <SidebarHeader>
            <div className="space-y-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
                className="gap-2 w-full justify-start"
              >
                <ArrowLeft className="w-4 h-4" />
                뷰어로 돌아가기
              </Button>
              <h1 className="text-xl font-bold text-sidebar-foreground">
                관리자 패널
              </h1>
            </div>
          </SidebarHeader>

          <SidebarNav>
            {ADMIN_MENU.map((item) => (
              <SidebarNavItem
                key={item.id}
                active={activeMenu === item.id}
                onClick={() => setActiveMenu(item.id)}
              >
                {item.label}
              </SidebarNavItem>
            ))}
          </SidebarNav>
        </SidebarContent>
      }
    >
      {/* Main Content */}
      <div className="h-full flex flex-col overflow-auto">
        {/* Header */}
        <div className="border-b border-border bg-card p-6 sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-foreground">
            {ADMIN_MENU.find((m) => m.id === activeMenu)?.label}
          </h2>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          {/* Samples Management */}
          {activeMenu === 'samples' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-foreground">
                  등록된 샘플
                </h3>
                <Button className="gap-2" onClick={openNewSample}>
                  <Plus className="w-4 h-4" />
                  새 샘플 추가
                </Button>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-3 px-4 font-semibold text-foreground">
                            품번
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">
                            제품명
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">
                            카테고리
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">
                            상태
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">
                            작성일
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-foreground">
                            작업
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {samples.map((sample) => (
                          <tr
                            key={sample.id}
                            className="border-b border-border hover:bg-muted transition-colors"
                          >
                            <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                              {sample.productNo}
                            </td>
                            <td className="py-3 px-4 text-foreground">
                              {sample.name}
                            </td>
                            <td className="py-3 px-4">
                              <Badge variant="outline">{CATEGORIES.find((category) => category.id === sample.categoryId)?.name ?? '기타'}</Badge>
                            </td>
                            <td className="py-3 px-4">
                              <Badge
                                variant={
                                  sample.status === 'published'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {sample.status === 'published'
                                  ? '공개'
                                  : '임시'}
                              </Badge>
                            </td>
                            <td className="py-3 px-4 text-muted-foreground">
                              {sample.brand} · {sample.line}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => navigate(`/sample/${sample.id}`)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0"
                                  onClick={() => openEditSample(sample)}
                                >
                                  <Edit2 className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-destructive"
                                  onClick={() => { if (window.confirm(`${sample.name} 샘플을 삭제하시겠습니까?`)) { deleteCatalogSample(sample.id); refreshSamples(); } }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>{editingId ? '샘플 편집' : '새 샘플 추가'}</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-2 sm:grid-cols-2">
                <div className="space-y-2"><Label>품번 *</Label><Input value={form.productNo} onChange={(event) => setForm({ ...form, productNo: event.target.value })} placeholder="예: 92102-1" /></div>
                <div className="space-y-2"><Label>제품명 *</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></div>
                <div className="space-y-2"><Label>브랜드 *</Label><Input value={form.brand} onChange={(event) => setForm({ ...form, brand: event.target.value })} /></div>
                <div className="space-y-2"><Label>제품 라인</Label><Input value={form.line} onChange={(event) => setForm({ ...form, line: event.target.value })} /></div>
                <div className="space-y-2"><Label>카테고리</Label><select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: Number(event.target.value) })} className="h-9 w-full rounded-md border bg-background px-3">{CATEGORIES.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
                <div className="space-y-2"><Label>공개 상태</Label><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as 'published' | 'draft' })} className="h-9 w-full rounded-md border bg-background px-3"><option value="published">공개</option><option value="draft">임시 저장</option></select></div>
                <div className="space-y-2 sm:col-span-2"><Label>특징·사양</Label><Input value={form.specs} onChange={(event) => setForm({ ...form, specs: event.target.value })} placeholder="쉼표로 구분: 방염, 회벽 텍스처" /></div>
                <div className="space-y-2 sm:col-span-2"><Label>이미지 경로</Label><Input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="/images/wallpaper/example.jpg" /></div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditorOpen(false)}>취소</Button><Button onClick={submitSample} disabled={!form.productNo.trim() || !form.name.trim() || !form.brand.trim()}>저장</Button></div>
            </DialogContent>
          </Dialog>

          {/* Categories Management */}
          {activeMenu === 'categories' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-foreground">
                  카테고리
                </h3>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  새 카테고리 추가
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {MOCK_CATEGORIES.map((cat) => (
                  <Card key={cat.id}>
                    <CardHeader>
                      <CardTitle className="text-lg">{cat.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          샘플 수: <span className="font-semibold">{cat.count}</span>
                        </p>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                          >
                            <Edit2 className="w-4 h-4 mr-2" />
                            수정
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            삭제
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* PDF Upload */}
          {activeMenu === 'upload' && (
            <div className="space-y-6 max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle>PDF 파일 업로드</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:bg-muted transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="font-medium text-foreground mb-1">
                      PDF 파일을 드래그하거나 클릭하여 업로드
                    </p>
                    <p className="text-sm text-muted-foreground">
                      자동으로 샘플 정보를 추출합니다
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-medium text-foreground">
                      카테고리 선택
                    </label>
                    <select className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground">
                      <option>도배</option>
                      <option>타일</option>
                      <option>필름</option>
                    </select>
                  </div>

                  <Button className="w-full">
                    업로드 및 분석 시작
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Settings */}
          {activeMenu === 'settings' && (
            <div className="space-y-6 max-w-2xl">
              <Card>
                <CardHeader>
                  <CardTitle>설정</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      애플리케이션 이름
                    </label>
                    <Input
                      defaultValue="E북 자재 샘플북"
                      className="bg-background"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      설명
                    </label>
                    <textarea
                      defaultValue="태블릿 환경에 최적화된 자재 샘플 카탈로그"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
                      rows={4}
                    />
                  </div>

                  <Button>저장</Button>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>샘플북 확장·백업</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">추가·편집·삭제한 카탈로그 구성을 JSON으로 백업하거나 다른 기기에서 복원할 수 있습니다.</p>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={downloadBackup}>편집 데이터 내보내기</Button>
                    <Button variant="outline" onClick={() => document.getElementById('catalog-backup-input')?.click()}>백업 불러오기</Button>
                    <input id="catalog-backup-input" hidden type="file" accept="application/json,.json" onChange={(event) => { void restoreBackup(event.target.files?.[0]); event.target.value = ''; }} />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
