from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timedelta

class CreatePollOption(BaseModel):
    text: str = Field(..., min_length=1, max_length=200)

class CreatePoll(BaseModel):
    question: str = Field(..., min_length=1, max_length=120)
    options: List[str]  # 2-4
    ttl_hours: int = 24
    hide_until_vote: bool = False

class PollOptionOut(BaseModel):
    id: int
    text: str
    votes: int

    class Config:
        from_attributes = True

class PollOut(BaseModel):
    id: int
    question: str
    expires_at: datetime
    created_at: datetime
    options: List[PollOptionOut]
    hide_until_vote_secret: Optional[str] = None

    class Config:
        from_attributes = True

class VoteIn(BaseModel):
    option_id: int
    idempotency_key: str

class VoteOut(BaseModel):
    total_votes: int
    results: List[PollOptionOut]
    insight: str | None = None
    already_voted_option_id: int | None = None
    expired: bool = False
