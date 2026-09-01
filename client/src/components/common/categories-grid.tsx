import CategoryCard from "./category-card";
import { CATEGORIES } from "./categories.constants";

export default function CategoriesGrid() {
  return (
    <div className="hidden lg:grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 ">
      {CATEGORIES.map((item) => (
        <CategoryCard
          key={item.title}
          title={item.title}
          icon={item.icon}
          color={item.color}
          desc={item.desc}
        />
      ))}
    </div>
  );
}
