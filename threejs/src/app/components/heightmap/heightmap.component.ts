import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import * as THREE from 'three';
import {
  BufferGeometry,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  Texture,
  WebGLRenderer,
  AmbientLight,
  DirectionalLight,
  BoxGeometry
} from 'three';

@Component({
  selector: 'app-heightmap',
  templateUrl: './heightmap.component.html',
  styleUrls: ['./heightmap.component.scss'],
})
export class HeightmapComponent implements AfterViewInit {

  @ViewChild('threeCv')
  private canvasRef!: ElementRef;
  private scene!: Scene;
  private camera!: PerspectiveCamera;
  private renderer!: WebGLRenderer;
  private map!: Mesh;
  private cube!: Mesh;
  private ambientLight = new AmbientLight(0xFFFFFF);
  private directionalLight!: DirectionalLight;
  private clock = new THREE.Clock();
  private controls!: OrbitControls;

  constructor() {
  }

  ngAfterViewInit(): void {
    this.createScene();
    requestAnimationFrame((delay) => this.render(delay));
  }

  private createScene() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({canvas: this.canvasRef.nativeElement});
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    // Terrain laden
    const loader = new THREE.TextureLoader();
    loader.load('assets/textures/Heightmap.png', (texture) => this.onTextureLoaded(texture));
    const normalMap = loader.load('assets/textures/normal.jpg');
    const cubeMaterial = new THREE.MeshStandardMaterial({ color: 0xfff0ff, normalMap: normalMap });


    // Würfel hinzufügen
    const cubeGeometry = new THREE.BoxGeometry(15, 15, 15);
    this.cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    this.cube.position.set(128, 80, 128);
    this.cube.castShadow = true;
    this.scene.add(this.cube);

    // Lichtquelle direkt über dem Würfel
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 5);
    this.directionalLight.position.set(128, 130, 128); // Direkt über dem Würfel
    this.directionalLight.target.position.set(128, 0, 128); // Richtung nach unten
    this.directionalLight.castShadow = true;
    this.ambientLight.castShadow = true;

    this.scene.add(this.directionalLight);
    this.scene.add(this.directionalLight.target);
    this.scene.add(this.ambientLight);

    // controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;  // Enables smooth dragging
    this.controls.dampingFactor = 0.25;
    this.controls.screenSpacePanning = true;

    // Kamera setzen
    this.camera.position.set(30, 50, 50); // Kamera über dem Terrain
    this.camera.lookAt(0, 0, 0);
  }

  private render(delay: DOMHighResTimeStamp) {
    const elapsed = this.clock.getDelta();
    this.cube.rotation.x += 1 * elapsed; // Rotation des Würfels
    this.cube.rotation.y += 1 * elapsed;

    this.controls.update();

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame((delay) => this.render(delay));
  }

  private generateTerrain(imageData: ImageData) {
    const indices: number[] = [];
    const vertices: number[] = [];
    const colors: number[] = [];
    const imageWidth = imageData.width;
    const imageHeight = imageData.height;
    const scale = 0.10;
    const maxHeight = 255 * scale;

    for (let z = 0; z < imageData.height; z++) {
      for (let x = 0; x < imageData.width; x++) {
        let pixelIndex = z * imageWidth + x;
        let y = imageData.data[pixelIndex * 4] * scale;

        vertices.push(x, y, z);

        const heightPercentage = y / maxHeight;
        if (heightPercentage <= 0.5) {
          colors.push(0, 1, 0, 1);
        } else if (heightPercentage <= 0.8) {
          colors.push(0.55, 0.27, 0.07, 1);
        } else {
          colors.push(1, 1, 1, 1);
        }

        if (z < imageHeight - 1 && x < imageWidth - 1) {
          let topLeft = pixelIndex;
          let topRight = topLeft + 1;
          let bottomLeft = (z + 1) * imageWidth + x;
          let bottomRight = bottomLeft + 1;
          indices.push(topLeft, bottomLeft, topRight);
          indices.push(topRight, bottomLeft, bottomRight);
        }
      }
    }

    const geometry: BufferGeometry = new THREE.BufferGeometry();
    geometry.setIndex(indices);
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(vertices), 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 4));
    geometry.computeVertexNormals();

    const material: MeshStandardMaterial = new THREE.MeshStandardMaterial();
    material.vertexColors = true;

    this.map = new THREE.Mesh(geometry, material);
    this.map.receiveShadow = true;
    this.scene.add(this.map);
  }

  private onTextureLoaded(texture: Texture) {
    const canvas = document.createElement('canvas');
    canvas.width = texture.image.width;
    canvas.height = texture.image.height;

    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    context.drawImage(texture.image, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    this.generateTerrain(imageData);
  }
}
