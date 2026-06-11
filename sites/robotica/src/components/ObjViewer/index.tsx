import type React from 'react';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

interface ObjViewerProps {
  src: string;
  mtl?: string;
  width?: string;
  height?: string;
}

export default function ObjViewer({
  src,
  mtl,
  width = '100%',
  height = '500px',
}: ObjViewerProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f5);

    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      1000,
    );
    camera.position.set(0, 100, 200);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(50, 100, 50);
    scene.add(directionalLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.6);
    fillLight.position.set(-50, 50, -50);
    scene.add(fillLight);

    const bottomLight = new THREE.DirectionalLight(0xffffff, 0.4);
    bottomLight.position.set(0, -100, 0);
    scene.add(bottomLight);

    const addObjectToScene = (obj: THREE.Group) => {
      const box = new THREE.Box3().setFromObject(obj);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      obj.position.sub(center);

      const maxDim = Math.max(size.x, size.y, size.z);
      camera.position.set(0, maxDim * 0.5, maxDim * 1.5);
      controls.target.set(0, 0, 0);
      controls.update();

      scene.add(obj);
    };

    if (mtl) {
      const mtlLoader = new MTLLoader();
      mtlLoader.load(mtl, (materials) => {
        materials.preload();
        const objLoader = new OBJLoader();
        objLoader.setMaterials(materials);
        objLoader.load(src, addObjectToScene);
      });
    } else {
      const objLoader = new OBJLoader();
      objLoader.load(src, addObjectToScene);
    }

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [src, mtl]);

  return (
    <div
      ref={containerRef}
      style={{
        width,
        height,
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    />
  );
}
