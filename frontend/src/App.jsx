import { useState } from "react";
import "./App.css";

const APPROVED_PRESET = {
  Gender: 1,
  Married: 1,
  Dependents: 0,
  Education: 1,
  Self_Employed: 0,
  ApplicantIncome: 5849,
  CoapplicantIncome: 0,
  LoanAmount: 128,
  Loan_Amount_Term: 360,
  Credit_History: 1,
  Property_Area: "Urban",
};

const DEFAULT_PRESET = {
  Gender: 1,
  Married: 0,
  Dependents: 2,
  Education: 0,
  Self_Employed: 1,
  ApplicantIncome: 2500,
  CoapplicantIncome: 0,
  LoanAmount: 260,
  Loan_Amount_Term: 360,
  Credit_History: 0,
  Property_Area: "Rural",
};

export default function App() {
  const [formData, setFormData] = useState(APPROVED_PRESET);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "Property_Area" ? value : parseFloat(value),
    }));
  };

  const fillPreset = (type) => {
    setFormData(type === "approved" ? APPROVED_PRESET : DEFAULT_PRESET);
    setResult(null);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    const features = {
      Gender: formData.Gender,
      Married: formData.Married,
      Dependents: formData.Dependents,
      Education: formData.Education,
      Self_Employed: formData.Self_Employed,
      ApplicantIncome: formData.ApplicantIncome,
      CoapplicantIncome: formData.CoapplicantIncome,
      LoanAmount: formData.LoanAmount,
      Loan_Amount_Term: formData.Loan_Amount_Term,
      Credit_History: formData.Credit_History,
      Property_Area_Semiurban: formData.Property_Area === "Semiurban" ? 1 : 0,
      Property_Area_Urban: formData.Property_Area === "Urban" ? 1 : 0,
    };

    try {
      const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000" || "https://loan-default-gatekeeper-u7sr.vercel.app/" ;
    
      const res = await fetch(`${API_BASE_URL}/api/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ features }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.detail || "Prediction failed");
      }

      setResult(data);
    } catch (err) {
      setError(err.message || "Could not connect to FastAPI server on port 8000.");
    } finally {
      setLoading(false);
    }
  };

  const isHighRisk = result && result.prediction === 0;

  return (
    <div className="page-wrapper">
      <div className="card">
        <div className="card-header">
          <div>
            <h1>Loan Default Gatekeeper</h1>
            <p className="subtitle">Applicant Credit Risk Assessment</p>
          </div>
          <div className="preset-group">
            <button
              type="button"
              className="btn-preset btn-approved"
              onClick={() => fillPreset("approved")}
            >
              Fill Low-Risk Sample
            </button>
            <button
              type="button"
              className="btn-preset btn-default"
              onClick={() => fillPreset("default")}
            >
              Fill High-Risk Sample
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="Gender">Gender</label>
              <select id="Gender" name="Gender" value={formData.Gender} onChange={handleChange}>
                <option value={1}>Male</option>
                <option value={0}>Female</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="Married">Marital Status</label>
              <select id="Married" name="Married" value={formData.Married} onChange={handleChange}>
                <option value={1}>Married</option>
                <option value={0}>Single</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="Dependents">Dependents</label>
              <select id="Dependents" name="Dependents" value={formData.Dependents} onChange={handleChange}>
                <option value={0}>0</option>
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3+</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="Education">Education</label>
              <select id="Education" name="Education" value={formData.Education} onChange={handleChange}>
                <option value={1}>Graduate</option>
                <option value={0}>Not Graduate</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="Self_Employed">Self Employed</label>
              <select id="Self_Employed" name="Self_Employed" value={formData.Self_Employed} onChange={handleChange}>
                <option value={0}>No</option>
                <option value={1}>Yes</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="Credit_History">Credit History</label>
              <select id="Credit_History" name="Credit_History" value={formData.Credit_History} onChange={handleChange}>
                <option value={1}>Good</option>
                <option value={0}>Poor / None</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="Property_Area">Property Area</label>
              <select id="Property_Area" name="Property_Area" value={formData.Property_Area} onChange={handleChange}>
                <option value="Urban">Urban</option>
                <option value="Semiurban">Semiurban</option>
                <option value="Rural">Rural</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="ApplicantIncome">Applicant Monthly Income</label>
              <input
                type="number"
                step="any"
                id="ApplicantIncome"
                name="ApplicantIncome"
                value={formData.ApplicantIncome}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="CoapplicantIncome">Co-applicant Income</label>
              <input
                type="number"
                step="any"
                id="CoapplicantIncome"
                name="CoapplicantIncome"
                value={formData.CoapplicantIncome}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="LoanAmount">Loan Amount (in Thousands)</label>
              <input
                type="number"
                step="any"
                id="LoanAmount"
                name="LoanAmount"
                value={formData.LoanAmount}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="Loan_Amount_Term">Loan Term (Months)</label>
              <input
                type="number"
                step="any"
                id="Loan_Amount_Term"
                name="Loan_Amount_Term"
                value={formData.Loan_Amount_Term}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="submit-wrapper">
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? "Running Assessment..." : "Run Risk Assessment"}
            </button>
          </div>
        </form>

        {error && (
          <div className="result-box risk-high">
            <p className="error-text">Error: {error}</p>
          </div>
        )}

        {result && (
          <div className={`result-box ${isHighRisk ? "risk-high" : "risk-low"}`}>
            <div className="result-content">
              <div>
                <p className="result-eyebrow">Gatekeeper Decision</p>
                <p className={`result-label ${isHighRisk ? "text-high" : "text-low"}`}>
                  {result.label}
                </p>
              </div>
              <div className="metrics">
                <div>
                  <span className="metric-title">Default Risk</span>
                  <span className="metric-value">
                    {(result.default_probability * 100).toFixed(2)}%
                  </span>
                </div>
                <div>
                  <span className="metric-title">Approval Confidence</span>
                  <span className="metric-value">
                    {(result.no_default_probability * 100).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}