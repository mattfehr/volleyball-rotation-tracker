import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import CourtEditor from './components/CourtEditor';
import Library from './components/Library'; // ✅ new import
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <Routes>
      <Route
        path="/auth"
        element={user ? <Navigate to="/library" replace /> : <AuthForm />}
      />
      <Route
        path="/"
        element={
          user
            ? localStorage.getItem('rotation-id')
              ? <CourtEditor />
              : <Navigate to="/library" replace />
            : <Navigate to="/auth" replace />
        }
      />
      <Route
        path="/library"
        element={user ? <Library /> : <Navigate to="/auth" replace state={{ from: location }} />}
      />
    </Routes>
  );
}

export default App;
