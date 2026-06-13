"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const POINT_COUNT = 92;
const MAX_CONNECTIONS = POINT_COUNT * 5;
const GREEN = "#67AFA7";
const GREEN_DARK = "#9ed9d2";
const INK = "#1f2937";

type PointState = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  phase: number;
};

export default function HomeConnectionField() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const section = sectionRef.current;

    if (!canvas || !section) {
      return;
    }

    if (!hasWebGL()) {
      setWebglUnavailable(true);
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const pointer = { x: 0, y: 0, active: false };
    const points = createPoints();
    const pointPositions = new Float32Array(POINT_COUNT * 3);
    const linePositions = new Float32Array(MAX_CONNECTIONS * 2 * 3);
    let aspect = 1;
    let animationFrame = 0;
    let disposed = false;
    let lastTime = performance.now();

    const renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "high-performance",
    });

    renderer.setClearAlpha(0);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 10);
    camera.position.z = 2;

    const pointAttribute = new THREE.BufferAttribute(pointPositions, 3);
    const lineAttribute = new THREE.BufferAttribute(linePositions, 3);

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute("position", pointAttribute);

    const lineGeometry = new THREE.BufferGeometry();
    lineGeometry.setAttribute("position", lineAttribute);
    lineGeometry.setDrawRange(0, 0);

    const pointMaterial = new THREE.PointsMaterial({
      color: GREEN,
      size: 0.026,
      transparent: true,
      opacity: 0.78,
      sizeAttenuation: true,
    });

    const lineMaterial = new THREE.LineBasicMaterial({
      color: GREEN,
      transparent: true,
      opacity: 0.2,
    });

    const pointCloud = new THREE.Points(pointGeometry, pointMaterial);
    const connectionLines = new THREE.LineSegments(lineGeometry, lineMaterial);

    scene.add(connectionLines, pointCloud);

    const updateTheme = () => {
      const isDark = document.documentElement.classList.contains("dark");
      pointMaterial.color.set(isDark ? GREEN_DARK : INK);
      lineMaterial.color.set(isDark ? GREEN_DARK : GREEN);
      pointMaterial.opacity = isDark ? 0.86 : 0.68;
      lineMaterial.opacity = isDark ? 0.24 : 0.18;
      renderer.render(scene, camera);
    };

    const resize = () => {
      const rect = section.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));

      aspect = width / height;
      renderer.setSize(width, height, false);
      camera.left = -aspect;
      camera.right = aspect;
      camera.top = 1;
      camera.bottom = -1;
      camera.updateProjectionMatrix();
      pointMaterial.size = width < 640 ? 0.034 : 0.026;

      if (prefersReducedMotion) {
        renderFrame(performance.now());
      }
    };

    const renderFrame = (time: number) => {
      const delta = Math.min((time - lastTime) / 1000, 0.033);
      lastTime = time;

      updatePositions(points, pointPositions, linePositions, lineGeometry, {
        aspect,
        delta: prefersReducedMotion ? 0 : delta,
        pointer,
        time,
      });

      pointAttribute.needsUpdate = true;
      lineAttribute.needsUpdate = true;
      renderer.render(scene, camera);

      if (!prefersReducedMotion && !disposed) {
        animationFrame = window.requestAnimationFrame(renderFrame);
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
      pointer.active = true;
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    resize();
    updateTheme();
    renderFrame(lastTime);

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(section);
    section.addEventListener("pointermove", onPointerMove);
    section.addEventListener("pointerleave", onPointerLeave);

    const themeObserver = new MutationObserver(updateTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      themeObserver.disconnect();
      section.removeEventListener("pointermove", onPointerMove);
      section.removeEventListener("pointerleave", onPointerLeave);
      pointGeometry.dispose();
      lineGeometry.dispose();
      pointMaterial.dispose();
      lineMaterial.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <section className="relative isolate overflow-hidden border-b border-neutral-200 bg-white text-neutral-950 dark:border-white/10 dark:bg-neutral-950 dark:text-neutral-100">
      <div className="container mx-auto max-w-7xl px-6 py-20 sm:py-24">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.6fr)_minmax(22rem,0.4fr)] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6f69] dark:text-[#9ed9d2]">
              Connected thinking
            </p>
            <h2 className="mt-4 max-w-4xl text-4xl font-semibold leading-tight text-neutral-950 dark:text-white sm:text-5xl">
              Strategy, design, and engineering moving as one system.
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-neutral-600 dark:text-neutral-300">
            Good software is rarely one isolated decision. It is the quiet alignment of people, workflows, data, interfaces, and infrastructure.
          </p>
        </div>

        <div
          ref={sectionRef}
          className="relative mt-12 h-[320px] overflow-hidden border-y border-neutral-200 dark:border-white/10 sm:h-[420px]"
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-[#67AFA7]/40" aria-hidden />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-[#67AFA7]/30" aria-hidden />

          {webglUnavailable && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-px w-full max-w-3xl bg-[#67AFA7]/40" aria-hidden />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function createPoints() {
  return Array.from({ length: POINT_COUNT }, (_, index) => {
    const column = index % 23;
    const row = Math.floor(index / 23);
    const jitterX = randomBetween(-0.045, 0.045);
    const jitterY = randomBetween(-0.12, 0.12);

    return {
      x: -0.94 + column * 0.085 + jitterX,
      y: -0.72 + row * 0.47 + jitterY,
      z: randomBetween(-0.05, 0.05),
      vx: randomBetween(-0.018, 0.018),
      vy: randomBetween(-0.014, 0.014),
      phase: randomBetween(0, Math.PI * 2),
    };
  });
}

function updatePositions(
  points: PointState[],
  pointPositions: Float32Array,
  linePositions: Float32Array,
  lineGeometry: THREE.BufferGeometry,
  options: {
    aspect: number;
    delta: number;
    pointer: { x: number; y: number; active: boolean };
    time: number;
  },
) {
  const { aspect, delta, pointer, time } = options;
  const seconds = time * 0.001;

  for (let index = 0; index < points.length; index += 1) {
    const point = points[index];

    point.x += point.vx * delta;
    point.y += point.vy * delta;

    if (point.x > 0.98 || point.x < -0.98) point.vx *= -1;
    if (point.y > 0.78 || point.y < -0.78) point.vy *= -1;

    const pointerInfluence = pointer.active
      ? Math.max(0, 1 - Math.hypot(point.x - pointer.x, point.y - pointer.y) * 1.35)
      : 0;
    const drift = Math.sin(seconds * 0.6 + point.phase) * 0.018;
    const pullX = pointer.active ? (pointer.x - point.x) * pointerInfluence * 0.06 : 0;
    const pullY = pointer.active ? (pointer.y - point.y) * pointerInfluence * 0.04 : 0;
    const positionIndex = index * 3;

    pointPositions[positionIndex] = (point.x + pullX) * aspect;
    pointPositions[positionIndex + 1] = point.y + drift + pullY;
    pointPositions[positionIndex + 2] = point.z;
  }

  let lineCursor = 0;

  for (let first = 0; first < points.length; first += 1) {
    for (let second = first + 1; second < points.length; second += 1) {
      const dx = points[first].x - points[second].x;
      const dy = points[first].y - points[second].y;
      const distance = Math.hypot(dx, dy);

      if (distance > 0.235 || lineCursor >= MAX_CONNECTIONS * 6) {
        continue;
      }

      const firstPosition = first * 3;
      const secondPosition = second * 3;

      linePositions[lineCursor] = pointPositions[firstPosition];
      linePositions[lineCursor + 1] = pointPositions[firstPosition + 1];
      linePositions[lineCursor + 2] = pointPositions[firstPosition + 2];
      linePositions[lineCursor + 3] = pointPositions[secondPosition];
      linePositions[lineCursor + 4] = pointPositions[secondPosition + 1];
      linePositions[lineCursor + 5] = pointPositions[secondPosition + 2];
      lineCursor += 6;
    }
  }

  lineGeometry.setDrawRange(0, lineCursor / 3);
}

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl") || canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}
