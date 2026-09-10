const {
    generateAIResponse,
} = require("../services/geminiService");

const {
    searchAdzunaJobs,
    normalizeAdzunaJob,
} = require("../services/adzunaService");

const Resume = require("../models/Resume");
const User = require("../models/User");
const RecommendationFeedback = require(
    "../models/RecommendationFeedback"
);

/*
 * ============================
 * TEST AI
 * ============================
 */

const testAI = async (req, res) => {
    try {
        const response = await generateAIResponse(
            "Respond with exactly: Careerly AI is connected."
        );

        res.json({
            success: true,
            message: response,
        });
    } catch (error) {
        console.error("Gemini test error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to connect to Gemini.",
            error: error.message,
        });
    }
};

/*
 * ============================
 * MATCH JOB
 * ============================
 */

const matchJob = async (req, res) => {
    try {
        const {
            resume,
            job,
        } = req.body;

        if (!resume || !job) {
            return res.status(400).json({
                success: false,
                message: "Resume and job data are required.",
            });
        }

        const prompt = `
You are Careerly's AI job matching assistant.

Compare the candidate's resume with the job.

CANDIDATE RESUME:
${JSON.stringify(resume, null, 2)}

JOB:
${JSON.stringify(job, null, 2)}

Return ONLY valid JSON.
Do not use markdown.
Do not use code fences.
Do not add any text before or after the JSON.

Use exactly this structure:

{
  "matchScore": 0,
  "matchLabel": "",
  "matchSummary": "",
  "matchingSkills": [],
  "missingSkills": [],
  "strengths": [],
  "recommendation": ""
}

Rules:

- matchScore must be a whole number from 0 to 100.
- matchLabel should be a short label such as "Strong match", "Good match", "Moderate match", or "Low match".
- matchSummary should be one short sentence explaining the overall match.
- matchingSkills should contain skills from the candidate that are relevant to the job.
- missingSkills should contain important skills mentioned or clearly required by the job that are not present in the candidate data.
- strengths should contain 2 to 4 concise points.
- recommendation should be one concise sentence.
- Do not invent skills, experience, education, projects, or qualifications.
- If information is unavailable, do not assume it exists.
`;

        const response = await generateAIResponse(prompt);

        let analysis;

        try {
            analysis = JSON.parse(response);
        } catch (parseError) {
            console.error(
                "Failed to parse Gemini response:",
                response
            );

            return res.status(500).json({
                success: false,
                message: "AI returned an invalid analysis format.",
            });
        }

        res.json({
            success: true,
            analysis,
        });
    } catch (error) {
        console.error("AI job match error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to analyze job match.",
        });
    }
};

/*
 * ============================
 * RECOMMEND JOBS
 * ============================
 */

