import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const themes=JSON.parse(fs.readFileSync(path.join(root,'content/travel-question-seeds.json'),'utf8'));
const seen=new Set(),bank=[];
for(const theme of themes){
 if(theme.questions.length!==40||theme.choices.length!==6||new Set(theme.choices).size!==6||theme.artworkIds.length!==6)throw new Error('Each theme needs 40 questions and six unique answers: '+theme.key);
 for(const [i,prompt] of theme.questions.entries()){
  const key=prompt.toLowerCase().replace(/[^a-z0-9]/g,'');if(seen.has(key)||!prompt.endsWith('?'))throw new Error('Duplicate or incomplete prompt: '+prompt);seen.add(key);
  let choices=theme.choices.map((label,j)=>({id:`${theme.key}-${j+1}`,label,artworkId:theme.artworkIds[j]}));choices=[...choices.slice(i%6),...choices.slice(0,i%6)];
  bank.push({id:`T${String(bank.length+1).padStart(4,'0')}`,category:theme.title,min_age:10,max_age:30,answer_format:'single_choice',max_answer_characters:40,prompt,language:'en',mode:'perfect_day',publication_status:'preview_ready',topicId:theme.topicId,familyId:theme.key,phase:theme.phase,choices});
 }
}
if(bank.length!==1000)throw new Error('The travel bank must contain exactly 1,000 questions.');
const data=JSON.stringify(bank,null,2);
fs.writeFileSync(path.join(root,'content/travel-questions.json'),data+'\n');
fs.writeFileSync(path.join(root,'packages/core/src/travel-question-bank.ts'),"// Generated from content/travel-question-seeds.json. Keep editorial changes in the seed file.\nimport type {Question} from './types.ts';\nexport const travelQuestionBank:Question[]="+data+';\n');
console.log(`Built ${bank.length} unique travel questions and ${bank.length*6} answer choices.`);
