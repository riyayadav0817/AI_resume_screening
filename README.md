# AI-Based Resume Screening and Candidate Shortlisting System

**HCLTech Career Shaper Programme – III Year**  
**Project No.: 34**  
**Domain:** Artificial Intelligence, Machine Learning and Natural Language Processing

---

## 1. Project Overview

The **AI-Based Resume Screening and Candidate Shortlisting System** is a web-based recruitment support application designed to simplify resume management, candidate analysis and preliminary screening.

The system allows recruiters to create job descriptions, upload resumes, analyze candidate qualifications and compare resumes against job requirements.

It uses **Natural Language Processing (NLP), TF-IDF and Cosine Similarity** to calculate resume–job matching scores and identify relevant technical skills. An additional **experimental Random Forest classification module** demonstrates the application of machine learning using structured candidate features.

The system assists recruiters in reviewing candidate information efficiently while keeping final shortlisting and rejection decisions under human control.

## 2. Project Objectives

- Develop an easy-to-use recruitment management platform.
- Support resume uploads in PDF and DOCX formats.
- Extract useful information from candidate resumes.
- Compare resumes with job descriptions using NLP techniques.
- Identify matched and missing technical skills.
- Detect education qualifications and experience information where possible.
- Store screening results for future review.
- Provide manual shortlist, reject and pending review options.
- Demonstrate an experimental Random Forest machine learning model.

## 3. Technology Stack

| Component | Technology |
|---|---|
| Frontend | React.js, Vite, JavaScript, HTML, CSS |
| Backend | Python, Flask |
| Database | SQLite, Flask-SQLAlchemy |
| Natural Language Processing | TF-IDF, Cosine Similarity, Skill Extraction |
| Machine Learning | Scikit-learn, Random Forest |
| Data Processing | NumPy, Pandas |
| Resume Processing | pdfminer.six, python-docx |
| Model Serialization | Joblib |
| Data Analysis | Jupyter Notebook |
| Supported Resume Formats | PDF, DOCX |

## 4. Key Features

### Recruiter Dashboard
Displays an overview of available jobs, uploaded candidates, screening records and shortlisted results.

### Job Management
Allows recruiters to create job openings with detailed job descriptions and technical requirements.

### Resume Upload
Supports PDF and DOCX resumes and stores extracted candidate information for further processing.

### Candidate Management
Displays uploaded candidates and allows recruiters to select candidates for screening.

### AI Resume Screening
Uses TF-IDF vectorization and cosine similarity to compare candidate resumes with selected job descriptions and generate a text-matching score.

### NLP-Based Skill Analysis
Provides preliminary analysis of:

- Matched technical skills
- Required skills not detected in the resume
- Technical skills identified in the resume
- Education qualifications
- Years of experience, where detectable

### Screening Results
Stores screening records and displays candidate–job matching results for recruiter review.

### Recruiter Review System
Supports three review statuses:

- **Pending:** Awaiting recruiter evaluation
- **Shortlisted:** Selected by the recruiter for further consideration
- **Rejected:** Not selected by the recruiter

### Random Forest Lab
Provides a separate experimental machine learning interface where users can explore the Random Forest model, view supported job roles and run manual feature-based predictions.

## 5. Resume Screening Workflow

1. The recruiter creates a job with its description and requirements.
2. A candidate resume is uploaded in PDF or DOCX format.
3. The backend extracts textual information from the resume.
4. TF-IDF converts resume and job-description text into numerical representations.
5. Cosine similarity calculates a text-matching score.
6. NLP techniques identify recognized technical skills and qualification-related information.
7. The screening result is stored in the SQLite database.
8. The recruiter reviews the results and manually updates the candidate's review status.

**Important:** The matching score represents textual similarity and should not be interpreted as a definitive measure of candidate suitability.

## 6. Experimental Random Forest Module

The project includes an experimental Random Forest classifier implemented using Scikit-learn.

The model was trained on **500 synthetic structured records** and is provided as a demonstration of supervised machine learning.

### Model Inputs

- Job Role
- Years of Experience
- Skills Matched
- Education Score
- Keyword Density

### Model Outputs

- Prediction
- Prediction Label
- Shortlist Probability

### Supported Roles

- Data Analyst
- HR Executive
- Project Manager
- QA Engineer
- Software Engineer

The Random Forest model is accessible through the **Random Forest Lab** section of the frontend.

**Disclaimer:** This model is trained on synthetic data and has not been validated for real-world hiring decisions. It is independent of the main automated resume-screening workflow and does not automatically shortlist or reject uploaded candidates.

## 7. Project Folder Structure

```text
AI_Resume_Screening/
│
├── backend/
│   ├── app.py
│   ├── nlp_engine.py
│   ├── ml_predictor.py
│   └── models/
│       ├── random_forest_model.pkl
│       ├── feature_columns.pkl
│       ├── feature_scaler.pkl
│       └── job_role_encoder.pkl
│
├── frontend/
│   ├── public/
│   │   └── favicon.svg
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── eslint.config.js
│
├── dataset/
│   ├── dataset.csv
│   └── data_dictionary.csv
│
├── notebook/
│   └── hcltech-resume-screening-eda.ipynb
│
├── requirements.txt
└── README.md
```

**Note:** Local database files, uploaded resumes, virtual environments, temporary backups and installed dependencies are excluded from the source-code submission package.

