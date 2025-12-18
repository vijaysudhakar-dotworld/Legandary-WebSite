import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, type RefObject } from "react";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

export const useScrollAnimation = ({
  interactive,
  cameraRef,
  buildingRef,
  controlsRef,
  enabled = true,
}: {
  interactive: boolean;
  cameraRef: RefObject<THREE.PerspectiveCamera>;
  buildingRef: RefObject<THREE.Group>;
  controlsRef: RefObject<any>;
  enabled?: boolean;
}) => {
  useLayoutEffect(() => {
    if (interactive || !enabled) {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      return;
    }

    ScrollTrigger.getAll().forEach((t) => t.kill());

    const timer = setTimeout(() => {
      ScrollTrigger.refresh();

      // --- SECTION TWO (Section 1 -> Section 2) ---
      if (cameraRef.current && controlsRef.current) {
        const tl2 = gsap.timeline({
          scrollTrigger: {
            trigger: "#section-two",
            start: "top bottom",
            end: "center center",
            scrub: 1.5,
            invalidateOnRefresh: true,
          },
        });

        tl2.fromTo(
          cameraRef.current.position,
          {
            x: 13.2678760072932,
            y: 9.54023342452855,
            z: 64.77327507868063,
          },
          {
            x: -19.88818790881988,
            y: 10.0444234224416,
            z: 57.77326188194918,
            ease: "power2.inOut",
            immediateRender: false,
          }
        );

        tl2.fromTo(
          cameraRef.current,
          { fov: 23 },
          {
            fov: 23, 
            ease: "power2.inOut",
            immediateRender: false,
            onUpdate: () => cameraRef.current?.updateProjectionMatrix(),
          },
          0
        );

        tl2.fromTo(
          controlsRef.current.target,
          { x: -18.6, y: 20.9, z: 0 },
          {
            x: 20,
            y: 22.2,
            z: 0,
            ease: "power2.inOut",
            immediateRender: false,
            onUpdate: () => controlsRef.current?.update(),
          },
          0
        );
      }

      // --- SECTION THREE (Section 2 -> Section 3) ---
      // (Placeholder until coords for section 3 are provided, keeping existing logic if any)
      if (cameraRef.current && controlsRef.current && document.getElementById("section-three")) {
        // We can add logic for section 3 here if needed
      }

    }, 50);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, [interactive, enabled, cameraRef, buildingRef, controlsRef]);
};
