import ElevatedButton from "@/components/ui/elavated-button";
import CategoriesGrid from "@/components/common/categories-grid";
import { NavLink } from "react-router";


const HomePage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-white">
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
        <section className="max-w-7xl mx-auto pt-8 md:pt-12 h-[calc(100vh-88px)]">
          <div className="flex flex-col gap-8 lg:flex-row xl:gap-10 lg:gap-16 items-center justify-center h-full xl:-mt-40">
            <div className="w-full lg:w-1/2">
              <img
                src="/hero_img.jpg"
                alt="Hero"
                className="w-full h-auto rounded-lg object-cover max-h-70 sm:max-h-100 lg:max-h-none"
              />
            </div>

            <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start gap-6 text-center lg:text-left">
              <h2 className="font-body font-bold font-foreground text-3xl sm:text-4xl md:text-5xl leading-tight">
                Learn Filipino Sign Language the fun way!
              </h2>

              <div className="">
                <ElevatedButton
                    text="START LEARNING"
                    variant="primary"
                    size="lg"
                    className="w-full sm:w-auto sm:px-12 md:px-16"
                />
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