import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

function makeOrbitGeometry(points, timelineIndex) {
  const geometry = new THREE.BufferGeometry();
  const scale = 1 / 1200;
  const positions = [];
  const colors = [];
  points.forEach((point, index) => {
    positions.push(point.x_km * scale, point.z_km * scale, point.y_km * scale);
    const t = index / Math.max(1, points.length - 1);
    const color = new THREE.Color().setHSL(0.58 - t * 0.55, 0.95, index <= timelineIndex ? 0.58 : 0.26);
    colors.push(color.r, color.g, color.b);
  });
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  return geometry;
}

export default function OrbitalScene({ result, timelineIndex }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);

  const orbitGeometry = useMemo(() => {
    if (!result?.orbit_path?.length) return null;
    return makeOrbitGeometry(result.orbit_path, timelineIndex);
  }, [result, timelineIndex]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020711);
    const camera = new THREE.PerspectiveCamera(42, mount.clientWidth / mount.clientHeight, 0.1, 1000);
    camera.position.set(0, 4.2, 9.8);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    mount.appendChild(renderer.domElement);

    const earth = new THREE.Mesh(
      new THREE.SphereGeometry(5.32, 96, 96),
      new THREE.MeshStandardMaterial({
        color: 0x2b6cb0,
        roughness: 0.78,
        metalness: 0.02,
        emissive: 0x061126,
      })
    );
    scene.add(earth);

    const atmosphere = new THREE.Mesh(
      new THREE.SphereGeometry(5.46, 96, 96),
      new THREE.MeshBasicMaterial({ color: 0x56d7ff, transparent: true, opacity: 0.13, side: THREE.BackSide })
    );
    scene.add(atmosphere);

    const grid = new THREE.Mesh(
      new THREE.SphereGeometry(5.34, 32, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: 0.06 })
    );
    scene.add(grid);

    scene.add(new THREE.AmbientLight(0x6688aa, 1.5));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2);
    sun.position.set(6, 4, 8);
    scene.add(sun);

    const satellite = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    scene.add(satellite);

    const corridor = new THREE.Mesh(
      new THREE.ConeGeometry(0.75, 2.8, 36, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xff6b35, transparent: true, opacity: 0.14, side: THREE.DoubleSide })
    );
    corridor.rotation.x = Math.PI / 2;
    corridor.position.set(-2.4, -0.2, 4.4);
    scene.add(corridor);

    const animate = () => {
      earth.rotation.y += 0.0015;
      grid.rotation.y += 0.0015;
      atmosphere.rotation.y += 0.001;
      if (sceneRef.current?.satellitePosition) satellite.position.copy(sceneRef.current.satellitePosition);
      renderer.render(scene, camera);
      sceneRef.current.frame = requestAnimationFrame(animate);
    };

    const resize = () => {
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", resize);
    sceneRef.current = { scene, renderer, orbitLine: null, satellite, satellitePosition: new THREE.Vector3(), frame: 0 };
    animate();
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(sceneRef.current?.frame);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    const refs = sceneRef.current;
    if (!refs || !orbitGeometry) return;
    if (refs.orbitLine) {
      refs.scene.remove(refs.orbitLine);
      refs.orbitLine.geometry.dispose();
      refs.orbitLine.material.dispose();
    }
    refs.orbitLine = new THREE.Line(
      orbitGeometry,
      new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95 })
    );
    refs.scene.add(refs.orbitLine);
    const positions = orbitGeometry.getAttribute("position");
    const safeIndex = Math.min(timelineIndex, positions.count - 1);
    refs.satellitePosition.set(positions.getX(safeIndex), positions.getY(safeIndex), positions.getZ(safeIndex));
  }, [orbitGeometry, timelineIndex]);

  return <div className="scene" ref={mountRef} aria-label="3D orbital decay visualization" />;
}
