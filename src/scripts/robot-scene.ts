import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

/** Two-finger kinematic illustration. No experimental data or force simulation. */
export function initRobotScene() {
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
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  viewport.appendChild(renderer.domElement);
  fallback.hidden = true;
  fallback.style.display = 'none';
  panel.hidden = options.hidden = false;

  const scene = new THREE.Scene();
  const v = (x: number, y: number, z = 0) => new THREE.Vector3(x, y, z);
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 50);
  const initialCamera = v(3.1, 2.85, 7.7);
  const initialTarget = v(0, 1.05, 0);
  camera.position.copy(initialCamera);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(initialTarget);
  controls.enableDamping = true;
  controls.enablePan = false;
  controls.minDistance = 5;
  controls.maxDistance = 12;
  controls.maxPolarAngle = Math.PI / 2;
  scene.add(new THREE.HemisphereLight(0xe7fff5, 0x163d37, 2.8));
  const key = new THREE.DirectionalLight(0xffe6cd, 4);
  key.position.set(-3, 6, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  Object.assign(key.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4 });
  key.shadow.normalBias = .025;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x6de8c6, 3);
  rim.position.set(3, 3, -4);
  scene.add(rim);

  const metal = new THREE.MeshStandardMaterial({ color: 0xaac4b9, metalness: .65, roughness: .32 });
  const joints = new THREE.MeshStandardMaterial({ color: 0x2c5550, metalness: .6, roughness: .32 });
  const pad = new THREE.MeshStandardMaterial({ color: 0x122f2c, roughness: .85 });
  const copper = new THREE.MeshStandardMaterial({ color: 0xd58c55, metalness: .28, roughness: .35 });
  const mint = new THREE.MeshBasicMaterial({ color: 0x8fe0c3 });
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
  function hinge(position: THREE.Vector3) {
    const group = new THREE.Group();
    group.position.copy(position);
    scene.add(group);
    for (const [radius, depth, material] of [[.155, .34, joints], [.092, .365, metal]] as const) {
      const part = mesh(new THREE.CylinderGeometry(radius, radius, depth, 32), material, v(0, 0), group);
      part.rotation.x = Math.PI / 2;
    }
    return group;
  }
  // A compact hand base; the two active fingers are deliberately exposed.
  mesh(new THREE.BoxGeometry(3.25, .24, .85), joints, v(0, .04));
  mesh(new THREE.BoxGeometry(2.8, .07, .66), metal, v(0, .195));
  for (const x of [-1.25, 1.25]) {
    for (const z of [-.24, .24]) mesh(new THREE.CylinderGeometry(.036, .036, .02, 16), pad, v(x, .24, z));
  }
  const floor = mesh(new THREE.CylinderGeometry(2.45, 2.45, .08, 80), new THREE.MeshStandardMaterial({ color: 0x163c35, roughness: .9 }), v(0, -.14));
  floor.receiveShadow = true;
  const grid = new THREE.GridHelper(4.5, 18, 0x468275, 0x2e5e53);
  grid.position.y = -.092;
  const gridMaterial = grid.material as THREE.Material;
  gridMaterial.transparent = true;
  gridMaterial.opacity = .33;
  scene.add(grid);

  const radius = .53;
  const object = new THREE.Group();
  scene.add(object);
  const cylinderGeometry = new THREE.CylinderGeometry(radius, radius, .69, 64);
  cylinderGeometry.rotateX(Math.PI / 2);
  mesh(cylinderGeometry, copper, v(0, 0), object);
  // A stripe and a radial index make rotation visible on a symmetric cylinder.
  beam(v(0, 0, .355), v(0, .43, .355), .033, pad, object);
  mesh(new THREE.SphereGeometry(.062, 20, 12), mint, v(0, .44, .357), object);
  const axle = mesh(new THREE.CylinderGeometry(.085, .085, .72, 24), joints, v(0, 0), object);
  axle.rotation.x = Math.PI / 2;
  const stripe = mesh(new THREE.BoxGeometry(.07, .015, .66), pad, v(0, radius + .002), object);
  stripe.castShadow = false;

  const target = new THREE.Group();
  scene.add(target);
  const targetMaterial = new THREE.LineDashedMaterial({ color: 0x8fe0c3, dashSize: .065, gapSize: .045, transparent: true, opacity: .85 });
  const targetLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([v(0, 0, .39), v(-Math.sin(35 * Math.PI / 180) * .81, Math.cos(35 * Math.PI / 180) * .81, .39)]), targetMaterial);
  targetLine.computeLineDistances();
  target.add(targetLine);
  const arcPoints = Array.from({ length: 51 }, (_, i) => {
    const angle = (-35 + i * 1.4) * Math.PI / 180;
    return v(-Math.sin(angle) * .76, Math.cos(angle) * .76, .39);
  });
  const arc = new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPoints), targetMaterial);
  arc.computeLineDistances();
  target.add(arc);
  const targetDot = mesh(new THREE.SphereGeometry(.04, 16, 12), mint, arcPoints[50], target);
  targetDot.castShadow = false;

  const contacts = new THREE.Group();
  scene.add(contacts);
  const fingers = [-1, 1].map(side => {
    const root = v(side * 1.29, .27);
    const joint = hinge(root);
    const elbow = hinge(root);
    const proximal = beam(root, root.clone().add(v(0, 1)), .11);
    const distal = beam(root, root.clone().add(v(0, 1)), .09);
    const tip = mesh(new THREE.SphereGeometry(.105, 24, 16), pad, root);
    const contact = mesh(new THREE.SphereGeometry(.046, 20, 12), mint, root, contacts);
    const normal = new THREE.ArrowHelper(v(-side, 0), root, .36, 0x8fe0c3, .10, .07);
    contacts.add(normal);
    return { side, root, joint, elbow, proximal, distal, tip, contact, normal };
  });

  let phase = 0;
  let direction = 1;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let playing = !reducedMotion.matches;
  let visible = true;
  function updatePose() {
    const degrees = -35 + 70 * phase;
    const angle = degrees * Math.PI / 180;
    // Smooth object travel and planar two-link inverse kinematics.
    const center = v(.20 * Math.sin(angle), 1.68 + .08 * Math.cos(angle));
    object.position.copy(center);
    object.rotation.z = angle;
    target.position.copy(center);
    for (const finger of fingers) {
      const normalAngle = finger.side === -1 ? Math.PI + angle * .25 : angle * .25;
      const outward = v(Math.cos(normalAngle), Math.sin(normalAngle));
      const contact = center.clone().addScaledVector(outward, radius);
      const tip = center.clone().addScaledVector(outward, radius + .10);
      const delta = tip.clone().sub(finger.root);
      const distance = delta.length();
      const length = 1.02;
      const midpoint = finger.root.clone().add(tip).multiplyScalar(.5);
      const perpendicular = v(-delta.y, delta.x).normalize().multiplyScalar(-finger.side);
      const elbow = midpoint.addScaledVector(perpendicular, Math.sqrt(Math.max(0, length * length - distance * distance / 4)));
      finger.elbow.position.copy(elbow);
      poseBeam(finger.proximal, finger.root, elbow);
      poseBeam(finger.distal, elbow, tip);
      finger.tip.position.copy(tip);
      finger.contact.position.copy(contact).add(v(0, 0, .12));
      finger.normal.position.copy(contact).addScaledVector(outward, .49).add(v(0, 0, .12));
      finger.normal.setDirection(outward.negate());
    }
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
  contactButton.addEventListener('click', () => { contacts.visible = !contacts.visible; contactButton.setAttribute('aria-pressed', String(contacts.visible)); });
  targetButton.addEventListener('click', () => { target.visible = !target.visible; targetButton.setAttribute('aria-pressed', String(target.visible)); });
  const motionChange = () => { if (reducedMotion.matches) { playing = false; updatePlayButton(); } };
  reducedMotion.addEventListener('change', motionChange);
  const resize = new ResizeObserver(() => {
    const { width, height } = viewport.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height);
    camera.aspect = width / height;
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
    controls.update();
    renderer.render(scene, camera);
  });
  renderer.domElement.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    renderer.setAnimationLoop(null);
    renderer.domElement.style.display = 'none';
    fallback.style.display = 'grid'; fallback.hidden = false; panel.hidden = true;
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
