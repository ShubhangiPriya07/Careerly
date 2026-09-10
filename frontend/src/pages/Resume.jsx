import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  getResumes,
  createResume,
  updateResume,
  deleteResume,
  uploadResume,
} from "../services/api";

import LoadingScreen from "../components/LoadingScreen";

import "./Resume.css";

function Resume() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [resumes, setResumes] = useState([]);
  const [selectedResume, setSelectedResume] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isNewResume, setIsNewResume] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [resumeName, setResumeName] = useState("");

  const [skills, setSkills] = useState([]);
  const [newSkill, setNewSkill] = useState("");

  const [education, setEducation] = useState([]);
  const [experience, setExperience] = useState([]);
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    loadResumes();
  }, []);

  const loadResumes = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getResumes();

      const loadedResumes = data.resumes || [];

      setResumes(loadedResumes);

      const defaultResume =
        loadedResumes.find((resume) => resume.isDefault) ||
        loadedResumes[0];

      if (defaultResume) {
        selectResume(defaultResume);
      }
    } catch (error) {
      console.error("Failed to load resumes:", error);
      setError("Failed to load your resumes.");
    } finally {
      setLoading(false);
    }
  };

  const selectResume = (resume) => {
    setSelectedResume(resume);
    setResumeName(resume.name || "");

    const parsed = resume.parsedData || {};

    setSkills(parsed.skills || []);
    setEducation(parsed.education || []);
    setExperience(parsed.experience || []);
    setProjects(parsed.projects || []);

    setIsEditing(false);
    setIsNewResume(false);
    setShowPreview(false);
    setError("");
    setSuccess("");
  };

  const handleCreateResume = () => {
    setSelectedResume({
      _id: "new",
      name: "My Resume",
      isDefault: false,
      fileUrl: "",
    });

    setResumeName("My Resume");
    setSkills([]);
    setEducation([]);
    setExperience([]);
    setProjects([]);

    setIsNewResume(true);
    setIsEditing(true);
    setShowPreview(false);
    setError("");
    setSuccess("");
  };

  const handleAddResume = async () => {
    if (!resumeName.trim()) {
      setError("Resume name cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const data = await createResume({
        name: resumeName.trim(),
        parsedData: {
          skills,
          education,
          experience,
          projects,
        },
        isDefault: resumes.length === 0,
      });

      const newResume = data.resume;

      setResumes((current) => [newResume, ...current]);
      setSelectedResume(newResume);

      setIsNewResume(false);
      setIsEditing(false);

      setSuccess("Resume added successfully.");
    } catch (error) {
      console.error("Failed to add resume:", error);

      setError(
        error.response?.data?.message ||
          "Failed to add resume."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditResume = () => {
    setIsEditing(true);
    setShowPreview(false);
    setError("");
    setSuccess("");
  };

  const handleCancelEdit = () => {
    if (isNewResume) {
      const defaultResume =
        resumes.find((resume) => resume.isDefault) ||
        resumes[0];

      if (defaultResume) {
        selectResume(defaultResume);
      } else {
        setSelectedResume(null);
        setResumeName("");
        setSkills([]);
        setEducation([]);
        setExperience([]);
        setProjects([]);
        setIsNewResume(false);
        setIsEditing(false);
      }

      return;
    }

    if (selectedResume) {
      selectResume(selectedResume);
    }
  };

  const handleSaveResume = async () => {
    if (!selectedResume) {
      return;
    }

    if (!resumeName.trim()) {
      setError("Resume name cannot be empty.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const data = await updateResume(
        selectedResume._id,
        {
          name: resumeName.trim(),
          parsedData: {
            skills,
            education,
            experience,
            projects,
          },
        }
      );

      const updatedResume = data.resume;

      setSelectedResume(updatedResume);

      setIsEditing(false);
      setIsNewResume(false);

      setResumes((current) =>
        current.map((resume) =>
          resume._id === updatedResume._id
            ? updatedResume
            : resume
        )
      );

      setSuccess("Resume saved successfully.");
    } catch (error) {
      console.error("Failed to save resume:", error);

      setError(
        error.response?.data?.message ||
          "Failed to save resume."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async () => {
    if (!selectedResume) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const data = await updateResume(
        selectedResume._id,
        {
          isDefault: true,
        }
      );

      const updatedResume = data.resume;

      setSelectedResume(updatedResume);

      setResumes((current) =>
        current.map((resume) => ({
          ...resume,
          isDefault:
            resume._id === updatedResume._id,
        }))
      );

      setSuccess("Default resume updated.");
    } catch (error) {
      console.error(
        "Failed to set default resume:",
        error
      );

      setError("Failed to update default resume.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResume = async () => {
    if (!selectedResume) {
      return;
    }

    const confirmed = window.confirm(
      `Delete "${selectedResume.name}"? This cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      await deleteResume(selectedResume._id);

      const remaining = resumes.filter(
        (resume) =>
          resume._id !== selectedResume._id
      );

      setResumes(remaining);

      const nextResume =
        remaining.find(
          (resume) => resume.isDefault
        ) || remaining[0];

      if (nextResume) {
        selectResume(nextResume);
      } else {
        setSelectedResume(null);
        setResumeName("");
        setSkills([]);
        setEducation([]);
        setExperience([]);
        setProjects([]);
      }

      setSuccess("Resume deleted.");
    } catch (error) {
      console.error(
        "Failed to delete resume:",
        error
      );

      setError("Failed to delete resume.");
    } finally {
      setSaving(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== "application/pdf") {
      setError("Only PDF files are allowed.");
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setError("");
      setSuccess("");

      const data = await uploadResume(file);

      const uploadedResume = data.resume;

      setResumes((current) => [
        uploadedResume,
        ...current,
      ]);

      selectResume(uploadedResume);

      setSuccess(
        "Resume uploaded and processed successfully."
      );
    } catch (error) {
      console.error(
        "Failed to upload resume:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to upload resume."
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const addSkill = () => {
    const skill = newSkill.trim();

    if (!skill) {
      return;
    }

    if (
      skills.some(
        (existingSkill) =>
          existingSkill.toLowerCase() ===
          skill.toLowerCase()
      )
    ) {
      setNewSkill("");
      return;
    }

    setSkills((current) => [...current, skill]);
    setNewSkill("");
  };

  const removeSkill = (index) => {
    setSkills((current) =>
      current.filter(
        (_, itemIndex) => itemIndex !== index
      )
    );
  };

  const handleSkillKeyDown = (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addSkill();
    }
  };

  const addEducation = () => {
    setEducation((current) => [
      ...current,
      {
        institution: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
      },
    ]);
  };

  const updateEducation = (
    index,
    field,
    value
  ) => {
    setEducation((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const removeEducation = (index) => {
    setEducation((current) =>
      current.filter(
        (_, itemIndex) => itemIndex !== index
      )
    );
  };

  const addExperience = () => {
    setExperience((current) => [
      ...current,
      {
        company: "",
        role: "",
        description: "",
        startDate: "",
        endDate: "",
      },
    ]);
  };

  const updateExperience = (
    index,
    field,
    value
  ) => {
    setExperience((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const removeExperience = (index) => {
    setExperience((current) =>
      current.filter(
        (_, itemIndex) => itemIndex !== index
      )
    );
  };

  const addProject = () => {
    setProjects((current) => [
      ...current,
      {
        name: "",
        description: "",
        technologies: [],
      },
    ]);
  };

  const updateProject = (
    index,
    field,
    value
  ) => {
    setProjects((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              [field]: value,
            }
          : item
      )
    );
  };

  const updateProjectTechnologies = (
    index,
    value
  ) => {
    setProjects((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index
          ? {
              ...item,
              technologies: value
                .split(",")
                .map((technology) =>
                  technology.trim()
                )
                .filter(Boolean),
            }
          : item
      )
    );
  };

  const removeProject = (index) => {
    setProjects((current) =>
      current.filter(
        (_, itemIndex) => itemIndex !== index
      )
    );
  };

  const formatDate = (date) => {
    if (!date) {
      return "";
    }

    return new Date(date)
      .toISOString()
      .slice(0, 10);
  };

  const formatResumeDate = (date) => {
    if (!date) {
      return "";
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleDateString(
      "en-US",
      {
        month: "short",
        year: "numeric",
      }
    );
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handlePreview = () => {
    setShowPreview(true);
    setError("");
    setSuccess("");
  };

  const handleBackToEditor = () => {
    setShowPreview(false);
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <LoadingScreen message="Loading your resumes..." />
    );
  }

  return (
    <div className="resume-page">
      {/* HAMBURGER */}

      <button
        className="resume-menu-button no-print"
        onClick={() => setMenuOpen(true)}
        aria-label="Open navigation"
      >
        <span />
        <span />
        <span />
      </button>

      {/* OVERLAY */}

      {menuOpen && (
        <div
          className="resume-menu-overlay no-print"
          onClick={closeMenu}
        />
      )}

      {/* SIDEBAR */}

      <aside
        className={`resume-sidebar no-print ${
          menuOpen ? "open" : ""
        }`}
      >
        <div className="resume-sidebar-header">
          <div>
            <span>CAREERLY</span>
            <strong>Navigation</strong>
          </div>

          <button
            className="resume-close-button"
            onClick={closeMenu}
            aria-label="Close navigation"
          >
            ×
          </button>
        </div>

        <nav className="resume-nav">
          <button
            onClick={() => {
              closeMenu();
              navigate("/dashboard");
            }}
          >
            <span>⌂</span>
            Dashboard
          </button>

          <button
            onClick={() => {
              closeMenu();
              navigate("/jobs");
            }}
          >
            <span>⌕</span>
            Find Jobs
          </button>

          <button
            onClick={() => {
              closeMenu();
              navigate("/saved-jobs");
            }}
          >
            <span>☆</span>
            Saved Jobs
          </button>

          <button
            onClick={() => {
              closeMenu();
              navigate("/applications");
            }}
          >
            <span>▣</span>
            Applications
          </button>

          <button
            className="active"
            onClick={() => {
              closeMenu();
              navigate("/resume");
            }}
          >
            <span>▤</span>
            Resume
          </button>

          <button
            onClick={() => {
              closeMenu();
              navigate("/profile");
            }}
          >
            <span>○</span>
            Profile
          </button>
        </nav>
      </aside>

      <div className="resume-container">
        {/* TOP BAR */}

        <div className="resume-topbar no-print">
          <button
            className="resume-back-link"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>
        </div>

        {/* HEADER */}

        <header className="resume-header no-print">
          <span className="resume-eyebrow">
            CAREER DOCUMENTS
          </span>

          <div className="resume-header-row">
            <div>
              <h1>My Resume</h1>

              <p>
                Create, manage and refine your resumes
                for the opportunities you're applying to.
              </p>
            </div>

            <div className="resume-header-actions">
              <button
                className="resume-secondary-button"
                onClick={handleUploadClick}
                disabled={uploading}
              >
                {uploading
                  ? "Processing..."
                  : "Upload PDF"}
              </button>

              <button
                className="resume-primary-button"
                onClick={handleCreateResume}
                disabled={saving}
              >
                + New Resume
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={handleFileUpload}
                hidden
              />
            </div>
          </div>
        </header>

        {/* MESSAGES */}

        <div className="no-print">
          {error && (
            <div className="resume-message error">
              {error}
            </div>
          )}

          {success && (
            <div className="resume-message success">
              {success}
            </div>
          )}
        </div>

        {/* NO RESUMES */}

        {resumes.length === 0 ? (
          <section className="resume-empty-card no-print">
            <div className="resume-empty-icon">
              +
            </div>

            <span className="resume-section-label">
              GET STARTED
            </span>

            <h2>Build your first resume</h2>

            <p>
              Create a resume manually or upload an
              existing PDF and let Careerly extract
              the information for you.
            </p>

            <div className="resume-empty-actions">
              <button
                className="resume-primary-button"
                onClick={handleCreateResume}
              >
                Create Resume
              </button>

              <button
                className="resume-secondary-button"
                onClick={handleUploadClick}
              >
                Upload PDF
              </button>
            </div>
          </section>
        ) : showPreview && selectedResume ? (
          /* ==================== RESUME PREVIEW ==================== */

          <section className="resume-preview-wrapper">
            <div className="resume-preview-toolbar no-print">
              <button
                className="resume-secondary-button"
                onClick={handleBackToEditor}
              >
                ← Back to Editor
              </button>

              <div className="resume-preview-toolbar-title">
                <span>RESUME PREVIEW</span>

                <strong>
                  {selectedResume.name}
                </strong>
              </div>

              <button
                className="resume-primary-button"
                onClick={handleDownloadPDF}
              >
                Download PDF
              </button>
            </div>

            <article className="resume-preview-paper">
              <header className="preview-resume-header">
                <h1>
                  {selectedResume.name ||
                    "My Resume"}
                </h1>

                {education.length > 0 &&
                  education[0]?.field && (
                    <p className="preview-resume-subtitle">
                      {education[0].field}
                    </p>
                  )}
              </header>

              {skills.length > 0 && (
                <section className="preview-resume-section">
                  <h2>SKILLS</h2>

                  <p className="preview-skills">
                    {skills.join(" • ")}
                  </p>
                </section>
              )}

              {experience.length > 0 && (
                <section className="preview-resume-section">
                  <h2>EXPERIENCE</h2>

                  {experience.map(
                    (item, index) => (
                      <div
                        className="preview-resume-entry"
                        key={index}
                      >
                        <div className="preview-entry-heading">
                          <div>
                            <h3>
                              {item.role ||
                                "Role"}
                            </h3>

                            {item.company && (
                              <strong>
                                {item.company}
                              </strong>
                            )}
                          </div>

                          {(item.startDate ||
                            item.endDate) && (
                            <span>
                              {formatResumeDate(
                                item.startDate
                              )}

                              {item.startDate ||
                              item.endDate
                                ? " – "
                                : ""}

                              {item.endDate
                                ? formatResumeDate(
                                    item.endDate
                                  )
                                : "Present"}
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p>
                            {item.description}
                          </p>
                        )}
                      </div>
                    )
                  )}
                </section>
              )}

              {projects.length > 0 && (
                <section className="preview-resume-section">
                  <h2>PROJECTS</h2>

                  {projects.map(
                    (item, index) => (
                      <div
                        className="preview-resume-entry"
                        key={index}
                      >
                        <div className="preview-entry-heading">
                          <div>
                            <h3>
                              {item.name ||
                                "Project"}
                            </h3>
                          </div>
                        </div>

                        {item.description && (
                          <p>
                            {item.description}
                          </p>
                        )}

                        {item.technologies?.length >
                          0 && (
                          <div className="preview-project-tech">
                            <strong>
                              Technologies:
                            </strong>{" "}
                            {item.technologies.join(
                              ", "
                            )}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </section>
              )}

              {education.length > 0 && (
                <section className="preview-resume-section">
                  <h2>EDUCATION</h2>

                  {education.map(
                    (item, index) => (
                      <div
                        className="preview-resume-entry"
                        key={index}
                      >
                        <div className="preview-entry-heading">
                          <div>
                            <h3>
                              {item.degree ||
                                "Education"}

                              {item.field
                                ? ` · ${item.field}`
                                : ""}
                            </h3>

                            {item.institution && (
                              <strong>
                                {item.institution}
                              </strong>
                            )}
                          </div>

                          {(item.startDate ||
                            item.endDate) && (
                            <span>
                              {formatResumeDate(
                                item.startDate
                              )}

                              {item.startDate ||
                              item.endDate
                                ? " – "
                                : ""}

                              {item.endDate
                                ? formatResumeDate(
                                    item.endDate
                                  )
                                : "Present"}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </section>
              )}

              {skills.length === 0 &&
                education.length === 0 &&
                experience.length === 0 &&
                projects.length === 0 && (
                  <div className="preview-resume-empty">
                    No resume information has been
                    added yet.
                  </div>
                )}
            </article>
          </section>
        ) : (
          <div className="resume-workspace">
            {/* RESUME LIST */}

            <aside className="resume-list-panel no-print">
              <div className="resume-list-heading">
                <div>
                  <span>YOUR RESUMES</span>

                  <strong>
                    {resumes.length}
                  </strong>
                </div>
              </div>

              <div className="resume-list">
                {resumes.map((resume) => (
                  <button
                    key={resume._id}
                    className={`resume-list-item ${
                      selectedResume?._id ===
                      resume._id
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      selectResume(resume)
                    }
                  >
                    <div className="resume-list-icon">
                      PDF
                    </div>

                    <div className="resume-list-info">
                      <strong>
                        {resume.name}
                      </strong>

                      <span>
                        {resume.isDefault
                          ? "Default resume"
                          : "Resume"}
                      </span>
                    </div>

                    {resume.isDefault && (
                      <span className="default-dot" />
                    )}
                  </button>
                ))}
              </div>
            </aside>

            {/* EDITOR */}

            {selectedResume && (
              <main className="resume-editor">
                <div className="resume-editor-header">
                  <div>
                    <span className="resume-section-label">
                      EDITING RESUME
                    </span>

                    <h2>
                      {selectedResume.name}
                    </h2>
                  </div>

                  <div className="resume-editor-actions">
                    <button
                      className="resume-secondary-button"
                      onClick={handlePreview}
                    >
                      Preview Resume
                    </button>

                    {!isNewResume && (
                      <>
                        <button
                          className="resume-danger-button"
                          onClick={
                            handleDeleteResume
                          }
                          disabled={saving}
                        >
                          Delete
                        </button>

                        {!isEditing && (
                          <button
                            className="resume-primary-button"
                            onClick={
                              handleEditResume
                            }
                          >
                            Edit Resume
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* BASIC INFO */}

                <section className="resume-section">
                  <div className="resume-section-heading">
                    <div>
                      <span>01</span>

                      <div>
                        <h3>
                          Resume Details
                        </h3>

                        <p>
                          Give this resume a clear name.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="resume-field">
                    <label>
                      Resume name
                    </label>

                    <input
                      type="text"
                      value={resumeName}
                      onChange={(event) =>
                        setResumeName(
                          event.target.value
                        )
                      }
                      placeholder="e.g. Software Engineer Resume"
                      disabled={!isEditing}
                    />
                  </div>
                </section>

                {/* SKILLS */}

                <section className="resume-section">
                  <div className="resume-section-heading">
                    <div>
                      <span>02</span>

                      <div>
                        <h3>Skills</h3>

                        <p>
                          Add the skills you want
                          recruiters to see.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="skill-input-row">
                    <input
                      type="text"
                      value={newSkill}
                      onChange={(event) =>
                        setNewSkill(
                          event.target.value
                        )
                      }
                      onKeyDown={
                        handleSkillKeyDown
                      }
                      placeholder="e.g. React, Node.js, Python"
                      disabled={!isEditing}
                    />

                    <button
                      className="resume-secondary-button"
                      onClick={addSkill}
                      disabled={!isEditing}
                    >
                      Add
                    </button>
                  </div>

                  <div className="skill-list">
                    {skills.map(
                      (skill, index) => (
                        <span
                          className="skill-chip"
                          key={`${skill}-${index}`}
                        >
                          {skill}

                          <button
                            onClick={() =>
                              removeSkill(
                                index
                              )
                            }
                            aria-label={`Remove ${skill}`}
                            disabled={!isEditing}
                          >
                            x
                          </button>
                        </span>
                      )
                    )}

                    {skills.length === 0 && (
                      <p className="resume-section-empty">
                        No skills added yet.
                      </p>
                    )}
                  </div>
                </section>

                {/* EDUCATION */}

                <section className="resume-section">
                  <div className="resume-section-heading">
                    <div>
                      <span>03</span>

                      <div>
                        <h3>Education</h3>

                        <p>
                          Add your academic background.
                        </p>
                      </div>
                    </div>

                    <button
                      className="resume-add-button"
                      onClick={addEducation}
                      disabled={!isEditing}
                    >
                      + Add Education
                    </button>
                  </div>

                  {education.length === 0 && (
                    <p className="resume-section-empty">
                      No education entries yet.
                    </p>
                  )}

                  <div className="resume-entry-list">
                    {education.map(
                      (item, index) => (
                        <div
                          className="resume-entry"
                          key={index}
                        >
                          <div className="resume-entry-top">
                            <strong>
                              Education{" "}
                              {index + 1}
                            </strong>

                            <button
                              className="resume-remove-button"
                              onClick={() =>
                                removeEducation(
                                  index
                                )
                              }
                              disabled={
                                !isEditing
                              }
                            >
                              Remove
                            </button>
                          </div>

                          <div className="resume-form-grid">
                            <div className="resume-field">
                              <label>
                                Institution
                              </label>

                              <input
                                value={
                                  item.institution ||
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateEducation(
                                    index,
                                    "institution",
                                    event.target
                                      .value
                                  )
                                }
                                disabled={
                                  !isEditing
                                }
                                placeholder="University / College"
                              />
                            </div>

                            <div className="resume-field">
                              <label>
                                Degree
                              </label>

                              <input
                                value={
                                  item.degree ||
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateEducation(
                                    index,
                                    "degree",
                                    event.target
                                      .value
                                  )
                                }
                                disabled={
                                  !isEditing
                                }
                                placeholder="Bachelor's / Master's"
                              />
                            </div>

                            <div className="resume-field">
                              <label>
                                Field of study
                              </label>

                              <input
                                value={
                                  item.field ||
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateEducation(
                                    index,
                                    "field",
                                    event.target
                                      .value
                                  )
                                }
                                disabled={
                                  !isEditing
                                }
                                placeholder="Computer Science"
                              />
                            </div>

                            <div className="resume-field">
                              <label>
                                Start date
                              </label>

                              <input
                                type="date"
                                value={formatDate(
                                  item.startDate
                                )}
                                onChange={(
                                  event
                                ) =>
                                  updateEducation(
                                    index,
                                    "startDate",
                                    event.target
                                      .value
                                  )
                                }
                                disabled={
                                  !isEditing
                                }
                              />
                            </div>

                            <div className="resume-field">
                              <label>
                                End date
                              </label>

                              <input
                                type="date"
                                value={formatDate(
                                  item.endDate
                                )}
                                onChange={(
                                  event
                                ) =>
                                  updateEducation(
                                    index,
                                    "endDate",
                                    event.target
                                      .value
                                  )
                                }
                                disabled={
                                  !isEditing
                                }
                              />
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </section>

                {/* EXPERIENCE */}

                <section className="resume-section">
                  <div className="resume-section-heading">
                    <div>
                      <span>04</span>

                      <div>
                        <h3>Experience</h3>

                        <p>
                          Add internships, jobs and
                          other professional experience.
                        </p>
                      </div>
                    </div>

                    <button
                      className="resume-add-button"
                      onClick={addExperience}
                      disabled={!isEditing}
                    >
                      + Add Experience
                    </button>
                  </div>

                  {experience.length === 0 && (
                    <p className="resume-section-empty">
                      No experience entries yet.
                    </p>
                  )}

                  <div className="resume-entry-list">
                    {experience.map(
                      (item, index) => (
                        <div
                          className="resume-entry"
                          key={index}
                        >
                          <div className="resume-entry-top">
                            <strong>
                              Experience{" "}
                              {index + 1}
                            </strong>

                            <button
                              className="resume-remove-button"
                              onClick={() =>
                                removeExperience(
                                  index
                                )
                              }
                              disabled={
                                !isEditing
                              }
                            >
                              Remove
                            </button>
                          </div>

                          <div className="resume-form-grid">
                            <div className="resume-field">
                              <label>
                                Company
                              </label>

                              <input
                                value={
                                  item.company ||
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateExperience(
                                    index,
                                    "company",
                                    event.target
                                      .value
                                  )
                                }
                                disabled={
                                  !isEditing
                                }
                                placeholder="Company name"
                              />
                            </div>

                            <div className="resume-field">
                              <label>
                                Role
                              </label>

                              <input
                                value={
                                  item.role ||
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateExperience(
                                    index,
                                    "role",
                                    event.target
                                      .value
                                  )
                                }
                                disabled={
                                  !isEditing
                                }
                                placeholder="Software Engineering Intern"
                              />
                            </div>

                            <div className="resume-field">
                              <label>
                                Start date
                              </label>

                              <input
                                type="date"
                                value={formatDate(
                                  item.startDate
                                )}
                                onChange={(
                                  event
                                ) =>
                                  updateExperience(
                                    index,
                                    "startDate",
                                    event.target
                                      .value
                                  )
                                }
                                disabled={
                                  !isEditing
                                }
                              />
                            </div>

                            <div className="resume-field">
                              <label>
                                End date
                              </label>

                              <input
                                type="date"
                                value={formatDate(
                                  item.endDate
                                )}
                                onChange={(
                                  event
                                ) =>
                                  updateExperience(
                                    index,
                                    "endDate",
                                    event.target
                                      .value
                                  )
                                }
                                disabled={
                                  !isEditing
                                }
                              />
                            </div>

                            <div className="resume-field full-width">
                              <label>
                                Description
                              </label>

                              <textarea
                                value={
                                  item.description ||
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateExperience(
                                    index,
                                    "description",
                                    event.target
                                      .value
                                  )
                                }
                                disabled={
                                  !isEditing
                                }
                                placeholder="Describe your responsibilities and achievements..."
                                rows="5"
                              />
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </section>

                {/* PROJECTS */}

                <section className="resume-section">
                  <div className="resume-section-heading">
                    <div>
                      <span>05</span>

                      <div>
                        <h3>Projects</h3>

                        <p>
                          Highlight projects that
                          demonstrate your skills.
                        </p>
                      </div>
                    </div>

                    <button
                      className="resume-add-button"
                      onClick={addProject}
                      disabled={!isEditing}
                    >
                      + Add Project
                    </button>
                  </div>

                  {projects.length === 0 && (
                    <p className="resume-section-empty">
                      No projects added yet.
                    </p>
                  )}

                  <div className="resume-entry-list">
                    {projects.map(
                      (item, index) => (
                        <div
                          className="resume-entry"
                          key={index}
                        >
                          <div className="resume-entry-top">
                            <strong>
                              Project{" "}
                              {index + 1}
                            </strong>

                            <button
                              className="resume-remove-button"
                              onClick={() =>
                                removeProject(
                                  index
                                )
                              }
                              disabled={
                                !isEditing
                              }
                            >
                              Remove
                            </button>
                          </div>

                          <div className="resume-form-grid">
                            <div className="resume-field full-width">
                              <label>
                                Project name
                              </label>

                              <input
                                value={
                                  item.name ||
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateProject(
                                    index,
                                    "name",
                                    event.target
                                      .value
                                  )
                                }
                                disabled={
                                  !isEditing
                                }
                                placeholder="Careerly"
                              />
                            </div>

                            <div className="resume-field full-width">
                              <label>
                                Description
                              </label>

                              <textarea
                                value={
                                  item.description ||
                                  ""
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateProject(
                                    index,
                                    "description",
                                    event.target
                                      .value
                                  )
                                }
                                disabled={
                                  !isEditing
                                }
                                placeholder="Describe the project, what you built and what problem it solved..."
                                rows="5"
                              />
                            </div>

                            <div className="resume-field full-width">
                              <label>
                                Technologies
                              </label>

                              <input
                                value={(
                                  item.technologies ||
                                  []
                                ).join(", ")}
                                onChange={(
                                  event
                                ) =>
                                  updateProjectTechnologies(
                                    index,
                                    event.target
                                      .value
                                  )
                                }
                                disabled={
                                  !isEditing
                                }
                                placeholder="React, Node.js, MongoDB"
                              />

                              <small>
                                Separate technologies
                                with commas.
                              </small>
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </section>

                {/* UPLOADED FILE */}

                {selectedResume.fileUrl && (
                  <section className="resume-source-card">
                    <div>
                      <span className="resume-section-label">
                        SOURCE FILE
                      </span>

                      <h3>
                        Uploaded resume
                      </h3>

                      <p>
                        This resume was created from
                        an uploaded PDF.
                      </p>
                    </div>

                    <a
                      href={`http://localhost:5000${selectedResume.fileUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="resume-secondary-button"
                    >
                      View PDF
                    </a>
                  </section>
                )}

                <div className="resume-bottom-actions">
                  {!isNewResume &&
                    !isEditing &&
                    !selectedResume.isDefault && (
                      <button
                        className="resume-text-button"
                        onClick={
                          handleSetDefault
                        }
                        disabled={saving}
                      >
                        Set as default
                      </button>
                    )}

                  {isNewResume ? (
                    <>
                      <button
                        className="resume-secondary-button"
                        onClick={
                          handleCancelEdit
                        }
                        disabled={saving}
                      >
                        Cancel
                      </button>

                      <button
                        className="resume-primary-button"
                        onClick={
                          handleAddResume
                        }
                        disabled={saving}
                      >
                        {saving
                          ? "Adding..."
                          : "Add Resume"}
                      </button>
                    </>
                  ) : (
                    isEditing && (
                      <>
                        <button
                          className="resume-secondary-button"
                          onClick={
                            handleCancelEdit
                          }
                          disabled={saving}
                        >
                          Cancel
                        </button>

                        <button
                          className="resume-primary-button"
                          onClick={
                            handleSaveResume
                          }
                          disabled={saving}
                        >
                          {saving
                            ? "Saving..."
                            : "Add Changes"}
                        </button>
                      </>
                    )
                  )}
                </div>
              </main>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Resume;