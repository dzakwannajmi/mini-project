import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

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

const MainApp = () => {
  const [greeting, setGreeting] = useState("");
  const [authClient, setAuthClient] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [results, setResults] = useState({
    rust: 0,
    assemblyScript: 0,
    motoko: 0,
  });
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
    console.log("✅ totalVotes dari backend:", total);
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
    setResults({ rust: 0, assemblyScript: 0, motoko: 0 });
    setStatus("");
    setTotalVotes(0);
  };

  const handleVote = async (lang) => {
    if (!identity || principal === "2vxsx-fae") {
      setStatus("❌ Please login first.");
      return;
    }

    if (hasVoted) {
      setStatus("❌ You already voted.");
      return;
    }

    let langVariant;
    switch (lang) {
      case "rust":
        langVariant = { rust: null };
        break;
      case "assemblyScript":
        langVariant = { assemblyScript: null };
        break;
      case "motoko":
        langVariant = { motoko: null };
        break;
      default:
        setStatus("❌ Invalid language.");
        return;
    }

    try {
      const success = await mini_project_backend.vote(langVariant);

      if (success) {
        setStatus("✅ Vote submitted.");
        setHasVoted(true);

        const updated = await mini_project_backend.getResults();
        setResults(updated);

        const total = await mini_project_backend.totalVotes();
        setTotalVotes(Number(total));
      } else {
        setStatus("❌ Voting failed.");
      }
    } catch (err) {
      console.error("Vote error:", err);
      setStatus("❌ Unexpected error during voting.");
    }
  };

  return (
    <div className="container">
      <img src="/logo2.svg" alt="Logo" className="logo" />

      {principal ? (
        <>
          <p>
            👤 <code>{principal}</code>
          </p>
          <h2>{greeting}</h2>

          {!hasVoted ? (
            <>
              <h3>🗳️ Vote Your Language:</h3>
              <button className="button" onClick={() => handleVote("rust")}>
                Rust
              </button>
              <button
                className="button"
                onClick={() => handleVote("assemblyScript")}
              >
                AssemblyScript
              </button>
              <button className="button" onClick={() => handleVote("motoko")}>
                Motoko
              </button>
            </>
          ) : (
            <p>✅ Thank you for voting!</p>
          )}

          <p>{status}</p>

          <h3>📊 Results</h3>
          <ul>
            <li>Rust: {results.rust}</li>
            <li>AssemblyScript: {results.assemblyScript}</li>
            <li>Motoko: {results.motoko}</li>
          </ul>
          <p>
            <strong>Total Votes:</strong> {totalVotes}
          </p>

          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={[
                  { name: "Rust", votes: results.rust },
                  { name: "AssemblyScript", votes: results.assemblyScript },
                  { name: "Motoko", votes: results.motoko },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="votes" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <button className="button logout-button" onClick={handleLogout}>
            Logout
          </button>
        </>
      ) : (
        <button className="button" onClick={handleLogin}>
          Login with Internet Identity
        </button>
      )}
    </div>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <MainApp />
  </React.StrictMode>
);
