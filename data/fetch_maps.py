import urllib.request, urllib.parse, json, concurrent.futures, pathlib, time
ROOT=pathlib.Path(__file__).resolve().parents[1]/'dist/assets'; ROOT.mkdir(parents=True,exist_ok=True)
BASE='https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/'
layers={'roads':('Transportation_WebMercator',163,'STREETNAME,STREETTYPE'), 'buildings':('Planimetrics_2023',1,'OBJECTID'), 'water':('Planimetrics_2023',14,'OBJECTID')}
bbox=(-77.079,38.876,-76.995,38.923)
def request(url):
 for i in range(4):
  try:
   with urllib.request.urlopen(url,timeout=90) as r:return json.load(r)
  except Exception:
   if i==3:raise
   time.sleep(2)
def fetch(name):
 service,layer,fields=layers[name]; fs=[]; offset=0
 while True:
  p={'f':'geojson','where':'1=1','outFields':fields,'geometry':','.join(map(str,bbox)),'geometryType':'esriGeometryEnvelope','inSR':4326,'outSR':4326,'spatialRel':'esriSpatialRelIntersects','resultRecordCount':2000,'resultOffset':offset,'orderByFields':'OBJECTID','maxAllowableOffset':0.000009}
  d=request(BASE+service+'/MapServer/'+str(layer)+'/query?'+urllib.parse.urlencode(p))
  if 'error' in d:raise Exception(d['error'])
  batch=d.get('features',[]);fs.extend(batch);offset+=len(batch)
  if len(batch)<2000:break
 (pathlib.Path(__file__).resolve().parent/(name+'.geojson')).write_text(json.dumps({'type':'FeatureCollection','features':fs},separators=(',',':')))
 print(name,len(fs),flush=True)
 return name,fs
def xy(p):return ((p[0]-bbox[0])/(bbox[2]-bbox[0])*1000,(bbox[3]-p[1])/(bbox[2]-bbox[0])*720)
def line(points,close=False):
 return 'M'+'L'.join('%.2f %.2f'%xy(p) for p in points)+('Z' if close else '')
def path(g):
 t=g['type'];c=g['coordinates']
 if t=='LineString':return line(c)
 if t=='MultiLineString':return ''.join(line(x) for x in c)
 if t=='Polygon':return ''.join(line(x,True) for x in c)
 if t=='MultiPolygon':return ''.join(line(x,True) for poly in c for x in poly)
 return ''
data=dict(concurrent.futures.ThreadPoolExecutor(3).map(fetch,layers))
parts={k:''.join(path(f['geometry']) for f in fs if f.get('geometry')) for k,fs in data.items()}
routes={}
for n in ['PENNSYLVANIA','MASSACHUSETTS','CONNECTICUT']:
 routes[n]=''.join(path(f['geometry']) for f in data['roads'] if n in str(f['properties'].get('STREETNAME','')).upper())
out={'bbox':bbox,'roads':parts['roads'],'buildings':parts['buildings'],'water':parts['water'],'routes':routes}
(ROOT/'map-data.json').write_text(json.dumps(out,separators=(',',':')))
for kind in ['figure-ground','network']:
 svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 720"><rect width="1000" height="720" fill="#f5f3ed"/><path d="{parts["water"]}" fill="#d8dfdc"/>'
 if kind=='figure-ground':svg+=f'<path d="{parts["buildings"]}" fill="#252723" fill-rule="evenodd"/>'
 else:svg+=f'<path d="{parts["roads"]}" fill="none" stroke="#9c9d97" stroke-width=".75"/>'
 for n,p in routes.items():svg+=f'<path d="{p}" fill="none" stroke="#b34f43" stroke-width="3"/>'
 svg+='</svg>'; (ROOT/(kind+'.svg')).write_text(svg)
print('Map assets ready',flush=True)
