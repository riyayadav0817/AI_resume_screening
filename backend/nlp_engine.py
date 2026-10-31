import os
import re

from pdfminer.high_level import extract_text
from docx import Document
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

TECHNICAL_SKILLS = {
    "python", "java", "javascript", "typescript",
    "react", "angular", "node.js", "flask", "django",
    "fastapi", "sql", "mysql", "postgresql",
    "mongodb", "html", "css", "git", "docker",
    "kubernetes", "aws", "azure", "linux",
    "pandas", "numpy", "scikit-learn",
    "machine learning", "deep learning",
    "tensorflow", "pytorch", "power bi",
    "tableau", "excel", "rest api",
    "selenium", "pytest", "jira", "c++", "c#",
}


EDUCATION_PATTERNS = {
    "PhD": [
        r"\bph\.?d\.?\b",
        r"\bdoctorate\b",
    ],
    "Master's": [
        r"\bm\.?\s?tech\b",
        r"\bm\.?\s?sc\b",
        r"\bmba\b",
        r"\bmaster(?:'s)?\b",
    ],
    "Bachelor's": [
        r"\bb\.?\s?tech\b",
        r"\bb\.?\s?e\b",
        r"\bb\.?\s?sc\b",
        r"\bbca\b",
        r"\bbba\b",
        r"\bbachelor(?:'s)?\b",
    ],
    "Diploma": [
        r"\bdiploma\b",
    ],
}


def extract_resume_text(file_path):
    if not os.path.isfile(file_path):
        raise FileNotFoundError("Resume file not found.")

    extension = os.path.splitext(file_path)[1].lower()

    if extension == ".pdf":
        text = extract_text(file_path)

    elif extension == ".docx":
        document = Document(file_path)
        parts = [p.text for p in document.paragraphs]

        for table in document.tables:
            for row in table.rows:
                for cell in row.cells:
                    parts.append(cell.text)

        text = "\n".join(parts)

    else:
        raise ValueError("Only PDF and DOCX files are supported.")

    return " ".join(text.split())


def match_resume(resume_text, job_description):
    if not resume_text.strip() or not job_description.strip():
        raise ValueError(
            "Resume and job description cannot be empty."
        )

    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2)
    )

    matrix = vectorizer.fit_transform([
        resume_text,
        job_description
    ])

    similarity = cosine_similarity(
        matrix[0:1],
        matrix[1:2]
    )[0][0]

    return round(float(similarity) * 100, 2)


def extract_years_experience(resume_text):
    patterns = [
        r"(\d+(?:\.\d+)?)\s*\+?\s*years?\s+of\s+experience",
        r"experience\s*[:\-]\s*(\d+(?:\.\d+)?)\s*\+?\s*years?",
        r"(\d+(?:\.\d+)?)\s*\+?\s*years?\s+experience",
    ]

    matches = []

    for pattern in patterns:
        for value in re.findall(
            pattern,
            resume_text,
            flags=re.IGNORECASE
        ):
            matches.append(float(value))

    return max(matches) if matches else None


def extract_matched_keywords(resume_text, job_description):
    stop_words = {
        "the", "and", "for", "with", "from", "that",
        "this", "have", "will", "your", "you", "are",
        "our", "job", "role", "work", "years",
        "experience", "required", "candidate",
    }

    def tokenize(text):
        words = re.findall(
            r"[a-zA-Z][a-zA-Z0-9+#.]*",
            text.lower()
        )

        return {
            word for word in words
            if len(word) >= 2 and word not in stop_words
        }

    resume_words = tokenize(resume_text)
    job_words = tokenize(job_description)

    matched = resume_words.intersection(job_words)

    return {
        "matched_keywords": sorted(matched),
        "matched_keyword_count": len(matched),
        "job_keyword_count": len(job_words),
    }


def extract_technical_skills(text):
    """
    Detect known technical skill mentions.
    Uses phrase boundaries to avoid partial-word matches.
    """
    found = []

    for skill in sorted(TECHNICAL_SKILLS):
        pattern = (
            r"(?<!\w)"
            + re.escape(skill)
            + r"(?!\w)"
        )

        if re.search(pattern, text, flags=re.IGNORECASE):
            found.append(skill)

    return found


def match_technical_skills(resume_text, job_description):
    resume_skills = set(
        extract_technical_skills(resume_text)
    )

    job_skills = set(
        extract_technical_skills(job_description)
    )

    matched = resume_skills.intersection(job_skills)
    missing = job_skills.difference(resume_skills)

    return {
        "resume_skills": sorted(resume_skills),
        "job_skills": sorted(job_skills),
        "matched_skills": sorted(matched),
        "missing_skills": sorted(missing),
        "matched_skill_count": len(matched),
    }


def extract_education_qualification(resume_text):
    """
    Detect education qualification mentions.
    Returns the highest recognized qualification.
    Does not invent an education_score.
    """
    for qualification, patterns in EDUCATION_PATTERNS.items():
        for pattern in patterns:
            if re.search(
                pattern,
                resume_text,
                flags=re.IGNORECASE
            ):
                return qualification

    return None


def extract_ml_feature_candidates(
    resume_text,
    job_description
):
    if not resume_text.strip() or not job_description.strip():
        raise ValueError(
            "Resume and job description cannot be empty."
        )

    keyword_data = extract_matched_keywords(
        resume_text,
        job_description
    )

    skill_data = match_technical_skills(
        resume_text,
        job_description
    )

    education = extract_education_qualification(
        resume_text
    )

    return {
        "years_exp": extract_years_experience(resume_text),
        "keyword_analysis": keyword_data,
        "technical_skill_analysis": skill_data,
        "education_qualification": education,

        # Training feature definitions are not validated yet.
        "education_score": None,
        "skills_matched": None,
        "keyword_density": None,
        "ready_for_ml_prediction": False,
    }


def screen_resume(file_path, job_description):
    resume_text = extract_resume_text(file_path)

    if not resume_text:
        raise ValueError(
            "No readable text found in resume."
        )

    return {
        "filename": os.path.basename(file_path),
        "match_score": match_resume(
            resume_text,
            job_description
        ),
        "status": "Human review required"
    }
