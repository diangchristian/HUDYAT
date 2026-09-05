import {prisma} from "../config/db.js"


export const getAllAssessment = async () => {

    return await prisma.assessment.findMany()

}

export const getAssessmentById = async (assessmentId: string) => {

    return await prisma.assessment.findUnique({
        where:{
            id: assessmentId
        },
        include: {
            questions: {
                include: {
                    choices: {
                        include: {
                            gesture: true
                        }
                    }
                }
            }
        }
    })

}