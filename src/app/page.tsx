import { Suspense } from "react";
import { BadmintonCalculator } from "@/components/BadmintonCalculator";
import GradientWaves from "@/components/GradientWaves";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-between relative overflow-hidden">
      {/* Ambient animated GradientWaves backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[420px] sm:h-[480px] -z-10 opacity-35 dark:opacity-25 [mask-image:radial-gradient(ellipse_at_top,black_45%,transparent_80%)]"
      >
        <GradientWaves
          horizonColor="#5227FF"
          waveColor="#FF9FFC"
          crestColor="#FFFFFF"
          speed={0.4}
          amplitude={2.5}
          waveScale={0.6}
          waveRatio={0.9}
          swell={35}
          turbulence={20}
          tilt={1.11}
          zoom={1.0}
          height={5.5}
          fogDepth={15}
          detail="medium"
          brightness={1.0}
          opacity={1.0}
          mouseInteraction={true}
          parallaxStrength={0.5}
          grain={true}
          grainIntensity={0.05}
        />
      </div>

      <Suspense fallback={<div className="min-h-screen" />}>
        <BadmintonCalculator />
      </Suspense>
    </main>
  );
}

