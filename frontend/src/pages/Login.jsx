import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signInWithPopup } from "firebase/auth";

import { loginUser } from "../services/auth";
import { syncUser } from "../services/api";
import { auth, googleProvider } from "../config/firebase";

import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (event) => {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      await loginUser(email, password);
      await syncUser();

      navigate("/dashboard");
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setGoogleLoading(true);

    try {
      await signInWithPopup(auth, googleProvider);
      await syncUser();

      navigate("/dashboard");
    } catch (error) {
      console.error("Google login failed:", error);

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
          error.message || "Google sign-in failed. Please try again."
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
              Welcome
              <br />
              <span>back.</span>
            </h1>

            <p>
              Pick up where you left off and keep moving
              toward your next opportunity.
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
                ACCOUNT
              </span>

              <h2>Log in</h2>

              <p>
                Sign in to continue to your Careerly
                workspace.
              </p>
            </div>

            <form
              className="auth-form"
              onSubmit={handleLogin}
            >
              <div className="auth-field">
                <label htmlFor="login-email">
                  Email
                </label>

                <input
                  id="login-email"
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
                <label htmlFor="login-password">
                  Password
                </label>

                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
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
                  ? "Logging in..."
                  : "Log In"}
              </button>
            </form>
            <div className="auth-divider">
              <span>OR</span>
            </div>

            <button
              type="button"
              className="google-auth-button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
            >
              <span className="google-icon">
                G
              </span>

              {googleLoading
                ? "Signing in with Google..."
                : "Continue with Google"}
            </button>

            <p className="auth-switch">
              Don't have an account?{" "}
              <Link to="/signup">
                Create one
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Login;