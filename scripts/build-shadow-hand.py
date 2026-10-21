"""Create a compact articulated GLB from pinned Apache-2.0 Menagerie assets.
Visual geometry only; palm and fingers retained, forearm/wrist omitted for the desk mount.
No third-party Python packages required. Run explicitly; normal builds use the saved GLB.
"""
import json, math, struct, urllib.request, xml.etree.ElementTree as ET
from pathlib import Path

COMMIT = '71f066ad0be9cd271f7ed58c030243ef157af9f4'
BASE = f'https://raw.githubusercontent.com/google-deepmind/mujoco_menagerie/{COMMIT}/shadow_hand/'
OUT = Path(__file__).resolve().parents[1] / 'public/models/shadow-hand'
OUT.mkdir(parents=True, exist_ok=True)
def fetch(path):
    return urllib.request.urlopen(BASE + path, timeout=30).read()
xml = fetch('right_hand.xml')
root = ET.fromstring(xml)
(OUT / 'LICENSE').write_bytes(fetch('LICENSE'))
(OUT / 'right_hand.source.xml').write_bytes(xml)
(OUT / 'NOTICE.txt').write_text(f'''Shadow Hand E3M5: original assets by Shadow Robot Company.
MuJoCo Menagerie conversion by Google DeepMind and contributors.
Source: https://github.com/google-deepmind/mujoco_menagerie/tree/{COMMIT}/shadow_hand
License: Apache-2.0 (see LICENSE).
Website modifications: OBJ geometry converted to indexed GLB, millimetres converted to metres,
normals normalized, palm/finger hierarchy retained, forearm and wrist omitted for desk mounting.
Joint axes and limits retained in node extras. Animation is an illustrative website pose,
not MuJoCo dynamics or an experimental replay. Converted by scripts/build-shadow-hand.py.
''')
def numbers(value): return [float(x) for x in value.split()]
def quat(value):
    q=numbers(value); length=math.sqrt(sum(x*x for x in q))
    return [q[1]/length,q[2]/length,q[3]/length,q[0]/length]
defaults={}
def collect(el, parent={}):
    current={k:dict(v) for k,v in parent.items()}
    for child in el:
        if child.tag!='default': current.setdefault(child.tag,{}).update(child.attrib)
    if 'class' in el.attrib: defaults[el.attrib['class']]=current
    for child in el.findall('default'): collect(child,current)
collect(root.find('default'))
gltf={'asset':{'version':'2.0','generator':'Menagerie Shadow Hand website converter','copyright':'Shadow Robot Company; Google DeepMind and contributors. Apache-2.0.'},'scene':0,'scenes':[{'nodes':[0]}],'nodes':[],'meshes':[],'materials':[],'accessors':[],'bufferViews':[],'buffers':[]}
material_ids={}
for material in root.findall('./asset/material'):
    material_ids[material.attrib['name']]=len(gltf['materials'])
    gltf['materials'].append({'name':material.attrib['name'],'pbrMetallicRoughness':{'baseColorFactor':numbers(material.attrib['rgba']),'metallicFactor':.2 if material.attrib['name']=='metallic' else .05,'roughnessFactor':.6}})
binary=bytearray()
def accessor(values, components, kind, component=5126):
    while len(binary)%4: binary.append(0)
    fmt='f' if component==5126 else 'I'
    raw=struct.pack('<'+fmt*len(values),*values)
    view=len(gltf['bufferViews']);gltf['bufferViews'].append({'buffer':0,'byteOffset':len(binary),'byteLength':len(raw)})
    binary.extend(raw)
    result={'bufferView':view,'componentType':component,'count':len(values)//components,'type':kind}
    if kind=='VEC3':
        result['min']=[min(values[i::3]) for i in range(3)]
        result['max']=[max(values[i::3]) for i in range(3)]
    index=len(gltf['accessors']);gltf['accessors'].append(result);return index
mesh_cache={}
def mesh_id(name, material):
    key=(name,material)
    if key in mesh_cache:return mesh_cache[key]
    vertices=[];normals=[];positions=[];out_normals=[];indices=[];seen={}
    for line in fetch('assets/'+name+'.obj').decode().splitlines():
        fields=line.split()
        if not fields:continue
        if fields[0]=='v':vertices.append([float(x)*.001 for x in fields[1:4]])
        elif fields[0]=='vn':
            n=[float(x) for x in fields[1:4]];length=math.sqrt(sum(x*x for x in n));normals.append([x/length for x in n])
        elif fields[0]=='f':
            face=[]
            for token in fields[1:]:
                if token not in seen:
                    parts=token.split('/');assert len(parts)==3 and parts[2], 'Normals required'
                    seen[token]=len(positions)//3
                    positions.extend(vertices[int(parts[0])-1]);out_normals.extend(normals[int(parts[2])-1])
                face.append(seen[token])
            for i in range(1,len(face)-1):indices.extend([face[0],face[i],face[i+1]])
    i=len(gltf['meshes']);mesh_cache[key]=i
    gltf['meshes'].append({'name':name,'primitives':[{'attributes':{'POSITION':accessor(positions,3,'VEC3'),'NORMAL':accessor(out_normals,3,'VEC3')},'indices':accessor(indices,1,'SCALAR',5125),'material':material_ids[material]}]})
    return i
def body(el, is_root=False):
    node={'name':el.attrib['name'],'children':[]}
    if not is_root:
        if 'pos' in el.attrib:node['translation']=numbers(el.attrib['pos'])
        if 'quat' in el.attrib:node['rotation']=quat(el.attrib['quat'])
    joint=el.find('joint')
    if joint is not None and not is_root:
        props=defaults[joint.attrib['class']]['joint'] | joint.attrib
        node['extras']={'joint':props['name'],'axis':numbers(props['axis']),'range':numbers(props['range'])}
    idx=len(gltf['nodes']);gltf['nodes'].append(node)
    for geom in el.findall('geom'):
        if geom.attrib.get('class')!='plastic_visual':continue
        props=defaults['plastic_visual']['geom'] | geom.attrib
        visual={'name':el.attrib['name']+'_visual','mesh':mesh_id(props['mesh'],props['material'])}
        if 'pos' in props:visual['translation']=numbers(props['pos'])
        if 'quat' in props:visual['rotation']=quat(props['quat'])
        node['children'].append(len(gltf['nodes']));gltf['nodes'].append(visual)
    for child in el.findall('body'):node['children'].append(body(child))
    return idx
body(root.find(".//body[@name='rh_palm']"),True)
gltf['buffers']=[{'byteLength':len(binary)}]
js=json.dumps(gltf,separators=(',',':')).encode();js+=b' '*((-len(js))%4);binary+=b'\0'*((-len(binary))%4)
content=struct.pack('<III',0x46546c67,2,12+8+len(js)+8+len(binary))+struct.pack('<II',len(js),0x4e4f534a)+js+struct.pack('<II',len(binary),0x004e4942)+binary
(OUT/'shadow-hand.glb').write_bytes(content)
print(f'Wrote {len(content):,} bytes, {len(gltf["meshes"])} meshes, {len(gltf["nodes"])} nodes.')
