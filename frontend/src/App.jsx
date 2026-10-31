
import { useEffect, useState } from 'react'
import './App.css'

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: '▦' },
  { id: 'jobs', label: 'Manage Jobs', icon: '▣' },
  { id: 'upload', label: 'Upload Resume', icon: '↑' },
  { id: 'candidates', label: 'Candidates', icon: '♙' },
  { id: 'screening', label: 'AI Screening', icon: '✧' },
  { id: 'results', label: 'Screening Results', icon: '☷' },
  { id: 'ml-lab', label: 'Random Forest Lab', icon: '♧' },
]

const modelFeatures = [
  {
    name: 'Job Role',
    description: 'The target job category for the prediction.',
  },
  {
    name: 'Experience',
    description: 'Candidate experience measured in years.',
  },
  {
    name: 'Skills Matched',
    description: 'Number of relevant skills supplied for testing.',
  },
  {
    name: 'Education Score',
    description: 'A numerical education-related input score.',
  },
  {
    name: 'Keyword Density',
    description: 'A numerical keyword-density feature.',
  },
]

const initialMlForm = {
  job_role: '',
  years_exp: '',
  skills_matched: '',
  education_score: '',
  keyword_density: '',
}

function App() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [jobs, setJobs] = useState([])
  const [jobTitle, setJobTitle] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [jobsError, setJobsError] = useState('')
  const [creatingJob, setCreatingJob] = useState(false)

  const [candidates, setCandidates] = useState([])
  const [resumeFile, setResumeFile] = useState(null)
  const [candidatesError, setCandidatesError] = useState('')
  const [uploadingResume, setUploadingResume] = useState(false)

  const [candidateId, setCandidateId] = useState('')
  const [selectedJobId, setSelectedJobId] = useState('')
  const [screeningResult, setScreeningResult] = useState(null)
  const [allScreeningResults, setAllScreeningResults] = useState([])
  const [resultsError, setResultsError] = useState('')
  const [screening, setScreening] = useState(false)
  const [updatingReviewId, setUpdatingReviewId] = useState(null)

  const [nlpAnalysis, setNlpAnalysis] = useState(null)
  const [nlpError, setNlpError] = useState('')
  const [loadingNlp, setLoadingNlp] = useState(false)

  const [resultAnalysisId, setResultAnalysisId] = useState(null)
  const [resultAnalysis, setResultAnalysis] = useState(null)
  const [resultAnalysisError, setResultAnalysisError] = useState('')
  const [resultAnalysisLoading, setResultAnalysisLoading] = useState(false)

  const [mlRoles, setMlRoles] = useState([])
  const [mlRolesError, setMlRolesError] = useState('')
  const [mlRolesLoading, setMlRolesLoading] = useState(false)
  const [mlForm, setMlForm] = useState(initialMlForm)
  const [mlResult, setMlResult] = useState(null)
  const [mlError, setMlError] = useState('')
  const [mlLoading, setMlLoading] = useState(false)

  async function readJsonResponse(response) {
    const data = await response.json().catch(() => {
      throw new Error('Server returned an invalid response.')
    })

    if (!response.ok) {
      throw new Error(
        data.error || data.message || `Request failed (${response.status})`
      )
    }

    return data
  }

  function navigateTo(section) {
    setActiveSection(section)
    setSidebarOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function formatUploadDate(value) {
    if (!value) return 'Not available'

    const normalized = /(?:Z|[+-]\d{2}:\d{2})$/i.test(value)
      ? value
      : `${value}Z`

    const date = new Date(normalized)

    if (Number.isNaN(date.getTime())) {
      return 'Not available'
    }

    return date.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      dateStyle: 'medium',
      timeStyle: 'short',
    })
  }

  async function fetchJobs() {
    try {
      const response = await fetch('/api/jobs')
      const data = await readJsonResponse(response)

      setJobs(Array.isArray(data.jobs) ? data.jobs : [])
      setJobsError('')
    } catch (error) {
      setJobsError(error.message)
    }
  }

  async function fetchCandidates() {
    try {
      const response = await fetch('/api/candidates')
      const data = await readJsonResponse(response)

      setCandidates(
        Array.isArray(data.candidates) ? data.candidates : []
      )
      setCandidatesError('')
    } catch (error) {
      setCandidatesError(error.message)
    }
  }

  async function fetchScreeningResults() {
    try {
      const response = await fetch('/api/screening-results')
      const data = await readJsonResponse(response)

      setAllScreeningResults(
        Array.isArray(data.results) ? data.results : []
      )
      setResultsError('')
    } catch (error) {
      setResultsError(error.message)
    }
  }

  async function fetchMlRoles() {
    setMlRolesLoading(true)
    setMlRolesError('')

    try {
      const response = await fetch('/api/ml/supported-roles')
      const data = await readJsonResponse(response)

      const roles = Array.isArray(data.supported_roles)
        ? data.supported_roles
        : []

      setMlRoles(roles)
    } catch (error) {
      setMlRoles([])
      setMlRolesError(error.message)
    } finally {
      setMlRolesLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
    fetchCandidates()
    fetchScreeningResults()
    fetchMlRoles()
  }, [])

  async function handleCreateJob(event) {
    event.preventDefault()

    if (!jobTitle.trim() || !jobDescription.trim()) {
      alert('Please enter a job title and description.')
      return
    }

    setCreatingJob(true)

    try {
      const response = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: jobTitle.trim(),
          description: jobDescription.trim(),
        }),
      })

      const data = await readJsonResponse(response)

      setJobTitle('')
      setJobDescription('')
      await fetchJobs()

      alert(`Job created successfully! Job ID: ${data.job_id}`)
    } catch (error) {
      alert(error.message)
    } finally {
      setCreatingJob(false)
    }
  }

  async function handleResumeUpload(event) {
    event.preventDefault()

    if (!resumeFile) {
      alert('Please select a resume.')
      return
    }

    const extension = resumeFile.name
      .split('.')
      .pop()
      .toLowerCase()

    if (!['pdf', 'docx'].includes(extension)) {
      alert('Only PDF and DOCX files are allowed.')
      return
    }

    if (resumeFile.size > 5 * 1024 * 1024) {
      alert('Resume must be 5 MB or smaller.')
      return
    }

    const formData = new FormData()
    formData.append('resume', resumeFile)

    setUploadingResume(true)

    try {
      const response = await fetch('/api/resumes/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await readJsonResponse(response)

      setCandidateId(String(data.candidate_id))
      setResumeFile(null)
      event.target.reset()

      await fetchCandidates()

      alert(
        `Resume uploaded successfully! Candidate ID: ${data.candidate_id}`
      )
    } catch (error) {
      alert(error.message)
    } finally {
      setUploadingResume(false)
    }
  }

  function handleSelectCandidate(id) {
    setCandidateId(String(id))
    setScreeningResult(null)
    setNlpAnalysis(null)
    setNlpError('')
    navigateTo('screening')
  }

  async function fetchCandidateAnalysis(candidateValue, jobValue) {
    setLoadingNlp(true)
    setNlpAnalysis(null)
    setNlpError('')

    try {
      const response = await fetch(
        `/api/candidates/${candidateValue}/analysis?job_id=${jobValue}`
      )

      const data = await readJsonResponse(response)
      setNlpAnalysis(data.analysis)
    } catch (error) {
      setNlpError(error.message)
    } finally {
      setLoadingNlp(false)
    }
  }

  async function handleScreenResume(event) {
    event.preventDefault()

    const parsedCandidateId = Number(candidateId)
    const parsedJobId = Number(selectedJobId)

    if (
      !Number.isInteger(parsedCandidateId) ||
      parsedCandidateId < 1 ||
      !Number.isInteger(parsedJobId) ||
      parsedJobId < 1
    ) {
      alert('Please select a valid candidate and job.')
      return
    }

    setScreening(true)
    setScreeningResult(null)
    setNlpAnalysis(null)
    setNlpError('')

    try {
      const response = await fetch('/api/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidate_id: parsedCandidateId,
          job_id: parsedJobId,
        }),
      })

      const data = await readJsonResponse(response)
      setScreeningResult(data)

      await Promise.all([
        fetchScreeningResults(),
        fetchCandidateAnalysis(parsedCandidateId, parsedJobId),
      ])

      if (data.already_screened) {
        alert(
          `Already screened for this job.\n` +
          `Screening ID: ${data.screening_id}\n` +
          `Match Score: ${data.match_score}%`
        )
      } else {
        alert('Resume screening completed successfully!')
      }
    } catch (error) {
      alert(error.message)
    } finally {
      setScreening(false)
    }
  }

  async function handleResultAnalysis(result) {
    if (resultAnalysisId === result.screening_id) {
      setResultAnalysisId(null)
      setResultAnalysis(null)
      setResultAnalysisError('')
      return
    }

    setResultAnalysisId(result.screening_id)
    setResultAnalysis(null)
    setResultAnalysisError('')
    setResultAnalysisLoading(true)

    try {
      const response = await fetch(
        `/api/candidates/${result.candidate_id}/analysis?job_id=${result.job_id}`
      )

      const data = await readJsonResponse(response)
      setResultAnalysis(data.analysis)
    } catch (error) {
      setResultAnalysisError(error.message)
    } finally {
      setResultAnalysisLoading(false)
    }
  }

  async function handleReview(screeningId, newStatus) {
    if (!['pending', 'shortlisted', 'rejected'].includes(newStatus)) {
      return
    }

    setUpdatingReviewId(screeningId)

    try {
      const response = await fetch(
        `/api/screening-results/${screeningId}/review`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            review_status: newStatus,
          }),
        }
      )

      await readJsonResponse(response)
      await fetchScreeningResults()

      setScreeningResult((previous) =>
        previous?.screening_id === screeningId
          ? { ...previous, review_status: newStatus }
          : previous
      )

      alert(`Review status updated to ${newStatus}.`)
    } catch (error) {
      alert(error.message)
    } finally {
      setUpdatingReviewId(null)
    }
  }

  function updateMlField(field, value) {
    setMlForm((previous) => ({
      ...previous,
      [field]: value,
    }))
    setMlResult(null)
    setMlError('')
  }

  async function handleMlPrediction(event) {
    event.preventDefault()
    setMlResult(null)
    setMlError('')

    if (!mlRoles.includes(mlForm.job_role)) {
      setMlError('Please select a supported job role.')
      return
    }

    const numericFields = [
      'years_exp',
      'skills_matched',
      'education_score',
      'keyword_density',
    ]

    for (const field of numericFields) {
      if (
        mlForm[field] === '' ||
        !Number.isFinite(Number(mlForm[field])) ||
        Number(mlForm[field]) < 0
      ) {
        setMlError(`Enter a valid value for ${field}.`)
        return
      }
    }

    setMlLoading(true)

    try {
      const response = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_role: mlForm.job_role,
          years_exp: Number(mlForm.years_exp),
          skills_matched: Number(mlForm.skills_matched),
          education_score: Number(mlForm.education_score),
          keyword_density: Number(mlForm.keyword_density),
        }),
      })

      const data = await readJsonResponse(response)
      setMlResult(data.prediction)
    } catch (error) {
      setMlError(error.message)
    } finally {
      setMlLoading(false)
    }
  }

  const shortlistedCount = allScreeningResults.filter(
    (result) => result.review_status === 'shortlisted'
  ).length

  const pendingCount = allScreeningResults.filter(
    (result) => result.review_status === 'pending'
  ).length

  const rejectedCount = allScreeningResults.filter(
    (result) => result.review_status === 'rejected'
  ).length

  const screeningPairCounts = {}

  allScreeningResults.forEach((result) => {
    const key = `${result.candidate_id}-${result.job_id}`
    screeningPairCounts[key] =
      (screeningPairCounts[key] || 0) + 1
  })

  const activePage = navigationItems.find(
    (item) => item.id === activeSection
  )

  const skillAnalysis =
    nlpAnalysis?.technical_skill_analysis

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close navigation"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}
      >
        <div className="sidebar-brand">
          <div className="brand-logo">AI</div>
          <div>
            <h2>AI Recruiter</h2>
            <p>Screening Platform</p>
          </div>
        </div>

        <p className="sidebar-label">WORKSPACE</p>

        <nav className="sidebar-nav" aria-label="Main navigation">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav-item ${
                activeSection === item.id ? 'active' : ''
              }`}
              aria-current={
                activeSection === item.id ? 'page' : undefined
              }
              onClick={() => navigateTo(item.id)}
            >
              <span className="nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <span className="status-dot" />
          <span>Recruiter Workspace</span>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="mobile-menu-button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              ☰
            </button>

            <div>
              <h1>{activePage?.label || 'Dashboard'}</h1>
              <p>AI Resume Screening System</p>
            </div>
          </div>

          <div className="topbar-profile">
            <span className="profile-avatar">R</span>
            <span>Recruiter</span>
          </div>
        </header>

        <main className="main-content">

          {/* DASHBOARD */}
          {activeSection === 'dashboard' && (
            <div className="page-content">
              <div className="welcome-banner">
                <div>
                  <span className="welcome-eyebrow">
                    RECRUITER WORKSPACE
                  </span>
                  <h2>Welcome to your Dashboard</h2>
                  <p>
                    Manage jobs, screen resumes and review
                    candidates from one place.
                  </p>
                </div>

                <div
                  className="welcome-decoration"
                  aria-hidden="true"
                />
              </div>

              <div className="stat-grid">
                <div className="stat-card">
                  <span className="stat-icon stat-purple">▣</span>
                  <p>Total Jobs</p>
                  <h2>{jobs.length}</h2>
                </div>

                <div className="stat-card">
                  <span className="stat-icon stat-blue">♙</span>
                  <p>Uploaded Candidates</p>
                  <h2>{candidates.length}</h2>
                </div>

                <div className="stat-card">
                  <span className="stat-icon stat-cyan">✧</span>
                  <p>Total Screenings</p>
                  <h2>{allScreeningResults.length}</h2>
                </div>

                <div className="stat-card">
                  <span className="stat-icon stat-green">✓</span>
                  <p>Shortlisted Results</p>
                  <h2>{shortlistedCount}</h2>
                </div>
              </div>

              <div className="dashboard-grid">
                <section className="panel">
                  <div className="panel-heading">
                    <h3>Quick Actions</h3>
                    <p>Get started with your next task.</p>
                  </div>

                  <div className="quick-actions">
                    <button
                      type="button"
                      onClick={() => navigateTo('jobs')}
                    >
                      <span>▣</span>
                      Manage Jobs
                      <span>→</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateTo('upload')}
                    >
                      <span>↑</span>
                      Upload Resume
                      <span>→</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateTo('screening')}
                    >
                      <span>✧</span>
                      Run AI Screening
                      <span>→</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateTo('results')}
                    >
                      <span>☷</span>
                      Review Results
                      <span>→</span>
                    </button>
                  </div>
                </section>

                <section className="panel">
                  <div className="panel-heading">
                    <h3>Review Overview</h3>
                    <p>Current screening decisions.</p>
                  </div>

                  <div className="overview-row">
                    <span className="status-label pending">
                      Pending
                    </span>
                    <strong>{pendingCount}</strong>
                  </div>

                  <div className="overview-row">
                    <span className="status-label shortlisted">
                      Shortlisted
                    </span>
                    <strong>{shortlistedCount}</strong>
                  </div>

                  <div className="overview-row">
                    <span className="status-label rejected">
                      Rejected
                    </span>
                    <strong>{rejectedCount}</strong>
                  </div>

                  <p className="helper-note">
                    AI scores are similarity indicators.
                    Final decisions require human review.
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* MANAGE JOBS */}
          {activeSection === 'jobs' && (
            <div className="page-content">
              <div className="page-intro">
                <h2>Manage Jobs</h2>
                <p>
                  Create job openings and manage their descriptions.
                </p>
              </div>

              <section className="panel">
                <div className="panel-heading">
                  <h3>Create New Job</h3>
                  <p>Add a job description for resume matching.</p>
                </div>

                <form onSubmit={handleCreateJob}>
                  <div className="form-group">
                    <label htmlFor="jobTitle">Job Title</label>
                    <input
                      id="jobTitle"
                      type="text"
                      value={jobTitle}
                      onChange={(event) =>
                        setJobTitle(event.target.value)
                      }
                      placeholder="e.g. Python Developer"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="jobDescription">
                      Job Description
                    </label>
                    <textarea
                      id="jobDescription"
                      value={jobDescription}
                      onChange={(event) =>
                        setJobDescription(event.target.value)
                      }
                      placeholder="Enter skills and experience requirements"
                      rows={5}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={creatingJob}
                  >
                    {creatingJob ? 'Creating...' : 'Create Job'}
                  </button>
                </form>
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <h3>Available Jobs</h3>
                  <p>{jobs.length} job(s) available</p>
                </div>

                {jobsError && (
                  <p className="error-message">{jobsError}</p>
                )}

                {!jobsError && jobs.length === 0 && (
                  <p className="empty-state">
                    No jobs available yet.
                  </p>
                )}

                <div className="item-grid">
                  {jobs.map((job) => (
                    <div className="item-card" key={job.id}>
                      <div className="item-card-heading">
                        <h4>{job.title}</h4>
                        <span className="id-tag">
                          Job #{job.id}
                        </span>
                      </div>
                      <p>{job.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* UPLOAD RESUME */}
          {activeSection === 'upload' && (
            <div className="page-content">
              <div className="page-intro">
                <h2>Upload Candidate Resume</h2>
                <p>Upload PDF or DOCX resumes for AI screening.</p>
              </div>

              <section className="panel upload-panel">
                <div className="panel-heading">
                  <h3>Resume Upload</h3>
                  <p>Maximum file size: 5 MB</p>
                </div>

                <form onSubmit={handleResumeUpload}>
                  <div className="upload-zone">
                    <div className="upload-symbol">↑</div>

                    <label htmlFor="resumeFile">
                      Choose Resume File
                    </label>

                    <p>Supported formats: PDF and DOCX</p>

                    <input
                      id="resumeFile"
                      type="file"
                      accept=".pdf,.docx"
                      required
                      onChange={(event) =>
                        setResumeFile(
                          event.target.files?.[0] || null
                        )
                      }
                    />

                    {resumeFile && (
                      <p className="selected-file">
                        Selected: {resumeFile.name}
                      </p>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={uploadingResume}
                  >
                    {uploadingResume
                      ? 'Uploading...'
                      : 'Upload Resume'}
                  </button>
                </form>
              </section>
            </div>
          )}

          {/* CANDIDATES */}
          {activeSection === 'candidates' && (
            <div className="page-content">
              <div className="page-intro">
                <h2>Uploaded Candidates</h2>
                <p>
                  View uploaded resumes and select candidates
                  for screening.
                </p>
              </div>

              <section className="panel">
                <div className="panel-heading">
                  <h3>Candidate List</h3>
                  <p>
                    {candidates.length} candidate(s) uploaded
                  </p>
                </div>

                {candidatesError && (
                  <p className="error-message">
                    {candidatesError}
                  </p>
                )}

                {!candidatesError && candidates.length === 0 && (
                  <p className="empty-state">
                    No candidates uploaded yet.
                  </p>
                )}

                <div className="item-grid">
                  {candidates.map((candidate) => (
                    <div
                      className="item-card"
                      key={candidate.candidate_id}
                    >
                      <div className="item-card-heading">
                        <h4>
                          Candidate #{candidate.candidate_id}
                        </h4>
                        <span className="id-tag">Resume</span>
                      </div>

                      <p className="file-name">
                        {candidate.filename}
                      </p>

                      <p className="item-meta">
                        Uploaded:{' '}
                        {formatUploadDate(candidate.uploaded_at)}
                      </p>

                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() =>
                          handleSelectCandidate(
                            candidate.candidate_id
                          )
                        }
                      >
                        Select for Screening
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* AI SCREENING */}
          {activeSection === 'screening' && (
            <div className="page-content">
              <div className="page-intro">
                <h2>AI Resume Screening</h2>
                <p>
                  Compare candidate resumes with job descriptions
                  and view preliminary skill analysis.
                </p>
              </div>

              <section className="panel">
                <div className="panel-heading">
                  <h3>Run Resume Screening</h3>
                  <p>
                    Choose a candidate and job to calculate
                    text similarity and analyze technical skills.
                  </p>
                </div>

                <form onSubmit={handleScreenResume}>
                  <div className="form-group">
                    <label htmlFor="candidateId">
                      Candidate ID
                    </label>
                    <input
                      id="candidateId"
                      type="number"
                      min="1"
                      step="1"
                      value={candidateId}
                      onChange={(event) => {
                        setCandidateId(event.target.value)
                        setScreeningResult(null)
                        setNlpAnalysis(null)
                        setNlpError('')
                      }}
                      placeholder="Enter Candidate ID"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="selectedJob">
                      Select Job
                    </label>
                    <select
                      id="selectedJob"
                      value={selectedJobId}
                      onChange={(event) => {
                        setSelectedJobId(event.target.value)
                        setScreeningResult(null)
                        setNlpAnalysis(null)
                        setNlpError('')
                      }}
                      required
                    >
                      <option value="">
                        -- Select a Job --
                      </option>

                      {jobs.map((job) => (
                        <option key={job.id} value={job.id}>
                          {job.title} (ID: {job.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={screening}
                  >
                    {screening
                      ? 'Screening...'
                      : 'Screen Resume'}
                  </button>
                </form>

                {screeningResult && (
                  <div className="screening-summary">
                    <h3>
                      {screeningResult.already_screened
                        ? 'Existing Screening Result'
                        : 'Screening Result'}
                    </h3>

                    {screeningResult.already_screened && (
                      <p className="warning-message">
                        This candidate has already been screened
                        for this job.
                      </p>
                    )}

                    <div className="summary-grid">
                      <div>
                        <span>Screening ID</span>
                        <strong>
                          {screeningResult.screening_id}
                        </strong>
                      </div>

                      <div>
                        <span>Candidate ID</span>
                        <strong>
                          {screeningResult.candidate_id}
                        </strong>
                      </div>

                      <div>
                        <span>Job ID</span>
                        <strong>
                          {screeningResult.job_id}
                        </strong>
                      </div>

                      <div>
                        <span>Match Score</span>
                        <strong>
                          {screeningResult.match_score}%
                        </strong>
                      </div>
                    </div>

                    <p>
                      Review Status:{' '}
                      <strong>
                        {screeningResult.review_status}
                      </strong>
                    </p>

                    <p className="helper-note">
                      Similarity score only. Final shortlisting
                      requires human review.
                    </p>
                  </div>
                )}

                {loadingNlp && (
                  <p className="helper-note">
                    Analyzing technical skills and education...
                  </p>
                )}

                {nlpError && (
                  <p className="error-message" role="alert">
                    Skill analysis unavailable: {nlpError}
                  </p>
                )}

                {nlpAnalysis && (
                  <div className="screening-summary">
                    <h3>AI Skill Analysis</h3>

                    <p className="helper-note">
                      Preliminary NLP findings only.
                      Human review is required.
                    </p>

                    <div className="summary-grid">
                      <div>
                        <span>Experience</span>
                        <strong>
                          {nlpAnalysis.years_exp == null
                            ? 'Not detected'
                            : `${nlpAnalysis.years_exp} years`}
                        </strong>
                      </div>

                      <div>
                        <span>Education</span>
                        <strong>
                          {nlpAnalysis.education_qualification ||
                            'Not detected'}
                        </strong>
                      </div>

                      <div>
                        <span>Matched Technical Skills</span>
                        <strong>
                          {skillAnalysis?.matched_skill_count ?? 0}
                        </strong>
                      </div>
                    </div>

                    <h4>Matched Skills</h4>
                    <p>
                      {skillAnalysis?.matched_skills?.length
                        ? skillAnalysis.matched_skills.join(', ')
                        : 'No recognized matching skills detected'}
                    </p>

                    <h4>Required Skills Not Detected</h4>
                    <p>
                      {skillAnalysis?.missing_skills?.length
                        ? skillAnalysis.missing_skills.join(', ')
                        : 'None detected'}
                    </p>

                    <h4>Resume Skills Detected</h4>
                    <p>
                      {skillAnalysis?.resume_skills?.length
                        ? skillAnalysis.resume_skills.join(', ')
                        : 'No recognized technical skills detected'}
                    </p>

                    <p className="helper-note">
                      Skills not detected are not necessarily
                      skills the candidate lacks. This analysis
                      does not automatically shortlist or reject anyone.
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* SCREENING RESULTS */}
          {activeSection === 'results' && (
            <div className="page-content">
              <div className="page-intro">
                <h2>Screening Results</h2>
                <p>
                  Review AI match scores and make
                  human-supervised decisions.
                </p>
              </div>

              <section className="panel">
                <div className="panel-heading">
                  <h3>Saved Screening Results</h3>
                  <p>
                    {allScreeningResults.length} screening record(s)
                  </p>
                </div>

                <div className="result-counts">
                  <span className="status-label pending">
                    Pending: {pendingCount}
                  </span>
                  <span className="status-label shortlisted">
                    Shortlisted: {shortlistedCount}
                  </span>
                  <span className="status-label rejected">
                    Rejected: {rejectedCount}
                  </span>
                </div>

                {resultsError && (
                  <p className="error-message">
                    {resultsError}
                  </p>
                )}

                {!resultsError &&
                  allScreeningResults.length === 0 && (
                    <p className="empty-state">
                      No screening results available yet.
                    </p>
                  )}

                <div className="results-list">
                  {allScreeningResults.map((result) => {
                    const pairKey =
                      `${result.candidate_id}-${result.job_id}`

                    const duplicateCount =
                      screeningPairCounts[pairKey] || 0

                    const analysisOpen =
                      resultAnalysisId === result.screening_id

                    const analysisSkills =
                      resultAnalysis?.technical_skill_analysis

                    return (
                      <div
                        className="result-card"
                        key={result.screening_id}
                      >
                        <div className="result-card-top">
                          <div>
                            <h4>
                              {result.job_title || 'Unknown Job'}
                            </h4>
                            <p>
                              Candidate #{result.candidate_id}
                              {' · '}
                              Screening #{result.screening_id}
                            </p>
                          </div>

                          <span
                            className={`status-label ${
                              result.review_status
                            }`}
                          >
                            {result.review_status}
                          </span>
                        </div>

                        <div className="result-score">
                          <span>Resume Match Score</span>
                          <strong>
                            {result.match_score}%
                          </strong>
                        </div>

                        {duplicateCount > 1 && (
                          <p className="warning-message">
                            Duplicate screening detected!{' '}
                            {duplicateCount} records exist
                            for this candidate and job.
                          </p>
                        )}

                        <div className="screening-summary">
                          <button
                            type="button"
                            className="btn btn-muted"
                            disabled={resultAnalysisLoading}
                            onClick={() =>
                              handleResultAnalysis(result)
                            }
                          >
                            {analysisOpen
                              ? 'Hide AI Skill Analysis'
                              : 'View AI Skill Analysis'}
                          </button>

                          {analysisOpen && (
                            <div className="panel">
                              <h4>AI Skill Analysis</h4>

                              {resultAnalysisLoading && (
                                <p>Loading analysis...</p>
                              )}

                              {resultAnalysisError && (
                                <p className="error-message">
                                  {resultAnalysisError}
                                </p>
                              )}

                              {resultAnalysis && (
                                <>
                                  <p>
                                    <strong>Experience:</strong>{' '}
                                    {resultAnalysis.years_exp == null
                                      ? 'Not detected'
                                      : `${resultAnalysis.years_exp} years`}
                                  </p>

                                  <p>
                                    <strong>Education:</strong>{' '}
                                    {resultAnalysis.education_qualification ||
                                      'Not detected'}
                                  </p>

                                  <p>
                                    <strong>Matched Skills:</strong>{' '}
                                    {analysisSkills?.matched_skills?.length
                                      ? analysisSkills.matched_skills.join(', ')
                                      : 'None detected'}
                                  </p>

                                  <p>
                                    <strong>
                                      Required Skills Not Detected:
                                    </strong>{' '}
                                    {analysisSkills?.missing_skills?.length
                                      ? analysisSkills.missing_skills.join(', ')
                                      : 'None'}
                                  </p>

                                  <p className="helper-note">
                                    NLP analysis is preliminary.
                                    Final hiring decisions require
                                    human review.
                                  </p>
                                </>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="review-actions">
                          <button
                            type="button"
                            className="btn btn-success"
                            disabled={
                              updatingReviewId !== null ||
                              result.review_status === 'shortlisted'
                            }
                            onClick={() =>
                              handleReview(
                                result.screening_id,
                                'shortlisted'
                              )
                            }
                          >
                            Shortlist
                          </button>

                          <button
                            type="button"
                            className="btn btn-danger"
                            disabled={
                              updatingReviewId !== null ||
                              result.review_status === 'rejected'
                            }
                            onClick={() =>
                              handleReview(
                                result.screening_id,
                                'rejected'
                              )
                            }
                          >
                            Reject
                          </button>

                          <button
                            type="button"
                            className="btn btn-muted"
                            disabled={
                              updatingReviewId !== null ||
                              result.review_status === 'pending'
                            }
                            onClick={() =>
                              handleReview(
                                result.screening_id,
                                'pending'
                              )
                            }
                          >
                            Reset to Pending
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <p className="helper-note">
                  Match scores measure text similarity,
                  not hiring suitability. Final decisions
                  require human review.
                </p>
              </section>
            </div>
          )}

          {/* RANDOM FOREST LAB */}
          {activeSection === 'ml-lab' && (
            <div className="page-content">
              <div className="page-intro">
                <h2>Random Forest Lab</h2>
                <p>
                  Explore the experimental machine learning
                  prototype separately from live resume screening.
                </p>
              </div>

              <div className="welcome-banner">
                <div>
                  <span className="welcome-eyebrow">
                    EXPERIMENTAL MACHINE LEARNING
                  </span>
                  <h2>Random Forest Classification</h2>
                  <p>
                    A research prototype trained using
                    synthetic structured candidate features.
                    It does not automatically evaluate uploaded resumes.
                  </p>
                </div>

                <div
                  className="welcome-decoration"
                  aria-hidden="true"
                />
              </div>

              <div className="stat-grid">
                <div className="stat-card">
                  <span className="stat-icon stat-purple">
                    ♧
                  </span>
                  <p>Algorithm</p>
                  <h2 style={{ fontSize: '1.1rem' }}>
                    Random Forest
                  </h2>
                </div>

                <div className="stat-card">
                  <span className="stat-icon stat-blue">
                    ▦
                  </span>
                  <p>Training Records</p>
                  <h2>500</h2>
                </div>

                <div className="stat-card">
                  <span className="stat-icon stat-cyan">
                    ◇
                  </span>
                  <p>Input Features</p>
                  <h2>5</h2>
                </div>

                <div className="stat-card">
                  <span className="stat-icon stat-green">
                    ✓
                  </span>
                  <p>Supported Roles</p>
                  <h2>{mlRoles.length}</h2>
                </div>
              </div>

              <section className="panel">
                <div className="panel-heading">
                  <h3>About the Model</h3>
                  <p>
                    How this experimental component fits into
                    the AI-based resume screening project.
                  </p>
                </div>

                <p>
                  This Random Forest classifier uses manually
                  supplied structured features to generate an
                  experimental classification. The main
                  AI Screening module uses text similarity and
                  NLP-based skill analysis instead.
                </p>

                <p className="helper-note">
                  The model was trained on synthetic data.
                  Its outputs have not been established as
                  reliable hiring recommendations. Recruiter
                  decisions remain human-supervised.
                </p>
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <h3>Model Input Features</h3>
                  <p>
                    Five inputs used by the experimental classifier.
                  </p>
                </div>

                <div className="item-grid">
                  {modelFeatures.map((feature) => (
                    <div
                      className="item-card"
                      key={feature.name}
                    >
                      <div className="item-card-heading">
                        <h4>{feature.name}</h4>
                      </div>
                      <p>{feature.description}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <h3>Supported Job Roles</h3>
                  <p>
                    Roles currently recognized by the model API.
                  </p>
                </div>

                {mlRolesLoading && (
                  <p className="helper-note">
                    Loading supported roles...
                  </p>
                )}

                {mlRolesError && (
                  <p className="error-message">
                    Could not load model roles: {mlRolesError}
                  </p>
                )}

                {!mlRolesLoading &&
                  !mlRolesError &&
                  mlRoles.length === 0 && (
                    <p className="empty-state">
                      No supported roles returned by the ML service.
                    </p>
                  )}

                <div className="item-grid">
                  {mlRoles.map((role) => (
                    <div className="item-card" key={role}>
                      <h4>{role.replaceAll('_', ' ')}</h4>
                      <p className="item-meta">
                        Experimental model role
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <h3>Try the Model</h3>
                  <p>
                    Optional manual demonstration using
                    sample feature values.
                  </p>
                </div>

                <p className="helper-note">
                  This test is independent of uploaded
                  candidates and saved screening results.
                  Predictions are for demonstration only.
                </p>

                <form onSubmit={handleMlPrediction}>
                  <div className="form-group">
                    <label htmlFor="mlJobRole">
                      Job Role
                    </label>

                    <select
                      id="mlJobRole"
                      value={mlForm.job_role}
                      onChange={(event) =>
                        updateMlField(
                          'job_role',
                          event.target.value
                        )
                      }
                      required
                    >
                      <option value="">
                        -- Select a Role --
                      </option>

                      {mlRoles.map((role) => (
                        <option key={role} value={role}>
                          {role.replaceAll('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="mlYearsExp">
                      Years of Experience
                    </label>

                    <input
                      id="mlYearsExp"
                      type="number"
                      min="0"
                      step="0.5"
                      value={mlForm.years_exp}
                      onChange={(event) =>
                        updateMlField(
                          'years_exp',
                          event.target.value
                        )
                      }
                      placeholder="e.g. 3"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="mlSkillsMatched">
                      Skills Matched
                    </label>

                    <input
                      id="mlSkillsMatched"
                      type="number"
                      min="0"
                      step="1"
                      value={mlForm.skills_matched}
                      onChange={(event) =>
                        updateMlField(
                          'skills_matched',
                          event.target.value
                        )
                      }
                      placeholder="e.g. 5"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="mlEducationScore">
                      Education Score
                    </label>

                    <input
                      id="mlEducationScore"
                      type="number"
                      min="0"
                      step="1"
                      value={mlForm.education_score}
                      onChange={(event) =>
                        updateMlField(
                          'education_score',
                          event.target.value
                        )
                      }
                      placeholder="e.g. 80"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="mlKeywordDensity">
                      Keyword Density
                    </label>

                    <input
                      id="mlKeywordDensity"
                      type="number"
                      min="0"
                      step="0.01"
                      value={mlForm.keyword_density}
                      onChange={(event) =>
                        updateMlField(
                          'keyword_density',
                          event.target.value
                        )
                      }
                      placeholder="e.g. 0.5"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      mlLoading ||
                      mlRolesLoading ||
                      mlRoles.length === 0
                    }
                  >
                    {mlLoading
                      ? 'Running Model...'
                      : 'Run Demo Prediction'}
                  </button>
                </form>

                {mlError && (
                  <p
                    className="error-message"
                    role="alert"
                  >
                    {mlError}
                  </p>
                )}

                {mlResult != null && (
                  <div className="screening-summary">
                    <h3>Experimental Model Output</h3>

                    {typeof mlResult === 'object' ? (
                      <div className="summary-grid">
                        {Object.entries(mlResult).map(
                          ([key, value]) => (
                            <div key={key}>
                              <span>
                                {key
                                  .replaceAll('_', ' ')
                                  .replace(/\b\w/g, (char) =>
                                    char.toUpperCase()
                                  )}
                              </span>
                              <strong>
                                {value == null
                                  ? 'Not available'
                                  : typeof value === 'object'
                                    ? JSON.stringify(value)
                                    : String(value)}
                              </strong>
                            </div>
                          )
                        )}
                      </div>
                    ) : (
                      <p>
                        <strong>{String(mlResult)}</strong>
                      </p>
                    )}

                    <p className="helper-note">
                      Experimental prediction based on
                      synthetic training data. This is not
                      a verified hiring assessment and
                      does not change any candidate's
                      shortlist status.
                    </p>
                  </div>
                )}
              </section>
            </div>
          )}

        </main>
      </div>
    </div>
  )
}

export default App
