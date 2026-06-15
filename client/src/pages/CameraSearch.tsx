/**
 * CameraSearch.tsx
 * AI 자재 검색 - 카메라 촬영 및 이미지 업로드 화면
 *
 * 기능:
 * - 카메라 실시간 프리뷰 (60% 중앙 가이드라인)
 * - 실시간 피드백 (밝기, 백색 기준물 감지)
 * - 단일 촬영 / 앙상블(다중) 촬영 모드
 * - 갤러리에서 이미지 업로드 지원
 * - 검색 결과 화면으로 이동
 */

import { useRef, useState, useEffect, useCallback } from 'react';
import { useLocation } from 'wouter';
import { Camera, Upload, X, CheckCircle, AlertCircle, Loader2, ChevronLeft, RefreshCw, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { getCameraFeedback, type FeedbackResult } from '@/lib/materialMatcherApi';

type CaptureMode = 'single' | 'ensemble';
type CameraStatus = 'idle' | 'loading' | 'ready' | 'error';

export default function CameraSearch() {
  const [, navigate] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [cameraStatus, setCameraStatus] = useState<CameraStatus>('idle');
  const [cameraError, setCameraError] = useState<string>('');
  const [captureMode, setCaptureMode] = useState<CaptureMode>('single');
  const [capturedImages, setCapturedImages] = useState<File[]>([]);
  const [capturedPreviews, setCapturedPreviews] = useState<string[]>([]);
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

  // 실시간 피드백 (2초마다 프레임 캡처 후 API 전송)
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
          // 피드백 실패는 무시 (카메라 화면은 유지)
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

  // 사진 촬영
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

      if (captureMode === 'single') {
        // 단일 모드: 기존 이미지 교체
        setCapturedImages([file]);
        setCapturedPreviews([previewUrl]);
      } else {
        // 앙상블 모드: 최대 3장까지 추가
        if (capturedImages.length < 3) {
          setCapturedImages((prev) => [...prev, file]);
          setCapturedPreviews((prev) => [...prev, previewUrl]);
        }
      }
    }, 'image/jpeg', 0.9);
  }, [captureMode, capturedImages.length]);

  // 갤러리 업로드
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newFiles = captureMode === 'single' ? [files[0]] : files.slice(0, 3);
    const newPreviews = newFiles.map((f) => URL.createObjectURL(f));

    if (captureMode === 'single') {
      setCapturedImages(newFiles);
      setCapturedPreviews(newPreviews);
    } else {
      const remaining = 3 - capturedImages.length;
      const toAdd = newFiles.slice(0, remaining);
      const toAddPreviews = newPreviews.slice(0, remaining);
      setCapturedImages((prev) => [...prev, ...toAdd]);
      setCapturedPreviews((prev) => [...prev, ...toAddPreviews]);
    }
    e.target.value = '';
  };

  // 이미지 제거
  const removeImage = (idx: number) => {
    setCapturedImages((prev) => prev.filter((_, i) => i !== idx));
    setCapturedPreviews((prev) => {
      URL.revokeObjectURL(prev[idx]);
      return prev.filter((_, i) => i !== idx);
    });
  };

  // 검색 실행 → 결과 페이지로 이동
  const handleSearch = async () => {
    if (!capturedImages.length) return;
    setIsSearching(true);

    // 이미지를 sessionStorage에 임시 저장 (결과 페이지에서 사용)
    const imageDataUrls: string[] = [];
    for (const file of capturedImages) {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      imageDataUrls.push(dataUrl);
    }

    sessionStorage.setItem('matchImages', JSON.stringify(imageDataUrls));
    sessionStorage.setItem('matchMode', captureMode);
    setIsSearching(false);
    navigate('/ai-search/result');
  };

  // 초기화
  const handleReset = () => {
    capturedPreviews.forEach((url) => URL.revokeObjectURL(url));
    setCapturedImages([]);
    setCapturedPreviews([]);
    setFeedback(null);
  };

  // 피드백 색상
  const feedbackColor = feedback?.status_color === 'green'
    ? 'text-green-500 border-green-500'
    : feedback?.status_color === 'yellow'
    ? 'text-yellow-500 border-yellow-500'
    : 'text-red-500 border-red-400';

  const isReady = feedback?.is_ready ?? false;
  const canSearch = capturedImages.length > 0;
  const ensembleTarget = 3;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 상단 헤더 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-base font-bold">AI 자재 검색</h1>
          <p className="text-xs text-muted-foreground">사진으로 유사한 자재를 찾아드립니다</p>
        </div>
        {/* API 상태 표시 */}
        <Badge
          variant={apiAvailable === true ? 'default' : apiAvailable === false ? 'destructive' : 'secondary'}
          className="text-xs"
        >
          {apiAvailable === true ? '서버 연결됨' : apiAvailable === false ? '서버 오프라인' : '확인 중...'}
        </Badge>
      </div>

      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-4 gap-4">

        {/* 모드 선택 */}
        <div className="flex gap-2 bg-muted rounded-lg p-1">
          <button
            onClick={() => { setCaptureMode('single'); handleReset(); }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all',
              captureMode === 'single'
                ? 'bg-background shadow text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Camera className="w-4 h-4" />
            단일 촬영
          </button>
          <button
            onClick={() => { setCaptureMode('ensemble'); handleReset(); }}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all',
              captureMode === 'ensemble'
                ? 'bg-background shadow text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <Layers className="w-4 h-4" />
            다중 촬영 (정확도 향상)
          </button>
        </div>

        {/* 촬영 안내 */}
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-3 text-sm text-blue-700 dark:text-blue-300">
          {captureMode === 'single' ? (
            <p>📸 <strong>A4 용지</strong>를 자재 옆에 놓고 촬영하면 색상 보정이 자동으로 적용됩니다.</p>
          ) : (
            <p>📸 동일 자재를 <strong>각도·조명을 달리하여 최대 3장</strong> 촬영하면 정확도가 향상됩니다.</p>
          )}
        </div>

        {/* 카메라 뷰파인더 */}
        <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
          {cameraStatus === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              <Camera className="w-12 h-12 text-gray-400" />
              <Button onClick={startCamera} variant="secondary">
                카메라 시작
              </Button>
            </div>
          )}
          {cameraStatus === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white animate-spin" />
            </div>
          )}
          {cameraStatus === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              <AlertCircle className="w-10 h-10 text-red-400" />
              <p className="text-white text-sm">{cameraError}</p>
              <Button onClick={startCamera} variant="secondary" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" /> 다시 시도
              </Button>
            </div>
          )}

          <video
            ref={videoRef}
            className={cn('w-full h-full object-cover', cameraStatus !== 'ready' && 'hidden')}
            playsInline
            muted
          />

          {/* 중앙 가이드라인 (60%) */}
          {cameraStatus === 'ready' && (
            <>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className={cn(
                    'border-2 rounded-sm transition-colors duration-300',
                    isReady ? 'border-green-400' : 'border-white/60'
                  )}
                  style={{ width: '60%', height: '60%' }}
                />
              </div>
              {/* 실시간 피드백 메시지 */}
              <div className="absolute bottom-3 left-0 right-0 flex justify-center px-4">
                <div
                  className={cn(
                    'bg-black/70 backdrop-blur-sm rounded-full px-4 py-1.5 text-xs font-medium border transition-colors duration-300',
                    isReady ? 'text-green-400 border-green-500' : 'text-yellow-300 border-yellow-500'
                  )}
                >
                  {feedback ? (
                    <span className="flex items-center gap-1.5">
                      {isReady
                        ? <CheckCircle className="w-3.5 h-3.5" />
                        : <AlertCircle className="w-3.5 h-3.5" />}
                      {feedback.message}
                    </span>
                  ) : (
                    <span className="text-white/70">자재를 가이드라인 안에 맞춰주세요</span>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* 숨겨진 캔버스 (프레임 캡처용) */}
        <canvas ref={canvasRef} className="hidden" />

        {/* 촬영 버튼 영역 */}
        {cameraStatus === 'ready' && (
          <div className="flex items-center gap-3">
            <Button
              onClick={capturePhoto}
              disabled={captureMode === 'ensemble' && capturedImages.length >= ensembleTarget}
              className="flex-1 h-12 text-base font-semibold"
            >
              <Camera className="w-5 h-5 mr-2" />
              {captureMode === 'ensemble'
                ? `촬영 (${capturedImages.length}/${ensembleTarget})`
                : '촬영'}
            </Button>
            <Button variant="outline" size="icon" className="h-12 w-12" onClick={stopCamera}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* 갤러리 업로드 버튼 */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => fileInputRef.current?.click()}
            disabled={captureMode === 'ensemble' && capturedImages.length >= ensembleTarget}
          >
            <Upload className="w-4 h-4 mr-2" />
            갤러리에서 선택
          </Button>
          {capturedImages.length > 0 && (
            <Button variant="ghost" size="icon" onClick={handleReset} title="초기화">
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={captureMode === 'ensemble'}
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* 촬영된 이미지 미리보기 */}
        {capturedPreviews.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              촬영된 이미지 ({capturedPreviews.length}장)
            </p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {capturedPreviews.map((url, idx) => (
                <div key={idx} className="relative flex-shrink-0">
                  <img
                    src={url}
                    alt={`촬영 ${idx + 1}`}
                    className="w-20 h-20 object-cover rounded-lg border border-border"
                  />
                  <button
                    onClick={() => removeImage(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-1 left-1 bg-black/60 text-white text-xs rounded px-1">
                    {idx + 1}
                  </div>
                </div>
              ))}
              {/* 앙상블 모드: 빈 슬롯 표시 */}
              {captureMode === 'ensemble' &&
                Array.from({ length: ensembleTarget - capturedPreviews.length }).map((_, idx) => (
                  <div
                    key={`empty-${idx}`}
                    className="flex-shrink-0 w-20 h-20 border-2 border-dashed border-muted-foreground/30 rounded-lg flex items-center justify-center"
                  >
                    <Camera className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* 검색 실행 버튼 */}
        <Button
          onClick={handleSearch}
          disabled={!canSearch || isSearching || !apiAvailable}
          className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
        >
          {isSearching ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              검색 중...
            </>
          ) : (
            <>
              <Camera className="w-5 h-5 mr-2" />
              {captureMode === 'ensemble' && capturedImages.length > 1
                ? `앙상블 검색 (${capturedImages.length}장)`
                : 'AI 자재 검색'}
            </>
          )}
        </Button>

        {!apiAvailable && apiAvailable !== null && (
          <p className="text-xs text-center text-red-500">
            AI 검색 서버가 오프라인 상태입니다. 서버를 시작한 후 다시 시도해 주세요.
          </p>
        )}
      </div>
    </div>
  );
}
