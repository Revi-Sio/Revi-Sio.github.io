import { useState } from 'react';

export default function ChapterSelection({ course, onBack, onStartQuiz }) {
  const [selectedChapter, setSelectedChapter] = useState(null);

  const totalQuestions = course.chapters ? 
    course.chapters.reduce((acc, ch) => acc + (ch.questions ? ch.questions.length : 0), 0) : 0;

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        
        {/* En-tête de la matière */}
        <header className="bg-white border-2 border-zinc-900 p-6 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] space-y-4">
          <div className="flex justify-between items-start gap-4">
            <button
              onClick={onBack}
              className="bg-zinc-100 hover:bg-zinc-200 border-2 border-zinc-900 px-3 py-1.5 font-mono font-bold text-xs text-zinc-950 uppercase transition-all active:translate-y-0.5"
            >
              {'<-'} Retour au Hub
            </button>
            <span className="font-mono font-black text-xs border-2 border-zinc-900 px-2 py-1 bg-zinc-950 text-white">
              {course.code}
            </span>
          </div>

          <div>
                <h1 
                style={{ color: '#09090b' }} 
                className="text-2xl sm:text-3xl font-black uppercase tracking-tight"
                >
                    {course.title}
                </h1>
            <p className="text-xs font-mono font-semibold text-zinc-600 mt-1">
              {course.chapters?.length || 0} CHAPITRES • {totalQuestions} QUESTIONS TOTALES
            </p>
          </div>
        </header>

        {/* Sélection des Modes d'Entraînement */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

          {/* Mode Express 10 Questions */}
          <div className="bg-white border-2 border-zinc-900 p-6 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col justify-between space-y-4">
            <div>
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-600">
                [MODE RAPIDE]
              </span>
              <h2 style={{ color: '#09090b' }} className="text-lg font-black uppercase tracking-wide mt-1 text-black">
                Session Express (10 Q)
              </h2>
              <p className="text-xs text-zinc-600 font-medium mt-2 leading-relaxed">
                10 questions tirées aléatoirement parmi l'ensemble des chapitres de cette matière.
              </p>
            </div>

            <button
              onClick={() => onStartQuiz({ mode: 'express', courseId: course.id, questionCount: 10 })}
              className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-950 font-mono font-bold text-xs uppercase tracking-widest py-3 border-2 border-zinc-900 transition-all active:translate-y-0.5"
            >
              Lancer 10 Questions Aléatoires {'->'}
            </button>
          </div>

        </section>

        {/* Liste détaillée des Chapitres */}
        <section className="space-y-4">
          <div className="flex justify-between items-center border-b-2 border-zinc-900 pb-2">
            <h2 className="text-base font-mono font-bold uppercase tracking-wider text-zinc-950">
              // Révision par Chapitre Spécifique
            </h2>
          </div>

          <div className="space-y-3">
            {course.chapters?.map((chapter, index) => (
              <div
                key={chapter.id || index}
                className="bg-white border-2 border-zinc-900 p-4 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-zinc-950 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-xs bg-zinc-100 border border-zinc-900 px-2 py-0.5">
                      CH. {index + 1}
                    </span>
                    <span className="text-xs font-mono font-bold text-zinc-500">
                      {chapter.questions?.length || 0} Q.
                    </span>
                  </div>
                  <h3 className="text-base font-black uppercase text-zinc-950">
                    {chapter.title}
                  </h3>
                  {chapter.description && (
                    <p className="text-xs text-zinc-600 font-medium">
                      {chapter.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => onStartQuiz({ mode: 'chapter', courseId: course.id, chapterId: chapter.id })}
                  className="w-full sm:w-auto bg-zinc-950 hover:bg-black text-white font-mono font-bold text-xs uppercase px-5 py-2.5 border border-zinc-950 transition-all active:translate-y-0.5 whitespace-nowrap"
                >
                  Réviser ce chapitre {'->'}
                </button>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}