## 8. Installation and Setup

### Prerequisites

Ensure the following software is installed:

- Python
- Node.js and npm
- A terminal such as PowerShell
- A code editor such as Visual Studio Code

### Step 1: Extract the Project

Extract the submitted ZIP file into a folder of your choice.

Open PowerShell in the extracted project directory.

### Step 2: Backend Setup

Create a Python virtual environment:

```powershell
python -m venv .venv
```

Activate the environment:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install backend dependencies:

```powershell
python -m pip install -r requirements.txt
```

Set environment variables to limit numerical-library thread usage where necessary:

```powershell
$env:OPENBLAS_NUM_THREADS = "1"
$env:OMP_NUM_THREADS = "1"
$env:MKL_NUM_THREADS = "1"
$env:NUMEXPR_NUM_THREADS = "1"
```

Start the Flask backend from the project root:

```powershell
python -m flask --app backend.app run --host 127.0.0.1 --port 5000 --no-reload --no-debugger
```

**Backend URL:** http://127.0.0.1:5000

### Step 3: Frontend Setup

Open a second PowerShell terminal in the project directory.

Navigate to the frontend:

```powershell
cd frontend
```

Install frontend dependencies:

```powershell
npm install
```

Start the development server:

```powershell
npm run dev
```

**Frontend URL:** http://localhost:5173

### Step 4: Using the Application

1. Open the frontend URL in a web browser.
2. Navigate to **Manage Jobs** and create a job.
3. Open **Upload Resume** and upload a PDF or DOCX file.
4. Visit **Candidates** to view uploaded candidates.
5. Open **AI Screening**, enter a candidate ID and select a job.
6. Run screening to generate the similarity score and NLP analysis.
7. Review the saved result in **Screening Results**.
8. Use recruiter review actions when appropriate.
9. Explore the separate **Random Forest Lab** for experimental model demonstrations.

**Note:** Since the submission excludes the local SQLite database, a fresh setup will not contain the development environment's sample jobs, candidates or screening history.

## 9. API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/jobs` | Retrieve available jobs |
| POST | `/api/jobs` | Create a new job |
| GET | `/api/candidates` | Retrieve uploaded candidates |
| POST | `/api/resumes/upload` | Upload a candidate resume |
| POST | `/api/screen` | Run resume screening |
| GET | `/api/screening-results` | Retrieve saved screening records |
| GET | `/api/candidates/<candidate_id>/analysis` | Retrieve NLP candidate analysis |
| PATCH | `/api/screening-results/<screening_id>/review` | Update recruiter review status |
| GET | `/api/ml/supported-roles` | Retrieve supported experimental model roles |
| POST | `/api/ml/predict` | Run an experimental Random Forest prediction |

## 10. Testing and Verification

The following checks were performed during development:

- React frontend production build completed successfully using `npm run build`.
- All seven application navigation sections were manually checked.
- Job creation and resume-screening workflows were tested.
- NLP skill analysis was displayed for a React Developer screening example.
- The Random Forest Lab returned an experimental prediction through the backend API.
- Backend Python files passed syntax checks.
- Required Python modules were successfully imported.
- The final submission ZIP passed file-readability and unwanted-file checks.

These checks demonstrate the functionality tested during development; they do not constitute comprehensive production testing or validation of hiring-model accuracy.

## 11. Limitations

- Resume similarity scores do not directly measure overall candidate suitability.
- Skills and experience may be missed when they are written in unfamiliar formats.
- Missing detected skills do not necessarily indicate that a candidate lacks those skills.
- Text extraction quality may vary depending on resume formatting.
- The Random Forest classifier uses synthetic data and is experimental.
- The system is intended for academic demonstration rather than autonomous hiring decisions.
- Recruiter judgment is required for final candidate decisions.

## 12. Future Enhancements

Potential future improvements include:

- Integrating structured ML predictions with the resume-analysis workflow after appropriate validation.
- Improving resume parsing for complex document layouts.
- Expanding skill recognition and normalization.
- Adding recruiter search and filtering options.
- Introducing candidate ranking with clearer explanations.
- Improving authentication and role-based access control.
- Conducting model evaluation using representative data and fairness assessments.
- Supporting deployment to a cloud environment.

## 13. Conclusion

The **AI-Based Resume Screening and Candidate Shortlisting System** demonstrates how NLP, text similarity and experimental machine learning can assist recruitment workflows.

The application combines job management, resume upload, candidate analysis, screening records and recruiter-controlled review actions into a single web platform.

The project emphasizes that AI-generated indicators should support, rather than replace, informed human decisions.

---

## Project Details

**Project Title:** AI-Based Resume Screening and Candidate Shortlisting System  
**Programme:** HCLTech Career Shaper Programme – III Year  
**Project Number:** 34  
**Project Domain:** Artificial Intelligence and Machine Learning  

### Prepared By

**Riya**  
**ABES Engineering College**

*Developed for HCLTech as part of the HCLTech Career Shaper Programme – III Year, demonstrating the application of Artificial Intelligence, Natural Language Processing, and Machine Learning in resume screening and candidate shortlisting.*



**Note:** This project is a functional academic prototype. Its experimental Random Forest component is trained on synthetic data and is not validated for real-world recruitment decisions.