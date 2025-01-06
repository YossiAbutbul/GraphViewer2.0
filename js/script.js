document.addEventListener('DOMContentLoaded', () => {
    // Store references to chart instances
    let azimuthGraph, elevationGraph;

    // Data storage variables
    let rawData = [];
    let elevationData = [];
    let h_factor = 1;
    let v_factor = 1;

    function changeHexOpacity(hexColor) {
        // Validate and sanitize the input
        const hex = hexColor.replace('#', '');
    
        if (hex.length !== 6 && hex.length !== 8) {
            throw new Error('Invalid hex color format. Expected #RRGGBB or #RRGGBBAA.');
        }
    
        // Extract the RGB part
        const rgbPart = hex.length === 6 ? hex : hex.slice(0, 6);
    
        // Calculate the alpha value for 0.3 opacity
        const alphaHex = Math.round(0.3 * 255).toString(16).padStart(2, '0');
    
        // Return the new hex color with updated alpha
        return `#${rgbPart}${alphaHex}`;
    }
    

    const chartBgColorLeft = 'rgba(0, 194, 155, 0.5)';   
    const chartBorderColorLeft = 'rgba(0, 194, 155, 1)';       

    const chartBgColorRight = 'rgba(63, 166, 146, 0.5)';    
    const chartBorderColorRight = 'rgba(63, 166, 146, 1)';       


    // Function to create the radar chart
    const createRadarChart = (ctx, data, labels, title, backgroundColor, borderColor, suggestedMin, suggestedMax) => {
        const canvas = ctx.canvas;
        canvas.height = 500; 
    
        return new Chart(ctx, {
            type: 'radar',
            data: {
                labels: labels,
                datasets: [{
                    label: title,
                    showLabelBackdrop: false,
                    data: data,
                    backgroundColor: backgroundColor,
                    borderColor: borderColor,
                    borderWidth: 3,
                    pointRadius: 2,
                }],
            },
            options: {
                animation: {
                    duration: 500,
                    easing: 'easeOutCubic',
                },
                responsive: true,
                plugins: {
                    legend: {
                        display: false,
                    },
                    title: {
                        display: true,
                        text: title,
                        color: 'rgba(26, 26, 26, 1)',
                        font: {
                            family: 'Inter, sans-serif',
                            size: '24em',
                            weight: '600',
                        },
                        padding: {
                            top: 20,
                            bottom: 30,
                        },
                    },
                    tooltip: {
                        displayColors: false,
                        callbacks: {
                            title: () => '',
                            label: (tooltipItem) => {
                                const label = tooltipItem.label; // Get the point label
                                const value = tooltipItem.raw.toFixed(2);   // Get the data value
                                return [`Angle: ${label}`,`Value: ${value} [dBm]`];
                            }
                        }
                    },
                },
                scales: {
                    r: {
                        angleLines: { color: 'rgba(26, 26, 26, 0.2)' },
                        grid: { color: 'rgba(26, 26, 26, 0.2)' },
                        ticks: { 
                            color: 'rgba(0, 0, 0, 1)', 
                            showLabelBackdrop: false,
                        },
                        suggestedMin: suggestedMin,
                        suggestedMax: suggestedMax,
                        pointLabels: { color: 'rgba(26, 26, 26, 1)' },
                    },
                },
                onHover: (event, chartElement) => {
                    const points = chartElement[0];
                    canvas.style.cursor = points ? 'pointer' : 'default';
                },
            },
        });
    };
    
    
   
    // Function to handle point click and show popup for value change
    const handlePointClick = (event, chart) => {
        const points = chart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, false);
        if (points.length) {
            const point = points[0];
            const datasetIndex = point.datasetIndex;
            const index = point.index;
            const currentValue = chart.data.datasets[datasetIndex].data[index];

            const newValue = prompt('Enter new value:', currentValue);
            if (newValue !== null) {
                const parsedValue = parseFloat(newValue);
                if (!isNaN(parsedValue)) {
                    chart.data.datasets[datasetIndex].data[index] = parsedValue;
                    chart.update();
                } else {
                    alert('Invalid input. Please enter a valid number.');
                }
            }
        }
    };

    // Add event listeners to the radar charts for point click
    document.getElementById('leftRadarChart').addEventListener('click', (event) => {
        handlePointClick(event, azimuthGraph);
    });

    document.getElementById('rightRadarChart').addEventListener('click', (event) => {
        handlePointClick(event, elevationGraph);
    });
    

    // Function to initialize radar charts with default values
    const initializeRadarCharts = () => {
        const defaultLabels = ['0°', '15°', '30°', '45°', '60°', '75°', '90°', '105°', '120°', '135°', '150°', '165°', '180°', '195°', '210°', '225°', '240°', '255°', '270°', '285°', '300°', '315°', '330°', '345°'];
        const defaultData = [];

        const polariztion = document.getElementById('polarity').value;
        const theta = document.getElementById('theta').value;
        const minAzimuth = -10;
        const maxAzimuth = 0;
        console.log(minAzimuth, maxAzimuth);

        const azimuthCtx = document.getElementById('leftRadarChart').getContext('2d');
        azimuthGraph = createRadarChart(azimuthCtx, defaultData, defaultLabels, 'Azimuth' + (polariztion === 'vertical' ? ' (V. Polariztion)' : ' (H. Polariztion)') + ' at θ = ' + theta + '°', chartBgColorLeft, chartBorderColorLeft, minAzimuth, maxAzimuth);

        const rightCtx = document.getElementById('rightRadarChart').getContext('2d');
        elevationGraph = createRadarChart(rightCtx, defaultData, defaultLabels, ('Elevation (V Polariztion)'), chartBgColorRight, chartBorderColorRight, minAzimuth, maxAzimuth);
    };

    // Function to update radar charts
    const updateCharts = () => {
        console.log("Data Updated!");
        const theta = document.getElementById('theta').value; // Get selected theta value
        const azimuthData = rawData.filter(row => row[0] === theta); // Filter azimuth data for selected theta

        const thetaLabels = ['0°', '15°', '30°', '45°', '60°', '75°', '90°', '105°', '120°', '135°', '150°', '165°', '180°', '195°', '210°', '225°', '240°', '255°', '270°', '285°', '300°', '315°', '330°', '345°'];
        const horizontalData = azimuthData.map(row => parseFloat(row[2]) + h_factor);
        const verticalData = azimuthData.map(row => parseFloat(row[3]) + v_factor);
        const elevationDataSorted = elevationData.map(row => parseFloat(row[3]) + v_factor);

        const polarity = document.getElementById('polarity').value;
        const inputValue = (polarity === 'vertical' ? v_factor : h_factor);
        document.getElementById('factorValue').value = inputValue;

        const maxHorizontal = Math.max(...horizontalData);
        const maxVertical = Math.max(...verticalData);
        const maxElevation = Math.max(...elevationDataSorted);

        const minHorizontal = Math.min(...horizontalData);
        const minVertical = Math.min(...verticalData);
        const minElevation = Math.min(...elevationDataSorted);

        const avgHorizontal = horizontalData.reduce((a, b) => a + b, 0) / horizontalData.length;
        const avgVertical = verticalData.reduce((a, b) => a + b, 0) / verticalData.length;
        const avgElevation = elevationDataSorted.reduce((a, b) => a + b, 0) / elevationDataSorted.length;

        const minRefAzimuth = document.getElementById('min-ref-azimuth').value;
        const maxRefAzimuth = document.getElementById('max-ref-azimuth').value;
        const minRefElevation = document.getElementById('min-ref-elevation').value;
        const maxRefElevation = document.getElementById('max-ref-elevation').value;

        const azimuthColorPicker = document.querySelector('#azimuthColorPicker');
        const elevationColorPicker = document.querySelector('#elevationColorPicker');
        const rgbaBorderColortAzimuth = azimuthColorPicker.value;
        const rgbaBorderColortElevation = elevationColorPicker.value;
        const regabgBgColorAzimuth = changeHexOpacity(rgbaBorderColortAzimuth);
        const rgbaBgColorElevation = changeHexOpacity(rgbaBorderColortElevation);


        if (azimuthGraph) azimuthGraph.destroy();
        if (elevationGraph) elevationGraph.destroy();

        const polariztion = document.getElementById('polarity').value;
        const leftCtx = document.getElementById('leftRadarChart').getContext('2d');
        azimuthGraph = createRadarChart(
            leftCtx,
            polariztion === 'vertical' ? verticalData : horizontalData,
            thetaLabels,
            'Azimuth' + (polariztion === 'vertical' ? ' (V. Polariztion)' : ' (H. Polariztion)') + ' at θ = ' + theta + '°', regabgBgColorAzimuth, rgbaBorderColortAzimuth, minRefAzimuth, maxRefAzimuth
        );

        const rightCtx = document.getElementById('rightRadarChart').getContext('2d');
        elevationGraph = createRadarChart(rightCtx, elevationDataSorted, thetaLabels, 'Elevation (V Polariztion)', rgbaBgColorElevation, rgbaBorderColortElevation, minRefElevation, maxRefElevation);

        // Insert min max avg to the table
        // Validate and update azimuth power values
        if (!isNaN(polariztion === 'vertical' ? minVertical : minHorizontal) && isFinite(polariztion === 'vertical' ? minVertical : minHorizontal)) {
            document.getElementById('azimuth-min-power').textContent  = (polariztion === 'vertical' ? minVertical : minHorizontal).toFixed(2);
        }
        if (!isNaN(polariztion === 'vertical' ? maxVertical : maxHorizontal) && isFinite(polariztion === 'vertical' ? maxVertical : maxHorizontal)) {
            document.getElementById('azimuth-max-power').textContent  = (polariztion === 'vertical' ? maxVertical : maxHorizontal).toFixed(2);
        }
        if (!isNaN(polariztion === 'vertical' ? avgVertical : avgHorizontal) && isFinite(polariztion === 'vertical' ? avgVertical : avgHorizontal)) {
            document.getElementById('azimuth-avg-power').textContent  = (polariztion === 'vertical' ? avgVertical : avgHorizontal).toFixed(2);
        }

        // Validate and update elevation power values
        if (!isNaN(minElevation) && isFinite(minElevation)) {
            document.getElementById('elevation-min-power').textContent  = minElevation.toFixed(2);
        }
        if (!isNaN(maxElevation) && isFinite(maxElevation)) {
            document.getElementById('elevation-max-power').textContent  = maxElevation.toFixed(2);
        }
        if (!isNaN(avgElevation) && isFinite(avgElevation)) {
            document.getElementById('elevation-avg-power').textContent  = avgElevation.toFixed(2);
        }


        const gridValuesElvaztion = getGridValues(elevationGraph);
        const gridValuesAzimuth = getGridValues(azimuthGraph);

        document.getElementById('max-ref-elevation').value = gridValuesElvaztion.max;
        document.getElementById('min-ref-elevation').value = gridValuesElvaztion.min;
        document.getElementById('max-ref-azimuth').value = gridValuesAzimuth.max;
        document.getElementById('min-ref-azimuth').value = gridValuesAzimuth.min;


        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = `Test Frequency: ${testFrequency} MHz`;
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.remove();
        }, 3000);

    };

    const getGridValues = (chart) => {
        // Access the dynamically calculated scale values after rendering
        const scale = chart.scales.r;
        if (!scale) {
            console.error("Scale 'r' not found on the chart.");
            return { min: null, max: null };
        }
        
        const min = scale.min; // Dynamically calculated minimum value
        const max = scale.max; // Dynamically calculated maximum value

        return { min, max };
    };
    


    // Function to process file data
    let testFrequency; 

    const processFile = (file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const fileContent = e.target.result;
                const lines = fileContent.split('\n');
                h_factor = parseFloat(lines[46]?.split(/\s+/)[6] || 0);
                v_factor = parseFloat(lines[47]?.split(/\s+/)[6] || 0);
                
                const frequencyLine = lines.find(line => line.includes('Test Frequency'));
                if (frequencyLine) {
                    testFrequency = parseFloat(frequencyLine.split(/\s+/)[2]); // Assign to global variable
                    const notification = document.createElement('div');
                    notification.className = 'notification';
                    notification.textContent = `Test Frequency: ${testFrequency} MHz`;
                    document.body.appendChild(notification);
                    setTimeout(() => {
                        notification.remove();
                    }, 3000);
                    console.log(`Test Frequency: ${testFrequency} MHz`);
                } else {
                    console.warn('Test Frequency line not found.');
                }
    
                rawData = lines.slice(54).map(line => line.trim().split(/\s+/)); // Store raw data
                elevationData = processAndSortElevationData(lines.slice(54));
                console.log('Data processed successfully');
                updateCharts();
            } catch (error) {
                console.error('Error reading file:', error);
                alert('Error reading file. Please check the file format and try again.');
            }
        };
        reader.readAsText(file);
    };
    

    
    const processAndSortElevationData = (measuredData) => {
        // Handle file format that starts from 0°
        if(measuredData.length === 289) {
            const elevation = [];
            elevation.push(measuredData[0].trim().split(/\s+/));
            let k = 0;
            for (let i = 0; i < 22; i++) {
                elevation.push(measuredData[24 + k].trim().split(/\s+/));
                k += 12;
            }

            // Sort the data by the second column
            let sortedData = elevation.sort((a, b) => {
                return parseInt(parseFloat(a[1])) - parseInt(parseFloat(b[1]));
            });

            const firstHalf = sortedData.slice(0, 12);
            let firstHalfSorted = firstHalf.sort((a, b) => {
                return parseInt(parseFloat(b[0])) - parseInt(parseFloat(a[0]));
            });

            const secondHalf = sortedData.slice(12, 24);
            let finalElevationData = firstHalfSorted.concat(secondHalf);
            finalElevationData.splice(0, 0, ['180', '180', '-70', '-70']);
            console.log(finalElevationData);

            return finalElevationData;
        };
        // Handle file format that strats from 15°
        if(measuredData.length === 265) {
            const elevation = [];
            // elevation.push(measuredData[0].trim().split(/\s+/));
            let k = 0;
            for (let i = 0; i < 22; i++) {
            elevation.push(measuredData[k].trim().split(/\s+/));
            k += 12;
            }

            // Sort the data by the second column
            let sortedData = elevation.sort((a, b) => {
            return parseInt(parseFloat(a[1])) - parseInt(parseFloat(b[1]));
            });

            const firstHalf = sortedData.slice(0, 12);
            let firstHalfSorted = firstHalf.sort((a, b) => {
            return parseInt(parseFloat(b[0])) - parseInt(parseFloat(a[0]));
            });

            const secondHalf = sortedData.slice(12, 24);
            let finalElevationData = firstHalfSorted.concat(secondHalf);
            finalElevationData.splice(0, 0, ['180', '180', '-70', '-70']);
            finalElevationData.splice(12, 0, ['0', '0', '-70', '-70']);
            console.log(finalElevationData);

            return finalElevationData;
        } else {
            console.log('Invalid data format');
        }
    }
        

    // Initialize radar charts
    initializeRadarCharts();

    // File input change event
    document.getElementById('fileInput').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            processFile(file);
            document.getElementById('file-path').value = file.name; // Display file name
            document.getElementById('file-path').disabled = true;
            viewGraphBtn.disabled = false; // Enable view button
        }
    });

    // View graph button click event
    document.getElementById('viewGraphBtn').addEventListener('click', updateCharts);

    // Button to open file input
    document.getElementById('openDataFileBtn').addEventListener('click', () => {
        document.getElementById('fileInput').click();
    });
    // Event listener for pressing Enter key to update the graph
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
            // Remove focus from any currently focused element
            document.activeElement.blur();
            
            // Trigger the chart update
            updateCharts();
        }
    });


    // Event listener to select all text in input fields when focused
    document.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
        input.addEventListener('focus', function() {
            this.select(); // Select the text inside the input field when focused
        });
    });

    
      
});
