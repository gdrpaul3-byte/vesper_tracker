# Vesper Tracker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static dashboard that tracks @VesperObscene's X Following count hourly and displays a cumulative graph.

**Architecture:** GitHub Actions cron calls X API v2 every hour, appends data to `data/history.json`, and auto-commits. GitHub Pages serves a static HTML/CSS/JS dashboard that reads the JSON and renders Chart.js graphs.

**Tech Stack:** HTML/CSS/JS, Chart.js (CDN), Python 3 (data collection script), GitHub Actions, X API v2

---

## File Structure

| File | Responsibility |
|------|---------------|
| `data/history.json` | Stored time-series data (array of `{timestamp, following_count}`) |
| `scripts/fetch_following.py` | Calls X API, appends result to history.json |
| `.github/workflows/fetch.yml` | Hourly cron to run the Python script and commit |
| `index.html` | Dashboard page structure |
| `css/style.css` | Dashboard styling |
| `js/app.js` | Load data, render Chart.js graph, compute stats |

---

### Task 1: Initialize project and data file

**Files:**
- Create: `data/history.json`

- [ ] **Step 1: Create the empty data file**

```json
[]
```

- [ ] **Step 2: Commit**

```bash
git add data/history.json
git commit -m "init: add empty history.json data file"
```

---

### Task 2: Python data collection script

**Files:**
- Create: `scripts/fetch_following.py`

- [ ] **Step 1: Write the fetch script**

```python
#!/usr/bin/env python3
"""Fetch @VesperObscene's following count from X API v2 and append to history.json."""

import json
import os
import sys
from datetime import datetime, timezone
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

BEARER_TOKEN = os.environ.get("X_BEARER_TOKEN")
USERNAME = "VesperObscene"
DATA_FILE = os.path.join(os.path.dirname(__file__), "..", "data", "history.json")
API_URL = f"https://api.x.com/2/users/by/username/{USERNAME}?user.fields=public_metrics"


def fetch_following_count():
    if not BEARER_TOKEN:
        print("ERROR: X_BEARER_TOKEN environment variable not set", file=sys.stderr)
        sys.exit(1)

    req = Request(API_URL)
    req.add_header("Authorization", f"Bearer {BEARER_TOKEN}")

    try:
        with urlopen(req) as response:
            data = json.loads(response.read().decode())
    except HTTPError as e:
        print(f"ERROR: X API returned {e.code}: {e.read().decode()}", file=sys.stderr)
        sys.exit(1)
    except URLError as e:
        print(f"ERROR: Failed to reach X API: {e.reason}", file=sys.stderr)
        sys.exit(1)

    following_count = data["data"]["public_metrics"]["following_count"]
    return following_count


def append_to_history(following_count):
    data_file = os.path.normpath(DATA_FILE)

    if os.path.exists(data_file):
        with open(data_file, "r", encoding="utf-8") as f:
            history = json.load(f)
    else:
        history = []

    entry = {
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "following_count": following_count,
    }
    history.append(entry)

    with open(data_file, "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    print(f"Recorded: {entry}")


if __name__ == "__main__":
    count = fetch_following_count()
    append_to_history(count)
```

- [ ] **Step 2: Test locally (manual)**

```bash
export X_BEARER_TOKEN="your_token_here"
cd vesper_tracker
python scripts/fetch_following.py
cat data/history.json
```

Expected: `history.json` now contains one entry with current timestamp and following count.

- [ ] **Step 3: Commit**

```bash
git add scripts/fetch_following.py
git commit -m "feat: add Python script to fetch following count from X API"
```

---

### Task 3: GitHub Actions workflow

**Files:**
- Create: `.github/workflows/fetch.yml`

- [ ] **Step 1: Write the workflow file**

```yaml
name: Fetch Following Count

on:
  schedule:
    - cron: '0 * * * *'  # Every hour on the hour
  workflow_dispatch:       # Allow manual trigger

permissions:
  contents: write

jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.12'

      - name: Fetch following count
        env:
          X_BEARER_TOKEN: ${{ secrets.X_BEARER_TOKEN }}
        run: python scripts/fetch_following.py

      - name: Commit and push if changed
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add data/history.json
          git diff --staged --quiet || git commit -m "data: update following count [skip ci]"
          git push
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/fetch.yml
git commit -m "feat: add GitHub Actions workflow for hourly data collection"
```

---

### Task 4: Dashboard HTML structure

**Files:**
- Create: `index.html`

- [ ] **Step 1: Write the HTML**

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Vesper Tracker</title>
    <link rel="stylesheet" href="css/style.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-adapter-date-fns@3/dist/chartjs-adapter-date-fns.bundle.min.js"></script>
