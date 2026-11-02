// PROTOTYPE, delete me. PracticeCamera with larger controls and a full-view visual success screen.
import {useEffect,useRef,useState} from "react";
import type {RecognitionStatus} from "@/features/fsl-recognition/category-recognition";
import {CategoryRecognition} from "@/features/fsl-recognition/category-recognition";
import {isDiagnosticsEnabled} from "@/features/fsl-recognition/landmark-diagnostics";
import {LandmarkDiagnosticsPanel} from "@/features/fsl-recognition/landmark-diagnostics-panel";
import { Camera, CameraOff, LoaderCircle, Check, SlidersHorizontal, X } from "lucide-react";
import ElevatedButton from "@/components/ui/elavated-button";
import { Card } from "@/components/ui/card";
import { useCamera } from "@/hooks/use-camera";
import { cameraGrantRemembered, forgetCameraGrant } from "@/lib/camera-session";

const BLOCKED_STEPS=[
  {icon:SlidersHorizontal,text:'Tap the icon beside the web address'},
  {icon:Camera,text:'Turn Camera on'},
  {icon:Check,text:'Come back here'},
];
const CONFETTI_COLORS=['var(--hudyat-gold)','#FFFFFF','#FFF4D6'];
const CONFETTI_MOTION='@keyframes proto-confetti { from { transform: translateY(-20px) rotate(0); opacity: 1 } to { transform: translateY(340px) rotate(420deg); opacity: 0 } }';

