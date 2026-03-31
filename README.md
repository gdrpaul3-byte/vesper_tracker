# Vesper Tracker

Tracks the Following count of [@VesperObscene](https://x.com/VesperObscene) on X and displays a cumulative graph.

## Setup

1. Fork or clone this repository
2. Enable GitHub Pages (Settings > Pages > Source: Deploy from branch, Branch: main, / (root))
3. Add your X API Bearer Token as a repository secret:
   - Settings > Secrets and variables > Actions > New repository secret
   - Name: `X_BEARER_TOKEN`
   - Value: your bearer token
4. The GitHub Actions workflow will automatically run every hour
5. To trigger manually: Actions > "Fetch Following Count" > Run workflow

## Local Development

```bash
# Test the fetch script
export X_BEARER_TOKEN="your_token"
python scripts/fetch_following.py

# Serve locally
python -m http.server 8000
# Open http://localhost:8000
```
