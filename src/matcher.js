// Curated illustrative data for the student project. Not live vacancies.
const JOBS = [
  { id: "job-1", title: "Frontend Developer", company: "Northstar Digital", location: "Delhi", workMode: "Hybrid", experience: "Fresher", salary: "₹4–8 LPA", minYears: 0, skills: ["JavaScript", "HTML", "CSS", "React", "Git"], description: "Build accessible, responsive interfaces and reusable UI components.", learning: ["TypeScript", "Testing Library", "Accessibility"] },
  { id: "job-2", title: "Full Stack Developer", company: "PixelForge Labs", location: "Noida", workMode: "Hybrid", experience: "0–2 years", salary: "₹5–10 LPA", minYears: 0, skills: ["JavaScript", "Node.js", "Express", "MongoDB", "React", "Git"], description: "Develop end-to-end features across a JavaScript web stack.", learning: ["REST API design", "Authentication", "Docker"] },
  { id: "job-3", title: "Backend Developer", company: "CloudBridge Systems", location: "Bengaluru", workMode: "Remote", experience: "0–2 years", salary: "₹6–12 LPA", minYears: 0, skills: ["Node.js", "Express", "SQL", "Git", "REST APIs"], description: "Create maintainable APIs, data models and backend services.", learning: ["Redis", "API security", "Docker"] },
  { id: "job-4", title: "Data Analyst", company: "MetricMint", location: "Delhi", workMode: "On-site", experience: "Fresher", salary: "₹3.5–7 LPA", minYears: 0, skills: ["SQL", "Python", "Excel", "Power BI", "Statistics"], description: "Turn business data into clear insights, dashboards and reports.", learning: ["Power BI", "Statistics", "Data storytelling"] },
  { id: "job-5", title: "Python Developer", company: "ByteHarbor", location: "Pune", workMode: "Hybrid", experience: "0–2 years", salary: "₹4–9 LPA", minYears: 0, skills: ["Python", "SQL", "Git", "REST APIs", "Django"], description: "Build Python services and integrate them with databases and APIs.", learning: ["Django REST Framework", "Pytest", "Docker"] },
  { id: "job-6", title: "C++ Software Engineer", company: "Vertex Embedded", location: "Noida", workMode: "On-site", experience: "Fresher", salary: "₹4–8 LPA", minYears: 0, skills: ["C++", "Data Structures", "Algorithms", "OOP", "Git"], description: "Write efficient C++ code and solve implementation and debugging tasks.", learning: ["Modern C++", "STL", "Operating Systems"] },
  { id: "job-7", title: "QA Automation Engineer", company: "QualityNest", location: "Hyderabad", workMode: "Remote", experience: "0–2 years", salary: "₹4–8 LPA", minYears: 0, skills: ["JavaScript", "Python", "Git", "Testing", "SQL"], description: "Design repeatable tests that improve software quality and release confidence.", learning: ["Playwright", "CI/CD", "API testing"] },
  { id: "job-8", title: "UI/UX Designer", company: "Mosaic Product Co.", location: "Mumbai", workMode: "Hybrid", experience: "Fresher", salary: "₹3–7 LPA", minYears: 0, skills: ["Figma", "Wireframing", "Prototyping", "User Research", "Design Systems"], description: "Translate user needs into usable flows, prototypes and interface systems.", learning: ["Usability testing", "Accessibility", "Design tokens"] },
  { id: "job-9", title: "Cloud Support Associate", company: "OrbitStack", location: "Bengaluru", workMode: "Remote", experience: "0–2 years", salary: "₹4–9 LPA", minYears: 0, skills: ["Linux", "Networking", "AWS", "Python", "Troubleshooting"], description: "Help maintain cloud services and diagnose infrastructure issues.", learning: ["AWS fundamentals", "Docker", "Monitoring"] },
  { id: "job-10", title: "Data Science Intern", company: "SignalSpring", location: "Delhi", workMode: "Hybrid", experience: "Fresher", salary: "₹20k–40k/month", minYears: 0, skills: ["Python", "Pandas", "Statistics", "SQL", "Machine Learning"], description: "Explore datasets and build baseline models under mentor guidance.", learning: ["Model evaluation", "Feature engineering", "Data visualization"] }
];

const normalize = value => String(value).toLowerCase().trim().replace(/[^a-z0-9+#. ]/g, "");
const aliasMap = {
  js: "javascript", "node": "node.js", "nodejs": "node.js", "reactjs": "react",
  "c plus plus": "c++", "dsa": "data structures", "ds": "data structures",
  "mongo": "mongodb", "powerbi": "power bi", "rest": "rest apis",
  "ui ux": "ui/ux", "machinelearning": "machine learning"
};
function canonical(value) {
  const n = normalize(value);
  return aliasMap[n] || n;
}
function overlap(a, b) {
  const aa = canonical(a), bb = canonical(b);
  return aa === bb || (aa.length > 2 && bb.length > 2 && (aa.includes(bb) || bb.includes(aa)));
}
function locationScore(preferred, job) {
  const p = normalize(preferred);
  if (p === "remote") return job.workMode === "Remote" ? 100 : 60;
  if (job.workMode === "Remote") return 88;
  return normalize(job.location).includes(p) || p.includes(normalize(job.location)) ? 100 : 42;
}
function experienceScore(experience, job) {
  const mapping = { "Fresher": 0, "0–2 years": 1, "3–5 years": 3, "5+ years": 5 };
  const userYears = mapping[experience] ?? 0;
  const difference = Math.abs(userYears - job.minYears);
  return Math.max(45, 100 - difference * 12);
}
function predictJobs({ skills, location, experience, workMode }) {
  const userSkills = [...new Set(skills.map(canonical))];
  const results = JOBS.map(job => {
    const matchedSkills = job.skills.filter(required => userSkills.some(user => overlap(user, required)));
    const missingSkills = job.skills.filter(required => !userSkills.some(user => overlap(user, required)));
    const skillMatch = Math.round((matchedSkills.length / job.skills.length) * 100);
    const locMatch = locationScore(location, job);
    const expMatch = experienceScore(experience, job);
    const modeMatch = workMode === "Any" || workMode === job.workMode ? 100 : (job.workMode === "Remote" ? 75 : 55);
    const score = Math.round(skillMatch * 0.65 + locMatch * 0.20 + expMatch * 0.10 + modeMatch * 0.05);
    return {
      ...job,
      score,
      breakdown: { skills: skillMatch, location: locMatch, experience: expMatch, workMode: modeMatch },
      matchedSkills,
      missingSkills,
      rationale: `${matchedSkills.length} of ${job.skills.length} listed skills matched; location and work preference also contribute.`
    };
  }).sort((a, b) => b.score - a.score || b.breakdown.skills - a.breakdown.skills);
  return { jobs: results.slice(0, 8), totalEvaluated: JOBS.length, method: "weighted rule-based matching" };
}
module.exports = { JOBS, predictJobs };
