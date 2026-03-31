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
