"""
Real-Time Event Broker for RAILBLOCK (WebSocket & Server-Sent Events)
Enables instantaneous multi-client state synchronization for live COA/TMS streams,
task creation, solver results, HITL decisions, and conflict resolutions.
"""
import json
import asyncio
import logging
from typing import Dict, List, Set, Any
from datetime import datetime
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import StreamingResponse

logger = logging.getLogger("railblock.realtime")
router = APIRouter(tags=["Real-Time Stream & WebSockets"])


class ConnectionManager:
    def __init__(self):
        # Active WebSocket connections
        self.active_websockets: Set[WebSocket] = set()
        # Active SSE subscriber queues
        self.sse_queues: List[asyncio.Queue] = []
        self._lock = asyncio.Lock()

    async def connect_ws(self, websocket: WebSocket):
        await websocket.accept()
        self.active_websockets.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_websockets)}")
        # Send initial connection handshake
        await websocket.send_json({
            "type": "SYSTEM_CONNECTED",
            "message": "Connected to Indian Railways Live Real-Time Stream Bus (CRIS CAS v3.0)",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        })

    def disconnect_ws(self, websocket: WebSocket):
        self.active_websockets.discard(websocket)
        logger.info(f"WebSocket client disconnected. Remaining clients: {len(self.active_websockets)}")

    async def register_sse(self) -> asyncio.Queue:
        q = asyncio.Queue(maxsize=100)
        async with self._lock:
            self.sse_queues.append(q)
        logger.info(f"SSE client registered. Total SSE clients: {len(self.sse_queues)}")
        return q

    async def unregister_sse(self, q: asyncio.Queue):
        async with self._lock:
            if q in self.sse_queues:
                self.sse_queues.remove(q)
        logger.info(f"SSE client unregistered. Remaining SSE clients: {len(self.sse_queues)}")

    async def broadcast(self, event_type: str, data: Any):
        """Broadcasts payload to all connected WebSockets and SSE streams."""
        message = {
            "type": event_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        msg_str = json.dumps(message)

        # 1. Send to WebSockets
        dead_ws = []
        for ws in list(self.active_websockets):
            try:
                await ws.send_text(msg_str)
            except Exception as e:
                logger.warning(f"Error sending to websocket client: {e}")
                dead_ws.append(ws)
        for ws in dead_ws:
            self.active_websockets.discard(ws)

        # 2. Send to SSE subscribers
        async with self._lock:
            for q in list(self.sse_queues):
                try:
                    if not q.full():
                        q.put_nowait(msg_str)
                except Exception as e:
                    logger.warning(f"Error queuing SSE event: {e}")


# Global Singleton Manager
manager = ConnectionManager()


def broadcast_event(event_type: str, data: Any):
    """
    Synchronous / Async wrapper to dispatch real-time events across the system.
    Safe to call from anywhere in FastAPI routes or database hooks.
    """
    try:
        loop = asyncio.get_event_loop()
        if loop.is_running():
            asyncio.create_task(manager.broadcast(event_type, data))
        else:
            loop.run_until_complete(manager.broadcast(event_type, data))
    except RuntimeError:
        # If running in a background thread without event loop
        new_loop = asyncio.new_event_loop()
        new_loop.run_until_complete(manager.broadcast(event_type, data))
        new_loop.close()
    except Exception as e:
        logger.error(f"Failed to broadcast real-time event '{event_type}': {e}")


# ---------------------------------------------------------------------------
# API Endpoints for Real-Time Event Delivery
# ---------------------------------------------------------------------------
@router.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket feed for real-time corridor, block, and conflict events."""
    await manager.connect_ws(websocket)
    try:
        while True:
            # Keep-alive receive loop
            data = await websocket.receive_text()
            if data == "PING":
                await websocket.send_text("PONG")
    except WebSocketDisconnect:
        manager.disconnect_ws(websocket)
    except Exception as e:
        logger.warning(f"WebSocket error: {e}")
        manager.disconnect_ws(websocket)


@router.get("/api/realtime/events")
async def sse_endpoint(request: Request):
    """Server-Sent Events (SSE) stream fallback for browsers."""
    q = await manager.register_sse()

    async def event_generator():
        try:
            # Yield initial connection message
            yield f"data: {json.dumps({'type': 'SYSTEM_CONNECTED', 'message': 'SSE Stream Active', 'timestamp': datetime.utcnow().isoformat() + 'Z'})}\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    msg = await asyncio.wait_for(q.get(), timeout=20.0)
                    yield f"data: {msg}\n\n"
                except asyncio.TimeoutError:
                    # Send keep-alive comment
                    yield ": keepalive\n\n"
        finally:
            await manager.unregister_sse(q)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        }
    )
