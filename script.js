// Efficiency Monitor Class (JavaScript port of Python code)
class EfficiencyMonitor {
	constructor(targetEfficiency = 0.995, smoothingFactor = 0.1, initialEfficiency = 1.0, maxDailySeverity = 100) {
		if (smoothingFactor <= 0 || smoothingFactor > 1) {
			throw new Error("Smoothing factor (alpha) must be between 0 and 1.");
		}
		this.targetEfficiency = targetEfficiency;
		this.alpha = smoothingFactor;
		this.maxDailySeverity = maxDailySeverity;
		this.currentEfficiency = initialEfficiency;
		this.dayCount = 0;
	}

	calculateDailyPerformance(events, severityHyperparams) {
		const totalDailySeverity = Math.min(
			events.reduce((sum, event) => sum + (severityHyperparams[event] || 0), 0),
			this.maxDailySeverity
		);
		const dailyPerformanceScore = 1 - (totalDailySeverity / this.maxDailySeverity);
		return {
			totalDailySeverity,
			dailyPerformanceScore
		};
	}

	processDay(events, severityHyperparams) {
		this.dayCount++;
		const {
			totalDailySeverity,
			dailyPerformanceScore
		} = this.calculateDailyPerformance(events, severityHyperparams);
		const previousEfficiency = this.currentEfficiency;
		this.currentEfficiency = (this.alpha * dailyPerformanceScore) + ((1 - this.alpha) * previousEfficiency);
		return {
			day: this.dayCount,
			events: events,
			severity: totalDailySeverity,
			dailyPerf: dailyPerformanceScore,
			newEfficiency: this.currentEfficiency
		};
	}

	forecastDaysToReachGoal() {
		if (this.currentEfficiency >= this.targetEfficiency) {
			return 0;
		}
		try {
			const numerator = Math.log((1 - this.targetEfficiency) / (1 - this.currentEfficiency));
			const denominator = Math.log(1 - this.alpha);
			return Math.ceil(numerator / denominator);
		} catch (error) {
			return Infinity;
		}
	}
}

// Utility functions
function showTab(tabName) {
	document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
	document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
	document.getElementById(tabName).classList.add('active');
	event.target.classList.add('active');
}

function updateInitialEfficiency() {
	const badEvents = parseFloat(document.getElementById('badEvents').value) || 0;
	const duration = parseFloat(document.getElementById('duration').value) || 1;
	const efficiency = Math.max(0, 1 - (badEvents / duration));
	document.getElementById('efficiencyValue').textContent = (efficiency * 100).toFixed(2) + '%';
	document.getElementById('efficiencyBar').style.width = (efficiency * 100) + '%';
}

function addEvent() {
	const container = document.getElementById('severityEvents');
	const eventDiv = document.createElement('div');
	eventDiv.className = 'event-input';
	eventDiv.innerHTML = `
<input type="text" placeholder="Event name">
<input type="number" placeholder="Severity" min="0" value="1">
<button type="button" class="btn btn-danger" onclick="removeEvent(this)">Remove</button>
`;
	container.appendChild(eventDiv);
}

function removeEvent(button) {
	button.parentElement.remove();
}

function clearOutput() {
	document.getElementById('simulationOutput').style.display = 'none';
	document.getElementById('simulationStats').style.display = 'none';
}

function getSeverityProfile() {
	const eventInputs = document.querySelectorAll('#severityEvents .event-input');
	const profile = {};
	eventInputs.forEach(input => {
		const eventName = input.children[0].value.trim();
		const severity = parseFloat(input.children[1].value) || 0;
		if (eventName) {
			profile[eventName] = severity;
		}
	});
	return profile;
}

function getRandomEvents(severityProfile, perfectDayProb, secondEventProb) {
	const events = Object.keys(severityProfile);
	if (events.length === 0) return [];
	const eventsToday = [];
	// Use user-defined probability for a perfect day
	if (Math.random() > perfectDayProb / 100) {
		// Create weights (inverse of severity for more realistic probability)
		const weights = events.map(event => 1 / (severityProfile[event] || 1));
		const totalWeight = weights.reduce((sum, w) => sum + w, 0);
		// Select first event
		let random = Math.random() * totalWeight;
		let selectedIndex = 0;
		let currentWeight = 0;
		for (let i = 0; i < weights.length; i++) {
			currentWeight += weights[i];
			if (random <= currentWeight) {
				selectedIndex = i;
				break;
			}
		}
		eventsToday.push(events[selectedIndex]);
		// Use user-defined probability for a second event
		if (Math.random() < secondEventProb / 100) {
			random = Math.random() * totalWeight;
			currentWeight = 0;
			for (let i = 0; i < weights.length; i++) {
				currentWeight += weights[i];
				if (random <= currentWeight) {
					eventsToday.push(events[i]);
					break;
				}
			}
		}
	}
	return eventsToday;
}

