const waves = [
  { emoji: "🖐️", delay: "0ms" },
  { emoji: "👋", delay: "160ms" },
  { emoji: "✋", delay: "320ms" },
];

const LoadingScreen = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex h-dvh w-full flex-col items-center justify-center gap-16 bg-background px-6 font-body"
    >
      <h1 className="text-6xl font-extrabold text-foreground sm:text-7xl">
        Hudyat
      </h1>

      <div className="flex flex-col items-center gap-3">
        <div className="flex items-end gap-3 text-4xl sm:text-5xl">
          {waves.map((wave, index) => (
            <span
              key={index}
              className="inline-block animate-[hudyat-wave_1s_ease-in-out_infinite]"
              style={{ animationDelay: wave.delay }}
            >
              {wave.emoji}
            </span>
          ))}
        </div>

        <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-hudyat-gold">
          Loading....
        </p>

        <div className="h-2 w-40 overflow-hidden rounded-full bg-muted sm:w-48">
          <div className="h-full animate-[hudyat-loading-fill_1.6s_ease-in-out_infinite_alternate] rounded-full bg-hudyat-gold" />
        </div>
      </div>

      <span className="sr-only">Loading, please wait...</span>
    </div>
  );
};

export default LoadingScreen;
