import type React from 'react';
import { useEffect, useRef, useState } from 'react';
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
  // Het golfer-model is 30 MB. Zonder deze melding kijkt een leerling op een
  // schoollaptop een halve minuut naar een leeg vlak, op de eerste pagina van
  // de sectie, zonder te weten of er iets gebeurt.
  const [percentage, setPercentage] = useState<number | null>(null);
  const [mislukt, setMislukt] = useState(false);

  useEffect(() => {
    setPercentage(0);
    setMislukt(false);
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
      setPercentage(null);
    };

    // De server stuurt bij een gz-gecodeerd bestand geen betrouwbare totale
    // lengte mee; dan tonen we alleen dat er geladen wordt.
    const volgLaden = (e: ProgressEvent) => {
      setPercentage(e.lengthComputable ? Math.round((e.loaded / e.total) * 100) : 0);
    };
    const meldMislukt = () => {
      setPercentage(null);
      setMislukt(true);
    };

    if (mtl) {
      const mtlLoader = new MTLLoader();
      mtlLoader.load(
        mtl,
        (materials) => {
          materials.preload();
          const objLoader = new OBJLoader();
          objLoader.setMaterials(materials);
          objLoader.load(src, addObjectToScene, volgLaden, meldMislukt);
        },
        undefined,
        meldMislukt,
      );
    } else {
      const objLoader = new OBJLoader();
      objLoader.load(src, addObjectToScene, volgLaden, meldMislukt);
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
    <div style={{ position: 'relative', width }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height,
          border: '1px solid #ddd',
          borderRadius: '8px',
          overflow: 'hidden',
        }}
      />
      {(percentage !== null || mislukt) && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            color: '#555',
            font: '0.95rem/1.4 var(--ifm-font-family-base)',
            textAlign: 'center',
            padding: '1rem',
          }}
        >
          {mislukt
            ? 'Het 3D-model kon niet geladen worden. Ververs de pagina, of ga gewoon verder — je hebt het model niet nodig om te bouwen.'
            : percentage
              ? `Het 3D-model laadt… ${percentage}%`
              : 'Het 3D-model laadt… Dit is een groot bestand, dus het kan even duren.'}
        </div>
      )}
    </div>
  );
}
