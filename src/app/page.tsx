import { Suspense } from "react";
import { BadmintonCalculator } from "@/components/BadmintonCalculator";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-between">
      <Suspense fallback={<div className="min-h-screen" />}>
        <BadmintonCalculator />
      </Suspense>
    </main>
  );
}
