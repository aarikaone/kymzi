from pathlib import Path
from collections import defaultdict,Counter
import argparse,json,zipfile,math,re,hashlib,unicodedata,datetime,subprocess,time,os,concurrent.futures
from urllib.request import Request,urlopen
from urllib.parse import urlencode
project=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser(description='Rebuild Kymzi city guides from cached or public GeoNames/Wikidata snapshots.')
parser.add_argument('--cache',default=str(project/'artifacts/world-catalogue-cache'))
parser.add_argument('--output',default=str(project))
parser.add_argument('--selection',default=str(project/'content/world-catalogue/selection.json'))
parser.add_argument('--fetch',action='store_true',help='Fetch missing public source snapshots.')
parser.add_argument('--refresh',action='store_true',help='Refresh source snapshots before rebuilding; keeps pinned city IDs.')
args=parser.parse_args();cache=Path(args.cache);output=Path(args.output);cache.mkdir(parents=True,exist_ok=True)


SOURCE_CATEGORIES=[['parks', 'Q22698', 'park'], ['gardens', 'Q167346', 'garden'], ['zoos', 'Q43501', 'attraction'], ['castles', 'Q23413', 'landmark'], ['palaces', 'Q16560', 'landmark'], ['theatres', 'Q24354', 'attraction'], ['squares', 'Q174782', 'street'], ['beaches', 'Q40080', 'beach'], ['reserves', 'Q179049', 'park'], ['temples', 'Q44539', 'temple'], ['libraries', 'Q7075', 'bookshop'], ['attractions', 'Q570116', 'attraction'], ['restaurants', 'Q11707', 'restaurant'], ['cafes', 'Q30022', 'cafe'], ['malls', 'Q11315', 'mall'], ['stadiums', 'Q483110', 'sports'], ['galleries', 'Q1007870', 'museum'], ['memorials', 'Q5003624', 'landmark'], ['markets', 'Q330284', 'market'], ['skyscrapers', 'Q11303', 'landmark'], ['amusement', 'Q194195', 'attraction'], ['stations', 'Q55488', 'station'], ['museum-ranked', 'Q33506', 'museum']]
PREFIXES='PREFIX wd:<http://www.wikidata.org/entity/> PREFIX wdt:<http://www.wikidata.org/prop/direct/> PREFIX rdfs:<http://www.w3.org/2000/01/rdf-schema#> PREFIX schema:<http://schema.org/> PREFIX wikibase:<http://wikiba.se/ontology#> '
def download(url,path):
 if path.exists() and not args.refresh:return
 error=None
 for attempt in range(3):
  try:
   request=Request(url,headers={'User-Agent':'Kymzi-catalog-import/1.0 (local build tool)','Accept':'application/sparql-results+json,application/octet-stream;q=0.9'})
   with urlopen(request,timeout=55) as response:data=response.read()
   temporary=path.with_suffix(path.suffix+'.part');temporary.write_bytes(data);temporary.replace(path);return
  except Exception as exc:error=exc;time.sleep(2**attempt)
 raise RuntimeError(f'Unable to download {url}: {error}')
def query(name,text):
 (cache/(name+'.sparql')).write_text(text)
 download('https://qlever.dev/api/wikidata?'+urlencode({'query':text,'format':'json'}),cache/(name+'.json'))
 data=json.loads((cache/(name+'.json')).read_text())
 if 'results' not in data:raise RuntimeError(f'Invalid query result for {name}')
 print('snapshot',name,len(data['results']['bindings']),flush=True)
