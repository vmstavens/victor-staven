/** Offline image composition. Loaded by render-research-images.mjs via the local Vite server. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { loadShadowHand } from '../src/scripts/shadow-hand';

export async function renderResearchVisual(type: 'hand' | 'simulation') {
  const width = 1500, height = 960;
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.domElement.id = 'research-render';
  renderer.domElement.style.cssText = 'position:fixed;inset:0;z-index:9999;width:1500px;height:960px';
  document.body.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#191b1e');
  const camera = new THREE.PerspectiveCamera(33, width / height, .01, 100);
  const v = (x:number,y:number,z:number) => new THREE.Vector3(x,y,z);
  const mat = (color: number, metalness = 0, roughness = .55) => new THREE.MeshStandardMaterial({color,metalness,roughness});
  const dark = mat(0x30353d,.3,.5);
  const ambient = new THREE.HemisphereLight(0xf2f2f2,0x34363b,2.3);scene.add(ambient);
  const key = new THREE.DirectionalLight(0xffffff,4); key.position.set(-4,7,5);key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-5,right:5,top:5,bottom:-5,near:.1,far:30});key.shadow.normalBias=.012;key.shadow.bias=-.0001;key.shadow.radius=3;scene.add(key);
  const fill = new THREE.DirectionalLight(0xdce1e8,2);fill.position.set(4,3,-2);scene.add(fill);
  function mesh(geometry:THREE.BufferGeometry,material:THREE.Material,position:THREE.Vector3,parent:THREE.Object3D=scene) {
    const m=new THREE.Mesh(geometry,material);m.position.copy(position);m.castShadow=m.receiveShadow=true;parent.add(m);return m;
  }
  function box(w:number,h:number,d:number,material:THREE.Material,position:THREE.Vector3,parent:THREE.Object3D=scene) {
    return mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(.05,h/4)),material,position,parent);
  }
  function line(points:THREE.Vector3[],color:number,dashed=false) {
    const material = dashed ? new THREE.LineDashedMaterial({color,dashSize:.05,gapSize:.035,transparent:true,opacity:.75}) : new THREE.LineBasicMaterial({color,transparent:true,opacity:.6});
    const item=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),material);item.computeLineDistances();scene.add(item);return item;
  }
  {
    const hand=await loadShadowHand();hand.pose(.58);
    hand.group.rotation.x=-Math.PI/2;hand.group.scale.setScalar(15);
    hand.group.position.set(type==='hand'?-.45:-1.25,.13,0);
    hand.contacts.visible=true;hand.target.visible=type==='hand';scene.add(hand.group);
    box(1.3,.13,1.05,dark,v(hand.group.position.x,.04,0));
    if(type==='hand') {
      camera.position.set(3.9,3.25,5.9);camera.lookAt(.0,1.6,.35);
      const floor=mesh(new THREE.PlaneGeometry(30,30),new THREE.ShadowMaterial({opacity:.35}),v(0,-.03,0));
      floor.rotation.x=-Math.PI/2;floor.castShadow=false;
      // Discrete contact markers emphasize the actual articulated model.
      const grid=new THREE.GridHelper(8,32,0x515760,0x2d3138);grid.position.y=-.02;scene.add(grid);
    } else {
      hand.target.visible=false;
      const ghost=hand.group.clone(true);ghost.position.x=1.35;
      ghost.traverse(obj=>{
        if(obj instanceof THREE.Mesh) {
          obj.material=new THREE.MeshBasicMaterial({color:0xf98951,wireframe:true,transparent:true,opacity:.23});obj.castShadow=false;
        }
      });scene.add(ghost);
      box(1.3,.13,1.05,dark,v(1.35,.04,0));
      camera.position.set(3.7,3.5,8.2);camera.lookAt(.05,1.65,.3);
      const grid=new THREE.GridHelper(12,40,0x6b7482,0x343a44);scene.add(grid);
      line([v(-.1,.02,-2),v(-.1,3.3,-2)],0x929ca9,true);
      for(const x of [-1.25,1.35]) {
        line([v(x,.16,0),v(x+.58,.16,0)],0xcf8b6c);
        line([v(x,.16,0),v(x,.74,0)],0x8ebb99);
        line([v(x,.16,0),v(x,.16,.58)],0x7aaec9);
      }
      ambient.intensity=2;fill.intensity=3.4;
    }
  }
  renderer.render(scene,camera);
  return {width,height};
}
