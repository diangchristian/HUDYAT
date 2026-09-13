// Development-only component harness. Excluded from the production Vite entry.
// It doesn't alter app authentication or call backend APIs.
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import PracticeCamera from "../src/components/common/practice-camera";
import "../src/index.css";

export function Harness() {
  const [category, setCategory] = useState("alphabet");
  const [mounted, setMounted] = useState(true);
  const [synthetic, setSynthetic] = useState(false);
  function useSyntheticCamera() {
    // A blank test video exercises camera start/stop and MediaPipe without accessing a real camera.
    const canvas = document.createElement("canvas"); canvas.width = 640; canvas.height = 480;
    const context = canvas.getContext("2d")!; context.fillStyle = "#e5e7eb"; context.fillRect(0,0,640,480);
    Object.defineProperty(navigator.mediaDevices, "getUserMedia", {configurable:true, value: async () => {
      const stream = canvas.captureStream(5);
      const timer = window.setInterval(() => context.fillRect(0, 0, 640, 480), 200);
      const track = stream.getVideoTracks()[0];
      const stop = track.stop.bind(track);
      track.stop = () => { window.clearInterval(timer); stop(); };
      return stream;
    }});
    setSynthetic(true);
  }
  return <main className="mx-auto max-w-3xl space-y-4 p-6">
    <h1 className="text-2xl font-bold">Recognition component check</h1>
    <p>Development harness: saved real poses test predictions; the optional blank video tests camera lifecycle only.</p>
    <div className="flex flex-wrap gap-4">
      <button onClick={()=>setCategory("alphabet")}>Alphabet</button>
      <button onClick={()=>setCategory("numbers")}>Numbers</button>
      <button onClick={()=>setMounted(value=>!value)}>{mounted?"Unmount camera":"Mount camera"}</button>
      <button disabled={synthetic} onClick={useSyntheticCamera}>{synthetic?"Synthetic camera enabled":"Use synthetic camera"}</button>
    </div>
    {mounted && <PracticeCamera key={category} category={category} targetLabel="A"/>}
  </main>;
}
createRoot(document.getElementById("root")!).render(<StrictMode><Harness/></StrictMode>);
