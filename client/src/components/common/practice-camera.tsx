import {useEffect,useRef,useState,type ReactNode} from "react";
import type {HoldFeedback,RecognitionStatus} from "@/features/fsl-recognition/category-recognition";
import {CategoryRecognition} from "@/features/fsl-recognition/category-recognition";
// EXPERIMENT (feature/recog-enhancement): switchable enhancements + ?lab=1 panel.
import {BackgroundPreview} from "@/features/fsl-recognition/background-preview";
import {CAMERA_SIZE,isLabEnabled,loadSettings,saveSettings,type RecognitionSettings} from "@/features/fsl-recognition/experiment";
import {RecognitionLab} from "@/features/fsl-recognition/recognition-lab";
import {isDiagnosticsEnabled} from "@/features/fsl-recognition/landmark-diagnostics";
import {LandmarkDiagnosticsPanel} from "@/features/fsl-recognition/landmark-diagnostics-panel";
import { Ban, Camera, CameraOff, Check, Droplets, Wallpaper, X } from "lucide-react";
import ElevatedButton from "@/components/ui/elavated-button";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { useCamera } from "@/hooks/use-camera";
import { useCameraPreference } from "@/lib/camera-preference";
import { cameraGrantRemembered, forgetCameraGrant } from "@/lib/camera-session";
import { CAMERA_BACKGROUNDS, useCameraBackground, type CameraBackground } from "@/lib/camera-background";
import { publicAsset } from "@/features/fsl-recognition/registry";

const ROUND_BUTTON="flex size-11 shrink-0 items-center justify-center rounded-full bg-background/90 text-foreground shadow-sm transition-colors hover:bg-background focus-visible:ring-4 focus-visible:ring-hudyat-gold focus-visible:outline-none active:scale-95 sm:size-9";

