
from pathlib import Path
from datetime import datetime, timezone
from uuid import uuid4

from flask import Flask, jsonify, request
from flask_sqlalchemy import SQLAlchemy
from werkzeug.utils import secure_filename

from backend.nlp_engine import (
    screen_resume,
    extract_resume_text,
    extract_ml_feature_candidates,
)

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = BASE_DIR / "resume_screening.db"

app.config["SQLALCHEMY_DATABASE_URI"] = (
    f"sqlite:///{DB_PATH.as_posix()}"
)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024

db = SQLAlchemy(app)

UPLOAD_FOLDER = BASE_DIR / "uploads"
UPLOAD_FOLDER.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {".pdf", ".docx"}


# ------------------------------------
# Database Models
# ------------------------------------

class Job(db.Model):
    id = db.Column(
        db.Integer,
        primary_key=True
    )
    title = db.Column(
        db.String(150),
        nullable=False
    )
    description = db.Column(
        db.Text,
        nullable=False
    )


class Candidate(db.Model):
    id = db.Column(
        db.Integer,
        primary_key=True
    )
    filename = db.Column(
        db.String(255),
        nullable=False
    )
    uploaded_at = db.Column(
        db.DateTime,
        default=lambda: datetime.now(timezone.utc)
    )


class ScreeningResult(db.Model):
    id = db.Column(
        db.Integer,
        primary_key=True
    )
    job_id = db.Column(
        db.Integer,
        db.ForeignKey("job.id"),
        nullable=False
    )
    candidate_id = db.Column(
        db.Integer,
        db.ForeignKey("candidate.id"),
        nullable=False
    )
    similarity_score = db.Column(
        db.Float,
        nullable=False
    )
    review_status = db.Column(
        db.String(30),
        default="pending",
        nullable=False
    )


# ------------------------------------
# Home API
# ------------------------------------

@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "project": "AI-Based Resume Screening System",
        "message": "Flask backend and database are running!",
        "status": "success"
    }), 200


# ------------------------------------
# Create Job
# ------------------------------------

@app.route("/api/jobs", methods=["POST"])
def create_job():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Valid JSON data is required"
        }), 400

    title = data.get("title")
    description = data.get("description")

    if not isinstance(title, str) or not title.strip():
        return jsonify({
            "error": "Job title is required"
        }), 400

    if not isinstance(description, str) or not description.strip():
        return jsonify({
            "error": "Job description is required"
        }), 400

    job = Job(
        title=title.strip(),
        description=description.strip()
    )

    try:
        db.session.add(job)
        db.session.commit()
    except Exception:
        db.session.rollback()
        app.logger.exception("Failed to create job")

        return jsonify({
            "error": "Could not create job"
        }), 500

    return jsonify({
        "message": "Job created successfully!",
        "job_id": job.id,
        "title": job.title
    }), 201


# ------------------------------------
# Get All Jobs
# ------------------------------------

@app.route("/api/jobs", methods=["GET"])
def get_jobs():
    jobs = db.session.execute(
        db.select(Job).order_by(Job.id)
    ).scalars().all()

    job_list = [
        {
            "id": job.id,
            "title": job.title,
            "description": job.description
        }
        for job in jobs
    ]

    return jsonify({
        "total_jobs": len(job_list),
        "jobs": job_list
    }), 200


# ------------------------------------
# Get All Candidates
# ------------------------------------

@app.route("/api/candidates", methods=["GET"])
def get_candidates():
    candidates = db.session.execute(
        db.select(Candidate).order_by(
            Candidate.id.desc()
        )
    ).scalars().all()

    candidate_list = []

    for candidate in candidates:
        candidate_list.append({
            "candidate_id": candidate.id,
            "filename": candidate.filename,
            "uploaded_at": (
                candidate.uploaded_at.isoformat()
                if candidate.uploaded_at
                else None
            )
        })

    return jsonify({
        "total_candidates": len(candidate_list),
        "candidates": candidate_list
    }), 200


# ------------------------------------
# Upload Resume
# ------------------------------------

@app.route("/api/resumes/upload", methods=["POST"])
def upload_resume():
    if "resume" not in request.files:
        return jsonify({
            "error": "Resume file is required"
        }), 400

    file = request.files["resume"]

    if not file.filename:
        return jsonify({
            "error": "No file selected"
        }), 400

    original_name = secure_filename(file.filename)
    extension = Path(original_name).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        return jsonify({
            "error": "Only PDF and DOCX files are allowed"
        }), 400

    stored_name = f"{uuid4().hex}{extension}"
    file_path = UPLOAD_FOLDER / stored_name

    try:
        file.save(file_path)
    except OSError:
        app.logger.exception("Failed to save uploaded file")

        return jsonify({
            "error": "Could not save resume file"
        }), 500

    candidate = Candidate(filename=stored_name)

    try:
        db.session.add(candidate)
        db.session.commit()
    except Exception:
        db.session.rollback()
        file_path.unlink(missing_ok=True)

        app.logger.exception("Failed to save candidate")

        return jsonify({
            "error": "Could not save resume record"
        }), 500

    return jsonify({
        "message": "Resume uploaded successfully!",
        "candidate_id": candidate.id,
        "original_filename": original_name
    }), 201


