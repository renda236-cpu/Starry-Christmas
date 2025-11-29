import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree, extend } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';
import { FIREWORK_COLORS } from '../constants';
import { randomRange, randomColor } from '../utils/helpers';

// Fix for TypeScript errors regarding missing JSX elements for React Three Fiber
declare global {
  namespace JSX {
    interface IntrinsicElements {
      points: any;
      bufferGeometry: any;
      bufferAttribute: any;
      shaderMaterial: any;
      pointsMaterial: any;
      color: any;
      group: any;
    }
  }
}

interface FireworkSceneProps {
  triggerSignal: number;
  enableFireworks: boolean;
}

// --- Helpers & Generators ---

const map = (value: number, sMin: number, sMax: number, dMin: number, dMax: number) => dMin + (value - sMin) / (sMax - sMin) * (dMax - dMin);
const rand = (max: number, min = 0) => min + Math.random() * (max - min);
const randChoice = (arr: any[]) => arr[Math.floor(Math.random() * arr.length)];
const polar = (ang: number, r = 1) => [r * Math.cos(ang), r * Math.sin(ang)];

// Generate texture for Spark (Trees/Ground) - Soft Glow
const getSparkTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();

  const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
  gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
  gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 32, 32);

  const texture = new THREE.CanvasTexture(canvas);
  texture.premultiplyAlpha = true;
  return texture;
};

// Generate textures for Snow - 3 Variations
const getSnowflakeTexture = (type: number) => {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  if (!ctx) return new THREE.Texture();

  ctx.fillStyle = '#FFFFFF';
  ctx.translate(16, 16);
  
  if (type === 0) {
    // Circle
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (type === 1) {
    // Star
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
        ctx.lineTo(Math.cos((18 + i * 72) * 0.0174533) * 10, -Math.sin((18 + i * 72) * 0.0174533) * 10);
        ctx.lineTo(Math.cos((54 + i * 72) * 0.0174533) * 4, -Math.sin((54 + i * 72) * 0.0174533) * 4);
    }
    ctx.fill();
  } else {
    // Diamond
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 10);
    ctx.lineTo(-8, 0);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
};

// --- Shaders ---

const treeVertexShader = `
attribute float mIndex;
varying vec3 vColor;
varying float opacity;
uniform sampler2D tAudioData;

float norm(float value, float min, float max ){ return (value - min) / (max - min); }
float lerp(float norm, float min, float max){ return (max - min) * norm + min; }
float map(float value, float sourceMin, float sourceMax, float destMin, float destMax){ return lerp(norm(value, sourceMin, sourceMax), destMin, destMax); }

void main() {
    vColor = color;
    vec3 p = position;
    vec4 mvPosition = modelViewMatrix * vec4( p, 1.0 );
    
    // Audio reaction logic (simulated)
    float amplitude = texture2D( tAudioData, vec2( mIndex, 0.1 ) ).r;
    float amplitudeClamped = clamp(amplitude-0.2, 0.0, 1.0 );
    float sizeMapped = map(amplitudeClamped, 0.0, 1.0, 1.0, 20.0);
    
    opacity = map(mvPosition.z , -200.0, 15.0, 0.0, 1.0);
    
    gl_PointSize = sizeMapped * ( 100.0 / -mvPosition.z );
    gl_Position = projectionMatrix * mvPosition;
}
`;

const treeFragmentShader = `
varying vec3 vColor;
varying float opacity;
uniform sampler2D pointTexture;

void main() {
    gl_FragColor = vec4( vColor, opacity );
    gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );
}
`;

const snowVertexShader = `
attribute float size;
attribute float phase;
attribute float phaseSecondary;
varying vec3 vColor;
varying float opacity;
uniform float time;
uniform float step;

float map(float value, float sMin, float sMax, float dMin, float dMax){ return dMin + (value - sMin) / (sMax - sMin) * (dMax - dMin); }

void main() {
    float t = time * 0.0006;
    vColor = color;
    vec3 p = position;
    
    // Falling logic
    p.y = map(mod(phase+step, 1000.0), 0.0, 1000.0, 25.0, -8.0);
    p.x += sin(t+phase);
    p.z += sin(t+phaseSecondary);
    
    opacity = map(p.z, -150.0, 15.0, 0.0, 1.0);
    
    vec4 mvPosition = modelViewMatrix * vec4( p, 1.0 );
    gl_PointSize = size * ( 100.0 / -mvPosition.z );
    gl_Position = projectionMatrix * mvPosition;
}
`;