const recommendJobs = async (req, res) => {
    try {
        /*
         * ============================
         * FIND USER
         * ============================
         */

        const user = await User.findOne({
            firebaseUid: req.firebaseUser.uid,
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Careerly user profile not found.",
            });
        }

        /*
         * ============================
         * FIND DEFAULT RESUME
         * ============================
         */

        const resume = await Resume.findOne({
            userId: user._id,
            isDefault: true,
        }).sort({
            createdAt: -1,
        });

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "No default resume found.",
            });
        }

        const parsedData = resume.parsedData || {};

        const skills = Array.isArray(parsedData.skills)
            ? parsedData.skills
            : [];

        const experience = Array.isArray(parsedData.experience)
            ? parsedData.experience
            : [];

        const projects = Array.isArray(parsedData.projects)
            ? parsedData.projects
            : [];

        /*
         * ============================
         * USER PREFERENCES
         * ============================
         */

        const preferences = user.preferences || {};

        const preferredWorkType =
            Array.isArray(preferences.employmentTypes) &&
            preferences.employmentTypes.length > 0
                ? preferences.employmentTypes[0]
                : "";

        const preferredWorkMode =
            Array.isArray(preferences.workModes) &&
            preferences.workModes.length > 0
                ? preferences.workModes[0]
                : "";

        const preferredLocation =
            Array.isArray(preferences.locations) &&
            preferences.locations.length > 0
                ? preferences.locations[0].trim()
                : "";

        const preferredExperienceLevel =
            preferences.experienceLevel &&
            preferences.experienceLevel !== "Any"
                ? preferences.experienceLevel
                : "";

        /*
         * ============================
         * PREVIOUSLY REJECTED JOBS
         * ============================
         */

        const feedbackRecords =
            await RecommendationFeedback.find({
                userId: user._id,
                feedback: "not_interested",
            }).select("source externalId");

        const rejectedJobKeys = new Set(
            feedbackRecords.map(
                (feedback) =>
                    `${feedback.source}-${String(
                        feedback.externalId
                    )}`
            )
        );

        /*
         * ============================
         * NORMALIZE RESUME SKILLS
         * ============================
         */

        const normalizedSkills = skills
            .filter(
                (skill) =>
                    typeof skill === "string" &&
                    skill.trim()
            )
            .map((skill) => skill.trim());

        /*
         * ============================
         * BUILD SEARCH QUERIES
         * ============================
         */

        const queries = [];

        /*
         * Explicitly selected roles get
         * the highest priority.
         */

        if (
            Array.isArray(preferences.roles) &&
            preferences.roles.length > 0
        ) {
            preferences.roles
                .filter(
                    (role) =>
                        typeof role === "string" &&
                        role.trim()
                )
                .slice(0, 3)
                .forEach((role) => {
                    queries.push(role.trim());
                });
        }

        /*
         * Detect technologies from resume.
         */

        const skillText = normalizedSkills
            .join(" ")
            .toLowerCase();

        const hasReact =
            skillText.includes("react");

        const hasAngular =
            skillText.includes("angular");

        const hasVue =
            skillText.includes("vue");

        const hasJavaScript =
            skillText.includes("javascript") ||
            skillText.includes("typescript");

        const hasPython =
            skillText.includes("python");

        const hasJava =
            skillText.includes("java");

        const hasCSharp =
            skillText.includes("c#") ||
            skillText.includes("csharp");

        const hasNode =
            skillText.includes("node") ||
            skillText.includes("express");

        const hasDjango =
            skillText.includes("django") ||
            skillText.includes("flask");

        const hasSpring =
            skillText.includes("spring");

        const hasSQL =
            skillText.includes("sql") ||
            skillText.includes("mysql") ||
            skillText.includes("postgres") ||
            skillText.includes("postgresql");

        const hasFrontend =
            hasReact ||
            hasAngular ||
            hasVue ||
            hasJavaScript ||
            skillText.includes("html") ||
            skillText.includes("css");

        const hasBackend =
            hasNode ||
            hasPython ||
            hasJava ||
            hasCSharp ||
            hasDjango ||
            hasSpring ||
            hasSQL;

        const hasFullStack =
            hasFrontend && hasBackend;

        /*
         * Add role searches.
         */

        if (hasReact) {
            queries.push("React Developer");
        }

        if (hasAngular) {
            queries.push("Angular Developer");
        }

        if (hasVue) {
            queries.push("Vue Developer");
        }

        if (hasPython) {
            if (hasDjango) {
                queries.push("Python Django Developer");
            } else {
                queries.push("Python Developer");
            }
        }

        if (hasJava) {
            if (hasSpring) {
                queries.push("Java Spring Developer");
            } else {
                queries.push("Java Developer");
            }
        }

        if (hasCSharp) {
            queries.push("C# Developer");
        }

        if (hasFullStack) {
            queries.push("Full Stack Developer");
        } else if (hasFrontend) {
            queries.push("Frontend Developer");
        } else if (hasBackend) {
            queries.push("Backend Developer");
        }

        if (
            projects.length > 0 &&
            (hasFrontend || hasBackend)
        ) {
            queries.push("Software Developer");
        }

        if (
            preferredWorkType === "Internship" ||
            preferredExperienceLevel === "Internship"
        ) {
            queries.push("Software Developer Intern");
        }

        if (queries.length === 0) {
            queries.push(
                "Software Developer",
                "Software Developer Intern"
            );
        }

        /*
         * Remove duplicate queries.
         *
         * IMPORTANT:
         * We now intentionally limit the number
         * of Adzuna requests.
         */

        const uniqueQueries = [
            ...new Set(
                queries.map((query) => query.trim())
            ),
        ]
            .filter(Boolean)
            .slice(0, 3);

        /*
         * ============================
         * ADZUNA FILTERS
         * ============================
         */

        let adzunaJobType = "";

        if (preferredWorkType === "Full-time") {
            adzunaJobType = "full_time";
        } else if (
            preferredWorkType === "Part-time"
        ) {
            adzunaJobType = "part_time";
        } else if (
            preferredWorkType === "Contract"
        ) {
            adzunaJobType = "contract";
        } else if (
            preferredWorkType === "Internship"
        ) {
            adzunaJobType = "internship";
        }

        let adzunaWorkMode = "";

        if (preferredWorkMode === "Remote") {
            adzunaWorkMode = "remote";
        } else if (
            preferredWorkMode === "Hybrid"
        ) {
            adzunaWorkMode = "hybrid";
        } else if (
            preferredWorkMode === "On-site"
        ) {
            adzunaWorkMode = "on_site";
        }

        /*
         * ============================
         * SEARCH ADZUNA
         * ============================
         *
         * IMPORTANT:
         * Do NOT use Promise.all here.
         *
         * Requests are made one at a time so we
         * don't hit Adzuna with several requests
         * simultaneously.
         */

        const combinedJobs = [];

        let adzunaRateLimited = false;

        for (const query of uniqueQueries) {
            try {
                const result =
                    await searchAdzunaJobs({
                        query,
                        location: preferredLocation,
                        jobType: adzunaJobType,
                        workMode: adzunaWorkMode,
                        sortBy: "relevance",
                        page: 1,
                        resultsPerPage: 10,
                    });

                if (
                    result &&
                    Array.isArray(result.results)
                ) {
                    combinedJobs.push(
                        ...result.results
                    );
                }

                /*
                 * Small delay between requests.
                 *
                 * This prevents Careerly from firing
                 * several Adzuna requests back-to-back.
                 */

                await new Promise((resolve) =>
                    setTimeout(resolve, 500)
                );
            } catch (error) {
                const status =
                    error.response?.status;

                console.error(
                    `Adzuna recommendation search failed for "${query}":`,
                    error.message
                );

                /*
                 * 429 = rate limited.
                 *
                 * Stop making additional requests
                 * instead of making the problem worse.
                 */

                if (status === 429) {
                    adzunaRateLimited = true;

                    console.error(
                        "Adzuna rate limit reached. Stopping recommendation searches."
                    );

                    break;
                }

                /*
                 * Other search failures should not
                 * destroy the whole recommendation
                 * request.
                 */

                continue;
            }
        }

        /*
         * ============================
         * REMOVE DUPLICATES
         * ============================
         */

        const uniqueJobs = [];
        const seenIds = new Set();

        for (const job of combinedJobs) {
            if (!job || job.id === undefined) {
                continue;
            }

            const id = String(job.id);

            const source =
                job.source || "adzuna";

            const jobKey =
                `${source}-${id}`;

            if (seenIds.has(jobKey)) {
                continue;
            }

            if (rejectedJobKeys.has(jobKey)) {
                continue;
            }

            seenIds.add(jobKey);
            uniqueJobs.push(job);
        }

        /*
         * ============================
         * NO JOBS FOUND
         * ============================
         */

        if (uniqueJobs.length === 0) {
            return res.status(200).json({
                success: true,

                queries: uniqueQueries,

                preferences: {
                    workType:
                        preferredWorkType || "Any",

                    workMode:
                        preferredWorkMode || "Any",

                    location:
                        preferredLocation || "",

                    experienceLevel:
                        preferredExperienceLevel || "Any",
                },

                recommendations: [],

                message: adzunaRateLimited
                    ? "Job recommendations are temporarily unavailable because the job search service is rate-limited. Please try again shortly."
                    : rejectedJobKeys.size > 0
                        ? "No new jobs matching your preferences were found."
                        : "No jobs matching your preferences were found.",
            });
        }

        /*
         * ============================
         * NORMALIZE JOBS
         * ============================
         */

        const normalizedJobs =
            uniqueJobs.map(
                normalizeAdzunaJob
            );

        /*
         * Maximum of 35 jobs sent to Gemini.
         */

        const jobsForAI =
            normalizedJobs
                .slice(0, 35)
                .map((job, index) => ({
                    index,

                    externalId:
                        job.externalId,

                    source:
                        job.source,

                    title:
                        job.title,

                    company:
                        job.company,

                    location:
                        job.location,

                    description:
                        job.description,

                    jobType:
                        job.jobType,

                    workMode:
                        job.workMode,

                    salary:
                        job.salary,

                    experienceLevel:
                        job.experienceLevel,

                    postedAt:
                        job.postedAt
                            ? new Date(
                                job.postedAt
                            ).toISOString()
                            : null,
                }));

        /*
         * ============================
         * CANDIDATE INTENT
         * ============================
         */

        const isStudentOrEarlyCareer =
            preferredExperienceLevel === "Internship" ||
            preferredExperienceLevel === "Entry Level" ||
            preferredWorkType === "Internship" ||
            projects.length > 0;

        const candidateIntent = {
            careerDirection:
                Array.isArray(preferences.roles) &&
                preferences.roles.length > 0
                    ? preferences.roles
                        .filter(
                            (role) =>
                                typeof role === "string" &&
                                role.trim()
                        )
                        .slice(0, 5)
                    : [],

            preferredWorkType:
                preferredWorkType || "Any",

            preferredWorkMode:
                preferredWorkMode || "Any",

            preferredLocation:
                preferredLocation || "Any",

            preferredExperienceLevel:
                preferredExperienceLevel || "Any",

            earlyCareerCandidate:
                isStudentOrEarlyCareer,

            hasRelevantProjects:
                projects.length > 0,

            skillCount:
                normalizedSkills.length,
        };

        /*
         * ============================
         * GEMINI RANKING
         * ============================
         */

        const rankingPrompt = `
You are Careerly's AI job recommendation assistant.

Your task is to rank the best real job listings for this candidate.

Careerly is designed to help candidates find jobs that are not only
technically relevant, but also realistically suitable for what they are
currently looking for.

IMPORTANT:
Careerly has already filtered the job listings using the candidate's
explicit preferences where possible. You must respect those preferences
when ranking the remaining jobs.

CANDIDATE RESUME:

Skills:
${JSON.stringify(skills, null, 2)}

Experience:
${JSON.stringify(experience, null, 2)}

Projects:
${JSON.stringify(projects, null, 2)}

CANDIDATE PREFERENCES:

Work Type:
${preferredWorkType || "Any"}

Work Mode:
${preferredWorkMode || "Any"}

Preferred Location:
${preferredLocation || "Any"}

Experience Level:
${preferredExperienceLevel || "Any"}

CANDIDATE INTENT:

${JSON.stringify(candidateIntent, null, 2)}

REAL JOB LISTINGS:
${JSON.stringify(jobsForAI, null, 2)}

Return ONLY valid JSON.
Do not use markdown.
Do not use code fences.
Do not add any text before or after the JSON.

Use exactly this structure:

{
  "recommendations": [
    {
      "index": 0,
      "matchScore": 0,
      "reason": ""
    }
  ]
}

Rules:

- Return at most 5 recommendations.
- Only recommend jobs from the provided REAL JOB LISTINGS.
- "index" must exactly match the index of a provided job.
- Do not return the same index more than once.
- matchScore must be a whole number from 0 to 100.
- Rank recommendations from highest match to lowest match.
- reason must be one concise sentence explaining the strongest reasons
  this job matches the candidate.
- Mention specific candidate skills, projects, experience, or preferences
  when they are genuinely relevant.
- Do not mention information that is not present in the resume,
  preferences, candidate intent, or job listing.
- Keep the reason natural and concise.
- Do not invent jobs, companies, skills, experience, qualifications, salaries,
  locations, or job requirements.

FRESHNESS RULES:

- postedAt is the date the job listing was published.
- When two jobs have similar candidate fit, prefer the more recently posted
  job.
- A newer job should receive a modest ranking advantage when its relevance
  is otherwise comparable.
- Do not recommend an older job over a clearly better and more relevant
  recent job merely because it is older.
- Never invent or estimate a posting date.
- If postedAt is null, treat freshness as unknown rather than assuming the
  job is recent.

PERSONALIZATION RULES:

1. USER INTENT COMES FIRST

The candidate's explicit preferences represent what they are actively
looking for.

Treat the following as strong signals:

- preferred roles
- preferred work type
- preferred work mode
- preferred location
- preferred experience level

A technically excellent job is not a strong recommendation if it does not
fit what the candidate explicitly wants.

2. PREFERRED ROLE DIRECTION

If the candidate selected specific roles, strongly prioritize jobs whose
titles and responsibilities align with those roles.

Resume skills can expand the search, but they should not completely replace
the candidate's chosen career direction.

3. WORK TYPE

If the candidate explicitly prefers Internship, prioritize internships and
appropriate trainee/graduate opportunities.

If the candidate explicitly prefers Part-time, prioritize part-time jobs.

If the candidate explicitly prefers Full-time, prioritize full-time jobs.

If the candidate explicitly prefers Contract, prioritize contract jobs.

4. WORK MODE

If the candidate explicitly prefers Remote, remote jobs should receive a
strong preference.

If the candidate explicitly prefers Hybrid, hybrid jobs should receive a
strong preference.

If the candidate explicitly prefers On-site, on-site jobs should receive a
strong preference.

Never assume that an unspecified work mode satisfies the candidate's
preference.

5. LOCATION

If the candidate specified a preferred location, prefer jobs that are
located in or clearly associated with that location.

Do not claim that a job matches the location preference when the listing
does not provide enough information to establish that.

6. EXPERIENCE LEVEL

If the candidate is an early-career/student candidate, prioritize realistic
entry-level opportunities.

Relevant internships, graduate roles, trainee roles, fresher roles, and
entry-level positions should receive strong consideration when appropriate.

Do not rank senior or highly experienced roles highly merely because the
candidate possesses some matching technical skills.

7. STUDENT-FRIENDLY PERSONALIZATION

When the candidate appears to be an early-career candidate:

- Projects should be treated as meaningful evidence of practical ability.
- Relevant skills demonstrated through projects should receive strong
  consideration even when professional experience is limited.
- Internship, trainee, graduate, and entry-level opportunities should be
  favored when appropriate.
- Do not penalize the candidate heavily simply because professional
  experience is limited.
- Do not invent professional experience from projects.

8. TECHNICAL MATCH

After explicit preferences and candidate intent are considered, evaluate:

- relevant skills
- role responsibilities
- projects
- actual professional experience
- education when available

Prefer jobs where the candidate can realistically contribute based on the
information provided.

9. MISSING INFORMATION

Missing information is neutral.

Do not assume:

- missing skills exist
- missing experience exists
- unspecified work mode matches
- unspecified employment type matches
- unspecified location matches
- unspecified qualifications exist

10. OVERALL PERSONAL FIT

The strongest recommendations should represent a combination of:

- what the candidate wants
- what the candidate can do
- what the candidate is currently qualified for
- what the actual job requires
- how recently the job was posted when relevance is otherwise similar

Do not recommend a job solely because it shares keywords with the resume.

11. RECOMMENDATION DIVERSITY

When multiple jobs have similar match quality, prefer a useful mix of
closely related roles rather than five nearly identical listings.

Avoid recommending several jobs that are effectively the same role unless
there are no meaningful alternatives.

Prefer different companies when similarly relevant jobs are available.

Diversity must never override an explicit user preference or strong
resume/job match.

IMPORTANT:

A recommendation should answer:

"Is this a job this candidate would realistically want AND be reasonably
suited for?"

not merely:

"Does this job contain technologies from the candidate's resume?"
`;

        const rankingResponse =
            await generateAIResponse(
                rankingPrompt
            );

        let rankingResult;

        try {
            rankingResult =
                JSON.parse(rankingResponse);
        } catch (parseError) {
            console.error(
                "Failed to parse Gemini recommendation response:",
                rankingResponse
            );

            return res.status(500).json({
                success: false,
                message:
                    "AI returned an invalid recommendation format.",
            });
        }

        const aiRecommendations =
            Array.isArray(
                rankingResult.recommendations
            )
                ? rankingResult.recommendations
                : [];

        /*
         * ============================
         * VALIDATE AI RECOMMENDATIONS
         * ============================
         */

        const usedIndexes = new Set();

        const recommendations =
            aiRecommendations
                .map((recommendation) => {
                    const index = Number(
                        recommendation.index
                    );

                    if (
                        !Number.isInteger(index) ||
                        index < 0 ||
                        index >= jobsForAI.length
                    ) {
                        return null;
                    }

                    if (
                        usedIndexes.has(index)
                    ) {
                        return null;
                    }

                    usedIndexes.add(index);

                    const job =
                        normalizedJobs[index];

                    const matchScore =
                        Number(
                            recommendation.matchScore
                        );

                    const reason =
                        typeof recommendation.reason ===
                            "string"
                            ? recommendation.reason.trim()
                            : "";

                    if (!reason) {
                        return null;
                    }

                    return {
                        job,

                        matchScore:
                            Math.min(
                                100,
                                Math.max(
                                    0,
                                    Number.isFinite(
                                        matchScore
                                    )
                                        ? Math.round(
                                            matchScore
                                        )
                                        : 0
                                )
                            ),

                        reason,
                    };
                })
                .filter(Boolean)
                .slice(0, 5);

        /*
         * Keep highest match first.
         */

        recommendations.sort(
            (a, b) =>
                b.matchScore -
                a.matchScore
        );

        /*
         * ============================
         * RESPONSE
         * ============================
         */

        return res.status(200).json({
            success: true,

            queries: uniqueQueries,

            preferences: {
                workType:
                    preferredWorkType || "Any",

                workMode:
                    preferredWorkMode || "Any",

                location:
                    preferredLocation || "",

                experienceLevel:
                    preferredExperienceLevel || "Any",
            },

            recommendations,
        });
    } catch (error) {
        console.error(
            "Job recommendation error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to generate job recommendations.",
        });
    }
};

