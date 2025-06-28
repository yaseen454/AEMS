# Adaptive Efficiency Monitor Simulator (AEMS)

The **Adaptive Efficiency Monitor Simulator (AEMS)** is a web-based application designed to track and forecast performance metrics using an **Exponentially Weighted Moving Average (EWMA)** model. It provides users with a dynamic, interactive interface to simulate efficiency trends, analyze historical data, and predict future performance based on customizable event-driven scenarios. AEMS is ideal for applications in personal productivity, quality control, health tracking, and business metrics.

The live version of the application is available at: [https://adaptive-efficiency-monitor.netlify.app/](https://adaptive-efficiency-monitor.netlify.app/).

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [How It Works](#how-it-works)
- [EWMA Model](#ewma-model)
- [Daily Performance Calculation](#daily-performance-calculation)
- [Forecasting](#forecasting)
- [Technology Stack](#technology-stack)
- [Installation and Setup](#installation-and-setup)
- [Usage Guide](#usage-guide)
- [Simulator Tab](#simulator-tab)
- [How It Works Tab](#how-it-works-tab)
- [Running a Simulation](#running-a-simulation)
- [Running Aggregate Analysis](#running-aggregate-analysis)
- [Example Scenario](#example-scenario)
- [File Structure](#file-structure)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## Overview

AEMS allows users to input historical performance data, define event types with associated severity scores, and simulate future performance over a specified period. The application uses an EWMA algorithm to provide adaptive scoring, giving more weight to recent performance while retaining historical context. Users can run single simulations to see day-by-day progress or perform aggregate analyses across multiple simulations to understand performance trends and probabilities.

The application is particularly useful for:

- **Personal Productivity**: Tracking habits, mistakes, or goal achievement.
- **Quality Control**: Monitoring defects or process failures.
- **Health & Wellness**: Tracking dietary lapses or medication adherence.
- **Business Metrics**: Measuring customer satisfaction or operational efficiency.

## Key Features

- **Adaptive Scoring**: Uses EWMA to weigh recent performance more heavily.
- **Event-Based Tracking**: Allows users to define custom events with severity scores.
- **Predictive Forecasting**: Estimates the number of perfect time units (e.g., days) needed to reach a target efficiency.
- **Dynamic Simulation**: Generates realistic scenarios based on user-defined probabilities.
- **Aggregate Analysis**: Runs multiple simulations to provide statistical insights, including histograms and line charts.
- **Interactive UI**: Features a responsive, modern interface with real-time updates and visualizations.
- **Open Source**: Available on GitHub for contributions and customization.
- **Flexible Time Units**: Supports customizable time units (e.g., seconds, minutes, hours, days, weeks, months, quarters, years) for broader applicability.

## How It Works

### EWMA Model

The Exponentially Weighted Moving Average (EWMA) algorithm calculates efficiency by assigning exponentially decreasing weights to older performance data. The formula is:

```
New Efficiency = α × Performance per Unit + (1 - α) × Previous Efficiency
```

Where:

- **α (alpha)**: Smoothing factor (0 < α ≤ 1). Higher values make the model more responsive to recent changes, while lower values provide stability.
- **Performance per Unit**: A score between 0 and 1, calculated based on the events in the selected time unit.
- **Previous Efficiency**: The efficiency score from the previous time unit.

### Daily Performance Calculation

Performance for a given time unit is determined by the total severity of events that occur, relative to a user-defined maximum severity:

```
Performance per Unit = 1 - (Total Severity / Max Severity per Unit)
```

- **Perfect Unit**: No events occur, resulting in a performance score of 1 (100%).
- **Worst Unit**: Total severity equals or exceeds the maximum, resulting in a score of 0 (0%).
- **Other Units**: Performance is proportional to the severity of events.

### Forecasting

AEMS forecasts the number of consecutive perfect time units needed to reach a target efficiency using the following formula:

```
Units Needed = ⌈ln((1 - Target Efficiency) / (1 - Current Efficiency)) / ln(1 - α)⌉
```

This provides a realistic estimate of the effort required to achieve a performance goal.

## Technology Stack

- **HTML5**: Structure of the web application.
- **CSS3**: Styling, including responsive design with Tailwind-inspired gradients and animations.
- **JavaScript**: Core logic, including the Efficiency Monitor class and Chart.js for visualizations.
- **Chart.js**: For rendering histograms and line charts in aggregate analysis.
- **MathJax**: For rendering mathematical formulas in the "How It Works" tab.
- **Netlify**: Hosting the live deployment.

## Installation and Setup

To run AEMS locally, follow these steps:

1. **Clone the Repository**:

   ```bash
   git clone https://github.com/yaseen454/adaptive-efficiency-monitor.git
   cd adaptive-efficiency-monitor
   ```

2. **Open the Project**:
   Since AEMS is a static web application, no server setup is required. Simply open `index.html` in a modern web browser (e.g., Chrome, Firefox).
3. **Optional: Use a Local Server**:
   For a better development experience, you can use a local server. For example, with Python:

   ```bash
   python -m http.server 8000
   ```

   Then, navigate to `http://localhost:8000` in your browser.
4. **Dependencies**:
   - The application uses Chart.js and MathJax via CDNs, so no additional installations are needed.
   - Ensure you have an internet connection for the CDNs to load.

## Usage Guide

### Simulator Tab

The **Simulator** tab is the main interface for running simulations. It includes several sections:

1. **Historical Data**:
   - **Number of Bad Events**: Enter the number of negative events in your historical data (e.g., days with issues).
   - **Total Duration**: Specify the time period for your historical data, in the selected time unit.
   - **Unit of Time**: Choose the time unit (e.g., seconds, minutes, hours, days, weeks, months, quarters, years).
   - The initial efficiency is calculated as: `1 - (Bad Events / Duration)` and displayed as a percentage with a progress bar.
2. **Simulation Parameters**:
   - **Units to Simulate**: Number of time units to run the simulation (1–365).
   - **Max Severity per Unit**: The maximum severity score for a single time unit.
   - **Target Efficiency**: The desired efficiency percentage (0–100%).
   - **Smoothing Factor (α)**: Controls the responsiveness of the EWMA model (0.01–1).
   - **Perfect Unit Probability**: The likelihood of a time unit with no events (0–100%).
   - **Second Event Probability**: The chance of a second random event occurring (0–100%).
3. **Event Severity Profile**:
   - Define event types (e.g., "Minor Issue") and their severity scores.
   - Add or remove events using the "Add Event Type" and "Remove" buttons.
4. **Simulation Controls**:
   - **Run Simulation**: Starts a single simulation, displaying unit-by-unit results and statistics.
   - **Clear Output**: Resets the simulation output.
5. **Aggregate Analysis**:
   - **Number of Simulations**: Specify how many simulations to run (10–10,000).
   - **Max Events Per Unit**: Set the maximum number of events per time unit for the analysis.
   - **Use Perfect/Second Event Probabilities**: Toggle whether to use the defined probabilities in aggregate analysis.
   - **Run Aggregate Analysis**: Executes multiple simulations and displays statistical summaries and charts.

### How It Works Tab

This tab provides a detailed explanation of the AEMS methodology, including:

- The EWMA formula and its parameters.
- How performance per time unit is calculated.
- The forecasting algorithm with a mathematical proof.
- Practical applications and a step-by-step example.
- A plot visualizing EWMA convergence for different α values.

### Running a Simulation

1. Enter historical data (e.g., 42 bad events over 120 days).
2. Select a time unit (e.g., days).
3. Set simulation parameters (e.g., 25 days, max severity of 10, α = 0.04).
4. Define at least one event type in the severity profile.
5. Click **Run Simulation** to view the unit-by-unit output, including:
   - Events that occurred.
   - Performance per time unit.
   - Current efficiency.
   - Forecasted units to reach the target.
6. Review the final summary and statistics, such as final efficiency and perfect units.

### Running Aggregate Analysis

1. Configure the same parameters as for a single simulation.
2. Specify the number of simulations and max events per time unit.
3. Choose whether to use perfect/second event probabilities.
4. Click **Run Aggregate Analysis** to generate:
   - Statistical summaries (e.g., average final efficiency, goal achievement rate).
   - Charts:
     - Histogram of final efficiencies.
     - Histogram of units to goal.
     - Line plot of final efficiencies over simulations.
     - Line plot of units to goal over simulations.

### Example Scenario

Suppose you want to track your study focus over a 120-day period, where you had 42 days with distractions. Here's how to use AEMS:

1. **Historical Data**:
   - Bad Events: 42
   - Duration: 120 days
   - Time Unit: Days
   - Initial Efficiency: `(1 - 42/120) × 100 = 65%`
2. **Event Severity Profile**:
   - "Minor Distraction": Severity 1
   - "Major Procrastination": Severity 4
3. **Simulation Parameters**:
   - Units to Simulate: 25 days
   - Max Severity per Unit: 10
   - Target Efficiency: 85%
   - Smoothing Factor: 0.04
   - Perfect Unit Probability: 40%
   - Second Event Probability: 35%
4. **Run Simulation**:
   - The output shows daily events, performance, and efficiency updates.
   - For example, a day with "Major Procrastination" (severity 4) has a performance of `1 - (4/10) = 60%`.
   - The new efficiency is calculated as: `0.04 × 60% + 0.96 × 65% ≈ 64.8%`.
   - The forecast might indicate 21 perfect days needed to reach 85%.
5. **Run Aggregate Analysis**:
   - Set 100 simulations with a max of 5 events per day.
   - Review charts and stats to understand the distribution of outcomes.

## File Structure

```
adaptive-efficiency-monitor/
├── index.html        # Main HTML file with flexible time unit support
├── script.js         # JavaScript logic (Efficiency Monitor class, simulation functions, time unit handling)
├── style.css         # CSS styles for the application
├── data/             # Static assets (e.g., favicon, EWMA plot)
└── README.md         # Project documentation
```

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository on GitHub: [https://github.com/yaseen454/AEMS](https://github.com/yaseen454/AEMS).
2. Create a new branch for your feature or bug fix.
3. Submit a pull request with a clear description of your changes.
Please ensure your code follows the existing style and includes appropriate comments.

## License

This project is licensed under the MIT License. See the [LICENSE](/LICENSE.md) file for details.

## Contact

For questions or feedback, contact the project maintainer:

- GitHub: [yaseen454](https://github.com/yaseen454)
- Email: (Please refer to the GitHub profile for contact details)

---
Thank you for using AEMS! We hope it helps you track and improve your performance effectively.
