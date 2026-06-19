import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LevelSelectPage from '@/components/pages/LevelSelectPage';
import GamePage from '@/components/pages/GamePage';
import './index.css';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LevelSelectPage />} />
        <Route path="/game/:levelId" element={<GamePage />} />
      </Routes>
    </Router>
  );
}
