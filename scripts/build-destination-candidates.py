from pathlib import Path
from collections import defaultdict,Counter
from urllib.parse import quote,urlencode
import json,zipfile,math,re,unicodedata,hashlib,datetime
R=Path(__file__).resolve().parents[1];WORK=Path(__file__).resolve().parents[1]/'artifacts/destination-expansion-v2';SRC=WORK/'sources'
def norm(s):return re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().casefold())
def distance(a,b,c,d):
 v=math.sin(math.radians(c-a)/2)**2+math.cos(math.radians(a))*math.cos(math.radians(c))*math.sin(math.radians(d-b)/2)**2
 return 6371*2*math.asin(min(1,math.sqrt(v)))
def value(row,key,default=''):return row.get(key,{}).get('value',default)
base=json.loads((R/'content/world-catalogue/catalogue.json').read_text());basegeo={str(c['geonameId']) for c in base['cities']};used={p['id'] for c in base['cities'] for p in c['places']}
countries={r[0]:{'country':r[4],'continent':r[8]} for l in (SRC/'countryInfo.txt').read_text().splitlines() if l and not l.startswith('#') for r in [l.split('\t')]}
regions={r[0]:r[1] for l in (SRC/'admin1CodesASCII.txt').read_text().splitlines() for r in [l.split('\t')]}
links={value(row,'gid'):value(row,'voyage') for row in json.loads((SRC/'travel-guide-links.json').read_text())['results']['bindings']}
meta={}
for row in json.loads((SRC/'destination-guides.json').read_text())['results']['bindings']:
 gid=value(row,'gid');item={'wikidataId':value(row,'city').split('/')[-1],'sitelinks':int(value(row,'links','0')),'description':value(row,'description'),'wikipediaUrl':value(row,'article'),'wikivoyageUrl':links.get(gid,'')}
 if gid not in meta or item['sitelinks']>meta[gid]['sitelinks']:meta[gid]=item
cities={}
with zipfile.ZipFile(SRC/'cities500.zip') as z:
 for line in z.read('cities500.txt').decode().splitlines():
  p=line.split('\t')
  if p[7] in ['PPLX','PPLS','PPLH','PPLQ','PPLW'] or p[8] not in countries or not p[17] or (p[0] not in meta and p[0] not in ['1262463','1264540']):continue
  c={'id':'city:'+p[0],'geonameId':int(p[0]),'city':p[1],'ascii':p[2],'aliases':list(dict.fromkeys(p[3].split(',')))[:16],'latitude':float(p[4]),'longitude':float(p[5]),'countryCode':p[8],**countries[p[8]],'population':int(p[14] or 0),'timeZone':p[17],'region':regions.get(p[8]+'.'+p[10],''),'citySourceUrl':'https://www.geonames.org/'+p[0],**meta.get(p[0],{})}
  cities[c['id']]=c
