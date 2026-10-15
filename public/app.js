(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const STORAGE = { skills: "jobpilot.skills.v1", saved: "jobpilot.saved.v1", last: "jobpilot.last.v1", profile: "jobpilot.studentProfile.v1" };
  const DEFAULT_SKILLS = ["JavaScript", "React", "Node.js", "SQL", "Git"];
  const state = { skills: load(STORAGE.skills, []), saved: load(STORAGE.saved, []), jobs: [], matched: false, lastInput: load(STORAGE.last, null), profile: load(STORAGE.profile, {}), currentView: "home", visibleCount: 5 };
  const roleRoadmaps = {
    "Frontend Developer": ["HTML, CSS and responsive layouts", "JavaScript fundamentals and browser APIs", "React components, state and routing", "Accessibility, testing and a deployed portfolio"],
    "Full Stack Developer": ["JavaScript and Git foundations", "Build REST APIs with Node.js and Express", "Database basics with SQL or MongoDB", "Authentication, validation and deployment"],
    "Backend Developer": ["HTTP, REST and API fundamentals", "Node.js/Express or a backend framework", "SQL, data modelling and indexes", "Testing, security basics and deployment"],
    "Data Analyst": ["Spreadsheet formulas and clean datasets", "SQL queries, joins and aggregations", "Statistics and exploratory data analysis", "Dashboard storytelling with Power BI or Tableau"],
    "Python Developer": ["Python syntax, modules and virtual environments", "Data structures, exceptions and testing", "REST APIs and a framework", "SQL, Git and deployment"],
    "C++ Software Engineer": ["C++ fundamentals and object-oriented programming", "STL containers, algorithms and complexity", "Data structures and problem solving", "Debugging, memory basics and projects"],
    "QA Automation Engineer": ["Testing principles and clear test cases", "JavaScript or Python test automation", "Browser automation with Playwright", "API testing and continuous integration"],
    "UI/UX Designer": ["User interviews and problem framing", "Information architecture and wireframes", "Interactive prototypes and design systems", "Usability testing and case-study portfolio"],
    "Cloud Support Associate": ["Linux command line and networking basics", "Cloud fundamentals and IAM concepts", "Logs, monitoring and troubleshooting", "Small deployment project and documentation"],
    "Data Science Intern": ["Python, Pandas and data cleaning", "Probability, statistics and visualisation", "Baseline machine-learning models", "Model evaluation and a reproducible project"]
  };
  const learningNotes = [
    "Study the concept, then implement a tiny example.",
    "Practise with a small project and write down what you learned.",
    "Add a working example to your portfolio and explain your decisions.",
    "Review the skill against actual job descriptions before applying."
  ];

  function load(key, fallback) { try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; } }
  function persist() {
    try {
      localStorage.setItem(STORAGE.skills, JSON.stringify(state.skills));
      localStorage.setItem(STORAGE.saved, JSON.stringify(state.saved));
      localStorage.setItem(STORAGE.last, JSON.stringify(state.lastInput));
      localStorage.setItem(STORAGE.profile, JSON.stringify(state.profile));
    } catch { toast("Browser storage is unavailable; changes may not persist.", "error"); }
  }
  function esc(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
  function toast(message, type = "") {
    const node = document.createElement("div"); node.className = `toast ${type}`; node.textContent = message;
    $("#toastRegion").append(node); window.setTimeout(() => node.remove(), 3500);
  }
  function canonicalSkill(s) {
    const value = s.trim().replace(/\s+/g, " ");
    const known = { js:"JavaScript", javascript:"JavaScript", node:"Node.js", nodejs:"Node.js", reactjs:"React", mongo:"MongoDB", mongodb:"MongoDB", dsa:"Data Structures", "c plus plus":"C++", cpp:"C++", html5:"HTML", css3:"CSS", "powerbi":"Power BI", rest:"REST APIs", "machinelearning":"Machine Learning" };
    return known[value.toLowerCase()] || value;
  }
  function addSkills(raw) {
    const items = raw.split(/[,;\n]/).map(s => canonicalSkill(s)).filter(Boolean);
    let added = 0;
    for (const skill of items) {
      if (skill.length > 40) { toast(`"${skill.slice(0, 18)}…" is too long (40 characters max).`, "error"); continue; }
      if (!state.skills.some(s => s.toLowerCase() === skill.toLowerCase())) {
        if (state.skills.length >= 30) { toast("You can add up to 30 skills.", "error"); break; }
        state.skills.push(skill); added++;
      }
    }
    if (added) { persist(); renderSkills(); toast(`${added} skill${added > 1 ? "s" : ""} added.`, "success"); }
  }
  function removeSkill(skill) { state.skills = state.skills.filter(s => s !== skill); persist(); renderSkills(); }
  function chip(skill, removable = true) {
    return `<span class="skill-chip">${esc(skill)}${removable ? `<button type="button" data-remove-skill="${esc(skill)}" aria-label="Remove ${esc(skill)}">×</button>` : ""}</span>`;
  }
  function renderStudentProfile() {
    const profile = state.profile || {};
    const fullName = (profile.name || "").trim();
    $("#profileDisplayName").textContent = fullName || "Your name";
    const headline = [profile.degree, profile.college].filter(Boolean).join(" · ");
    $("#profileHeadline").textContent = headline || "Student / early-career candidate";
    const initials = fullName.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0].toUpperCase()).join("");
    $("#profileAvatar").textContent = initials || "ST";
    const fields = { name: "studentName", email: "studentEmail", college: "studentCollege", degree: "studentDegree", year: "studentYear", location: "studentLocation", linkedin: "studentLinkedIn", portfolio: "studentPortfolio", bio: "studentBio" };
    for (const [key, id] of Object.entries(fields)) {
      const input = $("#" + id);
      if (input && document.activeElement !== input) input.value = profile[key] || "";
    }
  }
  function saveStudentProfile(event) {
    event.preventDefault();
    const fields = { name: "studentName", email: "studentEmail", college: "studentCollege", degree: "studentDegree", year: "studentYear", location: "studentLocation", linkedin: "studentLinkedIn", portfolio: "studentPortfolio", bio: "studentBio" };
    const next = {};
    for (const [key, id] of Object.entries(fields)) next[key] = $("#" + id).value.trim();
    for (const key of ["linkedin", "portfolio"]) {
      if (next[key] && !/^https?:\/\//i.test(next[key])) {
        toast("Please enter a complete link beginning with https://", "error");
        $("#" + fields[key]).focus();
        return;
      }
    }
    state.profile = next;
    persist();
    renderStudentProfile();
    toast("Student profile saved on this device.", "success");
  }

  function renderSkills() {
    $("#inputSkillChips").innerHTML = state.skills.map(s => chip(s)).join("");
    $("#sideSkills").innerHTML = state.skills.length ? state.skills.map(s => chip(s, false)).join("") : '<span class="empty-chip">Add skills to get started</span>';
    $("#profileSkillChips").innerHTML = state.skills.length ? state.skills.map(s => chip(s)).join("") : '<span class="empty-chip">No skills added yet</span>';
    $("#profileSkillCount").textContent = state.skills.length;
    renderSavedCount();
  }
  function renderSavedCount() {
    $("#savedCount").textContent = state.saved.length;
    $("#profileSavedCount").textContent = state.saved.length;
  }
  function getJob(id) { return state.jobs.find(j => j.id === id) || state.saved.find(j => j.id === id); }
  function card(job, index, showScore = true) {
    const saved = state.saved.some(j => j.id === job.id);
    const score = Number.isFinite(job.score) ? job.score : null;
    const markClass = ["", "cyan-mark", "violet-mark"][index % 3];
    const scoreMarkup = showScore && score !== null
      ? `<div class="score-ring" style="--score:${score * 3.6}deg"><strong>${score}%</strong><small>match</small></div>`
      : `<div class="score-ring no-score"><strong>—</strong><small>score</small></div>`;
    return `<article class="job-card ${index === 0 && score !== null ? "top-match" : ""}">
      <div class="company-mark ${markClass}" aria-hidden="true">${esc((job.company || job.title).charAt(0).toUpperCase())}</div>
      <div class="job-info"><div class="job-title-row"><h3 class="job-title">${esc(job.title)}</h3>${score !== null && score >= 80 ? '<span class="match-badge">✦ Strong match</span>' : ""}</div>
        <div class="company-name">${esc(job.company)}</div>
        <div class="job-meta"><span>⌖ ${esc(job.location)} · ${esc(job.workMode)}</span><span>▣ ${esc(job.salary)}</span><span>◷ ${esc(job.experience)}</span></div>
        <div class="job-skill-list">${job.skills.slice(0, 5).map(skill => `<span class="${job.missingSkills?.includes(skill) ? "gap-skill" : ""}">${esc(skill)}</span>`).join("")}</div>
      </div>
      <div class="job-side">${scoreMarkup}<div class="job-actions"><button class="details-button" data-details="${esc(job.id)}">View details</button><button class="bookmark-button ${saved ? "saved" : ""}" data-save="${esc(job.id)}" aria-label="${saved ? "Remove saved job" : "Save job"}" title="${saved ? "Remove saved job" : "Save job"}">${saved ? "♥" : "♡"}</button></div></div>
    </article>`;
  }
  function renderJobs() {
    const list = $("#jobList");
    const jobs = sortedJobs(state.jobs);
    const shown = jobs.slice(0, state.visibleCount);
    list.innerHTML = shown.map(card).join("");
    $("#loadMoreButton").hidden = jobs.length <= state.visibleCount;
    if (!jobs.length) {
      list.innerHTML = '<div class="empty-state"><div>⌕</div><h2>No recommendations yet</h2><p>Add at least one skill and choose a location to generate your first matches.</p></div>';
    }
  }
  function sortedJobs(jobs) {
    const sort = $("#sortSelect")?.value || "match";
    return [...jobs].sort((a,b) => sort === "match" ? (b.score ?? 0) - (a.score ?? 0) : sort === "salary" ? a.title.localeCompare(b.title) : a.location.localeCompare(b.location));
  }
  function updateScores(top) {
    if (!top) {
      $("#overallDonut").style.setProperty("--progress", "0deg"); $("#overallScore").textContent = "—";
      $("#skillScore").textContent = "—"; $("#locationScore").textContent = "—"; $("#experienceScore").textContent = "—";
      return;
    }
    $("#overallDonut").style.setProperty("--progress", `${top.score * 3.6}deg`);
    $("#overallScore").textContent = `${top.score}%`;
    $("#skillScore").textContent = `${top.breakdown.skills}%`;
    $("#locationScore").textContent = `${top.breakdown.location}%`;
    $("#experienceScore").textContent = `${top.breakdown.experience}%`;
  }
  function renderMissingSkills() {
    const counts = new Map();
    state.jobs.slice(0, 5).forEach(job => (job.missingSkills || []).forEach(s => counts.set(s, (counts.get(s) || 0) + 1)));
    const suggestions = [...counts.entries()].sort((a,b) => b[1]-a[1] || a[0].localeCompare(b[0])).slice(0, 5).map(([s]) => s);
    $("#missingSkills").innerHTML = suggestions.length ? suggestions.map(s => `<button class="skill-chip" type="button" data-add-suggestion="${esc(s)}">+ ${esc(s)}</button>`).join("") : '<span class="empty-chip">Run a match to see suggestions</span>';
  }
  function setError(message) { const el = $("#formError"); el.textContent = message; el.hidden = !message; }
  async function submitMatch(event) {
    event?.preventDefault();
    const location = $("#locationInput").value.trim();
    if (!state.skills.length) { setError("Add at least one skill. Example: JavaScript, SQL, or C++."); $("#skillsInput").focus(); return; }
    if (!location) { setError("Enter a preferred city or choose Remote."); $("#locationInput").focus(); return; }
    if (location.length > 80) { setError("Location must be 80 characters or fewer."); return; }
    setError("");
    const button = $("#matchButton"); button.disabled = true; button.innerHTML = '<span>◌</span> Finding your matches…';
    try {
      const response = await fetch("/api/predict", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ skills: state.skills, location, experience: $("#experienceInput").value, workMode: $("#workModeInput").value }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not calculate matches.");
      state.jobs = data.jobs; state.matched = true; state.visibleCount = 5;
      state.lastInput = { skills: [...state.skills], location, experience: $("#experienceInput").value, workMode: $("#workModeInput").value };
      persist(); renderJobs(); renderMissingSkills(); updateScores(state.jobs[0]);
      $("#jobsTitle").textContent = "Your job matches";
      $("#jobsSubtitle").textContent = `${data.totalEvaluated} sample roles evaluated · ${data.method}`;
      $("#resultNotice").innerHTML = `<span class="notice-icon">✦</span><span>${data.jobs.length} recommendations ranked by a transparent weighted score. These are illustrative demo roles, not live vacancies.</span>`;
      toast("Your personalized matches are ready.", "success");
      $("#recommendations").scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) { setError(error.message || "Network error. Check that the server is running."); }
    finally { button.disabled = false; button.innerHTML = '<span>⌕</span> Find my job matches <b>→</b>'; }
  }
  function toggleSaved(id) {
    const existing = state.saved.findIndex(j => j.id === id);
    if (existing >= 0) { state.saved.splice(existing, 1); toast("Removed from saved jobs."); }
    else {
      const job = getJob(id);
      if (!job) return;
      state.saved.unshift({ ...job }); toast("Job saved to your shortlist.", "success");
    }
    persist(); renderSkills(); renderJobs(); renderSaved();
  }
  function renderSaved() {
    $("#savedResults").innerHTML = state.saved.map((job, i) => card(job, i, Number.isFinite(job.score))).join("");
    $("#savedEmpty").hidden = state.saved.length > 0;
  }
  function showDetails(id) {
    const job = getJob(id); if (!job) return;
    const b = job.breakdown || { skills: 0, location: 0, experience: 0, workMode: 0 };
    const score = Number.isFinite(job.score) ? `${job.score}%` : "Not calculated";
    $("#dialogContent").innerHTML = `<div class="dialog-heading"><span class="eyebrow">ROLE OVERVIEW</span><h2>${esc(job.title)}</h2><div class="company-name">${esc(job.company)} · ${esc(job.location)} · ${esc(job.workMode)}</div></div>
      <div class="dialog-score"><strong>${score}</strong><p><b>Estimated compatibility</b><br/>${esc(job.rationale || "Sample role from the curated demo dataset.")}</p></div>
      <div class="dialog-section"><h3>What you may work on</h3><p>${esc(job.description || "Role description for this sample listing.")}</p><p>Indicative compensation: <b>${esc(job.salary)}</b> · Experience: <b>${esc(job.experience)}</b></p></div>
      <div class="dialog-section"><h3>Match breakdown</h3><div class="breakdown-list">${[["Skills",b.skills],["Location",b.location],["Experience",b.experience],["Work mode",b.workMode]].map(([label,val])=>`<div class="breakdown-line"><span>${label}</span><div><span style="width:${val}%"></span></div><b>${val}%</b></div>`).join("")}</div><p>Overall score = skills 65% + location 20% + experience 10% + work mode 5%. It is a ranking aid, not a probability of being hired.</p></div>
      <div class="dialog-section"><h3>Skills to consider next</h3><div class="skill-chips">${(job.missingSkills?.length ? job.missingSkills : job.learning || []).map(s=>chip(s,false)).join("") || "No additional suggestions"}</div></div>
      <div class="dialog-actions"><button class="primary-button" data-save="${esc(job.id)}">${state.saved.some(j=>j.id===job.id)?"♥ Saved — remove":"♡ Save this role"}</button><button class="secondary-button" id="dialogCloseSecondary">Close</button></div>
      <p class="disclaimer">Student-project sample data. This is not an active vacancy and no application is submitted.</p>`;
    $("#jobDialog").showModal();
    $("#dialogCloseSecondary").addEventListener("click", () => $("#jobDialog").close(), { once: true });
  }
  function showInfo() {
    $("#infoContent").innerHTML = `<span class="eyebrow">ABOUT THE PROJECT</span><h2>JobPilot AI</h2><p>JobPilot is a portfolio-ready job-matching demo that compares a user's skills, preferred location, experience level and work preference with a curated set of example roles.</p><h3>Transparent matching formula</h3><ul><li><strong>65%</strong> — overlap between your skills and a role's listed skills</li><li><strong>20%</strong> — preferred location fit, including remote options</li><li><strong>10%</strong> — experience-level fit</li><li><strong>5%</strong> — work-mode preference</li></ul><p><strong>Data limits:</strong> all jobs, companies and salary bands are illustrative sample data, not verified openings or market forecasts. No external AI model is called. A production version should use a licensed jobs API, dated salary sources, privacy controls and bias testing.</p>`;
    $("#infoDialog").showModal();
  }
  function navigate(view) {
    const allowed = ["home","jobs","profile","saved","learning"];
    if (!allowed.includes(view)) return;
    state.currentView = view;
    $$(".page-view").forEach(el => { el.hidden = el.id !== `view-${view}`; });
    $$(".nav-link").forEach(el => el.classList.toggle("active", el.dataset.view === view));
    $("#sidebar").classList.remove("open");
    if (view === "profile") renderSkills();
    if (view === "saved") renderSaved();
    if (view === "learning") renderLearning();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function renderBrowse() {
    const query = $("#browseSearch").value.trim().toLowerCase();
    fetch(`/api/jobs?q=${encodeURIComponent(query)}`).then(r => r.json()).then(data => {
      $("#browseResults").innerHTML = data.jobs.length ? data.jobs.map((job,i) => card(job,i,false)).join("") : '<div class="empty-state"><div>⌕</div><h2>No roles found</h2><p>Try another title, skill or company name.</p></div>';
    }).catch(() => toast("Could not load the demo job list. Is the server running?", "error"));
  }
  function renderLearning() {
    const select = $("#learningRole");
    const previous = select.value;
    const roles = Object.keys(roleRoadmaps);
    select.innerHTML = roles.map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join("");
    if (roles.includes(previous)) select.value = previous;
    const role = select.value;
    const matchedJob = state.jobs.find(j => j.title === role);
    const missing = matchedJob?.missingSkills?.length ? matchedJob.missingSkills : (matchedJob?.learning || []);
    const topics = roleRoadmaps[role] || [];
    $("#learningSummary").innerHTML = `<strong>${esc(role)}</strong>${matchedJob ? `Your current demo match: ${matchedJob.score}%. Focus on the missing skills below.` : "Starter roadmap for this role. Run a job match to personalize the skill gaps."}<br/><br/><span style="color:#6bdfe6">Suggested focus:</span> ${esc(missing.slice(0,3).join(", ") || "Core fundamentals")}`;
    $("#learningSteps").innerHTML = topics.map((topic,i) => `<div class="roadmap-step"><div class="step-number">${i+1}</div><div><h3>${esc(topic)}</h3><p>${esc(learningNotes[i])}</p><small>${i === 0 ? "START HERE" : i === topics.length-1 ? "BUILD & REVIEW" : "PRACTISE"}</small></div></div>`).join("");
  }
  function handleClick(event) {
    const remove = event.target.closest("[data-remove-skill]");
    if (remove) { removeSkill(remove.dataset.removeSkill); return; }
    const suggestion = event.target.closest("[data-add-suggestion]");
    if (suggestion) { addSkills(suggestion.dataset.addSuggestion); return; }
    const save = event.target.closest("[data-save]");
    if (save) { const id = save.dataset.save; toggleSaved(id); if ($("#jobDialog").open) showDetails(id); return; }
    const details = event.target.closest("[data-details]");
    if (details) { showDetails(details.dataset.details); return; }
    const nav = event.target.closest("[data-view]");
    if (nav) { navigate(nav.dataset.view); return; }
  }
  function init() {
    renderSkills(); renderSavedCount(); renderStudentProfile(); updateScores(null);
    if (state.lastInput) {
      state.skills = Array.isArray(state.lastInput.skills) ? state.lastInput.skills : state.skills;
      $("#locationInput").value = state.lastInput.location || "Delhi";
      $("#experienceInput").value = state.lastInput.experience || "Fresher";
      $("#workModeInput").value = state.lastInput.workMode || "Any";
      renderSkills();
    }
    $("#matchForm").addEventListener("submit", submitMatch);
    $("#studentProfileForm").addEventListener("submit", saveStudentProfile);
    $("#skillsInput").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addSkills($("#skillsInput").value); $("#skillsInput").value = ""; } });
    $("#addSkillButton").addEventListener("click", () => { addSkills($("#skillsInput").value); $("#skillsInput").value = ""; $("#skillsInput").focus(); });
    $("#skillsInput").addEventListener("change", () => { if ($("#skillsInput").value.trim()) { addSkills($("#skillsInput").value); $("#skillsInput").value = ""; } });
    $("#editSkillsButton").addEventListener("click", () => { navigate("profile"); $("#profileSkillInput").focus(); });
    $("#profileEditButton").addEventListener("click", () => $("#profileSkillInput").focus());
    $("#profileAddSkill").addEventListener("click", () => { addSkills($("#profileSkillInput").value); $("#profileSkillInput").value = ""; });
    $("#profileSkillInput").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); addSkills($("#profileSkillInput").value); $("#profileSkillInput").value = ""; } });
    $("#sortSelect").addEventListener("change", renderJobs);
    $("#loadMoreButton").addEventListener("click", () => { state.visibleCount += 5; renderJobs(); });
    $("#browseButton").addEventListener("click", renderBrowse);
    $("#browseSearch").addEventListener("keydown", e => { if (e.key === "Enter") renderBrowse(); });
    $("#globalSearch").addEventListener("keydown", e => { if (e.key === "Enter") { navigate("jobs"); $("#browseSearch").value = $("#globalSearch").value; renderBrowse(); } });
    $("#globalSearch").addEventListener("input", e => { if (e.target.value.length > 1) { /* Search runs on Enter to avoid noisy requests. */ } });
    $("#menuToggle").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
    $("#noticeButton").addEventListener("click", showInfo);
    $("#methodButton").addEventListener("click", showInfo);
    $("#footerAbout").addEventListener("click", showInfo);
    $("#dialogClose").addEventListener("click", () => $("#jobDialog").close());
    $("#infoClose").addEventListener("click", () => $("#infoDialog").close());
    $("#learningRole").addEventListener("change", renderLearning);
    $("#sortSelect").value = "match";
    document.addEventListener("click", handleClick);
    document.addEventListener("keydown", e => { if (e.key === "/" && !["INPUT","TEXTAREA","SELECT"].includes(document.activeElement.tagName)) { e.preventDefault(); $("#globalSearch").focus(); } });
    // Optional restored result data is intentionally not treated as fresh market data.
    if (state.lastInput?.skills?.length) { state.skills = state.lastInput.skills; renderSkills(); }
    renderSaved();
    fetch("/api/health").then(r => { if (!r.ok) throw new Error(); }).catch(() => toast("Backend unavailable. Start the app with npm start.", "error"));
  }
  init();
})();