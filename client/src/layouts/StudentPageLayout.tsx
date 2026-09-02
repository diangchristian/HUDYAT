import { useState, useRef } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";

const navItems = [
  { name: "Home", path: "/student/home", image: "/icons/home.png" },
  { name: "Learn", path: "/student/learn", image: "/icons/learn.png" },
  { name: "Practice", path: "/student/practice", image: "/icons/practice.png" },
  { name: "Assessment", path: "/student/assessment", image: "/icons/assessment.png" },
  { name: "My Progress", path: "/student/progress", image: "/icons/progress.png" },
];



const StudentPageLayout = () => {
  const navigate = useNavigate();
  const [showPopover, setShowPopover] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = () => {
    setShowPopover(false);
    // TODO: Add logout logic
    console.log("Logout clicked");
  };

  const handleSettings = () => {
    setShowPopover(false);
    navigate("/student/settings");
  };

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setShowPopover(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setShowPopover(false);
    }, 300); // 300ms delay
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      {/* Sidebar - Hidden on mobile */}
      <aside className="hidden lg:block lg:w-64 border-r-2 bg-white">
        <div className="flex items-center gap-3 border-b px-6 py-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F5C04A] text-2xl">
            
          </div>

          <div>
            <h1 className="text-2xl font-bold font-body">Hudyat</h1>
            <p className="text-xs text-gray-500">
              FSL Learning Support
            </p>
          </div>
        </div>

        <nav className="px-3 py-6">
          <ul className="space-y-1">
            {navItems.map((item) => {
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    end={item.path === "/"}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition-colors font-body uppercase ${
                        isActive
                          ? "shadow-[var(--shadow-button)] active:shadow-[0_1px_0_#887041] bg-hudyat-gold text-white"
                          : "text-gray-600 hover:bg-foreground/5"
                      }`
                    }
                  >
                    <span className="size-8 flex items-center justify-center"> 
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    </span>
                    {item.name}
                  </NavLink>
                </li>
              );
            })}
            
            {/* Other button with popover */}
            <li 
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <button
                onClick={() => setShowPopover(!showPopover)}
                className="w-full flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-bold transition-colors font-body uppercase text-gray-600 hover:bg-foreground/5"
              >
                <span className="size-8 flex items-center justify-center"> 
                    <img src="/icons/other.png" alt="Other" className="w-full h-full object-contain" />
                </span>
                Other
              </button>

              {/* Popover Menu */}
              {showPopover && (
                <div className="absolute left-20 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                  <button
                    onClick={handleSettings}
                    className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors border-t"
                  >
                    Logout
                  </button>
                </div>
              )}
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0 max-w-6xl  mx-auto">
        <div className="p-4 sm:p-6 lg:p-8 ">
          <Outlet />
        </div>
      </main>

      {/* Bottom Navigation - Visible on mobile only */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t-2 border-gray-200">
        <ul className="flex justify-around items-center">
          {navItems.map((item) => {
            return (
              <li key={item.path} className="flex-1">
                <NavLink
                  to={item.path}
                  end={item.path === "/"}
                  className={`flex justify-center items-center py-3`}
                >
                  {({ isActive }) => (
                    <span className={`size-10 flex items-center justify-center rounded transition-colors ${
                      isActive ? "bg-amber-100 p-1 border-2 border-amber-400 rounded-md" : ""
                    }`}> 
                        <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                    </span>
                  )}
                </NavLink>
              </li>
            );
          })}
          
          {/* Other button with popover */}
          <li className="flex-1 relative" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
            <button
              onClick={() => setShowPopover(!showPopover)}
              className="w-full flex justify-center items-center py-3"
            >
              <span className={`size-10 flex items-center justify-center rounded transition-colors ${
                showPopover ? "bg-amber-100 p-1 border-2 border-amber-400 rounded-md" : ""
              }`}> 
                  <img src="/icons/other.png" alt="Other" className="w-full h-full object-contain" />
              </span>
            </button>

            {/* Popover Menu */}
            {showPopover && (
              <div className="absolute right-0 bottom-full mb-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={handleSettings}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  Settings
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors border-t"
                >
                  Logout
                </button>
              </div>
            )}
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default StudentPageLayout