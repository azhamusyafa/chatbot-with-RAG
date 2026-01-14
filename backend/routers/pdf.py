from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
import os
import shutil
import logging
from typing import List
from services.chatbot import add_pdf_document

router = APIRouter()
logger = logging.getLogger(__name__)

# Folder untuk menyimpan PDF
PDF_FOLDER = "data/pdfs"

# Buat folder jika belum ada
os.makedirs(PDF_FOLDER, exist_ok=True)

def process_pdf_in_background(file_path: str):
    """Proses PDF di background setelah upload"""
    try:
        success = add_pdf_document(file_path)
        if success:
            logger.info(f"Berhasil memproses PDF di background: {os.path.basename(file_path)}")
        else:
            logger.error(f"Gagal memproses PDF di background: {os.path.basename(file_path)}")
    except Exception as e:
        logger.error(f"Error saat memproses PDF di background: {str(e)}")

@router.post("/upload")
async def upload_pdf(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """
    Mengunggah file PDF dan mengintegrasikannya ke basis pengetahuan chatbot
    """
    logger.info(f"Menerima permintaan upload untuk file: {file.filename}")
    
    # Periksa ekstensi file
    if not file.filename.endswith(".pdf"):
        logger.warning(f"File {file.filename} bukan PDF")
        raise HTTPException(
            status_code=400, 
            detail="Hanya file PDF yang diizinkan"
        )
    
    file_path = ""
    try:
        # Simpan file ke disk
        file_path = os.path.join(PDF_FOLDER, file.filename)
        logger.info(f"Menyimpan file ke: {file_path}")
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_size = os.path.getsize(file_path)
        logger.info(f"File berhasil disimpan, ukuran: {file_size} bytes")
        
        # Proses PDF di background untuk file besar
        if file_size > 1024 * 1024:  # 1MB
            logger.info(f"File besar, memproses di background: {file.filename}")
            background_tasks.add_task(process_pdf_in_background, file_path)
            
            return JSONResponse(
                content={
                    "message": f"File {file.filename} berhasil diunggah dan sedang diproses",
                    "success": True
                },
                status_code=200
            )
        
        # Tambahkan PDF ke basis pengetahuan untuk file kecil
        success = add_pdf_document(file_path)
        
        if success:
            logger.info(f"File {file.filename} berhasil diintegrasikan ke basis pengetahuan")
            return JSONResponse(
                content={
                    "message": f"File {file.filename} berhasil diunggah dan diintegrasikan",
                    "success": True
                },
                status_code=200
            )
        else:
            logger.error(f"Gagal mengintegrasikan file {file.filename} ke basis pengetahuan")
            # Masih kembalikan sukses karena file sudah tersimpan
            return JSONResponse(
                content={
                    "message": f"File {file.filename} berhasil diunggah tetapi ada masalah saat mengintegrasikan ke basis pengetahuan",
                    "success": True,
                    "warning": "Ada masalah saat ekstraksi teks, file mungkin tidak terindeks dengan baik"
                },
                status_code=200
            )
    
    except Exception as e:
        logger.error(f"Error saat mengunggah file: {str(e)}")
        # Jika terjadi kesalahan, hapus file jika ada
        if file_path and os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"File {file_path} dihapus karena terjadi error")
            except:
                pass
        
        raise HTTPException(
            status_code=500, 
            detail=f"Terjadi kesalahan saat mengunggah file: {str(e)}"
        )

@router.get("/list")
async def list_pdfs():
    """
    Mendapatkan daftar PDF yang tersedia
    """
    try:
        files = []
        if os.path.exists(PDF_FOLDER):
            for filename in os.listdir(PDF_FOLDER):
                if filename.endswith(".pdf"):
                    file_path = os.path.join(PDF_FOLDER, filename)
                    size = os.path.getsize(file_path)
                    files.append({
                        "filename": filename,
                        "size": size,
                        "uploaded_at": os.path.getctime(file_path)
                    })
        
        return {"files": files}
    
    except Exception as e:
        logger.error(f"Terjadi kesalahan saat mendapatkan daftar file: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Terjadi kesalahan saat mendapatkan daftar file: {str(e)}"
        )

@router.delete("/{filename}")
async def delete_pdf(filename: str):
    """
    Menghapus file PDF
    """
    file_path = os.path.join(PDF_FOLDER, filename)
    
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=404, 
            detail=f"File {filename} tidak ditemukan"
        )
    
    try:
        os.remove(file_path)
        logger.info(f"File {filename} berhasil dihapus")
        return {"message": f"File {filename} berhasil dihapus"}
    
    except Exception as e:
        logger.error(f"Terjadi kesalahan saat menghapus file: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail=f"Terjadi kesalahan saat menghapus file: {str(e)}"
        )