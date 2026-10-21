import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/** Menagerie visual geometry and joint limits, with an illustrative pinch animation. */
export async function loadShadowHand() {
  const base = import.meta.env.BASE_URL.replace(/\/?$/, '/');
  const { scene: model } = await new GLTFLoader().loadAsync(`${base}models/shadow-hand/shadow-hand.glb`);
  const group = new THREE.Group();
  group.name = 'shadow-hand';
  group.add(model);
  const joints = new Map<string, { node: THREE.Object3D; rest: THREE.Quaternion; axis: THREE.Vector3; range: number[]; value: number }>();
  model.traverse(node => {
    if (node instanceof THREE.Mesh) { node.castShadow = node.receiveShadow = true; }
    if (node.userData.joint) joints.set(node.userData.joint, { node, rest: node.quaternion.clone(), axis: new THREE.Vector3(...node.userData.axis as [number, number, number]), range: node.userData.range, value: 0 });
  });
  function set(name: string, angle: number) {
    const joint = joints.get(name)!;
    joint.value = THREE.MathUtils.clamp(angle, joint.range[0], joint.range[1]);
    joint.node.quaternion.copy(joint.rest).multiply(new THREE.Quaternion().setFromAxisAngle(joint.axis, joint.value));
  }
  const index = new THREE.Object3D(); index.position.set(0, -.006, .025);
  model.getObjectByName('rh_ffdistal')!.add(index);
  const thumb = new THREE.Object3D(); thumb.position.set(0, -.006, .027);
  model.getObjectByName('rh_thdistal')!.add(thumb);
  const center = new THREE.Vector3(.035, -.05, .12);
  const radius = .018;
  const object = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, .028, 40), new THREE.MeshStandardMaterial({ color: 0xff6b2b, roughness: .48, metalness: .18 }));
  object.position.copy(center); model.add(object);
  object.castShadow = true;
  const indicator = new THREE.Mesh(new THREE.BoxGeometry(.0025, .002, radius * .85), new THREE.MeshStandardMaterial({ color: 0x24282e }));
  indicator.position.set(0, -.015, radius * .4); object.add(indicator);
  const contacts = new THREE.Group(); model.add(contacts);
  const markers = [index, thumb].map(() => {
    const marker = new THREE.Mesh(new THREE.SphereGeometry(.002, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffa477 }));
    contacts.add(marker); return marker;
  });
  const target = new THREE.Group(); target.position.copy(center); model.add(target);
  const arc = new THREE.Line(new THREE.BufferGeometry().setFromPoints(Array.from({length: 36}, (_, i) => {
    const a = THREE.MathUtils.degToRad(-35 + i * 2); return new THREE.Vector3(Math.sin(a) * .026, -.019, Math.cos(a) * .026);
  })), new THREE.LineDashedMaterial({ color: 0xff8045, dashSize: .003, gapSize: .002 }));
  arc.computeLineDistances();target.add(arc);
  const targetDot = new THREE.Mesh(new THREE.SphereGeometry(.002, 12, 8), new THREE.MeshBasicMaterial({color:0xff8045}));
  targetDot.position.set(Math.sin(35*Math.PI/180)*.026,-.019,Math.cos(35*Math.PI/180)*.026);target.add(targetDot);
  const indexChain = ['rh_FFJ4','rh_FFJ3','rh_FFJ2','rh_FFJ1'];
  const thumbChain = ['rh_THJ5','rh_THJ4','rh_THJ3','rh_THJ2','rh_THJ1'];
  const position = (tip: THREE.Object3D) => { model.updateWorldMatrix(true, true); return model.worldToLocal(tip.getWorldPosition(new THREE.Vector3())); };
  // Small damped coordinate-descent IK, constrained to the model's real joint ranges.
  function solve(chain: string[], tip: THREE.Object3D, destination: THREE.Vector3) {
    for (let iteration = 0; iteration < 14; iteration++) {
      for (const name of [...chain].reverse()) {
        const joint = joints.get(name)!;
        const original = joint.value;
        const current = position(tip);
        const epsilon = original + .002 <= joint.range[1] ? .002 : -.002;
        set(name, original + epsilon);
        const derivative = position(tip).sub(current).divideScalar(epsilon);
        const step = destination.clone().sub(current).dot(derivative) / (derivative.lengthSq() + .00001);
        set(name, original + THREE.MathUtils.clamp(step, -.16, .16));
      }
    }
  }
  function pose(phase: number) {
    const angle = THREE.MathUtils.degToRad(-35 + 70 * phase);
    object.rotation.y = angle;
    // Reset seeds so scrubbing is deterministic and independent of playback history.
    [['rh_FFJ4',.08],['rh_FFJ3',.5],['rh_FFJ2',.65],['rh_FFJ1',.4],['rh_THJ5',.5],['rh_THJ4',.6],['rh_THJ3',0],['rh_THJ2',.2],['rh_THJ1',.3]].forEach(([name,value]) => set(name as string,value as number));
    for (const [finger,bend] of [['MF',.2],['RF',.3],['LF',.4]] as const) {
      set(`rh_${finger}J3`,bend);set(`rh_${finger}J2`,bend*.8);set(`rh_${finger}J1`,bend*.5);
    }
    const contactAngle = angle * .4;
    const offset = new THREE.Vector3(Math.sin(contactAngle)*radius, -.002, Math.cos(contactAngle)*radius);
    solve(indexChain,index,center.clone().add(offset));
    solve(thumbChain,thumb,center.clone().sub(offset));
    markers[0].position.copy(position(index)); markers[1].position.copy(position(thumb));
  }
  pose(0);
  return { group, pose, contacts, target };
}
