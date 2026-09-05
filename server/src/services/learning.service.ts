import {prisma} from "../config/db.js"


export const getLearningAreas = async () => {
  return await prisma.learningArea.findMany({
    orderBy: {
      displayOrder: "asc",
    },
    include: {
      categories: {
        where: {
          isActive: true
        },
          orderBy: {
          displayOrder: "asc",
        },
      }
    }
  });
};


export const getCategoryLesson = async (categoryId: string) => {

  const categoryGestures =  await prisma.categoryGesture.findMany({
    where: {
      categoryId
    },
    orderBy: {
      displayOrder: "asc",
    },
    include:{
      gesture: true
    }
  })

  const category = await prisma.category.findUnique({
    where: {
      id: categoryId
  }})

  return{
    category,
    categoryGestures
  };
}