/**
 * Calculates the moving average of a dataset.
 * @param {number[]} data - The array of numbers.
 * @param {number} windowSize - The size of the moving average window.
 * @returns {number[]} The array of moving averages.
 */
function calculateMovingAverage(data, windowSize) {
    if (windowSize <= 1 || data.length < windowSize) return data;
    const movingAverages = [];
    for (let i = 0; i <= data.length - windowSize; i++) {
        const window = data.slice(i, i + windowSize);
        const average = window.reduce((sum, val) => sum + val, 0) / windowSize;
        movingAverages.push(average);
    }
    return movingAverages;
}

async function runSimulation() {
	try {
		// Get parameters
		const badEvents = parseFloat(document.getElementById('badEvents').value) || 0;
		const duration = parseFloat(document.getElementById('duration').value) || 1;
		const initialEfficiency = Math.max(0, 1 - (badEvents / duration));
		const simDays = parseInt(document.getElementById('simDays').value) || 25;
		const maxSeverity = parseInt(document.getElementById('maxSeverity').value) || 10;
		const targetIncrement = parseFloat(document.getElementById('targetIncrement').value) / 100 || 0.2;
		const smoothingFactor = parseFloat(document.getElementById('smoothingFactor').value) || 0.04;
		const perfectDayProb = parseFloat(document.getElementById('perfectDayProb').value) || 40;
		const secondEventProb = parseFloat(document.getElementById('secondEventProb').value) || 35;
		const severityProfile = getSeverityProfile();
		if (Object.keys(severityProfile).length === 0) {
			alert('Please add at least one event type to the severity profile.');
			return;
		}
		const targetEfficiency = Math.min(1.0, initialEfficiency + targetIncrement);
		// Initialize monitor
		const monitor = new EfficiencyMonitor(targetEfficiency, smoothingFactor, initialEfficiency, maxSeverity);
		// Setup output
		const output = document.getElementById('simulationOutput');
		const stats = document.getElementById('simulationStats');
		output.innerHTML = '';
		output.style.display = 'block';
		stats.style.display = 'grid';
		// Show initial info
		output.innerHTML += `
<div class="simulation-day">
<div><strong>🚀 SIMULATION STARTING</strong></div>
<div>Severity Profile: ${Object.keys(severityProfile).join(', ')}</div>
<div>Initial Efficiency: ${(initialEfficiency * 100).toFixed(2)}%</div>
<div>Target Efficiency: ${(targetEfficiency * 100).toFixed(2)}%</div>
<div>Smoothing Factor (α): ${smoothingFactor}</div>
<div>═══════════════════════════════════════</div>
</div>
`;
		let perfectDays = 0;
		let totalEvents = 0;
		let goalAchieved = false;
		let goalDay = 0;
		// Run simulation
		for (let day = 0; day < simDays; day++) {
			const eventsToday = getRandomEvents(severityProfile, perfectDayProb, secondEventProb);
			const report = monitor.processDay(eventsToday, severityProfile);
			const forecast = monitor.forecastDaysToReachGoal();
			// Update statistics
			if (eventsToday.length === 0) perfectDays++;
			totalEvents += eventsToday.length;
			if (forecast === 0 && !goalAchieved) {
				goalAchieved = true;
				goalDay = day + 1;
			}
			// Display day results
			const dayDiv = document.createElement('div');
			dayDiv.className = 'simulation-day';
			const eventsDisplay = eventsToday.length > 0 ? eventsToday.join(', ') : 'None (Perfect Day! 🌟)';
			const forecastText = forecast === 0 ?
				`<span class="goal-achieved">🎯 GOAL ACHIEVED! Target of ${(targetEfficiency * 100).toFixed(2)}% reached or exceeded! 🎯</span>` :
				`Need ${forecast} perfect days to reach ${(targetEfficiency * 100).toFixed(2)}% goal (EWMA)`;
			dayDiv.innerHTML = `
<div><strong>📅 Day ${report.day}</strong></div>
<div>Events: ${eventsDisplay}</div>
<div>Daily Performance: ${(report.dailyPerf * 100).toFixed(2)}%</div>
<div>Current Efficiency: ${(report.newEfficiency * 100).toFixed(4)}%</div>
<div>Forecast: ${forecastText}</div>
`;
			output.appendChild(dayDiv);
			// Scroll to bottom
			output.scrollTop = output.scrollHeight;
			// Add a small delay for visual effect
			await new Promise(resolve => setTimeout(resolve, 50));
		}
		// Final summary
		const finalDiv = document.createElement('div');
		finalDiv.className = 'simulation-day';
		finalDiv.innerHTML = `
<div><strong>✅ SIMULATION COMPLETE</strong></div>
<div>Final Efficiency: ${(monitor.currentEfficiency * 100).toFixed(4)}%</div>
<div>Goal ${goalAchieved ? `achieved on day ${goalDay}` : 'not achieved'}</div>
<div>═══════════════════════════════════════</div>
`;
		output.appendChild(finalDiv);
		// Update statistics display
		stats.innerHTML = `
<div class="stat-card">
<div class="stat-value">${(monitor.currentEfficiency * 100).toFixed(2)}%</div>
<div class="stat-label">Final Efficiency</div>
</div>
<div class="stat-card">
<div class="stat-value">${perfectDays}</div>
<div class="stat-label">Perfect Days</div>
</div>
<div class="stat-card">
<div class="stat-value">${totalEvents}</div>
<div class="stat-label">Total Events</div>
</div>
<div class="stat-card">
<div class="stat-value">${goalAchieved ? 'YES' : 'NO'}</div>
<div class="stat-label">Goal Achieved</div>
</div>
`;
	} catch (error) {
		alert('Error running simulation: ' + error.message);
	}
}

