# Careerly — AI-Powered Job & Internship Tracker

Careerly is a full-stack web application that helps students and job seekers discover relevant opportunities, evaluate their compatibility with job descriptions, tailor their resumes, and manage their applications in one place.

**Live Application:** [Careerly](https://careerly-sigma.vercel.app/)  
**Backend API:** [Careerly API](https://careerly-uzcu.onrender.com/)  
**Source Code:** [GitHub Repository](https://github.com/ShubhangiPriya07/Careerly)

---

## 1. Problem Statement

Finding suitable jobs and internships can be a time-consuming and fragmented process. Candidates often need to search across multiple platforms, compare job requirements with their skills, customize resumes for different positions, and manually track their applications.

These tasks make it difficult to identify the most relevant opportunities and maintain an organized application process.

Careerly addresses this problem by combining job discovery, AI-assisted job matching, resume assistance, and application tracking in a single platform.

## 2. Target Users

Careerly is designed for:

- College students looking for internships and entry-level opportunities.
- Recent graduates beginning their careers.
- Job seekers who want to identify opportunities relevant to their skills.
- Candidates who want to organize and track their applications.
- Users seeking AI-assisted resume improvement and job compatibility insights.

## 3. Solution

Careerly provides a centralized platform where users can discover opportunities, analyze their suitability for specific roles, save interesting jobs, and manage their application progress.

The application combines external job listings with AI-powered analysis and persistent user-specific data. Firebase Authentication provides user identity, while the backend handles application logic, database operations, and integrations with external services.

## 4. Key Features

### Authentication and User Profiles
- User authentication using Firebase Authentication.
- Google sign-in.
- Backend user synchronization after authentication.
- Protected, user-specific functionality.
- Profile management and job preferences.

### Job Discovery
- Search for job and internship opportunities.
- Retrieve external listings through the Adzuna API.
- View job details.
- Explore opportunities based on user interests and preferences.

### AI-Powered Job Matching
- Compare resume information with job requirements.
- Generate a job compatibility score.
- Identify matching and missing skills.
- Summarize strengths and potential skill gaps.
- Provide recommendations to help candidates assess opportunities.

### Personalized Job Recommendations
- Generate AI-assisted job recommendations.
- Use resume information and job preferences to identify relevant opportunities.
- Rank opportunities according to their relevance to the candidate.

### Resume Assistance
- Upload and manage resumes.
- Compare resume content with job descriptions.
- Generate AI-assisted resume tailoring suggestions for specific jobs.
- Save tailored resume content where supported by the application workflow.

### Saved Jobs
- Save interesting opportunities for later.
- View saved jobs.
- Check whether an opportunity has already been saved.
- Remove saved opportunities.

### Application Tracking
- Create application records for opportunities.
- Track application progress.
- Update application details and status.
- Delete application records when no longer needed.

### User Preferences
- Configure preferred roles, locations, work modes, employment types, and experience levels.
- Maintain profile preferences.
- Customize the application's theme.

---

## 5. Technology Stack

| Layer | Technologies | Purpose |
|---|---|---|
| Frontend | React, JavaScript, Vite | User interface and client-side application |
| Styling | CSS and project UI styling tools | Layout, visual design, and responsive interface |
| Routing | React Router | Client-side navigation |
| HTTP Communication | Axios | Communication between frontend and backend |
| Backend | Node.js, Express.js | REST API and application logic |
| Database | MongoDB Atlas, Mongoose | Persistent storage and data modeling |
| Authentication | Firebase Authentication | User sign-in and identity |
| Backend Authentication | Firebase Admin SDK | Verification of Firebase ID tokens |
| AI Integration | Google Gemini API | Job matching, recommendations, and resume assistance |
| Job Data | Adzuna API | External job listings |
| Frontend Deployment | Vercel | Hosting the React application |
| Backend Deployment | Render | Hosting the Express API |

---

## 6. Application Architecture

Careerly follows a client-server architecture. The React frontend communicates with the Express backend through HTTP requests, while the backend interacts with the database and external services.

```text
                    USER
                      |
                      v
             React + Vite Frontend
                 (Vercel)
                      |
               Axios HTTP Requests
                      |
                      v
             Node.js + Express API
                 (Render)
                      |
          +-----------+-----------+
          |           |           |
          v           v           v
      MongoDB      Firebase     External APIs
      Atlas        Admin SDK       |
          |           |        +---+------+
          |           |        |          |
          v           v        v          v
     Persistent   Token      Gemini    Adzuna
       Data     Verification   AI      Job Data
```

### Frontend
The frontend provides the user interface, navigation, authentication flows, job discovery experience, profile management, and application tracking screens.

Axios is used to communicate with the backend API. Firebase Authentication manages the sign-in process.

### Backend
The Express backend exposes REST API endpoints for users, jobs, saved jobs, applications, resumes, AI functionality, and recommendation feedback.

Authentication middleware verifies Firebase ID tokens before allowing access to protected endpoints.

### Database
MongoDB Atlas stores application data, including user profiles and other persistent records managed by the backend.

### External Integrations
- **Firebase:** User authentication and backend token verification.
- **Gemini:** AI-assisted job matching, recommendations, and resume-related functionality.
- **Adzuna:** External job and internship listings.

### Deployment
The frontend and backend are deployed independently. The frontend communicates with the deployed backend using the configured API base URL.

---

## 7. Project Structure

The project is organized into frontend and backend components.

```text
Careerly/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── config/
│   │   ├── services/
│   │   └── ...
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── config/
│   │   ├── db.js
│   │   └── firebaseAdmin.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── jobRoutes.js
│   │   ├── savedJobRoutes.js
│   │   ├── applicationRoutes.js
│   │   ├── resumeRoutes.js
│   │   ├── resumeUploadRoutes.js
│   │   ├── aiRoutes.js
│   │   └── recommendationFeedbackRoutes.js
│   ├── uploads/
│   ├── server.js
│   └── package.json
│
└── README.md
```

*Note: This is a high-level overview. Refer to the repository for the complete and current directory structure.*

---

## 8. Local Setup

Follow these instructions to run Careerly locally.

### Prerequisites

Install or configure the following:

- Node.js and npm.
- Git.
- A MongoDB Atlas database or another compatible MongoDB instance.
- A Firebase project with Authentication configured.
- An Adzuna API account and credentials.
- A Google Gemini API key.

### Step 1: Clone the Repository

```bash
git clone https://github.com/ShubhangiPriya07/Careerly.git
cd Careerly
```

### Step 2: Configure the Backend

Navigate to the backend directory:

```bash
cd backend
npm install
```

Create a `.env` file in the backend directory and configure the required environment variables described in the next section.

Ensure that your MongoDB connection is valid and Firebase Admin SDK credentials are configured correctly.

### Step 3: Start the Backend

Run:

```bash
npm start
```

The backend uses `process.env.PORT` when provided by the hosting platform and defaults to port `5000` for local development.

The local backend should be accessible at:

```text
http://localhost:5000
```

A health-check endpoint is available at:

```text
http://localhost:5000/api/health
```

### Step 4: Configure the Frontend

Open a second terminal and navigate to the frontend directory:

```bash
cd frontend
npm install
```

Create a frontend `.env` file containing the API base URL and the Firebase client configuration variables required by the application's Firebase configuration.

For local development, the API URL should point to the local backend:

```env
VITE_API_URL=http://localhost:5000/api
```

Use the exact Firebase environment variable names referenced in the frontend source code.

### Step 5: Start the Frontend

Run:

```bash
npm run dev
```

Vite will display the local development URL in the terminal, usually:

```text
http://localhost:5173
```

Open that address in your browser.

### Step 6: Verify the Application

1. Confirm that the backend starts and connects to MongoDB.
2. Confirm that the frontend loads.
3. Sign in through Firebase Authentication.
4. Verify that the user profile synchronizes with the backend.
5. Test job search and other features that depend on external APIs.
6. Verify that AI functionality works with valid Gemini credentials.

Some features require valid third-party credentials and internet access.

---

## 9. Environment Variables

Careerly uses environment variables to configure its frontend, backend, and external integrations.

**Never commit API keys, private keys, passwords, database credentials, or other secrets to GitHub.**

### Backend Environment Variables

Configure the following in `backend/.env` for local development, or in the backend deployment's environment settings.

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `FIREBASE_PROJECT_ID` | Firebase project identifier |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin service account email |
| `FIREBASE_PRIVATE_KEY_BASE64` | Base64-encoded Firebase private key, as expected by the backend configuration |
| `ADZUNA_APP_ID` | Adzuna application ID |
| `ADZUNA_APP_KEY` | Adzuna API key |
| `GEMINI_API_KEY` | Google Gemini API key |
| `FRONTEND_URL` | Frontend origin allowed by the backend's CORS configuration, if configured |
| `PORT` | Port used by the backend; hosting platforms may provide this automatically |

Example configuration with placeholder values:

```env
MONGODB_URI=your_mongodb_connection_string

FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_CLIENT_EMAIL=your_service_account_email
FIREBASE_PRIVATE_KEY_BASE64=your_base64_encoded_private_key

ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_APP_KEY=your_adzuna_app_key

GEMINI_API_KEY=your_gemini_api_key

FRONTEND_URL=http://localhost:5173
```

Replace the placeholders with your own credentials. Do not use these placeholder values as actual credentials.

The private key must be encoded in the format expected by the project's Firebase Admin configuration.

### Frontend Environment Variables

The frontend requires the following:

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | Base URL of the backend API |
| Firebase client configuration variables | Values required by the Firebase client initialization in the frontend |

For local development:

```env
VITE_API_URL=http://localhost:5000/api
```

For the deployed frontend, configure:

```env
VITE_API_URL=https://careerly-uzcu.onrender.com/api
```

Use the Firebase client variable names already defined in the frontend source code.

**Security note:** Vite exposes variables prefixed with `VITE_` to client-side code. Only put values there that are intended to be available to the browser. Never put Gemini keys, Adzuna secret keys, MongoDB credentials, or Firebase Admin private keys in frontend environment variables.

---

## 10. Deployment

Careerly is deployed as two independent services.

### Frontend — Vercel

The React frontend is hosted on Vercel.

**Live application:**  
https://careerly-sigma.vercel.app/

The frontend's `VITE_API_URL` must point to the deployed backend API. After changing frontend environment variables, create a new deployment for the changes to take effect.

### Backend — Render

The Node.js and Express backend is hosted on Render.

**Backend URL:**  
https://careerly-uzcu.onrender.com/

**Health check:**  
https://careerly-uzcu.onrender.com/api/health

The backend deployment requires the environment variables documented above. Its CORS configuration must allow requests from the deployed frontend origin.

### Database — MongoDB Atlas

MongoDB Atlas provides persistent database storage. The backend requires a valid MongoDB connection string and appropriate database access permissions.

### Authentication — Firebase

Firebase Authentication handles user sign-in. The deployed frontend domain must be authorized in the Firebase Authentication settings.

---

## 11. Error Handling and Security

Careerly uses authentication middleware to protect backend routes and validates Firebase identity tokens before handling authenticated requests.

Configuration and security practices include:

- Keeping backend secrets in environment variables.
- Verifying authentication tokens on protected endpoints.
- Restricting cross-origin requests through CORS configuration.
- Separating frontend and backend deployments.
- Keeping database and external API credentials out of client-side code.

External services may occasionally experience rate limits, timeouts, or temporary failures. Features that depend on these services require valid credentials and appropriate availability from the external providers.

---

## 12. Future Improvements

Potential improvements include:

- More granular job recommendation filters.
- Improved caching and reduction of redundant AI API calls.
- More detailed application analytics and progress insights.
- Enhanced resume parsing and tailoring workflows.
- More robust handling of external API failures and rate limits.
- Additional automated tests for API endpoints and user workflows.

---

## 13. Conclusion

Careerly brings job discovery, AI-assisted career support, resume management, and application tracking into one full-stack application.

The project combines a React frontend, an Express backend, persistent database storage, Firebase authentication, and integrations with external job and AI services to provide a practical tool for students and job seekers.

**Explore the live application:** [Careerly](https://careerly-sigma.vercel.app/)

**View the source code:** [GitHub Repository](https://github.com/ShubhangiPriya07/Careerly)
