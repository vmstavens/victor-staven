import * as THREE from 'three';
import { CablePhysics } from './cable-physics';
import { loadShadowHand } from './shadow-hand';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/** Shadow Hand workbench. Illustrative kinematics, not experimental replay. */
export async function initRobotScene() {
  const viewport = document.querySelector<HTMLElement>('#scene-viewport');
  if (!viewport) return;
  const element = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
  const fallback = element('scene-fallback');
  const panel = element('scene-controls');
  const options = element('scene-options');
  const playButton = element<HTMLButtonElement>('scene-play');
  const progress = element<HTMLInputElement>('scene-progress');
  const resetButton = element<HTMLButtonElement>('scene-reset');
  const contactButton = element<HTMLButtonElement>('scene-contacts');
  const targetButton = element<HTMLButtonElement>('scene-target');
  const symbol = element('play-symbol');
  const angleReadout = element('scene-angle');
  let renderer: THREE.WebGLRenderer;
  try { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true }); }
  catch {
    // Keep the explanatory illustration useful on devices without WebGL.
    options.hidden = false;
    contactButton.hidden = targetButton.hidden = true;
    element('scene-hint').textContent = 'Static preview · WebGL unavailable';
    return;
  }
  let hand: Awaited<ReturnType<typeof loadShadowHand>>;
  try { hand = await loadShadowHand(); }
  catch (error) { renderer.dispose(); throw error; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, window.matchMedia('(max-width: 760px)').matches ? 1.25 : 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  viewport.appendChild(renderer.domElement);
  fallback.hidden = true;
  fallback.style.display = 'none';
  panel.hidden = options.hidden = false;
  element('robot-demo').dataset.sceneState = 'live';

  const scene = new THREE.Scene();
  const v = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 50);
  const initialCamera = v(5.3, 4.5, 8.2);
  const initialTarget = v(0, .72, 0);
  camera.position.copy(initialCamera);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(initialTarget);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.enableZoom = false; // Preserve normal page scrolling over the hero.
  controls.minAzimuthAngle = -.7;
  controls.maxAzimuthAngle = 1.15;
  controls.minPolarAngle = .45;
  controls.minDistance = 8;
  controls.maxDistance = 17;
  controls.maxPolarAngle = 1.4;
  scene.add(new THREE.HemisphereLight(0xe8edf5, 0x414650, 2.6));
  const key = new THREE.DirectionalLight(0xffeee5, 3);
  key.position.set(-3, 6, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 });
  key.shadow.normalBias = .025;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xc3d4ed, 1.5);
  rim.position.set(3, 3, -4);
  scene.add(rim);

  const metal = new THREE.MeshStandardMaterial({ color: 0xc5cbd4, metalness: .15, roughness: .65 });
  const copper = new THREE.MeshStandardMaterial({ color: 0xff6b2b, metalness: .28, roughness: .35 });
  const mint = new THREE.MeshBasicMaterial({ color: 0xc5d0df });
  function mesh(geometry: THREE.BufferGeometry, material: THREE.Material, position: THREE.Vector3, parent: THREE.Object3D = scene) {
    const obj = new THREE.Mesh(geometry, material);
    obj.position.copy(position);
    obj.castShadow = obj.receiveShadow = true;
    parent.add(obj);
    return obj;
  }
  function beam(a: THREE.Vector3, b: THREE.Vector3, radius: number, material: THREE.Material = metal, parent: THREE.Object3D = scene) {
    const obj = mesh(new THREE.CylinderGeometry(radius, radius, 1, 24), material, v(0, 0), parent);
    poseBeam(obj, a, b);
    return obj;
  }
  function poseBeam(obj: THREE.Mesh, a: THREE.Vector3, b: THREE.Vector3) {
    obj.position.copy(a).add(b).multiplyScalar(.5);
    obj.scale.y = a.distanceTo(b);
    obj.quaternion.setFromUnitVectors(v(0, 1), b.clone().sub(a).normalize());
  }
  const rig = hand.group;
  rig.scale.setScalar(10);
  rig.rotation.x = -Math.PI / 2;
  rig.position.set(-1.05, .86, .18);
  rig.userData.hotspot = 'hand';
  scene.add(rig);
  const contacts = hand.contacts;
  const target = hand.target;
  const cream = new THREE.MeshStandardMaterial({ color: 0x8c949f, roughness: .85 });
  const green = new THREE.MeshStandardMaterial({ color: 0x454d59, roughness: .8 });
  const sage = new THREE.MeshStandardMaterial({ color: 0x505a68, roughness: .95 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x15191f, roughness: .8 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x393f48, roughness: .9 });
  function box(w: number, h: number, d: number, material: THREE.Material, position: THREE.Vector3, parent: THREE.Object3D = scene) {
    return mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(.09, h / 4, w / 4, d / 4)), material, position, parent);
  }
  box(5.6, .22, 3.05, cream, v(0, .65));
  box(5.45, .12, 2.9, wood, v(0, .5));
  for (const x of [-2.35, 2.35]) for (const z of [-1.08, 1.08]) {
    box(.16, 1.15, .16, green, v(x, -.1, z));
  }
  box(3.25, .025, 2.45, sage, v(-.8, .78, .02));
  box(.8, .1, .65, green, v(-1.05, .83, .18));
  const matGrid = new THREE.GridHelper(2.4, 12, 0x8290a2, 0x8290a2);
  matGrid.position.set(-.95, .8, .05);
  scene.add(matGrid);
  // Monitor: a tiny simulation schematic drawn as geometry, not a screenshot.
  const monitor = new THREE.Group();
  monitor.position.set(1.25, .8, -.82);
  monitor.rotation.y = -.12;
  monitor.userData.hotspot = 'monitor';
  scene.add(monitor);
  box(.85, .07, .5, green, v(0, .03), monitor);
  box(.13, .55, .12, green, v(0, .3), monitor);
  box(1.9, 1.25, .15, green, v(0, 1.12), monitor);
  box(1.72, 1.06, .035, dark, v(0, 1.12, .09), monitor);
  const screenLine = new THREE.LineBasicMaterial({ color: 0x8798af });
  for (let i = 0; i < 5; i++) {
    const y = .69 + i * .09;
    const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints([v(-.68, y, .12), v(.55, y + .13, .12)]), screenLine);
    monitor.add(line);
  }
  beam(v(-.36, .83, .14), v(-.36, 1.13, .14), .035, mint, monitor);
  beam(v(-.36, 1.13, .14), v(-.07, 1.4, .14), .035, mint, monitor);
  beam(v(-.07, 1.4, .14), v(.28, 1.21, .14), .035, mint, monitor);
  box(.19, .18, .05, copper, v(.42, .88, .14), monitor);
  box(.55, .018, .015, copper, v(-.4, 1.53, .12), monitor);
  box(.32, .018, .015, mint, v(-.51, 1.46, .12), monitor);
  box(1.15, .045, .4, green, v(1.12, .81, -.03));
  for (let row = 0; row < 3; row++) for (let col = 0; col < 9; col++) {
    box(.08, .018, .065, sage, v(.68 + col * .11, .84, -.15 + row * .10));
  }
  // Cable and a separate tactile sensor sit at the front of the bench.
  const cablePath = new THREE.CatmullRomCurve3([v(.13, .85, .85), v(.5, .85, .48), v(.93, .85, .9), v(1.45, .85, 1.07), v(1.9, .85, .61), v(2.21, .85, .82)]);
  const cable = mesh(new THREE.TubeGeometry(cablePath, 48, .04, 8, false), copper, v(0, 0));
  cable.userData.hotspot = 'cable';
  const cablePhysics = new CablePhysics(cablePath);
  const cableControls = element('cable-controls');
  const cableMove = element<HTMLButtonElement>('cable-move');
  const cableReset = element<HTMLButtonElement>('cable-reset');
  const cableStatus = element('cable-status');
  cableControls.hidden = false;
  mesh(new THREE.CylinderGeometry(.21, .25, .09, 24), green, v(2.1, .84, -.05));
  mesh(new THREE.CapsuleGeometry(.15, .29, 5, 16), cream, v(2.1, 1.09, -.05));
  mesh(new THREE.SphereGeometry(.09, 16, 12), copper, v(2.1, 1.17, .09));
  // A notebook, pencil, and plant soften the lab without obscuring the experiment.
  const notebook = box(.62, .08, .75, copper, v(-2.25, .84, -.68));
  notebook.rotation.y = -.18;
  const pages = box(.57, .04, .71, cream, v(-2.25, .9, -.68));
  pages.rotation.y = -.18;
  beam(v(-2.14, .95, -.93), v(-2.34, .95, -.43), .022, green);
  mesh(new THREE.CylinderGeometry(.22, .17, .36, 24), cream, v(2.3, .95, -1.04));
  for (let i = 0; i < 5; i++) {
    const a = i * Math.PI * 2 / 5;
    const tip = v(2.3 + Math.cos(a) * .18, 1.5 + (i % 2) * .16, -1.04 + Math.sin(a) * .18);
    beam(v(2.3, 1.08, -1.04), tip, .014, green);
    const leaf = mesh(new THREE.SphereGeometry(.12, 12, 8), sage, tip);
    leaf.scale.set(.65, 1.7, .5);
    leaf.rotation.z = Math.cos(a) * .6;
  }
  const ground = mesh(new THREE.CircleGeometry(4.1, 64), new THREE.ShadowMaterial({ opacity: .12 }), v(0, -.69));
  ground.rotation.x = -Math.PI / 2;
  ground.castShadow = false;

  const hotspotElements = [...document.querySelectorAll<HTMLButtonElement>('[data-workbench-object]')];
  const hotspotPositions: Record<string, THREE.Vector3> = {
    hand: v(-.8, 2.48, .57), cable: v(1.15, .88, .95), monitor: v(1.25, 2.2, -.72),
  };
  function positionHotspots() {
    for (const button of hotspotElements) {
      if (button.dataset.workbenchObject === 'cable') hotspotPositions.cable.copy(cablePhysics.points[18]).add(v(0,.25,0));
      const point = hotspotPositions[button.dataset.workbenchObject!].clone().project(camera);
      button.style.setProperty('--hotspot-x', `${THREE.MathUtils.clamp((point.x + 1) * 50, 7, 93)}%`);
      button.style.setProperty('--hotspot-y', `${THREE.MathUtils.clamp((1 - point.y) * 50, 10, 90)}%`);
    }
  }
  const raycaster = new THREE.Raycaster();
  function hitObject(event: PointerEvent) {
    const bounds = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((event.clientX - bounds.left) / bounds.width * 2 - 1, -(event.clientY - bounds.top) / bounds.height * 2 + 1), camera);
    const hit = raycaster.intersectObjects([rig, monitor, cable], true)[0];
    let object: THREE.Object3D | null = hit?.object ?? null;
    while (object && !object.userData.hotspot) object = object.parent;
    return object?.userData.hotspot as string | undefined;
  }
  let pointerStart: { x: number; y: number } | null = null;
  let dragPointer: number | null = null;
  let cableMode = false;
  const dragPlane = new THREE.Plane();
  const grabOffset = new THREE.Vector3();
  const pointerWorld = new THREE.Vector3();
  function pointerRay(event: PointerEvent) {
    const bounds = renderer.domElement.getBoundingClientRect();
    raycaster.setFromCamera(new THREE.Vector2((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1),camera);
  }
  function pickCable(event: PointerEvent) {
    pointerRay(event);
    let closest = event.pointerType === 'touch' ? .19*.19 : .10*.10, picked = -1;
    const onRay = new THREE.Vector3(), onCable = new THREE.Vector3();
    for(let i=0;i<cablePhysics.points.length-1;i++) {
      const distance=raycaster.ray.distanceSqToSegment(cablePhysics.points[i],cablePhysics.points[i+1],onRay,onCable);
      if(distance<closest) { closest=distance;picked=onCable.distanceToSquared(cablePhysics.points[i])<onCable.distanceToSquared(cablePhysics.points[i+1])?i:i+1; }
    }
    return picked;
  }
  function refreshCable() {
    const geometry = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(cablePhysics.points),64,.04,8,false);
    cable.geometry.dispose(); cable.geometry=geometry; needsRender=true;
  }
  function setCableMode(enabled: boolean) {
    cableMode=enabled; cableMove.setAttribute('aria-pressed',String(enabled));
    renderer.domElement.style.setProperty('touch-action',enabled?'none':'pan-y','important');
    viewport!.style.touchAction=enabled?'none':'pan-y';
    element('cable-hint').textContent=enabled?'Drag the cable. Arrow keys move it; Page Up/Down lifts or lowers it. Escape releases it.':'Drag the cable off the table. On touch screens, enable Move cable first.';
  }
  function finishDrag() {
    const pointer=dragPointer;dragPointer=null;pointerStart=null;
    if(pointer !== null && renderer.domElement.hasPointerCapture(pointer)) renderer.domElement.releasePointerCapture(pointer);
    if(cablePhysics.grabbed>=0) cablePhysics.release();
    controls.enabled=true;renderer.domElement.style.cursor='grab';
    cableStatus.textContent='Cable released.';
  }
  // Capture runs before OrbitControls' pointer handler, so cable drags never orbit.
  renderer.domElement.addEventListener('pointerdown', event => {
    if(!event.isPrimary || event.button!==0 || dragPointer!==null) return;
    const index = event.pointerType==='touch' && !cableMode ? -1 : pickCable(event);
    if(index>=0) {
      event.preventDefault();event.stopImmediatePropagation();
      controls.enabled=false;controls.enableDamping=false;controls.update();controls.enableDamping=true;
      dragPointer=event.pointerId;pointerStart=null;
      renderer.domElement.setPointerCapture(event.pointerId);
      const held=cablePhysics.points[index];
      dragPlane.setFromNormalAndCoplanarPoint(camera.getWorldDirection(new THREE.Vector3()),held);
      raycaster.ray.intersectPlane(dragPlane,pointerWorld);grabOffset.copy(held).sub(pointerWorld);
      cablePhysics.grab(index);renderer.domElement.style.cursor='grabbing';
      cableStatus.textContent='Cable grabbed. Drag to move, release to drop.';
    } else pointerStart={x:event.clientX,y:event.clientY};
  },true);
  renderer.domElement.addEventListener('pointermove', event => {
    if(event.pointerId===dragPointer) {
      event.preventDefault();event.stopImmediatePropagation();pointerRay(event);
      if(raycaster.ray.intersectPlane(dragPlane,pointerWorld)) {
        cablePhysics.target.copy(pointerWorld).add(grabOffset).clamp(v(-5,-.65,-4),v(5,4,4));
      }
      return;
    }
    if(event.buttons) return;
    const id=hitObject(event), overCable=pickCable(event)>=0;
    renderer.domElement.style.cursor=overCable?'grab':id?'pointer':'grab';
    hotspotElements.forEach(button=>button.toggleAttribute('data-hovered',button.dataset.workbenchObject===id));
  },true);
  renderer.domElement.addEventListener('pointerup', event => {
    if(event.pointerId===dragPointer) {event.stopImmediatePropagation();finishDrag();return;}
    if(!pointerStart||Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>6){pointerStart=null;return;}
    pointerStart=null;
    const id=hitObject(event);
    const button=hotspotElements.find(button=>button.dataset.workbenchObject===id);
    button?.click();button?.focus({preventScroll:true});
  },true);
  renderer.domElement.addEventListener('pointercancel',event=>{if(event.pointerId===dragPointer)finishDrag();pointerStart=null;});
  renderer.domElement.addEventListener('lostpointercapture',event=>{if(event.pointerId===dragPointer)finishDrag();});
  renderer.domElement.addEventListener('pointerleave',()=>hotspotElements.forEach(button=>button.removeAttribute('data-hovered')));
  cableMove.addEventListener('click',()=>{if(cableMode)finishDrag();setCableMode(!cableMode);});
  cableMove.addEventListener('keydown',event=>{
    if(!cableMode || !['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','PageUp','PageDown'].includes(event.key))return;
    event.preventDefault();
    if(cablePhysics.grabbed<0)cablePhysics.grab(cablePhysics.points.length-1);
    const right=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,0).multiplyScalar(.17);
    const up=new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld,1).multiplyScalar(.17);
    if(event.key==='ArrowLeft')cablePhysics.target.sub(right);
    if(event.key==='ArrowRight')cablePhysics.target.add(right);
    if(event.key==='ArrowUp')cablePhysics.target.add(up);
    if(event.key==='ArrowDown')cablePhysics.target.sub(up);
    if(event.key==='PageUp')cablePhysics.target.y+=.17;
    if(event.key==='PageDown')cablePhysics.target.y-=.17;
    cablePhysics.target.clamp(v(-5,-.65,-4),v(5,4,4));
    cableStatus.textContent='Cable held. Press Escape to release.';
  });
  cableReset.addEventListener('click',()=>{finishDrag();setCableMode(false);cablePhysics.reset();refreshCable();cableStatus.textContent='Cable reset on table.';});
  element('robot-demo').addEventListener('keydown',event=>{if(event.key==='Escape'&&(cableMode||dragPointer!==null)){finishDrag();setCableMode(false);}});
  window.addEventListener('blur',()=>{if(dragPointer!==null||cablePhysics.grabbed>=0)finishDrag();});

  let phase = 0;
  let direction = 1;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let playing = !reducedMotion.matches;
  let visible = true;
  let needsRender = true;
  controls.addEventListener('change', () => { needsRender = true; });
  function updatePose() {
    needsRender = true;
    const degrees = -35 + 70 * phase;
    hand.pose(phase);
    const rounded = Math.round(degrees);
    angleReadout.textContent = `${rounded > 0 ? '+' : rounded < 0 ? '−' : ''}${Math.abs(rounded)}°`;
    progress.value = String(Math.round(phase * 100));
    progress.setAttribute('aria-valuetext', `${rounded} degrees`);
  }
  function updatePlayButton() {
    playButton.setAttribute('aria-label', playing ? 'Pause animation' : 'Play animation');
    playButton.setAttribute('aria-pressed', String(!playing));
    symbol.textContent = playing ? 'Ⅱ' : '▷';
  }
  playButton.addEventListener('click', () => { playing = !playing; updatePlayButton(); });
  progress.addEventListener('input', () => { playing = false; phase = Number(progress.value) / 100; updatePose(); updatePlayButton(); });
  resetButton.addEventListener('click', () => { phase = 0; direction = 1; camera.position.copy(initialCamera); controls.target.copy(initialTarget); controls.update(); updatePose(); });
  contactButton.addEventListener('click', () => { contacts.visible = !contacts.visible; needsRender = true; contactButton.setAttribute('aria-pressed', String(contacts.visible)); });
  targetButton.addEventListener('click', () => { target.visible = !target.visible; needsRender = true; targetButton.setAttribute('aria-pressed', String(target.visible)); });
  const motionChange = () => { if (reducedMotion.matches) { playing = false; updatePlayButton(); } };
  reducedMotion.addEventListener('change', motionChange);
  const resize = new ResizeObserver(() => {
    const { width, height } = viewport.getBoundingClientRect();
    if (!width || !height) return;
    needsRender = true;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(30) / 2) * Math.max(1, 1.55 / camera.aspect)));
    camera.updateProjectionMatrix();
  });
  resize.observe(viewport);
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
  observer.observe(viewport);
  updatePose();
  updatePlayButton();
  let last = 0;
  renderer.setAnimationLoop((time: number) => {
    const dt = Math.min((time - last) / 1000, .05);
    last = time;
    if (!visible || document.hidden) return;
    if (playing) {
      phase += direction * dt * .11;
      if (phase >= 1) { phase = 1; direction = -1; }
      if (phase <= 0) { phase = 0; direction = 1; }
      updatePose();
    }
    if(cablePhysics.step(dt)) {
      refreshCable();
      if(!cablePhysics.active)cableStatus.textContent=cablePhysics.onFloor?'Cable settled on the floor. Use Reset cable to return it to the table.':'Cable settled on the table.';
    }
    controls.update();
    if (needsRender || playing) { renderer.render(scene, camera); positionHotspots(); needsRender = false; }
  });
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    finishDrag();setCableMode(false);cableControls.hidden=true;
    renderer.setAnimationLoop(null);
    renderer.domElement.style.display = 'none';
    fallback.style.display = 'flex'; fallback.hidden = false; panel.hidden = true;
    element('robot-demo').dataset.sceneState = 'preview';
    const positions = [[36,45],[64,67],[72,29]];
    hotspotElements.forEach((button,i) => { button.style.setProperty('--hotspot-x', `${positions[i][0]}%`); button.style.setProperty('--hotspot-y', `${positions[i][1]}%`); });
    contactButton.hidden = targetButton.hidden = true;
    element('scene-hint').textContent = 'Static preview · Reload to restore 3D';
  });
  // pagehide may enter the back-forward cache, so keep the scene restorable.
  window.addEventListener('pagehide', (event) => {
    if (event.persisted) return;
    renderer.setAnimationLoop(null); resize.disconnect(); observer.disconnect(); controls.dispose();
    reducedMotion.removeEventListener('change', motionChange);
    scene.traverse(obj => {
      if (obj instanceof THREE.Mesh || obj instanceof THREE.Line) {
        obj.geometry.dispose();
        const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
        materials.forEach(material => material.dispose());
      }
    });
    renderer.dispose();
  });
}
