/**
 * CameraSearch.tsx
 * AI 자재 검색 - 2단계 카메라 촬영 프로세스
 *
 * 단계:
 * 1단계: 백색 기준물(A4, 명함 등) 촬영 - 화이트 밸런스 기준 설정
 * 2단계: 자재 촬영 - 1단계 기준물 데이터를 활용한 정확한 검색
 *
 * 기능:
 * - 단계별 가이드 UI (1단계 → 2단계)
 * - 실시간 피드백 (밝기, 백색 물체 감지)
 * - 단일/앙상블 촬영 모드
 * - 갤러리 업로드 지원
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Camera, Upload, X, CheckCircle, AlertCircle, Loader2, ChevronLeft, RefreshCw, Layers, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getCameraFeedback, type FeedbackResult } from '@/lib/materialMatcherApi';

type CaptureMode = 'single' | 'ensemble';
type CameraStatus = 'idle' | 'loading' | 'ready' | 'error';
type SearchStage = 'reference' | 'material'; // 1단계: 백색 기준물, 2단계: 자재

export default function CameraSearch() {
  const [, navigate] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [cameraError, setCameraError] = useState<string>('');
  const [searchStage, setSearchStage] = useState<SearchStage>('reference'); // 현재 단계
  const [captureMode, setCaptureMode] = useState<CaptureMode>('single');
  
  // 1단계: 백색 기준물 이미지
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referencePreview, setReferencePreview] = useState<string>('');
  
  // 2단계: 자재 이미지들
  const [materialImages, setMaterialImages] = useState<File[]>([]);
  const [materialPreviews, setMaterialPreviews] = useState<string[]>([]);
  
  const [feedback, setFeedback] = useState<FeedbackResult | null>(null);
  const [isFeedbackLoading, setIsFeedbackLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [apiAvailable, setApiAvailable] = useState<boolean | null>(null);

  // API 서버 상태 확인
  useEffect(() => {
    const checkApi = async () => {
      try {
        const res = await fetch(
          `${(import.meta.env.VITE_MATCHER_API_URL as string) || 'http://localhost:8000'}/api/health`
        );
        const data = await res.json();
        setApiAvailable(data.sdk_ready === true);
      } catch {
        setApiAvailable(false);
      }
    };
    checkApi();
  }, []);

  // 카메라 시작
  const startCamera = useCallback(async () => {
    setCameraStatus('loading');
    setCameraError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraStatus('ready');
      }
    } catch (err: any) {
      setCameraStatus('error');
      if (err.name === 'NotAllowedError') {
        setCameraError('카메라 접근 권한이 없습니다. 브라우저 설정에서 카메라를 허용해 주세요.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('카메라를 찾을 수 없습니다. 기기에 카메라가 연결되어 있는지 확인해 주세요.');
      } else {
        setCameraError('카메라를 시작할 수 없습니다. 갤러리에서 이미지를 업로드해 주세요.');
      }
    }
  }, []);

  // 카메라 정지
  const stopCamera = useCallback(() => {
    if (feedbackTimerRef.current) {
      clearInterval(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraStatus('idle');
  }, []);

  // 컴포넌트 언마운트 시 카메라 정지
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  // 실시간 피드백
  useEffect(() => {
    if (cameraStatus !== 'ready' || !apiAvailable) return;

    const sendFeedback = async () => {
      if (!videoRef.current || !canvasRef.current || isFeedbackLoading) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        setIsFeedbackLoading(true);
        try {
          const result = await getCameraFeedback(blob);
          setFeedback(result);
        } catch {
          // 피드백 실패는 무시
        } finally {
          setIsFeedbackLoading(false);
        }
      }, 'image/jpeg', 0.7);
    };

    feedbackTimerRef.current = setInterval(sendFeedback, 2000);
    return () => {
      if (feedbackTimerRef.current) clearInterval(feedbackTimerRef.current);
    };
  }, [cameraStatus, apiAvailable, isFeedbackLoading]);

  // 사진 촬영 (단계별 처리)
  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const previewUrl = URL.createObjectURL(blob);

      if (searchStage === 'reference') {
        // 1단계: 백색 기준물 저장 (1장만)
        setReferenceImage(file);
        setReferencePreview(previewUrl);
      } else {
        // 2단계: 자재 이미지 저장
        if (captureMode === 'single') {
          setMaterialImages([file]);
          setMaterialPreviews([previewUrl]);
        } else {
          if (materialImages.length < 3) {
            setMaterialImages((prev) => [...prev, file]);
            setMaterialPreviews((prev) => [...prev, previewUrl]);
          }
        }
      }
    }, 'image/jpeg', 0.9);
  }, [searchStage, captureMode, materialImages.length]);

  // 갤러리 업로드 (단계별 처리)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (searchStage === 'reference') {
      // 1단계: 백색 기준물 (1장만)
      const file = files[0];
      setReferenceImage(file);
      setReferencePreview(URL.createObjectURL(file));
    } else {
      // 2단계: 자재 이미지 (최대 3장)
      const newFiles = captureMode === 'single' ? [files[0]] : files.slice(0, 3);
      const newPreviews = newFiles.map((f) => URL.createObjectURL(f));

      if (captureMode === 'single') {
        setMaterialImages(newFiles);
        setMaterialPreviews(newPreviews);
      } else {
        const remaining = 3 - materialImages.length;
        const toAdd = newFiles.slice(0, remaining);
        const toAddPreviews = newPreviews.slice(0, remaining);
        setMaterialImages((prev) => [...prev, ...toAdd]);
        setMaterialPreviews((prev) => [...prev, ...toAddPreviews]);
      }
    }
    e.target.value = '';
  };

  // 1단계 완료 → 2단계로 진행
  const proceedToMaterialStage = () => {
    if (!referenceImage) return;
    stopCamera();
    setSearchStage('material');
    setCameraStatus('idle');
    setFeedback(null);
  };

  // 1단계 재촬영
  const retakeReference = () => {
    setReferenceImage(null);
    setReferencePreview('');
    if (cameraStatus === 'idle') {
      startCamera();
    }
  };

  // 2단계 재촬영
  const retakeMaterial = () => {
    setMaterialImages([]);
    setMaterialPreviews([]);
    if (cameraStatus === 'idle') {
      startCamera();
    }
  };

  // 1단계로 돌아가기
  const backToReference = () => {
    setSearchStage('reference');
    setMaterialImages([]);
    setMaterialPreviews([]);
    setCameraStatus('idle');
    setFeedback(null);
    startCamera();
  };

  // 검색 실행
  const handleSearch = async () => {
    if (!referenceImage || !materialImages.length) return;
    setIsSearching(true);

    try {
      // sessionStorage에 저장 (결과 페이지에서 사용)
      const referenceBlob = new Blob([referenceImage], { type: 'image/jpeg' });
      const materialBlobs = materialImages.map((img) => new Blob([img], { type: 'image/jpeg' }));

      sessionStorage.setItem('referenceImage', referencePreview);
      sessionStorage.setItem(
        'materialImages',
        JSON.stringify(materialPreviews)
      );
      sessionStorage.setItem('captureMode', captureMode);

      navigate('/ai-search/result');
    } catch (err) {
      console.error('검색 실행 오류:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // ============ UI 렌더링 ============

  if (cameraStatus === 'error') {
    return (
      <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-xl font-bold text-white">카메라 오류</h2>
          <p className="text-sm text-slate-300">{cameraError}</p>
          <div className="space-y-2">
            <Button
              onClick={() => {
                setCameraStatus('idle');
                startCamera();
              }}
              className="w-full bg-primary hover:bg-primary/90"
            >
              다시 시도
            </Button>
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="w-full"
            >
              돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ============ 1단계: 백색 기준물 촬영 ============
  if (searchStage === 'reference') {
    if (referenceImage) {
      // 1단계 완료 - 확인 화면
      return (
        <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
          {/* 헤더 */}
          <div className="bg-black/30 backdrop-blur-md border-b border-white/10 p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-white">1단계: 백색 기준물 촬영 완료</h1>
                <p className="text-xs text-slate-400 mt-1">다음 단계에서 자재를 촬영해 주세요</p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                완료
              </Badge>
            </div>
          </div>

          {/* 콘텐츠 */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto">
            <div className="max-w-md w-full space-y-6">
              {/* 미리보기 */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">촬영된 기준물</p>
                <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-emerald-400/50 bg-slate-800">
                  <img
                    src={referencePreview}
                    alt="Reference"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="space-y-2">
                <Button
                  onClick={proceedToMaterialStage}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  <ArrowRight className="w-4 h-4" />
                  2단계: 자재 촬영하기
                </Button>
                <Button
                  onClick={retakeReference}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  다시 촬영
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 1단계 - 카메라 촬영 중
    return (
      <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        {/* 헤더 */}
        <div className="bg-black/30 backdrop-blur-md border-b border-white/10 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-lg font-bold text-white">1단계: 백색 기준물 촬영</h1>
              <Badge
                className={cn(
                  'flex items-center gap-1',
                  apiAvailable
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : 'bg-red-500/20 text-red-300 border-red-400/30'
                )}
              >
                <div className={cn('w-2 h-2 rounded-full', apiAvailable ? 'bg-emerald-400' : 'bg-red-400')} />
                {apiAvailable ? 'AI 서버 온라인' : 'AI 서버 오프라인'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">A4 용지, 명함 등 흰색 물체를 촬영해 주세요</p>
          </div>
        </div>

        {/* 카메라 및 피드백 */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <div className="max-w-2xl w-full space-y-4">
            {/* 비디오 */}
            {cameraStatus === 'ready' && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-slate-600 bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                />

                {/* 가이드라인 오버레이 */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3/5 h-3/5 border-2 border-dashed border-yellow-400/50 rounded-lg" />
                </div>

                {/* 피드백 상태 */}
                {feedback && (
                  <div className="absolute bottom-4 left-4 right-4 space-y-2">
                    {/* 밝기 */}
                    <div className={cn(
                      'px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2',
                      feedback.brightness_status === 'good'
                        ? 'bg-emerald-500/80 text-white'
                        : feedback.brightness_status === 'warning'
                        ? 'bg-yellow-500/80 text-white'
                        : 'bg-red-500/80 text-white'
                    )}>
                      {feedback.brightness_status === 'good' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      {feedback.brightness_message}
                    </div>

                    {/* 백색 물체 감지 */}
                    <div className={cn(
                      'px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2',
                      feedback.white_object_status === 'detected'
                        ? 'bg-emerald-500/80 text-white'
                        : 'bg-yellow-500/80 text-white'
                    )}>
                      {feedback.white_object_status === 'detected' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      {feedback.white_object_message}
                    </div>
                  </div>
                )}
              </div>
            )}

            {cameraStatus === 'loading' && (
              <div className="w-full aspect-video rounded-lg bg-slate-800 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-2">
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                취소
              </Button>
              <Button
                onClick={() => {
                  stopCamera();
                  startCamera();
                }}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                카메라 재시작
              </Button>
              <Button
                onClick={capturePhoto}
                disabled={cameraStatus !== 'ready'}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                <Camera className="w-4 h-4 mr-2" />
                촬영
              </Button>
            </div>

            {/* 갤러리 업로드 */}
            <div className="pt-2 border-t border-slate-700">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                갤러리에서 선택
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============ 2단계: 자재 촬영 ============
  if (searchStage === 'material') {
    if (materialImages.length > 0 || captureMode === 'single') {
      // 2단계 완료 - 확인 화면
      return (
        <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
          {/* 헤더 */}
          <div className="bg-black/30 backdrop-blur-md border-b border-white/10 p-4">
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-white">2단계: 자재 촬영 완료</h1>
                <p className="text-xs text-slate-400 mt-1">
                  {captureMode === 'single' ? '1장 촬영됨' : `${materialImages.length}장 촬영됨`}
                </p>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-400/30">
                <CheckCircle className="w-3 h-3 mr-1" />
                준비 완료
              </Badge>
            </div>
          </div>

          {/* 콘텐츠 */}
          <div className="flex-1 flex flex-col items-center justify-center p-4 overflow-auto">
            <div className="max-w-2xl w-full space-y-6">
              {/* 미리보기 그리드 */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider">촬영된 자재</p>
                <div className={cn(
                  'grid gap-2',
                  materialPreviews.length === 1 ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-3'
                )}>
                  {materialPreviews.map((preview, idx) => (
                    <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border-2 border-blue-400/50 bg-slate-800">
                      <img
                        src={preview}
                        alt={`Material ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => {
                          setMaterialImages((prev) => prev.filter((_, i) => i !== idx));
                          setMaterialPreviews((prev) => {
                            URL.revokeObjectURL(prev[idx]);
                            return prev.filter((_, i) => i !== idx);
                          });
                        }}
                        className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-600 rounded-full text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="space-y-2">
                <Button
                  onClick={handleSearch}
                  disabled={isSearching || !materialImages.length}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      검색 중...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      검색 시작
                    </>
                  )}
                </Button>
                <Button
                  onClick={retakeMaterial}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  다시 촬영
                </Button>
                <Button
                  onClick={backToReference}
                  variant="outline"
                  className="w-full"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  1단계로 돌아가기
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // 2단계 - 카메라 촬영 중
    return (
      <div className="h-screen w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
        {/* 헤더 */}
        <div className="bg-black/30 backdrop-blur-md border-b border-white/10 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-lg font-bold text-white">2단계: 자재 촬영</h1>
              <Badge
                className={cn(
                  'flex items-center gap-1',
                  apiAvailable
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : 'bg-red-500/20 text-red-300 border-red-400/30'
                )}
              >
                <div className={cn('w-2 h-2 rounded-full', apiAvailable ? 'bg-emerald-400' : 'bg-red-400')} />
                {apiAvailable ? 'AI 서버 온라인' : 'AI 서버 오프라인'}
              </Badge>
            </div>
            <p className="text-xs text-slate-400">
              {captureMode === 'single'
                ? '자재를 촬영해 주세요'
                : `자재를 촬영해 주세요 (${materialImages.length}/3)`}
            </p>
          </div>
        </div>

        {/* 카메라 및 피드백 */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <div className="max-w-2xl w-full space-y-4">
            {/* 비디오 */}
            {cameraStatus === 'ready' && (
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border-2 border-slate-600 bg-black">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                />

                {/* 가이드라인 오버레이 */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-3/5 h-3/5 border-2 border-dashed border-yellow-400/50 rounded-lg" />
                </div>

                {/* 피드백 상태 */}
                {feedback && (
                  <div className="absolute bottom-4 left-4 right-4 space-y-2">
                    <div className={cn(
                      'px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2',
                      feedback.brightness_status === 'good'
                        ? 'bg-emerald-500/80 text-white'
                        : feedback.brightness_status === 'warning'
                        ? 'bg-yellow-500/80 text-white'
                        : 'bg-red-500/80 text-white'
                    )}>
                      {feedback.brightness_status === 'good' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <AlertCircle className="w-4 h-4" />
                      )}
                      {feedback.brightness_message}
                    </div>
                  </div>
                )}
              </div>
            )}

            {cameraStatus === 'loading' && (
              <div className="w-full aspect-video rounded-lg bg-slate-800 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
              </div>
            )}

            {/* 썸네일 미리보기 */}
            {materialImages.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-300">촬영된 자재</p>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {materialPreviews.map((preview, idx) => (
                    <div key={idx} className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-400/50 bg-slate-800">
                      <img
                        src={preview}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        onClick={() => {
                          setMaterialImages((prev) => prev.filter((_, i) => i !== idx));
                          setMaterialPreviews((prev) => {
                            URL.revokeObjectURL(prev[idx]);
                            return prev.filter((_, i) => i !== idx);
                          });
                        }}
                        className="absolute top-0 right-0 p-0.5 bg-red-500/80 hover:bg-red-600 rounded-full text-white"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex gap-2">
              <Button
                onClick={backToReference}
                variant="outline"
                className="flex-1"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                이전
              </Button>
              <Button
                onClick={() => {
                  stopCamera();
                  startCamera();
                }}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                재시작
              </Button>
              <Button
                onClick={capturePhoto}
                disabled={cameraStatus !== 'ready' || (captureMode === 'ensemble' && materialImages.length >= 3)}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold"
              >
                <Camera className="w-4 h-4 mr-2" />
                촬영
              </Button>
            </div>

            {/* 갤러리 업로드 */}
            <div className="pt-2 border-t border-slate-700">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple={captureMode === 'ensemble'}
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                갤러리에서 선택
              </Button>
            </div>

            {/* 촬영 모드 선택 */}
            <div className="pt-2 border-t border-slate-700 space-y-2">
              <p className="text-xs font-semibold text-slate-300">촬영 모드</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setCaptureMode('single');
                    setMaterialImages([]);
                    setMaterialPreviews([]);
                  }}
                  variant={captureMode === 'single' ? 'default' : 'outline'}
                  className="flex-1 text-xs"
                >
                  <Camera className="w-3 h-3 mr-1" />
                  단일 촬영
                </Button>
                <Button
                  onClick={() => {
                    setCaptureMode('ensemble');
                    setMaterialImages([]);
                    setMaterialPreviews([]);
                  }}
                  variant={captureMode === 'ensemble' ? 'default' : 'outline'}
                  className="flex-1 text-xs"
                >
                  <Layers className="w-3 h-3 mr-1" />
                  다중 촬영
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