</head>
<body>
    <header>
        <h1>Vesper Tracker</h1>
        <a href="https://x.com/VesperObscene" target="_blank" rel="noopener">@VesperObscene</a>
    </header>

    <main>
        <section class="stats">
            <div class="stat-card current-count">
                <span class="label">Following</span>
                <span class="value" id="current-count">--</span>
            </div>
            <div class="stat-card change">
                <span class="label">Change</span>
                <span class="value" id="change-indicator">--</span>
            </div>
            <div class="stat-card last-updated">
                <span class="label">Last Updated</span>
                <span class="value" id="last-updated">--</span>
            </div>
        </section>

        <section class="chart-container">
            <canvas id="following-chart"></canvas>
        </section>

        <section class="timeline">
            <h2>Recent Changes</h2>
            <ul id="changes-list"></ul>
        </section>
    </main>

    <script src="js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add index.html
git commit -m "feat: add dashboard HTML structure"
```

---

### Task 5: Dashboard CSS

**Files:**
- Create: `css/style.css`

- [ ] **Step 1: Write the styles**

```css
* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: #0a0a0a;
    color: #e0e0e0;
    min-height: 100vh;
    padding: 2rem;
}

header {
    text-align: center;
    margin-bottom: 2rem;
}

header h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    color: #ffffff;
}

header a {
    color: #1d9bf0;
    text-decoration: none;
    font-size: 1rem;
}

header a:hover {
    text-decoration: underline;
}

.stats {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
}

.stat-card {
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 12px;
    padding: 1.5rem 2rem;
    text-align: center;
    min-width: 160px;
}

.stat-card .label {
    display: block;
    font-size: 0.85rem;
    color: #888;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.stat-card .value {
    display: block;
    font-size: 2rem;
    font-weight: 700;
}

.current-count .value {
    color: #ffffff;
}

.change .value.up {
    color: #22c55e;
}

.change .value.down {
    color: #ef4444;
}

.change .value.neutral {
    color: #888;
}

.last-updated .value {
    font-size: 1rem;
    color: #aaa;
}

.chart-container {
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
}

.timeline {
    max-width: 900px;
    margin: 0 auto;
}

.timeline h2 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
    color: #ccc;
}

.timeline ul {
    list-style: none;
}

