import { useState, useEffect } from 'react';
import { fetchUsersFromGithub } from '../services/authService';
import { fetchCoursesFromGithub } from '../services/courseService';

export default function Hub({ user, onLogout, onSelectCategory, onStartRandom, onUserUpdate }) {
  const [courses, setCourses] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(user);
  const [showCredits, setShowCredits] = useState(false);

  useEffect(() => {
    async function loadHubData() {
      try {
        const [coursesData, freshUsers] = await Promise.all([
          fetchCoursesFromGithub(),
          fetchUsersFromGithub()
        ]);

        setCourses(coursesData);

        if (freshUsers && freshUsers.length > 0) {
          const sortedUsers = [...freshUsers].sort((a, b) => (b.pts || 0) - (a.pts || 0));
          setLeaderboard(sortedUsers);

          const freshUser = freshUsers.find(
            (u) => u.id === user.id || u.username === user.username
          );

          if (freshUser) {
            const { passwordHash, ...sessionUser } = freshUser;
            setCurrentUser(sessionUser);
            localStorage.setItem('revisio_session', JSON.stringify(sessionUser));
            if (onUserUpdate) onUserUpdate(sessionUser);
          }
        }
      } catch (err) {
        console.error('Erreur lors de la synchronisation du Hub :', err);
      } finally {
        setLoading(false);
      }
    }

    loadHubData();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950 font-sans p-4 sm:p-6 lg:p-8 relative">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8 pb-12">
        
        {/* Navigation & Profil */}
        <header className="bg-white border-2 border-zinc-900 p-4 sm:p-6 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <img 
              src="/logo-limayrac.png" 
              alt="Institut Limayrac" 
              className="h-10 w-auto object-contain"
            />
            <div>
              <h1 style={{ color: '#09090b' }} className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                REVIS<span className="font-light text-zinc-700">IO</span>
              </h1>
              <p className="text-xs font-mono font-bold text-zinc-600">
                ÉLÈVE : <span className="text-zinc-950 underline">{currentUser.username}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t-2 sm:border-t-0 border-zinc-900 pt-3 sm:pt-0">
            <div className="bg-zinc-100 border border-zinc-900 px-3 py-1.5 font-mono text-xs">
              <span className="font-bold text-zinc-600">TITRE:</span>{" "}
              <span className="font-black text-zinc-950">{currentUser.title || 'Débutant'}</span>
            </div>
            
            <div className="bg-zinc-950 text-white border border-zinc-950 px-3 py-1.5 font-mono text-xs font-bold">
              {currentUser.pts || 0} PTS
            </div>

            <button
              onClick={onLogout}
              className="bg-white hover:bg-zinc-200 border-2 border-zinc-900 text-zinc-950 font-mono font-bold text-xs uppercase px-3 py-1.5 active:translate-y-0.5 transition-all"
            >
              Quitter
            </button>
          </div>
        </header>

        {/* Classement */}
        <section className="bg-white border-2 border-zinc-900 p-5 sm:p-6 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] space-y-4">
          <div className="flex justify-between items-center border-b-2 border-zinc-900 pb-2">
            <h2 style={{ color: '#09090b' }} className="text-base font-mono font-bold uppercase tracking-wide">
              // CLASSEMENT DE LA PROMOTION
            </h2>
            <span className="text-xs font-mono font-semibold text-zinc-600">
              {leaderboard.length} ÉLÈVES INSCRITS
            </span>
          </div>

          {loading ? (
            <div className="p-4 text-center font-mono font-bold text-xs text-zinc-500">
              CHARGEMENT DU CLASSEMENT...
            </div>
          ) : (
            <div className="space-y-2 font-mono text-xs h-68 overflow-auto">
              {leaderboard.map((u, index) => {
                const isSelf = u.username === currentUser.username;
                return (
                  <div
                    key={u.id || index}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-2.5 border-2 gap-2 sm:gap-4 transition-all ${
                      isSelf 
                        ? 'bg-zinc-200 border-zinc-950 font-black shadow-[2px_2px_0px_0px_rgba(24,24,27,1)]' 
                        : 'bg-zinc-50 border-zinc-900 hover:bg-zinc-100'
                    }`}
                  >
                    {/* Position et Pseudo */}
                    <div className="flex items-center gap-3">
                      <span className={`w-7 text-center font-black py-0.5 border border-zinc-900 ${
                        index === 0 
                          ? 'bg-yellow-400 text-zinc-950' 
                          : index === 1 
                          ? 'bg-zinc-300 text-zinc-950' 
                          : index === 2 
                          ? 'bg-amber-600 text-white' 
                          : 'bg-zinc-950 text-white'
                      }`}>
                        #{index + 1}
                      </span>
                      <span className="text-zinc-950 uppercase font-bold">{u.username}</span>
                      {isSelf && (
                        <span className="text-[10px] bg-zinc-950 text-white px-1.5 py-0.5 font-bold tracking-wider">
                          MOI
                        </span>
                      )}
                    </div>

                    {/* Titres, Rôle et Points */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-zinc-200">
                      <span className="text-zinc-600 font-medium italic text-[11px] truncate max-w-[150px] sm:max-w-none">
                        « {u.title || 'Débutant'} »
                      </span>

                      {u.role && (
                        <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 border border-zinc-900 ${
                          u.role === 'admin' ? 'bg-zinc-950 text-white' : 'bg-zinc-200 text-zinc-900'
                        }`}>
                          {u.role}
                        </span>
                      )}

                      <span className="font-black bg-white border border-zinc-900 px-2 py-0.5 text-zinc-950 whitespace-nowrap">
                        {u.pts || 0} PTS
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Cours */}
        <section className="space-y-4">
          <div className="flex justify-between items-center border-b-2 border-zinc-900 pb-2">
            <h2 className="text-base font-mono font-bold uppercase tracking-wider text-zinc-950">
              // Matières & Cours
            </h2>
            <span className="text-xs font-mono font-semibold text-zinc-600">
              {courses.length} MATIÈRES DISPONIBLES
            </span>
          </div>

          {loading ? (
            <div className="p-8 text-center font-mono font-bold text-xs text-zinc-600 bg-white border-2 border-zinc-900">
              CHARGEMENT DES COURS...
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {courses.map((course) => (
                <div
                  key={course.id}
                  onClick={() => onSelectCategory(course)}
                  className="bg-white border-2 border-zinc-900 p-5 sm:p-6 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <span className="font-mono font-black text-xs border-2 border-zinc-900 px-2 py-0.5 bg-zinc-100 text-zinc-950">
                        {course.code}
                      </span>
                      <span className="text-xs font-mono font-bold text-zinc-500">
                        {course.chapters ? course.chapters.length : 0} chapitres
                      </span>
                    </div>

                    <h3 className="text-xl font-black uppercase tracking-tight text-zinc-950 mb-2">
                      {course.title}
                    </h3>
                  </div>

                  <div className="mt-6 pt-4 border-t-2 border-zinc-100 flex justify-between items-center text-xs font-mono font-bold text-zinc-950">
                    <span>Accéder aux chapitres</span>
                    <span>{'->'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Session Aléatoire */}
        <section className="bg-zinc-950 text-white border-2 border-zinc-900 p-6 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col sm:flex-row justify-between items-center gap-4">
          <div>
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
              [MODE INTENSIF]
            </span>
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-wide mt-1">
              Session Aléatoire
            </h2>
            <p className="text-xs text-zinc-300 font-medium mt-1">
              Mélange toutes les matières pour un entraînement complet.
            </p>
          </div>

          <button
            onClick={onStartRandom}
            className="w-full sm:w-auto bg-white hover:bg-zinc-200 text-zinc-950 font-mono font-bold text-xs uppercase tracking-widest min-h-[44px] px-6 py-3 border-2 border-white transition-all active:translate-y-0.5 whitespace-nowrap"
          >
            Lancer un Mix {'->'}
          </button>
        </section>
      </div>

      {/* --- OVERLAY AUTEUR (Rond + Fenêtre Pop-up) --- */}
      <div className="fixed bottom-5 right-5 z-50">
        {showCredits && (
          <div className="absolute bottom-14 right-0 w-72 bg-white border-2 border-zinc-900 p-4 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] font-mono text-xs text-zinc-950 mb-2 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center border-b-2 border-zinc-900 pb-2 mb-3">
              <span className="font-black uppercase text-[11px] text-zinc-600">// DÉVELOPPEUR</span>
              <button 
                onClick={() => setShowCredits(false)}
                className="font-black text-zinc-950 hover:bg-zinc-200 px-1.5 py-0.5 border border-zinc-900"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-3 mb-3">
              <img 
                src="https://github.com/rakou-fr.png" 
                alt="Rakou Logo" 
                className="w-10 h-10 border-2 border-zinc-900 object-cover bg-zinc-100"
              />
              <div>
                <p className="font-black text-sm uppercase text-zinc-950">Rakou</p>
              </div>
            </div>

            <p className="text-zinc-700 text-[11px] mb-4 leading-relaxed font-sans">
              Plateforme conçue & développée par <strong className="text-zinc-950 font-mono">Rakou</strong>.
            </p>

            <div className="flex flex-col gap-2">
              <a 
                href="https://rakou-fr.github.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-center bg-zinc-950 hover:bg-zinc-800 text-white font-bold py-2 border-2 border-zinc-950 transition-colors uppercase tracking-wider text-[11px]"
              >
                Mon Portfolio ↗
              </a>
              <a 
                href="https://github.com/rakou-fr" 
                target="_blank" 
                rel="noopener noreferrer"
                className="block text-center bg-white hover:bg-zinc-100 text-zinc-950 font-bold py-2 border-2 border-zinc-900 transition-colors uppercase tracking-wider text-[11px]"
              >
                GitHub ↗
              </a>
            </div>
          </div>
        )}

        <button
          onClick={() => setShowCredits(!showCredits)}
          className="w-12 h-12 bg-white hover:bg-zinc-100 border-2 border-zinc-900 rounded-full flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(24,24,27,1)] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all"
          title="À propos du développeur"
        >
          <img 
            src="https://github.com/rakou-fr.png" 
            alt="Rakou" 
            className="w-8 h-8 rounded-full border border-zinc-900 object-cover"
          />
        </button>
      </div>
    </div>
  );
}