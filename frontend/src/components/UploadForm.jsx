import { useState } from "react";
import { rankResumes } from "../api";
import "../styles/UploadForm.css";

export default function UploadForm({ setResults }) {
  const [jd, setJd] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(0);

  const validateInputs = () => {
    if (!jd.trim()) {
      setError("Job description cannot be empty");
      return false;
    }
    if (jd.trim().length < 50) {
      setError("Job description must be at least 50 characters");
      return false;
    }
    if (!files || files.length === 0) {
      setError("Please upload at least one resume");
      return false;
    }
    if (files.length > 10) {
      setError("Maximum 10 resumes allowed");
      return false;
    }
    // Validate file sizes (5MB per file)
    for (let file of files) {
      if (file.size > 5 * 1024 * 1024) {
        setError(`File ${file.name} exceeds 5MB limit`);
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    setError("");
    
    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    setProgress(10);

    try {
      setProgress(30);
      const data = await rankResumes(jd, Array.from(files));
      setProgress(100);
      setResults(data);
      setJd("");
      setFiles([]);
    } catch (err) {
      setError(err.message || "Failed to rank resumes. Please try again.");
      console.error("Error:", err);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  const handleFileChange = (e) => {
    setFiles(e.target.files);
    setError("");
  };

  const handleJdChange = (e) => {
    setJd(e.target.value);
    if (error) setError("");
  };

  return (
    <div className="upload-form-container">
      <div className="form-card">
        <div className="form-section">
          <label htmlFor="jd-textarea">Job Description</label>
          <textarea
            id="jd-textarea"
            className="textarea"
            placeholder="Paste the full job description here (minimum 50 characters)"
            value={jd}
            onChange={handleJdChange}
            disabled={loading}
            rows={8}
          />
          <div className="char-count">{jd.length} characters</div>
        </div>

        <div className="form-section">
          <label htmlFor="file-input">Upload Resumes (PDF)</label>
          <div 
            className="file-input-wrapper"
            onClick={() => !loading && document.getElementById("file-input")?.click()}
          >
            <input
              id="file-input"
              type="file"
              multiple
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={loading}
              className="file-input"
            />
            <span className="file-label">
              {files.length > 0
                ? `${files.length} file(s) selected`
                : "📁 Click to upload PDF files"}
            </span>
          </div>
          {files.length > 0 && (
            <div className="file-list">
              {Array.from(files).map((file, idx) => (
                <div key={idx} className="file-item">
                  <span>📄 {file.name}</span>
                  <span className="file-size">
                    {(file.size / 1024 / 1024).toFixed(2)}MB
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && <div className="error-message">{error}</div>}

        {loading && (
          <div className="progress-container">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="progress-text">Processing resumes... {progress}%</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`submit-button ${loading ? "loading" : ""}`}
        >
          {loading ? "Ranking Candidates..." : "Rank Candidates"}
        </button>
      </div>
    </div>
  );
}
