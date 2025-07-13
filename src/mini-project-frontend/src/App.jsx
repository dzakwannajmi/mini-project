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

function App() {
  const [greeting, setGreeting] = useState("");
  const [authClient, setAuthClient] = useState(null);
  const [identity, setIdentity] = useState(null);
  const [principal, setPrincipal] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [results, setResults] = useState(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [status, setStatus] = useState("");

  // 🔄 Load data saat component mount
  useEffect(() => {
    AuthClient.create().then(async (client) => {
      setAuthClient(client);
      if (client.isAuthenticated()) {
        await loadUser(client);
      }
    });
  }, []);

  // ✅ Fungsi reusable
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
    setResults(null);
    setStatus("");
    setTotalVotes(0);
  };

  const handleVote = async (lang) => {
    // 🛑 Cegah anonymous vote
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
    <main style={{ textAlign: "center", marginTop: "2rem", padding: "1rem" }}>
      <img src="/logo2.svg" alt="DFINITY logo" width="120" />
      <br />
      {principal ? (
        <>
          <p>
            👤 Your Principal ID: <code>{principal}</code>
          </p>
          <section style={{ marginTop: "1rem", fontSize: "1.2rem" }}>
            {greeting}
          </section>
          <hr style={{ margin: "2rem auto", width: "50%" }} />

          {!hasVoted ? (
            <>
              <h3>🗳️ Cast Your Vote:</h3>
              <button onClick={() => handleVote("rust")}>🦀 Rust</button>&nbsp;
              <button onClick={() => handleVote("assemblyScript")}>
                📜 AssemblyScript
              </button>
              &nbsp;
              <button onClick={() => handleVote("motoko")}>🧠 Motoko</button>
            </>
          ) : (
            <p>✅ You have already voted. Thank you!</p>
          )}

          <p style={{ color: "green", marginTop: "1rem" }}>{status}</p>

          {results && (
            <>
              <h3>📊 Voting Results:</h3>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li>🦀 Rust: {results.rust}</li>
                <li>📜 AssemblyScript: {results.as}</li>
                <li>🧠 Motoko: {results.motoko}</li>
              </ul>
              <p>
                <strong>🧾 Total Votes:</strong> {totalVotes}
              </p>

              <div
                style={{
                  width: "100%",
                  maxWidth: "600px",
                  margin: "2rem auto",
                }}
              >
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
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="votes" fill="#4caf50" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          )}

          <button onClick={handleLogout} style={{ marginTop: "2rem" }}>
            Logout
          </button>
        </>
      ) : (
        <button onClick={handleLogin}>Login with Internet Identity</button>
      )}
    </main>
  );
}

export default App;
