from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlencode
from urllib.error import HTTPError
import json,time,hashlib
root=Path(__file__).resolve().parents[1]/'artifacts/destination-expansion-v2/sources'
ua='Kymzi-destination-catalogue/2.0 (https://kymzi-f1e9d.web.app; public travel guide research)'
prefix='PREFIX wd:<http://www.wikidata.org/entity/> PREFIX wdt:<http://www.wikidata.org/prop/direct/> PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> PREFIX schema:<http://schema.org/> PREFIX wikibase:<http://wikiba.se/ontology#> '
root.mkdir(parents=True,exist_ok=True)
for name in ['cities500.zip','countryInfo.txt','admin1CodesASCII.txt']:
 target=root/name
 if target.exists():continue
 with urlopen(Request('https://download.geonames.org/export/dump/'+name,headers={'User-Agent':ua}),timeout=60) as response:data=response.read()
 (root/(name+'.part')).write_bytes(data);(root/(name+'.part')).replace(target)
queries={
'destination-guides':'''SELECT DISTINCT ?city ?gid ?links ?article ?description WHERE { ?voyage schema:isPartOf <https://en.wikivoyage.org/>; schema:about ?city. ?city wdt:P1566 ?gid; wikibase:sitelinks ?links. OPTIONAL { ?article schema:about ?city; schema:isPartOf <https://en.wikipedia.org/>. } OPTIONAL { ?city schema:description ?description FILTER(LANG(?description)="en") } }'''
}
groups={
'culture':['Q33506','Q1007870','Q16560','Q23413','Q1081138','Q9259','Q178507'],
'waterfalls':['Q34038'],'national-parks':['Q46169','Q179049'],'caves':['Q35509'],'mountains':['Q8502','Q54050'],
'coast':['Q40080','Q23397','Q23442','Q12323'],
'leisure':['Q570116','Q22698','Q167346','Q43501','Q194195','Q6017969'],
'heritage':['Q44539','Q16970','Q2977','Q32815','Q4989906','Q5003624','Q330284','Q11303']
}
groups={k:groups[k] for k in ['culture','leisure','heritage','coast','waterfalls','national-parks','caves','mountains']}
for group,types in groups.items():
 queries['places-'+group]='''SELECT DISTINCT ?place ?label ?description ?coord ?iso ?links ?type WHERE { VALUES ?type {'''+ ' '.join('wd:'+qid for qid in types)+'''} ?place wdt:P31 ?type; wdt:P625 ?coord; rdfs:label ?label; wdt:P17 ?country; wikibase:sitelinks ?links. FILTER(LANG(?label)="en" && ?links>=3) ?country wdt:P297 ?iso. OPTIONAL { ?place schema:description ?description FILTER(LANG(?description)="en") } FILTER NOT EXISTS { ?place wdt:P576 ?closed } } LIMIT 180000'''
for name,body in queries.items():
 p=root/(name+'.json');query=prefix+body;(root/(name+'.sparql')).write_text(query)
 if p.exists():
  print(json.dumps({'source':name,'cached':True,'records':len(json.loads(p.read_text())['results']['bindings'])}),flush=True);continue
 for attempt in range(3):
  start=time.time()
  try:
   url='https://qlever.dev/api/wikidata?'+urlencode({'query':query,'format':'json'})
   with urlopen(Request(url,headers={'User-Agent':ua,'Accept':'application/sparql-results+json'}),timeout=55) as response:data=response.read()
   parsed=json.loads(data)
   if 'results' not in parsed:raise RuntimeError(str(parsed.get('exception',parsed.get('status','missing results')))[:200])
   (root/(name+'.part')).write_bytes(data);(root/(name+'.part')).replace(p)
   print(json.dumps({'source':name,'records':len(parsed['results']['bindings']),'bytes':len(data),'seconds':round(time.time()-start,1),'sha256':hashlib.sha256(data).hexdigest()}),flush=True);break
  except Exception as error:
   print(json.dumps({'source':name,'attempt':attempt+1,'error':str(error)[:180]}),flush=True)
   if attempt==2:break
   time.sleep(min(45,10*(attempt+1)))
 time.sleep(3)
