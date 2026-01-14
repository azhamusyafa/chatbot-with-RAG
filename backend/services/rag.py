# Contoh implementasi RAG (Retrieval Augmented Generation)
# Simpan file ini di backend/services/rag.py

import os
from typing import List, Dict, Any, Optional
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import logging

logger = logging.getLogger(__name__)

class SimpleRAG:
    """
    Implementasi RAG sederhana menggunakan TF-IDF dan cosine similarity.
    Untuk implementasi produksi, gunakan Pinecone, Weaviate, atau Qdrant.
    """
    
    def __init__(self, documents_path: str = "data/documents"):
        self.documents_path = documents_path
        self.documents = []
        self.vectorizer = TfidfVectorizer()
        self.document_vectors = None
        
        # Muat dokumen saat inisialisasi
        self._load_documents()
        self._vectorize_documents()
    
    def _load_documents(self):
        """Muat dokumen dari direktori dokumen"""
        try:
            if not os.path.exists(self.documents_path):
                os.makedirs(self.documents_path)
                logger.warning(f"Directory {self.documents_path} tidak ada, dibuat direktori baru")
                return
            
            for filename in os.listdir(self.documents_path):
                if filename.endswith('.txt'):
                    file_path = os.path.join(self.documents_path, filename)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        self.documents.append({
                            'id': filename,
                            'content': content,
                            'metadata': {'source': filename}
                        })
            
            logger.info(f"Loaded {len(self.documents)} documents")
        except Exception as e:
            logger.error(f"Error loading documents: {str(e)}")
    
    def _vectorize_documents(self):
        """Vektorisasi dokumen menggunakan TF-IDF"""
        if not self.documents:
            logger.warning("No documents to vectorize")
            return
        
        try:
            # Ekstrak konten dokumen untuk vektorisasi
            document_texts = [doc['content'] for doc in self.documents]
            
            # Fit vectorizer dan transform dokumen
            self.document_vectors = self.vectorizer.fit_transform(document_texts)
            logger.info("Documents vectorized successfully")
        except Exception as e:
            logger.error(f"Error vectorizing documents: {str(e)}")
    
    def query(self, query_text: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """
        Temukan dokumen yang paling relevan dengan query
        
        Args:
            query_text: Teks query
            top_k: Jumlah dokumen teratas yang akan dikembalikan
            
        Returns:
            List dokumen yang relevan
        """
        if not self.documents or self.document_vectors is None:
            logger.warning("No documents available for query")
            return []
        
        try:
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
            
            return results
        except Exception as e:
            logger.error(f"Error querying documents: {str(e)}")
            return []
    
    def add_document(self, content: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
        """
        Tambahkan dokumen baru ke dalam database
        
        Args:
            content: Konten dokumen
            metadata: Metadata opsional untuk dokumen
            
        Returns:
            True jika berhasil, False jika gagal
        """
        try:
            # Buat ID dokumen baru
            doc_id = f"doc_{len(self.documents) + 1}.txt"
            
            # Tambahkan ke koleksi dokumen
            self.documents.append({
                'id': doc_id,
                'content': content,
                'metadata': metadata or {}
            })
            
            # Simpan dokumen ke file
            file_path = os.path.join(self.documents_path, doc_id)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            # Vectorize ulang dokumen
            self._vectorize_documents()
            
            return True
        except Exception as e:
            logger.error(f"Error adding document: {str(e)}")
            return False

# Contoh penggunaan dalam chatbot.py:
"""
from services.rag import SimpleRAG

# Inisialisasi RAG
rag = SimpleRAG()

async def generate_response(user_message: str, conversation_history: List[Dict[str, Any]]) -> str:
    # Dapatkan dokumen yang relevan
    relevant_docs = rag.query(user_message)
    
    # Ekstrak konten dari dokumen yang relevan
    context = ""
    if relevant_docs:
        context = "\n\n".join([doc['document']['content'] for doc in relevant_docs])
    
    # Buat prompt teraugmentasi
    augmented_prompt = create_enhanced_prompt(user_message, context)
    
    # Panggil model LLM dengan prompt teraugmentasi
    # ...rest of the code...
"""