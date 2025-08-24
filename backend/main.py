from fastapi import FastAPI, Depends, HTTPException, Request, Cookie
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
import models
from datetime import datetime, timedelta
import json
import uuid
import hashlib
import os
from pydantic import BaseModel
from typing import List, Optional
from rules import rule_based_insight
from sse import broker
import asyncio

Base.metadata.create_all(bind=engine)

app = FastAPI(root_path="/api")

# Allow frontend origins
# Get allowed origins from environment variable or use defaults
# Set CORS_ORIGINS env var as comma-separated list: "https://example.com,https://app.example.com"
default_origins = ["http://localhost:5173", "http://127.0.0.1:5173"]
origins_env = os.getenv("CORS_ORIGINS", "")
origins = origins_env.split(",") if origins_env else default_origins

print(f"Allowed CORS origins: {origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ----- Schemas -----
class OptionIn(BaseModel):
    text: str

class PollIn(BaseModel):
    question: str
    options: List[OptionIn]
    hours: int = 24
    hide_results_until_vote: bool = False

class VoteIn(BaseModel):
    option_id: int
    fingerprint: str

# ----- Endpoints -----
@app.post("/polls")
def create_poll(poll: PollIn, db: Session = Depends(get_db)):
    if not (2 <= len(poll.options) <= 4):
        raise HTTPException(status_code=400, detail="Poll must have 2-4 options")
    
    expires_at = datetime.utcnow() + timedelta(hours=poll.hours)
    
    # Generate a secret if results should be hidden until vote
    hide_until_vote_secret = str(uuid.uuid4()) if poll.hide_results_until_vote else None
    
    db_poll = models.Poll(
        question=poll.question, 
        expires_at=expires_at,
        hide_until_vote_secret=hide_until_vote_secret
    )
    
    db.add(db_poll)
    db.commit()
    db.refresh(db_poll)
    
    for opt in poll.options:
        db_option = models.PollOption(text=opt.text, poll_id=db_poll.id)
        db.add(db_option)
    
    db.commit()
    
    response = {
        "id": db_poll.id
    }
    
    # Include the secret in the response if results are hidden
    if hide_until_vote_secret:
        response["hide_until_vote_secret"] = hide_until_vote_secret
    
    return response

@app.get("/polls/{poll_id}")
def get_poll(poll_id: int, db: Session = Depends(get_db)):
    poll = db.query(models.Poll).filter(models.Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    return {"id": poll.id, "question": poll.question, "options": [{"id": o.id, "text": o.text} for o in poll.options]}

def generate_fingerprint(request: Request, poll_id: int, token: str = None):
    """Generate a fingerprint using IP, User-Agent, and optional token."""
    client_host = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    base_string = f"{client_host}:{user_agent}:{poll_id}:{token or 'no-token'}"
    return hashlib.sha256(base_string.encode()).hexdigest()

@app.post("/polls/{poll_id}/vote")
async def vote(
    poll_id: int, 
    vote: VoteIn, 
    request: Request, 
    token: Optional[str] = Cookie(None), 
    db: Session = Depends(get_db)
):
    # Validate the option
    option = db.query(models.PollOption).filter(models.PollOption.id == vote.option_id).first()
    if not option or option.poll_id != poll_id:
        raise HTTPException(status_code=400, detail="Invalid option")

    # Generate a server-side fingerprint to compare with the provided one
    server_fingerprint = generate_fingerprint(request, poll_id, token)

    # Check for existing votes with either fingerprint
    existing_vote = db.query(models.Vote).filter(
        models.Vote.option_id.in_([o.id for o in option.poll.options]),
        (models.Vote.fingerprint == vote.fingerprint) | (models.Vote.fingerprint == server_fingerprint)
    ).first()
    
    if existing_vote:
        option_text = db.query(models.PollOption).filter(models.PollOption.id == existing_vote.option_id).first().text
        return {"message": "Already voted", "voted_for": option_text, "option_id": existing_vote.option_id}
    
    # Create the vote
    db_vote = models.Vote(option_id=vote.option_id, fingerprint=server_fingerprint)
    db.add(db_vote)
    db.commit()
    
    # Get results and publish update
    poll = db.query(models.Poll).filter(models.Poll.id == poll_id).first()
    results = []
    for opt in poll.options:
        results.append({"option": opt.text, "votes": len(opt.votes)})
    
    result_data = {
        "total_votes": sum(r['votes'] for r in results), 
        "results": results, 
        "insight": rule_based_insight(results)
    }
    
    # Publish to subscribers
    await broker.publish(poll_id, json.dumps(result_data))
    
    return {"message": "Vote recorded"}

@app.get("/polls/{poll_id}/results")
async def get_results(
    poll_id: int, 
    request: Request,
    token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
):
    poll = db.query(models.Poll).filter(models.Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    # Check if this poll has hidden results until vote
    if poll.hide_until_vote_secret:
        # Generate fingerprint to check if user voted
        fingerprint = generate_fingerprint(request, poll_id, token)
        voted = db.query(models.Vote).filter(
            models.Vote.option.has(poll_id=poll_id),
            models.Vote.fingerprint == fingerprint
        ).first()
        
        # If they haven't voted and don't have the secret, return limited data
        if not voted and request.query_params.get("secret") != poll.hide_until_vote_secret:
            return {"hidden_until_vote": True, "total_votes": 0, "results": []}
    
    # Get and return results
    results = []
    for opt in poll.options:
        results.append({"option": opt.text, "votes": len(opt.votes)})
    
    return {"total_votes": sum(r['votes'] for r in results), "results": results, "insight": rule_based_insight(results)}

@app.get("/polls/{poll_id}/sse")
async def sse(poll_id: int, db: Session = Depends(get_db)):
    """Server-Sent Events endpoint for real-time updates."""
    poll = db.query(models.Poll).filter(models.Poll.id == poll_id).first()
    if not poll:
        raise HTTPException(status_code=404, detail="Poll not found")
    
    async def event_generator():
        queue = await broker.subscribe(poll_id)
        try:
            # Send initial data
            results = []
            for opt in poll.options:
                results.append({"option": opt.text, "votes": len(opt.votes)})
            
            initial_data = {
                "total_votes": sum(r['votes'] for r in results),
                "results": results,
                "insight": rule_based_insight(results)
            }
            
            yield f"data: {json.dumps(initial_data)}\n\n"
            
            # Listen for updates
            while True:
                data = await queue.get()
                yield f"data: {data}\n\n"
        except asyncio.CancelledError:
            broker.unsubscribe(poll_id, queue)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )
