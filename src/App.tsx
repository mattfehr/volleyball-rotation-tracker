import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AuthForm from './components/AuthForm';
import CourtEditor from './components/CourtEditor';
import Library from './components/Library'; 
import { useAuth } from './contexts/AuthContext';

function App() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <Routes>
      {/* if the user is logged in, redirect to library. If not, to login form */}
      <Route
        path="/auth"
        element={user ? <Navigate to="/library" replace /> : <AuthForm />}
      />
      {/* if logged in, show the editor. If not, to auth */}
      <Route
        path="/"
        element={user ? <CourtEditor /> : <Navigate to="/auth" replace />}
      />
      {/* if logged in, go to library and if not, to form and save where they came from to send back to library */}
      <Route
        path="/library"
        element={user ? <Library /> : <Navigate to="/auth" replace state={{ from: location }} />}
      />
    </Routes>
  );
}

export default App;
