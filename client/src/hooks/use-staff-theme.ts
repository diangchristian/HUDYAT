import { useEffect } from "react";

/*
 * Switches the whole document to the staff (teacher/admin) theme
 * while the calling component is mounted. It's applied to <html>
 * rather than a wrapper so portaled popups (dialogs, selects,
 * sheets) are themed too. See `.theme-staff` in index.css.
 */
export function useStaffTheme() {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("theme-staff");
    return () => root.classList.remove("theme-staff");
  }, []);
}
