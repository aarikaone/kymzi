"""Regenerate the shared bank from the reviewed JSON while removing repeated metadata."""
from pathlib import Path
import json
root = Path(__file__).resolve().parent.parent
records = json.loads((root/'docs/questions.json').read_text())
assert len(records) == 2000
compact = [{k:q[k] for k in ('id','category','min_age','prompt')} for q in records]
source = "import type { Question } from './types.ts';\n"
source += 'const prompts = ' + json.dumps(compact, ensure_ascii=False, separators=(',',':')) + ';\n'
source += "export const questionBank: Question[] = prompts.map(q=>({...q,max_age:24,answer_format:'short_text',max_answer_characters:40,language:'en',mode:'daily_or_friend',publication_status:'editorial_review_required'}));\n"
(root/'packages/core/src/questions.ts').write_text(source)
print(f'Synced {len(records)} questions.')
