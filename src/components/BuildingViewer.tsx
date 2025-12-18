import { Suspense, useState, useRef, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, useGLTF, Environment } from '@react-three/drei'
import { PerspectiveCamera, Vector3, PCFSoftShadowMap, PCFShadowMap, BasicShadowMap, ReinhardToneMapping, LinearToneMapping, NoToneMapping, ACESFilmicToneMapping, NeutralToneMapping } from 'three'

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

function Scene({ 
  ambientIntensity, ambientColor, hemiIntensity, directionalIntensity, directionalColor, fillIntensity, directionalPos, directionalTarget, buildingPos, buildingRot, buildingScale, envValue, shadowsEnabled, shadowRadius, shadowBias, shadowNormalBias, cameraPos, cameraTarget, fov, controlsRef, onCameraChange, setCameraZoom, setCameraRotate, programmaticRef, rimIntensity, exposure, toneMapping, shadowQuality, shadowResolution, shadowSoftness, shadowDarkness
}: any) {
  const { camera, scene, gl } = useThree()
  // exposure and rim handled via props passed in parent
  const dirLightRef = useRef<any>(null)
  const currentPosRef = useRef<[number, number, number]>(cameraPos)
  const currentTargetRef = useRef<[number, number, number]>(cameraTarget)
  const updateTimeout = useRef<number | null>(null)

  useEffect(() => {
    currentPosRef.current = cameraPos
  }, [cameraPos, cameraTarget])

  // Apply camera position / target only when state changed programmatically
  useEffect(() => {
    if (!camera || !controlsRef?.current) return
    // mark as programmatic so onChange doesn't echo back
    if (programmaticRef) programmaticRef.current = true
    camera.position.set(cameraPos[0], cameraPos[1], cameraPos[2])
    ;(camera as PerspectiveCamera).fov = fov
    camera.updateProjectionMatrix()
    controlsRef.current.target.set(cameraTarget[0], cameraTarget[1], cameraTarget[2])
    controlsRef.current.update()
    // small timeout to allow controls to settle before re-enabling user updates
    window.setTimeout(() => { if (programmaticRef) programmaticRef.current = false }, 50)
  }, [cameraPos, cameraTarget, fov, camera, controlsRef, programmaticRef])

  useEffect(() => {
    return () => { if (updateTimeout.current) window.clearTimeout(updateTimeout.current) }
  }, [])

  // apply exposure to renderer
  useEffect(() => {
    if (!gl) return
    try {
      // tone mapping selection
      if (toneMapping === 'ACES') (gl as any).toneMapping = ACESFilmicToneMapping
      else if (toneMapping === 'Reinhard') (gl as any).toneMapping = ReinhardToneMapping
      else if (toneMapping === 'Linear') (gl as any).toneMapping = LinearToneMapping
      else if (toneMapping === 'Neutral') (gl as any).toneMapping = NeutralToneMapping
      else if (toneMapping === 'None') (gl as any).toneMapping = NoToneMapping
      else (gl as any).toneMapping = ReinhardToneMapping
      ;(gl as any).toneMappingExposure = exposure
      ;(gl as any).shadowMap.enabled = !!shadowsEnabled
      // map shadow quality to shadowMap.type
      if (shadowsEnabled) {
        if (shadowQuality === 'low') (gl as any).shadowMap.type = BasicShadowMap
        else if (shadowQuality === 'medium') (gl as any).shadowMap.type = PCFShadowMap
        else (gl as any).shadowMap.type = PCFSoftShadowMap
      }
    } catch (e) {
      // ignore
    }
  }, [gl, exposure, shadowsEnabled, toneMapping, shadowQuality])

  // update directional light shadow and target via ref (set properties imperatively)
  useEffect(() => {
    const dl = dirLightRef.current
    if (dl) {
      if (dl.shadow && dl.shadow.mapSize) {
        const res = shadowResolution || 2048
        dl.shadow.mapSize.width = res
        dl.shadow.mapSize.height = res
      }
      if (dl.shadow && dl.shadow.camera) {
        dl.shadow.camera.far = 50
        dl.shadow.camera.left = -20
        dl.shadow.camera.right = 20
        dl.shadow.camera.top = 20
        dl.shadow.camera.bottom = -20
        dl.shadow.bias = shadowBias
        dl.shadow.normalBias = shadowNormalBias
        // softness maps to shadow radius
        dl.shadow.radius = shadowSoftness ?? shadowRadius
      }
      if (directionalTarget && dl.target && dl.target.position) {
        dl.target.position.set(directionalTarget[0], directionalTarget[1], directionalTarget[2])
        if (dl.target.updateMatrixWorld) dl.target.updateMatrixWorld()
        // ensure the target is part of the scene so shadows/lighting calculate properly
        try { scene.add(dl.target) } catch (e) { /* already added? ignore */ }
      }
    }
  }, [dirLightRef, directionalTarget, shadowRadius, shadowBias, shadowNormalBias, shadowResolution, shadowSoftness])


  const handleControlsChange = () => {
    if (programmaticRef && programmaticRef.current) return
    const newPos: [number, number, number] = [camera.position.x, camera.position.y, camera.position.z]
    const newTarget: [number, number, number] = [controlsRef.current.target.x, controlsRef.current.target.y, controlsRef.current.target.z]
    const posChanged = newPos.some((v, i) => Math.abs(v - currentPosRef.current[i]) > 0.01)
      const targetChanged = newTarget.some((v, i) => Math.abs(v - currentTargetRef.current[i]) > 0.01)
      if (posChanged || targetChanged) {
        currentPosRef.current = newPos
        currentTargetRef.current = newTarget
        if (onCameraChange) onCameraChange(newPos, newTarget)
        if (setCameraZoom) {
          const dx = newPos[0] - newTarget[0]
          const dy = newPos[1] - newTarget[1]
          const dz = newPos[2] - newTarget[2]
          setCameraZoom(Math.sqrt(dx*dx + dy*dy + dz*dz))
        }
        if (setCameraRotate) {
          setCameraRotate(Math.atan2(newPos[0] - newTarget[0], newPos[2] - newTarget[2]) * 180 / Math.PI)
        }
      }

  }

  return (
    <>
      <ambientLight color={ambientColor} intensity={ambientIntensity * (1 - (shadowDarkness || 0))} />
      <hemisphereLight intensity={hemiIntensity * (1 - (shadowDarkness || 0))} />
      <directionalLight 
        ref={dirLightRef}
        position={directionalPos} 
        intensity={directionalIntensity} 
        castShadow={shadowsEnabled} 
        color={directionalColor}
      
      />
      <pointLight position={[0, 10, 0]} intensity={fillIntensity} />
      {/* rim light to give edge highlight */}
      <pointLight position={[-10, 5, 10]} intensity={rimIntensity} distance={40} />
      <Suspense fallback={null}>
        <Model url="/Outer.glb" position={buildingPos} rotation={buildingRot} scale={buildingScale} shadowsEnabled={shadowsEnabled} />
        <Environment
          preset={envValue}
          background={false}
        />
        {/* ground receiver for shadows */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
          <planeGeometry args={[200, 200]} />
          <meshStandardMaterial color="#777777" metalness={0} roughness={1} />
        </mesh>
      </Suspense>
      <OrbitControls 
        ref={controlsRef} 
        onChange={handleControlsChange}
        enableDamping={false}
        dampingFactor={0.05}
        zoomSpeed={0.5}
      />
    </>
  )
}

export default function BuildingViewer() {
  const [ambientIntensity, setAmbientIntensity] = useState(5.72)
  const [hemiIntensity, setHemiIntensity] = useState(0.43)
  const [directionalIntensity, setDirectionalIntensity] = useState(20)
  const [fillIntensity, setFillIntensity] = useState(0.05)
  const [directionalPos, setDirectionalPos] = useState<[number, number, number]>([15.5, 16, 10.5])
  const [directionalTarget, setDirectionalTarget] = useState<[number, number, number]>([0, 0, 0])
  const [buildingPos, setBuildingPos] = useState<[number, number, number]>([0, 0, 0])
  const [buildingRot, setBuildingRot] = useState<[number, number, number]>([0, 0, 0])
  const [buildingScale, setBuildingScale] = useState<[number, number, number]>([1, 1, 1])
  const [envIntensity, setEnvIntensity] = useState(10.14)
  const [envType, setEnvType] = useState<'preset' | 'file'>('preset')
  const [envValue, setEnvValue] = useState('sunset')
  const [ambientColor, setAmbientColor] = useState('#ffdfd1')
  const [directionalColor, setDirectionalColor] = useState('#ffd4c2')
  const [shadowsEnabled, setShadowsEnabled] = useState(true)
  const [shadowRadius, setShadowRadius] = useState(9.7)
  const [shadowBias, setShadowBias] = useState(-0.001)
  const [shadowNormalBias, setShadowNormalBias] = useState(0.1)
  const [rimIntensity, setRimIntensity] = useState(0)
  const [exposure, setExposure] = useState(0.1)
  // Tone mapping / shadow controls
  const [toneMapping, setToneMapping] = useState<'ACES'|'Reinhard'|'Linear' | 'Neutral'|'None'>('Neutral')
  const [shadowQuality, setShadowQuality] = useState<'low'|'medium'|'high'>('high')
  const [shadowResolution, setShadowResolution] = useState(2048)
  const [shadowSoftness, setShadowSoftness] = useState(10)
  const [shadowDarkness, setShadowDarkness] = useState(0)
  const [cameraPos, setCameraPos] = useState<[number, number, number]>([13.2678760072932, 9.54023342452855, 64.77327507868063])
  const [cameraTarget, setCameraTarget] = useState<[number, number, number]>([-18.6, 20.9, 0])
  const [fov, setFov] = useState(23)
  const [cameraZoom, setCameraZoom] = useState(73.57983044608885)
  const [cameraRotate, setCameraRotate] = useState(26.693160466793145)
  const [currentSection, setCurrentSection] = useState(0)
  const [sectionCameras, setSectionCameras] = useState([
    { pos: [0, 2, 6] as [number, number, number], target: [0, 0, 0] as [number, number, number], zoom: 6, rotate: 0, fov: 50 },
    { pos: [-22.586978292885362, 15.333844260182515, 36.551201138364256] as [number, number, number], target: [32.2, 21.6, 0] as [number, number, number], zoom: 65.24987854880308, rotate: -55.75215935048322, fov: 22 },
    { pos: [0, 2, 6] as [number, number, number], target: [0, 0, 0] as [number, number, number], zoom: 6, rotate: 0, fov: 50 },
    { pos: [0, 2, 6] as [number, number, number], target: [0, 0, 0] as [number, number, number], zoom: 6, rotate: 0, fov: 50 },
    { pos: [0, 2, 6] as [number, number, number], target: [0, 0, 0] as [number, number, number], zoom: 6, rotate: 0, fov: 50 },
    { pos: [0, 2, 6] as [number, number, number], target: [0, 0, 0] as [number, number, number], zoom: 6, rotate: 0, fov: 50 }
  ])
  
  const [showDebugMenu, setShowDebugMenu] = useState(true)
  
  const handleCameraChange = (pos: [number, number, number], target: [number, number, number]) => {
    setCameraPos(pos)
    setCameraTarget(target)
  }

  const controlsRef = useRef<any>(null)
  const programmaticRef = useRef<boolean>(false)

  // removed automatic cameraPos recomputation to avoid feedback loop/jitter

  const copyValues = () => {
    const values = {
      ambientIntensity,
      ambientColor,
      hemiIntensity,
      directionalIntensity,
      directionalColor,
      fillIntensity,
      directionalPos,
      directionalTarget,
      buildingPos,
      buildingRot,
      buildingScale,
      envIntensity,
      envType,
      envValue,
      shadowsEnabled,
      shadowRadius,
      shadowBias,
      shadowNormalBias,
      cameraPos,
      cameraTarget,
      fov,
      cameraZoom,
      cameraRotate,
      sectionCameras
    }
    navigator.clipboard.writeText(JSON.stringify(values, null, 2))
    alert('All values copied to clipboard!')
  }

  const applySunsetPreset = () => {
    setAmbientIntensity(0.3)
    setHemiIntensity(0.7)
    setDirectionalIntensity(1.5)
    setFillIntensity(0.2)
    setDirectionalPos([5, 10, -5])
    setDirectionalTarget([0, 0, 0])
    setEnvType('preset')
    setEnvValue('sunset')
    setEnvIntensity(1.2)
    setShadowsEnabled(true)
    setShadowRadius(12)
    setShadowBias(-0.0002)
    setShadowNormalBias(0.05)
    setFov(60)
  }

  const loadSection = (section: number) => {
    const cam = sectionCameras[section]
    setCameraPos(cam.pos)
    setCameraTarget(cam.target)
    setCameraZoom(cam.zoom)
    setCameraRotate(cam.rotate)
    setFov(cam.fov)
  }

  const saveSection = (section: number) => {
    setSectionCameras(prev => prev.map((s, i) => i === section ? { 
      pos: [...cameraPos], 
      target: [...cameraTarget], 
      zoom: cameraZoom, 
      rotate: cameraRotate,
      fov: fov
    } : s))
    alert(`Section ${section} saved!`)
  }

  const resetAll = () => {
    setAmbientIntensity(0.3)
    setHemiIntensity(0.3)
    setDirectionalIntensity(0.7)
    setFillIntensity(0.2)
    setDirectionalPos([10, 10, 10])
    setDirectionalTarget([0, 0, 0])
    setBuildingPos([0, 0, 0])
    setBuildingRot([0, 0, 0])
    setBuildingScale([1, 1, 1])
    setEnvIntensity(0.6)
    setShadowsEnabled(true)
    setShadowRadius(8)
    setShadowBias(-0.0001)
    setShadowNormalBias(0.04)
    setCameraPos([0, 2, 6])
    setCameraTarget([0, 0, 0])
    setFov(50)
    setCameraZoom(6)
    setCameraRotate(0)
  }

  const CameraControls = () => (
    <div className="fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-black/80 p-3 rounded-lg flex gap-4 items-center text-white font-mono text-sm z-1000">
      <div>
        <div>Camera Pos: [{cameraPos[0].toFixed(2)}, {cameraPos[1].toFixed(2)}, {cameraPos[2].toFixed(2)}]</div>
        <div>Target: [{cameraTarget[0].toFixed(2)}, {cameraTarget[1].toFixed(2)}, {cameraTarget[2].toFixed(2)}]</div>
      </div>
      <div>
        <div>Zoom: {cameraZoom.toFixed(2)}</div>
        <div>Rotate: {cameraRotate.toFixed(1)}°</div>
      </div>
      <div>
        <div>FOV: {fov}°</div>
        <div>Section: {currentSection + 1}/6</div>
      </div>
    </div>
  )

  return (
    <div
      className="fixed top-0 left-0 w-full h-full overflow-hidden z-100 bg-cover bg-center"
      style={{
        backgroundImage: `url('/sun.jpg'), url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='1' height='1'><rect width='100%' height='100%' fill='%2316213e'/></svg>")`
      }}
    >
      <Canvas shadows camera={{ position: cameraPos, fov }}>
        <Scene 
          ambientIntensity={ambientIntensity}
          hemiIntensity={hemiIntensity}
          directionalIntensity={directionalIntensity}
          fillIntensity={fillIntensity}
          directionalPos={directionalPos}
          directionalTarget={directionalTarget}
          buildingPos={buildingPos}
          buildingRot={buildingRot}
          buildingScale={buildingScale}
          envIntensity={envIntensity}
          envType={envType}
          envValue={envValue}
          shadowsEnabled={shadowsEnabled}
          shadowRadius={shadowRadius}
          shadowBias={shadowBias}
          shadowNormalBias={shadowNormalBias}
          cameraPos={cameraPos}
          cameraTarget={cameraTarget}
          fov={fov}
          controlsRef={controlsRef}
          onCameraChange={handleCameraChange}
          setCameraZoom={setCameraZoom}
          setCameraRotate={setCameraRotate}
          programmaticRef={programmaticRef}
          rimIntensity={rimIntensity}
          exposure={exposure}
          toneMapping={toneMapping}
          ambientColor={ambientColor}
          directionalColor={directionalColor}
          shadowQuality={shadowQuality}
          shadowResolution={shadowResolution}
          shadowSoftness={shadowSoftness}
          shadowDarkness={shadowDarkness}
        />
      </Canvas>

      <CameraControls />

      {/* Toggle Button */}
      <button
        onClick={() => setShowDebugMenu(!showDebugMenu)}
        className={`fixed top-5 ${showDebugMenu ? 'left-80' : 'left-5'} bg-[#333]/20 text-white border-0 px-4 py-2 rounded cursor-pointer z-100 transition-all duration-300 ease-in-out`}
      >
        {showDebugMenu ? 'Hide Debug' : 'Show Debug'}
      </button>

      {/* Debug Menu */}
      {showDebugMenu && (
        <div className="fixed right-0 top-0 w-80 h-full bg-linear-to-br from-[#1a1a2e] to-[#16213e] text-[#e6e6e6] p-4 overflow-y-auto text-sm border-l border-l-[#2d3748] shadow-[ -5px_0_20px_rgba(0,0,0,0.5) ] z-1000">
          <h3 className="mt-0 mb-5 text-white border-b border-[#4a5568] pb-2 text-center">
            🛠️ Debug Menu
          </h3>
          
          {/* Quick Actions */}
          <div className="mb-5 p-4 bg-[rgba(45,55,72,0.5)] rounded-lg border border-[#4a5568]">
            <h4 className="m-0 mb-2 text-[#90cdf4]">Quick Actions</h4>
            <div className="flex flex-wrap gap-2">
              <button onClick={copyValues} className="flex-1 px-3 py-2 bg-[#2d3748] border border-[#4a5568] rounded text-white cursor-pointer min-w-30">📋 Copy All</button>
              <button onClick={applySunsetPreset} className="flex-1 px-3 py-2 bg-[#2d3748] border border-[#4a5568] rounded text-white cursor-pointer min-w-30">🌅 Sunset Preset</button>
              <button onClick={resetAll} className="flex-1 px-3 py-2 bg-[#742a2a] border border-[#9b2c2c] rounded text-white cursor-pointer min-w-30">🔄 Reset All</button>
            </div>
          </div>

          {/* Sections */}
          <div className="mb-5 p-4 bg-[rgba(45,55,72,0.5)] rounded-lg border border-[#4a5568]">
            <h4 className="m-0 mb-2 text-[#90cdf4]">📸 Sections</h4>
            <select
              value={currentSection}
              onChange={e => {
                const section = +e.target.value
                setCurrentSection(section)
                loadSection(section)
              }}
              className="w-full p-2 bg-[#2d3748] border border-[#4a5568] rounded text-white mb-2"
            >
              {Array(6).fill(0).map((_, i) => (
                <option key={i} value={i}>Section {i + 1} - Camera Position</option>
              ))}
            </select>
            <button onClick={() => saveSection(currentSection)} className="w-full px-3 py-2 bg-[#2d3748] border border-[#4a5568] rounded text-white cursor-pointer">💾 Save Current to Section {currentSection + 1}</button>
          </div>

          {/* Lighting */}
          <div className="mb-5 p-4 bg-[rgba(45,55,72,0.5)] rounded-lg border border-[#4a5568]">
            <h4 className="m-0 mb-2 text-[#90cdf4]">💡 Lighting</h4>
            
            {['ambientIntensity', 'hemiIntensity', 'directionalIntensity', 'fillIntensity', 'envIntensity'].map((key, index) => {
              const labels = ['Ambient', 'Hemisphere', 'Directional', 'Fill', 'HDRI Intensity']
              const values = [ambientIntensity, hemiIntensity, directionalIntensity, fillIntensity, envIntensity]
              const setters = [setAmbientIntensity, setHemiIntensity, setDirectionalIntensity, setFillIntensity, setEnvIntensity]
              const maxValues = [10, 5, 20, 5, 20]
              
              return (
                <div key={key} className="mb-4">
                  <div className="flex justify-between mb-1">
                    <label className="text-[#cbd5e0]">{labels[index]}</label>
                    <span className="text-white font-bold">{values[index].toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max={maxValues[index]}
                    step="0.01"
                    value={values[index]}
                    onChange={e => setters[index](+e.target.value)}
                    className="w-full h-1.5 rounded outline-none appearance-none bg-linear-to-r from-[#2b6cb0] to-[#90cdf4]"
                  />
                </div>
              )
            })}

            <div className="mt-3">
              <div className="flex justify-between mb-1">
                <label className="text-[#cbd5e0]">Rim Light</label>
                <span className="text-white font-bold">{rimIntensity.toFixed(2)}</span>
              </div>
              <input type="range" min={0} max={5} step={0.01} value={rimIntensity} onChange={e => setRimIntensity(+e.target.value)} className="w-full h-1.5 appearance-none bg-linear-to-r from-[#f6ad55] to-[#ed64a6]" />
            </div>

            <div className="mt-3">
              <div className="flex justify-between mb-1">
                <label className="text-[#cbd5e0]">Exposure</label>
                <span className="text-white font-bold">{exposure.toFixed(2)}</span>
              </div>
              <input type="range" min={0.01} max={5} step={0.01} value={exposure} onChange={e => setExposure(+e.target.value)} className="w-full h-1.5 appearance-none bg-linear-to-r from-[#ffd166] to-[#f0a500]" />
            </div>

            <div className="mt-2">
              <div className="flex justify-between mb-1">
                <label className="text-[#cbd5e0]">Tone Mapping</label>
                <span className="text-white font-bold">{toneMapping}</span>
              </div>
              <select value={toneMapping} onChange={e => setToneMapping(e.target.value as any)} className="w-full p-2 bg-[#2d3748] border border-[#4a5568] rounded text-white">
                <option value="Neutral">Neutral</option>
              </select>
            </div>

            <div className="mt-4">
              <div className="text-[#cbd5e0] mb-2">Directional Light Position</div>
              <div className="grid grid-cols-3 gap-2">
                {['X', 'Y', 'Z'].map((axis, idx) => (
                  <div key={axis}>
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-xs text-[#a0aec0]">{axis}</div>
                      <div className="text-sm text-white">{directionalPos[idx].toFixed(1)}</div>
                    </div>
                    <input
                      type="range"
                      min={-50}
                      max={50}
                      step={0.5}
                      value={directionalPos[idx]}
                      onChange={e => {
                        const newPos = [...directionalPos] as [number, number, number]
                        newPos[idx] = +e.target.value
                        setDirectionalPos(newPos)
                      }}
                      className="w-full h-1.5 appearance-none bg-linear-to-r from-[#2d3748] to-[#4a5568] rounded"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-2">
              <div className="text-[#cbd5e0] mb-2">Environment</div>
              <select
                value={envValue}
                onChange={e => setEnvValue(e.target.value)}
                className="w-full p-2 bg-[#2d3748] border border-[#4a5568] rounded text-white"
              >
                <option value="sunset">Sunset</option>
                <option value="dawn">Dawn</option>
                <option value="night">Night</option>
                <option value="warehouse">Warehouse</option>
                <option value="park">Park</option>
              </select>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div>
                <div className="text-[#cbd5e0] mb-1">Ambient Color</div>
                <input type="color" value={ambientColor} onChange={e => setAmbientColor(e.target.value)} className="w-full h-8 p-0 border-0 rounded" />
              </div>
              <div>
                <div className="text-[#cbd5e0] mb-1">Directional Color</div>
                <input type="color" value={directionalColor} onChange={e => setDirectionalColor(e.target.value)} className="w-full h-8 p-0 border-0 rounded" />
              </div>
            </div>
          </div>

          {/* Shadows */}
          <div className="mb-5 p-4 bg-[rgba(45,55,72,0.5)] rounded-lg border border-[#4a5568]">
            <h4 className="m-0 mb-2 text-[#90cdf4]">🌑 Shadows</h4>

            <div className="flex items-center justify-between mb-4">
              <label className="text-[#cbd5e0]">Enabled</label>
              <input
                type="checkbox"
                checked={shadowsEnabled}
                onChange={e => setShadowsEnabled(e.target.checked)}
                className="transform scale-110"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div>
                <div className="text-[#cbd5e0] mb-1">Quality</div>
                <select value={shadowQuality} onChange={e => setShadowQuality(e.target.value as any)} className="w-full p-2 bg-[#2d3748] border border-[#4a5568] rounded text-white">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <div className="text-[#cbd5e0] mb-1">Resolution</div>
                <select value={shadowResolution} onChange={e => setShadowResolution(+e.target.value)} className="w-full p-2 bg-[#2d3748] border border-[#4a5568] rounded text-white">
                  <option value={512}>512</option>
                  <option value={1024}>1024</option>
                  <option value={2048}>2048</option>
                  <option value={4096}>4096</option>
                </select>
              </div>
            </div>

            <div className="mb-3">
              <div className="flex justify-between mb-1">
                <label className="text-[#cbd5e0]">Softness</label>
                <span className="text-white font-bold">{shadowSoftness.toFixed(1)}</span>
              </div>
              <input type="range" min={0} max={20} step={0.1} value={shadowSoftness} onChange={e => { setShadowSoftness(+e.target.value); setShadowRadius(+e.target.value); }} className="w-full h-1.5 appearance-none bg-linear-to-r from-[#9f7aea] to-[#6b46c1]" />
            </div>

            <div className="mb-3">
              <div className="flex justify-between mb-1">
                <label className="text-[#cbd5e0]">Shadow Darkness</label>
                <span className="text-white font-bold">{shadowDarkness.toFixed(2)}</span>
              </div>
              <input type="range" min={0} max={1} step={0.01} value={shadowDarkness} onChange={e => setShadowDarkness(+e.target.value)} className="w-full h-1.5 appearance-none bg-linear-to-r from-[#4a5568] to-[#2d3748]" />
            </div>

            {[
              { label: 'Radius', value: shadowRadius, setter: setShadowRadius, min: 0, max: 20, step: 1 },
              { label: 'Bias', value: shadowBias, setter: setShadowBias, min: -0.001, max: 0.001, step: 0.0001 },
              { label: 'Normal Bias', value: shadowNormalBias, setter: setShadowNormalBias, min: 0, max: 0.1, step: 0.01 }
            ].map((item, idx) => (
              <div key={idx} className="mb-4">
                <div className="flex justify-between mb-1">
                  <label className="text-[#cbd5e0]">{item.label}</label>
                  <span className="text-white font-bold">{item.value.toFixed(4)}</span>
                </div>
                <input
                  type="range"
                  min={item.min}
                  max={item.max}
                  step={item.step}
                  value={item.value}
                  onChange={e => item.setter(+e.target.value)}
                  className="w-full h-1.5 appearance-none bg-linear-to-r from-[#2d3748] to-[#4a5568] rounded"
                />
              </div>
            ))}
          </div>

          {/* Scene Layout */}
          <div className="mb-5 p-4 bg-[rgba(45,55,72,0.5)] rounded-lg border border-[#4a5568]">
            <h4 className="m-0 mb-2 text-[#90cdf4]">🏗️ Scene Layout</h4>

            {[
              { label: 'Position', value: buildingPos, setter: setBuildingPos, step: 0.1 },
              { label: 'Rotation', value: buildingRot, setter: setBuildingRot, step: 1 },
              { label: 'Scale', value: buildingScale, setter: setBuildingScale, step: 0.1 }
            ].map((item, idx) => (
              <div key={idx} className="mb-4">
                <div className="text-[#cbd5e0] mb-2">{item.label}</div>
                <div className="grid grid-cols-3 gap-2">
                  {['X', 'Y', 'Z'].map((axis, axisIdx) => (
                    <div key={axis}>
                      <div className="text-xs text-[#a0aec0] mb-1">{axis}</div>
                      <input
                        type="number"
                        step={item.step}
                        value={item.value[axisIdx]}
                        onChange={e => {
                          const newValue = [...item.value] as [number, number, number]
                          newValue[axisIdx] = +e.target.value
                          item.setter(newValue)
                        }}
                        className="w-full p-1.5 bg-[#2d3748] border border-[#4a5568] rounded text-white"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Camera */}
          <div className="p-4 bg-[rgba(45,55,72,0.5)] rounded-lg border border-[#4a5568]">
            <h4 className="m-0 mb-2 text-[#90cdf4]">📷 Camera</h4>

            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <label className="text-[#cbd5e0]">Field of View</label>
                <span className="text-white font-bold">{fov}°</span>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                value={fov}
                onChange={e => setFov(+e.target.value)}
                className="w-full h-1.5 appearance-none bg-linear-to-r from-[#805ad5] to-[#d6bcfa] rounded"
              />
            </div>

            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <label className="text-[#cbd5e0]">Zoom (Distance)</label>
                <span className="text-white font-bold">{cameraZoom.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="0.1"
                value={cameraZoom}
                onChange={e => {
                  const newZoom = +e.target.value
                  const dir = new Vector3(...cameraPos).sub(new Vector3(...cameraTarget))
                  const length = dir.length() || 1
                  const elevation = Math.asin(Math.max(-1, Math.min(1, dir.y / length)))
                  const azimuthRad = cameraRotate * Math.PI / 180
                  const x = Math.sin(azimuthRad) * Math.cos(elevation)
                  const z = Math.cos(azimuthRad) * Math.cos(elevation)
                  const y = Math.sin(elevation)
                  const newPos = new Vector3(...cameraTarget).add(new Vector3(x, y, z).multiplyScalar(newZoom))
                  programmaticRef.current = true
                  setCameraZoom(newZoom)
                  setCameraPos([newPos.x, newPos.y, newPos.z])
                }}
                className="w-full h-1.5 appearance-none bg-linear-to-r from-[#805ad5] to-[#d6bcfa] rounded"
              />
            </div>

            <div className="mb-4">
              <div className="flex justify-between mb-1">
                <label className="text-[#cbd5e0]">Rotation (Azimuth)</label>
                <span className="text-white font-bold">{cameraRotate.toFixed(1)}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={cameraRotate}
                onChange={e => {
                  const newRotate = +e.target.value
                  const dir = new Vector3(...cameraPos).sub(new Vector3(...cameraTarget))
                  const length = dir.length() || 1
                  const elevation = Math.asin(Math.max(-1, Math.min(1, dir.y / length)))
                  const azimuthRad = newRotate * Math.PI / 180
                  const x = Math.sin(azimuthRad) * Math.cos(elevation)
                  const z = Math.cos(azimuthRad) * Math.cos(elevation)
                  const y = Math.sin(elevation)
                  const newPos = new Vector3(...cameraTarget).add(new Vector3(x, y, z).multiplyScalar(cameraZoom))
                  programmaticRef.current = true
                  setCameraRotate(newRotate)
                  setCameraPos([newPos.x, newPos.y, newPos.z])
                }}
                className="w-full h-1.5 appearance-none bg-linear-to-r from-[#805ad5] to-[#d6bcfa] rounded"
              />
            </div>

            <div className="mb-3">
              <div className="text-[#cbd5e0] mb-2">Position</div>
              <div className="grid grid-cols-3 gap-2">
                {['X', 'Y', 'Z'].map((axis, idx) => (
                  <div key={axis}>
                    <div className="text-xs text-[#a0aec0] mb-1">{axis}</div>
                    <input
                      type="number"
                      step="0.1"
                      value={cameraPos[idx]}
                      onChange={e => {
                        const newPos = [...cameraPos] as [number, number, number]
                        newPos[idx] = +e.target.value
                        setCameraPos(newPos)
                      }}
                      className="w-full p-1.5 bg-[#2d3748] border border-[#4a5568] rounded text-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[#cbd5e0] mb-2">Target</div>
              <div className="grid grid-cols-3 gap-2">
                {['X', 'Y', 'Z'].map((axis, idx) => (
                  <div key={axis}>
                    <div className="text-xs text-[#a0aec0] mb-1">{axis}</div>
                    <input
                      type="number"
                      step="0.1"
                      value={cameraTarget[idx]}
                      onChange={e => {
                        const newTarget = [...cameraTarget] as [number, number, number]
                        newTarget[idx] = +e.target.value
                        setCameraTarget(newTarget)
                      }}
                      className="w-full p-1.5 bg-[#2d3748] border border-[#4a5568] rounded text-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

useGLTF.preload && useGLTF.preload('/Outer.glb')