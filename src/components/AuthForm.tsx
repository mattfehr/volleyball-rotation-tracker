import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { setDoc, doc } from 'firebase/firestore';

export default function AuthForm() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const email = `${username}@vbrt.com`;

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', auth.currentUser!.uid), {
          username,
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-green-700">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-xl shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-2xl font-bold text-center text-black">
          {isRegistering ? "Register" : "Login"}
        </h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border border-gray-300 p-2 rounded text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />

        {error && (
          <p className="text-red-600 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          className="w-full bg-gray-100 hover:bg-gray-200 text-black font-semibold py-2 rounded"
        >
          {isRegistering ? "Create Account" : "Login"}
        </button>

        <button
          type="button"
          className="text-sm text-blue-600 hover:underline w-full text-center"
          onClick={() => setIsRegistering((prev) => !prev)}
        >
          {isRegistering
            ? "Already have an account? Login"
            : "Need an account? Register. Don't actually use your real password lol"}
        </button>
      </form>
    </div>
  );
}