def fetch_sources():
 for name in ['cities15000.zip','countryInfo.txt','admin1CodesASCII.txt']:download('https://download.geonames.org/export/dump/'+name,cache/name)
 def fetch_category(entry):
  name,qid,_=entry
  text=PREFIXES+f"""SELECT DISTINCT ?place ?label ?description ?coord ?iso ?links WHERE {{
   ?place wdt:P31/wdt:P279* wd:{qid}; wdt:P625 ?coord; rdfs:label ?label; wdt:P17 ?country.
   FILTER(LANG(?label)="en") ?country wdt:P297 ?iso.
   OPTIONAL {{?place schema:description ?description FILTER(LANG(?description)="en")}}
   OPTIONAL {{?place wikibase:sitelinks ?links}}
   FILTER NOT EXISTS {{?place wdt:P576 ?closed}}
  }} LIMIT 100000"""
  query(name,text)
 with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:list(pool.map(fetch_category,SOURCE_CATEGORIES))
 roots=' '.join('wd:'+row[1] for row in SOURCE_CATEGORIES)
 base=f"""?place wdt:P625 ?coord; rdfs:label ?label. FILTER(LANG(?label)="en")
  VALUES ?root {{{roots}}} ?place wdt:P31/wdt:P279* ?root.
  OPTIONAL {{?place schema:description ?description FILTER(LANG(?description)="en")}}
  OPTIONAL {{?place wikibase:sitelinks ?links}} FILTER NOT EXISTS {{?place wdt:P576 ?closed}}"""
 query('targeted',PREFIXES+'SELECT DISTINCT ?place ?label ?description ?coord ?iso ?links ?root WHERE { VALUES ?iso {"KE" "AE" "IN" "NL"} ?country wdt:P297 ?iso. ?place wdt:P17 ?country. '+base+'} LIMIT 100000')
 # Wikidata gives Netherlands proper (Q55) a country link to the Kingdom (Q29999), whose ISO code is NL.
 query('netherlands',PREFIXES+'SELECT DISTINCT ?place ?label ?description ?coord ?links ?root WHERE { ?place wdt:P17 wd:Q55. '+base+'} LIMIT 100000')
 path=cache/'netherlands.json';data=json.loads(path.read_text())
 for row in data['results']['bindings']:row['iso']={'type':'literal','value':'NL'}
 path.write_text(json.dumps(data));(cache/'categories.json').write_text(json.dumps(SOURCE_CATEGORIES))
if args.fetch or args.refresh:fetch_sources()
if not (cache/'categories.json').exists():raise SystemExit('No cached snapshot. Run with --fetch first.')
if not (cache/'legacy.json').exists():
 module=lambda path:json.dumps((project/path).as_uri())
 code='import {COUNTRIES} from '+module('packages/core/src/countries.ts')+';import {ATTRACTIONS} from '+module('packages/core/src/attractions.ts')+';import {CITY_CENTRES} from '+module('packages/core/src/city-geography.ts')+';console.log(JSON.stringify({cities:COUNTRIES,places:ATTRACTIONS,centres:CITY_CENTRES}));'
 data=subprocess.check_output([os.environ.get('NODE_BINARY','node'),'--experimental-strip-types','--input-type=module','-e',code],cwd=project)
 (cache/'legacy.json').write_bytes(data)

legacy=json.loads((cache/'legacy.json').read_text());legacy_by_id={c['id']:c for c in legacy['cities']};countries={}
for line in (cache/'countryInfo.txt').read_text().splitlines():
 if not line or line.startswith('#'):continue
 p=line.split('\t');countries[p[0]]={'name':p[4],'continent':p[8]}
regions={}
for line in (cache/'admin1CodesASCII.txt').read_text().splitlines():
 p=line.split('\t');regions[p[0]]=p[1]
def norm(s):return re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower())
def distance(a,b,c,d):
 x=math.radians(c-a);y=math.radians(d-b);v=math.sin(x/2)**2+math.cos(math.radians(a))*math.cos(math.radians(c))*math.sin(y/2)**2;return 6371*2*math.asin(min(1,math.sqrt(v)))
raw_cities=[]
with zipfile.ZipFile(cache/'cities15000.zip') as z:
 for line in z.read('cities15000.txt').decode().splitlines():
  p=line.split('\t')
  if p[7] in ['PPLX','PPLS','PPLH','PPLQ','PPLW'] or p[8] not in countries or not p[17]:continue
  raw_cities.append({'id':'city:'+p[0],'geonameId':int(p[0]),'city':p[1],'ascii':p[2],'aliases':p[3].split(',')[:10],'latitude':float(p[4]),'longitude':float(p[5]),'countryCode':p[8],'country':countries[p[8]]['name'],'continent':countries[p[8]]['continent'],'population':int(p[14] or 0),'timeZone':p[17],'region':regions.get(p[8]+'.'+p[10],'')})
