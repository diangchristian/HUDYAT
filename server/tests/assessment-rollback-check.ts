import {prisma} from '../src/config/db.js';
import {submitAssessment} from '../src/services/assessment.service.js';
const rollback=Error('INTENTIONAL_TEST_ROLLBACK');
const original=prisma.$transaction.bind(prisma);
try {
 const progress=await prisma.categoryProgress.findFirst({where:{OR:[{lessonCompletedAt:{not:null}},{status:'COMPLETED'}],category:{assessment:{status:'PUBLISHED'}}},select:{categoryId:true,learnerId:true}});
 if(!progress){console.log('No unlocked learner/category available for a rollback-only submission test.');}
 else {
  const assessment=await prisma.assessment.findUniqueOrThrow({where:{categoryId:progress.categoryId},include:{questions:{include:{choices:true}}}});
  const answers=assessment.questions.map(q=>({questionId:q.id,selectedChoiceId:q.choices.find(c=>c.gestureId===q.gestureId)!.id}));
  let reachedEnd=false;
  Object.assign(prisma,{$transaction:(fn:Parameters<typeof original>[0])=>original(async tx=>{await (fn as Function)(tx);reachedEnd=true;throw rollback;})});
  const start=performance.now();
  try{await submitAssessment(progress.categoryId,progress.learnerId,answers);}catch(error){
   console.log(JSON.stringify({questions:answers.length,reachedEnd,rolledBack:true,elapsedMs:Math.round(performance.now()-start),error:error===rollback?'none (successful test deliberately rolled back)':error instanceof Error?error.message:String(error)}));
  }
 }
}finally{await prisma.$disconnect();}
