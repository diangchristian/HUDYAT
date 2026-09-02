import { useEffect, useState } from "react";
import Confetti from "react-confetti";
import { Star } from "lucide-react";
import ElevatedButton from "@/components/ui/elavated-button";
import { useNavigate } from "react-router";

const QuizSummary = () => {
    const navigate = useNavigate();
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <div className="relative flex h-dvh max-h-dvh flex-col overflow-hidden bg-white font-body text-[#111827]">
      {/* Confetti background */}
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        numberOfPieces={180}
        gravity={0.04}
        recycle={true}
        run={true}
        colors={[
          "#F7B6B2",
          "#BFE8ED",
          "#C8C9EE",
          "#FFE7A3",
          "#AEE3E5",
        ]}
        style={{
          position: "fixed",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />

      {/* Main content */}
      <main className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 py-6">
        <section className="flex w-full max-w-xl flex-col items-center text-center">
          {/* Stars */}
          <div className="mb-3 flex items-end justify-center gap-3">
            <Star
              className="size-14 fill-[#ffbd3d] text-[#ffbd3d] sm:size-16"
              strokeWidth={1.5}
            />

            <Star
              className="size-20 fill-[#ffbd3d] text-[#ffbd3d] sm:size-24"
              strokeWidth={1.5}
            />

            <Star
              className="size-14 text-[#ffbd3d] sm:size-16"
              strokeWidth={2}
            />
          </div>

          <h1 className="text-2xl font-extrabold text-[#4a4a4a] sm:text-3xl">
            Quiz Complete!
          </h1>

          {/* Score cards */}
          <div className="mt-8 flex w-full max-w-xs justify-center gap-4 sm:mt-10 sm:gap-6">
            {/* Total */}
            <div className="w-28 overflow-hidden rounded-xl border-2 border-[#ffbd3d] bg-white sm:w-32">
              <div className="bg-[#ffbd3d] px-2 py-0.5 text-[10px] font-extrabold text-white">
                TOTAL ITEMS
              </div>

              <div className="flex h-16 items-center justify-center sm:h-18">
                <span className="text-4xl font-extrabold text-[#4a4a4a]">
                  10
                </span>
              </div>
            </div>

            {/* Score */}
            <div className="w-28 overflow-hidden rounded-xl border-2 border-[#72d44f] bg-white sm:w-32">
              <div className="bg-[#72d44f] px-2 py-0.5 text-[10px] font-extrabold text-white">
                SCORE
              </div>

              <div className="flex h-16 items-center justify-center sm:h-18">
                <span className="text-4xl font-extrabold text-[#4a4a4a]">
                  9
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom actions */}
      <footer className="relative z-10 shrink-0 border-t border-[#ededed] bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-center gap-4 px-5 py-4 sm:px-10 sm:py-5">
          {/* <ElevatedButton
            text="BACK TO LESSONS"
            variant="secondary"
            size="lg"
          /> */}

          <ElevatedButton
            text="CONTINUE"
            variant="primary"
            size="lg"
            onClick={() => navigate("/student/learn")}
          />
        </div>
      </footer>
    </div>
  );
};

export default QuizSummary;