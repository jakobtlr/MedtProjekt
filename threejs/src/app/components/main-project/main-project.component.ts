import {AfterViewInit, Component, ElementRef, ViewChild} from '@angular/core';
import * as THREE from 'three';
import {
  BufferGeometry,
  Clock,
  Mesh,
  MeshStandardMaterial,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  SpotLight
} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {OBJLoader} from 'three/examples/jsm/loaders/OBJLoader';
import {MTLLoader} from 'three/examples/jsm/loaders/MTLLoader';

@Component({
  selector: 'app-main-project',
  templateUrl: './main-project.component.html',
  styleUrls: ['./main-project.component.scss'],
})
export class MainProjectComponent implements AfterViewInit {

  @ViewChild('threeCv') canvas!: ElementRef;
  scene!: Scene;
  camera!: PerspectiveCamera;
  renderer!: WebGLRenderer;
  clock: Clock = new Clock();
  controls!: OrbitControls;
  spotLight: SpotLight = new THREE.SpotLight(0xffffff, 5000);
  ghast!: THREE.Object3D;
  ghastOrbitRadius = 30;
  ghastOrbitSpeed = 0.4;
  ghastOrbitAngle = 0;
  portalPosition = new THREE.Vector3(381, 0, 430);
  moon!: Mesh;
  map!: Mesh;

  constructor() {
  }

  ngAfterViewInit(): void {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({canvas: this.canvas.nativeElement});
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;

    this.spotLight.position.set(381, 100, 430);
    this.spotLight.target.position.copy(this.portalPosition);
    this.spotLight.castShadow = true;

    this.scene.add(this.spotLight);
    this.scene.add(this.spotLight.target);

    const loader = new THREE.TextureLoader();
    loader.load('assets/textures/HeightMapPaint.png', (texture) => this.onTextureLoaded(texture));

    this.camera.position.set(380, 400, 430);
    this.camera.lookAt(381, 0, 400);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    this.scene.add(ambientLight);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.25;
    this.controls.screenSpacePanning = true;

    this.loadMoon();
    this.loadGhast();
    this.loadPortal();

    this.renderer.setAnimationLoop(() => this.animate());
  }

  loadMoon(): void {
    const textureLoader = new THREE.TextureLoader();

    const normalMap = textureLoader.load('assets/textures/moonnormal.jpg');
    const moonGeometry = new THREE.SphereGeometry(30, 30, 30);
    const moonMaterial = new THREE.MeshStandardMaterial({
      color: 0xF6F1D5,
      normalMap: normalMap,
    });

    moonMaterial.normalScale.set(3, 3);

    this.moon = new THREE.Mesh(moonGeometry, moonMaterial);
    this.moon.position.set(381, 300, 430);
    this.moon.receiveShadow = true;
    this.moon.castShadow = true;

    this.scene.add(this.moon);
  }


  loadPortal(): void {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('assets/textures/Portal.mtl', (materials) => {
      materials.preload();
      const objLoader = new OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.load('assets/textures/Portal.obj', (object) => {
        object.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((material) => {
                material.side = THREE.DoubleSide;
              });
            } else {
              mesh.material.side = THREE.DoubleSide;
            }
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });
        object.position.copy(this.portalPosition);
        this.scene.add(object);
      });
    });
  }

  loadGhast(): void {
    const mtlLoader = new MTLLoader();
    mtlLoader.load('assets/textures/ghasts.mtl', (materials) => {
      materials.preload();
      const objLoader = new OBJLoader();
      objLoader.setMaterials(materials);
      objLoader.load('assets/textures/ghasts.obj', (object) => {
        object.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            if (Array.isArray(mesh.material)) {
              mesh.material.forEach((material) => {
                material.side = THREE.DoubleSide;
              });
            } else {
              mesh.material.side = THREE.DoubleSide;
            }
            mesh.castShadow = true;
            mesh.receiveShadow = true;
          }
        });
        object.scale.set(10, 10, 10);
        object.position.set(381, 100, 430)
        this.ghast = object;
        this.scene.add(object);
      });
    });
  }

  animate(): void {
    if (this.ghast) {
      this.ghastOrbitAngle += this.ghastOrbitSpeed * this.clock.getDelta();
      const x = this.portalPosition.x + this.ghastOrbitRadius * Math.cos(this.ghastOrbitAngle);
      const z = this.portalPosition.z + this.ghastOrbitRadius * Math.sin(this.ghastOrbitAngle);
      this.ghast.position.set(x, this.ghast.position.y, z);
    }
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  private onTextureLoaded(texture: THREE.Texture): void {
    const canvas = document.createElement('canvas');
    canvas.width = texture.image.width;
    canvas.height = texture.image.height;

    const context = canvas.getContext('2d') as CanvasRenderingContext2D;
    context.drawImage(texture.image, 0, 0);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    this.generateTerrain(imageData);
  }

  private generateTerrain(imageData: ImageData): void {
    const indices: number[] = [];
    const vertices: number[] = [];
    const colors: number[] = [];
    const imageWidth = imageData.width;
    const imageHeight = imageData.height;
    const scale = 0.60;
    const maxHeight = 255 * scale;

    const textureLoader = new THREE.TextureLoader();

    const terrainTexture = textureLoader.load('assets/textures/normal.jpg', (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(imageWidth / 10, imageHeight / 10);

      for (let z = 0; z < imageData.height; z++) {
        for (let x = 0; x < imageData.width; x++) {
          let pixelIndex = z * imageWidth + x;
          let y = imageData.data[pixelIndex * 4] * scale;

          vertices.push(x, y, z);

          const heightPercentage = y / maxHeight;

          if (heightPercentage <= 0.5) {
            colors.push(1, 0, 0, 1);
          } else if (heightPercentage <= 0.8) {
            colors.push(0.47, 0.03, 0.04, 1);
          } else {
            colors.push(0.5, 0.5, 0.5, 1);
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

      const material: MeshStandardMaterial = new THREE.MeshStandardMaterial({
        vertexColors: true,
        normalMap: terrainTexture,
        normalScale: new THREE.Vector2(1, 1),
      });

      this.map = new THREE.Mesh(geometry, material);
      this.map.receiveShadow = true;
      this.scene.add(this.map);
    });
  }
}
