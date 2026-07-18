import json,math,os,hashlib
L=json.load(open('lic2.geojson'));B=json.load(open('bld2.geojson'));T=json.load(open('tree2.geojson'))
def r6(c):return[round(c[0],6),round(c[1],6)]
def H(s):return int(hashlib.md5(s.encode()).hexdigest(),16)

def categorize(name,lt):
    nm=name.upper();lt=(lt or '').upper()
    if 'APARTMENT BUILDING' in lt: return None
    if nm.endswith('BLOCK') or 'APARTMENT' in nm: return None
    if 'CONTRACTOR' in lt and 'RETAIL' not in lt and 'FOOD' not in lt and 'PERSONAL' not in lt: return None
    if any(w in nm for w in['BREW','TAPROOM','WHISKEY','DISTILL','PUB','SOCIAL CLUB','DIRTY DUCK']) or ('ENTERTAINMENT' in lt and 'FOOD' in lt):return 'bar'
    if any(w in nm for w in['COFFEE','ESPRESSO','CAFE','CAFÉ','BAKERY','DOUGHNUT','DONUT',' TEA','TEA ','ICE CREAM','ROASTER','CANELA','GELATO','DESSERT']):return 'cafe'
    if any(w in nm for w in['GALLER','FOUNDATION','MUSEUM','ARTESANO','COLLECTOR','UNDERGROUND']) or 'ART' in nm.split():return 'gallery'
    if 'PERSONAL SERVICE' in lt or 'MASSAGE' in lt or 'TATTOO' in lt or any(w in nm for w in['SALON','HAIR','NAIL','BARBER','SPA','WELLNESS','BEAUTY','MAKEUP','F45','FITNESS','YOGA','NATUROPATH','MASSAGE','TATTOO','PIERCING','STUDIO']):return 'services'
    if 'FOOD SERVICE' in lt or any(w in nm for w in['PIZZA','SUSHI','RESTAURANT','KITCHEN','GRILL','DUMPLING','TACO','BURGER','NOODLE','BISTRO','EATERY','DELI']):return 'restaurant'
    if 'RETAIL' in lt or 'SECONDHAND' in lt or 'CANNABIS' in lt or 'MANUFACTURER' in lt:return 'shop'
    return 'shop'

