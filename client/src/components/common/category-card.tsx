import { type LucideIcon } from "lucide-react";

type CategoryCardProps = {
  title: string;
  icon: LucideIcon;
  color: "green" | "yellow" | "blue" | "purple" | "orange" | "red";
  desc?: string;
  onClick?: () => void;
};

const CATEGORY_COLORS = {
  green: {
    border: "border-lime-500",
    bg: "bg-lime-100",
    icon: "text-lime-600",
  },
  yellow: {
    border: "border-yellow-500",
    bg: "bg-yellow-100",
    icon: "text-yellow-600",
  },
  blue: {
    border: "border-sky-500",
    bg: "bg-sky-100",
    icon: "text-sky-600",
  },
  purple: {
    border: "border-purple-300",
    bg: "bg-purple-100",
    icon: "text-purple-500",
  },
  orange: {
    border: "border-orange-500",
    bg: "bg-orange-100",
    icon: "text-orange-500",
  },
  red: {
    border: "border-red-400",
    bg: "bg-red-100",
    icon: "text-red-500",
  },
};

export default function CategoryCard({ 
  title, 
  icon: Icon, 
  color, 
  desc,
  onClick 
}: CategoryCardProps) {
  const style = CATEGORY_COLORS[color];

  return (
    <button
      onClick={onClick}
      className={`
        group flex flex-col items-center rounded-2xl border-2 bg-white
        px-3 py-4 transition-all duration-300
        hover:-translate-y-1 hover:shadow-lg
        ${style.border}
      `}
    >
      <div
        className={`
          mb-3 flex h-12 w-12 items-center justify-center
          rounded-full ${style.bg}
          transition-transform duration-300 group-hover:scale-110
        `}
      >
        <Icon className={`h-6 w-6 ${style.icon}`} />
      </div>

      <h3 className="text-center text-xs font-semibold text-gray-800">
        {title}
      </h3>

      {desc && (
        <p className="mt-1 text-center text-[10px] leading-tight text-gray-500">
          {desc}
        </p>
      )}
    </button>
  );
}