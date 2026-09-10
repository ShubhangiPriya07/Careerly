import { Link } from "react-router-dom";
import "./NotFound.css";

function NotFound() {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-brand">
          Careerly
        </div>

        <div className="not-found-number">
          404
        </div>

        <span className="not-found-eyebrow">
          PAGE NOT FOUND
        </span>

        <h1>
          Looks like you took
          <br />
          <span>a wrong turn.</span>
        </h1>

        <p>
          The page you're looking for doesn't exist or may
          have been moved. Let's get you back to your
          career workspace.
        </p>

        <div className="not-found-actions">
          <Link
            to="/dashboard"
            className="not-found-primary"
          >
            Back to Dashboard
          </Link>

          <Link
            to="/"
            className="not-found-secondary"
          >
            Careerly Home
          </Link>
        </div>
      </div>

      <footer className="not-found-footer">
        <span>CAREERLY</span>
        <small>Your career, organized.</small>
      </footer>
    </div>
  );
}

export default NotFound;