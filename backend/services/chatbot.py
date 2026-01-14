import logging
from typing import List, Dict, Any
import os
import json
import time
import requests
from config import OLLAMA_BASE_URL, MODEL_NAME
from services.pdf_processor import PDFProcessor, create_context_from_results

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

pdf_processor = PDFProcessor()

OLLAMA_AVAILABLE = None  

def check_ollama_connection():
    """Periksa apakah Ollama berjalan dan model tersedia"""
    global OLLAMA_AVAILABLE
    
    try:
        # Coba dapatkan daftar model
        logger.info(f"Memeriksa koneksi ke Ollama API di {OLLAMA_BASE_URL}")
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=5)
        
        if response.status_code == 200:
            models_data = response.json()
            models = models_data.get("models", [])
            
            if not models and "models" in models_data:
                # Format API yang berbeda (versi Ollama yang lebih baru)
                model_names = [name for name in models_data.get("models", {})]
            else:
                # Format API lama
                model_names = [model.get("name") for model in models]
                
            if model_names:
                logger.info(f"Ollama tersedia. Model tersedia: {', '.join(model_names)}")
            else:
                logger.info(f"Ollama tersedia, tetapi tidak ada model yang terdeteksi")
            
            model_found = False
            for model in model_names:
                if model == MODEL_NAME or model.startswith(f"{MODEL_NAME}:"):
                    model_found = True
                    logger.info(f"Model {MODEL_NAME} ditemukan")
                    break
            
            if not model_found:
                logger.warning(f"Model {MODEL_NAME} tidak ditemukan di Ollama. Model tersedia: {model_names}")
                logger.warning(f"Mencoba menggunakan model yang tersedia...")
                if model_names:
                    OLLAMA_AVAILABLE = True
                else:
                    OLLAMA_AVAILABLE = False
            else:
                OLLAMA_AVAILABLE = True
            
            return OLLAMA_AVAILABLE
                
        else:
            logger.error(f"Ollama API mengembalikan kode status: {response.status_code}")
            logger.error(f"Respons: {response.text}")
            OLLAMA_AVAILABLE = False
            return False
            
    except requests.exceptions.ConnectionError:
        logger.error(f"Tidak dapat terhubung ke Ollama di {OLLAMA_BASE_URL}. Pastikan Ollama berjalan.")
        OLLAMA_AVAILABLE = False
        return False
    except Exception as e:
        logger.error(f"Error saat memeriksa koneksi Ollama: {str(e)}")
        OLLAMA_AVAILABLE = False
        return False

check_ollama_connection()

