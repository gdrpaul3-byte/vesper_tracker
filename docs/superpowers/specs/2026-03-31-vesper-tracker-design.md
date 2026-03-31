# Vesper Tracker Design Spec

## Overview

A static dashboard website that tracks the Following count of X (Twitter) account [@VesperObscene](https://x.com/VesperObscene) and displays it as a cumulative graph. Data is collected hourly via GitHub Actions and served via GitHub Pages.

## Architecture

```
GitHub Actions (cron, hourly)
  → X API v2: GET /2/users/by/username/VesperObscene?user.fields=public_metrics
  → Extract following_count
  → Append to data/history.json
  → Auto-commit & push

GitHub Pages (static hosting)
  → index.html loads data/history.json
  → Chart.js renders cumulative line graph
  → Dashboard shows current value, change, timeline
```

## Project Structure

```
vesper_tracker/
├── index.html              # Main dashboard page
├── css/style.css           # Styles
├── js/app.js               # Chart.js graph + dashboard logic
├── data/
│   └── history.json        # Collected data
├── scripts/
│   └── fetch_following.py  # Python script to call X API and update history.json
└── .github/
    └── workflows/
        └── fetch.yml       # Hourly cron workflow
```

## Data Collection

### GitHub Actions Workflow (`fetch.yml`)

- **Schedule**: `cron: '0 * * * *'` (every hour on the hour)
- **Runner**: `ubuntu-latest`
- **Steps**:
  1. Checkout repo
  2. Set up Python
  3. Run `scripts/fetch_following.py`
  4. Commit and push `data/history.json` if changed

### Python Script (`fetch_following.py`)

- Reads `X_BEARER_TOKEN` from environment (GitHub Secrets)
- Calls X API v2: `GET /2/users/by/username/VesperObscene?user.fields=public_metrics`
- Extracts `following_count` from response
- Loads existing `data/history.json`, appends new entry with ISO 8601 timestamp
- Writes back to file

### Data Format (`history.json`)

```json
[
  {"timestamp": "2026-03-31T09:00:00Z", "following_count": 142},
  {"timestamp": "2026-03-31T10:00:00Z", "following_count": 143}
]
```

Initial state: empty array `[]`

## Frontend Dashboard

### Tech Stack

- Pure HTML/CSS/JS (no build tools)
- Chart.js via CDN for graphing

### UI Components

1. **Header**: "Vesper Tracker" title + link to X profile
2. **Current Following Count**: Large number, center-top
3. **Change Indicator (+-N)**: Compared to previous data point. Green for increase, red for decrease, gray for no change.
4. **Cumulative Line Graph**: Chart.js line chart showing all collected data points. X-axis = time, Y-axis = following count.
5. **Recent Changes Timeline**: List at the bottom showing only data points where the count changed from the previous reading. Shows timestamp, new count, and delta.

### Data Loading

- Fetch `data/history.json` on page load
- Parse and render all components
- No auto-refresh (user reloads to see latest)

## Deployment

- **Hosting**: GitHub Pages from the repo root (or `/docs` branch — root is simpler)
- **API Key Security**: Bearer token stored in GitHub Secrets as `X_BEARER_TOKEN`, never exposed in client code
- **Domain**: Default GitHub Pages URL (`username.github.io/vesper_tracker`)

## Constraints

- GitHub Actions cron may have 1-5 minute delay from scheduled time
- X API Free tier: 500k tweets read/month, user lookup is separate and generous
- history.json grows ~24 entries/day (~730/month), file size is negligible
