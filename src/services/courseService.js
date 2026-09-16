import { GITHUB_CONFIG } from '../config';

export async function fetchCoursesFromGithub() {
  try {
    const response = await fetch(`${GITHUB_CONFIG.rawCoursesUrl}?t=${Date.now()}`);
    if (!response.ok) {
      throw new Error(`Erreur HTTP : ${response.status}`);
    }
    const courses = await response.json();
    localStorage.setItem('revisio_courses', JSON.stringify(courses));
    return courses;
  } catch (error) {
    console.warn('Erreur lors du fetch de courses.json sur GitHub. Repli sur le cache local :', error);
    const cached = localStorage.getItem('revisio_courses');
    return cached ? JSON.parse(cached) : [];
  }
}