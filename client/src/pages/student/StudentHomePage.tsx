import { useNavigate } from "react-router";
import { useState } from "react";
import {Banner} from "@/components/common/banner"

const MODES = [
    {
        title: "Learn FSL",
        image: "/icons/learn.png",
        color: "#6EC5FF",
        path: "#",
    },
    {
        title: "Practice",
        image: "/icons/practice.png",
        color: "#77D251",
        path: "/student/practice",
    },
    {
        title: "Quiz",
        image: "/icons/quiz.png",
        color: "#D8B4E2",
        path: "/student/quiz",
    },
]



export const StudentHomePage = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const handleModeClick = (path: string) => {
    navigate(path);
  };

  const handleMouseDown = (index: number) => {
    setActiveIndex(index);
  };

  const handleMouseUp = () => {
    setActiveIndex(null);
  };    

  return (
    <div className="">
      <Banner />

      <div className="mt-8">
            <span>MODES</span>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
               
                {MODES.map((mode, index) => (
                <div 
                    className="h-50 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-transform" 
                    key={index} 
                    onClick={() => handleModeClick(mode.path)}
                    onMouseDown={() => handleMouseDown(index)}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{ 
                        backgroundColor: mode.color,
                        boxShadow: activeIndex === index ? "none" : `0 6px 0 ${mode.color}99`,
                        transform: activeIndex === index ? "translateY(1px)" : "translateY(0)"
                    }}>
                    
                    <div className="size-30 bg-white rounded-full flex items-center justify-center select-none">
                         <img src={mode.image} alt={mode.title} width="70" height="70" />
                    </div>

                    <h3 className="text-2xl font-bold mt-2 text-white font-body select-none">{mode.title}</h3>
                </div>
                ))}
              
            </div>
      </div>
    </div>
  )
}