const snowFragmentShader = `
uniform sampler2D pointTexture;
varying vec3 vColor;
varying float opacity;
void main() {
    gl_FragColor = vec4( vColor, opacity );
    gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );
}
`;

const planeVertexShader = `
attribute float size;
attribute vec3 customColor;
varying vec3 vColor;
void main() {
    vColor = customColor;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_PointSize = size * ( 300.0 / -mvPosition.z );
    gl_Position = projectionMatrix * mvPosition;
}
`;

const planeFragmentShader = `
uniform vec3 color;
uniform sampler2D pointTexture;
varying vec3 vColor;
void main() {
    gl_FragColor = vec4( vColor, 1.0 );
    gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );
}
`;

// --- Scene Components ---

const Tree = ({ position, uniforms, geometry }: { position: [number, number, number], uniforms: any, geometry: THREE.BufferGeometry }) => {
  return (
    <points geometry={geometry} position={position}>
      <shaderMaterial
        uniforms={uniforms}
        vertexShader={treeVertexShader}
        fragmentShader={treeFragmentShader}
        blending={THREE.AdditiveBlending}
        depthTest={false}
        transparent={true}
        vertexColors={true}
      />
    </points>
  );
};

const Snow = ({ uniforms }: { uniforms: any }) => {
    // Create 3 batches of snow with different textures
    const snowConfigs = useMemo(() => [
        { tex: getSnowflakeTexture(0), count: 300 },
        { tex: getSnowflakeTexture(1), count: 300 },
        { tex: getSnowflakeTexture(2), count: 300 }
    ], []);

    // Helper to generate geometry for one batch
    const getSnowGeo = (count: number) => {
        const geometry = new THREE.BufferGeometry();
        const positions: number[] = [];
        const colors: number[] = [];
        const sizes: number[] = [];
        const phases: number[] = [];
        const phaseSecondaries: number[] = [];
        const color = new THREE.Color();

        for (let i = 0; i < count; i++) {
            positions.push(rand(25, -25), 0, rand(15, -150));
            color.set(randChoice(["#f1d4d4", "#f1f6f9", "#eeeeee"]));
            colors.push(color.r, color.g, color.b);
            phases.push(rand(1000));
            phaseSecondaries.push(rand(1000));
            sizes.push(rand(4, 2));
        }
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
        geometry.setAttribute("phase", new THREE.Float32BufferAttribute(phases, 1));
        geometry.setAttribute("phaseSecondary", new THREE.Float32BufferAttribute(phaseSecondaries, 1));
        return geometry;
    };

    return (
        <group>
            {snowConfigs.map((cfg, i) => {
                const geo = useMemo(() => getSnowGeo(cfg.count), [cfg.count]);
                // Clone uniforms to avoid conflicts if needed, though they are shared fine here.
                // We need to inject the specific texture for this batch.
                const localUniforms = useMemo(() => ({
                    ...uniforms,
                    pointTexture: { value: cfg.tex }
                }), [uniforms, cfg.tex]);
                
                return (
                    <points key={i} geometry={geo}>
                        <shaderMaterial
                            uniforms={localUniforms}
                            vertexShader={snowVertexShader}
                            fragmentShader={snowFragmentShader}
                            blending={THREE.AdditiveBlending}
                            depthTest={false}
                            transparent={true}
                            vertexColors={true}
                        />
                    </points>
                );
            })}
        </group>
    );
};

const Ground = ({ uniforms }: { uniforms: any }) => {
    const geo = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const positions: number[] = [];
        const colors: number[] = [];
        const sizes: number[] = [];
        const color = new THREE.Color();

        for (let i = 0; i < 3000; i++) {
            positions.push(rand(-25, 25), 0, rand(-150, 15));
            color.set(randChoice(["#93abd3", "#f2f4c0", "#9ddfd3"]));
            colors.push(color.r, color.g, color.b);
            sizes.push(1);
        }
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute("customColor", new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
        return geometry;
    }, []);

    const localUniforms = useMemo(() => ({
        ...uniforms,
        pointTexture: { value: getSparkTexture() }
    }), [uniforms]);

    return (
        <points geometry={geo} position={[0, -8, 0]}>
            <shaderMaterial
                uniforms={localUniforms}
                vertexShader={planeVertexShader}
                fragmentShader={planeFragmentShader}
                blending={THREE.AdditiveBlending}
                depthTest={false}
                transparent={true}
                vertexColors={true}
            />
        </points>
    );
};