async def generate_response(user_message: str, conversation_history: List[Dict[str, Any]]) -> str:
    """
    Generate respons menggunakan Ollama (Llama 2) berdasarkan pesan pengguna, riwayat percakapan,
    dan konteks dari dokumen PDF.
    
    Args:
        user_message: Pesan terbaru dari pengguna
        conversation_history: Riwayat lengkap percakapan
    
    Returns:
        Respons dari model AI
    """
    try:
        relevant_docs = pdf_processor.query(user_message, top_k=3)
        context = create_context_from_results(relevant_docs)
        
        if context:
            logger.info(f"Konteks ditemukan dari {len(relevant_docs)} dokumen")
        else:
            logger.info("Tidak ada konteks yang ditemukan dari dokumen")
        
        global OLLAMA_AVAILABLE
        if OLLAMA_AVAILABLE is None:
            check_ollama_connection()
        
        if OLLAMA_AVAILABLE is False:
            if context:
                return f"Berdasarkan dokumen yang ditemukan: {context[:500]}... (Catatan: layanan AI lanjutan sedang tidak tersedia, hanya menampilkan informasi yang ditemukan)"
            else:
                return "Maaf, saya tidak dapat menemukan informasi yang relevan dalam dokumen Anda, dan layanan AI yang lebih canggih sedang tidak tersedia."

        messages = []
        
        system_message = "You are AZHA NAWAF MUSYAFA You are a helpful and friendly AI assistant who is studying at Universitas Pendidikan Indonesia with a focus on AI, and is currently interning as an AI engineer. Answer the questions in a friendly manner. Just answer what is asked, don't exaggerate."
        
        if context:
            system_message += ("Gunakan informasi dari dokumen berikut untuk menjawab pertanyaan pengguna. "
                               "Jika pertanyaan tidak dapat dijawab dari dokumen, katakan saja Anda tidak tahu. "
                               "\n\n--- DOKUMEN ---\n" + context)
        else:
            system_message += "Maaf, tidak ada informasi yang relevan ditemukan dalam dokumen."
        
        messages.append({
            "role": "system",
            "content": system_message
        })
        
        filtered_history = []
        for msg in conversation_history[-10:]:  
            if msg.get("role") and msg.get("content"):
                filtered_history.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })
        
        messages.extend(filtered_history)
        
        logger.info(f"Mengirim {len(messages)} pesan ke Ollama API")
        logger.info(f"URL Ollama: {OLLAMA_BASE_URL}")
        logger.info(f"Model yang digunakan: {MODEL_NAME}")
        
        url = f"{OLLAMA_BASE_URL}/api/chat"
        payload = {
            "model": MODEL_NAME,
            "messages": messages,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "max_tokens": 1000
            }
        }
        
        logger.info(f"Mengirim permintaan ke {url}")
        
        try:
            start_time = time.time()
            
            response = requests.post(url, json=payload, timeout=60, stream=True)
            
            response_time = time.time() - start_time
            logger.info(f"Koneksi dibuat dalam {response_time:.2f} detik. Status: {response.status_code}")
            
            if response.status_code != 200:
                logger.error(f"Error dari Ollama API: Status {response.status_code}")
                error_text = ""
                try:
                    for chunk in response.iter_content(chunk_size=1024, decode_unicode=True):
                        if chunk:
                            error_text += chunk
                            if len(error_text) > 500:
                                break
                except:
                    pass
                logger.error(f"Response error: {error_text[:500]}")
                return f"Maaf, terjadi kesalahan saat memproses permintaan Anda. (Kode: {response.status_code})"
            
            full_content = ""
            try:
                for line in response.iter_lines():
                    if line:
                        try:
                            line_str = line.decode('utf-8')
                            json_obj = json.loads(line_str)
                            
                            if 'message' in json_obj and 'content' in json_obj['message']:
                                token = json_obj['message']['content']
                                full_content += token
                            
                            if json_obj.get('done', False):
                                break
                        except json.JSONDecodeError:
                            logger.warning(f"Tidak dapat mendecode baris JSON: {line[:100]}")
                        except Exception as e:
                            logger.warning(f"Error saat memproses baris streaming: {str(e)}")
                
                logger.info(f"Berhasil menerima respons streaming ({len(full_content)} karakter)")
                return full_content
            except Exception as stream_err:
                logger.error(f"Error saat membaca streaming: {str(stream_err)}")
                if full_content:
                    logger.info(f"Mengembalikan konten parsial: {len(full_content)} karakter")
                    return full_content + "\n\n[Respons mungkin tidak lengkap karena gangguan koneksi]"
                return "Maaf, terjadi kesalahan saat menerima respons dari model AI."
                
        except requests.exceptions.Timeout:
            logger.error("Timeout saat menghubungi Ollama API")
            return "Maaf, waktu respons habis. Layanan mungkin sedang sibuk. Silakan coba lagi nanti."
            
        except requests.exceptions.ConnectionError:
            logger.error("Tidak dapat terhubung ke Ollama API")
            OLLAMA_AVAILABLE = False  
            return "Maaf, tidak dapat terhubung ke layanan AI. Pastikan server Ollama berjalan."
            
        except Exception as req_err:
            logger.error(f"Error saat menghubungi Ollama API: {str(req_err)}")
            return "Maaf, terjadi kesalahan saat berkomunikasi dengan layanan AI."
        
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        return "Maaf, terjadi kesalahan saat memproses permintaan Anda."

def add_pdf_document(file_path: str) -> bool:
    """
    Tambahkan dokumen PDF ke basis pengetahuan chatbot
    
    Args:
        file_path: Path ke file PDF
        
    Returns:
        True jika berhasil, False jika gagal
    """
    logger.info(f"Menambahkan PDF: {file_path}")
    return pdf_processor.load_pdf(file_path)

def create_enhanced_prompt(user_message: str, context: str = None) -> str:
    """
    Meningkatkan prompt pengguna dengan konteks tambahan untuk hasil yang lebih baik.
    """
    if context:
        return f"Berdasarkan informasi berikut: {context}\n\nPertanyaan pengguna: {user_message}"
    return user_message