import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../firebase";
import { setDoc, doc } from 'firebase/firestore';

export default function AuthForm() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState(""); // renamed
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const email = `${username}@vbrt.com`; // generate fake email

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', auth.currentUser!.uid), {
          username, // original casing preserved
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
        className="bg-white p-8 rounded shadow-md w-full max-w-md space-y-4"
      >
        <h2 className="text-xl font-bold text-center">
          {isRegistering ? "Register" : "Login"}
        </h2>

        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-2 rounded"
          required
        />

        {error && (
          <p className="text-red-600 text-sm text-center">{error}</p>
        )}

        <button
          type="submit"
          className="w-full bg-green-600 text-black py-2 rounded hover:bg-green-700"
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
