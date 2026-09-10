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

          // If the user's theme cannot be loaded,
          // safely fall back to light mode.
          setTheme("light");
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    document.body.classList.remove(
      "light-theme",
      "dark-theme"
    );

    document.body.classList.add(
      theme === "dark"
        ? "dark-theme"
        : "light-theme"
    );
  }, [theme]);

  const toggleTheme = async () => {
    const newTheme =
      theme === "dark"
        ? "light"
        : "dark";

    const previousTheme = theme;

    try {
      // Update the UI immediately.
      setTheme(newTheme);

      // Save the selected theme to MongoDB.
      await updateTheme(newTheme);
    } catch (error) {
      console.error(
        "Failed to save theme:",
        error
      );

      // Restore the previous theme if saving fails.
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