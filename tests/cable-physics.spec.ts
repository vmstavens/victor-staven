import { test, expect } from '@playwright/test';
import * as THREE from 'three';
import { CablePhysics } from '../src/scripts/cable-physics';
const create = () => new CablePhysics(new THREE.CatmullRomCurve3([
  new THREE.Vector3(.13,.85,.85),new THREE.Vector3(.5,.85,.48),new THREE.Vector3(.93,.85,.9),new THREE.Vector3(1.45,.85,1.07),new THREE.Vector3(1.9,.85,.61),new THREE.Vector3(2.21,.85,.82),
]));
test('cable stays on the table under gravity', () => {
  const cable=create();cable.release();
  for(let i=0;i<600;i++)cable.step(1/120);
  expect(cable.points.every(point=>point.y>=.839)).toBeTruthy();
  expect(cable.active).toBeFalsy();
});
test('pulling the cable past the table edge makes it fall, without breaking the chain',()=>{
  const cable=create();const rest=cable.points.slice(1).map((point,i)=>point.distanceTo(cable.points[i]));
  cable.grab(cable.points.length-1);
  cable.target.set(4,.95,1.9);
  for(let i=0;i<300;i++)cable.step(1/120);
  cable.release();
  for(let i=0;i<900;i++)cable.step(1/120);
  expect(cable.onFloor).toBeTruthy();
  expect(cable.points.every(point=>Number.isFinite(point.x+point.y+point.z)&&point.y>=-.65001)).toBeTruthy();
  const stretch=Math.max(...cable.points.slice(1).map((point,i)=>point.distanceTo(cable.points[i])/rest[i]));
  expect(stretch).toBeLessThan(1.2);
});
test('reset restores every cable point and clears dragging',()=>{
  const cable=create();const initial=cable.points.map(point=>point.toArray());
  cable.grab(20);cable.target.set(3,2,2);
  for(let i=0;i<180;i++)cable.step(1/120);
  cable.reset();
  expect(cable.points.map(point=>point.toArray())).toEqual(initial);
  expect(cable.previous.map(point=>point.toArray())).toEqual(initial);
  expect(cable.grabbed).toBe(-1);expect(cable.active).toBeFalsy();
});
