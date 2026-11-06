import { useState, useCallback } from 'react';
import { useSaveData } from '@/useSaveData';
import type { ScreenName, RunRecord } from '@/types';
import HomeScreen from '@/screens/HomeScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import PlayScreen from '@/screens/PlayScreen';
import AchievementsScreen from '@/screens/AchievementsScreen';
import RankingScreen from '@/screens/RankingScreen';

function App() {
  const { save, setProfile, recordRun, resetProgress } = useSaveData();
  const [screen, setScreen] = useState<ScreenName>('home');

  const navigate = useCallback((s: ScreenName) => setScreen(s), []);

  const handleRecordRun = useCallback((run: RunRecord) => {
    recordRun(run);
  }, [recordRun]);

  // Force profile creation if no profile exists and user tries to play
  const handleNavigate = useCallback((s: ScreenName) => {
    if (s === 'play' && !save.profile) {
      setScreen('profile');
      return;
    }
    setScreen(s);
  }, [save.profile]);

  return (
    <div className="min-h-screen bg-forestdark-900 text-white">
      {screen === 'home' && <HomeScreen save={save} onNavigate={handleNavigate} />}
      {screen === 'profile' && (
        <ProfileScreen
          currentProfile={save.profile}
          onSave={setProfile}
          onBack={() => setScreen('home')}
          onResetProgress={resetProgress}
        />
      )}
      {screen === 'play' && save.profile && (
        <PlayScreen
          avatar={save.profile.avatar}
          onExit={() => setScreen('home')}
          onRecordRun={handleRecordRun}
        />
      )}
      {screen === 'achievements' && <AchievementsScreen save={save} onBack={() => setScreen('home')} />}
      {screen === 'ranking' && <RankingScreen save={save} onBack={() => setScreen('home')} />}
    </div>
  );
}

export default App;
