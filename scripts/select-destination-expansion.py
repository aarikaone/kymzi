from pathlib import Path
from collections import Counter,defaultdict
import json,math,hashlib,re,unicodedata,datetime
R=Path(__file__).resolve().parents[1];W=Path(__file__).resolve().parents[1]/'artifacts/destination-expansion-v2';S=W/'sources'
def norm(s):return re.sub(r'[^a-z0-9]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().casefold())
def km(a,b,c,d):
 v=math.sin(math.radians(c-a)/2)**2+math.cos(math.radians(a))*math.cos(math.radians(c))*math.sin(math.radians(d-b)/2)**2;return 6371*2*math.asin(min(1,math.sqrt(v)))
def val(row,key,default=''):return row.get(key,{}).get('value',default)
base=json.loads((R/'content/world-catalogue/catalogue.json').read_text());source=json.loads((W/'eligible.json').read_text());meta={val(row,'gid'):{'qid':val(row,'city').split('/')[-1],'links':int(val(row,'links','0'))} for row in json.loads((S/'destination-guides.json').read_text())['results']['bindings']}
basegeo={c['geonameId'] for c in base['cities']};baseQ={meta[str(c['geonameId'])]['qid'] for c in base['cities'] if str(c['geonameId']) in meta};used={p['id'] for c in base['cities'] for p in c['places']};seenNames=defaultdict(list)
for c in base['cities']:
 for p in c['places']:seenNames[(c['countryCode'],norm(p['name']))].append((p,c))
pinned={'city:1262463','city:1264540'};checks=Counter();pool=[];seenCityQ={}
# Collapse GeoNames aliases of the same Wikidata destination before ranking.
for c in sorted(source['cities'],key=lambda c:(c['id'] not in pinned,-c['population'],c['id'])):
 if c['population']>500000 and c['id'] not in pinned:checks['largeCitiesExcluded']+=1;continue
 if c['geonameId'] in basegeo or c.get('wikidataId') in baseQ:checks['existingDestinationIdentityExcluded']+=1;continue
 qid=c.get('wikidataId')
 if qid and qid in seenCityQ:checks['destinationAliasDuplicateExcluded']+=1;continue
 if qid:seenCityQ[qid]=c['id']
 if len({p['id'] for p in c['places']})!=4 or len({norm(p['name']) for p in c['places']})!=4:checks['withinCityDuplicateExcluded']+=1;continue
 bad=False
 for p in c['places']:
  if p['id'] in used:bad=True;break
  for old,oldCity in seenNames.get((c['countryCode'],norm(p['name'])),[]):
   if p.get('latitude') is not None and old.get('latitude') is not None:same=km(p['latitude'],p['longitude'],old['latitude'],old['longitude'])<=.75
   else:same=km(c['latitude'],c['longitude'],oldCity['latitude'],oldCity['longitude'])<=35
   if same:bad=True;break
 if bad:checks['existingPhysicalPlaceDuplicateExcluded']+=1;continue
 pool.append(c)
# Stable score from travel coverage, never presented as visitor counts or user ratings.
for c in pool:c['popularity']['score']=round(60*math.log1p(c.get('sitelinks',0))/math.log(501)+30*sum(math.log1p(p.get('sitelinks',0)) for p in c['places'])/4/math.log(501)+10,4)
ranked=sorted(pool,key=lambda c:(-c['popularity']['score'],c['id']));selected=[];ids=set();geo=set(basegeo);qids=set(baseQ);countries=Counter();continents=Counter();placeIds=set(used);names=defaultdict(list,{k:list(v) for k,v in seenNames.items()})
continentCap={'EU':750,'AS':600,'NA':450,'AF':250,'SA':250,'OC':250};rejected=Counter()
def add(c):
 if c['id'] in ids or c['geonameId'] in geo or c.get('wikidataId') in qids:return False
 for old in base['cities']+selected:
  if old['countryCode']!=c['countryCode']:continue
  labels={norm(v) for v in [c['city'],c.get('ascii',''),*c.get('aliases',[])] if norm(v)};other={norm(v) for v in [old['city'],old.get('ascii',''),*old.get('aliases',[])] if norm(v)}
  if labels&other and km(c['latitude'],c['longitude'],old['latitude'],old['longitude'])<=3:rejected['nearbyDestinationAlias']+=1;return False
 if countries[c['countryCode']]>=100 or continents[c['continent']]>=continentCap[c['continent']]:return False
 for p in c['places']:
  if p['id'] in placeIds:rejected['reusedAttractionId']+=1;return False
  for old,oldCity in names.get((c['countryCode'],norm(p['name'])),[]):
   if p.get('latitude') is not None and old.get('latitude') is not None:same=km(p['latitude'],p['longitude'],old['latitude'],old['longitude'])<=.75
   else:same=km(c['latitude'],c['longitude'],oldCity['latitude'],oldCity['longitude'])<=35
   if same:rejected['nearbySameNameAttraction']+=1;return False
 selected.append(c);ids.add(c['id']);geo.add(c['geonameId']);qids.add(c.get('wikidataId'));countries[c['countryCode']]+=1;continents[c['continent']]+=1
 for p in c['places']:placeIds.add(p['id']);names[(c['countryCode'],norm(p['name']))].append((p,c))
 return True
for key in sorted(pinned):
 c=next((c for c in ranked if c['id']==key),None)
 if not c or not add(c):raise RuntimeError('Required destination failed duplicate/quality validation: '+key)
# Retain a meaningful worldwide spread, then fill with the strongest travel-interest signals.
pinnedFile=R/'content/world-catalogue/expansion-v2-selection.json'
if pinnedFile.exists():
 stable=json.loads(pinnedFile.read_text())['cityIds'];lookup={c['id']:c for c in ranked}
 if len(stable)!=1500 or len(set(stable))!=1500:raise RuntimeError('Pinned expansion must contain exactly 1,500 distinct destination IDs.')
 for cid in stable:
  if cid in ids:continue
  if cid not in lookup or not add(lookup[cid]):raise RuntimeError('Pinned destination no longer meets identity/quality checks: '+cid)
else:
 for iso in sorted({c['countryCode'] for c in ranked}):
  if countries[iso]:continue
  for c in ranked:
   if c['countryCode']==iso and add(c):break
 for c in ranked:
  if len(selected)>=1500:break
  add(c)
if len(selected)!=1500:raise RuntimeError('Insufficient distinct destinations: '+str(len(selected)))
# Give original destinations a comparable score without modifying their frozen source catalogue.
placeLinks={}
for file in S.glob('places-*.json'):
 if 'probe' in file.name:continue
 for row in json.loads(file.read_text()).get('results',{}).get('bindings',[]):
  key=val(row,'place').split('/')[-1];placeLinks[key]=max(placeLinks.get(key,0),int(val(row,'links','0')))
existingPopularity={}
for c in base['cities']:
 m=meta.get(str(c['geonameId']),{});top=sorted([placeLinks.get(p['id'],0) for p in c['places']],reverse=True)[:4];score=60*math.log1p(m.get('links',0))/math.log(501)+30*sum(math.log1p(v) for v in top)/4/math.log(501)+(10 if m else 0)
 existingPopularity[c['id']]={'score':round(score,4),'citySitelinks':m.get('links',0),'attractionSitelinks':sum(top),'hasTravelGuide':bool(m),'method':'wikimedia-travel-coverage-v1'}
allScores=[(c['id'],c['popularity']) for c in selected]+list(existingPopularity.items());allScores.sort(key=lambda r:(-r[1]['score'],r[0]))
for index,(cid,pop) in enumerate(allScores):pop['rank']=index+1
selected.sort(key=lambda c:(c['popularity']['rank'],c['id']));at=datetime.datetime.now(datetime.timezone.utc).isoformat()
for position,c in enumerate(selected):
 c['catalogueSet']='destinations-v2';c['catalogueOrder']=1026+position;c['destinationType']='town-or-city-area';c['popularity']['measuredAt']=at
 for p in c['places']:
  p['mapsUrl']='https://www.google.com/maps/search/?api=1&query='+str(p['latitude'])+','+str(p['longitude']) if p.get('latitude') is not None else 'https://www.google.com/maps/search/?api=1&query='+p['name'].replace(' ','+')+'+'+c['city'].replace(' ','+')
  p['question']='What is your local tip for visiting '+p['name']+'?'
# Final all-or-nothing data assertions before any cloud write is permitted.
assert len({c['geonameId'] for c in selected})==1500
assert len({c['wikidataId'] for c in selected})==1500
assert len({p['id'] for c in selected for p in c['places']})==6000
assert all(len(c['places'])==4 for c in selected)
assert not ({p['id'] for c in selected for p in c['places']}&used)
output={'version':2,'expansionId':'kymzi-destinations-v2','generatedAt':at,'baseCatalogueSha256':hashlib.sha256((R/'content/world-catalogue/catalogue.json').read_bytes()).hexdigest(),'cities':selected,'existingPopularity':existingPopularity,'existingDestinationIdentities':{c['id']:meta[str(c['geonameId'])]['qid'] for c in base['cities'] if str(c['geonameId']) in meta}}
raw=json.dumps(output,ensure_ascii=False,separators=(',',':')).encode();(W/'expansion-v2.json').write_bytes(raw)
report={'expansionId':output['expansionId'],'generatedAt':at,'additionalDestinations':1500,'additionalAttractions':6000,'combinedDestinations':2526,'combinedAttractions':26520,'minimumNewAttractionsPerDestination':4,'newCountries':len(countries),'combinedCountries':len(set(countries)|{c['countryCode'] for c in base['cities']}),'byContinent':dict(continents),'byCountry':dict(countries),'largestCountryShare':max(countries.values())/1500,'selectionPopulationCeiling':500000,'duplicateChecks':{'uniqueGeoNamesIds':1500,'uniqueWikidataDestinationIds':1500,'uniqueNewAttractionIds':6000,'existingAttractionIdOverlap':0,'sameNameNearbyPhysicalPlaceOverlap':0,'candidateExclusions':dict(checks),'selectionRejections':dict(rejected)},'sources':source['sources']+[{'file':n,'sha256':hashlib.sha256((S/n).read_bytes()).hexdigest()} for n in ['cities500.zip','countryInfo.txt','admin1CodesASCII.txt','destination-guides.json','travel-guide-links.json','pinned-encyclopedia.json','type-labels.json']],'popularityMethod':'Weighted log-scaled Wikidata language/site coverage for destinations and the strongest four attractions, plus verified Wikivoyage guide presence. Interest/coverage proxy, not visitor counts, live trends or user ratings. Country cap 100; Europe capped at 750; each represented country seeded before global score fill.','datasetSha256':hashlib.sha256(raw).hexdigest(),'examples':[{'city':c['city'],'country':c['country'],'places':[p['name'] for p in c['places']]} for c in selected if c['id'] in pinned or c['city'] in ['Ubud','Nuwara Eliya','Zermatt','Banff','Queenstown']]}
(W/'expansion-v2-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2));print(json.dumps({k:v for k,v in report.items() if k not in ['sources','byCountry']},ensure_ascii=False),flush=True)
