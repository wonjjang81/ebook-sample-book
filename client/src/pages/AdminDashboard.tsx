import { useState } from 'react';
import { useLocation } from 'wouter';
import { MainLayout, SidebarContent, SidebarHeader, SidebarNav, SidebarNavItem } from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Upload, Edit2, Trash2, Eye, Search, FolderTree, Package, CheckCircle2, FileClock, ArrowUp, ArrowDown, EyeOff } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { deleteCatalogSample, exportCatalogBundle, getCatalogSamples, getManagedCategories, importCatalogBundle, saveCatalogSample, saveManagedCategories, type EditableSample, type ManagedCategory } from '@/data/sampleData';

const ADMIN_MENU = [
  { id: 'samples', label: '샘플 관리' },
  { id: 'categories', label: '카테고리 관리' },
  { id: 'upload', label: 'PDF 업로드' },
  { id: 'settings', label: '설정' },
];

export default function AdminDashboard() {
  const [, navigate] = useLocation();
  const [activeMenu, setActiveMenu] = useState('samples');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categories, setCategories] = useState<ManagedCategory[]>(() => getManagedCategories());
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [sampleSearch, setSampleSearch] = useState('');
  const [sampleStatus, setSampleStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [samples, setSamples] = useState(() => getCatalogSamples(true));
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ productNo: '', name: '', brand: '', line: '', categoryId: 1, specs: '', image: '', status: 'published' as 'published' | 'draft' });

  const refreshSamples = () => setSamples(getCatalogSamples(true));
  const persistCategories = (next: ManagedCategory[]) => {
    const normalized = next.map((category, order) => ({ ...category, order }));
    setCategories(normalized);
    saveManagedCategories(normalized);
  };
  const openNewCategory = () => {
    setEditingCategoryId(null);
    setNewCategoryName('');
    setCategoryEditorOpen(true);
  };
  const openEditCategory = (category: ManagedCategory) => {
    setEditingCategoryId(category.id);
    setNewCategoryName(category.name);
    setCategoryEditorOpen(true);
  };
  const submitCategory = () => {
    const name = newCategoryName.trim();
    if (!name || categories.some((category) => category.name === name && category.id !== editingCategoryId)) return;
    if (editingCategoryId) {
      persistCategories(categories.map((category) => category.id === editingCategoryId ? { ...category, name } : category));
    } else {
      const id = Math.max(0, ...categories.map((category) => category.id)) + 1;
      persistCategories([...categories, { id, name, visible: true, order: categories.length }]);
    }
    setCategoryEditorOpen(false);
  };
  const moveCategory = (id: number, direction: -1 | 1) => {
    const index = categories.findIndex((category) => category.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= categories.length) return;
    const next = [...categories];
    [next[index], next[target]] = [next[target], next[index]];
    persistCategories(next);
  };
  const removeCategory = (category: ManagedCategory) => {
    const count = samples.filter((sample) => sample.categoryId === category.id).length;
    if (count > 0) {
      window.alert(`이 카테고리에 ${count}개의 샘플이 연결되어 있습니다. 샘플을 먼저 이동해 주세요.`);
      return;
    }
    if (window.confirm(`'${category.name}' 카테고리를 삭제하시겠습니까?`)) persistCategories(categories.filter((item) => item.id !== category.id));
  };
  const filteredAdminSamples = samples.filter((sample) => {
    const query = sampleSearch.trim().toLocaleLowerCase('ko-KR');
    if (sampleStatus !== 'all' && sample.status !== sampleStatus) return false;
    return !query || [sample.productNo, sample.name, sample.brand, sample.line].some((value) => value.toLocaleLowerCase('ko-KR').includes(query));
  });
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
        <div className="border-b border-border bg-card px-5 py-4 md:px-8 sticky top-0 z-10">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-wider text-blue-600">Sample book studio</p><h2 className="text-2xl font-bold text-foreground">{ADMIN_MENU.find((m) => m.id === activeMenu)?.label}</h2></div>
            <Button variant="outline" onClick={() => navigate('/')} className="hidden sm:flex">샘플북 보기</Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-50/70 p-4 md:p-8">
          {/* Samples Management */}
          {activeMenu === 'samples' && (
            <div className="mx-auto max-w-7xl space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <Card><CardContent className="flex items-center gap-4 p-5"><span className="rounded-xl bg-blue-100 p-3 text-blue-700"><Package className="h-5 w-5" /></span><div><p className="text-2xl font-bold">{samples.length}</p><p className="text-sm text-muted-foreground">전체 샘플</p></div></CardContent></Card>
                <Card><CardContent className="flex items-center gap-4 p-5"><span className="rounded-xl bg-emerald-100 p-3 text-emerald-700"><CheckCircle2 className="h-5 w-5" /></span><div><p className="text-2xl font-bold">{samples.filter((sample) => sample.status === 'published').length}</p><p className="text-sm text-muted-foreground">공개 중</p></div></CardContent></Card>
                <Card><CardContent className="flex items-center gap-4 p-5"><span className="rounded-xl bg-amber-100 p-3 text-amber-700"><FileClock className="h-5 w-5" /></span><div><p className="text-2xl font-bold">{samples.filter((sample) => sample.status === 'draft').length}</p><p className="text-sm text-muted-foreground">임시 저장</p></div></CardContent></Card>
              </div>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div><h3 className="text-lg font-semibold text-foreground">등록된 샘플</h3><p className="text-sm text-muted-foreground">품번, 제품명, 브랜드를 한 번에 검색하고 관리합니다.</p></div>
                <Button className="gap-2" onClick={openNewSample}>
                  <Plus className="w-4 h-4" />
                  새 샘플 추가
                </Button>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="flex flex-col gap-3 border-b p-4 sm:flex-row">
                    <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={sampleSearch} onChange={(event) => setSampleSearch(event.target.value)} className="pl-9" placeholder="품번, 제품명, 브랜드 검색" /></div>
                    <select value={sampleStatus} onChange={(event) => setSampleStatus(event.target.value as typeof sampleStatus)} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="all">전체 상태</option><option value="published">공개</option><option value="draft">임시 저장</option></select>
                  </div>
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
                        {filteredAdminSamples.map((sample) => (
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
                              <Badge variant="outline">{categories.find((category) => category.id === sample.categoryId)?.name ?? '기타'}</Badge>
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
                    {filteredAdminSamples.length === 0 && <div className="p-10 text-center text-sm text-muted-foreground">검색 조건에 맞는 샘플이 없습니다.</div>}
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
                <div className="space-y-2"><Label>카테고리</Label><select value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: Number(event.target.value) })} className="h-9 w-full rounded-md border bg-background px-3">{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div>
                <div className="space-y-2"><Label>공개 상태</Label><select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as 'published' | 'draft' })} className="h-9 w-full rounded-md border bg-background px-3"><option value="published">공개</option><option value="draft">임시 저장</option></select></div>
                <div className="space-y-2 sm:col-span-2"><Label>특징·사양</Label><Input value={form.specs} onChange={(event) => setForm({ ...form, specs: event.target.value })} placeholder="쉼표로 구분: 방염, 회벽 텍스처" /></div>
                <div className="space-y-2 sm:col-span-2"><Label>이미지 경로</Label><Input value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} placeholder="/images/wallpaper/example.jpg" /></div>
              </div>
              <div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setEditorOpen(false)}>취소</Button><Button onClick={submitSample} disabled={!form.productNo.trim() || !form.name.trim() || !form.brand.trim()}>저장</Button></div>
            </DialogContent>
          </Dialog>

          {/* Categories Management */}
          {activeMenu === 'categories' && (
            <div className="mx-auto max-w-5xl space-y-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <div><h3 className="text-lg font-semibold text-foreground">카테고리 구조</h3><p className="text-sm text-muted-foreground">노출 순서와 사용 여부를 즉시 관리합니다.</p></div>
                <Button className="gap-2" onClick={openNewCategory}>
                  <Plus className="w-4 h-4" />
                  새 카테고리 추가
                </Button>
              </div>
              <Card className="overflow-hidden">
                <div className="grid grid-cols-[1fr_auto] items-center border-b bg-slate-50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:grid-cols-[64px_1fr_120px_110px_190px]"><span className="hidden sm:block">순서</span><span>카테고리</span><span className="hidden sm:block">샘플</span><span className="hidden sm:block">노출</span><span>관리</span></div>
                {categories.map((category, index) => {
                  const count = samples.filter((sample) => sample.categoryId === category.id).length;
                  return <div key={category.id} className="grid grid-cols-[1fr_auto] items-center gap-3 border-b px-4 py-4 last:border-0 sm:grid-cols-[64px_1fr_120px_110px_190px]">
                    <div className="hidden items-center gap-1 sm:flex"><Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={index === 0} onClick={() => moveCategory(category.id, -1)} aria-label="위로 이동"><ArrowUp className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="sm" className="h-7 w-7 p-0" disabled={index === categories.length - 1} onClick={() => moveCategory(category.id, 1)} aria-label="아래로 이동"><ArrowDown className="h-3.5 w-3.5" /></Button></div>
                    <div className="flex min-w-0 items-center gap-3"><span className="rounded-lg bg-blue-50 p-2 text-blue-700"><FolderTree className="h-4 w-4" /></span><div className="min-w-0"><p className="truncate font-semibold">{category.name}</p><p className="text-xs text-muted-foreground sm:hidden">샘플 {count}개 · {category.visible ? '노출 중' : '숨김'}</p></div></div>
                    <div className="hidden sm:block"><Badge variant="secondary">{count}개</Badge></div>
                    <div className="hidden sm:block"><Badge variant={category.visible ? 'default' : 'outline'}>{category.visible ? '노출 중' : '숨김'}</Badge></div>
                    <div className="flex justify-end gap-1"><Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => persistCategories(categories.map((item) => item.id === category.id ? { ...item, visible: !item.visible } : item))}>{category.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}<span className="sr-only">노출 전환</span></Button><Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => openEditCategory(category)}><Edit2 className="h-4 w-4" /><span className="sr-only">수정</span></Button><Button variant="ghost" size="sm" className="h-8 px-2 text-destructive" onClick={() => removeCategory(category)}><Trash2 className="h-4 w-4" /><span className="sr-only">삭제</span></Button></div>
                  </div>;
                })}
              </Card>
              <p className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">샘플이 연결된 카테고리는 실수로 삭제되지 않도록 보호됩니다. 먼저 샘플의 카테고리를 이동한 뒤 삭제할 수 있습니다.</p>
            </div>
          )}

          <Dialog open={categoryEditorOpen} onOpenChange={setCategoryEditorOpen}>
            <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>{editingCategoryId ? '카테고리 이름 변경' : '새 카테고리 추가'}</DialogTitle></DialogHeader><div className="space-y-2 py-3"><Label htmlFor="category-name">카테고리 이름</Label><Input id="category-name" autoFocus value={newCategoryName} onChange={(event) => setNewCategoryName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submitCategory(); }} placeholder="예: 페인트" /><p className="text-xs text-muted-foreground">중복되지 않는 짧고 명확한 이름을 사용하세요.</p></div><div className="flex justify-end gap-2"><Button variant="outline" onClick={() => setCategoryEditorOpen(false)}>취소</Button><Button onClick={submitCategory} disabled={!newCategoryName.trim() || categories.some((category) => category.name === newCategoryName.trim() && category.id !== editingCategoryId)}>저장</Button></div></DialogContent>
          </Dialog>

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