CURATED={
 'ESKER FOUNDATION':("Free contemporary art gallery in a converted warehouse.","11–6, closed Mon",[["🖼️","Rotating exhibitions"],["🆓","Always free"],["🏛️","Rooftop terrace"]]),
 'HOSE & HOUND':("Pub grub & craft brews in a 1906 fire hall.","11am–12am",[["🚒","Historic firehall"],["🍺","24 taps"],["🍔","Late kitchen"]]),
 'SPOLUMBO':("Bustling Italian deli & famous house sausage.","9am–4pm",[["🌭","House sausage"],["🥪","Deli subs"],["👨‍🍳","Ex-Stampeders"]]),
 'SMITHBILT':("Makers of the iconic white Stampede hat since 1919.","9am–5pm",[["🤠","Custom felt hats"],["🏭","Working factory"],["⭐","Calgary icon"]]),
 'ROSSO':("Industrial-chic roastery & flagship café.","7am–6pm",[["☕","House-roasted"],["🪵","Communal tables"],["🥐","Fresh pastries"]]),
 'IRONWOOD':("Beloved live-music venue & grill on Music Mile.","Shows nightly",[["🎸","Live roots & folk"],["🍔","Pre-show grill"],["🎶","Music Mile"]]),
 'LASA':("Modern Filipino kitchen with a lush patio.","11am–10pm",[["🍤","Sizzling sisig"],["🌿","Greenhouse patio"],["🍸","Calamansi cocktails"]]),
 'MADISON':("All-day spot known for poke bowls & nachos.","9am–10pm",[["🥢","Poke bowls"],["🧀","Loaded nachos"],["🍳","All-day brunch"]]),
 'ROUGE':("Fine seasonal dining in an 1891 heritage house.","5–10pm",[["🏡","Cross House"],["🌿","Garden-to-table"],["🥂","Award cellar"]]),
 'KNIFEWEAR':("Japanese kitchen knives & sharpening experts.","10am–6pm",[["🔪","Hand-forged blades"],["🪒","Sharpening bar"],["🇯🇵","Imported steel"]]),
 'KENT OF INGLEWOOD':("Wet-shaving, grooming goods & fine knives.","10am–6pm",[["🪒","Straight razors"],["🧴","Grooming kits"],["🎁","Great gifts"]]),
 'FAIR':("Beloved sprawling used & rare bookstore.","10am–6pm",[["📚","Stacks of used books"],["🔎","Rare finds"],["🛋️","Cozy nooks"]]),
 'MADE BY MARCUS':("Small-batch ice cream in wild local flavours.","12–10pm",[["🍦","Rotating flavours"],["🌾","Honey & haskap"],["🧇","Waffle cones"]]),
 'CANELA':("All-vegan bakery & café — sweet & savoury.","8am–5pm",[["🥐","Vegan croissants"],["🎂","Cake counter"],["🌱","Plant-based"]]),
 'GRAVITY':("Espresso & wine bar, a Music Mile staple.","7am–10pm",[["☕","Serious espresso"],["🍷","Evening wine"],["🥪","Café lunch"]]),
 'ALBERTA BOOT':("Alberta's original western boot maker.","9am–5:30pm",[["👢","Handmade cowboy boots"],["🐂","Exotic leathers"],["🧵","Custom fittings"]]),
 'DEANE HOUSE':("Historic riverside restaurant in a 1906 home.","10am–10pm",[["🏛️","1906 heritage house"],["🍽️","Seasonal menu"],["🌉","By the Bow"]]),
 'HIGH LINE BREWING':("Small-batch neighbourhood brewery & taproom.","12–11pm",[["🍺","Fresh batches"],["🎯","Taproom games"],["🐕","Dog-friendly"]]),
}
DOMAINS={'SPOLUMBO':'spolumbos.com','SMITHBILT':'smithbilthats.com','ROSSO':'rossocoffee.com',
 'KNIFEWEAR':'knifewear.com','KENT OF INGLEWOOD':'kentofinglewood.com','IRONWOOD':'ironwoodstage.ca',
 'HIGH LINE BREWING':'highlinebrewing.ca','ALBERTA BOOT':'albertaboot.com','DEANE HOUSE':'deanehouse.com',
 'ESKER FOUNDATION':'eskerfoundation.art','GRAVITY':'gravityespresso.com'}
DEF={'restaurant':("11am–10pm",[["🍴","Local kitchen"],["🪑","Dine-in"],["📍","On the strip"]]),
 'cafe':("8am–6pm",[["☕","Coffee & treats"],["🥐","Fresh baking"],["🪟","Cosy room"]]),
 'bar':("12pm–12am",[["🍺","Local pours"],["🎶","Good vibes"],["🍔","Bar bites"]]),
 'shop':("10am–6pm",[["🛍️","Indie retail"],["✨","Curated goods"],["🎁","Local finds"]]),
 'services':("9am–6pm",[["💈","By appointment"],["✨","Local pros"],["📍","On 9 Ave"]]),
 'gallery':("11am–5pm",[["🎨","Art & culture"],["🆓","Drop in"],["🖼️","Local makers"]])}
PHKW={'restaurant':'restaurant,food','cafe':'coffeeshop,cafe','bar':'pub,beer','shop':'boutique,storefront','services':'salon,studio','gallery':'artgallery,gallery','foodtruck':'foodtruck'}

def pip(pt,geom):
    x,y=pt
    for poly in geom['coordinates']:
        ring=poly[0];inside=False;j=len(ring)-1
        for i in range(len(ring)):
            xi,yi=ring[i];xj,yj=ring[j]
            if((yi>y)!=(yj>y))and(x<(xj-xi)*(y-yi)/((yj-yi)or 1e-12)+xi):inside=not inside
            j=i
        if inside:return True
    return False