# ------------------------------------
# Screen Candidate
# Prevent Duplicate Screenings
# ------------------------------------

@app.route("/api/screen", methods=["POST"])
def screen_candidate():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Valid JSON data is required"
        }), 400

    candidate_id = data.get("candidate_id")
    job_id = data.get("job_id")

    if (
        type(candidate_id) is not int
        or type(job_id) is not int
        or candidate_id < 1
        or job_id < 1
    ):
        return jsonify({
            "error": (
                "candidate_id and job_id "
                "must be positive integers"
            )
        }), 400

    candidate = db.session.get(
        Candidate,
        candidate_id
    )

    job = db.session.get(
        Job,
        job_id
    )

    if candidate is None:
        return jsonify({
            "error": "Candidate not found"
        }), 404

    if job is None:
        return jsonify({
            "error": "Job not found"
        }), 404

    # Check for an existing screening of the
    # same candidate against the same job.
    #
    # Order by descending ID so that if old
    # duplicate records exist, we return the
    # latest one without deleting any records.

    existing_screening = db.session.execute(
        db.select(ScreeningResult)
        .where(
            ScreeningResult.candidate_id == candidate.id,
            ScreeningResult.job_id == job.id
        )
        .order_by(ScreeningResult.id.desc())
    ).scalars().first()

    if existing_screening is not None:
        return jsonify({
            "message": (
                "This candidate has already been "
                "screened for this job."
            ),
            "screening_id": existing_screening.id,
            "candidate_id": candidate.id,
            "job_id": job.id,
            "match_score": (
                existing_screening.similarity_score
            ),
            "review_status": (
                existing_screening.review_status
            ),
            "already_screened": True,
            "note": (
                "Existing screening result returned; "
                "human review required"
            )
        }), 200

    resume_path = UPLOAD_FOLDER / candidate.filename

    if not resume_path.is_file():
        return jsonify({
            "error": "Resume file not found"
        }), 404

    try:
        result = screen_resume(
            str(resume_path),
            job.description
        )

        score = float(result["match_score"])

        if not (0 <= score <= 100):
            raise ValueError(
                "Similarity score is outside 0-100"
            )

    except (
        ValueError,
        KeyError,
        TypeError,
        OSError
    ) as error:
        app.logger.warning(
            "Screening failed: %s",
            error
        )

        return jsonify({
            "error": "Could not process resume"
        }), 422

    screening = ScreeningResult(
        candidate_id=candidate.id,
        job_id=job.id,
        similarity_score=score,
        review_status="pending"
    )

    try:
        db.session.add(screening)
        db.session.commit()
    except Exception:
        db.session.rollback()

        app.logger.exception(
            "Failed to save screening result"
        )

        return jsonify({
            "error": "Could not save screening result"
        }), 500

    return jsonify({
        "message": "Resume screening completed!",
        "screening_id": screening.id,
        "candidate_id": candidate.id,
        "job_id": job.id,
        "match_score": score,
        "review_status": screening.review_status,
        "already_screened": False,
        "note": (
            "Similarity score only; "
            "human review required"
        )
    }), 201


# ------------------------------------
# Get All Screening Results
# ------------------------------------

@app.route(
    "/api/screening-results",
    methods=["GET"]
)
def get_screening_results():
    results = db.session.execute(
        db.select(ScreeningResult).order_by(
            ScreeningResult.similarity_score.desc(),
            ScreeningResult.id.asc()
        )
    ).scalars().all()

    result_list = []

    for result in results:
        job = db.session.get(
            Job,
            result.job_id
        )

        result_list.append({
            "screening_id": result.id,
            "candidate_id": result.candidate_id,
            "job_id": result.job_id,
            "job_title": (
                job.title if job else None
            ),
            "match_score": result.similarity_score,
            "review_status": result.review_status
        })

    return jsonify({
        "total_results": len(result_list),
        "results": result_list
    }), 200


# ------------------------------------
# Update Recruiter Review Status
# ------------------------------------

