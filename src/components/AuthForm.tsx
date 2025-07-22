import { useState } from "react";
import {createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

export default function AuthForm() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-700">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-80 space-y-4"
      >
        <h2 className="text-xl font-bold text-center">
          {isRegistering ? "Register" : "Login"}
        </h2>

        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
            : "Need an account? Register"}
        </button>
      </form>
    </div>
  );
}