// --- Multiple Simulation Logic ---
let myCharts = [];

function getRandomEventsForMultipleSims(eventPool, maxEvents) {
	const eventsToday = [];
	const numEvents = Math.floor(Math.random() * (maxEvents + 1));
	for (let i = 0; i < numEvents; i++) {
		const randomIndex = Math.floor(Math.random() * eventPool.length);
		eventsToday.push(eventPool[randomIndex]);
	}
	return eventsToday;
}

async function runMultipleSimulations() {
	try {
		// Get parameters
		const badEvents = parseFloat(document.getElementById('badEvents').value) || 0;
		const duration = parseFloat(document.getElementById('duration').value) || 1;
		const initialEfficiency = Math.max(0, 1 - (badEvents / duration));
		const simDays = parseInt(document.getElementById('simDays').value) || 25;
		const maxSeverity = parseInt(document.getElementById('maxSeverity').value) || 10;
		const targetIncrement = parseFloat(document.getElementById('targetIncrement').value) / 100 || 0.2;
		const smoothingFactor = parseFloat(document.getElementById('smoothingFactor').value) || 0.04;
		const severityProfile = getSeverityProfile();
		const eventPool = Object.keys(severityProfile);

		const nRuns = parseInt(document.getElementById('nRuns').value) || 100;
		const maxEventsPerDay = parseInt(document.getElementById('maxEventsPerDay').value) || 5;

		if (eventPool.length === 0) {
			alert('Please add at least one event type to the severity profile.');
			return;
		}

		const targetEfficiency = Math.min(1.0, initialEfficiency + targetIncrement);
		const runData = [];

		// --- NEW: Calculate "Actual Perfect Days Needed" ---
		let perfectDaysNeeded;
		if (targetEfficiency >= 1) {
			perfectDaysNeeded = Infinity;
		} else {
			perfectDaysNeeded = Math.round((targetEfficiency * duration - (duration - badEvents)) / (1 - targetEfficiency));
		}

		for (let simId = 0; simId < nRuns; simId++) {
			const monitor = new EfficiencyMonitor(targetEfficiency, smoothingFactor, initialEfficiency, maxSeverity);
			for (let day = 0; day < simDays; day++) {
				const eventsToday = getRandomEventsForMultipleSims(eventPool, maxEventsPerDay);
				monitor.processDay(eventsToday, severityProfile);
			}
			runData.push({
				simulation_id: simId,
				final_efficiency: monitor.currentEfficiency,
				days_to_goal: monitor.forecastDaysToReachGoal(),
			});
		}

		// Calculate and Display Stats
		displayMultiSimStats(runData, initialEfficiency, targetEfficiency, perfectDaysNeeded);

		// Render Charts
		renderCharts(runData);

	} catch (error) {
		alert('Error running aggregate analysis: ' + error.message);
	}
}

