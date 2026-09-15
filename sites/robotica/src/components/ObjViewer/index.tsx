import clsx from 'clsx';
import type React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import styles from './styles.module.css';

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
  const wrapRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Het golfer-model is 30 MB. Zonder deze melding kijkt een leerling op een
  // schoollaptop een halve minuut naar een leeg vlak, op de eerste pagina van
  // de sectie, zonder te weten of er iets gebeurt.
  const [percentage, setPercentage] = useState<number | null>(null);
  const [mislukt, setMislukt] = useState(false);
  // Volledig scherm: via de Fullscreen API als de browser die op een <div>
  // heeft, anders (iOS Safari) als vaste laag over de pagina. `vast` zegt
  // welke van de twee actief is, zodat sluiten de juiste weg terug neemt.
  const [volledig, setVolledig] = useState(false);
  const [vast, setVast] = useState(false);

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

    // Op de maat van de container zelf, niet van het venster: bij volledig
    // scherm verandert de container terwijl het venster hetzelfde blijft.
    const handleResize = () => {
      if (container.clientWidth === 0 || container.clientHeight === 0) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    const observer =
      typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(handleResize);
    observer?.observe(container);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      observer?.disconnect();
      controls.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [src, mtl]);

  // De Fullscreen API meldt zelf wanneer het scherm weer normaal is (Esc, of
  // de knop van de browser); de vaste laag heeft daar een eigen Esc voor.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const bijWissel = () => setVolledig(document.fullscreenElement === wrap);
    document.addEventListener('fullscreenchange', bijWissel);
    return () => document.removeEventListener('fullscreenchange', bijWissel);
  }, []);

  useEffect(() => {
    if (!vast) return;
    const bijToets = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVast(false);
    };
    document.addEventListener('keydown', bijToets);
    // Geen scrollende pagina achter de vaste laag.
    const vorige = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', bijToets);
      document.body.style.overflow = vorige;
    };
  }, [vast]);

  const wisselVolledig = useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    if (vast) {
      setVast(false);
      return;
    }
    if (document.fullscreenElement === wrap) {
      void document.exitFullscreen();
      return;
    }
    if (typeof wrap.requestFullscreen === 'function') {
      wrap.requestFullscreen().catch(() => setVast(true));
    } else {
      setVast(true);
    }
  }, [vast]);

  const schermVol = volledig || vast;

  return (
    <div
      ref={wrapRef}
      className={clsx(styles.wrap, vast && styles.wrapVast)}
      style={schermVol ? undefined : { width }}
    >
      <div
        ref={containerRef}
        className={clsx(styles.canvas, schermVol && styles.canvasVolledig)}
        style={schermVol ? undefined : { height }}
      />
      {(percentage !== null || mislukt) && (
        <div className={styles.melding}>
          {mislukt
            ? 'Het 3D-model kon niet geladen worden. Ververs de pagina, of ga verder — je hebt het model niet nodig om te bouwen.'
            : percentage
              ? `Het 3D-model laadt… ${percentage}%`
              : 'Het 3D-model laadt… Dit is een groot bestand, dus het kan even duren.'}
        </div>
      )}
      <button
        type="button"
        className={styles.knop}
        onClick={wisselVolledig}
        title={schermVol ? 'Terug naar de pagina (Esc)' : 'Het model op het hele scherm'}
      >
        {schermVol ? 'Sluiten' : 'Volledig scherm'}
      </button>
    </div>
  );
}