// fillOnPhone: below tablet width, fill the parent's height instead of a fixed 16:9 frame (practice page).
// quietWrong: no red chip or sound for wrong readings (recognition flags wrong while the hand is still moving); onWrong still fires so the page can show its own gentle hint (sign test).
// bare: no frame of its own, for when the parent already draws one (lesson Try card).
export default function PracticeCamera({category,targetLabel,onCorrect,onWrong,onRunningChange,fillOnPhone=false,quietWrong=false,bare=false}: {category?:string;targetLabel?:string;onCorrect?:()=>void;onWrong?:()=>void;/** Told when recognition starts or stops checking signs (e.g. so a timer can wait for it). */onRunningChange?:(running:boolean)=>void;fillOnPhone?:boolean;quietWrong?:boolean;bare?:boolean}) {
  const { videoRef, status, error, start, stop: stopCamera } = useCamera();
  const isLive = status === "live";
  const [recognitionStatus,setRecognitionStatus]=useState<RecognitionStatus>({phase:'loading',message:'Preparing category model…'});
  const [recognitionRetry,setRecognitionRetry]=useState(0);
  const [settings,setSettings]=useState<RecognitionSettings>(loadSettings);
  const [lab]=useState(isLabEnabled);
  const [diagnostics]=useState(isDiagnosticsEnabled);
  const changeSettings=(next:RecognitionSettings)=>{saveSettings(next);setSettings(next);};
  const [hold,setHold]=useState<HoldFeedback|null>(null);
  const background=useCameraBackground(s=>s.choice);
  const [picking,setPicking]=useState(false);
  const [feedback,setFeedback]=useState<{kind:'correct'|'wrong';target?:string}|null>(null);
  const feedbackTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
  useEffect(()=>()=>{clearTimeout(feedbackTimer.current);},[targetLabel,category,isLive]);
  const successSound=useRef<HTMLAudioElement|null>(null);
  const wrongSound=useRef<HTMLAudioElement|null>(null);
  // Only an explicit STOP forgets the choice; leaving the page just releases the stream.
  const stop=()=>{useCameraPreference.getState().decline();stopCamera();};
  const beginCamera=()=>{
    useCameraPreference.getState().want();
    setFeedback(null);
    // Unlock this audio element within the user's camera-button click.
    const sound=successSound.current??new Audio(import.meta.env.BASE_URL+'sounds/correct.mp3');
    successSound.current=sound;sound.muted=true;
    void sound.play().then(()=>{sound.pause();sound.currentTime=0;sound.muted=false;}).catch(()=>{sound.muted=false;});
    const wrong=wrongSound.current??new Audio(import.meta.env.BASE_URL+'sounds/wrong.mp3');
    wrongSound.current=wrong;wrong.muted=true;
    void wrong.play().then(()=>{wrong.pause();wrong.currentTime=0;wrong.muted=false;}).catch(()=>{wrong.muted=false;});
    void start(CAMERA_SIZE[settings.cameraResolution]);
  };
  // Resume without a click if the camera was started earlier this session, or permission is remembered from an earlier visit.
  useEffect(()=>{
    let cancelled=false;
    const resume=useCameraPreference.getState().wanted?Promise.resolve(true):cameraGrantRemembered();
    void resume.then(remembered=>{if(remembered&&!cancelled)void start(CAMERA_SIZE[settings.cameraResolution]);});
    return ()=>{cancelled=true;};
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only on mount
  },[]);
  // An explicit Stop/Cancel means "camera off": don't turn it back on until they press Start again.
  const turnOff=()=>{forgetCameraGrant();stop();};
  const incorrect=()=>{
    onWrong?.();
    if(quietWrong)return;
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

  // The coaching line ("no hand detected", "hold your sign steady") is the main thing to read while signing, so it takes over the camera chip on the video.
  const running=isLive&&recognitionStatus.phase==='running';
  useEffect(()=>{onRunningChange?.(running);},[running,onRunningChange]);
  const holdShown=isLive&&settings.holdFeedback&&hold&&!feedback;
  const preparing=isLive&&(recognitionStatus.phase==='loading'||recognitionStatus.phase==='ready');
  const coachText=(holdShown&&hold.hint)||(running?recognitionStatus.message.replace(/^Recognition running · /,''):preparing?'Getting ready…':'');
  const result=isLive&&feedback?.target===targetLabel?feedback?.kind:undefined;
  const coach=coachText?coachText[0].toUpperCase()+coachText.slice(1):'';

  return (
    <div className={cn(fillOnPhone&&"max-md:flex max-md:h-full max-md:flex-col")}>
      <Card className={cn("relative overflow-hidden border-hudyat-gold/30 bg-accent/20 p-2 sm:p-3",fillOnPhone&&"max-md:min-h-0 max-md:flex-1",bare&&"border-0 bg-transparent p-0 sm:p-0")}>
        <div className={cn("relative aspect-video min-h-60 w-full overflow-hidden rounded-lg bg-muted sm:min-h-56",fillOnPhone&&"max-md:aspect-auto max-md:h-full max-md:min-h-0")}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            aria-label="Live mirrored camera preview"
            className={`h-full w-full -scale-x-100 object-contain ${isLive ? "" : "invisible"}`}
          />

          {isLive && background!=='off' && (
            <BackgroundPreview video={videoRef} choice={background} className="absolute inset-0 h-full w-full -scale-x-100 object-contain" />
          )}

          {!isLive && (
            // Same waving hands and gold bar as the app's LoadingScreen, so it feels like part of the lesson.
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 overflow-y-auto bg-[#FFF8E7] p-4 text-center font-body sm:p-6">
              {status === "requesting" ? (
                <div aria-hidden="true" className="flex shrink-0 flex-col items-center gap-2">
                  <div className="flex items-end gap-2 text-3xl sm:text-4xl">
                    {["🖐️", "👋", "✋"].map((hand, i) => (
                      <span key={hand} className="inline-block animate-[hudyat-wave_1s_ease-in-out_infinite] motion-reduce:animate-none" style={{ animationDelay: `${i * 160}ms` }}>{hand}</span>
                    ))}
                  </div>
                  <div className="h-2 w-32 overflow-hidden rounded-full bg-hudyat-gold/20">
                    <div className="h-full animate-[hudyat-loading-fill_1.6s_ease-in-out_infinite_alternate] rounded-full bg-hudyat-gold motion-reduce:animate-none motion-reduce:w-full" />
                  </div>
                </div>
              ) : (
                <span aria-hidden="true" className={cn("flex size-16 shrink-0 items-center justify-center rounded-full border-4 border-white shadow-[0_4px_0_#0000001a]", error ? "bg-rose-100 text-rose-600" : "bg-hudyat-gold text-white")}>
                  {error ? <CameraOff className="size-8" /> : <Camera className="size-8" />}
                </span>
              )}
              <div role={error ? "alert" : "status"}>
                <p className="text-lg font-black text-[#3C3C3C]">
                  {status === "requesting" ? "Getting your camera ready…" : error ? "Camera unavailable" : "Ready to sign?"}
                </p>
                <p className="mt-1 max-w-sm text-sm font-semibold text-[#6B6B6B]">
                  {error || (status === "requesting"
                    ? "Tap Allow if your browser asks."
                    : "Turn on your camera to see yourself signing.")}
                </p>
              </div>
              {status === "requesting" ? (
                <ElevatedButton text="CANCEL" variant="secondary" size="sm" className="min-h-11 sm:min-h-8" onClick={turnOff} />
              ) : (
                <ElevatedButton text={error ? "TRY AGAIN" : "START CAMERA"} icon={Camera} size="sm" className="min-h-11 sm:min-h-8" onClick={beginCamera} />
              )}
            </div>
          )}

          {category && <CategoryRecognition key={category} category={category} targetLabel={targetLabel} video={videoRef} active={isLive} onCorrect={recognized} onWrong={incorrect} onStatus={setRecognitionStatus} retry={recognitionRetry} settings={settings} onHold={setHold} />}

          {holdShown && (
            <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-col items-center gap-2">
              <div aria-hidden="true" className="h-2.5 w-full max-w-xs overflow-hidden rounded-full bg-background/80">
                <div className="h-full rounded-full bg-hudyat-gold transition-[width] duration-150 ease-out motion-reduce:transition-none" style={{width:`${Math.round(hold.progress*100)}%`}} />
              </div>
            </div>
          )}

          {isLive && picking && (
            <BackgroundPicker choice={background} onPick={c=>{useCameraBackground.getState().choose(c);setPicking(false);}} onClose={()=>setPicking(false)} />
          )}

          {isLive && (
            <div className="absolute inset-x-3 top-3 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
              {/* One chip for hints and results: it recolours and pops in place, so nothing else on the video moves. */}
              {(result || coach) && (
                <span role="status" aria-live="polite" aria-atomic="true" className={cn("rounded-full px-3 py-1 text-sm font-extrabold shadow-sm transition-colors duration-200", result==='correct'?"bg-green-100 text-green-800":result==='wrong'?"bg-red-100 text-red-800":"bg-background/95 text-foreground")}>
                  <span key={result??'hint'} className="inline-flex items-center duration-200 ease-out animate-in fade-in-0 zoom-in-90 motion-reduce:animate-none">
                    {result==='correct'?<Check aria-hidden="true" className="mr-1.5 size-4" strokeWidth={3}/>
                      :result==='wrong'?<X aria-hidden="true" className="mr-1.5 size-4" strokeWidth={3}/>
                      :<span aria-hidden="true" className={cn("mr-2 inline-block size-2 rounded-full", preparing?"animate-pulse bg-hudyat-gold motion-reduce:animate-none":"bg-green-500")} />}
                    {result==='correct'?'Correct':result==='wrong'?'Try again':coach}
                  </span>
                </span>
              )}
              </div>
              {/* Icon-only so they stay out of the way of the video; still 44px tap targets on phones. */}
              <div className="flex shrink-0 gap-2">
                <button type="button" aria-label="Change background" title="Change background" aria-expanded={picking} onClick={()=>setPicking(v=>!v)} className={cn(ROUND_BUTTON,picking&&"bg-hudyat-gold text-white hover:bg-hudyat-gold")}>
                  <Wallpaper aria-hidden="true" className="size-5 sm:size-4.5" />
                </button>
                <button type="button" aria-label="Stop camera" title="Stop camera" onClick={turnOff} className={ROUND_BUTTON}>
                  <CameraOff aria-hidden="true" className="size-5 sm:size-4.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
      {category && <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
        <span className={recognitionStatus.phase==='error'?'text-destructive':''} title={recognitionStatus.version?'Model version: '+recognitionStatus.version:undefined}>
          {running?null:recognitionStatus.phase==='running'?'Model ready':recognitionStatus.message}
        </span>
        {recognitionStatus.phase==='error'&&<button className="shrink-0 underline" onClick={()=>{setRecognitionStatus({phase:'loading',message:'Retrying model…'});setRecognitionRetry(v=>v+1);}}>Retry</button>}
      </div>}
      {lab && <RecognitionLab settings={settings} onChange={changeSettings} />}
      {diagnostics && <LandmarkDiagnosticsPanel />}

    </div>
  );
}

/** Off, Blur, then the built-in pictures, along the bottom of the video. */
function BackgroundPicker({choice,onPick,onClose}:{choice:CameraBackground;onPick:(choice:CameraBackground)=>void;onClose:()=>void}) {
  const options:{id:CameraBackground;label:string;thumb:ReactNode}[]=[
    {id:'off',label:'None',thumb:<Ban aria-hidden="true" className="size-6 text-[#6B6B6B]" />},
    {id:'blur',label:'Blur',thumb:<Droplets aria-hidden="true" className="size-6 text-[#6B6B6B]" />},
    ...CAMERA_BACKGROUNDS.map(b=>({id:b.id,label:b.label,thumb:<img src={publicAsset(b.src)} alt="" className="h-full w-full object-cover" />})),
  ];
  // Escape closes it wherever focus is (it usually stays on the toggle button).
  useEffect(()=>{const close=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();};window.addEventListener('keydown',close);return ()=>window.removeEventListener('keydown',close);},[onClose]);
  return (
    <div role="group" aria-label="Camera background" className="absolute inset-x-3 bottom-3 z-10 flex gap-2 overflow-x-auto rounded-2xl bg-background/95 p-2 font-body shadow-md">
      {options.map(o=>(
        <button key={o.id} type="button" aria-pressed={choice===o.id} onClick={()=>onPick(o.id)} className="flex shrink-0 flex-col items-center gap-1 rounded-xl p-1 text-xs font-extrabold text-[#3C3C3C] focus-visible:ring-4 focus-visible:ring-hudyat-gold focus-visible:outline-none active:scale-95">
          <span className={cn("flex h-11 w-16 items-center justify-center overflow-hidden rounded-lg border-2 border-[#e0e0e0] bg-muted",choice===o.id&&"border-hudyat-gold ring-2 ring-hudyat-gold")}>{o.thumb}</span>
          {o.label}
        </button>
      ))}
    </div>
  );
}
