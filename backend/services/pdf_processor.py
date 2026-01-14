import PyPDF2
import os
import logging
from typing import List, Dict, Any, Optional
import re
import numpy
import time
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

try:
    import pytesseract
    from pdf2image import convert_from_path
    HAS_OCR = True
except ImportError:
    HAS_OCR = False
    logging.warning("pytesseract atau pdf2image tidak terinstal. OCR tidak akan tersedia.")

logger = logging.getLogger(__name__)

class PDFProcessor:
    """
    Kelas untuk mengekstrak dan mengindeks konten dari file PDF
    """
    
    def __init__(self, pdf_dir: str = "data/pdfs"):
        self.pdf_dir = pdf_dir
        self.documents = []
        self.vectorizer = TfidfVectorizer()
        self.document_vectors = None
        
        # Buat direktori jika belum ada
        if not os.path.exists(self.pdf_dir):
            os.makedirs(self.pdf_dir, exist_ok=True)
            logger.info(f"Direktori {self.pdf_dir} dibuat")
        
        # Buat direktori cache
        self.cache_dir = os.path.join(os.path.dirname(self.pdf_dir), "cache")
        if not os.path.exists(self.cache_dir):
            os.makedirs(self.cache_dir, exist_ok=True)
            logger.info(f"Direktori cache {self.cache_dir} dibuat")
        
        # Muat PDF yang sudah ada saat inisialisasi
        self.load_existing_pdfs()
    
    def load_existing_pdfs(self):
        """Muat semua PDF yang sudah ada di direktori"""
        try:
            logger.info(f"Mencari PDF di direktori: {self.pdf_dir}")
            pdf_files = [f for f in os.listdir(self.pdf_dir) if f.endswith('.pdf')]
            logger.info(f"Menemukan {len(pdf_files)} file PDF")
            
            if not pdf_files:
                logger.info(f"Tidak ada file PDF yang ditemukan di {self.pdf_dir}")
                return
            
            # Muat PDF dari cache jika ada
            loaded_count = 0
            for filename in pdf_files:
                file_path = os.path.join(self.pdf_dir, filename)
                try:
                    success = self.load_pdf(file_path)
                    if success:
                        loaded_count += 1
                except Exception as e:
                    logger.error(f"Error saat memuat PDF {filename}: {str(e)}")
            
            logger.info(f"Berhasil memuat {loaded_count} dari {len(pdf_files)} PDF")
            logger.info(f"Total dokumen dalam memori: {len(self.documents)}")
        except Exception as e:
            logger.error(f"Error saat memuat PDF yang ada: {str(e)}")

    def extract_text_with_ocr(self, file_path, max_pages=3):
        """
        Ekstrak teks dari PDF menggunakan OCR dengan batasan halaman
        
        Args:
            file_path: Path ke file PDF
            max_pages: Jumlah maksimum halaman yang akan diproses
            
        Returns:
            String teks hasil ekstraksi atau None jika gagal
        """
        if not HAS_OCR:
            logger.warning("OCR tidak tersedia karena library tidak terinstal")
            return None
            
        try:
            # Cek ukuran file, batasi ukuran untuk OCR
            file_size = os.path.getsize(file_path)
            file_size_mb = file_size / (1024 * 1024)
            
            if file_size_mb > 10:  # Batasi 10MB
                logger.warning(f"File terlalu besar untuk OCR: {file_size_mb:.2f} MB. Melewati OCR.")
                return None
                
            logger.info(f"Memulai ekstraksi OCR untuk: {file_path}")
            
            # Dapatkan jumlah halaman
            with open(file_path, 'rb') as f:
                reader = PyPDF2.PdfReader(f)
                total_pages = len(reader.pages)
            
            # Batasi jumlah halaman
            pages_to_process = min(max_pages, total_pages)
            logger.info(f"Memproses {pages_to_process} dari {total_pages} halaman dengan OCR")
            
            # Konversi PDF ke gambar (hanya beberapa halaman)
            try:
                start_time = time.time()
                images = convert_from_path(file_path, first_page=1, last_page=pages_to_process)
                conversion_time = time.time() - start_time
                logger.info(f"PDF berhasil dikonversi menjadi {len(images)} gambar dalam {conversion_time:.2f} detik")
            except Exception as e:
                logger.error(f"Error saat mengkonversi PDF ke gambar: {str(e)}")
                return None
            
            # Ekstrak teks dari setiap gambar
            text = ""
            for i, image in enumerate(images):
                start_time = time.time()
                page_text = pytesseract.image_to_string(image, lang='eng')
                ocr_time = time.time() - start_time
                logger.info(f"OCR halaman {i+1}: {len(page_text)} karakter dalam {ocr_time:.2f} detik")
                text += page_text + "\n\n"
                
            if total_pages > pages_to_process:
                text += f"\n\n[Catatan: Hanya {pages_to_process} dari {total_pages} halaman yang diproses dengan OCR]"
                
            return text
        except Exception as e:
            logger.error(f"Error saat OCR: {str(e)}")
            return None
            
    def extract_text_with_pypdf2(self, file):
        """Ekstrak teks menggunakan PyPDF2"""
        try:
            logger.info("Mencoba ekstraksi dengan PyPDF2 PdfReader")
            reader = PyPDF2.PdfReader(file)
            text = ""
            
            # Log jumlah halaman
            total_pages = len(reader.pages)
            logger.info(f"PDF memiliki {total_pages} halaman")
            
            for page_num in range(total_pages):
                try:
                    page = reader.pages[page_num]
                    page_text = page.extract_text() or ""
                    
                    # Log panjang teks dari setiap halaman
                    logger.info(f"Halaman {page_num+1}: {len(page_text)} karakter")
                    
                    text += page_text + "\n\n"
                except Exception as e:
                    logger.error(f"Error ekstraksi halaman {page_num+1}: {str(e)}")
                    
            return text
        except Exception as e:
            logger.error(f"Error ekstraksi dengan PyPDF2 PdfReader: {str(e)}")
            return None
    
    def load_pdf(self, file_path: str) -> bool:
        """
        Memuat file PDF dan mengekstrak teks dengan dukungan caching
        
        Args:
            file_path: Path ke file PDF
        
        Returns:
            True jika berhasil, False jika gagal
        """
        try:
            if not os.path.exists(file_path):
                logger.error(f"File tidak ditemukan: {file_path}")
                return False
            
            filename = os.path.basename(file_path)
            logger.info(f"Memulai proses PDF: {filename}")
            
            # Path file cache
            cache_filename = re.sub(r'[^\w\-_\.]', '_', filename)  # Pastikan nama file aman
            cache_path = os.path.join(self.cache_dir, f"{cache_filename}.cache.txt")
            
            # Cek apakah cache tersedia
            extracted_text = None
            use_cache = False
            
            if os.path.exists(cache_path):
                cache_mtime = os.path.getmtime(cache_path)
                pdf_mtime = os.path.getmtime(file_path)
                
                # Gunakan cache hanya jika PDF tidak berubah setelah cache dibuat
                if cache_mtime >= pdf_mtime:
                    try:
                        with open(cache_path, 'r', encoding='utf-8') as f:
                            extracted_text = f.read()
                        logger.info(f"Menggunakan cache teks untuk {filename}")
                        use_cache = True
                    except Exception as e:
                        logger.error(f"Error membaca cache: {str(e)}")
                        # Lanjutkan dengan ekstraksi normal jika cache error
            
            # Jika tidak ada cache atau cache tidak valid, ekstrak teks dari PDF
            if not use_cache:
                logger.info(f"Cache tidak tersedia untuk {filename}, melakukan ekstraksi teks")
                
                # Coba berbagai metode ekstraksi teks
                # Metode 1: Coba dengan PyPDF2
                with open(file_path, 'rb') as file:
                    extracted_text = self.extract_text_with_pypdf2(file)
                
                # Metode 2: Coba dengan OCR jika PyPDF2 gagal
                if (not extracted_text or len(extracted_text.strip()) < 100) and HAS_OCR:
                    logger.info(f"Mencoba ekstraksi dengan OCR untuk {filename}")
                    
                    # Cek ukuran file untuk menghindari OOM
                    file_size = os.path.getsize(file_path)
                    file_size_mb = file_size / (1024 * 1024)
                    
                    if file_size_mb <= 10:  # Batasi 10MB untuk OCR
                        extracted_text = self.extract_text_with_ocr(file_path, max_pages=3)
                        if extracted_text and len(extracted_text.strip()) > 100:
                            logger.info(f"Ekstraksi dengan OCR berhasil: {len(extracted_text)} karakter")
                    else:
                        logger.warning(f"File {filename} terlalu besar ({file_size_mb:.2f}MB) untuk OCR")
                
                # Simpan ekstraksi ke cache untuk penggunaan masa depan
                if extracted_text and len(extracted_text) > 100:
                    try:
                        with open(cache_path, 'w', encoding='utf-8') as f:
                            f.write(extracted_text)
                        logger.info(f"Cache teks disimpan untuk {filename}")
                    except Exception as e:
                        logger.error(f"Error menyimpan cache: {str(e)}")
            
            # Jika masih gagal, log error
            if not extracted_text or len(extracted_text.strip()) < 100:
                logger.error(f"Gagal mengekstrak teks yang cukup dari {filename}. Teks terlalu sedikit atau kosong.")
                return False
            
            # Bersihkan teks dan potong menjadi chunk
            text = self._clean_text(extracted_text)
            logger.info(f"Panjang teks setelah dibersihkan: {len(text)} karakter")
            
            # Jika teks terlalu pendek, tidak perlu dibagi
            if len(text) < 200:
                logger.warning(f"Teks dari {filename} terlalu pendek untuk dibagi: {len(text)} karakter")
                # Tambahkan sebagai satu dokumen jika tidak kosong
                if text.strip():
                    # Hapus dokumen lama dengan sumber yang sama (jika ada)
                    self.documents = [doc for doc in self.documents if doc['metadata']['source'] != filename]
                    
                    self.documents.append({
                        'id': f"{filename}_single",
                        'content': text,
                        'metadata': {
                            'source': filename,
                            'chunk_': 0,
                            'total_chunks': 1
                        }
                    })
                    
                    # Vectorize dokumen
                    self._vectorize_documents()
                    return True
                else:
                    logger.error(f"Teks dari {filename} kosong setelah dibersihkan")
                    return False
            
            # Bagi teks menjadi chunk
            start_time = time.time()
            chunks = self._chunk_text(text)
            chunk_time = time.time() - start_time
            logger.info(f"Berhasil membagi teks menjadi {len(chunks)} chunks dalam {chunk_time:.2f} detik")
            
            # Hapus dokumen lama dengan sumber yang sama (jika ada)
            self.documents = [doc for doc in self.documents if doc['metadata']['source'] != filename]
            
            # Tambahkan chunk ke dokumen
            added_chunks = 0
            for i, chunk in enumerate(chunks):
                if len(chunk.strip()) > 50:  # Hanya tambahkan chunk yang cukup panjang
                    self.documents.append({
                        'id': f"{filename}_chunk_{i}",
                        'content': chunk,
                        'metadata': {
                            'source': filename,
                            'chunk_': i,
                            'total_chunks': len(chunks)
                        }
                    })
                    added_chunks += 1
            
            # Log jumlah chunks yang berhasil ditambahkan
            logger.info(f"Berhasil memuat PDF: {filename} ({added_chunks} chunks)")
            
            # Vectorize dokumen jika ada yang ditambahkan
            if added_chunks > 0:
                self._vectorize_documents()
                return True
            else:
                logger.warning(f"Tidak ada chunk yang ditambahkan dari {filename}")
                return False
                
        except Exception as e:
            logger.error(f"Gagal memuat PDF: {file_path}, {e}")
            return False
            
    def _clean_text(self, text: str) -> str:
        """Membersihkan teks dari karakter yang tidak diinginkan"""
        if not text:
            return ""
            
        # Hapus karakter non-printable
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f-\xff]', '', text)
        
        # Hapus spasi berlebih
        text = re.sub(r'\s+', ' ', text)
        
        # Hapus hyphenation (-\n)
        text = re.sub(r'-\s+', '', text)
        
        # Hapus header dan footer yang berulang (contoh: nomor halaman)
        lines = text.split('\n')
        cleaned_lines = []
        
        # Filter baris yang terlalu pendek atau hanya berisi angka
        for line in lines:
            stripped = line.strip()
            # Skip baris yang hanya berisi satu angka (nomor halaman)
            if not re.match(r'^\d+$', stripped) and len(stripped) > 1:
                cleaned_lines.append(line)
                
        return '\n'.join(cleaned_lines).strip()
    
    def _chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """
        Memecah teks menjadi chunk dengan ukuran yang ditentukan (versi yang dioptimasi)
        
        Args:
            text: Teks yang akan dibagi
            chunk_size: Ukuran maksimum setiap chunk (dalam karakter)
            overlap: Jumlah karakter yang tumpang tindih antar chunk
            
        Returns:
            List of text chunks
        """
        # Untuk file kecil, tidak perlu pembagian kompleks
        if len(text) <= chunk_size:
            return [text]
        
        chunks = []
        start = 0
        text_len = len(text)
        
        # Hitung estimasi jumlah chunk untuk logging
        estimated_chunks = max(1, text_len // (chunk_size - overlap))
        logger.info(f"Estimasi jumlah chunk: {estimated_chunks}, mulai pembagian...")
        
        # Tetapkan batas waktu maksimum untuk keamanan
        start_time = time.time()
        max_processing_time = 10  # Maksimal 10 detik
        
        try:
            while start < text_len:
                # Cek timeout untuk menghindari loop tak terbatas
                if time.time() - start_time > max_processing_time:
                    logger.warning(f"Pembagian teks terlalu lama, berhenti di {len(chunks)} chunk")
                    break
                    
                # Tentukan akhir chunk
                end = min(start + chunk_size, text_len)
                
                # Jika bukan akhir teks, cari akhir kalimat/paragraf terdekat
                if end < text_len:
                    # Periksa dalam rentang 100 karakter
                    search_range = 100
                    # Cari titik, tanda tanya, tanda seru, atau garis baru
                    for i in range(min(search_range, end - start)):
                        pos = end - i
                        if pos < text_len and pos >= 0:
                            if text[pos] in ['.', '?', '!', '\n']:
                                end = pos + 1
                                break
                
                # Tambahkan chunk
                chunk = text[start:end].strip()
                if chunk:  
                    chunks.append(chunk)
                
                start = end - overlap
                if start < 0:
                    start = 0
                
                if end == text_len:
                    break
            
            processing_time = time.time() - start_time
            logger.info(f"Berhasil membagi teks menjadi {len(chunks)} chunks dalam {processing_time:.2f} detik")
            return chunks
            
        except Exception as e:
            logger.error(f"Error saat membagi teks: {str(e)}")
            # Kembalikan teks sebagai satu chunk jika terjadi error
            return [text]
    
    def _vectorize_documents(self):
        """Vektorisasi dokumen menggunakan TF-IDF"""
        if not self.documents:
            logger.warning("Tidak ada dokumen untuk divektorisasi")
            return
        
        try:
            # Ekstrak konten dokumen untuk vektorisasi
            document_texts = [doc['content'] for doc in self.documents]
            
            start_time = time.time()
            # Fit vectorizer dan transform dokumen
            self.document_vectors = self.vectorizer.fit_transform(document_texts)
            vectorize_time = time.time() - start_time
            
            logger.info(f"Dokumen berhasil divektorisasi ({len(document_texts)} dokumen) dalam {vectorize_time:.2f} detik")
        except Exception as e:
            logger.error(f"Error saat memvektorisasi dokumen: {str(e)}")
    
    def query(self, query_text: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Temukan dokumen yang paling relevan dengan query
        
        Args:
            query_text: Teks query
            top_k: Jumlah dokumen teratas yang akan dikembalikan
            
        Returns:
            List dokumen yang relevan
        """
        logger.info(f"Total dokumen yang tersedia: {len(self.documents)}")
        if not self.documents or self.document_vectors is None:
            logger.warning("Tidak ada dokumen tersedia untuk query")
            return []
        
        try:
            start_time = time.time()
            # Vektorisasi query
            query_vector = self.vectorizer.transform([query_text])
            
            # Hitung kesamaan kosinus
            similarities = cosine_similarity(query_vector, self.document_vectors).flatten()
            
            # Dapatkan indeks top_k dokumen dengan kesamaan tertinggi
            top_indices = similarities.argsort()[-top_k:][::-1]
            
            # Kumpulkan dokumen yang relevan
            results = []
            for idx in top_indices:
                if similarities[idx] > 0.1:  # Filter kesamaan rendah
                    results.append({
                        'document': self.documents[idx],
                        'similarity': float(similarities[idx])
                    })
            
            query_time = time.time() - start_time
            if not results:
                logger.info(f"Tidak ada dokumen yang relevan untuk query: '{query_text}' ({query_time:.2f}s)")
            else:
                logger.info(f"Ditemukan {len(results)} dokumen relevan untuk query dalam {query_time:.2f}s")
                # Log sumber dokumen yang ditemukan
                for i, result in enumerate(results):
                    source = result['document']['metadata']['source']
                    similarity = result['similarity']
                    logger.info(f"  {i+1}. {source} (similarity: {similarity:.4f})")
            
            return results
        except Exception as e:
            logger.error(f"Error saat melakukan query dokumen: {str(e)}")
            return []

# Fungsi utilitas untuk menggabungkan hasil query menjadi konteks
def create_context_from_results(results: List[Dict[str, Any]], max_length: int = 3000) -> str:
    """
    Menggabungkan dokumen yang relevan menjadi konteks untuk prompt
    
    Args:
        results: Hasil query dari PDFProcessor
        max_length: Panjang maksimum konteks dalam karakter
        
    Returns:
        String konteks untuk prompt
    """
    if not results:
        return ""
    
    context = []
    current_length = 0
    
    # Urutkan hasil berdasarkan similarity
    sorted_results = sorted(results, key=lambda x: x['similarity'], reverse=True)
    
    for result in sorted_results:
        doc = result['document']
        content = doc['content']
        source = doc['metadata']['source']
        
        # Format konten dengan sumber
        formatted_content = f"[From: {source}]\n{content}\n\n"
        
        # Periksa panjang
        if current_length + len(formatted_content) <= max_length:
            context.append(formatted_content)
            current_length += len(formatted_content)
        else:
            break
    
    return "".join(context)