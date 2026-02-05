import { useState } from "react";
import "../styles/Results.css";

export default function Results({ results }) {
  const [sortBy, setSortBy] = useState("score");
  const [filterThreshold, setFilterThreshold] = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  if (!results || results.length === 0) {
    return (
      <div className="results-container empty-state">
        <p>👤 Upload resumes and a job description to see ranked results</p>
      </div>
    );
  }

  const filtered = results.filter((r) => r.score >= filterThreshold);

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "score") return b.score - a.score;
    if (sortBy === "name") return a.name.localeCompare(b.name);
    return 0;
  });

  const stats = {
    total: results.length,
    avgScore: (results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(1),
    topScore: Math.max(...results.map((r) => r.score)),
  };

  const getScoreBadge = (score) => {
    if (score >= 80) return "🟢 Excellent";
    if (score >= 60) return "🟡 Good";
    if (score >= 40) return "🟠 Fair";
    return "🔴 Poor";
  };

  const getScoreColor = (score) => {
    if (score >= 80) return "#10b981"; // green
    if (score >= 60) return "#f59e0b"; // amber
    if (score >= 40) return "#f97316"; // orange
    return "#ef4444"; // red
  };

  return (
    <div className="results-container">
      <div className="results-header">
        <h2>Results ({sorted.length} of {results.length})</h2>
        
        <div className="results-stats">
          <div className="stat">
            <span className="stat-label">Avg Score</span>
            <span className="stat-value">{stats.avgScore}%</span>
          </div>
          <div className="stat">
            <span className="stat-label">Top Match</span>
            <span className="stat-value">{stats.topScore}%</span>
          </div>
          <div className="stat">
            <span className="stat-label">Total</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>
      </div>

      <div className="results-controls">
        <div className="control-group">
          <label htmlFor="sort-select">Sort by:</label>
          <select
            id="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="score">Match Score (Highest)</option>
            <option value="name">Name (A-Z)</option>
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="filter-slider">
            Minimum Score: {filterThreshold}%
          </label>
          <input
            id="filter-slider"
            type="range"
            min="0"
            max="100"
            step="5"
            value={filterThreshold}
            onChange={(e) => setFilterThreshold(Number(e.target.value))}
            className="slider"
          />
        </div>
      </div>

      <div className="results-list">
        {sorted.length === 0 ? (
          <p className="no-results">No results match your filter</p>
        ) : (
          sorted.map((res, index) => (
            <div
              key={index}
              className={`result-card ${
                expandedId === index ? "expanded" : ""
              }`}
            >
              <div
                className="result-header"
                onClick={() =>
                  setExpandedId(expandedId === index ? null : index)
                }
              >
                <div className="result-info">
                  <div className="result-rank">#{res.rank || index + 1}</div>
                  <div>
                    <h3>{res.name}</h3>
                    <span className="result-badge">
                      {getScoreBadge(res.score)}
                    </span>
                  </div>
                </div>
                <div className="result-score">
                  <div 
                    className="score-circle"
                    style={{ background: `linear-gradient(135deg, ${getScoreColor(res.score)} 0%, ${getScoreColor(res.score - 10)} 100%)` }}
                  >
                    {res.score}%
                  </div>
                </div>
                <button className="expand-btn">
                  {expandedId === index ? "▼" : "▶"}
                </button>
              </div>

              {expandedId === index && (
                <div className="result-body">
                  {res.assessment && (
                    <div className="assessment-section">
                      <h4>Assessment</h4>
                      <p className="assessment-text">{res.assessment}</p>
                    </div>
                  )}
                  {res.explanation && (
                    <div className="explanation-section">
                      <h4>AI Analysis</h4>
                      <p>{res.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
