import { useState, useEffect } from "react";
import { AuthClient } from "@dfinity/auth-client";
import { mini_project_backend } from "declarations/mini-project-backend";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

import { FaRust, FaBrain } from "react-icons/fa6";
import { SiTypescript } from "react-icons/si";

function App() {
  const [greeting, setGreeting] = useState("");
  const [authClient, setAuthClient] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [results, setResults] = useState({ rust: 0, as: 0, motoko: 0 });
  const [totalVotes, setTotalVotes] = useState(0);
  const [status, setStatus] = useState("");

  useEffect(() => {
    AuthClient.create().then(async (client) => {
      setAuthClient(client);
      if (client.isAuthenticated()) {
        await loadUser(client);
      }
    });
  }, []);

  const loadUser = async (client) => {
    const identity = client.getIdentity();
    const principalText = identity.getPrincipal().toText();
    setIdentity(identity);
    setPrincipal(principalText);

    const message = await mini_project_backend.greet();
    setGreeting(message);

    const voted = await mini_project_backend.hasVoted();
    setHasVoted(voted);

    const result = await mini_project_backend.getResults();
    setResults(result);

    const total = await mini_project_backend.totalVotes();
    setTotalVotes(Number(total));
  };

  const handleLogin = async () => {
    await authClient.login({
      identityProvider: "https://identity.ic0.app/#authorize",
      onSuccess: async () => {
        await loadUser(authClient);
      },
    });
  };

  const handleLogout = async () => {
    await authClient.logout();
    setIdentity(null);
    setPrincipal(null);
    setGreeting("");
    setHasVoted(false);
    setResults({ rust: 0, as: 0, motoko: 0 });
    setStatus("");
    setTotalVotes(0);
  };

  const handleVote = async (lang) => {
    if (!identity || principal === "2vxsx-fae") {
      setStatus("❌ Please login with Internet Identity before voting.");
      return;
    }

    if (hasVoted) {
      setStatus("❌ You have already voted.");
      return;
    }

    const success = await mini_project_backend.vote({ [lang]: null });

    if (success) {
      setStatus("✅ Vote submitted successfully!");
      setHasVoted(true);

      const updated = await mini_project_backend.getResults();
      setResults(updated);

      const total = await mini_project_backend.totalVotes();
      setTotalVotes(Number(total));
    } else {
      setStatus("❌ Vote failed. Maybe you already voted?");
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-700 via-indigo-800 to-blue-900 text-white flex flex-col items-center py-12 px-4">
      <img src="/logo2.svg" alt="DFINITY logo" className="w-24 mb-4" />

      {principal ? (
        <div className="w-full max-w-2xl text-center">
          <p className="text-sm mb-2">
            👤 <code>{principal}</code>
          </p>

          <h1 className="text-2xl font-semibold mb-3">{greeting}</h1>

          <div className="my-4">
            {!hasVoted ? (
              <>
                <h3 className="text-lg font-semibold mb-2">
                  🗳️ Cast Your Vote:
                </h3>
                <div className="flex justify-center gap-4 flex-wrap">
                  <button
                    className="bg-white text-black font-semibold px-4 py-2 rounded hover:bg-gray-200 transition flex items-center gap-2"
                    onClick={() => handleVote("rust")}
                  >
                    <FaRust /> Rust
                  </button>
                  <button
                    className="bg-white text-black font-semibold px-4 py-2 rounded hover:bg-gray-200 transition flex items-center gap-2"
                    onClick={() => handleVote("assemblyScript")}
                  >
                    <SiTypescript /> AssemblyScript
                  </button>
                  <button
                    className="bg-white text-black font-semibold px-4 py-2 rounded hover:bg-gray-200 transition flex items-center gap-2"
                    onClick={() => handleVote("motoko")}
                  >
                    <FaBrain /> Motoko
                  </button>
                </div>
              </>
            ) : (
              <p className="text-green-300 font-medium">
                ✅ You have already voted. Thank you!
              </p>
            )}

            <p className="mt-2 text-yellow-300">{status}</p>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-bold mb-2">📊 Voting Results</h3>
            <ul className="mb-2">
              <li>
                <FaRust className="inline mr-1" /> Rust: {results.rust}
              </li>
              <li>
                <SiTypescript className="inline mr-1" /> AssemblyScript:{" "}
                {results.as}
              </li>
              <li>
                <FaBrain className="inline mr-1" /> Motoko: {results.motoko}
              </li>
            </ul>
            <p className="font-medium">
              <strong>🧾 Total Votes:</strong> {totalVotes}
            </p>

            <div className="mt-4 bg-white rounded shadow p-4">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={[
                    { name: "Rust", votes: results.rust },
                    { name: "AssemblyScript", votes: results.as },
                    { name: "Motoko", votes: results.motoko },
                  ]}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" stroke="#333" />
                  <YAxis allowDecimals={false} stroke="#333" />
                  <Tooltip />
                  <Bar dataKey="votes" fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-8 bg-red-600 hover:bg-red-500 px-4 py-2 rounded font-semibold"
          >
            Logout
          </button>
        </div>
      ) : (
        <button
          onClick={handleLogin}
          className="bg-white text-black font-semibold px-6 py-3 rounded hover:bg-gray-200 transition"
        >
          Login with Internet Identity
        </button>
      )}
    </main>
  );
}

export default App;
