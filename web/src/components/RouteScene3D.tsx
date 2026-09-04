import { useEffect, useRef } from "react";
import {
  AmbientLight,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  EdgesGeometry,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  PointLight,
  Points,
  PointsMaterial,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  Timer,
  TorusGeometry,
  TorusKnotGeometry,
  Vector2,
  WebGLRenderer
} from "three";

export type RouteSceneVariant = "features" | "about";

const scenePalettes: Record<RouteSceneVariant, [string, string, string]> = {
  features: ["#59b7ff", "#32dfc3", "#ffca58"],
  about: ["#58c7ff", "#53dfc0", "#d7a7ff"]
};

function createCoreGeometry(variant: RouteSceneVariant) {
  switch (variant) {
    case "features":
      return new TorusKnotGeometry(1.25, 0.35, 150, 22, 2, 3);
    case "about":
      return new SphereGeometry(1.5, 42, 42);
  }
}

export function RouteScene3D({ variant }: { variant: RouteSceneVariant }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const palette = scenePalettes[variant];
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new WebGLRenderer({ alpha: true, antialias: true, canvas, powerPreference: "high-performance" });
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = SRGBColorSpace;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

    const scene = new Scene();
    const camera = new PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 0, 9.5);

    const stage = new Group();
    scene.add(stage);

    const coreMaterial = new MeshPhysicalMaterial({
      color: palette[0],
      emissive: new Color(palette[0]).multiplyScalar(0.16),
      metalness: 0.62,
      opacity: 0.9,
      roughness: 0.2,
      transparent: true
    });
    const coreGeometry = createCoreGeometry(variant);
    const core = new Mesh(coreGeometry, coreMaterial);
    stage.add(core);

    const wireframe = new LineSegments(
      new EdgesGeometry(coreGeometry, 18),
      new LineBasicMaterial({ color: palette[1], opacity: 0.62, transparent: true })
    );
    wireframe.scale.setScalar(1.04);
    stage.add(wireframe);

    const orbit = new Group();
    stage.add(orbit);

    const tileGeometry = new BoxGeometry(0.48, 0.48, 0.16);
    const tileCount = window.innerWidth < 720 ? 7 : 11;
    for (let index = 0; index < tileCount; index += 1) {
      const angle = (index / tileCount) * Math.PI * 2;
      const radius = 2.45 + (index % 2) * 0.38;
      const tile = new Mesh(
        tileGeometry,
        new MeshStandardMaterial({
          color: index % 3 === 0 ? palette[2] : index % 2 === 0 ? palette[1] : palette[0],
          emissive: index % 2 === 0 ? palette[1] : palette[0],
          emissiveIntensity: 0.11,
          metalness: 0.48,
          roughness: 0.32
        })
      );
      tile.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius * 0.62, Math.sin(angle * 2) * 0.85);
      tile.rotation.set(angle * 0.7, angle, angle * 0.35);
      orbit.add(tile);
    }

    const ringMaterial = new MeshBasicMaterial({ color: palette[1], opacity: 0.23, transparent: true });
    const outerRing = new Mesh(new TorusGeometry(2.95, 0.018, 8, 160), ringMaterial);
    outerRing.rotation.x = Math.PI * 0.64;
    outerRing.rotation.y = Math.PI * 0.12;
    stage.add(outerRing);

    const innerRing = new Mesh(
      new TorusGeometry(2.25, 0.014, 8, 150),
      new MeshBasicMaterial({ color: palette[2], opacity: 0.2, transparent: true })
    );
    innerRing.rotation.set(Math.PI * 0.4, Math.PI * 0.36, 0);
    stage.add(innerRing);

    const particleCount = window.innerWidth < 720 ? 120 : 260;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let index = 0; index < particleCount; index += 1) {
      const offset = index * 3;
      particlePositions[offset] = (Math.random() - 0.5) * 11;
      particlePositions[offset + 1] = (Math.random() - 0.5) * 7;
      particlePositions[offset + 2] = (Math.random() - 0.5) * 5;
    }
    const particleGeometry = new BufferGeometry();
    particleGeometry.setAttribute("position", new BufferAttribute(particlePositions, 3));
    const particles = new Points(
      particleGeometry,
      new PointsMaterial({ color: palette[0], opacity: 0.48, size: 0.035, transparent: true })
    );
    scene.add(particles);

    scene.add(new AmbientLight(0xbfdcff, 1.1));
    const keyLight = new PointLight(palette[0], 24, 18);
    keyLight.position.set(3.5, 3.5, 5);
    scene.add(keyLight);
    const rimLight = new PointLight(palette[1], 18, 16);
    rimLight.position.set(-4, -2, 3);
    scene.add(rimLight);

    const pointer = new Vector2(0, 0);
    let frameId = 0;
    let isVisible = true;

    const updateSize = () => {
      const width = Math.max(canvas.clientWidth, 1);
      const height = Math.max(canvas.clientHeight, 1);
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      stage.position.x = width < 760 ? 1.6 : 2.75;
      stage.position.y = width < 760 ? 0.25 : 0;
      stage.scale.setScalar(width < 760 ? 0.72 : 1);
      renderer.render(scene, camera);
    };

    const handlePointerMove = (event: PointerEvent) => {
      pointer.x = (event.clientX / window.innerWidth - 0.5) * 0.32;
      pointer.y = (event.clientY / window.innerHeight - 0.5) * 0.24;
    };

    const timer = new Timer();
    timer.connect(document);
    const renderFrame = (timestamp?: number) => {
      timer.update(timestamp);
      const elapsed = timer.getElapsed();
      if (isVisible) {
        stage.rotation.y += (pointer.x - stage.rotation.y) * 0.035;
        stage.rotation.x += (-pointer.y - stage.rotation.x) * 0.035;
        core.rotation.y = elapsed * 0.24;
        core.rotation.x = Math.sin(elapsed * 0.42) * 0.18;
        wireframe.rotation.copy(core.rotation);
        orbit.rotation.z = elapsed * 0.075;
        orbit.rotation.y = elapsed * -0.12;
        outerRing.rotation.z = elapsed * 0.08;
        innerRing.rotation.z = elapsed * -0.11;
        particles.rotation.y = elapsed * 0.018;
        stage.position.y += ((canvas.clientWidth < 760 ? 0.25 : 0) + Math.sin(elapsed * 0.72) * 0.1 - stage.position.y) * 0.04;
        renderer.render(scene, camera);
      }
      frameId = window.requestAnimationFrame(renderFrame);
    };

    const resizeObserver = new ResizeObserver(updateSize);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    });
    resizeObserver.observe(canvas);
    visibilityObserver.observe(canvas);
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    updateSize();

    if (prefersReducedMotion) {
      renderer.render(scene, camera);
    } else {
      renderFrame();
    }

    return () => {
      window.cancelAnimationFrame(frameId);
      timer.disconnect();
      window.removeEventListener("pointermove", handlePointerMove);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      scene.traverse((object) => {
        if (object instanceof Mesh || object instanceof LineSegments || object instanceof Points) {
          object.geometry.dispose();
          const materials = Array.isArray(object.material) ? object.material : [object.material];
          materials.forEach((material) => material.dispose());
        }
      });
      renderer.dispose();
    };
  }, [variant]);

  return <canvas aria-hidden="true" className="route-scene-3d" ref={canvasRef} />;
}