export default function PrototypePracticeCamera({category,targetLabel,onCorrect,confetti=false}: {category?:string;targetLabel?:string;onCorrect?:()=>void;confetti?:boolean}) {
  const { videoRef, status, error, start, stop } = useCamera();
  const isLive = status === "live";
  const [recognitionStatus,setRecognitionStatus]=useState<RecognitionStatus>({phase:'loading',message:'Preparing category model…'});
  const [recognitionRetry,setRecognitionRetry]=useState(0);
  const [diagnostics]=useState(isDiagnosticsEnabled);
  const [feedback,setFeedback]=useState<{kind:'correct'|'wrong';target?:string}|null>(null);
  const feedbackTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  // A correct sign has been accepted and the success screen is up; later guesses mustn't cancel the advance.
  const advancing=useRef(false);
  useEffect(()=>()=>{clearTimeout(feedbackTimer.current);advancing.current=false;},[targetLabel,category,isLive]);
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
  // Lessons remount this component on every Try step, so reuse the earlier grant instead of asking for a click again.
  useEffect(()=>{
    let cancelled=false;
    void cameraGrantRemembered().then(remembered=>{if(remembered&&!cancelled)void start();});
    return ()=>{cancelled=true;};
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  },[]);
  // A site can't undo "Never allow", so explain the fix and start by itself once the student has allowed it.
  const [blocked,setBlocked]=useState(false);
  useEffect(()=>{
    if(status!=='error')return;
    let cancelled=false;
    let permission:PermissionStatus|undefined;
    const onChange=()=>{
      if(!permission)return;
      setBlocked(permission.state==='denied');
      if(permission.state==='granted')void start();
    };
    // Browsers that can't report the camera permission keep the normal error message.
    navigator.permissions?.query({name:'camera' as PermissionName}).then(result=>{
      if(cancelled)return;
      permission=result;
      setBlocked(result.state==='denied');
      result.addEventListener('change',onChange);
    }).catch(()=>setBlocked(false));
    return ()=>{cancelled=true;permission?.removeEventListener('change',onChange);};
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-check each time the camera fails
  },[status]);
  const showBlockedHelp=status==='error'&&blocked;
  // An explicit Stop/Cancel means "camera off": don't turn it back on until they press Start again.
  const turnOff=()=>{forgetCameraGrant();stop();};
  const incorrect=()=>{
    if(advancing.current)return;
    clearTimeout(feedbackTimer.current);
    setFeedback({kind:'wrong',target:targetLabel});
    feedbackTimer.current=setTimeout(()=>setFeedback(null),1800);
    const sound=wrongSound.current??new Audio(import.meta.env.BASE_URL+'sounds/wrong.mp3');
    wrongSound.current=sound;sound.muted=false;sound.currentTime=0;
    void sound.play().catch(error=>console.warn('Wrong sound could not play:',error));
  };
  const recognized=()=>{
    if(advancing.current)return;
    advancing.current=true;
    clearTimeout(feedbackTimer.current);
    setFeedback({kind:'correct',target:targetLabel});
    wrongSound.current?.pause();
    const sound=successSound.current??new Audio(import.meta.env.BASE_URL+'sounds/correct.mp3');
    successSound.current=sound;sound.muted=false;sound.currentTime=0;
    void sound.play().catch(error=>console.warn('Success sound could not play:',error));
    // Hold the success screen long enough for a child to see it; navigation or camera stop cancels this timer.
    feedbackTimer.current=setTimeout(()=>{advancing.current=false;setFeedback(null);onCorrect?.();},1500);
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
                : showBlockedHelp
                  ? <CameraOff aria-hidden="true" className="size-9 shrink-0 text-hudyat-gold" />
                  : <Camera aria-hidden="true" className="size-9 shrink-0 text-muted-foreground" />}
              {showBlockedHelp ? (
                <div role="alert" className="w-full max-w-md">
                  <p className="text-xl font-bold">Camera is blocked</p>
                  <ol className="mt-3 grid gap-2 text-left sm:grid-cols-3">
                    {BLOCKED_STEPS.map(({icon:Icon,text},position)=>(
                      <li key={text} className="flex items-center gap-2 rounded-xl bg-background p-2 sm:flex-col sm:text-center">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-hudyat-gold/20 text-foreground">
                          <Icon aria-hidden="true" className="size-5" />
                        </span>
                        <span className="min-w-0 text-base leading-snug">{position+1}. {text}</span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-2 text-base text-muted-foreground">Ask your teacher for help</p>
                </div>
              ) : (
                <div role={error ? "alert" : "status"}>
                  <p className="text-lg font-extrabold">
                    {status === "requesting" ? "Waiting for camera permission…" : error ? "Camera unavailable" : "Ready to practice?"}
                  </p>
                  <p className="mt-1 max-w-sm text-base text-muted-foreground">
                    {error || (status === "requesting"
                      ? "Choose Allow in your browser's camera prompt."
                      : "Turn on your camera to see yourself signing.")}
                  </p>
                </div>
              )}
              {status === "requesting" ? (
                <ElevatedButton text="CANCEL" variant="secondary" size="lg" className="min-h-14" onClick={turnOff} />
              ) : (
                <ElevatedButton text={error ? "TRY AGAIN" : "START CAMERA"} icon={Camera} size="lg" className="min-h-14" onClick={beginCamera} />
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
                {feedback?.target===targetLabel && feedback?.kind==='wrong' && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-2 text-lg font-extrabold text-white shadow-sm">
                    <X className="size-6" strokeWidth={3} aria-hidden="true"/>
                    Try again
                  </span>
                )}
              </span>
              </div>
              <ElevatedButton text="STOP" variant="secondary" size="sm" className="min-h-11" icon={CameraOff} onClick={turnOff} />
            </div>
          )}

          {/* Deaf learners can't hear the success sound, so success fills the whole camera view. */}
          {isLive && feedback?.kind==='correct' && feedback.target===targetLabel && (
            <div role="status" className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-green-600/90 text-white">
              {confetti && <>
                <style>{CONFETTI_MOTION}</style>
                {Array.from({length:18},(_,i)=>(
                  <span key={i} aria-hidden="true" className="absolute top-0 size-3 rounded-sm motion-reduce:hidden" style={{left:`${3+i*5.4}%`,background:CONFETTI_COLORS[i%3],animation:`proto-confetti 1.2s ease-in ${(i%6)*70}ms both`}} />
                ))}
              </>}
              <span className="flex size-20 items-center justify-center rounded-full bg-white text-green-700 motion-safe:animate-bounce sm:size-28">
                <Check className="size-12 sm:size-16" strokeWidth={4} aria-hidden="true"/>
              </span>
              <span className="text-3xl font-extrabold sm:text-4xl">Correct!</span>
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
      {diagnostics && <LandmarkDiagnosticsPanel />}
    </div>
  );
}
