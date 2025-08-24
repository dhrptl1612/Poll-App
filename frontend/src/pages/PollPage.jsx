import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ResultsBar from "../components/ResultsBar";
import { getPoll, getResults, submitVote, generateFingerprint, hasVoted as checkHasVoted, subscribeToResults } from "../api";

export default function PollPage() {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [userVoted, setUserVoted] = useState(false);
  const [voteLoading, setVoteLoading] = useState(false);
  const [resultsHidden, setResultsHidden] = useState(false);

  useEffect(() => {
    // Check if user has already voted
    if (checkHasVoted(id)) {
      setUserVoted(true);
    }

    const loadPoll = async () => {
      try {
        setLoading(true);
        
        // Load poll details
        const data = await getPoll(id);
        setPoll(data);
        
        // Load initial results
        try {
          const resultsData = await getResults(id);
          setResults(resultsData);
          
          // Check if results are hidden until vote
          if (resultsData.hidden_until_vote) {
            setResultsHidden(true);
          }
        } catch (error) {
          console.error("Error loading initial results:", error);
          // Don't set an error state here since the poll might still be viewable
        }
      } catch (error) {
        console.error("Error loading poll:", error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    loadPoll();

    // Setup real-time updates with SSE
    const unsubscribe = subscribeToResults(id, (data) => {
      setResults(data);
    });
    
    // Cleanup subscription on unmount
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [id]);

  const handleVote = async (optionId) => {
    if (userVoted || voteLoading) return;
    
    setSelectedOption(optionId);
    setVoteLoading(true);
    
    try {
      // Submit vote using the API helper
      const response = await submitVote(id, optionId);
      console.log("Vote submitted:", response);
      
      // Update state based on response
      setUserVoted(true);
      
      // Always fetch the latest results immediately after voting
      try {
        console.log("Fetching fresh results after voting");
        const resultsData = await getResults(id);
        console.log("Fresh results received:", resultsData);
        
        // Update the results state with the latest data
        setResults(resultsData);
        
        // If results were hidden until voting, make them visible now
        if (resultsHidden) {
          setResultsHidden(false);
        }
      } catch (err) {
        console.error("Error fetching results after vote:", err);
      }
      
      // Handle already voted case
      if (response.message === "Already voted") {
        if (response.voted_for) {
          // Find the matching option ID and highlight it
          const votedOption = poll.options.find(o => o.text === response.voted_for);
          if (votedOption) {
            setSelectedOption(votedOption.id);
          }
        }
      }
    } catch (error) {
      console.error("Error voting:", error);
    } finally {
      setVoteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <header>
          <div className="brand">QuickPoll</div>
        </header>
        <div className="loading"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <header>
          <div className="brand">QuickPoll</div>
        </header>
        <div className="card">
          <h2>Error</h2>
          <p>{error}</p>
          <Link to="/">
            <button className="primary">Create a New Poll</button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <header>
        <div className="brand">QuickPoll</div>
        <Link to="/">
          <button className="secondary">Create Poll</button>
        </Link>
      </header>
      
      <div className="card">
        <h2>{poll.question}</h2>
        
        {!userVoted ? (
          <div className="poll-options">
            {poll.options.map((opt) => (
              <button
                key={opt.id}
                className={`poll-option ${selectedOption === opt.id ? 'selected' : ''}`}
                onClick={() => handleVote(opt.id)}
                disabled={voteLoading}
              >
                {opt.text}
                {voteLoading && selectedOption === opt.id && " ..."}
              </button>
            ))}
          </div>
        ) : resultsHidden ? (
          <div className="results-hidden">
            <div className="message">
              <h3>Thanks for voting!</h3>
              <p>Results will be shown after the poll ends.</p>
            </div>
          </div>
        ) : results ? (
          <div className="results">
            <h3>Results</h3>
            <p className="muted">Total votes: {results.total_votes}</p>
            
            {results.results.map((r, index) => (
              <ResultsBar
                key={index}
                option={r.option}
                votes={r.votes}
                totalVotes={results.total_votes}
                isSelected={poll.options.some(o => o.text === r.option && o.id === selectedOption)}
              />
            ))}
            
            {results?.insight && (
              <div className="insight">{results.insight}</div>
            )}
          </div>
        ) : (
          <div className="loading"></div>
        )}
      </div>
      
      <footer>
        QuickPoll © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
