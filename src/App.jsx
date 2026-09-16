import { useState, useEffect } from 'react';
import Login from './components/Login';
import Hub from './components/Hub';
import ChapterSelection from './components/ChapterSelection';
import QuizEngine from './components/QuizEngine';
import GithubConfigModal from './components/GithubConfigModal';

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('hub');
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [quizConfig, setQuizConfig] = useState(null);
  const [showTokenModal, setShowTokenModal] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('revisio_session');
    if (session) {
      setUser(JSON.parse(session));
      if (!localStorage.getItem('revisio_gh_token')) {
        setShowTokenModal(true);
      }
    }
  }, []);

  const handleLogin = (loggedUser) => {
    setUser(loggedUser);
    setView('hub');
    if (!localStorage.getItem('revisio_gh_token')) {
      setShowTokenModal(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('revisio_session');
    setUser(null);
    setSelectedCourse(null);
    setView('hub');
  };

  const handleSelectCourse = (course) => {
    setSelectedCourse(course);
    setView('course');
  };

  const handleStartQuiz = (config) => {
    setQuizConfig(config);
    setView('quiz');
  };

  if (!user) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  return (
    <div>
      <GithubConfigModal 
        isOpen={showTokenModal} 
        onClose={() => setShowTokenModal(false)} 
      />

      {view === 'hub' && (
        <Hub
          user={user}
          onLogout={handleLogout}
          onSelectCategory={handleSelectCourse}
          onStartRandom={() => handleStartQuiz({ mode: 'random' })}
          onUserUpdate={setUser}
        />
      )}

      {view === 'course' && selectedCourse && (
        <ChapterSelection
          course={selectedCourse}
          onBack={() => setView('hub')}
          onStartQuiz={handleStartQuiz}
        />
      )}

      {view === 'quiz' && quizConfig && (
        <QuizEngine
          user={user}
          quizConfig={quizConfig}
          onBack={() => setView(selectedCourse ? 'course' : 'hub')}
          onComplete={(updatedUser) => setUser(updatedUser)}
        />
      )}
    </div>
  );
}