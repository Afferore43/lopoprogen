import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r115/build/three.module.js';

import { NoiseField } from 'https://afferore43.github.io/noisefield/noisefield.js';

import { ModifiedIcosahedron, ModifiedPlane, ModifiedPyramid, ModifiedCylinder, ModifiedTriangle, ModifiedBox } from './src/lowpoly.js'
import { ColorGradient } from './src/colorgradient.js'
import { Helper } from './src/lphelper.js'

var renderer, scene, light, camera;

function setupScene() {
  renderer = new THREE.WebGLRenderer({antialising: true});
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  document.body.appendChild(renderer.domElement);
  window.addEventListener('resize', onResize, false);
  renderer.setClearColor( 0x330044, 1 );
  scene = new THREE.Scene();

  light = new THREE.DirectionalLight(0xffffff, 0.8);
  light.position.set(0, 1, .6);
  scene.add(light);
  
  light = new THREE.DirectionalLight(0xffffff, 0.5);
  light.position.set(0, 0.5, .8);
  scene.add(light);
  
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.001, 1000);
  
  let gradient = new ColorGradient([{stop: 0, color: Helper.color("red")}, {stop: 1, color: Helper.color("blue")}]);
  let sphere = new ModifiedIcosahedron({subdivisions: 3, normalizeVertices: true});
  let noise = new NoiseField({minHeight: 1, maxHeight: 1.3});
  sphere.setVertexHeightAndFaceColorFromNoiseGradient(noise, gradient);
  
  let geo = sphere.createGeometry();
  let mesh = Helper.meshWithStandardMat(geo);
  mesh.position.z = -10;
  mesh.position.x = -2;
  mesh.position.y = 3;
  mesh.onBeforeRender = () => mesh.rotation.y += 0.01;
  scene.add(mesh);
  
  let box = new ModifiedBox({subdivisions: 3});
  box.setVertexHeightAndFaceColorFromNoiseGradient(noise, gradient);
  
  geo = box.createGeometry();
  let boxMesh = Helper.meshWithStandardMat(geo);
  boxMesh.position.z = -10;
  boxMesh.position.x = 2;
  boxMesh.position.y = 3;
  boxMesh.onBeforeRender = () => boxMesh.rotation.y += 0.01;
  scene.add(boxMesh);
  
  let plane = new ModifiedPlane({subdivisions: 3});
  plane.setVertexHeightAndFaceColorFromNoiseGradient(noise, gradient);
  
  geo = plane.createGeometry();
  let planeMesh = Helper.meshWithStandardMat(geo);
  planeMesh.position.z = -10;
  planeMesh.position.y = -4;
  planeMesh.position.x = 2;
  planeMesh.onBeforeRender = () => planeMesh.rotation.y += 0.01;
  scene.add(planeMesh);
  
  let triangle = new ModifiedTriangle({subdivisions: 3});
  triangle.setVertexHeightAndFaceColorFromNoiseGradient(noise, gradient);
  
  geo = triangle.createGeometry();
  let triangleMesh = Helper.meshWithStandardMat(geo);
  triangleMesh.position.z = -10;
  triangleMesh.position.y = -4;
  triangleMesh.position.x = -2;
  triangleMesh.onBeforeRender = () => triangleMesh.rotation.y += 0.01;
  scene.add(triangleMesh);
  
  let pyramid = new ModifiedPyramid({subdivisions: 3});
  pyramid.setVertexHeightAndFaceColorFromNoiseGradient(noise, gradient);
  
  geo = pyramid.createGeometry();
  let pyramidMesh = Helper.meshWithStandardMat(geo);
  pyramidMesh.position.z = -10;
  pyramidMesh.position.y = 0;
  pyramidMesh.position.x = -2;
  pyramidMesh.onBeforeRender = () => pyramidMesh.rotation.y += 0.01;
  scene.add(pyramidMesh);
  
  let cylinder = new ModifiedCylinder({subdivisions: 3});
  cylinder.setVertexHeightAndFaceColorFromNoiseGradient(noise, gradient);
  
  geo = cylinder.createGeometry();
  let cylinderMesh = Helper.meshWithStandardMat(geo);
  cylinderMesh.position.z = -10;
  cylinderMesh.position.y = 0;
  cylinderMesh.position.x = 2;
  cylinderMesh.onBeforeRender = () => cylinderMesh.rotation.y += 0.01;
  scene.add(cylinderMesh);
}

function animate(now) {
  requestAnimationFrame(animate);

  renderer.render(scene, camera);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}


setupScene();
animate();