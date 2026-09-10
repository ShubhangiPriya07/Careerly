const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const MODEL_NAME = "gemini-3.6-flash";

const emptyResumeData = () => ({
  skills: [],
  education: [],
  experience: [],
  projects: [],
});

const cleanString = (value) => {
  if (typeof value !== "string") {
    return "";
  }

  return value.replace(/\s+/g, " ").trim();
};

const cleanArray = (array) => {
  if (!Array.isArray(array)) {
    return [];
  }

  const result = [];

  for (const item of array) {
    const value = cleanString(item);

    if (!value) {
      continue;
    }

    const exists = result.some(
      (existing) =>
        existing.toLowerCase() === value.toLowerCase()
    );

    if (!exists) {
      result.push(value);
    }
  }

  return result;
};

const cleanResumeData = (data) => {
  if (!data || typeof data !== "object") {
    return emptyResumeData();
  }

  const education = Array.isArray(data.education)
    ? data.education
        .map((item) => ({
          institution: cleanString(item?.institution),
          degree: cleanString(item?.degree),
          field: cleanString(item?.field),
          startDate: cleanString(item?.startDate),
          endDate: cleanString(item?.endDate),
        }))
        .filter(
          (item) =>
            item.institution ||
            item.degree ||
            item.field
        )
    : [];

  const experience = Array.isArray(data.experience)
    ? data.experience
        .map((item) => ({
          company: cleanString(item?.company),
          role: cleanString(item?.role),
          description: cleanString(item?.description),
          startDate: cleanString(item?.startDate),
          endDate: cleanString(item?.endDate),
        }))
        .filter(
          (item) =>
            item.company ||
            item.role ||
            item.description
        )
    : [];

  const projects = Array.isArray(data.projects)
    ? data.projects
        .map((item) => ({
          name: cleanString(item?.name),
          description: cleanString(item?.description),
          technologies: cleanArray(item?.technologies),
        }))
        .filter(
          (item) =>
            item.name ||
            item.description
        )
        .filter(
          (item) =>
            !/^(links?|github|live|repository|demo)$/i.test(
              item.name
            )
        )
    : [];

  return {
    skills: cleanArray(data.skills),
    education,
    experience,
    projects,
  };
};

const parseResumeText = async (text = "") => {
  const resumeText = text.trim();

  if (!resumeText) {
    return emptyResumeData();
  }

  const prompt = `
You are an expert resume parser.

Extract structured information from the resume text below.

Return ONLY valid JSON.
Do not use markdown.
Do not include explanations outside the JSON.

Use exactly this structure:

{
  "skills": [],
  "education": [
    {
      "institution": "",
      "degree": "",
      "field": "",
      "startDate": "",
      "endDate": ""
    }
  ],
  "experience": [
    {
      "company": "",
      "role": "",
      "description": "",
      "startDate": "",
      "endDate": ""
    }
  ],
  "projects": [
    {
      "name": "",
      "description": "",
      "technologies": []
    }
  ]
}

RULES:

- Extract only information explicitly present in the resume.
- Never invent information.
- Preserve every distinct education entry.
- Preserve every distinct work experience entry.
- Preserve every distinct project.
- Extract actual skills mentioned in the resume.
- Do not use a predefined skill list.
- Do not put education into experience.
- Do not put experience into education.
- Do not put projects into experience.
- Do not put experience into projects.
- Do not treat URLs as projects.
- Do not treat "Links", "GitHub", "Live", "Repository", or "Demo" as projects.
- Ignore GitHub, LinkedIn, portfolio and live-demo links.
- Do not treat contact information as skills.
- Do not treat section headings as skills.
- Handle different section names such as "Work History", "Employment", "Academic Background", "Academic Qualifications", and "Selected Projects".
- The extracted PDF text may come from a one-column or two-column resume and may have unusual ordering. Determine the category based on the meaning of the content, not simply its position.
- If information is missing, use an empty string.
- If a section does not exist, use an empty array.
- Do not omit an entry just because one field is missing.
- Remove obvious duplicate entries.
- Skills must be individual skills, not sentences.
- Project technologies should contain technologies explicitly associated with that project. If none are explicitly associated, use an empty array.
- Preserve the wording of descriptions as closely as possible.
- Do not create dates that are not present.

RESUME:

${resumeText}
`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        temperature: 0,
      },
    });

    const rawResponse = response?.text?.trim();

    console.log("GEMINI RAW RESUME RESPONSE:");
    console.log(rawResponse);

    if (!rawResponse) {
      console.error(
        "Gemini returned an empty response. Using empty resume data."
      );

      return emptyResumeData();
    }

    const cleanedResponse = rawResponse
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsedData;

    try {
      parsedData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error(
        "Gemini returned invalid JSON. Using empty resume data."
      );

      console.error(
        "Gemini response was:",
        cleanedResponse
      );

      return emptyResumeData();
    }

    return cleanResumeData(parsedData);
  } catch (error) {
    console.error(
      "Gemini resume parsing failed. Continuing without AI parsing:",
      error?.message || error
    );

    return emptyResumeData();
  }
};

module.exports = {
  parseResumeText,
};