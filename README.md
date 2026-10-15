# JobPilot AI

A full-stack, portfolio-ready job-matching demo. It recommends sample roles from a user's skills, preferred location, experience level, and work-mode preference.

## Tech stack

- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Node.js + Express
- Matching engine: transparent weighted rule-based scoring
- Persistence: browser `localStorage` for skills and saved jobs

## Run locally

Requirements: Node.js 18 or newer.

```bash
npm install
npm start
```

Open **http://localhost:3000** in your browser.

For auto-restart during development:

```bash
npm run dev
```

## How the score works

Each role receives an estimated score from 0–100:

- Skills overlap: **65%**
- Location fit: **20%**
- Experience fit: **10%**
- Work-mode fit: **5%**

The app also shows the separate component scores and skills that are missing from a role's listed requirements. A score is a compatibility ranking aid, not a probability of getting hired.

## API endpoints

### `GET /api/health`
Returns app status.

### `GET /api/jobs?q=react&location=Delhi`
Searches the curated example job dataset. `q` searches job title, company, and skills. `location` filters city and allows remote roles.

### `POST /api/predict`
Example request:

```json
{
  "skills": ["JavaScript", "React", "Node.js", "SQL"],
  "location": "Delhi",
  "experience": "Fresher",
  "workMode": "Any"
}
```

The API validates inputs and returns ranked recommendations with score breakdowns, matched skills, missing skills, and role descriptions.

## Important data limitation

This project intentionally uses a **curated illustrative dataset**. Company names, jobs, and salary bands are examples and are **not verified live vacancies or salary forecasts**. It does not call a third-party AI model or job API. Do not present these entries as currently open jobs.

For a production version, connect a licensed job listings API, display source and last-updated dates, validate salary data, add server-side rate limiting and authentication as needed, and conduct privacy/security and fairness testing.

## Project structure

```text
jobpilot-ai/
├── server.js
├── package.json
├── README.md
├── src/
│   └── matcher.js
└── public/
    ├── index.html
    ├── styles.css
    └── app.js
```

## Portfolio talking points

- Responsive dashboard and mobile navigation
- Accessible form labels, keyboard interaction, and visible validation
- Express REST endpoints and server-side input validation
- Weighted explainable matching algorithm
- Saved jobs and skill profile using local browser storage
- Skill-gap suggestions and a starter learning roadmap
- Clear separation between demo data and real market data
