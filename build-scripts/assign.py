import json, math
b=json.load(open('bld.geojson')); s=json.load(open('str.geojson'))
LAT0=51.042
def mx(lon): return lon*111320*math.cos(math.radians(LAT0))
def my(lat): return lat*110540
# build 9 Ave SE polyline (approx by sorting points by lon)
pts=[]
for f in s['features']:
    if (f['properties'].get('full_name'))=='9 AV SE' and f['geometry']:
        for ln in f['geometry']['coordinates']:
            pts+=ln
pts=sorted(set((round(p[0],7),round(p[1],7)) for p in pts))
line=[(mx(p[0]),my(p[1])) for p in pts]
# cumulative length + helpers
def near_line(px,py):
    best=1e18; bestt=0; bestside=0; acc=0
    for i in range(len(line)-1):
        ax,ay=line[i]; bx,by=line[i+1]
        dx,dy=bx-ax,by-ay; L2=dx*dx+dy*dy
        if L2==0: continue
        t=max(0,min(1,((px-ax)*dx+(py-ay)*dy)/L2))
        cx,cy=ax+t*dx,ay+t*dy
        d=math.hypot(px-cx,py-cy)
        if d<best:
            best=d; bestt=acc+t*math.sqrt(L2)
            cross=dx*(py-ay)-dy*(px-ax)
            bestside=1 if cross>0 else -1  # +1 = north(left going east)
        acc+=math.sqrt(L2)
    return best,bestt,bestside
def centroid(geom):
    xs=[];ys=[]
    for poly in geom['coordinates']:
        for ring in poly:
            for c in ring: xs.append(c[0]);ys.append(c[1])
    return sum(xs)/len(xs), sum(ys)/len(ys)
cands=[]
for f in b['features']:
    g=f['geometry']
    if not g: continue
    lon,lat=centroid(g)
    d,t,side=near_line(mx(lon),my(lat))
    area=float(f['properties'].get('shape__area',0) or 0)
    if d<32 and area>20:
        cands.append({'lon':lon,'lat':lat,'d':d,'t':t,'side':side,'area':area,'geom':g})
north=sorted([c for c in cands if c['side']>0],key=lambda c:c['t'])
south=sorted([c for c in cands if c['side']<0],key=lambda c:c['t'])
print('candidates N',len(north),'S',len(south))

