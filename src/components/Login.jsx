import { useState } from 'react';
import { loginUser } from '../services/authService';

export default function Login({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await loginUser(username, password);
      if (user) {
        onLoginSuccess(user);
      } else {
        setError('Identifiant ou mot de passe incorrect.');
      }
    } catch (err) {
      setError('Erreur d\'authentification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center bg-zinc-100 p-4 sm:p-6 lg:p-8">
      
      {/* Container Principal Responsive */}
      <div className="w-full max-w-md bg-white border-2 border-zinc-900 rounded-none p-6 sm:p-10 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
        
        {/* En-tête avec Logo Limayrac & Titre */}
        <div className="mb-8 border-b-2 border-zinc-900 pb-6 text-center">
          <div className="flex justify-center items-center mb-6">
            <img 
              src="/logo-limayrac.png" 
              alt="Institut Limayrac" 
              className="h-14 sm:h-16 w-auto object-contain"
            />
          </div>

          <div className="flex items-center justify-center gap-3">
            <h1 style={{ color: '#09090b' }} className="text-2xl sm:text-3xl tracking-tigh font-black uppercase">
              REVIS<span className="font-light text-zinc-700">IO</span>
            </h1>
            <span className="text-xs font-mono font-bold border border-zinc-900 px-2 py-0.5 bg-zinc-100 text-zinc-900">
              v1.0
            </span>
          </div>
          <p className="text-xs font-mono font-semibold text-zinc-700 tracking-wider uppercase mt-2">
            Plateforme d'entraînement & révision
          </p>
        </div>

        {/* Message d'erreur haut contraste */}
        {error && (
          <div className="mb-6 p-3 bg-red-100 border-2 border-red-700 text-red-950 text-xs font-mono font-bold">
            [!] {error}
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-mono font-bold text-zinc-900 uppercase tracking-wider mb-2">
              Identifiant
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white border-2 border-zinc-900 rounded-none px-4 py-3 text-base sm:text-sm text-zinc-950 font-medium placeholder:text-zinc-500 focus:outline-none focus:bg-zinc-50 transition-colors"
              placeholder="ex: etudiant1"
            />
          </div>

          <div>
            <label className="block text-xs font-mono font-bold text-zinc-900 uppercase tracking-wider mb-2">
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white border-2 border-zinc-900 rounded-none px-4 py-3 text-base sm:text-sm text-zinc-950 font-medium placeholder:text-zinc-500 focus:outline-none focus:bg-zinc-50 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 hover:bg-black active:translate-y-0.5 text-white font-mono font-bold text-xs uppercase tracking-widest min-h-[48px] py-3 rounded-none transition-all disabled:opacity-50"
          >
            {loading ? 'Vérification...' : 'Se connecter ->'}
          </button>
        </form>

        {/* Raccourcis Dev
        <div className="mt-8 pt-5 border-t border-zinc-300 text-xs font-mono text-zinc-700 flex flex-wrap justify-between items-center gap-2">
          <span className="font-bold">COMPTES TEST :</span>
          <div className="space-x-3">
            <button
              type="button"
              onClick={() => { setUsername('etudiant1'); setPassword('admin'); }}
              className="font-semibold text-zinc-900 underline hover:bg-zinc-200 px-1 py-0.5"
            >
              Élève
            </button>
            <button
              type="button"
              onClick={() => { setUsername('admin'); setPassword('admin'); }}
              className="font-bold text-zinc-950 underline hover:bg-zinc-200 px-1 py-0.5"
            >
              Admin
            </button>
          </div>
        </div> */}

      </div>
    </div>
  );
}