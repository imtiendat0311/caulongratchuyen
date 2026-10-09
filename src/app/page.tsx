import { Suspense } from "react";
import { BadmintonCalculator } from "@/components/BadmintonCalculator";
import Iridescence from "@/components/Iridescence";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-between relative overflow-hidden">
      {/* Ambient animated Iridescence backdrop from React Bits */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[420px] sm:h-[480px] -z-10 opacity-30 dark:opacity-20 [mask-image:radial-gradient(ellipse_at_top,black_45%,transparent_80%)]"
      >
        <Iridescence
          color={[1, 1, 1]}
          speed={0.8}
          amplitude={0.12}
          mouseReact={true}
        />
      </div>

      <Suspense fallback={<div className="min-h-screen" />}>
        <BadmintonCalculator />
      </Suspense>
    </main>
  );
}