.timeline li {
    background: #1a1a1a;
    border: 1px solid #2a2a2a;
    border-radius: 8px;
    padding: 0.75rem 1rem;
    margin-bottom: 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.timeline .time {
    color: #888;
    font-size: 0.85rem;
}

.timeline .count {
    font-weight: 600;
}

.timeline .delta {
    font-weight: 600;
    font-size: 0.9rem;
}

.timeline .delta.up {
    color: #22c55e;
}

.timeline .delta.down {
    color: #ef4444;
}

.no-changes {
    color: #666;
    font-style: italic;
}
```

- [ ] **Step 2: Commit**

```bash
git add css/style.css
git commit -m "feat: add dashboard styles"
```

---

### Task 6: Dashboard JavaScript (app.js)

**Files:**
- Create: `js/app.js`

- [ ] **Step 1: Write the application logic**

```javascript
(async function () {
  const DATA_URL = "data/history.json";

  // --- Fetch data ---
  let history;
  try {
    const res = await fetch(DATA_URL);
    if (!res.ok) throw new Error(res.statusText);
    history = await res.json();
  } catch (err) {
    document.getElementById("current-count").textContent = "Error loading data";
    console.error("Failed to load history:", err);
    return;
  }

  if (history.length === 0) {
    document.getElementById("current-count").textContent = "No data yet";
    return;
  }

  // --- Stats ---
  const latest = history[history.length - 1];
  const previous = history.length > 1 ? history[history.length - 2] : null;

  document.getElementById("current-count").textContent =
    latest.following_count.toLocaleString();

  const changeEl = document.getElementById("change-indicator");
  if (previous) {
    const delta = latest.following_count - previous.following_count;
    if (delta > 0) {
      changeEl.textContent = `+${delta}`;
      changeEl.classList.add("up");
    } else if (delta < 0) {
      changeEl.textContent = `${delta}`;
      changeEl.classList.add("down");
    } else {
      changeEl.textContent = "0";
      changeEl.classList.add("neutral");
    }
  } else {
    changeEl.textContent = "--";
    changeEl.classList.add("neutral");
  }

  const lastUpdated = new Date(latest.timestamp);
  document.getElementById("last-updated").textContent =
    lastUpdated.toLocaleString();

  // --- Chart ---
  const ctx = document.getElementById("following-chart").getContext("2d");
  new Chart(ctx, {
    type: "line",
    data: {
      labels: history.map((d) => new Date(d.timestamp)),
      datasets: [
        {
          label: "Following Count",
          data: history.map((d) => d.following_count),
          borderColor: "#1d9bf0",
          backgroundColor: "rgba(29, 155, 240, 0.1)",
          fill: true,
          tension: 0.3,
          pointRadius: 2,
          pointHoverRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        x: {
          type: "time",
          time: { tooltipFormat: "yyyy-MM-dd HH:mm" },
          ticks: { color: "#888" },
          grid: { color: "#2a2a2a" },
        },
        y: {
          ticks: { color: "#888", precision: 0 },
          grid: { color: "#2a2a2a" },
        },
      },
      plugins: {
        legend: { display: false },
      },
    },
  });

  // --- Recent Changes Timeline ---
  const changesList = document.getElementById("changes-list");
  const changes = [];
  for (let i = history.length - 1; i >= 1; i--) {
    const delta = history[i].following_count - history[i - 1].following_count;
    if (delta !== 0) {
      changes.push({
        timestamp: history[i].timestamp,
        count: history[i].following_count,
        delta: delta,
      });
    }
    if (changes.length >= 20) break;
  }

  if (changes.length === 0) {
    changesList.innerHTML = '<li class="no-changes">No changes recorded yet</li>';
  } else {
    changesList.innerHTML = changes
      .map((c) => {
        const time = new Date(c.timestamp).toLocaleString();
        const sign = c.delta > 0 ? "+" : "";
        const cls = c.delta > 0 ? "up" : "down";
        return `<li>
          <span class="time">${time}</span>
          <span class="count">${c.count.toLocaleString()}</span>
          <span class="delta ${cls}">${sign}${c.delta}</span>
        </li>`;
      })
      .join("");
  }
})();
```

- [ ] **Step 2: Open in browser and verify with sample data**

Create a temporary `data/history.json` with sample data to test:

```json
[
  {"timestamp": "2026-03-31T09:00:00Z", "following_count": 140},
  {"timestamp": "2026-03-31T10:00:00Z", "following_count": 142},
  {"timestamp": "2026-03-31T11:00:00Z", "following_count": 142},
  {"timestamp": "2026-03-31T12:00:00Z", "following_count": 145}
]
```

Open `index.html` in browser. Verify:
- Current count shows "145"
- Change shows "+3" in green
- Chart renders with 4 data points
- Timeline shows 2 changes: +2 and +3

- [ ] **Step 3: Reset history.json to empty array**

```json
[]
```

- [ ] **Step 4: Commit**

```bash
git add js/app.js
git commit -m "feat: add dashboard JS with chart and timeline"
```

---

### Task 7: Final integration and README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Write README with setup instructions**

```markdown
# Vesper Tracker

Tracks the Following count of [@VesperObscene](https://x.com/VesperObscene) on X and displays a cumulative graph.

## Setup

1. Fork or clone this repository
2. Enable GitHub Pages (Settings → Pages → Source: Deploy from branch, Branch: main, / (root))
3. Add your X API Bearer Token as a repository secret:
   - Settings → Secrets and variables → Actions → New repository secret
   - Name: `X_BEARER_TOKEN`
   - Value: your bearer token
4. The GitHub Actions workflow will automatically run every hour
5. To trigger manually: Actions → "Fetch Following Count" → Run workflow

## Local Development

```bash
# Test the fetch script
export X_BEARER_TOKEN="your_token"
python scripts/fetch_following.py

# Serve locally
python -m http.server 8000
# Open http://localhost:8000
```
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup instructions"
```

---

### Task 8: Create GitHub repository and deploy

- [ ] **Step 1: Initialize git repo**

```bash
cd vesper_tracker
git init
git add -A
git commit -m "init: vesper tracker project"
```

- [ ] **Step 2: Create GitHub repo and push**

```bash
gh repo create vesper_tracker --public --source=. --push
```

- [ ] **Step 3: Add X_BEARER_TOKEN secret**

```bash
gh secret set X_BEARER_TOKEN
```

(Paste the bearer token when prompted)

- [ ] **Step 4: Enable GitHub Pages**

```bash
gh api repos/{owner}/vesper_tracker/pages -X POST -f build_type=workflow -f source.branch=main -f source.path="/"
```

Or via Settings → Pages → Source: main branch, / (root).

- [ ] **Step 5: Trigger workflow manually to seed first data point**

```bash
gh workflow run fetch.yml
```

- [ ] **Step 6: Verify**

- Check Actions tab: workflow should succeed
- Check `data/history.json`: should have one entry
- Visit `https://{username}.github.io/vesper_tracker/`: dashboard should display