def cent(geom):
    xs=[];ys=[]
    for poly in geom['coordinates']:
        for c in poly[0]:xs.append(c[0]);ys.append(c[1])
    return sum(xs)/len(xs),sum(ys)/len(ys)
LAT0=51.042;MX=111320*math.cos(math.radians(LAT0));MY=110540
feats=[f for f in B['features'] if f['geometry']]

seen={};biz=[];bldmap={}
for x in L['features']:
    if not x['geometry']:continue
    p=x['properties'];name=(p.get('tradename') or '').strip()
    if not name:continue
    cat=categorize(name,p.get('licencetypes'))
    if not cat:continue
    key=name.upper()
    if key in seen:continue
    seen[key]=1
    lon,lat=x['geometry']['coordinates']
    # snap building
    bidx=None
    for i,f in enumerate(feats):
        if pip((lon,lat),f['geometry']):bidx=i;break
    if bidx is None:
        best=1e9
        for i,f in enumerate(feats):
            cx,cy=cent(f['geometry']);dd=math.hypot((lon-cx)*MX,(lat-cy)*MY)
            if dd<best and dd<28:best=dd;bidx=i
    if bidx is not None: bldmap[bidx]=H(str(bidx))%9
    # curated?
    cur=None
    for ck in CURATED:
        if ck in key:cur=CURATED[ck];break
    if cur: blurb,hours,hl=cur
    else:
        nice=name.title().replace("'S","'s")
        blurb=f"{nice} — {cat if cat!='services' else 'local service'} on 9 Ave SE in Inglewood."
        hours,hl=DEF.get(cat,DEF['shop'])
    dom=None
    for dk in DOMAINS:
        if dk in key:dom=DOMAINS[dk];break
    mono=''.join([w[0] for w in name.split()[:2] if w[0].isalnum()]).upper() or name[:2].upper()
    pid=H(key)%900+100
    photo=f"https://loremflickr.com/360/240/{PHKW.get(cat,'shop')}?lock={pid}"
    biz.append({"n":name.title().replace("'S","'s"),"cat":cat,"mono":mono,
        "lon":round(lon,6),"lat":round(lat,6),"addr":(p.get('address') or '').strip().title(),
        "blurb":blurb,"hours":hours,"hl":hl,"photo":photo,"dom":dom})
print('businesses kept',len(biz))
from collections import Counter
print(Counter(b['cat'] for b in biz))
# business buildings only
bizBld={"type":"FeatureCollection","features":[
  {"type":"Feature","properties":{"roof":bldmap[i]},
   "geometry":{"type":feats[i]['geometry']['type'],
     "coordinates":[[[r6(c) for c in poly[0]]] for poly in feats[i]['geometry']['coordinates']]}}
  for i in bldmap]}
# streets (slim)
S=json.load(open('str2.geojson'))
st={"type":"FeatureCollection","features":[
   {"type":"Feature","properties":{},"geometry":{"type":"MultiLineString",
    "coordinates":[[r6(c) for c in ln] for ln in f['geometry']['coordinates']]}}
   for f in S['features'] if f['geometry']]}
# trees flat (cap 1100)
tp=[[round(f['geometry']['coordinates'][0],5),round(f['geometry']['coordinates'][1],5)] for f in T['features'] if f['geometry']]
if len(tp)>1100:
    s=len(tp)/1100.0;tp=[tp[int(i*s)] for i in range(1100)]
out={"streets":st,"trees":tp,"bizBld":bizBld,"biz":biz,"center":[-114.0358,51.04185]}
json.dump(out,open('embed3.json','w'),separators=(',',':'))
print('biz buildings',len(bizBld['features']),'trees',len(tp),'size',os.path.getsize('embed3.json'))
