from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlencode
import json,time
root=Path(__file__).resolve().parents[1]/'artifacts/destination-expansion-v2/sources'
ua='Kymzi-destination-catalogue/2.0 (https://kymzi-f1e9d.web.app)'
titles=['Munnar','Madikeri','Kodagu district',"Raja's Seat",'Abbey Falls','Madikeri Fort','Omkareshwara Temple','Eravikulam National Park','Mattupetty Dam','KDHP Tea Museum','Anamudi','Kundala Dam','Nisargadhama','Dubare']
q={'action':'query','prop':'extracts|pageprops|coordinates','ppprop':'wikibase_item|disambiguation','exintro':'1','explaintext':'1','exlimit':'20','exchars':'1200','redirects':'1','titles':'|'.join(titles),'format':'json','formatversion':'2','maxlag':'5'}
url='https://en.wikipedia.org/w/api.php?'+urlencode(q)
with urlopen(Request(url,headers={'User-Agent':ua}),timeout=60) as response:data=json.load(response)
(root/'pinned-encyclopedia.json').write_text(json.dumps(data))
for p in data.get('query',{}).get('pages',[]):print(json.dumps({'title':p.get('title'),'qid':p.get('pageprops',{}).get('wikibase_item'),'missing':p.get('missing',False),'coords':p.get('coordinates')}),flush=True)
roots=['Q33506','Q1007870','Q16560','Q23413','Q1081138','Q9259','Q178507','Q34038','Q46169','Q179049','Q8502','Q54050','Q35509','Q40080','Q23397','Q23442','Q12323','Q570116','Q22698','Q167346','Q43501','Q194195','Q6017969','Q44539','Q16970','Q2977','Q32815','Q4989906','Q5003624','Q330284','Q11303']
url='https://www.wikidata.org/w/api.php?'+urlencode({'action':'wbgetentities','ids':'|'.join(roots),'props':'labels','languages':'en','format':'json'})
with urlopen(Request(url,headers={'User-Agent':ua}),timeout=60) as response:data=json.load(response)
(root/'type-labels.json').write_text(json.dumps(data))
print(json.dumps({'types':{qid:item.get('labels',{}).get('en',{}).get('value') for qid,item in data.get('entities',{}).items()}}))
