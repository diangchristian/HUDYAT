import {useEffect,useRef,useState} from "react";
import type {RecognitionStatus} from "@/features/fsl-recognition/category-recognition";
import {CategoryRecognition} from "@/features/fsl-recognition/category-recognition";
import { Camera, CameraOff, LoaderCircle, Check, X } from "lucide-react";
import ElevatedButton from "@/components/ui/elavated-button";
import { Card } from "@/components/ui/card";
import { useCamera } from "@/hooks/use-camera";

export default function PracticeCamera({category,targetLabel,onCorrect}: {category?:string;targetLabel?:string;onCorrect?:()=>void}) {
  const { videoRef, status, error, start, stop } = useCamera();
  const isLive = status === "live";
  const [recognitionStatus,setRecognitionStatus]=useState<RecognitionStatus>({phase:'loading',message:'Preparing category model…'});
  const [recognitionRetry,setRecognitionRetry]=useState(0);
  const [feedback,setFeedback]=useState<{kind:'correct'|'wrong';target?:string}|null>(null);
  const feedbackTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  useEffect(()=>()=>{clearTimeout(feedbackTimer.current);},[targetLabel,category,isLive]);
  const successSound=useRef<HTMLAudioElement|null>(null);
  const wrongSound=useRef<HTMLAudioElement|null>(null);
  const beginCamera=()=>{
    setFeedback(null);
    // Unlock this audio element within the user's camera-button click.
    const sound=successSound.current??new Audio(import.meta.env.BASE_URL+'sounds/correct.mp3');
    successSound.current=sound;sound.muted=true;
    void sound.play().then(()=>{sound.pause();sound.currentTime=0;sound.muted=false;}).catch(()=>{sound.muted=false;});
    const wrong=wrongSound.current??new Audio(import.meta.env.BASE_URL+'sounds/wrong.mp3');
    wrongSound.current=wrong;wrong.muted=true;
    void wrong.play().then(()=>{wrong.pause();wrong.currentTime=0;wrong.muted=false;}).catch(()=>{wrong.muted=false;});
    void start();
  };
  const incorrect=()=>{
    clearTimeout(feedbackTimer.current);
    setFeedback({kind:'wrong',target:targetLabel});
    feedbackTimer.current=setTimeout(()=>setFeedback(null),1800);
    const sound=wrongSound.current??new Audio(import.meta.env.BASE_URL+'sounds/wrong.mp3');
    wrongSound.current=sound;sound.muted=false;sound.currentTime=0;
    void sound.play().catch(error=>console.warn('Wrong sound could not play:',error));
  };
  const recognized=()=>{
    clearTimeout(feedbackTimer.current);
    setFeedback({kind:'correct',target:targetLabel});
    wrongSound.current?.pause();
    const sound=successSound.current??new Audio(import.meta.env.BASE_URL+'sounds/correct.mp3');
    successSound.current=sound;sound.muted=false;sound.currentTime=0;
    void sound.play().catch(error=>console.warn('Success sound could not play:',error));
    // Briefly show success before advancing; navigation or camera stop cancels this timer.
    feedbackTimer.current=setTimeout(()=>{setFeedback(null);onCorrect?.();},650);
  };

  return (
    <div>
      <Card className="relative overflow-hidden border-hudyat-gold/30 bg-accent/20 p-2 sm:p-3">
        <div className="relative aspect-video min-h-60 w-full overflow-hidden rounded-lg bg-muted sm:min-h-56">
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            aria-label="Live mirrored camera preview"
            className={`h-full w-full -scale-x-100 object-contain ${isLive ? "" : "invisible"}`}
          />

          {!isLive && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-y-auto p-4 text-center sm:p-6">
              {status === "requesting"
                ? <LoaderCircle aria-hidden="true" className="size-8 shrink-0 animate-spin text-hudyat-gold motion-reduce:animate-none" />
                : <Camera aria-hidden="true" className="size-9 shrink-0 text-muted-foreground" />}
              <div role={error ? "alert" : "status"}>
                <p className="text-base font-extrabold">
                  {status === "requesting" ? "Waiting for camera permission…" : error ? "Camera unavailable" : "Ready to practice?"}
                </p>
                <p className="mt-1 max-w-sm text-xs text-muted-foreground sm:text-sm">
                  {error || (status === "requesting"
                    ? "Choose Allow in your browser's camera prompt."
                    : "Turn on your camera to see yourself signing.")}
                </p>
              </div>
              {status === "requesting" ? (
                <ElevatedButton text="CANCEL" variant="secondary" size="sm" className="min-h-11 sm:min-h-8" onClick={stop} />
              ) : (
                <ElevatedButton text={error ? "TRY AGAIN" : "START CAMERA"} icon={Camera} size="sm" className="min-h-11 sm:min-h-8" onClick={beginCamera} />
              )}
            </div>
          )}

          {category && <CategoryRecognition key={category} category={category} targetLabel={targetLabel} video={videoRef} active={isLive} onCorrect={recognized} onWrong={incorrect} onStatus={setRecognitionStatus} retry={recognitionRetry} />}

          {isLive && (
            <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
              <span role="status" className="rounded-full bg-background/95 px-3 py-1 text-xs font-bold text-foreground">
                <span aria-hidden="true" className="mr-2 inline-block size-2 rounded-full bg-green-500" />
                Camera on · Mirrored
              </span>
              <span role="status" aria-live="polite" aria-atomic="true">
                {feedback?.target===targetLabel && feedback && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-bold shadow-sm ${feedback.kind==='correct'?'bg-green-100 text-green-800':'bg-red-100 text-red-800'}`}>
                    {feedback.kind==='correct'?<Check className="size-3" aria-hidden="true"/>:<X className="size-3" aria-hidden="true"/>}
                    {feedback.kind==='correct'?'Correct':'Try again'}
                  </span>
                )}
              </span>
              </div>
              <ElevatedButton text="STOP" variant="secondary" size="sm" className="min-h-11 sm:min-h-8" icon={CameraOff} onClick={stop} />
            </div>
          )}
        </div>
      </Card>
      {category && <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
        <span className={recognitionStatus.phase==='error'?'text-destructive':''} title={recognitionStatus.version?'Model version: '+recognitionStatus.version:undefined}>
          {recognitionStatus.phase==='running'&&!isLive?'Model ready':recognitionStatus.message}
        </span>
        {recognitionStatus.phase==='error'&&<button className="shrink-0 underline" onClick={()=>{setRecognitionStatus({phase:'loading',message:'Retrying model…'});setRecognitionRetry(v=>v+1);}}>Retry</button>}
      </div>}

    </div>
  );
}
