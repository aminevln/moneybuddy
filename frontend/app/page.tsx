/**
 * Pagina home di MoneyBuddy.
 * 
 * Per ora una landing minimale che verifica:
 * - Tailwind CSS funziona
 * - Il setup è completo
 * 
 * Nello step successivo aggiungeremo la chiamata al backend.
 */

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-md w-full bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-white mb-2">
          MoneyBuddy
        </h1>
        <p className="text-slate-400 mb-6">
          Il tuo assistente finanziario con AI
        </p>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
            <span className="text-slate-300">Backend</span>
            <span className="text-slate-500 text-sm">verifica in arrivo...</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
            <span className="text-slate-300">Database</span>
            <span className="text-slate-500 text-sm">verifica in arrivo...</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-6 text-center">
          Fase 1 · Setup iniziale
        </p>
      </div>
    </main>
  );
}