# Fixed: White Building Issue

## Problem
The building was appearing white instead of its natural beige/tan color from the GLB file.

## Root Causes
1. **Scene Reuse Conflict**: The GLB scene was being reused without cloning, causing material conflicts
2. **Tone Mapping Location**: Tone mapping was applied in Canvas gl props, which can override materials
3. **Material Preservation**: Materials weren't being properly preserved during shadow setup

## Solutions Applied

### 1. Scene Cloning
```tsx
const { scene } = useGLTF(url);
const clonedScene = useMemo(() => scene.clone(true), [scene]);
```
- Clones the scene with `clone(true)` to deep clone materials
- Prevents conflicts between multiple instances
- Preserves original material properties

### 2. Proper Tone Mapping
```tsx
const { gl } = useThree();

useEffect(() => {
  if (!gl) return;
  gl.toneMapping = NeutralToneMapping;
  gl.toneMappingExposure = 0.1;
  gl.shadowMap.enabled = true;
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
}, [gl]);
```
- Moved tone mapping from Canvas props to useThree hook
- Applied inside the scene component
- Matches BuildingViewer's approach exactly

### 3. Material Preservation
```tsx
clonedScene.traverse((child: any) => {
  if (child.isMesh) {
    child.castShadow = shadowsEnabled;
    child.receiveShadow = shadowsEnabled;
    
    // Only mark for update, don't modify
    if (child.material) {
      child.material.needsUpdate = true;
    }
  }
});
```
- Only marks materials for update
- Doesn't modify material properties
- Preserves original colors and textures

## Result
✅ Building now displays in correct beige/tan color
✅ All materials preserved from GLB file
✅ Shadows work correctly
✅ Matches BuildingViewer appearance exactly
