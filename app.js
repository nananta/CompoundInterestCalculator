document.addEventListener('DOMContentLoaded', function() {
    // Get references to DOM elements
    const calculatorForm = document.getElementById('calculator-form');
    const resultsChart = document.getElementById('results-chart');
    const themeSwitch = document.getElementById('theme-switch');
    
    // Theme handling
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    // Check for saved theme preference or use the system preference
    const savedTheme = localStorage.getItem('theme');
    let isDarkMode;
    
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        isDarkMode = savedTheme === 'dark';
        themeSwitch.checked = isDarkMode;
    } else {
        isDarkMode = prefersDarkScheme.matches;
        document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
        themeSwitch.checked = isDarkMode;
    }
    
    // Theme toggle event listener
    themeSwitch.addEventListener('change', function(e) {
        if (e.target.checked) {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            localStorage.setItem('theme', 'light');
        }
        calculateCompoundInterest(); // Update chart with new theme
    });
    
    // System theme change event listener
    prefersDarkScheme.addEventListener('change', function(e) {
        if (!localStorage.getItem('theme')) {
            isDarkMode = e.matches;
            themeSwitch.checked = isDarkMode;
            calculateCompoundInterest();
        }
    });
    
    // Get all input elements
    const inputElements = calculatorForm.querySelectorAll('input:not(#theme-switch), select');
    
    // Set chart colors based on theme
    const getChartColors = () => {
        const isDark = themeSwitch.checked;
        return {
            backgroundColor: isDark ? 'rgba(46, 204, 113, 0.1)' : 'rgba(46, 204, 113, 0.2)',
            borderColor: 'rgba(46, 204, 113, 1)',
            gridColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
            fontColor: isDark ? '#e0e0e0' : '#666'
        };
    };
    
    const chartColors = getChartColors();
    
    // Initialize the chart with empty data
    let chart = new Chart(resultsChart, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                {
                    label: 'Total Balance',
                    data: [],
                    backgroundColor: chartColors.backgroundColor,
                    borderColor: chartColors.borderColor,
                    borderWidth: 2,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Time Period',
                        color: chartColors.fontColor
                    },
                    grid: {
                        color: chartColors.gridColor
                    },
                    ticks: {
                        color: chartColors.fontColor
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Amount ($)',
                        color: chartColors.fontColor
                    },
                    grid: {
                        color: chartColors.gridColor
                    },
                    ticks: {
                        color: chartColors.fontColor,
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += '$' + context.parsed.y.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            });
                            return label;
                        }
                    }
                },
                legend: {
                    labels: {
                        color: chartColors.fontColor
                    }
                }
            }
        }
    });
    
    // Add event listener for form submission
    calculatorForm.addEventListener('submit', function(e) {
        e.preventDefault();
        calculateCompoundInterest();
    });
    
    // Add event listeners to all input elements
    inputElements.forEach(function(element) {
        element.addEventListener('change', calculateCompoundInterest);
        element.addEventListener('input', calculateCompoundInterest);
    });
    
    // Function to calculate compound interest and update the chart
    function calculateCompoundInterest() {
        // Update theme colors for chart
        const chartColors = getChartColors();
        
        // Update chart theme
        chart.data.datasets[0].backgroundColor = chartColors.backgroundColor;
        chart.options.scales.x.grid.color = chartColors.gridColor;
        chart.options.scales.y.grid.color = chartColors.gridColor;
        chart.options.scales.x.ticks.color = chartColors.fontColor;
        chart.options.scales.y.ticks.color = chartColors.fontColor;
        chart.options.scales.x.title.color = chartColors.fontColor;
        chart.options.scales.y.title.color = chartColors.fontColor;
        chart.options.plugins.legend.labels.color = chartColors.fontColor;
        
        // Get input values
        const initialInvestment = parseFloat(document.getElementById('initial-investment').value);
        const interestRate = parseFloat(document.getElementById('interest-rate').value) / 100;
        const compoundFrequency = parseInt(document.getElementById('compound-frequency').value);
        const timePeriod = parseInt(document.getElementById('time-period').value);
        const timeUnit = document.getElementById('time-unit').value;
        const additionalContribution = parseFloat(document.getElementById('additional-contribution').value);
        const contributionFrequency = parseInt(document.getElementById('contribution-frequency').value);
        
        // Convert time period to years if needed
        let timeInYears = timePeriod;
        if (timeUnit === 'months') {
            timeInYears = timePeriod / 12;
        }
        
        // Calculate total number of compound periods
        const totalCompoundPeriods = compoundFrequency * timeInYears;
        
        // Arrays to store data for chart
        const labels = [];
        const totalBalanceData = [];
        
        // Variables to track totals
        let balance = initialInvestment;
        let totalContributions = initialInvestment;
        let principalBalance = initialInvestment;
        
        // Determine how many data points to show on the chart
        // For more frequent compounding, we don't want to show every single period
        const maxDataPoints = 100;
        const dataPointInterval = Math.max(1, Math.floor(totalCompoundPeriods / maxDataPoints));
        
        // Calculate compound interest over time
        for (let i = 0; i <= totalCompoundPeriods; i++) {
            // Calculate interest for this period
            if (i > 0) {
                // Apply interest directly at the specified compound frequency 
                // without annual conversion
                const interestForPeriod = balance * interestRate;
                balance += interestForPeriod;
                
                // Add contribution if applicable
                if (contributionFrequency > 0) {
                    // Calculate contributions per compound period
                    const contributionsPerCompound = contributionFrequency / compoundFrequency;
                    const contributionAmount = contributionsPerCompound * additionalContribution;
                    
                    balance += contributionAmount;
                    principalBalance += contributionAmount;
                    totalContributions += contributionAmount;
                }
            }
            
            // Only add data points at regular intervals to avoid overcrowding the chart
            if (i % dataPointInterval === 0 || i === totalCompoundPeriods) {
                // Calculate years for display
                const yearsPassed = i / compoundFrequency;
                
                // Format the label
                let periodLabel;
                if (yearsPassed < 1) {
                    // For periods less than a year, show months
                    const monthsPassed = Math.round(yearsPassed * 12);
                    periodLabel = monthsPassed === 1 ? '1 Month' : `${monthsPassed} Months`;
                } else {
                    // For years, use decimal for partial years
                    const years = yearsPassed.toFixed(1);
                    periodLabel = years === '1.0' ? '1 Year' : `${years} Years`;
                }
                
                // Add data point
                labels.push(periodLabel);
                totalBalanceData.push(balance);
            }
        }
        
        // Update chart with new data
        chart.data.labels = labels;
        chart.data.datasets[0].data = totalBalanceData;
        chart.update();
        
        // Update summary section
        document.getElementById('final-balance').textContent = formatCurrency(balance);
        document.getElementById('total-interest').textContent = formatCurrency(balance - totalContributions);
        document.getElementById('total-contributions').textContent = formatCurrency(totalContributions);
    }
    
    // Helper function to format currency
    function formatCurrency(value) {
        return '$' + value.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }
    
    // Calculate initial results
    calculateCompoundInterest();
}); 