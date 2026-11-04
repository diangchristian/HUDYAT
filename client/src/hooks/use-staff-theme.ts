import { useEffect } from "react";

/*
 * Switches the whole document to the staff (teacher/admin) theme
 * while the calling component is mounted. It's applied to <html>
 * rather than a wrapper so portaled popups (dialogs, selects,
 * sheets) are themed too. See `.theme-staff` and `.theme-admin` in
 * index.css.
 */
export function useStaffTheme(variant?: "admin") {
  useEffect(() => {
    const root = document.documentElement;
    const classes = variant === "admin" ? ["theme-staff", "theme-admin"] : ["theme-staff"];
    root.classList.add(...classes);
    return () => root.classList.remove(...classes);
  }, [variant]);
}
