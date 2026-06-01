import os
import json
import google.generativeai as genai
from typing import List, Dict, Any, Optional
from ..core.config import settings

def get_gemini_client():
    if not settings.GEMINI_API_KEY:
        return None
    genai.configure(api_key=settings.GEMINI_API_KEY)
    return genai

def summarize_and_categorize_document(text: str, filename: str) -> Dict[str, Any]:
    """
    Summarizes document content and categorizes its main topic.
    Returns a dict with 'summary' and 'category'.
    """
    client = get_gemini_client()
    if not client:
        return {
            "summary": "AI summary not available: Gemini API Key is missing.",
            "category": "Uncategorized"
        }
    
    # Restrict input text length to fit context window smoothly
    truncated_text = text[:30000]
    
    prompt = f"""
    Analyze the following text extracted from a study document named "{filename}".
    1. Provide a comprehensive summary highlighting key concepts, formulas, and ideas (3-5 paragraphs).
    2. Categorize the document into a single academic topic (e.g., "Linear Algebra", "Classical Mechanics", "Organic Chemistry", "Database Systems", "Neural Networks").
    
    Return the response ONLY as a JSON object with two keys:
    "summary": "a markdown string summarizing the text",
    "category": "a single category name"
    """
    
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(
            [prompt, truncated_text],
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error in summarize_and_categorize_document: {e}")
        return {
            "summary": f"Could not summarize. Error details: {str(e)}",
            "category": "General Study Material"
        }

def generate_study_twin_chat_response(
    query: str,
    chat_history: List[Dict[str, str]],
    context_chunks: List[str],
    user_profile: Dict[str, Any],
    response_mode: str
) -> str:
    """
    Answers user questions adaptive to selected response modes and user profiles.
    Modes: "beginner", "exam", "expert", "teacher"
    """
    client = get_gemini_client()
    if not client:
        return "I'm sorry, I cannot answer right now as the Gemini API Key is not configured."
        
    # Build System Prompt based on Mode
    mode_instructions = {
        "beginner": (
            "Explain the concepts using extremely simple language, everyday analogies, "
            "and avoid high-level technical jargon where possible. End with a list of "
            "simple key takeaways."
        ),
        "exam": (
            "Provide formal, structured answers matching university-level grading criteria. "
            "Use clear headings, precise bullet points, formal definitions, and "
            "structure your response to score maximum marks on an exam. Bold important keywords."
        ),
        "expert": (
            "Provide highly technical, detailed, and mathematically rigorous explanations. "
            "Include code blocks, mathematical equations formatted in LaTeX (e.g., $E=mc^2$), "
            "and cite precise mechanisms or architectural configurations. Assume the reader is a peer expert."
        ),
        "teacher": (
            "Act as an interactive Socratic teacher. Do not just hand over the answer. "
            "Provide a scaffolded explanation: break down the concept step-by-step, "
            "explain the reasoning behind each step, and end with a thought-provoking "
            "question to test the student's understanding."
        )
    }.get(response_mode.lower(), "beginner")

    # Format retrieved materials
    context_str = "\n---\n".join(context_chunks) if context_chunks else "No specific study documents retrieved. Answer using general knowledge."
    
    # Format user personalization profile
    profile_str = (
        f"- Preferred Learning Style: {user_profile.get('preferred_learning_style', 'general')}\n"
        f"- Level: {user_profile.get('level', 1)} (XP: {user_profile.get('xp', 0)})\n"
        f"- Weak Topics: {', '.join(user_profile.get('weak_topics', []))}\n"
        f"- Strong Topics: {', '.join(user_profile.get('strong_topics', []))}"
    )

    system_instruction = f"""
    You are the student's "AI Study Twin" — a personalized AI clone of their learning style, tutor, and mentor.
    
    Your core objectives:
    1. Match the requested tutoring persona and level of complexity:
       MODE: {response_mode.upper()}
       INSTRUCTION: {mode_instructions}
    
    2. Adjust explanation style depending on their profile:
       {profile_str}
       
    3. Ground your answers primarily in the retrieved context documents provided below. If the answer is not in the documents, draw on your general knowledge but clearly state that it is general knowledge, referencing the uploaded topics where appropriate.
    
    4. Support clean Markdown formatting, tables, code syntax highlighting, and mathematical formulas in LaTeX format ($formula$ or $$block_formula$$).
    """
    
    # Format Chat history for Gemini
    # Convert standard API format to Gemini's content format
    contents = []
    
    # Add a system description in prompt (since we configure it as context)
    contents.append({"role": "user", "parts": [f"System Instruction: {system_instruction}\n\nHere is the study material context:\n{context_str}"]})
    contents.append({"role": "model", "parts": ["Understood. I will act as the student's AI Study Twin matching their preferences, using the context provided, and answering in the requested mode."]})
    
    for msg in chat_history[-10:]:  # Last 10 messages to avoid context explosion
        role = "user" if msg["role"] == "user" else "model"
        contents.append({"role": role, "parts": [msg["content"]]})
        
    # Append latest query
    contents.append({"role": "user", "parts": [query]})
    
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(contents)
        return response.text
    except Exception as e:
        print(f"Error generating chat response: {e}")
        return f"Sorry, I encountered an error while processing your question: {str(e)}"

def generate_quiz(
    material_text: str,
    subject_name: str,
    difficulty: str,
    count: int = 5
) -> List[Dict[str, Any]]:
    """
    Generates structured quiz questions based on document text.
    Question types: MCQ, True/False, Fill-in-the-blanks, Short Answer, Long Answer, Numerical.
    """
    client = get_gemini_client()
    if not client:
        return []
        
    truncated_text = material_text[:20000]
    
    prompt = f"""
    You are an expert examiner. Generate a quiz of exactly {count} questions based on the text provided.
    Subject: {subject_name}
    Difficulty: {difficulty} (options: easy, medium, hard, exam)
    
    Ensure a mix of these question types:
    - MCQ (multiple choice with 4 options)
    - True/False
    - Fill in the blanks
    - Short Answer
    - Numerical Problems (if applicable, otherwise use other types)
    
    Return the response ONLY as a JSON list of objects matching the following schema:
    [
      {{
        "id": 1,
        "type": "MCQ" | "True/False" | "Fill in the blank" | "Short Answer" | "Numerical",
        "question": "The question text",
        "options": ["Option A", "Option B", "Option C", "Option D"], // ONLY for MCQ, empty or omitted for others
        "correct_answer": "The exact correct answer (e.g. Option B, True, or specific string)",
        "explanation": "A detailed explanation of why this answer is correct and the reasoning behind it."
      }}
    ]
    """
    
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(
            [prompt, truncated_text],
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error generating quiz: {e}")
        return []

def generate_study_plan(
    user_name: str,
    subjects: List[str],
    weak_topics: List[Dict[str, Any]],
    available_hours: float,
    exam_date: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates a personalized daily/weekly study schedule prioritizing weak topics.
    """
    client = get_gemini_client()
    if not client:
        return {"plan_summary": "Planner not configured.", "schedule": []}
        
    weak_str = "\n".join([f"- {wt['topic_name']} (Subject: {wt['subject_name']}, Weakness Score: {wt['weakness_score']}/1.0)" for wt in weak_topics])
    
    prompt = f"""
    Create a personalized study plan for {user_name}.
    - Subjects: {', '.join(subjects)}
    - Weak Topics to prioritize:
    {weak_str}
    - Study hours available per day: {available_hours} hours
    - Target Exam Date: {exam_date or 'No upcoming exam date specified'}
    
    Create a structured daily schedule for a 7-day week (Monday to Sunday).
    Ensure we dedicate more time to weak topics, block in breaks, and allocate review sessions.
    
    Return the plan ONLY as a JSON object with this exact structure:
    {{
      "title": "Study Plan Name",
      "summary": "High-level strategy summary based on preferences",
      "schedule": [
        {{
          "day": "Monday",
          "blocks": [
            {{
              "time": "18:00 - 19:30",
              "subject": "Subject Name",
              "focus": "Topic or task (e.g. review weak topics, take practice quiz)",
              "duration_minutes": 90
            }}
          ]
        }}
      ]
    }}
    """
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error generating study plan: {e}")
        return {"title": "Error Generating Plan", "summary": str(e), "schedule": []}

def generate_smart_notes(material_text: str, note_type: str) -> Dict[str, Any]:
    """
    Generates notes of various formats:
    note_type: "revision", "mindmap", "flashcards", "formula"
    """
    client = get_gemini_client()
    if not client:
        return {"content": "Not available."}
        
    truncated_text = material_text[:20000]
    
    instructions = {
        "revision": "Generate detailed revision notes with bullet points, main definitions, and numbered key explanations.",
        "mindmap": "Generate a visual mind map in Mermaid diagram syntax. Wrap it in a single markdown block using ```mermaid. Ensure node labels are alphanumeric and clean.",
        "flashcards": "Extract key concepts as a list of Flashcards (Front/Back format). Limit to 10-15 flashcards.",
        "formula": "Extract all formulas, mathematical notations, or laws. Provide descriptions, parameters, and SI units in a Markdown table."
    }.get(note_type.lower(), "revision")
    
    prompt = f"""
    Analyze the following study material and generate a specialized notes layout.
    Type of notes: {note_type.upper()}
    Instruction: {instructions}
    
    Output the response ONLY as a JSON object with this key:
    "content": "the formatted Markdown string of the generated content"
    """
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(
            [prompt, truncated_text],
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error generating smart notes: {e}")
        return {"content": f"Could not generate notes: {str(e)}"}

def generate_revision_sheet(
    subject_name: str, 
    weak_topics: List[str], 
    context_text: str
) -> Dict[str, Any]:
    """
    Generates important questions, last-minute sheets, and practice exams.
    """
    client = get_gemini_client()
    if not client:
        return {"content": "Revision Assistant is not active."}
        
    weak_topics_str = ", ".join(weak_topics)
    truncated_context = context_text[:15000] if context_text else ""
    
    prompt = f"""
    You are an AI Revision Assistant preparing a student for an upcoming exam in {subject_name}.
    Their weakest topics in this subject are: {weak_topics_str}.
    
    Generate an Exam Revision Kit containing:
    1. Predicted Exam Topics (top 3 areas they must study).
    2. Last-Minute cheat sheet summaries.
    3. Practice questions (with detailed answers collapsed under a <details> HTML tag).
    
    Output the response ONLY as a JSON object with this key:
    "content": "the formatted Markdown string of the generated revision kit"
    """
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        response = model.generate_content(
            [prompt, truncated_context],
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        print(f"Error in generate_revision_sheet: {e}")
        return {"content": f"Error: {str(e)}"}
