const fs = require('fs');
let code = fs.readFileSync('src/pages/Onboarding.tsx', 'utf-8');
code = code.replace(
  'await advanceToNext(finalAnswer, currentQuestion.id, questionQueue, extractedEntities);',
  'console.log("BEFORE ADVANCE, questionQueue:", questionQueue);\n    await advanceToNext(finalAnswer, currentQuestion.id, questionQueue, extractedEntities);'
);
fs.writeFileSync('src/pages/Onboarding.tsx', code);
