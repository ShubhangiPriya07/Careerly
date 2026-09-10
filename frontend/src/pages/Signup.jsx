import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";
import { signupUser } from "../services/auth";
import { syncUser } from "../services/api";
import { auth, googleProvider } from "../config/firebase";
import "./Signup.css";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await signupUser(name, email, password);
      await syncUser();

      navigate("/dashboard");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      await syncUser();

      navigate("/dashboard");
    } catch (error) {
      console.error("Google signup failed:", error);

      if (error.code === "auth/popup-closed-by-user") {
        setError("Google sign-in was cancelled.");
      } else if (
        error.code === "auth/account-exists-with-different-credential"
      ) {
        setError(
          "An account already exists with this email using a different sign-in method."
        );
      } else {
        setError(
          error.message ||
            "Google sign-in failed. Please try again."
        );
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const isLoading = loading || googleLoading;

  return (
    <div className="auth-page">
      <div className="auth-layout">
        <section className="auth-brand-panel">
          <Link to="/" className="auth-brand">
            Careerly
          </Link>

          <div className="auth-brand-content">
            <span className="auth-eyebrow">
              YOUR CAREER, ORGANIZED.
            </span>

            <h1>
              Start building
              <br />
              <span>what's next.</span>
            </h1>

            <p>
              Discover opportunities, get smarter job
              recommendations, manage your applications,
              and build a resume that represents you.
            </p>
          </div>

          <div className="auth-brand-footer">
            <span>CAREERLY</span>
            <small>
              Find. Match. Build. Track.
            </small>
          </div>
        </section>

        <main className="auth-form-panel">
          <div className="auth-form-container">
            <div className="auth-mobile-brand">
              <Link to="/" className="auth-brand">
                Careerly
              </Link>
            </div>

            <div className="auth-form-header">
              <span className="auth-form-eyebrow">
                GET STARTED
              </span>

              <h2>Create your account</h2>

              <p>
                Set up your Careerly workspace and start
                finding opportunities.
              </p>
            </div>

            <form
              className="auth-form"
              onSubmit={handleSignup}
            >
              <div className="auth-field">
                <label htmlFor="signup-name">
                  Name
                </label>

                <input
                  id="signup-name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="signup-email">
                  Email
                </label>

                <input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                />
              </div>

              <div className="auth-field">
                <label htmlFor="signup-password">
                  Password
                </label>

                <input
                  id="signup-password"
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                />
              </div>

              {error && (
                <div className="auth-error">
                  {error}
                </div>
              )}

              <button
                className="auth-submit-button"
                type="submit"
                disabled={isLoading}
              >
                {loading
                  ? "Creating account..."
                  : "Create Account"}
              </button>
            </form>

            <div className="auth-divider">
              <span>OR</span>
            </div>

            <button
              type="button"
              className="google-auth-button"
              onClick={handleGoogleSignup}
              disabled={isLoading}
            >
              <span className="google-icon">G</span>

              {googleLoading
                ? "Signing in with Google..."
                : "Continue with Google"}
            </button>

            <p className="auth-switch">
              Already have an account?{" "}
              <Link to="/login">
                Log in
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Signup;