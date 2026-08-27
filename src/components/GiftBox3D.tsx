import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { BOX_THEMES } from '../types';
import type { BoxThemeId, SoundEffectId, VisualEffectId } from '../types';
import { playDrumRoll, triggerSoundEffect } from '../lib/audio';
import { triggerVisualEffect } from '../lib/confetti';

interface GiftBox3DProps {
  text: string;
  subText?: string;
  emoji?: string;
  themeId: BoxThemeId;
  soundId: SoundEffectId;
  effectId: VisualEffectId;
  interactive?: boolean;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  className?: string;
}

export const GiftBox3D: React.FC<GiftBox3DProps> = ({
  text,
  subText,
  emoji = '🎁',
  themeId,
  soundId,
  effectId,
  interactive = true,
  isOpen = false,
  onOpenChange,
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [animationState, setAnimationState] = useState<'idle' | 'shaking' | 'opened'>(
    isOpen ? 'opened' : 'idle'
  );
  const [showFlash, setShowFlash] = useState<boolean>(false);
  const [showShockwave, setShowShockwave] = useState<boolean>(false);
  const [showSpeedLines, setShowSpeedLines] = useState<boolean>(false);
  const [suspenseText, setSuspenseText] = useState<string>('🎁 선물 개봉 시작... 🥁');

  // Three.js object references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const boxGroupRef = useRef<THREE.Group | null>(null);
  const lidGroupRef = useRef<THREE.Group | null>(null);
  const boardMeshRef = useRef<THREE.Mesh | null>(null);
  const sunburstRef = useRef<THREE.Mesh | null>(null);
  const burstParticlesRef = useRef<{ points: THREE.Points; velocities: Float32Array } | null>(null);
  const innerLightRef = useRef<THREE.PointLight | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const stateRef = useRef(animationState);
  stateRef.current = animationState;

  const currentTheme = BOX_THEMES[themeId] || BOX_THEMES['classic-red'];

  // Texture generator for the message billboard (High-DPI 1024x576)
  const updateBoardTexture = useCallback(() => {
    if (!boardMeshRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 576;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 1024, 576);

    const r = 36;
    const w = 984;
    const h = 536;
    const x = 20;
    const y = 20;

    // Outer glow
    ctx.shadowColor = currentTheme.boxColor;
    ctx.shadowBlur = 30;
    ctx.shadowOffsetY = 8;

    // Card background gradient
    const grad = ctx.createLinearGradient(0, 0, 1024, 576);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, '#fafafa');
    grad.addColorStop(1, '#f1f5f9');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();

    // Theme outer border
    ctx.lineWidth = 12;
    ctx.strokeStyle = currentTheme.boxColor;
    ctx.shadowBlur = 12;
    ctx.shadowColor = currentTheme.ribbonColor;
    ctx.stroke();

    // Inner decorative frame
    ctx.lineWidth = 3;
    ctx.strokeStyle = currentTheme.ribbonColor;
    ctx.shadowColor = 'transparent';
    ctx.strokeRect(34, 34, 956, 508);

    // Draw Emoji
    if (emoji) {
      ctx.font = '76px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 512, 115);
    }

    // Dynamic Multi-line / Auto-fit Font for Main Text
    let fontSize = 72;
    const textY = emoji ? (subText ? 245 : 275) : (subText ? 220 : 255);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0f172a';

    const cleanText = text.trim() || '선물이 도착했어요!';

    // Split into words or lines if long
    do {
      ctx.font = `900 ${fontSize}px "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
      const metrics = ctx.measureText(cleanText);
      if (metrics.width < 860) break;
      fontSize -= 4;
    } while (fontSize > 28);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.18)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.fillText(cleanText, 512, textY);

    // Draw Subtext (if any)
    if (subText && subText.trim()) {
      ctx.font = '700 34px "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      ctx.fillStyle = currentTheme.boardColor || '#64748b';
      ctx.shadowColor = 'transparent';
      ctx.fillText(subText.trim(), 512, textY + 95);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.needsUpdate = true;

    const mat = boardMeshRef.current.material as THREE.MeshStandardMaterial;
    if (mat.map) mat.map.dispose();
    mat.map = texture;
    mat.needsUpdate = true;
  }, [text, subText, emoji, currentTheme]);

  // Main Three.js Scene Setup
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;
    const aspect = width / height;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera with Responsive Mobile Distance Calculation
    const camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 100);
    cameraRef.current = camera;

    // Responsive camera position formula:
    // If portrait mobile (aspect < 1.0), increase z distance so wide items never crop!
    const targetWidth = 3.6;
    const fovRad = (45 * Math.PI) / 360; // half fov in rad
    let camZ = 5.8;
    let camY = 1.3;
    let lookY = 0.6;

    if (aspect < 1.0) {
      // Portrait mobile (iPhone / Galaxy)
      camZ = Math.max(6.2, targetWidth / (2 * Math.tan(fovRad) * aspect));
      camY = 1.1;
      lookY = 0.5;
    }

    camera.position.set(0, camY, camZ);
    camera.lookAt(0, lookY, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.2);
    dirLight.position.set(4, 8, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(currentTheme.ribbonHex, 1.2);
    backLight.position.set(-4, 3, -4);
    scene.add(backLight);

    // Glowing Inner PointLight inside box
    const innerLight = new THREE.PointLight(0xfff388, 0, 8);
    innerLight.position.set(0, 0.4, 0);
    scene.add(innerLight);
    innerLightRef.current = innerLight;

    // Master Box Group (Placed at y = -0.4 for perfect balance)
    const boxGroup = new THREE.Group();
    boxGroup.position.set(0, -0.4, 0);
    scene.add(boxGroup);
    boxGroupRef.current = boxGroup;

    // Materials
    const boxMat = new THREE.MeshStandardMaterial({
      color: currentTheme.boxHex,
      roughness: 0.3,
      metalness: 0.15,
    });

    const ribbonMat = new THREE.MeshStandardMaterial({
      color: currentTheme.ribbonHex,
      roughness: 0.2,
      metalness: 0.55,
    });

    const lidMat = new THREE.MeshStandardMaterial({
      color: currentTheme.lidHex,
      roughness: 0.3,
      metalness: 0.15,
    });

    // 1. Box Bottom Base (Proportional 1.6 x 1.3 x 1.6)
    const boxBaseGeo = new THREE.BoxGeometry(1.6, 1.25, 1.6);
    const boxBaseMesh = new THREE.Mesh(boxBaseGeo, boxMat);
    boxBaseMesh.position.y = 0;
    boxBaseMesh.castShadow = true;
    boxBaseMesh.receiveShadow = true;
    boxGroup.add(boxBaseMesh);

    // Ribbons on Box Base
    const ribVGeo = new THREE.BoxGeometry(0.34, 1.27, 1.62);
    const ribVMesh = new THREE.Mesh(ribVGeo, ribbonMat);
    boxGroup.add(ribVMesh);

    const ribHGeo = new THREE.BoxGeometry(1.62, 1.27, 0.34);
    const ribHMesh = new THREE.Mesh(ribHGeo, ribbonMat);
    boxGroup.add(ribHMesh);

    // 2. Lid Group
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 0.68, 0);
    boxGroup.add(lidGroup);
    lidGroupRef.current = lidGroup;

    const lidGeo = new THREE.BoxGeometry(1.74, 0.28, 1.74);
    const lidMesh = new THREE.Mesh(lidGeo, lidMat);
    lidMesh.castShadow = true;
    lidMesh.receiveShadow = true;
    lidGroup.add(lidMesh);

    // Ribbons on Lid
    const lidRibV = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.3, 1.76), ribbonMat);
    lidGroup.add(lidRibV);

    const lidRibH = new THREE.Mesh(new THREE.BoxGeometry(1.76, 0.3, 0.35), ribbonMat);
    lidGroup.add(lidRibH);

    // 3. Ribbon Bow on Top of Lid
    const bowGroup = new THREE.Group();
    bowGroup.position.set(0, 0.16, 0);
    lidGroup.add(bowGroup);

    const knotGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const knotMesh = new THREE.Mesh(knotGeo, ribbonMat);
    bowGroup.add(knotMesh);

    // 4 Bow Loops
    const loopGeo = new THREE.TorusGeometry(0.26, 0.08, 14, 24, Math.PI * 1.35);

    const loop1 = new THREE.Mesh(loopGeo, ribbonMat);
    loop1.rotation.set(Math.PI / 3, Math.PI / 4, 0);
    loop1.position.set(0.15, 0.12, 0.15);
    bowGroup.add(loop1);

    const loop2 = new THREE.Mesh(loopGeo, ribbonMat);
    loop2.rotation.set(Math.PI / 3, -Math.PI / 4, 0);
    loop2.position.set(-0.15, 0.12, 0.15);
    bowGroup.add(loop2);

    const loop3 = new THREE.Mesh(loopGeo, ribbonMat);
    loop3.rotation.set(Math.PI / 3, (3 * Math.PI) / 4, 0);
    loop3.position.set(-0.15, 0.12, -0.15);
    bowGroup.add(loop3);

    const loop4 = new THREE.Mesh(loopGeo, ribbonMat);
    loop4.rotation.set(Math.PI / 3, -(3 * Math.PI) / 4, 0);
    loop4.position.set(0.15, 0.12, -0.15);
    bowGroup.add(loop4);

    // 4. Rotating 3D God Rays / Sunburst behind revealed message
    const sunburstGeo = new THREE.CircleGeometry(2.8, 32);
    const sunburstMat = new THREE.MeshBasicMaterial({
      color: currentTheme.ribbonHex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const sunburstMesh = new THREE.Mesh(sunburstGeo, sunburstMat);
    sunburstMesh.position.set(0, 1.4, -0.15);
    scene.add(sunburstMesh);
    sunburstRef.current = sunburstMesh;

    // 5. Message Billboard Board (2.4 x 1.35 - perfectly fits mobile screens!)
    const boardGeo = new THREE.PlaneGeometry(2.4, 1.35);
    const boardMat = new THREE.MeshStandardMaterial({
      roughness: 0.2,
      metalness: 0.1,
      side: THREE.DoubleSide,
    });
    const boardMesh = new THREE.Mesh(boardGeo, boardMat);
    boardMesh.position.set(0, 0.2, 0);
    boardMesh.scale.set(0.001, 0.001, 0.001);
    boardMesh.castShadow = true;
    boxGroup.add(boardMesh);
    boardMeshRef.current = boardMesh;

    // Update texture on board
    updateBoardTexture();

    // 6. Explosive 3D Sparks & Debris Particle Emitter (60 particles)
    const burstCount = 60;
    const burstGeo = new THREE.BufferGeometry();
    const burstPositions = new Float32Array(burstCount * 3);
    const burstVelocities = new Float32Array(burstCount * 3);

    for (let i = 0; i < burstCount; i++) {
      burstPositions[i * 3] = 0;
      burstPositions[i * 3 + 1] = 0.3;
      burstPositions[i * 3 + 2] = 0;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = Math.random() * 4.5 + 1.8;

      burstVelocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      burstVelocities[i * 3 + 1] = Math.abs(Math.cos(phi)) * speed + 1.5;
      burstVelocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
    }

    burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));
    const burstMat = new THREE.PointsMaterial({
      color: currentTheme.ribbonHex,
      size: 0.14,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const burstPoints = new THREE.Points(burstGeo, burstMat);
    scene.add(burstPoints);
    burstParticlesRef.current = { points: burstPoints, velocities: burstVelocities };

    // 7. Ambient Sparkle Dust
    const ambientCount = 45;
    const ambientGeo = new THREE.BufferGeometry();
    const ambPositions = new Float32Array(ambientCount * 3);

    for (let i = 0; i < ambientCount; i++) {
      ambPositions[i * 3] = (Math.random() - 0.5) * 4.5;
      ambPositions[i * 3 + 1] = Math.random() * 3.5 - 0.5;
      ambPositions[i * 3 + 2] = (Math.random() - 0.5) * 4.5;
    }

    ambientGeo.setAttribute('position', new THREE.BufferAttribute(ambPositions, 3));
    const ambMat = new THREE.PointsMaterial({
      color: 0xfff077,
      size: 0.08,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const ambParticles = new THREE.Points(ambientGeo, ambMat);
    scene.add(ambParticles);

    // Shadow plane under box
    const shadowGeo = new THREE.PlaneGeometry(3.2, 3.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.3,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.75;
    scene.add(shadowPlane);

    // Animation Loop Variables
    const startTimestamp = performance.now();
    let openProgress = isOpen ? 1 : 0;

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTimestamp) * 0.001;

      // Ambient particle rotation
      ambParticles.rotation.y = elapsedTime * 0.12;

      const currentState = stateRef.current;

      if (currentState === 'idle') {
        // Gentle bobbing effect
        boxGroup.position.y = -0.4 + Math.sin(elapsedTime * 2.2) * 0.07;
        boxGroup.rotation.y = Math.sin(elapsedTime * 0.8) * 0.18;
        boxGroup.rotation.x = Math.sin(elapsedTime * 1.1) * 0.04;
        boxGroup.rotation.z = 0;

        lidGroup.position.set(0, 0.68, 0);
        lidGroup.rotation.set(0, 0, 0);
        boardMesh.scale.set(0.001, 0.001, 0.001);
        innerLight.intensity = 0;
        sunburstMat.opacity = 0;
        burstMat.opacity = 0;
      } else if (currentState === 'shaking') {
        // Accelerating violent earthquake vibration
        boxGroup.position.y = -0.4 + Math.sin(elapsedTime * 35) * 0.08;
        boxGroup.rotation.y = Math.sin(elapsedTime * 65) * 0.12;
        boxGroup.rotation.z = Math.cos(elapsedTime * 60) * 0.08;
        boxGroup.rotation.x = (Math.random() - 0.5) * 0.1;

        lidGroup.position.y = 0.68 + Math.abs(Math.sin(elapsedTime * 45)) * 0.15;
        innerLight.intensity = 2.5 + Math.sin(elapsedTime * 50) * 2.0;
      } else if (currentState === 'opened') {
        if (openProgress < 1) {
          openProgress += 0.035;
          if (openProgress > 1) openProgress = 1;
        }

        // Elastic overshoot
        const easeElastic = (x: number): number => {
          const c4 = (2 * Math.PI) / 3;
          return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
        };

        const eased = easeElastic(openProgress);

        // Lid flies up and away
        lidGroup.position.y = 0.68 + openProgress * 3.2;
        lidGroup.position.z = -openProgress * 1.8;
        lidGroup.position.x = openProgress * 0.9;
        lidGroup.rotation.x = -openProgress * 2.8;
        lidGroup.rotation.y = openProgress * 1.6;
        lidGroup.rotation.z = -openProgress * 1.0;

        // Board pops up clearly ABOVE the box
        const boardY = 0.2 + openProgress * 1.6;
        boardMesh.position.y = boardY;
        const scaleVal = Math.max(0.001, Math.min(eased * 1.03, 1.05));
        boardMesh.scale.set(scaleVal, scaleVal, scaleVal);

        // Rotating Sunburst Rays
        sunburstMesh.position.y = boardY - 0.4 + 0.4;
        sunburstMesh.rotation.z = elapsedTime * 0.5;
        sunburstMat.opacity = Math.min(0.3, openProgress * 0.3);

        // Update 3D Explosive Sparks
        if (burstParticlesRef.current && openProgress < 0.95) {
          const positions = burstParticlesRef.current.points.geometry.attributes.position.array as Float32Array;
          const vels = burstParticlesRef.current.velocities;
          burstMat.opacity = (1 - openProgress) * 0.85;

          for (let i = 0; i < burstCount; i++) {
            positions[i * 3] += vels[i * 3] * 0.016;
            positions[i * 3 + 1] += vels[i * 3 + 1] * 0.016;
            positions[i * 3 + 2] += vels[i * 3 + 2] * 0.016;
            vels[i * 3 + 1] -= 0.09;
          }
          burstParticlesRef.current.points.geometry.attributes.position.needsUpdate = true;
        }

        // Gentle floating for opened state
        boxGroup.position.y = -0.5 + Math.sin(elapsedTime * 1.8) * 0.04;
        boxGroup.rotation.y = Math.sin(elapsedTime * 0.7) * 0.08;
        boxGroup.rotation.x = 0.03;
        boxGroup.rotation.z = 0;

        innerLight.intensity = 4.0;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Robust Responsive Resize Handler (Adapts dynamically on mobile rotate/resize)
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 360;
      const curAspect = w / h;
      const cam = cameraRef.current;

      cam.aspect = curAspect;

      if (curAspect < 1.0) {
        // Portrait mobile: calculate exact camera distance to fit target width
        const reqZ = Math.max(6.2, targetWidth / (2 * Math.tan(fovRad) * curAspect));
        cam.position.set(0, 1.1, reqZ);
        cam.lookAt(0, 0.5, 0);
      } else {
        cam.position.set(0, 1.3, 5.8);
        cam.lookAt(0, 0.6, 0);
      }

      cam.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
      renderer.dispose();
    };
  }, [themeId, currentTheme, updateBoardTexture]);

  // Trigger Extreme 5-Second Open Sequence
  const triggerOpen = useCallback(() => {
    if (animationState !== 'idle' || !interactive) return;

    const suspenseMs = 4800;
    setAnimationState('shaking');
    playDrumRoll(suspenseMs);

    setSuspenseText('🎁 선물 개봉 시작... 🥁');
    const t1 = setTimeout(() => setSuspenseText('🥁 두구두구두구두구... 💥'), 1200);
    const t2 = setTimeout(() => setSuspenseText('⚡ 과연 답변은...?! 🔥'), 2500);
    const t3 = setTimeout(() => setSuspenseText('💥 3... 2... 1... 💣'), 3800);
    const t4 = setTimeout(() => setSuspenseText('🔥 콰아아아앙!!!! 💥'), 4600);

    setTimeout(() => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);

      setAnimationState('opened');

      setShowFlash(true);
      setShowShockwave(true);
      setShowSpeedLines(true);

      setTimeout(() => setShowFlash(false), 700);
      setTimeout(() => setShowShockwave(false), 1200);
      setTimeout(() => setShowSpeedLines(false), 3000);

      triggerSoundEffect(soundId);
      triggerVisualEffect(effectId);
      onOpenChange?.(true);
    }, suspenseMs);
  }, [animationState, interactive, soundId, effectId, onOpenChange]);

  useEffect(() => {
    if (isOpen && animationState !== 'opened') {
      setAnimationState('opened');
    } else if (!isOpen && animationState === 'opened') {
      setAnimationState('idle');
    }
  }, [isOpen]);

  useEffect(() => {
    updateBoardTexture();
  }, [text, subText, emoji, currentTheme, updateBoardTexture]);

  return (
    <div
      className={`relative select-none cursor-pointer flex flex-col items-center justify-center w-full h-full ${
        animationState === 'shaking' ? 'animate-rumble' : ''
      } ${className}`}
      onClick={animationState === 'idle' ? triggerOpen : undefined}
    >
      {/* Blinding Screen Flash Bang */}
      {showFlash && (
        <div className="fixed inset-0 pointer-events-none z-50 bg-white animate-flash mix-blend-screen" />
      )}

      {/* Massive Expanding Shockwave Ring */}
      {showShockwave && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border-[10px] animate-shockwave pointer-events-none z-40"
          style={{ borderColor: currentTheme.ribbonColor }}
        />
      )}

      {/* Anime Action / Speed Lines Overlay */}
      {showSpeedLines && (
        <div className="fixed inset-0 pointer-events-none z-30 speed-lines opacity-90 animate-spin-rays" />
      )}

      {/* 3D Canvas Mount */}
      <div
        ref={mountRef}
        className={`w-full h-full pointer-events-none transition-transform duration-300 ${
          showShockwave ? 'animate-earthquake' : ''
        }`}
      />

      {/* Interactive Helper Overlay (when idle) */}
      {interactive && animationState === 'idle' && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full bg-gradient-to-r from-amber-500/95 to-yellow-400/95 backdrop-blur-md border border-white/40 text-black text-xs sm:text-sm font-black tracking-wide shadow-2xl flex items-center gap-1.5 animate-bounce z-20 whitespace-nowrap">
          <span className="text-base">🎁</span>
          <span>탭해서 선물 개봉하기!</span>
        </div>
      )}

      {/* 5-Second Shaking indicator with progressive text */}
      {animationState === 'shaking' && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-5 py-2.5 rounded-full bg-red-600/95 border-2 border-yellow-300 backdrop-blur-md text-yellow-200 font-black text-xs sm:text-sm tracking-wider animate-pulse shadow-2xl flex items-center gap-1.5 z-20 whitespace-nowrap">
          <span>{suspenseText}</span>
        </div>
      )}
    </div>
  );
};
