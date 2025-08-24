import React from "react";

export default function ResultsBar({ option, votes, totalVotes, isSelected }) {
  const percentage = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
  
  return (
    <div className="bar">
      <div className="bar-label">
        <div>{option} {isSelected && "✓"}</div>
        <div className="votes">{votes} vote{votes !== 1 ? "s" : ""}</div>
      </div>
      <div className="bar-track">
        <div 
          className="bar-fill" 
          style={{ width: `${percentage}%` }}
        >
          {percentage > 10 ? `${percentage}%` : ""}
        </div>
      </div>
      <div className="bar-meta">
        <span>{percentage}%</span>
        {isSelected && <span>Your choice</span>}
      </div>
    </div>
  );
}