// --- Forest Orchestrator ---

const Forest = () => {
    const totalPoints = 4000;
    const fftSize = 2048;
    const sparkTexture = useMemo(() => getSparkTexture(), []);
    
    // Audio Data
    const tAudioData = useMemo(() => {
        const data = new Uint8Array(fftSize / 2);
        return new THREE.DataTexture(data, fftSize / 2, 1, THREE.RedFormat);
    }, []);

    // Base Uniforms
    const uniforms = useMemo(() => ({
        time: { value: 0.0 },
        step: { value: 0.0 },
        tAudioData: { value: tAudioData },
        pointTexture: { value: sparkTexture }
    }), [tAudioData, sparkTexture]);

    // Tree Geometry (Reusable)
    const treeGeometry = useMemo(() => {
        const geometry = new THREE.BufferGeometry();
        const positions: number[] = [];
        const colors: number[] = [];
        const sizes: number[] = [];
        const phases: number[] = [];
        const mIndexs: number[] = [];
        const color = new THREE.Color();
        const TAU = Math.PI * 2;

        for (let i = 0; i < totalPoints; i++) {
            const t = Math.random();
            const y = map(t, 0, 1, -8, 10);
            const ang = map(t, 0, 1, 0, 6 * TAU) + TAU / 2 * (i % 2);
            const [z, x] = polar(ang, map(t, 0, 1, 5, 0)); // Note: x/z swapped in vanilla logic, preserved here
            const modifier = map(t, 0, 1, 1, 0);

            positions.push(x + rand(-0.3 * modifier, 0.3 * modifier));
            positions.push(y + rand(-0.3 * modifier, 0.3 * modifier));
            positions.push(z + rand(-0.3 * modifier, 0.3 * modifier));

            color.setHSL(map(i, 0, totalPoints, 1.0, 0.0), 1.0, 0.5);
            colors.push(color.r, color.g, color.b);

            phases.push(rand(1000));
            sizes.push(1);
            mIndexs.push(map(i, 0, totalPoints, 1.0, 0.0));
        }

        geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute("size", new THREE.Float32BufferAttribute(sizes, 1));
        geometry.setAttribute("phase", new THREE.Float32BufferAttribute(phases, 1));
        geometry.setAttribute("mIndex", new THREE.Float32BufferAttribute(mIndexs, 1));
        return geometry;
    }, []);

    useFrame(({ clock }) => {
        const time = clock.getElapsedTime() * 1000;
        uniforms.time.value = time;
        uniforms.step.value = (uniforms.step.value + 1) % 1000;

        // Mock audio reaction
        const data = tAudioData.image.data;
        for (let i = 0; i < data.length; i++) {
            const timeVal = Date.now() * 0.002;
            const noise = Math.sin(i * 0.01 + timeVal) * 0.5 + 0.5;
            data[i] = (noise * 100) + (Math.random() * 50);
        }
        tAudioData.needsUpdate = true;
    });

    return (
        <group>
            {/* Render 10 rows of trees */}
            {Array.from({ length: 10 }).map((_, i) => (
                <React.Fragment key={i}>
                    <Tree position={[20, 0, -20 * i]} uniforms={uniforms} geometry={treeGeometry} />
                    <Tree position={[-20, 0, -20 * i]} uniforms={uniforms} geometry={treeGeometry} />
                </React.Fragment>
            ))}
            
            <Snow uniforms={uniforms} />
            <Ground uniforms={uniforms} />
        </group>
    );
};


// --- Fireworks (Previous Logic) ---