/*
 * ============================
 * TAILOR RESUME
 * ============================
 */

const tailorResume = async (req, res) => {
    try {
        const { job } = req.body;

        if (!job) {
            return res.status(400).json({
                success: false,
                message: "Job data is required.",
            });
        }

        const user = await User.findOne({
            firebaseUid: req.firebaseUser.uid,
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Careerly user profile not found.",
            });
        }

        const resume = await Resume.findOne({
            userId: user._id,
            isDefault: true,
        }).sort({
            createdAt: -1,
        });

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "No default resume found.",
            });
        }

        const parsedData =
            resume.parsedData || {};

        const resumeData = {
            skills:
                Array.isArray(parsedData.skills)
                    ? parsedData.skills
                    : [],

            experience:
                Array.isArray(parsedData.experience)
                    ? parsedData.experience
                    : [],

            projects:
                Array.isArray(parsedData.projects)
                    ? parsedData.projects
                    : [],

            education:
                Array.isArray(parsedData.education)
                    ? parsedData.education
                    : [],
        };

        const jobData = {
            title:
                job.title || "",

            company:
                job.company || "",

            location:
                job.location || "",

            description:
                job.description || "",

            jobType:
                job.jobType || "",

            workMode:
                job.workMode || "",

            experienceLevel:
                job.experienceLevel || "",

            skills:
                Array.isArray(job.skills)
                    ? job.skills
                    : [],
        };

        const prompt = `
You are Careerly's AI resume tailoring assistant.

Your task is to tailor the candidate's existing resume specifically for
the provided job.

The goal is to improve relevance, clarity, keyword alignment, and
presentation while remaining completely truthful.

IMPORTANT:

You may ONLY use information that already exists in the candidate's
resume.

You MUST NOT invent:

- skills
- work experience
- companies
- job titles
- achievements
- responsibilities
- projects
- technologies
- education
- certifications
- metrics
- qualifications

You may:

- rewrite existing experience descriptions
- improve wording
- emphasize relevant existing skills
- reorder existing skills when useful
- emphasize relevant existing projects
- improve project descriptions using information already present
- make existing content more concise and professional
- align wording with terminology used in the job description when the
  candidate already has the corresponding experience or skill

If the job asks for something the candidate does not have, do NOT add it.

CANDIDATE RESUME:

${JSON.stringify(resumeData, null, 2)}

TARGET JOB:

${JSON.stringify(jobData, null, 2)}

Return ONLY valid JSON.
Do not use markdown.
Do not use code fences.
Do not add any text before or after the JSON.

Use exactly this structure:

{
  "summary": "",
  "skills": [],
  "experience": [
    {
      "company": "",
      "role": "",
      "description": ""
    }
  ],
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": []
    }
  ],
  "education": [
    {
      "institution": "",
      "degree": "",
      "field": ""
    }
  ],
  "changes": []
}

Rules:

- summary should be a concise professional summary based ONLY on the
  candidate's existing information.
- If the candidate does not have enough information for a meaningful
  summary, return an empty string.
- skills must contain only skills already present in the candidate resume.
- Do not add skills simply because the job description mentions them.
- Experience must contain only the candidate's existing experience.
- Do not create new companies, roles, dates, responsibilities, or
  achievements.
- Experience descriptions may be rewritten to emphasize relevant
  responsibilities that already exist.
- Projects must contain only the candidate's existing projects.
- Project descriptions may be rewritten using information already present.
- Technologies must contain only technologies already associated with the
  candidate's projects or skills.
- Education must contain only existing education information.
- changes should contain 2 to 6 concise descriptions of what was improved.
- Changes must describe actual modifications made to the supplied resume.
- Do not claim that a missing qualification was added.
- Do not add fabricated metrics such as percentages, revenue, performance
  improvements, user counts, or time savings.
- Do not add certifications or achievements that are not present.
- Preserve the factual meaning of the candidate's original information.

TAILORING PRIORITIES:

1. Target the language toward the actual job.
2. Highlight existing skills relevant to the job.
3. Highlight existing projects relevant to the job.
4. Emphasize relevant existing experience.
5. Improve clarity and professional wording.
6. Keep everything truthful.
`;

        const response =
            await generateAIResponse(prompt);

        let tailoredResume;

        try {
            tailoredResume =
                JSON.parse(response);
        } catch (parseError) {
            console.error(
                "Failed to parse Gemini resume tailoring response:",
                response
            );

            return res.status(500).json({
                success: false,
                message:
                    "AI returned an invalid resume tailoring format.",
            });
        }

        if (
            typeof tailoredResume !== "object" ||
            tailoredResume === null
        ) {
            return res.status(500).json({
                success: false,
                message:
                    "AI returned an invalid resume.",
            });
        }

        if (
            !Array.isArray(
                tailoredResume.skills
            )
        ) {
            tailoredResume.skills = [];
        }

        if (
            !Array.isArray(
                tailoredResume.experience
            )
        ) {
            tailoredResume.experience = [];
        }

        if (
            !Array.isArray(
                tailoredResume.projects
            )
        ) {
            tailoredResume.projects = [];
        }

        if (
            !Array.isArray(
                tailoredResume.education
            )
        ) {
            tailoredResume.education = [];
        }

        if (
            !Array.isArray(
                tailoredResume.changes
            )
        ) {
            tailoredResume.changes = [];
        }

        if (
            typeof tailoredResume.summary !==
            "string"
        ) {
            tailoredResume.summary = "";
        }

        return res.status(200).json({
            success: true,

            message:
                "Resume tailored successfully.",

            job: {
                title:
                    jobData.title,

                company:
                    jobData.company,
            },

            resume:
                tailoredResume,
        });
    } catch (error) {
        console.error(
            "AI resume tailoring error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to tailor resume.",
        });
    }
};

module.exports = {
    testAI,
    matchJob,
    recommendJobs,
    tailorResume,
};