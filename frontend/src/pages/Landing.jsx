import { Link } from "react-router-dom";
import "./Landing.css";

function Landing() {
  return (
    <div className="landing-page">
      <header className="landing-header">
        <div className="landing-brand">
          Careerly
        </div>

        <nav className="landing-nav">
          <Link to="/login" className="landing-login-link">
            Log in
          </Link>

          <Link
            to="/signup"
            className="landing-signup-button"
          >
            Get Started
          </Link>
        </nav>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-eyebrow">
            YOUR CAREER, ORGANIZED.
          </div>

          <h1>
            Find opportunities
            <br />
            <span>that fit you.</span>
          </h1>

          <p className="landing-description">
            Careerly brings job discovery, AI-powered
            recommendations, applications, and your resume
            into one focused workspace.
          </p>

          <div className="landing-actions">
            <Link
              to="/signup"
              className="landing-primary-button"
            >
              Start Your Career Journey
            </Link>

            <Link
              to="/login"
              className="landing-secondary-button"
            >
              I already have an account
            </Link>
          </div>
        </section>

        <section className="landing-features">
          <div className="landing-feature">
            <span className="landing-feature-number">
              01
            </span>

            <div>
              <h2>Discover</h2>
              <p>
                Search jobs and internships based on what
                you're actually looking for.
              </p>
            </div>
          </div>

          <div className="landing-feature">
            <span className="landing-feature-number">
              02
            </span>

            <div>
              <h2>Match</h2>
              <p>
                Get AI-powered recommendations tailored to
                your skills, experience, and preferences.
              </p>
            </div>
          </div>

          <div className="landing-feature">
            <span className="landing-feature-number">
              03
            </span>

            <div>
              <h2>Build</h2>
              <p>
                Create, tailor, and manage your resume while
                keeping track of every application.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <span>CAREERLY</span>
        <p>Your career, organized.</p>
      </footer>
    </div>
  );
}

export default Landing;