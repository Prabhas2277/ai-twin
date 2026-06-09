import chromadb
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from ..core.config import settings

# Initialize ChromaDB persistent client
chroma_client = chromadb.PersistentClient(path=settings.CHROMA_DB_DIR)
collection = chroma_client.get_or_create_collection(name="student_materials")

def get_embedding(text: str, is_query: bool = False) -> List[float]:
    """
    Generate embeddings using Gemini Embedding API.
    """
    if not settings.GEMINI_API_KEY:
        # Fallback to zero vectors if key is missing (for local setup prior to config)
        return [0.0] * 768
    
    try:
        genai.configure(api_key=settings.GEMINI_API_KEY)
        task_type = "retrieval_query" if is_query else "retrieval_document"
        result = genai.embed_content(
            model="models/text-embedding-004",
            contents=text,
            task_type=task_type
        )
        return result["embedding"]
    except Exception as e:
        print(f"Error generating embedding via Gemini: {e}")
        return [0.0] * 768  # fallback size for text-embedding-004

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """
    Splits text into chunks of specified size with overlap.
    """
    chunks = []
    if not text:
        return chunks
        
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

def add_document_to_vector_store(
    user_id: int, 
    subject_id: int, 
    document_id: int, 
    text: str
) -> bool:
    """
    Chunks document text, generates embeddings, and adds them to ChromaDB.
    """
    chunks = chunk_text(text)
    if not chunks:
        return False
        
    ids = []
    embeddings = []
    metadatas = []
    documents = []
    
    for idx, chunk in enumerate(chunks):
        chunk_id = f"user_{user_id}_sub_{subject_id}_doc_{document_id}_chunk_{idx}"
        emb = get_embedding(chunk, is_query=False)
        
        ids.append(chunk_id)
        embeddings.append(emb)
        metadatas.append({
            "user_id": int(user_id),
            "subject_id": int(subject_id),
            "document_id": int(document_id),
            "chunk_index": idx
        })
        documents.append(chunk)
        
    try:
        # Add to collection
        collection.add(
            ids=ids,
            embeddings=embeddings,
            metadatas=metadatas,
            documents=documents
        )
        return True
    except Exception as e:
        print(f"Error adding to ChromaDB: {e}")
        return False

def query_vector_store(
    user_id: int, 
    query: str, 
    subject_id: Optional[int] = None, 
    document_id: Optional[int] = None,
    limit: int = 5
) -> List[Dict[str, Any]]:
    """
    Queries ChromaDB for semantically similar chunks, with metadata filters.
    """
    query_emb = get_embedding(query, is_query=True)
    
    # Construct filters
    # ChromaDB metadata filter layout
    filter_dict = {"user_id": int(user_id)}
    
    if subject_id is not None and document_id is not None:
        where_filter = {
            "$and": [
                {"user_id": int(user_id)},
                {"subject_id": int(subject_id)},
                {"document_id": int(document_id)}
            ]
        }
    elif subject_id is not None:
        where_filter = {
            "$and": [
                {"user_id": int(user_id)},
                {"subject_id": int(subject_id)}
            ]
        }
    elif document_id is not None:
        where_filter = {
            "$and": [
                {"user_id": int(user_id)},
                {"document_id": int(document_id)}
            ]
        }
    else:
        where_filter = {"user_id": int(user_id)}

    try:
        results = collection.query(
            query_embeddings=[query_emb],
            n_results=limit,
            where=where_filter
        )
        
        retrieved_chunks = []
        if results and "documents" in results and results["documents"]:
            docs = results["documents"][0]
            metas = results["metadatas"][0]
            distances = results["distances"][0] if "distances" in results else [0.0] * len(docs)
            
            for i in range(len(docs)):
                retrieved_chunks.append({
                    "text": docs[i],
                    "metadata": metas[i],
                    "score": float(distances[i])
                })
        return retrieved_chunks
    except Exception as e:
        print(f"Error querying ChromaDB: {e}")
        return []

def delete_document_from_vector_store(document_id: int) -> bool:
    """
    Deletes all chunks belonging to a document from ChromaDB.
    """
    try:
        # ChromaDB allows filtering deletes by metadata
        collection.delete(where={"document_id": int(document_id)})
        return True
    except Exception as e:
        print(f"Error deleting from ChromaDB: {e}")
        return False
