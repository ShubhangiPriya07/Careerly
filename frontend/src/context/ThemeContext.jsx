import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
} from "firebase/auth";

import { auth } from "../config/firebase";

import {
  getCurrentUser,
  updateTheme,
} from "../services/api";

const ThemeContext = createContext(null);

const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
];

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        // Always use light mode when logged out.
        if (!firebaseUser) {
          setTheme("light");
          setLoading(false);
          return;
        }

        try {
          const data = await getCurrentUser();

          const savedTheme =
            data.user?.preferences?.theme === "dark"
              ? "dark"
              : "light";

          setTheme(savedTheme);
        } catch (error) {
          console.error(
            "Failed to load theme:",
            error
          );

          setTheme("light");
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const currentPath = window.location.pathname;

    const isPublicRoute =
      PUBLIC_ROUTES.includes(currentPath);

    document.body.classList.remove(
      "light-theme",
      "dark-theme"
    );

    // Landing, Login and Signup always stay
    // in Careerly's original light design.
    if (isPublicRoute) {
      document.body.classList.add(
        "light-theme"
      );
      return;
    }

    // All authenticated application pages
    // respect the user's saved theme.
    document.body.classList.add(
      theme === "dark"
        ? "dark-theme"
        : "light-theme"
    );
  }, [theme]);

  useEffect(() => {
    const handleRouteChange = () => {
      const currentPath =
        window.location.pathname;

      const isPublicRoute =
        PUBLIC_ROUTES.includes(currentPath);

      document.body.classList.remove(
        "light-theme",
        "dark-theme"
      );

      if (isPublicRoute) {
        document.body.classList.add(
          "light-theme"
        );
      } else {
        document.body.classList.add(
          theme === "dark"
            ? "dark-theme"
            : "light-theme"
        );
      }
    };

    window.addEventListener(
      "popstate",
      handleRouteChange
    );

    return () => {
      window.removeEventListener(
        "popstate",
        handleRouteChange
      );
    };
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme =
      theme === "dark"
        ? "light"
        : "dark";

    const previousTheme = theme;

    try {
      setTheme(newTheme);

      await updateTheme(newTheme);
    } catch (error) {
      console.error(
        "Failed to save theme:",
        error
      );

      setTheme(previousTheme);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        darkMode: theme === "dark",
        toggleTheme,
        loading,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used inside ThemeProvider"
    );
  }

  return context;
}