function displayMultiSimStats(runData, initialEfficiency, targetEfficiency, perfectDaysNeeded) {
	const statsContainer = document.getElementById('multiSimStats');

	const finalEfficiencies = runData.map(d => d.final_efficiency);
	const daysToGoal = runData.map(d => d.days_to_goal).filter(d => d !== Infinity);

	const avgFinalEfficiency = finalEfficiencies.reduce((a, b) => a + b, 0) / finalEfficiencies.length;
	const maxFinalEfficiency = Math.max(...finalEfficiencies);
	const avgDaysToGoal = daysToGoal.reduce((a, b) => a + b, 0) / daysToGoal.length || 0;
	const maxDaysToGoal = Math.max(...daysToGoal, 0);
	const goalReachedCount = runData.filter(d => d.days_to_goal === 0).length;
	const goalReachedPercent = (goalReachedCount / runData.length) * 100;

	statsContainer.innerHTML = `
<div class="stat-card">
<div class="stat-value">${(initialEfficiency * 100).toFixed(2)}%</div>
<div class="stat-label">Initial Efficiency</div>
</div>
<div class="stat-card">
<div class="stat-value">${(targetEfficiency * 100).toFixed(2)}%</div>
<div class="stat-label">Target Efficiency</div>
</div>
<div class="stat-card">
<div class="stat-value">${(avgFinalEfficiency * 100).toFixed(2)}%</div>
<div class="stat-label">Avg. Final Efficiency</div>
</div>
<div class="stat-card">
<div class="stat-value">${(maxFinalEfficiency * 100).toFixed(2)}%</div>
<div class="stat-label">Max Final Efficiency</div>
</div>
<div class="stat-card">
<div class="stat-value">${avgDaysToGoal.toFixed(2)}</div>
<div class="stat-label">Avg. Days to Goal (EWMA)</div>
</div>
<div class="stat-card">
<div class="stat-value">${maxDaysToGoal}</div>
<div class="stat-label">Max Days to Goal (EWMA)</div>
</div>
<div class="stat-card">
<div class="stat-value">${goalReachedCount} (${goalReachedPercent.toFixed(1)}%)</div>
<div class="stat-label">Sims Reaching Goal</div>
</div>
<div class="stat-card">
<div class="stat-value">${isFinite(perfectDaysNeeded) ? (perfectDaysNeeded < 0 ? 0 : perfectDaysNeeded) :  '∞' }</div>
<div class="stat-label">Actual Perfect Days (Simple Model)</div>
</div>
`;
	statsContainer.style.display = 'grid';
}

