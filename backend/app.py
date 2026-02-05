# ------------------------------
# IMPORTANT: Disable TensorFlow completely
# ------------------------------
import os
os.environ["TRANSFORMERS_NO_TF"] = "1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"

# Standard library imports
import json
import hashlib
from datetime import datetime, timedelta
from functools import wraps
from collections import defaultdict

# Flask imports
from flask import Flask, request, jsonify
from flask_cors import CORS

# Project imports
from src.pdf_parser import extract_text_from_pdf
from src.preprocess import clean_text
from src.embeddings import get_embedding
from src.similarity import similarity_score
from src.llm_explainer import explain

# ============================
# ADVANCED FEATURES SETUP
# ============================

app = Flask(__name__)
CORS(app)

# Simple in-memory cache for embeddings
embedding_cache = {}
cache_timestamp = {}
CACHE_TTL = 3600  # 1 hour

# Rate limiting
request_history = defaultdict(list)
RATE_LIMIT_REQUESTS = 10
RATE_LIMIT_WINDOW = 3600  # 1 hour

# ============================
# HELPER FUNCTIONS
# ============================

def get_client_ip():
    """Extract client IP from request"""
    return request.headers.get('X-Forwarded-For', request.remote_addr)


def rate_limit(f):
    """Rate limiting decorator"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        client_ip = get_client_ip()
        now = datetime.now()
        
        # Clean old requests outside the window
        request_history[client_ip] = [
            req_time for req_time in request_history[client_ip]
            if (now - req_time).seconds < RATE_LIMIT_WINDOW
        ]
        
        # Check if limit exceeded
        if len(request_history[client_ip]) >= RATE_LIMIT_REQUESTS:
            return jsonify({
                "error": "Rate limit exceeded. Max 10 requests per hour."
            }), 429
        
        # Add current request
        request_history[client_ip].append(now)
        return f(*args, **kwargs)
    
    return decorated_function


def cache_embedding(text):
    """Cache embeddings to reduce API calls"""
    text_hash = hashlib.md5(text.encode()).hexdigest()
    
    # Check cache validity
    if text_hash in embedding_cache:
        cached_time = cache_timestamp.get(text_hash)
        if cached_time and (datetime.now() - cached_time).seconds < CACHE_TTL:
            return embedding_cache[text_hash]
    
    # Get fresh embedding
    embedding = get_embedding(text)
    embedding_cache[text_hash] = embedding
    cache_timestamp[text_hash] = datetime.now()
    
    return embedding


def analyze_resume_match(jd_text, resume_text, score):
    """Generate detailed AI-powered analysis"""
    try:
        # Use LLM to generate detailed explanation
        explanation = explain(resume_text[:2000], jd_text[:2000])
        
        # Add score interpretation
        if score >= 0.8:
            assessment = "Excellent match - Strong alignment with job requirements"
        elif score >= 0.6:
            assessment = "Good match - Significant alignment with key requirements"
        elif score >= 0.4:
            assessment = "Fair match - Some relevant skills and experience"
        else:
            assessment = "Limited match - Minimal alignment with requirements"
        
        return {
            "assessment": assessment,
            "detailed_analysis": explanation
        }
    except Exception as e:
        print(f"⚠️ LLM Analysis error: {e}")
        return {
            "assessment": f"Score: {score:.1%}",
            "detailed_analysis": "Unable to generate AI analysis at this time."
        }


def validate_request():
    """Validate incoming request data"""
    errors = []
    
    # Check job description
    jd_text = request.form.get("job_description", "").strip()
    if not jd_text:
        errors.append("Job description is required")
    elif len(jd_text) < 50:
        errors.append("Job description must be at least 50 characters")
    elif len(jd_text) > 50000:
        errors.append("Job description exceeds maximum length (50,000 characters)")
    
    # Check files
    files = request.files.getlist("resumes")
    if not files:
        errors.append("At least one resume file is required")
    elif len(files) > 10:
        errors.append("Maximum 10 resume files allowed")
    
    # Validate file sizes (5MB each)
    for file in files:
        if file.content_length and file.content_length > 5 * 1024 * 1024:
            errors.append(f"File '{file.filename}' exceeds 5MB limit")
    
    return errors, jd_text, files


# ============================
# API ROUTES
# ============================

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "cache_size": len(embedding_cache)
    }), 200


@app.route("/stats", methods=["GET"])
def stats():
    """Get service statistics"""
    return jsonify({
        "cached_embeddings": len(embedding_cache),
        "active_clients": len(request_history),
        "rate_limit_window": RATE_LIMIT_WINDOW,
        "rate_limit_requests": RATE_LIMIT_REQUESTS,
        "cache_ttl": CACHE_TTL
    }), 200


@app.route("/rank", methods=["POST"])
@rate_limit
def rank_resumes():
    """Main resume ranking endpoint"""
    try:
        print("🔥 POST request received")
        
        # Validate request
        errors, jd_text, files = validate_request()
        if errors:
            return jsonify({"error": "; ".join(errors)}), 400
        
        print(f"📄 Processing: {len(files)} resumes")
        
        # Process job description
        jd_clean = clean_text(jd_text)
        jd_embedding = cache_embedding(jd_clean)
        
        results = []
        
        for idx, file in enumerate(files, 1):
            try:
                # Extract and clean resume text
                resume_text = extract_text_from_pdf(file)
                
                if not resume_text or len(resume_text.strip()) < 10:
                    results.append({
                        "name": file.filename,
                        "score": 0,
                        "explanation": "Unable to extract text from PDF"
                    })
                    continue
                
                resume_clean = clean_text(resume_text)
                
                # Get embedding (cached if available)
                resume_embedding = cache_embedding(resume_clean)
                
                # Similarity score
                score = similarity_score(jd_embedding, resume_embedding)
                
                # Generate detailed analysis
                analysis = analyze_resume_match(jd_text, resume_text, score)
                
                results.append({
                    "name": file.filename,
                    "score": round(score * 100, 2),
                    "explanation": analysis["detailed_analysis"],
                    "assessment": analysis["assessment"],
                    "rank": 0  # Will be set after sorting
                })
                
                print(f"✅ Processed {idx}/{len(files)}: {file.filename}")
            
            except Exception as e:
                print(f"⚠️ Error processing {file.filename}: {e}")
                results.append({
                    "name": file.filename,
                    "score": 0,
                    "explanation": f"Error processing file: {str(e)}"
                })
        
        # Sort by score (descending)
        results.sort(key=lambda x: x["score"], reverse=True)
        
        # Add rank numbers
        for idx, result in enumerate(results, 1):
            result["rank"] = idx
        
        print("✅ Ranking completed successfully")
        
        return jsonify({
            "results": results,
            "summary": {
                "total": len(results),
                "top_score": max([r["score"] for r in results], default=0),
                "avg_score": round(sum([r["score"] for r in results]) / len(results), 2) if results else 0,
                "processed_at": datetime.now().isoformat()
            }
        }), 200
    
    except Exception as e:
        print(f"❌ BACKEND ERROR: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            "error": "Internal server error. Please try again.",
            "details": str(e) if app.debug else None
        }), 500


@app.route("/clear-cache", methods=["POST"])
def clear_cache():
    """Clear embedding cache (admin endpoint)"""
    global embedding_cache, cache_timestamp
    cache_size = len(embedding_cache)
    embedding_cache.clear()
    cache_timestamp.clear()
    
    return jsonify({
        "message": "Cache cleared",
        "cleared_entries": cache_size
    }), 200


# ============================
# ERROR HANDLERS
# ============================

@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Endpoint not found"}), 404


@app.errorhandler(405)
def method_not_allowed(error):
    return jsonify({"error": "Method not allowed"}), 405


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500


# ============================
# RUN SERVER
# ============================

if __name__ == "__main__":
    app.run(debug=True, threaded=True)