# Existing centres participate in nearest-destination assignment so new guides do not borrow urban attractions.
centres={c['id']:c for c in base['cities']};centres.update({k:c for k,c in cities.items() if str(c['geonameId']) not in basegeo})
# Exclude immediate duplicate/borough-like destination names near the original city centre.
new={k:c for k,c in cities.items() if str(c['geonameId']) not in basegeo and not any(c['countryCode']==b['countryCode'] and distance(c['latitude'],c['longitude'],b['latitude'],b['longitude'])<7 and norm(c['city']) in {norm(b['city']),*[norm(a) for a in b.get('aliases',[])]} for b in base['cities'])}
grid=defaultdict(list)
for c in centres.values():grid[(c['countryCode'],math.floor(c['latitude']),math.floor(c['longitude']))].append(c)
# Types are verified against Wikidata labels; no generic business/station filler is imported.
types={
'Q33506':('museum','Museum'),'Q1007870':('museum','Art gallery'),'Q16560':('landmark','Palace'),'Q23413':('landmark','Castle'),'Q1081138':('landmark','Historic site'),'Q9259':('landmark','World Heritage Site'),
'Q34038':('park','Waterfall'),'Q46169':('park','National park'),'Q179049':('park','Nature reserve'),'Q8502':('trail','Mountain'),'Q54050':('trail','Hill'),'Q35509':('park','Cave'),
'Q40080':('beach','Beach'),'Q23397':('lake','Lake'),'Q23442':('beach','Island'),'Q12323':('lake','Dam'),
'Q570116':('attraction','Attraction'),'Q22698':('park','Park'),'Q167346':('garden','Botanical garden'),'Q43501':('attraction','Zoo'),'Q194195':('attraction','Theme park'),'Q6017969':('trail','Viewpoint'),
'Q44539':('temple','Temple'),'Q16970':('temple','Church'),'Q2977':('temple','Cathedral'),'Q32815':('temple','Mosque'),'Q4989906':('landmark','Monument'),'Q5003624':('landmark','Memorial'),'Q330284':('market','Market'),'Q11303':('landmark','Architecture')}
items={};sources=[]
for file in sorted(SRC.glob('places-*.json')):
 if 'probe' in file.name:continue
 data=json.loads(file.read_text());rows=data.get('results',{}).get('bindings',[]);sources.append({'file':file.name,'records':len(rows),'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'endpoint':'https://qlever.dev/api/wikidata'})
 for row in rows:
  qid=value(row,'place').rsplit('/',1)[-1];root=value(row,'type').rsplit('/',1)[-1];iso=value(row,'iso');name=value(row,'label').strip();desc=value(row,'description').strip();coord=re.fullmatch(r'POINT\((-?[\d.]+) (-?[\d.]+)\)',value(row,'coord'))
  if root not in types or not re.fullmatch(r'[A-Z]{2}',iso) or not coord or qid in used or len(name)<3 or len(name)>140:continue
  if re.search(r'\b(demolished|destroyed|defunct|permanently closed|casino|gambling|nightclub|industrial park|business park|former railway)\b',desc,re.I):continue
  lon,lat=map(float,coord.groups());category,kind=types[root]
  item={'id':qid,'name':name,'categoryId':category,'kind':kind,'description':desc or kind+' in '+countries.get(iso,{}).get('country',iso)+'.','latitude':round(lat,6),'longitude':round(lon,6),'countryCode':iso,'sitelinks':int(value(row,'links','0')),'source':'Wikidata','sourceUrl':'https://www.wikidata.org/wiki/'+qid,'coordinateStatus':'Sourced WGS84 point','sourceType':root}
  if qid not in items or item['sitelinks']>items[qid]['sitelinks']:items[qid]=item
buckets=defaultdict(list)
for p in items.values():
 lat,lon=p['latitude'],p['longitude'];y,x=math.floor(lat),math.floor(lon);reach=min(6,max(1,math.ceil(.34/max(.05,math.cos(math.radians(lat))))));pool=[]
 for a in range(y-1,y+2):
  for b in range(x-reach,x+reach+1):pool+=grid.get((p['countryCode'],a,b),[])
 if not pool:continue
 km,c=min(((distance(lat,lon,c['latitude'],c['longitude']),c) for c in pool),key=lambda v:(v[0],-v[1].get('sitelinks',0)))
 if km<=35 and c['id'] in new:buckets[c['id']].append({**p,'distanceKm':round(km,2)})
# Pin verified example destinations; missing point coordinates remain explicitly null, never guessed.
pages={p['title']:p for p in json.loads((SRC/'pinned-encyclopedia.json').read_text())['query']['pages'] if not p.get('missing')}
pins={'city:1262463':[('Eravikulam National Park','park','National park'),('Mattupetty Dam','lake','Dam'),('KDHP Tea Museum','museum','Tea museum'),('Anamudi','trail','Mountain')], 'city:1264540':[("Raja's Seat",'garden','Garden'),('Abbey Falls','park','Waterfall'),('Madikeri Fort','landmark','Fort'),('Nisargadhama','park','Nature reserve')]}
for cid,rows in pins.items():
 if cid not in new:continue
 c=new[cid]
 if cid=='city:1264540':c['city']='Madikeri (Coorg)';c['aliases']=list(dict.fromkeys(['Coorg','Kodagu','Madikeri',*c['aliases']]))
 picked=[]
 for title,category,kind in rows:
  if title not in pages:continue
  page=pages[title];qid=page.get('pageprops',{}).get('wikibase_item');original=items.get(qid,{});coord=(page.get('coordinates') or [{}])[0];lat=original.get('latitude',coord.get('lat'));lon=original.get('longitude',coord.get('lon'))
  if not qid or qid in used:raise RuntimeError('Pinned attraction identity is missing or already assigned: '+title)
  desc=page.get('extract','').strip();url='https://en.wikipedia.org/wiki/'+quote(title.replace(' ','_'))
  picked.append({'id':qid,'name':title,'categoryId':category,'kind':kind,'description':desc.split('\n')[0], 'latitude':lat,'longitude':lon,'countryCode':c['countryCode'],'sitelinks':original.get('sitelinks',10),'source':'Wikidata','sourceUrl':'https://www.wikidata.org/wiki/'+qid,'descriptionSourceUrl':url,'descriptionLicense':'CC BY-SA 4.0','coordinateStatus':'Sourced WGS84 point' if lat is not None else 'Not provided by source','distanceKm':round(distance(c['latitude'],c['longitude'],lat,lon),2) if lat is not None else None,'details':{'description':desc,'facts':[{'label':'Type','value':kind},{'label':'Destination','value':c['city']}],'credits':[{'title':title,'url':url,'license':'CC BY-SA 4.0','attribution':'Wikipedia contributors'}],'updatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'status':'complete'}})
 buckets[cid]=picked
(WORK/'candidates.json').write_text(json.dumps({'cities':[{**c,'availablePlaces':len(buckets[cid])} for cid,c in new.items()]},ensure_ascii=False,separators=(',',':')))
eligible=[]
for cid,c in new.items():
 rows=sorted(buckets[cid],key=lambda p:(-p['sitelinks'],p.get('distanceKm') or 0,p['name']));seen=set();picks=[]
 for p in rows:
  n=norm(p['name'])
  if n in seen:continue
  seen.add(n);picks.append(p)
 if len(picks)<4:continue
 # Diversify the initial four without removing internationally prominent landmarks.
 result=[picks[0]];kinds=Counter([picks[0]['kind']])
 for cap in [1,2,4]:
  for p in picks[1:]:
   if p in result or kinds[p['kind']]>=cap:continue
   result.append(p);kinds[p['kind']]+=1
   if len(result)==4:break
  if len(result)==4:break
 score=60*math.log1p(c.get('sitelinks',0))/math.log(501)+30*sum(math.log1p(p['sitelinks']) for p in result)/4/math.log(501)+10
 eligible.append({**c,'places':result,'popularity':{'score':round(min(100,score),4),'citySitelinks':c.get('sitelinks',0),'attractionSitelinks':sum(p['sitelinks'] for p in result),'hasTravelGuide':True,'method':'wikimedia-travel-coverage-v1','measuredAt':datetime.datetime.now(datetime.timezone.utc).isoformat()}})
print(json.dumps({'tourismCentres':len(cities),'newCentres':len(new),'sourcedAttractions':len(items),'eligibleWithFour':len(eligible),'countries':len(set(c['countryCode'] for c in eligible)),'byContinent':dict(Counter(c['continent'] for c in eligible)),'examples':[{'city':c['city'],'places':[p['name'] for p in c['places']]} for c in eligible if c['id'] in pins]},ensure_ascii=False),flush=True)
(WORK/'eligible.json').write_text(json.dumps({'cities':eligible,'sources':sources},ensure_ascii=False,separators=(',',':')))
