import { Suspense } from "react";
import { BadmintonCalculator } from "@/components/BadmintonCalculator";
import SideRays from "@/components/SideRays";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-between relative overflow-hidden">
      {/* Ambient animated SideRays backdrop from React Bits */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 right-0 w-full max-w-6xl h-[460px] sm:h-[540px] -z-10 opacity-70 dark:opacity-50 [mask-image:radial-gradient(ellipse_at_top_right,black_45%,transparent_80%)]"
      >
        <SideRays
          origin="top-right"
          rayColor1="#EAB308"
          rayColor2="#96c8ff"
          speed={2.2}
          intensity={3}
          spread={3}
          tilt={-5}
          saturation={1.4}
          blend={0.7}
          falloff={1.6}
          opacity={0.85}
        />
      </div>

      <Suspense fallback={<div className="min-h-screen" />}>
        <BadmintonCalculator />
      </Suspense>
    </main>
  );
}