const FireworkBurst = ({ 
  position, 
  color, 
  onComplete,
  texture
}: { 
  position: THREE.Vector3, 
  color: THREE.Color, 
  onComplete: () => void,
  texture: THREE.Texture
}) => {
  const particleCount = 150;
  const groupRef = useRef<THREE.Points>(null);
  
  const [positions, velocities, colors, sizes] = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const vel = new Float32Array(particleCount * 3);
    const col = new Float32Array(particleCount * 3);
    const sz = new Float32Array(particleCount);

    const baseColor = new THREE.Color(color);

    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = position.x;
      pos[i * 3 + 1] = position.y;
      pos[i * 3 + 2] = position.z;

      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const speed = randomRange(0.1, 0.4);

      vel[i * 3] = speed * Math.sin(phi) * Math.cos(theta);
      vel[i * 3 + 1] = speed * Math.sin(phi) * Math.sin(theta);
      vel[i * 3 + 2] = speed * Math.cos(phi);

      const variance = 0.1;
      col[i * 3] = baseColor.r + randomRange(-variance, variance);
      col[i * 3 + 1] = baseColor.g + randomRange(-variance, variance);
      col[i * 3 + 2] = baseColor.b + randomRange(-variance, variance);

      sz[i] = randomRange(1.5, 3.5);
    }
    return [pos, vel, col, sz];
  }, [position, color]);

  const lifeRef = useRef(1.0);

  useFrame(() => {
    if (!groupRef.current) return;
    lifeRef.current -= 0.012;
    if (lifeRef.current <= 0) {
      onComplete();
      return;
    }

    const positionsAttr = groupRef.current.geometry.attributes.position;
    for (let i = 0; i < particleCount; i++) {
      positionsAttr.setX(i, positionsAttr.getX(i) + velocities[i * 3]);
      positionsAttr.setY(i, positionsAttr.getY(i) + velocities[i * 3 + 1]);
      positionsAttr.setZ(i, positionsAttr.getZ(i) + velocities[i * 3 + 2]);

      velocities[i * 3 + 1] -= 0.005;
      velocities[i * 3] *= 0.96;
      velocities[i * 3 + 1] *= 0.96;
      velocities[i * 3 + 2] *= 0.96;
    }
    positionsAttr.needsUpdate = true;
    if (groupRef.current.material instanceof THREE.PointsMaterial) {
        groupRef.current.material.opacity = lifeRef.current;
    }
  });

  return (
    <points ref={groupRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleCount} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={particleCount} array={colors} itemSize={3} />
        <bufferAttribute attach="attributes-size" count={particleCount} array={sizes} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        map={texture}
        size={1.0}
        vertexColors
        transparent
        opacity={1}
        depthWrite={false}
        alphaTest={0.01}
        blending={THREE.AdditiveBlending}
        sizeAttenuation={true}
      />
    </points>
  );
};

const FireworksManager = ({ triggerSignal, enableFireworks }: { triggerSignal: number, enableFireworks: boolean }) => {
  const [fireworks, setFireworks] = useState<{id: number, pos: THREE.Vector3, color: THREE.Color}[]>([]);
  const nextId = useRef(0);
  const texture = useMemo(() => getSparkTexture(), []);

  const launchFirework = (force = false) => {
    // Launch fireworks higher up in the sky relative to the trees
    const x = randomRange(-15, 15);
    const y = randomRange(5, 20); // Higher Y
    const z = randomRange(-50, -10); // Further back along the avenue

    const id = nextId.current++;
    const colorHex = randomColor(FIREWORK_COLORS);
    const color = new THREE.Color(colorHex);

    setFireworks(prev => [...prev, { id, pos: new THREE.Vector3(x, y, z), color }]);
  };

  useEffect(() => {
    if (triggerSignal > 0 && enableFireworks) {
        launchFirework(true);
    }
  }, [triggerSignal, enableFireworks]);

  useEffect(() => {
    if (!enableFireworks) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.4) { 
        launchFirework();
      }
    }, 1200); 
    return () => clearInterval(interval);
  }, [enableFireworks]);

  const removeFirework = (id: number) => {
    setFireworks(prev => prev.filter(fw => fw.id !== id));
  };

  return (
    <>
      {fireworks.map(fw => (
        <FireworkBurst
          key={fw.id}
          position={fw.pos}
          color={fw.color}
          onComplete={() => removeFirework(fw.id)}
          texture={texture}
        />
      ))}
    </>
  );
};

// --- Main Scene ---

const FireworkScene: React.FC<FireworkSceneProps> = ({ triggerSignal, enableFireworks }) => {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [-0.09, -2.55, 24.42], fov: 60, rotation: [0.10, -0.003, 0.0004] }}
      gl={{ 
        preserveDrawingBuffer: true,
        antialias: true,
        powerPreference: "high-performance"
      }}
      className="absolute inset-0 z-0 bg-[#020205]"
    >
      <color attach="background" args={['#020205']} />
      
      {/* The Avenue of Trees */}
      <Forest />

      {/* Fireworks Layer */}
      <FireworksManager triggerSignal={triggerSignal} enableFireworks={enableFireworks} />
      
      <EffectComposer enableNormalPass={false}>
        <Bloom 
          luminanceThreshold={0} 
          mipmapBlur 
          intensity={1.2} 
          radius={0.5}
        />
      </EffectComposer>
    </Canvas>
  );
};

export default FireworkScene;
