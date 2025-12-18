import { useEffect } from 'react'
import Lenis from 'lenis'
import { useProgress } from '@react-three/drei'
import Loader from './components/Loader'
import SectionOne from './components/SectionOne'
import SectionTwo from './components/SectionTwo'
import BuildingViewer from './components/BuildingViewer'
import ProductionViewer from './components/ProductionViewer'
import SectionThree from './components/SectionThree'

function LoadingScreen() {
  const { active } = useProgress()
  return <Loader isLoading={active} />
}

export default function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [])

  return (
    <>
      {/* <ProductionViewer /> */}
      <BuildingViewer />
  

      
      <div className="relative z-10">
         <div className="pointer-events-auto">
             <SectionOne />
             <SectionTwo /> 
             <SectionThree />
        </div>
      </div>
      <LoadingScreen />
    </>
  )
}