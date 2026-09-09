import { Camera, Sparkles, Trophy } from "lucide-react";

import ElevatedButton from "@/components/ui/elavated-button";
import CategoriesGrid from "@/components/common/categories-grid";
import { NavLink } from "react-router";

const FEATURES = [
  { icon: Sparkles, label: "8 Fun Categories" },
  { icon: Camera, label: "Practice With Your Camera" },
  { icon: Trophy, label: "Track Your Progress" },
];


const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex justify-center lg:justify-between items-center py-4">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold font-body text-gray-900">
              HUDYAT
            </h1>

          <div className="hidden lg:flex">
            <NavLink to={"/login"}>
                <ElevatedButton text="GET STARTED" variant="primary" />
            </NavLink>
          </div>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-8">
                  <div
            aria-hidden="true"
            className="pointer-events-none absolute left-4 top-4 size-56 rounded-full bg-hudyat-gold/15 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-4 top-1/3 size-56 rounded-full bg-hudyat-blue/10 blur-3xl"
          />
        <section className="relative mx-auto max-w-7xl overflow-hidden pt-8 md:pt-4">
          {/* Decorative background accents */}


          <div className="relative flex min-h-[calc(100vh-160px)] flex-col items-center justify-center gap-10 lg:flex-row lg:gap-16 xl:gap-20">
            <div className="relative w-full lg:w-1/2">
              <img
                src="/hero_img.jpg"
                alt="A student practicing Filipino Sign Language"
                className="w-full h-auto rounded-3xl object-cover shadow-[var(--shadow-card-hover)] max-h-70 sm:max-h-100 lg:max-h-none"
              />
            </div>

            <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start gap-5 text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-hudyat-gold/15 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wide text-hudyat-gold">
                <Sparkles aria-hidden="true" className="size-3.5" />
                Fun & Interactive Learning
              </span>

              <h2 className="font-body font-bold text-foreground text-3xl sm:text-4xl md:text-5xl leading-tight">
                Learn Filipino Sign Language the fun way!
              </h2>

              <p className="max-w-lg text-base text-muted-foreground sm:text-lg">
                Master the FSL alphabet, numbers, greetings, and more through
                bite-sized lessons, hands-on camera practice, and fun quizzes
                made for young learners.
              </p>

              <NavLink to="/login">
                <ElevatedButton
                  text="START LEARNING"
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto sm:px-12 md:px-16"
                />
              </NavLink>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 lg:justify-start">
                {FEATURES.map((feature) => (
                  <span
                    key={feature.label}
                    className="inline-flex items-center gap-2 rounded-full border-2 bg-white px-4 py-2 text-xs font-bold text-foreground shadow-sm sm:text-sm"
                  >
                    <feature.icon
                      aria-hidden="true"
                      className="size-4 text-hudyat-gold"
                    />
                    {feature.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <CategoriesGrid />
        </section>
      </main>
    </div>
  );
};

export default HomePage;