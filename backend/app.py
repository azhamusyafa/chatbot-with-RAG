from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
import logging
from datetime import datetime

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

from config import OLLAMA_BASE_URL

from routers.pdf import router as pdf_router

app = FastAPI(title="Chatbot API dengan Integrasi PDF")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Message(BaseModel):
    role: str  
    content: str
    timestamp: Optional[datetime] = None

class ChatRequest(BaseModel):
    message: str
    conversation_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    conversation_id: str
    messages: List[Message]

conversations = {}

from services.chatbot import generate_response

app.include_router(pdf_router, prefix="/api/pdf", tags=["pdf"])

@app.post("/api/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    logger.info(f"Menerima pesan baru, conversation_id: {request.conversation_id}")
    
    # Dapatkan atau buat ID percakapan baru
    conversation_id = request.conversation_id or os.urandom(16).hex()
    
    # Dapatkan riwayat percakapan atau buat baru
    if conversation_id not in conversations:
        conversations[conversation_id] = []
        logger.info(f"Membuat percakapan baru dengan ID: {conversation_id}")
    
    # Tambahkan pesan pengguna
    user_message = Message(
        role="user",
        content=request.message,
        timestamp=datetime.now()
    )
    conversations[conversation_id].append(user_message)
    
    # Generate respons dari model AI
    logger.info(f"Generating respons untuk: '{request.message}'")
    ai_response = await generate_response(
        request.message, 
        [msg.dict() for msg in conversations[conversation_id]]
    )
    
    # Tambahkan respons AI ke riwayat
    assistant_message = Message(
        role="assistant",
        content=ai_response,
        timestamp=datetime.now()
    )
    conversations[conversation_id].append(assistant_message)
    
    logger.info(f"Percakapan sekarang memiliki {len(conversations[conversation_id])} pesan")
    
    return ChatResponse(
        response=ai_response,
        conversation_id=conversation_id,
        messages=conversations[conversation_id]
    )

@app.get("/api/conversations/{conversation_id}", response_model=List[Message])
async def get_conversation(conversation_id: str):
    if conversation_id not in conversations:
        logger.warning(f"Percakapan tidak ditemukan: {conversation_id}")
        raise HTTPException(status_code=404, detail="Percakapan tidak ditemukan")
    
    logger.info(f"Mengembalikan percakapan: {conversation_id} ({len(conversations[conversation_id])} pesan)")
    return conversations[conversation_id]

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "ollama_url": OLLAMA_BASE_URL}

if __name__ == "__main__":
    logger.info(f"Starting server at http://0.0.0.0:8000")
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)