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
