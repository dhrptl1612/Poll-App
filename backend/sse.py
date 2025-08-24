import asyncio
from typing import Dict, List

class EventBroker:
    def __init__(self):
        self.channels: Dict[int, List[asyncio.Queue]] = {}

    async def publish(self, poll_id: int, message: str):
        queues = self.channels.get(poll_id, [])
        for q in queues:
            await q.put(message)

    async def subscribe(self, poll_id: int) -> asyncio.Queue:
        q = asyncio.Queue()
        self.channels.setdefault(poll_id, []).append(q)
        return q

    def unsubscribe(self, poll_id: int, q: asyncio.Queue):
        if poll_id in self.channels:
            self.channels[poll_id] = [qq for qq in self.channels[poll_id] if qq is not q]
            if not self.channels[poll_id]:
                del self.channels[poll_id]

broker = EventBroker()
