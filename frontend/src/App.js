import { useState } from "react";
import UploadForm from "./components/UploadForm";
import Results from "./components/Results";
import "./App.css";

function App() {
  const [results, setResults] = useState([]);
  const [submissionCount, setSubmissionCount] = useState(0);

  const handleResultsUpdate = (newResults) => {
    setResults(newResults);
    setSubmissionCount(submissionCount + 1);
  };

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>🤖 AI Resume Screener</h1>
          <p>Intelligent resume ranking powered by embeddings & LLMs</p>
        </div>
      </header>

      <main className="app-main">
        <div className="form-section">
          <UploadForm setResults={handleResultsUpdate} />
        </div>

        {submissionCount > 0 && (
          <div className="results-section">
            <Results results={results} />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Built with React & Flask | Using Sentence Transformers & OpenAI</p>
      </footer>
    </div>
  );
}

export default App;