@app.route(
    "/api/screening-results/<int:result_id>/review",
    methods=["PATCH"]
)
def update_review_status(result_id):
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "Valid JSON data is required"
        }), 400

    status = data.get("review_status")

    allowed_statuses = {
        "pending",
        "shortlisted",
        "rejected"
    }

    if (
        not isinstance(status, str)
        or status not in allowed_statuses
    ):
        return jsonify({
            "error": (
                "Status must be pending, "
                "shortlisted, or rejected"
            )
        }), 400

    result = db.session.get(
        ScreeningResult,
        result_id
    )

    if result is None:
        return jsonify({
            "error": "Screening result not found"
        }), 404

    result.review_status = status

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

        app.logger.exception(
            "Failed to update review status"
        )

        return jsonify({
            "error": "Could not update review status"
        }), 500

    return jsonify({
        "message": (
            "Review status updated successfully!"
        ),
        "screening_id": result.id,
        "review_status": result.review_status
    }), 200


# ------------------------------------
# Candidate NLP Feature Analysis
# Does not change recruiter review status
# ------------------------------------

@app.route(
    "/api/candidates/<int:candidate_id>/analysis",
    methods=["GET"]
)
def analyze_candidate(candidate_id):
    candidate = db.session.get(
        Candidate,
        candidate_id
    )

    if candidate is None:
        return jsonify({
            "error": "Candidate not found"
        }), 404

    job_id = request.args.get(
        "job_id",
        type=int
    )

    if job_id is None or job_id < 1:
        return jsonify({
            "error": "Valid job_id is required"
        }), 400

    job = db.session.get(Job, job_id)

    if job is None:
        return jsonify({
            "error": "Job not found"
        }), 404

    resume_path = UPLOAD_FOLDER / candidate.filename

    if not resume_path.is_file():
        return jsonify({
            "error": "Resume file not found"
        }), 404

    try:
        resume_text = extract_resume_text(
            str(resume_path)
        )

        if not resume_text.strip():
            raise ValueError(
                "No readable text found in resume"
            )

        features = extract_ml_feature_candidates(
            resume_text,
            job.description
        )

    except Exception:
        app.logger.exception(
            "Candidate NLP analysis failed"
        )

        return jsonify({
            "error": "Could not analyze resume"
        }), 422

    return jsonify({
        "candidate_id": candidate.id,
        "job_id": job.id,
        "job_title": job.title,
        "analysis": features,
        "note": (
            "Preliminary NLP analysis only. "
            "ML features are not yet validated. "
            "Human review required."
        )
    }), 200

# ------------------------------------
# Initialize Database
# ------------------------------------

with app.app_context():
    db.create_all()
    print("Database tables created successfully!")

@app.route("/api/ml/supported-roles", methods=["GET"])
def ml_supported_roles():
    try:
        from backend.ml_predictor import get_supported_roles

        return jsonify({
            "model": "Random Forest",
            "supported_roles": get_supported_roles(),
            "status": "experimental",
            "note": (
                "The model was trained on synthetic data. "
                "It is not used for automatic hiring decisions."
            ),
        }), 200

    except Exception:
        app.logger.exception("Unable to load ML model")

        return jsonify({
            "error": "ML model is currently unavailable."
        }), 503

    
@app.route("/api/ml/predict", methods=["POST"])
def ml_predict():
    from flask import request

    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        return jsonify({
            "error": "A JSON object is required."
        }), 400

    required_fields = [
        "years_exp",
        "skills_matched",
        "education_score",
        "keyword_density",
        "job_role",
    ]

    missing_fields = [
        field for field in required_fields
        if field not in data or data[field] is None
    ]

    if missing_fields:
        return jsonify({
            "error": "Missing required ML features.",
            "missing_fields": missing_fields,
        }), 400

    try:
        from backend.ml_predictor import (
            get_supported_roles,
            predict_candidate,
        )

        if data["job_role"] not in get_supported_roles():
            return jsonify({
                "error": "Unsupported job role.",
                "supported_roles": get_supported_roles(),
            }), 400

        prediction = predict_candidate(
            years_exp=data["years_exp"],
            skills_matched=data["skills_matched"],
            education_score=data["education_score"],
            keyword_density=data["keyword_density"],
            job_role=data["job_role"],
        )

        return jsonify({
            "status": "experimental",
            "prediction": prediction,
            "warning": (
                "This model was trained on synthetic data. "
                "Input features must match the training definitions. "
                "Do not use this output for automatic hiring decisions."
            ),
        }), 200

    except ValueError as error:
        return jsonify({
            "error": str(error),
        }), 400

    except Exception:
        app.logger.exception("ML prediction failed")
        return jsonify({
            "error": "ML prediction is currently unavailable."
        }), 503

# ------------------------------------
# Run Flask
# ------------------------------------

if __name__ == "__main__":
    app.run(debug=True)