# business lists west->east
N=[
 ("Esker Foundation","gallery","EF","Free contemporary art gallery in a converted warehouse.","11–6, closed Mon",[["🖼️","Rotating exhibitions"],["🆓","Always free"],["🏛️","Rooftop terrace"]]),
 ("Hose & Hound","bar","HH","Pub grub & craft brews in a 1906 fire hall.","11am–12am",[["🚒","Historic firehall"],["🍺","24 taps"],["🍔","Late kitchen"]]),
 ("Rosso Coffee","cafe","RC","Industrial-chic roastery & flagship café.","7am–6pm",[["☕","House-roasted espresso"],["🪵","Communal tables"],["🥐","Fresh pastries"]]),
 ("Madi's 12|12","restaurant","MA","All-day spot known for poke bowls & nachos.","9am–10pm",[["🥢","Build-your-own poke"],["🧀","Loaded nachos"],["🍳","All-day brunch"]]),
 ("SOT","restaurant","SO","Intimate chef-driven tasting menu.","5:30–10pm",[["🍴","Seasonal tasting"],["🪑","12 seats"],["🍷","Pairings"]]),
 ("Mumbai Bites","restaurant","MB","Street-style Indian eats & chai.","11am–9pm",[["🌶️","Chaat & pav bhaji"],["🫓","Fresh kulcha"],["🥭","Mango lassi"]]),
 ("Rouge","restaurant","RO","Fine seasonal dining in an 1891 heritage house.","5–10pm",[["🏡","Cross House"],["🌿","Garden-to-table"],["🥂","Award cellar"]]),
]
S=[
 ("L'Olivo Cicchetti","restaurant","LO","Venetian small plates & natural-wine lounge.","5–11pm",[["🍷","Natural wine"],["🫒","Cicchetti plates"],["🕯️","Candlelit room"]]),
 ("LASA","restaurant","LA","Modern Filipino kitchen with a lush patio.","11am–10pm",[["🍤","Sizzling sisig"],["🌿","Greenhouse patio"],["🍸","Calamansi cocktails"]]),
 ("Pronto Pizza","restaurant","PP","Wood-fired Neapolitan slices to go.","11am–9pm",[["🔥","90-sec oven"],["🍕","By the slice"],["🥗","Daily focaccia"]]),
 ("Made by Marcus","cafe","MM","Small-batch ice cream in wild local flavours.","12–10pm",[["🍦","Rotating flavours"],["🌾","Honey & haskap"],["🧇","Waffle cones"]]),
 ("The Nash & Off Cut","restaurant","TN","Hip Canadian dining in a 1907 hotel.","5–11pm",[["🥩","Wood-grilled mains"],["🍸","Off Cut bar"],["🏚️","Heritage room"]]),
 ("The Eden","restaurant","ED","Busy bistro for classics & brunch.","9am–10pm",[["🍳","Weekend brunch"],["🍝","Comfort classics"],["☀️","Front patio"]]),
 ("Ironwood Stage","bar","IW","Beloved live-music venue & grill on Music Mile.","Shows nightly",[["🎸","Live roots & folk"],["🍔","Pre-show grill"],["🎶","Music Mile"]]),
 ("Smithbilt Hats","shop","SH","Makers of the iconic white Stampede hat since 1919.","9am–5pm",[["🤠","Custom felt hats"],["🏭","Working factory"],["⭐","Calgary icon"]]),
 ("Spolumbo's Deli","cafe","SP","Bustling Italian deli & famous house sausage.","9am–4pm",[["🌭","House sausage"],["🥪","Deli subs"],["👨‍🍳","Ex-Stampeders"]]),
 ("Canela Vegan","cafe","CV","Calgary's first all-vegan bakery & café.","8am–5pm",[["🥐","Vegan croissants"],["🎂","Cake counter"],["🌱","Plant-based"]]),
]
def assign(side_cands, biz):
    if not side_cands: return []
    tmin=side_cands[0]['t']; tmax=side_cands[-1]['t']; span=max(1e-6,tmax-tmin)
    used=set(); out=[]
    n=len(biz)
    for i,bz in enumerate(biz):
        target=tmin+(i+0.5)/n*span
        best=None;bd=1e18
        for j,c in enumerate(side_cands):
            if j in used: continue
            dd=abs(c['t']-target)
            if dd<bd: bd=dd;best=j
        if best is None: break
        used.add(best); c=side_cands[best]
        out.append((bz,c))
    return out
def pack(pairs):
    res=[]
    for bz,c in pairs:
        nm,cat,mono,blurb,hours,hl=bz
        res.append({"n":nm,"cat":cat,"mono":mono,"blurb":blurb,"hours":hours,"hl":hl,
                    "lon":round(c['lon'],6),"lat":round(c['lat'],6),"geom":c['geom']})
    return res
biz=pack(assign(north,N))+pack(assign(south,S))
print('placed businesses',len(biz))
sel_ids=set(id(x['geom']) for x in biz)
context=[f for f in b['features'] if id(f['geometry']) not in sel_ids and f['geometry']]
# slim context buildings: drop props
ctx={"type":"FeatureCollection","features":[{"type":"Feature","geometry":f['geometry'],"properties":{}} for f in context]}
# streets keep name + class
st={"type":"FeatureCollection","features":[{"type":"Feature","geometry":f['geometry'],
     "properties":{"name":f['properties'].get('full_name'),"cls":f['properties'].get('ctp_class')}} for f in s['features'] if f['geometry']]}
out={"buildings":ctx,"streets":st,"biz":biz,
     "center":[ -114.0362,51.0417 ]}
json.dump(out,open('embed.json','w'))
import os
print('embed.json',os.path.getsize('embed.json'),'bytes')
