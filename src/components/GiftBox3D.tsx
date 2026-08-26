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

  // References to keep track of Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
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

  // Texture generator for the message billboard
  const updateBoardTexture = useCallback(() => {
    if (!boardMeshRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 620;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background card
    ctx.clearRect(0, 0, 1200, 620);

    // Rounded rectangle path
    const r = 44;
    const w = 1160;
    const h = 580;
    const x = 20;
    const y = 20;

    // Outer glow
    ctx.shadowColor = currentTheme.boxColor;
    ctx.shadowBlur = 35;
    ctx.shadowOffsetY = 10;

    // Card background gradient
    const grad = ctx.createLinearGradient(0, 0, 1200, 620);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.5, '#fefefe');
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

    // Bold Theme Border
    ctx.lineWidth = 14;
    ctx.strokeStyle = currentTheme.boxColor;
    ctx.shadowBlur = 15;
    ctx.shadowColor = currentTheme.ribbonColor;
    ctx.stroke();

    // Inner gold decorative frame
    ctx.lineWidth = 4;
    ctx.strokeStyle = currentTheme.ribbonColor;
    ctx.shadowColor = 'transparent';
    ctx.strokeRect(36, 36, 1128, 548);

    // Draw Emoji
    if (emoji) {
      ctx.font = '92px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 600, 140);
    }

    // Dynamic Font Size for Main Text
    let fontSize = 84;
    const textY = emoji ? 295 : 260;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#090d16';

    // Auto-fit font size
    do {
      ctx.font = `950 ${fontSize}px "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`;
      const metrics = ctx.measureText(text || ' ');
      if (metrics.width < 1000) break;
      fontSize -= 4;
    } while (fontSize > 36);

    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 6;
    ctx.fillText(text || ' ', 600, textY);

    // Draw Subtext (if any)
    if (subText) {
      ctx.font = '700 42px "Pretendard", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif';
      ctx.fillStyle = currentTheme.boardColor || '#475569';
      ctx.shadowColor = 'transparent';
      ctx.fillText(subText, 600, textY + 115);
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

    // Dimensions
    const width = container.clientWidth || 360;
    const height = container.clientHeight || 360;

    // Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 2.6, 6.4);
    camera.lookAt(0, 0.5, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.replaceChildren(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.4);
    dirLight.position.set(5, 9, 6);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.001;
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(currentTheme.ribbonHex, 1.2);
    backLight.position.set(-5, 4, -4);
    scene.add(backLight);

    // Glowing Inner PointLight inside box
    const innerLight = new THREE.PointLight(0xfff388, 0, 10);
    innerLight.position.set(0, 0.6, 0);
    scene.add(innerLight);
    innerLightRef.current = innerLight;

    // Master Box Group
    const boxGroup = new THREE.Group();
    boxGroup.position.set(0, -0.2, 0);
    scene.add(boxGroup);
    boxGroupRef.current = boxGroup;

    // Materials based on current theme
    const boxMat = new THREE.MeshStandardMaterial({
      color: currentTheme.boxHex,
      roughness: 0.3,
      metalness: 0.2,
    });

    const ribbonMat = new THREE.MeshStandardMaterial({
      color: currentTheme.ribbonHex,
      roughness: 0.2,
      metalness: 0.6,
    });

    const lidMat = new THREE.MeshStandardMaterial({
      color: currentTheme.lidHex,
      roughness: 0.3,
      metalness: 0.2,
    });

    // 1. Box Bottom Base
    const boxBaseGeo = new THREE.BoxGeometry(2.0, 1.6, 2.0);
    const boxBaseMesh = new THREE.Mesh(boxBaseGeo, boxMat);
    boxBaseMesh.position.y = 0;
    boxBaseMesh.castShadow = true;
    boxBaseMesh.receiveShadow = true;
    boxGroup.add(boxBaseMesh);

    // Ribbons on Box Base
    const ribVGeo = new THREE.BoxGeometry(0.42, 1.62, 2.03);
    const ribVMesh = new THREE.Mesh(ribVGeo, ribbonMat);
    boxGroup.add(ribVMesh);

    const ribHGeo = new THREE.BoxGeometry(2.03, 1.62, 0.42);
    const ribHMesh = new THREE.Mesh(ribHGeo, ribbonMat);
    boxGroup.add(ribHMesh);

    // 2. Lid Group (Detachable on open)
    const lidGroup = new THREE.Group();
    lidGroup.position.set(0, 0.85, 0);
    boxGroup.add(lidGroup);
    lidGroupRef.current = lidGroup;

    const lidGeo = new THREE.BoxGeometry(2.18, 0.38, 2.18);
    const lidMesh = new THREE.Mesh(lidGeo, lidMat);
    lidMesh.castShadow = true;
    lidMesh.receiveShadow = true;
    lidGroup.add(lidMesh);

    // Ribbons on Lid
    const lidRibV = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.4, 2.2), ribbonMat);
    lidGroup.add(lidRibV);

    const lidRibH = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 0.43), ribbonMat);
    lidGroup.add(lidRibH);

    // 3. Ribbon Bow on Top of Lid
    const bowGroup = new THREE.Group();
    bowGroup.position.set(0, 0.22, 0);
    lidGroup.add(bowGroup);

    // Central Knot
    const knotGeo = new THREE.SphereGeometry(0.22, 16, 16);
    const knotMesh = new THREE.Mesh(knotGeo, ribbonMat);
    bowGroup.add(knotMesh);

    // 4 Bow Loops
    const loopGeo = new THREE.TorusGeometry(0.32, 0.1, 14, 28, Math.PI * 1.35);

    const loop1 = new THREE.Mesh(loopGeo, ribbonMat);
    loop1.rotation.set(Math.PI / 3, Math.PI / 4, 0);
    loop1.position.set(0.2, 0.16, 0.2);
    bowGroup.add(loop1);

    const loop2 = new THREE.Mesh(loopGeo, ribbonMat);
    loop2.rotation.set(Math.PI / 3, -Math.PI / 4, 0);
    loop2.position.set(-0.2, 0.16, 0.2);
    bowGroup.add(loop2);

    const loop3 = new THREE.Mesh(loopGeo, ribbonMat);
    loop3.rotation.set(Math.PI / 3, (3 * Math.PI) / 4, 0);
    loop3.position.set(-0.2, 0.16, -0.2);
    bowGroup.add(loop3);

    const loop4 = new THREE.Mesh(loopGeo, ribbonMat);
    loop4.rotation.set(Math.PI / 3, -(3 * Math.PI) / 4, 0);
    loop4.position.set(0.2, 0.16, -0.2);
    bowGroup.add(loop4);

    // 4. Rotating 3D God Rays / Sunburst behind revealed message
    const sunburstGeo = new THREE.CircleGeometry(3.5, 32);
    const sunburstMat = new THREE.MeshBasicMaterial({
      color: currentTheme.ribbonHex,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const sunburstMesh = new THREE.Mesh(sunburstGeo, sunburstMat);
    sunburstMesh.position.set(0, 1.8, -0.2);
    scene.add(sunburstMesh);
    sunburstRef.current = sunburstMesh;

    // 5. Message Billboard Board (Pops out with extreme squash & stretch)
    const boardGeo = new THREE.PlaneGeometry(3.1, 1.6);
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

    // 6. Explosive 3D Sparks & Debris Particle Emitter (100 particles)
    const burstCount = 100;
    const burstGeo = new THREE.BufferGeometry();
    const burstPositions = new Float32Array(burstCount * 3);
    const burstVelocities = new Float32Array(burstCount * 3);

    for (let i = 0; i < burstCount; i++) {
      burstPositions[i * 3] = 0;
      burstPositions[i * 3 + 1] = 0.5;
      burstPositions[i * 3 + 2] = 0;

      // Spherical explosive velocity
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const speed = Math.random() * 6.0 + 2.0;

      burstVelocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      burstVelocities[i * 3 + 1] = Math.abs(Math.cos(phi)) * speed + 2.0;
      burstVelocities[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * speed;
    }

    burstGeo.setAttribute('position', new THREE.BufferAttribute(burstPositions, 3));
    const burstMat = new THREE.PointsMaterial({
      color: currentTheme.ribbonHex,
      size: 0.18,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
    });
    const burstPoints = new THREE.Points(burstGeo, burstMat);
    scene.add(burstPoints);
    burstParticlesRef.current = { points: burstPoints, velocities: burstVelocities };

    // 7. Ambient Sparkle Dust
    const ambientCount = 60;
    const ambientGeo = new THREE.BufferGeometry();
    const ambPositions = new Float32Array(ambientCount * 3);

    for (let i = 0; i < ambientCount; i++) {
      ambPositions[i * 3] = (Math.random() - 0.5) * 5;
      ambPositions[i * 3 + 1] = Math.random() * 4 - 0.5;
      ambPositions[i * 3 + 2] = (Math.random() - 0.5) * 5;
    }

    ambientGeo.setAttribute('position', new THREE.BufferAttribute(ambPositions, 3));
    const ambMat = new THREE.PointsMaterial({
      color: 0xfff077,
      size: 0.09,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const ambParticles = new THREE.Points(ambientGeo, ambMat);
    scene.add(ambParticles);

    // Shadow plane under box
    const shadowGeo = new THREE.PlaneGeometry(4.0, 4.0);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.35,
    });
    const shadowPlane = new THREE.Mesh(shadowGeo, shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -0.99;
    scene.add(shadowPlane);

    // Animation Loop Variables
    const startTimestamp = performance.now();
    let openProgress = isOpen ? 1 : 0;

    const animate = () => {
      animationFrameId.current = requestAnimationFrame(animate);
      const elapsedTime = (performance.now() - startTimestamp) * 0.001;

      // Ambient particle rotation
      ambParticles.rotation.y = elapsedTime * 0.15;

      const currentState = stateRef.current;

      if (currentState === 'idle') {
        // Floating bobbing effect
        boxGroup.position.y = -0.2 + Math.sin(elapsedTime * 2.5) * 0.1;
        boxGroup.rotation.y = Math.sin(elapsedTime * 0.9) * 0.22;
        boxGroup.rotation.x = Math.sin(elapsedTime * 1.3) * 0.06;
        boxGroup.rotation.z = 0;

        // Reset lid & board
        lidGroup.position.set(0, 0.85, 0);
        lidGroup.rotation.set(0, 0, 0);
        boardMesh.scale.set(0.001, 0.001, 0.001);
        innerLight.intensity = 0;
        sunburstMat.opacity = 0;
        burstMat.opacity = 0;
      } else if (currentState === 'shaking') {
        // Violent earthquake vibration
        boxGroup.position.y = -0.2 + Math.sin(elapsedTime * 35) * 0.09;
        boxGroup.rotation.y = Math.sin(elapsedTime * 65) * 0.14;
        boxGroup.rotation.z = Math.cos(elapsedTime * 60) * 0.1;
        boxGroup.rotation.x = (Math.random() - 0.5) * 0.12;

        // Lid rattles vigorously and glows
        lidGroup.position.y = 0.85 + Math.abs(Math.sin(elapsedTime * 45)) * 0.18;
        innerLight.intensity = 3.0 + Math.sin(elapsedTime * 50) * 2.5;
      } else if (currentState === 'opened') {
        // Open transition
        if (openProgress < 1) {
          openProgress += 0.035;
          if (openProgress > 1) openProgress = 1;
        }

        // Extreme Elastic Overshoot Easing (scale: 0 -> 1.3 -> 1.0)
        const easeElastic = (x: number): number => {
          const c4 = (2 * Math.PI) / 3;
          return x === 0 ? 0 : x === 1 ? 1 : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
        };

        const eased = easeElastic(openProgress);

        // Lid blasts upward like a rocket and tumbles away
        lidGroup.position.y = 0.85 + openProgress * 4.2;
        lidGroup.position.z = -openProgress * 2.2;
        lidGroup.position.x = openProgress * 1.2;
        lidGroup.rotation.x = -openProgress * 3.5;
        lidGroup.rotation.y = openProgress * 2.0;
        lidGroup.rotation.z = -openProgress * 1.5;

        // Board shoots up dramatically with overshoot
        const boardY = 0.2 + openProgress * 2.1;
        boardMesh.position.y = boardY;
        const scaleVal = Math.max(0.001, eased * 1.05);
        boardMesh.scale.set(scaleVal, scaleVal, scaleVal);

        // Rotating Sunburst Rays
        sunburstMesh.rotation.z = elapsedTime * 0.6;
        sunburstMat.opacity = Math.min(0.35, openProgress * 0.35);

        // Update 3D Explosive Sparks
        if (burstParticlesRef.current && openProgress < 0.95) {
          const positions = burstParticlesRef.current.points.geometry.attributes.position.array as Float32Array;
          const vels = burstParticlesRef.current.velocities;
          burstMat.opacity = (1 - openProgress) * 0.9;

          for (let i = 0; i < burstCount; i++) {
            positions[i * 3] += vels[i * 3] * 0.016;
            positions[i * 3 + 1] += vels[i * 3 + 1] * 0.016;
            positions[i * 3 + 2] += vels[i * 3 + 2] * 0.016;

            // Gravity on particles
            vels[i * 3 + 1] -= 0.12;
          }
          burstParticlesRef.current.points.geometry.attributes.position.needsUpdate = true;
        }

        // Gentle floating for opened state
        boxGroup.position.y = -0.35 + Math.sin(elapsedTime * 2.0) * 0.06;
        boxGroup.rotation.y = Math.sin(elapsedTime * 0.8) * 0.12;
        boxGroup.rotation.x = 0.04;
        boxGroup.rotation.z = 0;

        innerLight.intensity = 5.0;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Resize Handler
    const handleResize = () => {
      if (!container || !rendererRef.current) return;
      const w = container.clientWidth || 360;
      const h = container.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
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

  const [suspenseText, setSuspenseText] = useState<string>('🎁 선물 개봉 시작... 🥁');

  // Trigger Extreme 5-Second Open Sequence
  const triggerOpen = useCallback(() => {
    if (animationState !== 'idle' || !interactive) return;

    const suspenseMs = 4800;
    setAnimationState('shaking');
    playDrumRoll(suspenseMs);

    // Dynamic suspense text updates over 5 seconds
    setSuspenseText('🎁 선물 개봉 시작... 🥁');
    const t1 = setTimeout(() => setSuspenseText('🥁 두구두구두구두구... 💥'), 1200);
    const t2 = setTimeout(() => setSuspenseText('⚡ 과연 답변은...?! 🔥'), 2500);
    const t3 = setTimeout(() => setSuspenseText('💥 3... 2... 1... 💣'), 3800);
    const t4 = setTimeout(() => setSuspenseText('🔥 콰아아아앙!!!! 💥'), 4600);

    // EXPLOSION PHASE at 4.8s
    setTimeout(() => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);

      setAnimationState('opened');

      // Trigger Screen Flash & Shockwave
      setShowFlash(true);
      setShowShockwave(true);
      setShowSpeedLines(true);

      setTimeout(() => setShowFlash(false), 700);
      setTimeout(() => setShowShockwave(false), 1200);
      setTimeout(() => setShowSpeedLines(false), 3000);

      // Trigger Audio & Visuals
      triggerSoundEffect(soundId);
      triggerVisualEffect(effectId);
      onOpenChange?.(true);
    }, suspenseMs);
  }, [animationState, interactive, soundId, effectId, onOpenChange]);

  // Sync external isOpen prop changes
  useEffect(() => {
    if (isOpen && animationState !== 'opened') {
      setAnimationState('opened');
    } else if (!isOpen && animationState === 'opened') {
      setAnimationState('idle');
    }
  }, [isOpen]);

  // Re-bake text texture whenever props change
  useEffect(() => {
    updateBoardTexture();
  }, [text, subText, emoji, currentTheme, updateBoardTexture]);

  return (
    <div
      className={`relative select-none cursor-pointer flex flex-col items-center justify-center ${
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
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 rounded-full border-[12px] animate-shockwave pointer-events-none z-40"
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
        className={`w-full h-full min-h-[340px] pointer-events-none transition-transform duration-300 ${
          showShockwave ? 'animate-earthquake' : ''
        }`}
      />

      {/* Interactive Helper Overlay (when idle) */}
      {interactive && animationState === 'idle' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-gradient-to-r from-amber-500/95 to-yellow-400/95 backdrop-blur-md border border-white/40 text-black text-sm font-black tracking-wide shadow-2xl flex items-center gap-2 animate-bounce">
          <span className="text-lg">🎁</span>
          <span>탭해서 선물 개봉하기!</span>
        </div>
      )}

      {/* 5-Second Shaking indicator with progressive text */}
      {animationState === 'shaking' && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-red-600/95 border-2 border-yellow-300 backdrop-blur-md text-yellow-200 font-black text-base tracking-wider animate-pulse shadow-2xl flex items-center gap-2">
          <span>{suspenseText}</span>
        </div>
      )}
    </div>
  );
};
