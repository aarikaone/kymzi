from pathlib import Path
from urllib.request import Request,urlopen
from urllib.parse import urlencode
import json,time
p=Path('/Volumes/ExtremeSSD/Kymzi-destinations-v2/sources/travel-guide-links.json')
q='PREFIX wdt:<http://www.wikidata.org/prop/direct/> PREFIX schema:<http://schema.org/> SELECT DISTINCT ?city ?gid ?voyage WHERE { ?voyage schema:isPartOf <https://en.wikivoyage.org/>; schema:about ?city. ?city wdt:P1566 ?gid. }'
for attempt in range(4):
 try:
  with urlopen(Request('https://qlever.dev/api/wikidata?'+urlencode({'query':q,'format':'json'}),headers={'User-Agent':'Kymzi-destination-catalogue/2.0 (https://kymzi-f1e9d.web.app)'}),timeout=55) as response:data=json.load(response)
  assert 'results' in data
  p.write_text(json.dumps(data));p.with_suffix('.sparql').write_text(q);print(json.dumps({'canonicalTravelGuides':len(data['results']['bindings'])}),flush=True);break
 except Exception as error:
  print(json.dumps({'attempt':attempt+1,'error':str(error)}),flush=True)
  if attempt==3:raise
  time.sleep(15)
