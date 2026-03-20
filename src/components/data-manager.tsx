"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import {
  Download,
  Upload,
  RotateCcw,
  AlertTriangle,
  Check,
  FileJson,
  Database,
  Shield,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export function DataManager() {
  const store = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showReset, setShowReset] = useState(false);

  const handleExport = () => {
    const json = store.exportData();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invertrack-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exportado correctamente");
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const json = e.target?.result as string;
      const success = store.importData(json);
      if (success) {
        toast.success("Datos importados correctamente");
      } else {
        toast.error("Error al importar. Verifica el formato del archivo.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleReset = () => {
    store.resetData();
    setShowReset(false);
    toast.success("Datos reiniciados. Recarga la página para comenzar de nuevo.");
    setTimeout(() => window.location.reload(), 1000);
  };

  const stats = {
    accounts: store.accounts.length,
    movements: store.movements.length,
    initialBalances: store.initialBalances.length,
    contributions: store.monthlyContributions.length,
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 max-w-2xl"
    >
      <div>
        <h3 className="section-title">Gestión de datos</h3>
        <p className="text-sm text-surface-500 mt-1">
          Exporta, importa o reinicia tus datos. Todo se guarda localmente en tu
          navegador.
        </p>
      </div>

      {/* Current data stats */}
      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-brand-400" />
          <span className="text-sm font-medium text-surface-800">
            Estado actual
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Cuentas", value: stats.accounts },
            { label: "Movimientos", value: stats.movements },
            { label: "Saldos iniciales", value: stats.initialBalances },
            { label: "Abonos config.", value: stats.contributions },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-2xl font-mono font-semibold text-surface-950">
                {value}
              </p>
              <p className="text-xs text-surface-500">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Export */}
      <div className="glass-card p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center shrink-0">
            <Download className="w-5 h-5 text-brand-400" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-surface-900">
              Exportar backup
            </h4>
            <p className="text-xs text-surface-500 mt-1 mb-3">
              Descarga un archivo JSON con todos tus datos. Guárdalo en un lugar
              seguro.
            </p>
            <button onClick={handleExport} className="btn-primary text-sm">
              <FileJson className="w-4 h-4" />
              Descargar JSON
            </button>
          </div>
        </div>
      </div>

      {/* Import */}
      <div className="glass-card p-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-cyan/10 flex items-center justify-center shrink-0">
            <Upload className="w-5 h-5 text-accent-cyan" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-surface-900">
              Importar backup
            </h4>
            <p className="text-xs text-surface-500 mt-1 mb-3">
              Carga un archivo JSON previamente exportado. Reemplazará todos los
              datos actuales.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={handleImport}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary text-sm"
            >
              <Upload className="w-4 h-4" />
              Cargar archivo
            </button>
          </div>
        </div>
      </div>

      {/* Reset */}
      <div className="glass-card p-5 border-accent-rose/20">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-rose/10 flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5 text-accent-rose" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-medium text-surface-900">
              Reiniciar todo
            </h4>
            <p className="text-xs text-surface-500 mt-1 mb-3">
              Borra todos los datos y vuelve al setup inicial. Esta acción no se
              puede deshacer.
            </p>
            {!showReset ? (
              <button
                onClick={() => setShowReset(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-accent-rose border border-accent-rose/30 hover:bg-accent-rose/10 transition-all"
              >
                <AlertTriangle className="w-4 h-4" />
                Reiniciar datos
              </button>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-accent-rose/5 border border-accent-rose/20">
                <AlertTriangle className="w-5 h-5 text-accent-rose shrink-0" />
                <span className="text-sm text-surface-800">
                  ¿Estás seguro? Se perderán todos los datos.
                </span>
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-lg bg-accent-rose text-white text-sm font-medium hover:bg-accent-rose/80 transition-colors"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setShowReset(false)}
                  className="px-3 py-1.5 rounded-lg text-surface-600 text-sm hover:bg-surface-300/50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Privacy note */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-surface-200/30">
        <Shield className="w-4 h-4 text-surface-500 mt-0.5 shrink-0" />
        <p className="text-xs text-surface-500 leading-relaxed">
          Todos tus datos se almacenan localmente en tu navegador (localStorage).
          Nada se envía a ningún servidor. Los únicos datos que salen de tu
          navegador son las consultas a APIs de mercado (CoinGecko, Yahoo
          Finance) para obtener precios en tiempo real.
        </p>
      </div>
    </motion.div>
  );
}
