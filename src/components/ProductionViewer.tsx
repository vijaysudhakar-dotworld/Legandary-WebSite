import { Suspense, useRef, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
import { PerspectiveCamera, PCFSoftShadowMap, PCFShadowMap, BasicShadowMap, ReinhardToneMapping, LinearToneMapping, NoToneMapping, ACESFilmicToneMapping, NeutralToneMapping } from 'three'

function Model({ url, position, rotation, scale, shadowsEnabled }: { url: string, position: [number, number, number], rotation: [number, number, number], scale: [number, number, number], shadowsEnabled: boolean }) {
  const gltf = useGLTF(url)

  useEffect(() => {
    if (!gltf || !gltf.scene) return
    gltf.scene.traverse((child: any) => {
      if (child.isMesh) {
        child.castShadow = shadowsEnabled
        child.receiveShadow = shadowsEnabled
        if (child.material) child.material.needsUpdate = true
      }
    })
  }, [gltf, shadowsEnabled])
  
  return <primitive object={gltf.scene} position={position} rotation={rotation} scale={scale} />
}

function Scene() {
  const { camera, scene, gl } = useThree()
  const dirLightRef = useRef<any>(null)
  
  // Hardcoded defaults from BuildingViewer
  const config = {
    ambientIntensity: 5.72,
    hemiIntensity: 0.43,
    directionalIntensity: 20,
    fillIntensity: 0.05,
    directionalPos: [15.5, 16, 10.5] as [number, number, number],
    directionalTarget: [0, 0, 0] as [number, number, number],
    buildingPos: [0, 0, 0] as [number, number, number],
    buildingRot: [0, 0, 0] as [number, number, number],
    buildingScale: [1, 1, 1] as [number, number, number],
    envIntensity: 10.14,
    envValue: 'sunset',
    ambientColor: '#ffdfd1',
    directionalColor: '#ffd4c2',
    shadowsEnabled: true,
    shadowRadius: 9.7,
    shadowBias: -0.001,
    shadowNormalBias: 0.1,
    exposure: 0.1,
    toneMapping: 'Neutral',
    shadowQuality: 'high',
    shadowResolution: 2048,
    shadowSoftness: 10,
    shadowDarkness: 0,
    cameraPos: [13.2678760072932, 9.54023342452855, 64.77327507868063] as [number, number, number],
    cameraTarget: [-18.6, 20.9, 0] as [number, number, number],
    fov: 23
  }

  // Initial camera setup
  useEffect(() => {
    if (!camera) return
    camera.position.set(config.cameraPos[0], config.cameraPos[1], config.cameraPos[2])
    ;(camera as PerspectiveCamera).fov = config.fov
    camera.updateProjectionMatrix()
  }, [camera])

  // Apply renderer settings
  useEffect(() => {
    if (!gl) return
    try {
      if (config.toneMapping === 'ACES') (gl as any).toneMapping = ACESFilmicToneMapping
      else if (config.toneMapping === 'Reinhard') (gl as any).toneMapping = ReinhardToneMapping
      else if (config.toneMapping === 'Linear') (gl as any).toneMapping = LinearToneMapping
      else if (config.toneMapping === 'Neutral') (gl as any).toneMapping = NeutralToneMapping
      else if (config.toneMapping === 'None') (gl as any).toneMapping = NoToneMapping
      else (gl as any).toneMapping = ReinhardToneMapping
      
      ;(gl as any).toneMappingExposure = config.exposure
      ;(gl as any).shadowMap.enabled = !!config.shadowsEnabled
      
      if (config.shadowsEnabled) {
        if (config.shadowQuality === 'low') (gl as any).shadowMap.type = BasicShadowMap
        else if (config.shadowQuality === 'medium') (gl as any).shadowMap.type = PCFShadowMap
        else (gl as any).shadowMap.type = PCFSoftShadowMap
      }
    } catch (e) {
      // ignore
    }
  }, [gl])

  // Update directional light
  useEffect(() => {
    const dl = dirLightRef.current
    if (dl) {
      if (dl.shadow && dl.shadow.mapSize) {
        const res = config.shadowResolution || 2048
        dl.shadow.mapSize.width = res
        dl.shadow.mapSize.height = res
      }
      if (dl.shadow && dl.shadow.camera) {
        dl.shadow.camera.far = 50
        dl.shadow.camera.left = -20
        dl.shadow.camera.right = 20
        dl.shadow.camera.top = 20
        dl.shadow.camera.bottom = -20
        dl.shadow.bias = config.shadowBias
        dl.shadow.normalBias = config.shadowNormalBias
        dl.shadow.radius = config.shadowSoftness ?? config.shadowRadius
      }
      if (config.directionalTarget && dl.target && dl.target.position) {
        dl.target.position.set(config.directionalTarget[0], config.directionalTarget[1], config.directionalTarget[2])
        if (dl.target.updateMatrixWorld) dl.target.updateMatrixWorld()
        try { scene.add(dl.target) } catch (e) { /* already added? */ }
      }
    }
  }, [dirLightRef])

  return (
    <>
      <ambientLight color={config.ambientColor} intensity={config.ambientIntensity * (1 - (config.shadowDarkness || 0))} />
      <hemisphereLight intensity={config.hemiIntensity * (1 - (config.shadowDarkness || 0))} />
      <directionalLight 
        ref={dirLightRef}
        position={config.directionalPos} 
        intensity={config.directionalIntensity} 
        castShadow={config.shadowsEnabled} 
        color={config.directionalColor}
      />
      <pointLight position={[0, 10, 0]} intensity={config.fillIntensity} />
      <pointLight position={[-10, 5, 10]} intensity={0} distance={40} />
      
      <Suspense fallback={null}>
        <Model 
          url="/Outer.glb" 
          position={config.buildingPos} 
          rotation={config.buildingRot} 
          scale={config.buildingScale} 
          shadowsEnabled={config.shadowsEnabled} 
        />
        <Environment preset={config.envValue as any} background={false} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#777777" metalness={0} roughness={1} />
        </mesh>
      </Suspense>
      
      <OrbitControls 
        target={config.cameraTarget}
        enableDamping={false}
        dampingFactor={0.05}
        zoomSpeed={0.5}
      />
    </>
  )
}

export default function ProductionViewer() {
  return (
    <div
      className="fixed top-0 left-0 w-full h-full overflow-hidden z-1 bg-cover bg-center"
      style={{
        backgroundImage: `url('/sun.jpg'), url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'><rect width='100%' height='100%' fill='%2316213e'/></svg>")`
      }}
    >
      <Canvas 
        shadows 
        camera={{ 
          position: [13.2678760072932, 9.54023342452855, 64.77327507868063], 
          fov: 23 
        }}
      >
        <Scene />
      </Canvas>
    </div>
  )
}

useGLTF.preload && useGLTF.preload('/Outer.glb')
