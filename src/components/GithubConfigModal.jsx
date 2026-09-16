import { useState, useEffect } from 'react';

export default function GithubConfigModal({ isOpen, onClose }) {
  const [token, setToken] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setToken(localStorage.getItem('revisio_gh_token') || '');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('revisio_gh_token', token.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="w-full max-w-md bg-white border-2 border-zinc-900 p-6 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)]">
        
        <div className="flex justify-between items-center border-b-2 border-zinc-900 pb-3 mb-4">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-zinc-800">
            // CLÉ D'ACCÈS GITHUB (PAT)
          </h2>
        </div>

        {saved && (
          <div className="mb-4 p-2.5 bg-emerald-100 border border-emerald-800 text-emerald-950 text-xs font-mono font-bold">
            [OK] Token enregistré avec succès !
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-[11px] font-mono font-bold text-zinc-800 uppercase mb-1">
              Personal Access Token (PAT)
            </label>
            <input
              type="password"
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full bg-zinc-50 border-2 border-zinc-900 px-3 py-2 text-xs font-mono text-zinc-950 focus:outline-none placeholder:text-zinc-400"
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
            />
            <p className="text-[10px] font-mono text-zinc-500 mt-2">
              * Demande à Balint pour le TOKEN.
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="w-full bg-zinc-950 text-white font-mono font-bold text-xs uppercase py-3 border border-zinc-950 hover:bg-black active:translate-y-0.5 transition-all"
            >
              Valider le Token {'->'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}