legacy_cities=[]
for old in legacy['cities']:
 lat,lon=legacy['centres'][old['id']];pool=[c for c in raw_cities if c['countryCode']==old['id']];target={'BR':'Rio de Janeiro','US':'New York City'}.get(old['id'],old['city']);matching=[c for c in pool if norm(c['city'])==norm(target) or norm(c['ascii'])==norm(target)];nearest=max(matching,key=lambda c:c['population']) if matching else min(pool,key=lambda c:distance(lat,lon,c['latitude'],c['longitude']))
 # A legacy city centre remains stable for saved check-ins and existing profile IDs.
 c={**nearest,'id':old['id'],'city':old['city'],'country':old['name'],'latitude':lat,'longitude':lon,'timeZone':old['timeZone'],'aliases':list(dict.fromkeys([nearest['city'],nearest['ascii']]+nearest['aliases']))[:12]};legacy_cities.append(c)
cities=legacy_cities+[c for c in raw_cities if not any(c['countryCode']==old['countryCode'] and (distance(c['latitude'],c['longitude'],old['latitude'],old['longitude'])<12 or norm(c['city']) in ({norm(old['city'])}|{norm(a) for a in old['aliases']})) for old in legacy_cities)]
# Grid limits the nearest-city calculation to a small, same-country search area.
grid=defaultdict(list)
for c in cities:grid[(c['countryCode'],math.floor(c['latitude']),math.floor(c['longitude']))].append(c)
kind_names={'museum':'Museum','parks':'Park','gardens':'Garden','zoos':'Zoo','castles':'Castle','palaces':'Palace','theatres':'Theatre','monuments':'Monument','squares':'Square','beaches':'Beach','reserves':'Nature reserve','temples':'Temple','libraries':'Library','attractions':'Attraction','restaurants':'Restaurant','cafes':'Café','malls':'Shopping centre','stadiums':'Stadium','galleries':'Art gallery','memorials':'Memorial','markets':'Market','skyscrapers':'Architecture','amusement':'Theme park','stations':'Station','museum-ranked':'Museum'}
source_categories=json.loads((cache/'categories.json').read_text());root_categories={qid:(kind,kind_names.get(name,kind.title())) for name,qid,kind in source_categories}
root_categories.update({'Q11303':('landmark','Architecture'),'Q194195':('attraction','Theme park'),'Q55488':('station','Station'),'Q1007870':('museum','Art gallery'),'Q5003624':('landmark','Memorial')})
places={};sources=[];discarded=Counter();start=time.time()
for name,qid,category in source_categories+[['targeted','',''],['netherlands','','']]:
 if name in ['museum','monuments']:continue # richer museum snapshot supersedes the initial probe; Q498990 is not a monument class.
 path=cache/(name+'.json')
 if not path.exists():continue
 source_data=json.loads(path.read_text());rows=source_data.get('results',{}).get('bindings',[]);sources.append({'name':name,'records':len(rows),'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'endpoint':'https://qlever.dev/api/wikidata'})
 for row in rows:
  v={k:x['value'] for k,x in row.items()};key=v['place'].rsplit('/',1)[-1];name_value=v['label'].strip();description=v.get('description','').strip()
  if len(name_value)<3 or len(name_value)>140 or re.fullmatch(r'Q\d+',name_value):discarded['name']+=1;continue
  if re.search(r'\b(casino|gambling|nightclub|strip club|brothel|sex museum|erotic museum|cannabis|adult entertainment)\b',description,re.I):discarded['outsideGuideScope']+=1;continue
  if key=='Q5310637' or re.search(r'\b(demolished|destroyed|defunct|permanently closed|industrial park|business park|special economic zone)\b',description,re.I):discarded['inactiveDescription']+=1;continue
  m=re.fullmatch(r'POINT\((-?[0-9.]+) (-?[0-9.]+)\)',v['coord'])
  if not m:discarded['coordinates']+=1;continue
  lon,lat=map(float,m.groups());iso=v['iso'];kind,kind_label=root_categories.get(v.get('root','').rsplit('/',1)[-1],(category,kind_names.get(name,category.title()))) if name in ['targeted','netherlands'] else (category,kind_names.get(name,category.title()))
  if not (-90<=lat<=90 and -180<=lon<=180) or not kind:continue
  # Specific source descriptions override broad or erroneous subclass paths.
  inferred=[(r'\bbridge\b','landmark','Bridge'),(r'\baquarium\b','attraction','Aquarium'),(r'\bzoo\b|zoological','attraction','Zoo'),(r'botanical garden','garden','Garden'),(r'\blibrary\b','bookshop','Library'),(r'\bcathedral\b','temple','Cathedral'),(r'\bchurch\b','temple','Church'),(r'\bmosque\b','temple','Mosque'),(r'\bsynagogue\b','temple','Synagogue'),(r'art gallery','museum','Art gallery')]
  for pattern,new_kind,new_label in inferred:
   if re.search(pattern,description,re.I):kind,kind_label=new_kind,new_label;break
  if kind_label=='Museum' and re.search(r'\b(college|school|university)\b',description,re.I) and not re.search(r'museum|gallery',description,re.I):discarded['educationNotMuseum']+=1;continue
  links=int(v.get('links','0'));priority={'Attraction':0,'Memorial':1,'Station':1,'Library':2,'Park':3,'Theatre':4,'Museum':6,'Art gallery':7,'Zoo':10,'Aquarium':10,'Garden':9,'Castle':8,'Palace':8,'Bridge':8,'Cathedral':8,'Church':8,'Mosque':8,'Synagogue':8,'Library':5,'Nature reserve':4,'Temple':4,'Architecture':4}.get(kind_label,3)
  candidate={'id':key,'name':name_value,'categoryId':kind,'kind':kind_label,'description':description[:240],'latitude':round(lat,6),'longitude':round(lon,6),'countryCode':iso,'sitelinks':links,'priority':priority}
  if key in places:
   old=places[key];old['sitelinks']=max(old['sitelinks'],links)
   if priority>old['priority']:places[key]={**candidate,'sitelinks':old['sitelinks']}
   continue
  places[key]=candidate
 print('read',name,len(rows),'unique',len(places),flush=True)
# Attach each item to one nearest same-country city, never inflate counts by reusing it in many guides.
buckets=defaultdict(list)
for item in places.values():
 lat,lon=item['latitude'],item['longitude'];dy=math.floor(lat);dx=math.floor(lon);reach=min(5,max(1,math.ceil(.32/max(.08,math.cos(math.radians(lat))))));pool=[]
 for y in range(dy-1,dy+2):
  for x in range(dx-reach,dx+reach+1):pool+=grid.get((item['countryCode'],y,x),[])
 if not pool:discarded['noCity']+=1;continue
 km,city=min(((distance(lat,lon,c['latitude'],c['longitude']),c) for c in pool),key=lambda v:v[0])
 if km>35:discarded['outside35km']+=1;continue
 score=math.log2(item['sitelinks']+1)*8+item['priority']+max(0,8-km/3)
 buckets[city['id']].append({**item,'distanceKm':round(km,2),'score':score})
legacy_places=defaultdict(list)
for a in legacy['places']:legacy_places[a['countryId']].append(a)
def choose(city):
 entries=sorted(buckets[city['id']],key=lambda x:(-x['score'],x['distanceKm'],x['name']));selected=[];names=set();kind_counts=Counter();old=legacy_places[city['id']];old_names=[norm(p['name']).removeprefix('the') for p in old]
 for item in entries:
  n=norm(item['name']).removeprefix('the')
  if n in names or any(n==o or (min(len(n),len(o))>=7 and (n.startswith(o) or o.startswith(n)) and min(len(n),len(o))/max(len(n),len(o))>.58) for o in old_names):continue
  names.add(n);selected.append(item)
 # Prefer a useful mix. Small memorials/stations cannot fill the guide.
 result=[]
 for cap in [4,7,12,20]:
  for item in selected:
   if item in result:continue
   max_kind=3 if item['kind'] in ['Station','Memorial'] else cap
   if kind_counts[item['kind']]>=max_kind:continue
   result.append(item);kind_counts[item['kind']]+=1
   if len(result)>=20-len(old):break
  if len(result)>=20-len(old):break
 return result,old,kind_counts
eligible=[];short=[]
for c in cities:
 picks,old,counts=choose(c)
 if len(picks)+len(old)<20:
  if c['id'] in legacy_by_id:short.append((c['id'],c['city'],len(picks)+len(old),len(buckets[c['id']])))
  continue
 if c['id'] not in legacy_by_id and len(counts)<3:continue
 eligible.append({**c,'picks':picks,'legacy':old,'kinds':len(counts)})
print('ELIGIBLE',len(eligible),'LEGACY SHORT',short,flush=True)
summary={'eligible':len(eligible),'short':short,'countries':dict(Counter(c['countryCode'] for c in eligible))};(cache/'quality-coverage.json').write_text(json.dumps(summary,indent=2))
if short:raise SystemExit('Some existing cities need additional real places before publication.')
legacy_selected=[next(c for c in eligible if c['id']==key) for key in legacy_by_id]
new=[c for c in eligible if c['id'] not in legacy_by_id]
# Give every represented country a first destination, then fill by population and variety with a country cap.
ranking=lambda c:(math.log2(c['population']+1)+min(5,c['kinds'])*.5+min(len(buckets[c['id']]),200)/100)
by_country=defaultdict(list)
for c in new:by_country[c['countryCode']].append(c)
pinned=Path(args.selection)
if pinned.exists():
 ids=json.loads(pinned.read_text())['cityIds'];lookup={c['id']:c for c in new}
 if len(ids)!=1000 or len(set(ids))!=1000:raise SystemExit('The pinned selection must contain exactly 1000 unique new city IDs.')
 missing=[key for key in ids if key not in lookup]
 if missing:raise SystemExit('Pinned cities no longer meet the 20-place quality threshold. Expand their sources before publishing: '+', '.join(missing))
 chosen=[lookup[key] for key in ids]
else:
 chosen=[];per_country=Counter()
 for iso,group in sorted(by_country.items()):
  best=max(group,key=ranking);chosen.append(best);per_country[iso]+=1
 for c in sorted(new,key=lambda c:(-ranking(c),c['id'])):
  if len(chosen)>=1000:break
  if any(x['id']==c['id'] for x in chosen) or per_country[c['countryCode']]>=90:continue
  chosen.append(c);per_country[c['countryCode']]+=1
 if len(chosen)<1000:raise SystemExit(f'Only {len(chosen)} eligible diverse cities; expand source coverage.')
chosen.sort(key=lambda c:(-ranking(c),c['id']));all_cities=legacy_selected+chosen
# Compact, region-lazy TypeScript modules for the apps, plus a readable portable export.
index_rows=[];shards=defaultdict(dict);export=[]
for c in all_cities:
 ids=[p['id'] for p in c['legacy']]+[p['id'] for p in c['picks']]
 index_rows.append([c['id'],c['geonameId'],c['city'],c['ascii'],c['region'],c['countryCode'],c['country'],c['continent'],c['latitude'],c['longitude'],c['timeZone'],c['population'],ids,c['aliases'][:8]])
 shards[c['continent']][c['id']]=[[p['id'],p['name'],p['categoryId'],p['kind'],p['description'],p['latitude'],p['longitude'],p['distanceKm'],p['sitelinks'],p['countryCode']] for p in c['picks']]
 exports=[]
 for p in c['legacy']:exports.append({'id':p['id'],'name':p['name'],'kind':p['kind'],'description':p['fact'],'sourceUrl':p['sourceUrl'],'source':'Kymzi curated guide','question':p['question']})
 for p in c['picks']:exports.append({'id':p['id'],'name':p['name'],'categoryId':p['categoryId'],'countryCode':p['countryCode'],'kind':p['kind'],'description':p['description'] or f'{p["kind"]} in the {c["city"]} area.','descriptionSource':'Wikidata' if p['description'] else 'Category and city-area summary','latitude':p['latitude'],'longitude':p['longitude'],'distanceKm':p['distanceKm'],'sourceUrl':'https://www.wikidata.org/wiki/'+p['id'],'source':'Wikidata','question':f'What is your local tip for visiting {p["name"]}?','mapsUrl':f'https://www.google.com/maps/search/?api=1&query={p["latitude"]},{p["longitude"]}'})
 for record in exports:
  record.setdefault('countryCode',c['countryCode'])
  record.setdefault('mapsUrl','https://www.google.com/maps/search/?'+urlencode({'api':1,'query':record['name']+', '+c['city']+', '+c['country']}))
  record.setdefault('latitude',None);record.setdefault('longitude',None)
  record['coordinateStatus']='Sourced WGS84 point' if record['latitude'] is not None else 'Not provided by curated source'
 export.append({k:v for k,v in c.items() if k not in ['picks','legacy','kinds']}|{'places':exports,'citySourceUrl':f'https://www.geonames.org/{c["geonameId"]}'})
generated=output/'packages/core/src/catalogue';generated.mkdir(parents=True,exist_ok=True)
encode=lambda v:json.dumps(v,ensure_ascii=False,separators=(',',':'))
(generated/'world-cities-data.ts').write_text("// Generated from GeoNames + Wikidata. See content/world-catalogue/SOURCES.md.\nimport type {WorldCityRow} from '../world-catalogue.ts';\nexport const WORLD_CITY_ROWS=JSON.parse("+json.dumps(encode(index_rows),ensure_ascii=True)+') as WorldCityRow[];\n')
for continent,data in shards.items():(generated/f'places-{continent.lower()}.ts').write_text("// Generated Wikidata CC0 records. Loaded by continent on demand.\nimport type {WorldPlaceRow} from '../world-catalogue.ts';\nexport const places=JSON.parse("+json.dumps(encode(data),ensure_ascii=True)+') as Record<string,WorldPlaceRow[]>;\n')
content=output/'content/world-catalogue';content.mkdir(parents=True,exist_ok=True)
(content/'catalogue.json').write_text(json.dumps({'version':1,'cities':export},ensure_ascii=False,separators=(',',':')))
report={'version':1,'retrievedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'newCities':len(chosen),'legacyCities':len(legacy_selected),'totalCities':len(all_cities),'totalPlaces':sum(len(x['places']) for x in export),'minimumPlacesPerCity':min(len(x['places']) for x in export),'countries':len(set(c['countryCode'] for c in all_cities)),'byContinent':dict(Counter(c['continent'] for c in all_cities)),'byCountry':dict(Counter(c['countryCode'] for c in all_cities)),'discarded':dict(discarded),'sources':sources,'radiusKm':35,'cityAssignment':'Nearest same-country city centre; nearby places may lie outside municipal boundaries.','selection':'At least three place kinds per new city; at most three stations/memorials. Wikimedia sitelinks are a curation signal, not ratings.'}
(content/'selection.json').write_text(json.dumps({'version':1,'cityIds':[c['id'] for c in chosen]},indent=2))
report['recordsWithCoordinates']=sum(place.get('latitude') is not None for city in export for place in city['places'])
report['curatedWithoutCoordinates']=report['totalPlaces']-report['recordsWithCoordinates']
report['datasetSha256']=hashlib.sha256((content/'catalogue.json').read_bytes()).hexdigest()
report['citySourceFiles']=[{'name':name,'sha256':hashlib.sha256((cache/name).read_bytes()).hexdigest(),'url':'https://download.geonames.org/export/dump/'+name} for name in ['cities15000.zip','countryInfo.txt','admin1CodesASCII.txt']]
report['manualExclusions']=[{'id':'Q5310637','reason':'Closed Dubai/Jumeirah Zoo','sourceUrl':'https://www.wam.ae/en/article/hszr62u9-jumeirah-zoo-closes-doors'}]
(content/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print('DONE',json.dumps({k:v for k,v in report.items() if k not in ['sources','discarded','byCountry']}),flush=True)
