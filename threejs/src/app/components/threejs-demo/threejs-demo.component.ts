import {AfterViewInit, Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {BoxGeometry, Clock, Mesh, MeshBasicMaterial, PerspectiveCamera, Scene, WebGLRenderer} from 'three';
import * as THREE from 'three';

@Component({
  selector: 'app-threejs-demo',
  templateUrl: './threejs-demo.component.html',
  styleUrls: ['./threejs-demo.component.scss'],
})
export class ThreejsDemoComponent implements OnInit, AfterViewInit {

  @ViewChild("threejs")
  canvas!: ElementRef;
  scene!: Scene;
  camera!: PerspectiveCamera;
  renderer!: WebGLRenderer;
  cube!: Mesh<BoxGeometry, MeshBasicMaterial>;
  clock = new Clock();

  constructor() {
  }

  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  ngAfterViewInit(): void {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({canvas: this.canvas.nativeElement});
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    const geometry = new BoxGeometry(1, 1, 1);
    const material = new MeshBasicMaterial({color: 0x00ff00});
    this.cube = new Mesh(geometry, material);
    this.scene.add(this.cube);
    this.camera.position.z = 5;
    this.renderer.setAnimationLoop(() => this.animate());
  }
  animate() {
    const elapsed = this.clock.getDelta();
    this.cube.rotation.x += 0.03;
    this.cube.rotation.y += 0.03;
    this.renderer.render(this.scene, this.camera)
  }
}
