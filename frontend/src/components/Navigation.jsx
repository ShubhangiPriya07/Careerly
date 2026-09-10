import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./Navigation.css";

const navItems = [
  {
    to: "/dashboard",
    label: "Dashboard",
    icon: "⌂",
  },
  {
    to: "/jobs",
    label: "Find Jobs",
    icon: "⌕",
  },
  {
    to: "/saved-jobs",
    label: "Saved Jobs",
    icon: "☆",
  },
  {
    to: "/applications",
    label: "Applications",
    icon: "✓",
  },
  {
    to: "/resume",
    label: "Resume",
    icon: "▤",
  },
  {
    to: "/profile",
    label: "Profile",
    icon: "◯",
  },
];

function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      <button
        className="navigation-menu-button"
        onClick={() => setIsOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={isOpen}
      >
        <span />
        <span />
        <span />
      </button>

      {isOpen && (
        <div
          className="navigation-overlay"
          onClick={closeMenu}
          aria-hidden="true"
        />
      )}

      <aside
        className={`navigation-sidebar ${
          isOpen ? "open" : ""
        }`}
        aria-label="Main navigation"
      >
        <div className="navigation-header">
          <div>
            <div className="navigation-brand">
              Careerly
            </div>

            <p className="navigation-tagline">
              Your career, organized.
            </p>
          </div>

          <button
            className="navigation-close-button"
            onClick={closeMenu}
            aria-label="Close navigation menu"
          >
            ×
          </button>
        </div>

        <nav className="navigation-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeMenu}
              className={({ isActive }) =>
                `navigation-link ${
                  isActive ? "active" : ""
                }`
              }
            >
              <span className="navigation-icon">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="navigation-footer">
          <span>CAREERLY</span>
          <small>Career management workspace</small>
        </div>
      </aside>
    </>
  );
}

export default Navigation;