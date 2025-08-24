from database import engine, Base, SessionLocal
from models import Poll, PollOption
from datetime import datetime, timedelta

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

db = SessionLocal()

poll1 = Poll(question="Favorite programming language?", expires_at=datetime.utcnow() + timedelta(hours=24))
db.add(poll1)
db.commit()
db.refresh(poll1)

options = ["Python", "JavaScript", "Java", "C++"]
for o in options:
    opt = PollOption(text=o, poll_id=poll1.id)
    db.add(opt)
db.commit()

db.close()
print("✅ Seed data inserted into polls.db")
