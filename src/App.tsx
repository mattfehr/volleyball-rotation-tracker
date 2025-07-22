import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import CourtEditor from './components/CourtEditor';
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <Routes>
      <Route
        path="/auth"
        element={user ? <Navigate to="/" replace /> : <AuthForm />}
      />
      <Route
        path="/"
        element={user ? <CourtEditor /> : <Navigate to="/auth" replace state={{ from: location }} />}
      />
    </Routes>
  );
}

export default App;