function renderCharts(runData) {
    const chartContainer = document.getElementById('chartContainer');
    chartContainer.style.display = 'grid';

    // Destroy previous charts if they exist
    myCharts.forEach(chart => chart.destroy());
    myCharts = [];

    // --- Logic for handling large datasets for line plots ---
    const nRuns = runData.length;
    const useMovingAverage = nRuns > 100;
    const windowSize = useMovingAverage ? Math.max(10, Math.floor(nRuns / 20)) : 1;
    
    // --- 1. Histogram - Final Efficiency (uses raw data) ---
    const finalEfficiencies = runData.map(d => d.final_efficiency * 100);
    const effBins = createHistogramData(finalEfficiencies, 20);
    const effCtx = document.getElementById('finalEfficiencyChart').getContext('2d');
    myCharts.push(new Chart(effCtx, {
        type: 'bar',
        data: {
            labels: effBins.map(b => b.label),
            datasets: [{
                label: 'Frequency',
                data: effBins.map(b => b.count),
                backgroundColor: 'rgba(102, 126, 234, 0.6)',
                borderColor: 'rgba(102, 126, 234, 1)',
                borderWidth: 1
            }]
        },
        options: {
            plugins: { title: { display: true, text: 'Final Efficiency Distribution (%)' } },
            scales: { x: { title: { display: true, text: 'Final Efficiency Bins' } }, y: { title: { display: true, text: 'Frequency' }, beginAtZero: true } }
        }
    }));

    // --- 2. Histogram - Days to Goal (uses raw data) ---
    const daysToGoal = runData.map(d => d.days_to_goal).filter(d => d !== Infinity && d > 0);
    const goalBins = createHistogramData(daysToGoal, 15);
    const goalCtx = document.getElementById('daysToGoalChart').getContext('2d');
    myCharts.push(new Chart(goalCtx, {
        type: 'bar',
        data: {
            labels: goalBins.map(b => b.label),
            datasets: [{
                label: 'Frequency',
                data: goalBins.map(b => b.count),
                backgroundColor: 'rgba(220, 53, 69, 0.6)',
                borderColor: 'rgba(220, 53, 69, 1)',
                borderWidth: 1
            }]
        },
        options: {
            plugins: { title: { display: true, text: 'Days to Reach Goal Distribution' } },
            scales: { x: { title: { display: true, text: 'Days to Goal Bins' } }, y: { title: { display: true, text: 'Frequency' }, beginAtZero: true } }
        }
    }));

    // --- Data for Line Plots (uses raw or smoothed data) ---
    const rawEfficiencyData = runData.map(d => d.final_efficiency * 100);
    const rawDaysData = runData.map(d => d.days_to_goal === Infinity ? null : d.days_to_goal);

    // For moving average, fill nulls with the last known value to avoid gaps in the average
    const filledDaysData = [];
    let lastVal = 0;
    for(const val of rawDaysData) {
        if(val !== null) {
            filledDaysData.push(val);
            lastVal = val;
        } else {
            filledDaysData.push(lastVal);
        }
    }

    const efficiencyLineData = useMovingAverage ? calculateMovingAverage(rawEfficiencyData, windowSize) : rawEfficiencyData;
    const daysLineData = useMovingAverage ? calculateMovingAverage(filledDaysData, windowSize) : rawDaysData;
    
    const lineLabels = useMovingAverage 
        ? Array.from({ length: efficiencyLineData.length }, (_, i) => `Run ${i * windowSize + 1}-${(i + 1) * windowSize}`)
        : runData.map(d => d.simulation_id + 1);
    
    const lineChartTitleSuffix = useMovingAverage ? ` (Moving Avg, Window=${windowSize})` : '';

    // --- 3. Line Plot - Final Efficiency over Simulations ---
    const effLineCtx = document.getElementById('efficiencyLineChart').getContext('2d');
    myCharts.push(new Chart(effLineCtx, {
        type: 'line',
        data: {
            labels: lineLabels,
            datasets: [{
                label: 'Final Efficiency',
                data: efficiencyLineData,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.1,
                pointRadius: useMovingAverage ? 2 : 1
            }]
        },
        options: {
            plugins: { title: { display: true, text: `Final Efficiency Over Simulations${lineChartTitleSuffix}` } },
            scales: { x: { title: { display: true, text: useMovingAverage ? 'Simulation Window' : 'Simulation ID' } }, y: { title: { display: true, text: 'Final Efficiency (%)' } } }
        }
    }));

    // --- 4. Line Plot - Days to Goal over Simulations ---
    const daysLineCtx = document.getElementById('daysToGoalLineChart').getContext('2d');
    myCharts.push(new Chart(daysLineCtx, {
        type: 'line',
        data: {
            labels: lineLabels,
            datasets: [{
                label: 'Days to Reach Goal',
                data: daysLineData,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                tension: 0.1,
                pointRadius: useMovingAverage ? 2 : 1,
                spanGaps: !useMovingAverage // Only show gaps in raw data view
            }]
        },
        options: {
            plugins: { title: { display: true, text: `Days to Goal Over Simulations${lineChartTitleSuffix}` } },
            scales: { x: { title: { display: true, text: useMovingAverage ? 'Simulation Window' : 'Simulation ID' } }, y: { title: { display: true, text: 'Days to Reach Goal' } } }
        }
    }));
}

/**
 * Creates histogram data from a dataset.
 * @param {number[]} data - The array of numbers.
 * @param {number} numBins - The number of bins to create.
 * @returns {object[]} An array of bin objects with labels and counts.
 */
function createHistogramData(data, numBins) {
    if (data.length === 0) return [];
    
    const min = Math.min(...data);
    const max = Math.max(...data);

    // Handle case where all data points are identical
    if (min === max) {
        return [{
            label: `${min.toFixed(1)}`,
            count: data.length,
            min: min,
            max: max
        }];
    }

    const binSize = (max - min) / numBins;
    const bins = Array.from({ length: numBins }, (_, i) => {
        const binMin = min + i * binSize;
        const binMax = min + (i + 1) * binSize;
        return {
            label: `${binMin.toFixed(1)}-${binMax.toFixed(1)}`,
            count: 0
        };
    });

    data.forEach(value => {
        // Determine which bin the value falls into
        let binIndex = Math.floor((value - min) / binSize);
        // Special case for the maximum value, which should fall into the last bin
        if (value === max) {
            binIndex = numBins - 1;
        }
        // Increment the count for the corresponding bin
        if (binIndex >= 0 && binIndex < numBins) {
            bins[binIndex].count++;
        }
    });

    return bins;
}

// Initialize event listeners
document.getElementById('badEvents').addEventListener('input', updateInitialEfficiency);
document.getElementById('duration').addEventListener('input', updateInitialEfficiency);

// Initialize the page
updateInitialEfficiency();