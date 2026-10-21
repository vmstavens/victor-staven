import * as THREE from 'three';

/** Lightweight position-based cable dynamics for interaction, not material simulation. */
export class CablePhysics {
  readonly radius = .04;
  readonly points: THREE.Vector3[];
  readonly previous: THREE.Vector3[];
  private readonly initial: THREE.Vector3[];
  private readonly lengths: number[];
  private readonly bends: number[];
  private accumulator = 0;
  private quietTime = 0;
  active = false;
  grabbed = -1;
  readonly target = new THREE.Vector3();

  constructor(curve: THREE.Curve<THREE.Vector3>, count = 36) {
    this.initial = curve.getSpacedPoints(count - 1);
    this.points = this.initial.map(point => point.clone());
    this.previous = this.initial.map(point => point.clone());
    this.lengths = this.points.slice(1).map((point, i) => point.distanceTo(this.points[i]));
    this.bends = this.points.slice(2).map((point, i) => point.distanceTo(this.points[i]));
  }
  grab(index: number, target = this.points[index]) {
    this.grabbed = index; this.target.copy(target); this.active = true; this.quietTime = 0;
  }
  release() { this.grabbed = -1; this.active = true; this.quietTime = 0; }
  reset() {
    this.points.forEach((point, i) => { point.copy(this.initial[i]); this.previous[i].copy(point); });
    this.grabbed = -1; this.active = false; this.accumulator = this.quietTime = 0;
  }
  get onFloor() { return this.points.some(point => point.y < -.5); }
  private collide(point: THREE.Vector3) {
    // Rounded tabletop approximated by an expanded slab. Also covers the thin desk mat.
    const x = 2.8 + this.radius, z = 1.525 + this.radius, top = .80 + this.radius, bottom = .44 - this.radius;
    if (Math.abs(point.x) < x && Math.abs(point.z) < z && point.y < top && point.y > bottom) {
      const distances = [top-point.y, point.y-bottom, x-Math.abs(point.x), z-Math.abs(point.z)];
      const face = distances.indexOf(Math.min(...distances));
      if (face === 0) point.y = top;
      else if (face === 1) point.y = bottom;
      else if (face === 2) point.x = Math.sign(point.x || 1) * x;
      else point.z = Math.sign(point.z || 1) * z;
    }
    point.y = Math.max(-.69 + this.radius, point.y);
  }
  step(dt: number) {
    if (!this.active) return false;
    this.accumulator = Math.min(this.accumulator + dt, .05);
    const h = 1 / 120;
    while (this.accumulator >= h) {
      this.accumulator -= h;
      this.points.forEach((point,i) => {
        if (i === this.grabbed) return;
        const velocity = point.clone().sub(this.previous[i]).multiplyScalar(.987);
        this.previous[i].copy(point);
        point.add(velocity); point.y -= 6.5 * h * h;
        // Catch downward motion through the tabletop before the constraint iterations.
        if (this.previous[i].y >= .84 && point.y < .84 && Math.abs(point.x) < 2.84 && Math.abs(point.z) < 1.565) point.y = .84;
      });
      if (this.grabbed >= 0) {
        // Limit teleportation when the pointer jumps to keep the solver stable.
        const held = this.points[this.grabbed];
        const delta = this.target.clone().sub(held).clampLength(0, .13);
        held.add(delta); this.collide(held); this.previous[this.grabbed].copy(held);
      }
      const constrain = (a:number,b:number,length:number,stiffness:number) => {
        const delta = this.points[b].clone().sub(this.points[a]);
        const distance = delta.length(); if (distance < 1e-8) return;
        const wa = a === this.grabbed ? 0 : 1, wb = b === this.grabbed ? 0 : 1;
        delta.multiplyScalar((distance - length) / distance * stiffness / (wa + wb));
        if (wa) this.points[a].add(delta); if (wb) this.points[b].sub(delta);
      };
      for (let iteration=0; iteration<18; iteration++) {
        for(let i=0;i<this.bends.length;i++) constrain(i,i+2,this.bends[i],.08);
        // Alternate direction to avoid preferentially stretching one end.
        for(let k=0;k<this.lengths.length;k++) {
          const i = iteration % 2 ? this.lengths.length-1-k : k;
          constrain(i,i+1,this.lengths[i],1);
        }
        this.points.forEach(point => this.collide(point));
      }
      let movement = 0;
      this.points.forEach((point,i) => {
        if (point.y <= -.649 || (point.y >= .839 && point.y <= .841 && Math.abs(point.x)<2.84 && Math.abs(point.z)<1.565)) {
          this.previous[i].x += (point.x-this.previous[i].x)*.12;
          this.previous[i].z += (point.z-this.previous[i].z)*.12;
          this.previous[i].y = point.y;
        }
        movement = Math.max(movement,point.distanceToSquared(this.previous[i]));
      });
      this.quietTime = this.grabbed < 0 && movement < 0.0000004 ? this.quietTime+h : 0;
      if(this.quietTime>.65) { this.active=false;this.accumulator=0;break; }
    }
    return true;
  }
}
