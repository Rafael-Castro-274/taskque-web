import { useState, useEffect, useCallback, useRef } from "react";

type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("taskque-theme") as Theme;
    return saved || "dark";
  });
  const toggleRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("taskque-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback((e?: React.MouseEvent<HTMLButtonElement>) => {
    const newTheme = theme === "dark" ? "light" : "dark";

    // Check if View Transition API is available
    if (!document.startViewTransition) {
      setTheme(newTheme);
      return;
    }

    // Get click position for the circular reveal
    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;

    if (e) {
      const rect = e.currentTarget.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }

    // Calculate the max radius to cover the entire screen
    const maxRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      setTheme(newTheme);
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 600,
          easing: "cubic-bezier(0.4, 0, 0.2, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  }, [theme]);

  return { theme, toggleTheme, toggleRef };
}
