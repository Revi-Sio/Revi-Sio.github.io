import { useState, useEffect } from 'react';
import { fetchCoursesFromGithub } from '../services/courseService';
import { fetchUsersFromGithub, pushUsersToGithub } from '../services/authService';

export default function QuizEngine({ user, quizConfig, onBack, onComplete }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  
  // États de synchronisation GitHub
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ success: false, message: '' });

  // Clé unique de sauvegarde incluant le nombre de questions
  const storageKey = (quizConfig.mode === 'chapter' && quizConfig.courseId && quizConfig.chapterId)
    ? `revisio_progress_${quizConfig.courseId}_${quizConfig.chapterId}_${quizConfig.questionCount || 'all'}`
    : null;

  useEffect(() => {
    async function loadQuestions() {
      try {
        // 1. Vérification d'une progression enregistrée pour ce mode spécifique
        if (storageKey) {
          const savedProgress = localStorage.getItem(storageKey);
          if (savedProgress) {
            const { savedQuestions, savedIndex, savedScore } = JSON.parse(savedProgress);
            if (savedQuestions && savedQuestions.length > 0) {
              setQuestions(savedQuestions);
              setCurrentIndex(savedIndex || 0);
              setScore(savedScore || 0);
              setLoading(false);
              return;
            }
          }
        }

        // 2. Chargement initial si pas de sauvegarde pour ce format
        const courses = await fetchCoursesFromGithub();
        let pool = [];

        if (quizConfig.mode === 'random') {
          courses.forEach((c) => {
            c.chapters?.forEach((ch) => {
              if (ch.questions) pool.push(...ch.questions);
            });
          });
        } else if (quizConfig.mode === 'express' || quizConfig.mode === 'course') {
          const course = courses.find((c) => c.id === quizConfig.courseId);
          course?.chapters?.forEach((ch) => {
            if (ch.questions) pool.push(...ch.questions);
          });
        } else if (quizConfig.mode === 'chapter') {
          const course = courses.find((c) => c.id === quizConfig.courseId);
          const chapter = course?.chapters?.find((ch) => ch.id === quizConfig.chapterId);
          if (chapter?.questions) pool = [...chapter.questions];
        }

        const shuffledPool = [...pool].sort(() => 0.5 - Math.random());

        let targetCount = shuffledPool.length;
        if (quizConfig.questionCount && quizConfig.questionCount !== 'all') {
          targetCount = parseInt(quizConfig.questionCount, 10);
        }

        const finalQuestions = shuffledPool.slice(0, Math.min(targetCount, shuffledPool.length));

        setQuestions(finalQuestions);
        setCurrentIndex(0);
        setScore(0);

        if (storageKey) {
          localStorage.setItem(storageKey, JSON.stringify({
            savedQuestions: finalQuestions,
            savedIndex: 0,
            savedScore: 0
          }));
        }
      } catch (err) {
        console.error("Erreur lors de la préparation du quiz :", err);
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [quizConfig, storageKey]);

  const saveProgress = (nextIndex, currentScore) => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify({
        savedQuestions: questions,
        savedIndex: nextIndex,
        savedScore: currentScore
      }));
    }
  };

  const handleSelectOption = (index) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleValidateAnswer = () => {
    if (selectedOption === null || isAnswered) return;

    const currentQ = questions[currentIndex];
    const isCorrect = selectedOption === currentQ.answerIndex;
    const newScore = isCorrect ? score + 1 : score;

    if (isCorrect) {
      setScore(newScore);
    }
    setIsAnswered(true);
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setSelectedOption(null);
      setIsAnswered(false);
      saveProgress(nextIndex, score);
    } else {
      if (storageKey) localStorage.removeItem(storageKey);
      finishQuiz();
    }
  };

  const handleRestart = () => {
    if (storageKey) localStorage.removeItem(storageKey);

    const reshuffled = [...questions].sort(() => 0.5 - Math.random());
    setQuestions(reshuffled);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setIsFinished(false);

    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify({
        savedQuestions: reshuffled,
        savedIndex: 0,
        savedScore: 0
      }));
    }
  };

  const finishQuiz = async () => {
    setIsFinished(true);
    setIsSyncing(true);

    const ptsEarned = score * 10;

    try {
      const freshUsers = await fetchUsersFromGithub();

      const updatedUsers = freshUsers.map((u) => {
        if (u.id === user.id || u.username === user.username) {
          const newPts = (u.pts || 0) + ptsEarned;
          
          // let newTitle = u.title || 'Noob';
          // if (newPts >= 1000) newTitle = 'God Saint michel';
          // else if (newPts >= 500) newTitle = 'Gluant du zob';
          // else if (newPts >= 250) newTitle = 'Afrodite gluant';
          // else if (newPts >= 150) newTitle = 'Molusque';
          // else if (newPts >= 75) newTitle = 'Tié un sanglier';

          return {
            ...u,
            pts: newPts,
            title: title
          };
        }
        return u;
      });

      await pushUsersToGithub(updatedUsers);

      const updatedUser = updatedUsers.find(
        (u) => u.id === user.id || u.username === user.username
      );
      const { passwordHash, ...sessionUser } = updatedUser;
      localStorage.setItem('revisio_session', JSON.stringify(sessionUser));

      setSyncStatus({
        success: true,
        message: `+${ptsEarned} Tombe les pts`
      });

      if (onComplete) onComplete(sessionUser);

    } catch (err) {
      console.error("Erreur lors de la synchronisation des points :", err);
      setSyncStatus({
        success: false,
        message: `Échec de l'envoi sur GitHub. Vérifie ton Token PAT. (${err.message})`
      });
    } finally {
      setIsSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4 font-mono text-xs font-bold text-zinc-950">
        <div className="bg-white border-2 border-zinc-900 p-6 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)]">
          [CHARGEMENT DES QUESTIONS...]
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4">
        <div className="bg-white border-2 border-zinc-900 p-6 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] text-center space-y-4 max-w-md">
          <p className="font-mono text-xs font-bold text-zinc-950">
            Aucune question trouvée pour ce mode.
          </p>
          <button
            onClick={onBack}
            className="bg-zinc-950 text-white font-mono text-xs font-bold uppercase px-4 py-2 border border-zinc-950"
          >
            {'<-'} Retour
          </button>
        </div>
      </div>
    );
  }

  if (isFinished) {
    const totalPts = score * 10;
    const ratio = Math.round((score / questions.length) * 100);

    return (
      <div className="min-h-screen bg-zinc-100 text-zinc-950 font-sans p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="w-full max-w-xl bg-white border-2 border-zinc-900 p-6 sm:p-8 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] space-y-6">
          <div className="border-b-2 border-zinc-900 pb-4">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500">
              // SESSION TERMINÉE
            </span>
            <h1 className="text-2xl sm:text-3xl font-black uppercase mt-1">
              Bilan du Quiz
            </h1>
          </div>

          <div className="grid grid-cols-2 gap-4 text-center font-mono">
            <div className="bg-zinc-100 border-2 border-zinc-900 p-4">
              <span className="text-[10px] text-zinc-500 font-bold block uppercase">SCORE</span>
              <span className="text-2xl font-black">{score} / {questions.length}</span>
              <span className="text-xs block text-zinc-600 font-bold mt-1">({ratio}%)</span>
            </div>

            <div className="bg-zinc-950 text-white border-2 border-zinc-900 p-4">
              <span className="text-[10px] text-zinc-400 font-bold block uppercase">POINTS GAGNÉS</span>
              <span className="text-2xl font-black text-yellow-400">+{totalPts} PTS</span>
            </div>
          </div>

          <div className="font-mono text-xs">
            {isSyncing ? (
              <div className="p-3 bg-amber-100 border border-amber-800 text-amber-950 font-bold">
                [SYNCHRO GITHUB EN COURS...] Envoi des points à users.json...
              </div>
            ) : syncStatus.success ? (
              <div className="p-3 bg-emerald-100 border border-emerald-800 text-emerald-950 font-bold">
                [OK] {syncStatus.message}
              </div>
            ) : (
              <div className="p-3 bg-red-100 border border-red-800 text-red-950 font-bold">
                [ERREUR] {syncStatus.message}
              </div>
            )}
          </div>

          <button
            onClick={onBack}
            className="w-full bg-zinc-950 hover:bg-black text-white font-mono font-bold text-xs uppercase tracking-widest py-3.5 border border-zinc-950 transition-all active:translate-y-0.5"
          >
            Retourner aux Révisions {'->'}
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIndex];

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-950 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <header className="bg-white border-2 border-zinc-900 p-4 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] flex justify-between items-center font-mono text-xs">
          <div className="flex gap-2">
            <button
              onClick={onBack}
              className="border-2 border-zinc-900 px-3 py-1 font-bold hover:bg-zinc-100 transition-all"
            >
              {'<-'} Abandonner
            </button>
            
            {quizConfig.mode === 'chapter' && (
              <button
                onClick={handleRestart}
                className="border-2 border-zinc-900 bg-amber-200 hover:bg-amber-300 px-3 py-1 font-bold transition-all"
              >
                🔄 Recommencer
              </button>
            )}
          </div>
          
          <span className="font-black bg-zinc-950 text-white px-2 py-1">
            QUESTION {currentIndex + 1} / {questions.length}
          </span>
        </header>

        <section className="bg-white border-2 border-zinc-900 p-6 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] space-y-4">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-500">
            [ÉVALUATION]
          </span>
          <h2 style={{ color: '#09090b' }} className="text-lg sm:text-xl font-black leading-snug text-left text-zinc-950">
            {currentQ.question}
          </h2>
        </section>

        <section className="space-y-3 font-mono text-xs">
          {currentQ.options.map((option, index) => {
            let btnStyle = "bg-white border-zinc-900 text-zinc-950 hover:bg-zinc-100";
            
            if (selectedOption === index) {
              btnStyle = "bg-zinc-950 text-white border-zinc-950 font-bold";
            }

            if (isAnswered) {
              if (index === currentQ.answerIndex) {
                btnStyle = "bg-emerald-300 border-emerald-950 text-emerald-950 font-black";
              } else if (selectedOption === index) {
                btnStyle = "bg-red-300 border-red-950 text-red-950 font-black";
              } else {
                btnStyle = "bg-zinc-100 border-zinc-400 text-zinc-400 opacity-60";
              }
            }

            return (
              <button
                key={index}
                disabled={isAnswered}
                onClick={() => handleSelectOption(index)}
                className={`w-full p-4 border-2 text-left transition-all flex items-center justify-between shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] ${btnStyle}`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold border border-current px-2 py-0.5">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span>{option}</span>
                </div>
              </button>
            );
          })}
        </section>

        {isAnswered && (
          <div className="bg-zinc-950 text-white border-2 border-zinc-900 p-5 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] space-y-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-yellow-400">
              // EXPLICATION
            </span>
            <p className="text-xs font-sans text-zinc-200">
              {currentQ.explanation || "Aucune explication complémentaire pour cette question."}
            </p>
          </div>
        )}

        <div className="flex justify-end pt-2">
          {!isAnswered ? (
            <button
              disabled={selectedOption === null}
              onClick={handleValidateAnswer}
              className={`w-full sm:w-auto font-mono font-bold text-xs uppercase px-8 py-3.5 border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] transition-all ${
                selectedOption !== null
                  ? 'bg-zinc-950 text-white hover:bg-black active:translate-y-0.5'
                  : 'bg-zinc-300 text-zinc-500 border-zinc-400 cursor-not-allowed shadow-none'
              }`}
            >
              Valider la réponse
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="w-full sm:w-auto bg-emerald-400 hover:bg-emerald-500 text-zinc-950 font-mono font-bold text-xs uppercase px-8 py-3.5 border-2 border-zinc-900 shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] active:translate-y-0.5 transition-all"
            >
              {currentIndex + 1 < questions.length ? "Question suivante ->" : "Afficher le bilan ->"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}