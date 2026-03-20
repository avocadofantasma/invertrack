"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/lib/store";
import { SetupWizard } from "@/components/setup-wizard";
import { Dashboard } from "@/components/dashboard";

export default function Home() {
  const [hydrated, setHydrated] = useState(false);
  const hydrate = useStore((s) => s.hydrate);
  const setupComplete = useStore((s) => s.setupComplete);

  useEffect(() => {
    hydrate();
    setHydrated(true);
  }, [hydrate]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-surface-600 font-body text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!setupComplete) {
    return <SetupWizard />;
  }

  return <Dashboard />;
}
