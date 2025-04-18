/**
 * Asynchronously fetches and parses JSON data from a given URL.
 * Displays an error message in the UI if the request fails.
 * @param {string} url - The URL to fetch data from.
 * @returns {Promise<Object|null>} The parsed JSON data or null on failure.
 */
async function fetchData(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Failed to load data from ${url}:`, error);
    return null;
  }
}

/**
 * Creates a chart using Chart.js.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 * @param {string} type - The type of chart (e.g., 'bar', 'pie').
 * @param {object} data - Chart data.
 * @param {object} options - Chart configuration options.
 */
function createChart(ctx, type, data, options) {
  return new Chart(ctx, {
    type,
    data,
    options
  });
}

/**
 * Creates a pie chart displaying driver points.
 * @param {string} canvasId - The ID of the canvas element.
 * @param {string[]} names - Driver names.
 * @param {number[]} points - Driver points.
 */
function createPieChart(canvasId, names, points) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  createChart(ctx, 'pie', {
    labels: names,
    datasets: [{
      label: 'Points',
      data: points,
      backgroundColor: names.map((_, i) => `hsl(${(i * 360) / names.length}, 70%, 55%)`),
      borderColor: '#1c1c1c',
      borderWidth: 2
    }]
  }, {
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#f0f0f0',
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.label}: ${ctx.parsed} очков`
        }
      }
    }
  });
}

/**
 * Creates a horizontal bar chart for comparison data.
 * @param {CanvasRenderingContext2D} ctx - The canvas context.
 * @param {string[]} labels - Chart labels.
 * @param {number[]} dataset1 - First dataset (negative for left side).
 * @param {number[]} dataset2 - Second dataset (positive for right side).
 * @param {string[]} driverNames1 - Names for the first dataset.
 * @param {string[]} driverNames2 - Names for the second dataset.
 */
function createBarChart(ctx, labels, dataset1, dataset2, driverNames1, driverNames2) {
  createChart(ctx, 'bar', {
    labels,
    datasets: [
      {
        label: 'Left Driver',
        data: dataset1,
        backgroundColor: dataset1.map((_, i) => `hsl(${(i * 360) / dataset1.length}, 70%, 60%)`),
        borderRadius: 5
      },
      {
        label: 'Right Driver',
        data: dataset2,
        backgroundColor: dataset2.map((_, i) => `hsl(${(i * 360) / dataset2.length}, 100%, 45%)`),
        borderRadius: 5
      }
    ]
  }, {
    indexAxis: 'y',
    responsive: true,
    plugins: {
      tooltip: {
        callbacks: {
          label: function (ctx) {
            const index = ctx.dataIndex;
            const name = ctx.dataset.label === 'Left Driver' ? driverNames1[index] : driverNames2[index];
            return `${name}: ${Math.abs(ctx.parsed.x)} побед в борьбе`;
          }
        }
      },
      legend: {
        display: false
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        stacked: true,
        ticks: {
          callback: val => Math.abs(val)
        }
      },
      y: {
        stacked: true
      }
    }
  });
}

/**
 * Sorts the driver table based on column index.
 * @param {number} n - The index of the column to sort by.
 */
function sortTable(n) {
  const table = document.getElementById("drivers-table");
  const rows = Array.from(table.rows).slice(1);
  const isAscending = table.rows[0].cells[n].getAttribute('data-sort') === 'asc';

  table.querySelectorAll('th').forEach(header => header.classList.remove('sorted-asc', 'sorted-desc'));
  table.rows[0].cells[n].classList.add(isAscending ? 'sorted-asc' : 'sorted-desc');

  rows.sort((a, b) => {
    const valA = a.cells[n].innerText.trim();
    const valB = b.cells[n].innerText.trim();
    const numA = parseFloat(valA);
    const numB = parseFloat(valB);

    if (!isNaN(numA) && !isNaN(numB)) {
      return isAscending ? numA - numB : numB - numA;
    } else {
      return isAscending ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
  });

  rows.forEach(row => table.appendChild(row));
  table.rows[0].cells[n].setAttribute('data-sort', isAscending ? 'desc' : 'asc');
}

/**
 * Populates the driver table with provided data.
 * @param {object[]} drivers - Array of driver stats.
 * @returns {{names: string[], points: number[]}} - Extracted names and points.
 */
function populateDriversTable(drivers) {
  const tbody = document.querySelector("#drivers-table tbody");
  const names = [];
  const points = [];

  drivers.forEach(driver => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${driver.name}</td>
      <td>${driver.startPos}</td>
      <td>${driver.finishPos}</td>
      <td>${driver.diff}</td>
      <td>${driver.races}</td>
      <td>${driver.sprints}</td>
      <td>${driver.laps}</td>
      <td>${driver.wins}</td>
      <td>${driver.podiums}</td>
      <td>${driver.points}</td>
    `;
    tbody.appendChild(row);
    names.push(driver.name);
    points.push(driver.points);
  });

  return { names, points };
}

/**
 * Draws a driver battles chart from provided data.
 * @param {string} canvasId - The canvas element ID.
 * @param {object[]} battlesData - Array of battle data.
 */
function drawDriverBattlesChart(canvasId, battlesData) {
  const labels = battlesData.map(d => d.pair);
  const dataset1 = [];
  const dataset2 = [];
  const driverNames1 = [];
  const driverNames2 = [];

  battlesData.forEach(d => {
    const [driver1, driver2] = d.pair.split(" vs ");
    driverNames1.push(driver1.trim());
    driverNames2.push(driver2.trim());
    dataset1.push(-Math.abs(Number(d.qualScore_1)));
    dataset2.push(Math.abs(Number(d.qualScore_2)));
  });

  const ctx = document.getElementById(canvasId).getContext('2d');
  createBarChart(ctx, labels, dataset1, dataset2, driverNames1, driverNames2);
}

/**
 * Main initialization function.
 */
async function init() {
  const drivers = await fetchData("drivers.json");
  if (!drivers) return;

  const { names, points } = populateDriversTable(drivers);

  sortTable(9); // Default sort by name

  // Create pie chart of points
  createPieChart('pointsChart', names, points);

  // Create bar chart of laps
  const ctxLaps = document.getElementById('lapsChart').getContext('2d');
  createChart(ctxLaps, 'bar', {
    labels: names,
    datasets: [{
      label: 'Laps',
      data: drivers.map(d => d.laps),
      backgroundColor: names.map((_, i) => `hsl(${(i * 360) / names.length}, 60%, 50%)`),
      borderRadius: 5
    }]
  }, {
    indexAxis: 'y',
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: ctx => `${ctx.parsed.x} кругов`
        }
      }
    },
    scales: {
      x: { beginAtZero: true }
    }
  });

  const battlesData = await fetchData('driversbattles.json');
  if (battlesData) drawDriverBattlesChart('qualChart', battlesData);

  const sprintBattlesData = await fetchData('driversbattlessprint.json');
  if (sprintBattlesData) drawDriverBattlesChart('sprintQualChart', sprintBattlesData);
}

document.addEventListener('DOMContentLoaded', init);
