import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, ArrowLeft, Save } from 'lucide-react';
import { useLocation } from 'wouter';
import { useState, useEffect } from 'react';

interface Project {
  id: string;
  name: string;
  selectedProducts: string[];
  likedProducts: string[];
  createdAt: number;
}

export default function Settings() {
  const [, navigate] = useLocation();
  const [projectName, setProjectName] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);

  // 프로젝트 로드
  useEffect(() => {
    const saved = localStorage.getItem('projects');
    if (saved) {
      setProjects(JSON.parse(saved));
    }
  }, []);

  const saveProject = () => {
    if (!projectName.trim()) {
      alert('프로젝트명을 입력해주세요.');
      return;
    }

    const selectedProducts = JSON.parse(localStorage.getItem('selectedProducts') || '[]');
    const likedProducts = JSON.parse(localStorage.getItem('likedProducts') || '[]');

    const newProject: Project = {
      id: Date.now().toString(),
      name: projectName,
      selectedProducts,
      likedProducts,
      createdAt: Date.now(),
    };

    const updated = [...projects, newProject];
    localStorage.setItem('projects', JSON.stringify(updated));
    setProjects(updated);
    setProjectName('');
    alert('프로젝트가 저장되었습니다.');
  };

  const loadProject = (project: Project) => {
    localStorage.setItem('selectedProducts', JSON.stringify(project.selectedProducts));
    localStorage.setItem('likedProducts', JSON.stringify(project.likedProducts));
    localStorage.setItem('currentProject', project.name);
    alert('프로젝트가 불러워졌습니다.');
    navigate('/');
  };

  const deleteProject = (projectId: string) => {
    if (confirm('이 프로젝트를 삭제하시겠습니까?')) {
      const updated = projects.filter((p) => p.id !== projectId);
      localStorage.setItem('projects', JSON.stringify(updated));
      setProjects(updated);
    }
  };

  const updateProject = (projectId: string) => {
    const selectedProducts = JSON.parse(localStorage.getItem('selectedProducts') || '[]');
    const likedProducts = JSON.parse(localStorage.getItem('likedProducts') || '[]');

    const updated = projects.map((p) =>
      p.id === projectId
        ? {
            ...p,
            selectedProducts,
            likedProducts,
          }
        : p
    );
    localStorage.setItem('projects', JSON.stringify(updated));
    setProjects(updated);
    alert('프로젝트가 업데이트되었습니다.');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-3xl font-bold">프로젝트 설정</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto p-6">
        <Tabs defaultValue="manage" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manage">프로젝트 관리</TabsTrigger>
            <TabsTrigger value="save">새로 저장</TabsTrigger>
          </TabsList>

          {/* 프로젝트 관리 탭 */}
          <TabsContent value="manage" className="space-y-4 mt-6">
            <div className="space-y-2">
              <h3 className="font-medium text-lg">저장된 프로젝트</h3>
              {projects.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  저장된 프로젝트가 없습니다.
                </p>
              ) : (
                <div className="space-y-3">
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-base">{project.name}</p>
                        <p className="text-sm text-muted-foreground">
                          선택: {project.selectedProducts.length} | 찜: {project.likedProducts.length}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(project.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => loadProject(project)}
                        >
                          불러오기
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateProject(project.id)}
                          title="현재 선택/찜 내용으로 업데이트"
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteProject(project.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* 새로 저장 탭 */}
          <TabsContent value="save" className="space-y-4 mt-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">프로젝트명</label>
                <Input
                  placeholder="프로젝트명 입력"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="mt-2"
                />
              </div>
              <Button onClick={saveProject} className="w-full" size="lg">
                저장
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
