import json,os,math,hashlib
def H(s):return int(hashlib.md5(s.encode()).hexdigest(),16)
def dp(pts,eps):
    if len(pts)<3:return pts
    dmax=0;idx=0;a,b=pts[0],pts[-1]
    for i in range(1,len(pts)-1):
        d=perp(pts[i],a,b)
        if d>dmax:dmax=d;idx=i
    if dmax>eps:
        return dp(pts[:idx+1],eps)[:-1]+dp(pts[idx:],eps)
    return [a,b]
def perp(p,a,b):
    if a==b:return math.hypot(p[0]-a[0],p[1]-a[1])
    dx,dy=b[0]-a[0],b[1]-a[1];L=dx*dx+dy*dy
    t=((p[0]-a[0])*dx+(p[1]-a[1])*dy)/L
    cx,cy=a[0]+t*dx,a[1]+t*dy
    return math.hypot(p[0]-cx,p[1]-cy)
def simplify(fn,eps):
    d=json.load(open(fn));out=[]
    for f in d['features']:
        g=f['geometry']
        if not g:continue
        lines=g['coordinates'] if g['type']=='MultiLineString' else [g['coordinates']]
        nl=[]
        for ln in lines:
            ln=[[round(c[0],5),round(c[1],5)] for c in ln]
            s=dp(ln,eps)
            if len(s)>=2:nl.append(s)
        if nl:out.append(nl)
    return out
bike=simplify('bike.geojson',0.00004)
path=simplify('path.geojson',0.00004)
def fc(multi):
    return {"type":"FeatureCollection","features":[{"type":"Feature","properties":{},
       "geometry":{"type":"MultiLineString","coordinates":m}} for m in multi]}
E=json.load(open('embed3.json'))
# reliable photos (picsum) + a few more logo domains
DOM={'SPOLUMBO':'spolumbos.com','SMITHBILT':'smithbilthats.com','ROSSO':'rossocoffee.com','KNIFEWEAR':'knifewear.com',
 'KENT OF INGLEWOOD':'kentofinglewood.com','IRONWOOD':'ironwoodstage.ca','HIGH LINE':'highlinebrewing.ca',
 'ALBERTA BOOT':'albertaboot.com','DEANE HOUSE':'deanehouse.com','ESKER':'eskerfoundation.art','GRAVITY':'gravityespresso.com',
 'FAIR':'fairsfairbooks.com','HOSE & HOUND':'hoseandhound.ca','FObT':'','MADE BY MARCUS':'madebymarcus.ca',
 'CANELA':'canelabakeshop.com','ANALOG':'analogcoffee.ca','LUKE':'lukesdrugmart.com','HELLO VINTAGE':'',
 'FOUR20':'four20.ca','BANDED':'','LINA':'','MILLERANDABLE':''}
for b in E['biz']:
    key=b['n'].upper();pid=H(key)%1000
    b['photo']=f"https://picsum.photos/seed/yyc{pid}/400/260"
    dom=None
    for dk,dv in DOM.items():
        if dk in key and dv:dom=dv;break
    b['dom']=dom
out={"center":[-114.0358,51.04185],"biz":E['biz'],"bizBld":E['bizBld'],"trees":E['trees'],
     "bike":fc(bike),"path":fc(path)}
json.dump(out,open('embed4.json','w'),separators=(',',':'))
print('bike lines',len(bike),'path lines',len(path))
print('domains assigned',sum(1 for b in E['biz'] if b['dom']))
print('embed4',round(os.path.getsize('embed4.json')/1e6,2),'MB')
