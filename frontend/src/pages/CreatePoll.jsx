import { useState, useEffect } from "react";
import QRCode from "qrcode.react";
import { createPoll } from "../api";

export default function CreatePoll() {
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [link, setLink] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [copied, setCopied] = useState(false);
  const [duration, setDuration] = useState(24);

  // Validation effect
  useEffect(() => {
    const newErrors = {};
    if (question.trim() === "" && question !== "") {
      newErrors.question = "Question cannot be empty";
    }
    
    const validOptions = options.filter(o => o.trim() !== "");
    if (validOptions.length < 2) {
      newErrors.options = "At least 2 options are required";
    }
    
    setErrors(newErrors);
  }, [question, options]);

  const handleAddOption = () => {
    if (options.length < 4) setOptions([...options, ""]);
  };

  const handleRemoveOption = (index) => {
    if (options.length > 2) {
      const newOptions = [...options];
      newOptions.splice(index, 1);
      setOptions(newOptions);
    }
  };

  const handleChange = (i, val) => {
    const newOpts = [...options];
    newOpts[i] = val;
    setOptions(newOpts);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.origin + link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    
    // Validation before submission
    const validOptions = options.filter(o => o.trim() !== "");
    if (question.trim() === "" || validOptions.length < 2) {
      setErrors({
        ...errors,
        question: question.trim() === "" ? "Question is required" : undefined,
        options: validOptions.length < 2 ? "At least 2 options are required" : undefined
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        question,
        options: validOptions.map((o) => ({ text: o })),
        hours: duration,
        hide_results_until_vote: false // Add option for hiding results later
      };

      const data = await createPoll(payload);
      
      if (data.id) {
        const shareLink = `/poll/${data.id}`;
        setLink(shareLink);
        setSuccess(true);
        // Reset form fields for a new poll
        setQuestion("");
        setOptions(["", ""]);
        setDuration(24);
      }
    } catch (error) {
      console.error("Error creating poll:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container">
      <header>
        <div className="brand">QuickPoll</div>
      </header>
      
      {success ? (
        <div className="card">
          <div className="success-message">Poll created successfully!</div>
          
          <div className="share">
            <div className="share-header">Share your poll</div>
            <div className="share-link">
              <input 
                type="text" 
                value={window.location.origin + link} 
                readOnly 
              />
              <button 
                className="secondary" 
                onClick={copyToClipboard}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            
            <div className="qr">
              <span>Or scan this QR code:</span>
              <QRCode 
                value={window.location.origin + link} 
                size={180}
                includeMargin={true}
              />
            </div>
          </div>
          
          <div style={{marginTop: "20px", display: "flex", justifyContent: "space-between"}}>
            <button 
              className="secondary" 
              onClick={() => setSuccess(false)}
            >
              Create Another Poll
            </button>
            <a href={link}>
              <button className="primary">View Your Poll</button>
            </a>
          </div>
        </div>
      ) : (
        <div className="card">
          <h2>Create Poll</h2>
          <p className="muted">Create a quick poll to gather opinions. Add 2-4 options and share with your audience.</p>
          
          <form className="create-poll-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="question">Question</label>
              <input
                id="question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What's your question?"
                maxLength={120}
              />
              {errors.question && <div className="error">{errors.question}</div>}
            </div>
            
            <div className="form-group">
              <label>Options</label>
              <div className="options-container">
                {options.map((opt, i) => (
                  <div key={i} className="option-input">
                    <input
                      value={opt}
                      onChange={(e) => handleChange(i, e.target.value)}
                      placeholder={`Option ${i + 1}`}
                      maxLength={120}
                    />
                    {options.length > 2 && (
                      <button 
                        type="button"
                        className="remove-option" 
                        onClick={() => handleRemoveOption(i)}
                        style={{
                          position: "absolute",
                          right: "8px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "transparent",
                          color: "#9ca3af",
                          padding: "5px",
                          margin: "0",
                          fontSize: "1.2rem"
                        }}
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {errors.options && <div className="error">{errors.options}</div>}
              
              {options.length < 4 && (
                <button 
                  type="button" 
                  className="secondary" 
                  onClick={handleAddOption}
                >
                  + Add option
                </button>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="duration">Poll Duration</label>
              <select 
                id="duration"
                value={duration} 
                onChange={(e) => setDuration(Number(e.target.value))}
              >
                <option value={1}>1 hour</option>
                <option value={6}>6 hours</option>
                <option value={12}>12 hours</option>
                <option value={24}>24 hours</option>
                <option value={48}>48 hours</option>
                <option value={72}>3 days</option>
                <option value={168}>7 days</option>
              </select>
            </div>
            
            <button 
              type="submit" 
              className="primary full-width" 
              disabled={isSubmitting || Object.keys(errors).length > 0}
            >
              {isSubmitting ? "Creating..." : "Create Poll"}
            </button>
          </form>
        </div>
      )}
      
      <footer>
        QuickPoll © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
