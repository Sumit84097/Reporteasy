import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";

export default function Upload() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedLang, setSelectedLang] = useState("en");

  const onDrop = useCallback((acceptedFiles) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
      setResult([]);
      setSummary(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/png": [], "image/jpeg": [], "application/pdf": [] },
  });

  const handleAnalyze = async () => {
    if (!file) return alert("Please upload a file first");
    setLoading(true);
    setResult([]);
    setSummary(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`http://localhost:5000/upload?lang=${selectedLang}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data && data.testResults && data.summary) {
        setResult(data.testResults);
        setSummary(data.summary);
      } else {
        console.error("Received unexpected data structure:", data);
        setResult([{ explanation: "Error: Could not process file" }]);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      setResult([{ explanation: "Error processing file." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container" style={{ maxWidth: "700px", margin: "auto" }}>

      <div style={{ marginBottom: "10px", textAlign: "center" }}>
        <label style={{ marginRight: "10px", fontWeight: "bold" }}>Select Language:</label>
        <select
          value={selectedLang}
          onChange={(e) => setSelectedLang(e.target.value)}
          style={{ padding: "5px", borderRadius: "5px", border: "1px solid #ccc" }}
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
          <option value="ta">Tamil</option>
        </select>
      </div>

      <div
        {...getRootProps()}
        className={`upload-box ${isDragActive ? "active" : ""}`}
        style={{
          border: "2px dashed #4a90e2", borderRadius: "10px", padding: "40px",
          textAlign: "center", background: isDragActive ? "rgba(74, 144, 226, 0.1)" : "#f9f9f9",
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)", transition: "all 0.3s ease",
        }}
      >
        <input {...getInputProps()} />
        {file ? (
          <p style={{ color: "#2ecc71", fontWeight: "bold" }}>{file.name}</p>
        ) : (
          <p style={{ color: "#7f8c8d" }}>
            Drag & drop your file here, or click to select
          </p>
        )}
      </div>


      <button
        className="analyze-btn" onClick={handleAnalyze} disabled={loading}
        style={{
          marginTop: "20px", padding: "10px 20px",
          color: "black", border: "none", borderRadius: "5px",
          cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
        }}
      >
        {loading ? "Analyzing..." : "Analyze Report"}
      </button>

      {summary && !summary.error && (
        <div
          className="summary-box"
          style={{
            marginTop: "30px", padding: "20px", background: "#fff",
            borderRadius: "8px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)", color: "#34495e",
          }}
        >
          <h2 style={{ color: "#2c3e50", borderBottom: "2px solid #4a90e2", paddingBottom: "10px" }}>
            Summary
          </h2>

          <div style={{ marginTop: '15px' }}>
            <strong>Overall Conclusion:</strong>
            <p style={{ fontStyle: 'italic' }}>{summary.overallConclusion}</p>
          </div>

          <div style={{ marginTop: '15px' }}>
            <strong>Key Findings:</strong>
            <ul style={{ paddingLeft: '20px' }}>
              {summary.keyFindings.map((finding, index) => (
                <li key={index}>{finding}</li>
              ))}
            </ul>
          </div>

          <div style={{ marginTop: '15px' }}>
            <strong>Lifestyle & Food Suggestions:</strong>
            <ul style={{ paddingLeft: '20px' }}>
              {summary.lifestyleTips.map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>

          <p style={{ marginTop: "20px", fontSize: "0.8em", color: "#e74c3c", fontWeight: "bold", textAlign: "center", border: "1px solid #e74c3c", padding: "10px", borderRadius: "5px" }}>
            {summary.safetyNote}
          </p>

          <button
            className="bg-green-600 hover:bg-green-700 text-white mt-4"
            style={{
              marginTop: "20px", padding: "10px 20px",
              color: "black", border: "none", borderRadius: "5px",
              cursor: loading ? "not-allowed" : "pointer", boxShadow: "0 2px 5px rgba(0, 0, 0, 0.2)",
            }}
            onClick={() => window.open("https://wa.me/919876543210?text=Hello%20Doctor,%20I%20need%20help%20with%20my%20lab%20report", "_blank")}
          >
            Consult a Doctor
          </button>


        </div>
      )}

      {result.length > 0 && (
        <div
          className="result-box"
          style={{ marginTop: "30px", color: "#34495e" }}
        >
          <h2 style={{ color: "#2c3e50", borderBottom: "2px solid #ccc", paddingBottom: "10px" }}>
            Detailed Report
          </h2>
          {result.map((item, index) => (
            <div
              key={index}
              style={{
                background: "#f9f9f9", padding: "10px", borderRadius: "5px",
                marginBottom: "10px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
            >
              <strong>{item.test || "Unknown Test"}</strong>
              <br />
              <span>Result: {item.result || "-"}</span> {item.unit && ` ${item.unit}`}
              <br />
              <span>Reference Range: {item.referenceRange || "-"}</span>
              <br />
              <span>Status:
                <strong style={{
                  color: item.status === "High" ? "red" :
                    item.status === "Low" ? "orange" :
                      "green"
                }}> {item.status}</strong>
              </span>
              <br />
              <em>{item.explanation}</em>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}