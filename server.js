const express = require("express");
const path = require("path");
const { predictJobs, JOBS } = require("./src/matcher");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "32kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "JobPilot AI", version: "1.0.0" });
});

app.get("/api/jobs", (req, res) => {
  const q = String(req.query.q || "").trim().toLowerCase();
  const location = String(req.query.location || "").trim().toLowerCase();
  const jobs = JOBS.filter(job => {
    const textMatch = !q || [job.title, job.company, ...job.skills].join(" ").toLowerCase().includes(q);
    const locationMatch = !location || job.location.toLowerCase().includes(location) || job.workMode === "Remote";
    return textMatch && locationMatch;
  });
  res.json({ jobs, source: "curated demo dataset", total: jobs.length });
});

app.post("/api/predict", (req, res) => {
  const skills = req.body?.skills;
  const location = req.body?.location;
  const experience = req.body?.experience;
  const workMode = req.body?.workMode || "Any";

  if (!Array.isArray(skills) || skills.length === 0) {
    return res.status(400).json({ error: "Add at least one skill to get recommendations." });
  }
  if (skills.length > 30 || skills.some(s => typeof s !== "string" || s.trim().length > 40)) {
    return res.status(400).json({ error: "Please enter up to 30 valid skills (40 characters each)." });
  }
  if (typeof location !== "string" || !location.trim() || location.trim().length > 80) {
    return res.status(400).json({ error: "Enter a preferred city or choose Remote." });
  }
  if (!["Fresher", "0–2 years", "3–5 years", "5+ years"].includes(experience)) {
    return res.status(400).json({ error: "Choose a valid experience level." });
  }
  if (!["Any", "On-site", "Hybrid", "Remote"].includes(workMode)) {
    return res.status(400).json({ error: "Choose a valid work preference." });
  }

  const cleanSkills = [...new Set(skills.map(s => s.trim()).filter(Boolean))];
  if (!cleanSkills.length) return res.status(400).json({ error: "Enter at least one non-empty skill." });

  const result = predictJobs({ skills: cleanSkills, location: location.trim(), experience, workMode });
  res.json({ ...result, note: "Scores are estimates from the demo dataset and matching rules, not hiring probabilities." });
});

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

app.listen(PORT, () => console.log(`JobPilot AI running at http://localhost:${PORT}`));
