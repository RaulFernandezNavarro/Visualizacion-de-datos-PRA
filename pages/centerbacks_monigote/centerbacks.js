document.addEventListener("DOMContentLoaded", function() {
    const allowedColumns = ["AerWon%", "Min", "Goals", "Age", "MP", "90s", "Starts", "PasTotCmp%", "Assists", "TklWon", "Blocks", "Int", "Tkl+Int", "Clr", "Fls", "PKcon", "OG", "Recov" ];
    const allowedHistogramColumns = ["AerWon%", "Min", "Goals", "Age", "MP", "90s", "Starts", "PasTotCmp%", "Assists", "TklWon", "Blocks", "Int", "Tkl+Int", "Clr", "Fls", "PKcon", "OG", "Recov" ];
    const defaultX = "TklWon";
    const defaultY = "AerWon%";
    const defaultSize = "Min";
    const defaultHistogram = "Tkl+Int";

    const margin = { top: 50, right: 30, bottom: 70, left: 60 };
    let bubbleWidth, bubbleHeight, histogramWidth, histogramHeight;
    let currentX = defaultX;
    let currentY = defaultY;
    let currentSize = defaultSize;
    let currentHistogram = defaultHistogram;
    let activePlayer = null; // Store the currently selected player

    function updateDimensions() {
        bubbleWidth = window.innerWidth - margin.left - margin.right;
        bubbleHeight = window.innerHeight - margin.top - margin.bottom - document.querySelector('.select-container').offsetHeight - 20;
        histogramWidth = window.innerWidth / 2 - margin.left - margin.right;
        histogramHeight = 400;
    }

    // Populate dropdowns with allowed columns and set default values
    function populateDropdown(id, columns, defaultValue) {
        const select = document.getElementById(id);
        select.innerHTML = ''; // Clear existing options
        columns.forEach(column => {
            const option = document.createElement("option");
            option.value = column;
            option.text = column;
            if (column === defaultValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }

    populateDropdown("x-axis-select", allowedColumns, defaultX);
    populateDropdown("y-axis-select", allowedColumns, defaultY);
    populateDropdown("size-select", allowedColumns, defaultSize);
    populateDropdown("histogram-select", allowedHistogramColumns, defaultHistogram);

    function createBubbleSvg(width, height) {
        return d3.select("#bubble-chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    }

    function createHistogramSvg(width, height) {
        return d3.select("#histogram-chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    }

    function resize() {
        updateDimensions();

        d3.select("#bubble-chart").select("svg").remove();
        d3.select("#histogram-chart").select("svg").remove();

        // Redraw everything with new dimensions
        createBubbleChart(data, currentX, currentY, currentSize);
        createHistogram(data, currentHistogram, activePlayer);

        // Adjust hero section
        adjustHeroSection();
    }

    window.addEventListener("resize", resize);

    function adjustHeroSection() {
        const heroSection = document.querySelector('.hero-section');
        const heroImage = document.querySelector('.hero-image');
        heroSection.style.height = `${window.innerHeight}px`;
        heroImage.style.height = `${window.innerHeight}px`;
    }

    // Initial adjustments
    updateDimensions();
    adjustHeroSection();

    let data;

    // Load the CSV data
    d3.csv("../../resources/data/merged_df_2.csv").then(function(csvData) {
        data = csvData.filter(d => d.player_positions === "CB").sort((a, b) => d3.descending(+a.Min, +b.Min));

        // Add a unique id to each data point
        data.forEach((d, i) => d.id = i);

        // Create bubble chart
        createBubbleChart(data, currentX, currentY, currentSize);
        createHistogram(data, currentHistogram, activePlayer);
        createHeightGraph(data);
        initializeSearchBox(data);

        // Update bubble chart on dropdown change
        d3.select("#x-axis-select").on("change", function() {
            currentX = d3.select("#x-axis-select").property("value");
            updateBubbleChart(data, currentX, currentY, currentSize);
        });

        d3.select("#y-axis-select").on("change", function() {
            currentY = d3.select("#y-axis-select").property("value");
            updateBubbleChart(data, currentX, currentY, currentSize);
        });

        d3.select("#size-select").on("change", function() {
            currentSize = d3.select("#size-select").property("value");
            updateBubbleChart(data, currentX, currentY, currentSize);
        });

        // Update histogram on dropdown change
        d3.select("#histogram-select").on("change", function() {
            currentHistogram = d3.select("#histogram-select").property("value");
            updateHistogram(data, currentHistogram, activePlayer);
        });
    });

    function validateImageUrl(url, callback) {
        const img = new Image();
        img.onload = function() {
            callback(url);
        };
        img.onerror = function() {
            callback("../../resources/img/no-pic.png");
        };
        img.src = url;
    }

    function createBubbleChart(data, xColumn, yColumn, sizeColumn) {
        const filteredData = filterOutliers(data, xColumn, yColumn, sizeColumn);
        const svg = createBubbleSvg(bubbleWidth, bubbleHeight);
    
        const x = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => +d[xColumn])])
            .range([0, bubbleWidth - margin.right]);
        const xAxis = svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${bubbleHeight})`)
            .call(d3.axisBottom(x));
    
        const y = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => +d[yColumn])])
            .range([bubbleHeight, 0]);
        const yAxis = svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));
    
        const size = d3.scaleSqrt()
            .domain([0, d3.max(filteredData, d => +d[sizeColumn])])
            .range([0, 50]);
    
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    
        const nodes = filteredData.map(d => ({
            ...d,
            xPos: x(d[xColumn]),
            yPos: y(d[yColumn]),
            radius: size(+d[sizeColumn])
        }));
    
        const node = svg.selectAll("g.node")
            .data(nodes, d => d.id);
    
        const nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.xPos},${d.yPos})`)
            .on("click", (event, d) => {
                event.stopPropagation();
                addPlayerTag(d, data);
                displayPlayerProfile(d, data); // Use the displayPlayerProfile function from profile.js
                document.getElementById('player-info').classList.add('show');
            });
    
        nodeEnter.append("circle")
            .attr("r", 0)
            .attr("fill", d => colorScale(d.league_name))
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2)
            .transition()
            .duration(1000)
            .attr("r", d => d.radius);
    
        nodeEnter.each(function(d) {
            validateImageUrl(d.player_face_url, function(validatedUrl) {
                d3.select(this).append("image")
                    .attr("xlink:href", validatedUrl)
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", 0)
                    .attr("height", 0)
                    .transition()
                    .duration(1000)
                    .attr("x", -d.radius)
                    .attr("y", -d.radius)
                    .attr("width", d.radius * 2)
                    .attr("height", d.radius * 2)
                    .attr("clip-path", "circle()");
            }.bind(this));
        });
    
        const nodeUpdate = node.merge(nodeEnter);
    
        nodeUpdate.transition()
            .duration(1000)
            .attr("transform", d => `translate(${x(d[xColumn])},${y(d[yColumn])})`);
    
        nodeUpdate.select("circle")
            .transition()
            .duration(1000)
            .attr("r", d => d.radius);
    
        nodeUpdate.each(function(d) {
            validateImageUrl(d.player_face_url, function(validatedUrl) {
                d3.select(this).select("image")
                    .transition()
                    .duration(1000)
                    .attr("x", -d.radius)
                    .attr("y", -d.radius)
                    .attr("width", d.radius * 2)
                    .attr("height", d.radius * 2)
                    .attr("xlink:href", validatedUrl);
            }.bind(this));
        });
    
        node.exit().transition()
            .duration(1000)
            .attr("r", 0)
            .remove();
    }
    
    function updateBubbleChart(data, xColumn, yColumn, sizeColumn) {
        const filteredData = filterOutliers(data, xColumn, yColumn, sizeColumn);
        const svg = d3.select("#bubble-chart").select("svg");
    
        const x = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => +d[xColumn])])
            .range([0, bubbleWidth - margin.right]);
        const xAxis = svg.select(".x-axis")
            .transition()
            .duration(1000)
            .call(d3.axisBottom(x));
    
        const y = d3.scaleLinear()
            .domain([0, d3.max(filteredData, d => +d[yColumn])])
            .range([bubbleHeight, 0]);
        const yAxis = svg.select(".y-axis")
            .transition()
            .duration(1000)
            .call(d3.axisLeft(y));
    
        const size = d3.scaleSqrt()
            .domain([0, d3.max(filteredData, d => +d[sizeColumn])])
            .range([0, 50]);
    
        const nodes = filteredData.map(d => ({
            ...d,
            xPos: x(d[xColumn]),
            yPos: y(d[yColumn]),
            radius: size(+d[sizeColumn])
        }));
    
        const node = svg.selectAll("g.node")
            .data(nodes, d => d.id);
    
        const nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${x(d[xColumn])},${y(d[yColumn])})`);
    
        nodeEnter.append("circle")
            .attr("r", 0)
            .attr("fill", d => d3.scaleOrdinal(d3.schemeCategory10)(d.league_name))
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2)
            .transition()
            .duration(1000)
            .attr("r", d => d.radius);
    
        nodeEnter.each(function(d) {
            validateImageUrl(d.player_face_url, function(validatedUrl) {
                d3.select(this).append("image")
                    .attr("xlink:href", validatedUrl)
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", 0)
                    .attr("height", 0)
                    .transition()
                    .duration(1000)
                    .attr("x", -d.radius)
                    .attr("y", -d.radius)
                    .attr("width", d.radius * 2)
                    .attr("height", d.radius * 2)
                    .attr("clip-path", "circle()");
            }.bind(this));
        });
    
        const nodeUpdate = node.merge(nodeEnter);
    
        nodeUpdate.transition()
            .duration(1000)
            .attr("transform", d => `translate(${x(d[xColumn])},${y(d[yColumn])})`);
    
        nodeUpdate.select("circle")
            .transition()
            .duration(1000)
            .attr("r", d => d.radius);
    
        nodeUpdate.each(function(d) {
            validateImageUrl(d.player_face_url, function(validatedUrl) {
                d3.select(this).select("image")
                    .transition()
                    .duration(1000)
                    .attr("x", -d.radius)
                    .attr("y", -d.radius)
                    .attr("width", d.radius * 2)
                    .attr("height", d.radius * 2)
                    .attr("xlink:href", validatedUrl);
            }.bind(this));
        });
    
        node.exit().transition()
            .duration(1000)
            .attr("r", 0)
            .remove();
    }

    function addPlayerTag(player, data) {
        // Display selected player tag
        const playerTag = document.createElement('div');
        playerTag.classList.add('player-tag');
        playerTag.innerHTML = `<img src="${player.player_face_url}" alt="${player.short_name}" class="player-thumbnail">${player.short_name} <span class="remove-tag">x</span>`;
        const selectedPlayerContainer = document.getElementById('selected-player');
        selectedPlayerContainer.innerHTML = ''; // Clear previous player tags
        selectedPlayerContainer.appendChild(playerTag);
    
        // Add event listener to the player tag to display profile
        playerTag.addEventListener('click', function(event) {
            if (!event.target.classList.contains('remove-tag')) {
                displayPlayerProfile(player, data);
                document.getElementById('player-info').classList.add('show');
            }
        });
    
        // Remove player tag on click of 'x'
        playerTag.querySelector('.remove-tag').addEventListener('click', function(event) {
            event.stopPropagation(); // Prevent the profile from showing when removing the tag
            selectedPlayerContainer.innerHTML = '';
            activePlayer = null; // Clear the active player
            updateBubbleChart(data, currentX, currentY, currentSize);
            updateHistogram(data, currentHistogram, null);
        });
    
        // Set the active player and update the histogram and heatmap
        activePlayer = player;
        updateHistogram(data, currentHistogram, activePlayer);
    }     

    function createHistogram(data, column, selectedPlayer = null) {
        const svg = createHistogramSvg(histogramWidth, histogramHeight);

        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => +d[column])])
            .range([0, histogramWidth]);
        const xAxis = svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${histogramHeight})`)
            .call(d3.axisBottom(x));

        const histogram = d3.histogram()
            .value(d => d[column])
            .domain(x.domain())
            .thresholds(x.ticks(20));

        const bins = histogram(data);

        const y = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .range([histogramHeight, 0]);
        const yAxis = svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));

        const g = svg.append("g");

        // Draw bars for histogram
        const bars = g.selectAll('.bar')
            .data(bins)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.x0))
            .attr('y', histogramHeight)
            .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 1))
            .attr('height', 0)
            .attr('fill', 'grey')
            .transition()
            .duration(1000)
            .attr('y', d => y(d.length))
            .attr('height', d => histogramHeight - y(d.length));

        // Highlight the current player's bar
        if (selectedPlayer) {
            const playerValue = +selectedPlayer[column];
            bars.on('end', function() {
                bins.forEach(bin => {
                    if (playerValue >= bin.x0 && playerValue < bin.x1) {
                        g.append('rect')
                            .attr('class', 'highlight-bar')
                            .attr('x', x(bin.x0))
                            .attr('y', y(bin.length))
                            .attr('width', Math.max(0, x(bin.x1) - x(bin.x0) - 1))
                            .attr('height', histogramHeight - y(bin.length))
                            .attr('fill', 'rgb(5, 146, 18)');
                    }
                });
            });
        }
    }

    function updateHistogram(data, column, selectedPlayer = null) {
        const svg = d3.select("#histogram-chart").select("svg");

        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => +d[column])])
            .range([0, histogramWidth]);
        const xAxis = svg.select(".x-axis")
            .transition()
            .duration(1000)
            .call(d3.axisBottom(x));

        const histogram = d3.histogram()
            .value(d => d[column])
            .domain(x.domain())
            .thresholds(x.ticks(20));

        const bins = histogram(data);

        const y = d3.scaleLinear()
            .domain([0, d3.max(bins, d => d.length)])
            .range([histogramHeight, 0]);
        const yAxis = svg.select(".y-axis")
            .transition()
            .duration(1000)
            .call(d3.axisLeft(y));

        const g = svg.select("g");

        // Remove existing bars and highlights
        g.selectAll('.bar').remove();
        g.selectAll('.highlight-bar').remove();

        // Draw bars for histogram
        const bars = g.selectAll('.bar')
            .data(bins)
            .enter().append('rect')
            .attr('class', 'bar')
            .attr('x', d => x(d.x0))
            .attr('y', histogramHeight)
            .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 1))
            .attr('height', 0)
            .attr('fill', 'grey')
            .transition()
            .duration(1000)
            .attr('y', d => y(d.length))
            .attr('height', d => histogramHeight - y(d.length));

        // Highlight the current player's bar
        if (selectedPlayer) {
            const playerValue = +selectedPlayer[column];
            bars.on('end', function() {
                bins.forEach(bin => {
                    if (playerValue >= bin.x0 && playerValue < bin.x1) {
                        g.append('rect')
                            .attr('class', 'highlight-bar')
                            .attr('x', x(bin.x0))
                            .attr('y', y(bin.length))
                            .attr('width', Math.max(0, x(bin.x1) - x(bin.x0) - 1))
                            .attr('height', histogramHeight - y(bin.length))
                            .attr('fill', 'rgb(5, 146, 18)');
                    }
                });
            });
        }
    }

    function createHeightGraph(data, selectedPlayerHeight = null) {
        const heightGraph = d3.select("#height-graph");
        heightGraph.selectAll("*").remove(); // Clear existing content

        const heights = data.map(d => +d.height_cm).sort((a, b) => a - b);
        const percentiles = [0, 0.25, 0.5, 0.75, 1].map(p => heights[Math.floor(p * (heights.length - 1))]);
        const scaleFactor = 2.5; // Adjust scale factor to control the height of images

        const histogramHeight = 400; // Assuming the histogram height is 400px
        const svgHeight = histogramHeight; // SVG height matches histogram height
        const svgWidth = (percentiles.length + (selectedPlayerHeight ? 1 : 0)) * 200; // Adjust width based on the number of images

        const svg = heightGraph.append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
            .style("display", "block");

        const container = svg.selectAll("g")
            .data(percentiles)
            .enter().append("g")
            .attr("transform", (d, i) => `translate(${i * 120},0)`);

        container.append("image")
            .attr("xlink:href", "../../resources/img/monigote.png")
            .attr("height", d => `${d * scaleFactor}px`)
            .attr("width", d => `${d * scaleFactor / 2}px`)
            .attr("x", d => -d * scaleFactor / 4) // Center the image
            .attr("y", d => svgHeight - d * scaleFactor - 20); // Align bottom and add margin for text

        container.append("text")
            .attr("x", 0)
            .attr("y", d => svgHeight - 5) // Position the text at the bottom
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .text(d => `${d} cm`);

        if (selectedPlayerHeight !== null) {
            // Slide existing images to the left
            svg.selectAll("g")
                .transition()
                .duration(1000)
                .attr("transform", (d, i) => `translate(${i * 120 - 60},0)`); // Move left by 60 units

            const selectedContainer = svg.append("g")
                .attr("transform", `translate(${percentiles.length * 120},0)`);

            selectedContainer.append("image")
                .attr("xlink:href", "../../resources/img/monigote.png")
                .attr("height", `${selectedPlayerHeight * scaleFactor}px`)
                .attr("width", `${selectedPlayerHeight * scaleFactor / 2}px`)
                .attr("x", -selectedPlayerHeight * scaleFactor / 4) // Center the image
                .attr("y", svgHeight - selectedPlayerHeight * scaleFactor - 20); // Align bottom and add margin for text

            selectedContainer.append("text")
                .attr("x", 0)
                .attr("y", svgHeight - 5) // Position the text at the bottom
                .attr("text-anchor", "middle")
                .attr("fill", "white")
                .text(`${selectedPlayerHeight} cm`);
        }
    }

    function filterOutliers(data, xColumn, yColumn, sizeColumn) {
        function calculateIQR(arr) {
            const sorted = arr.slice().sort((a, b) => a - b);
            const q1 = sorted[Math.floor((sorted.length / 4))];
            const q3 = sorted[Math.ceil((sorted.length * (3 / 4)))];
            const iqr = q3 - q1;
            return { q1, q3, iqr };
        }
    
        const xValues = data.map(d => +d[xColumn]);
        const yValues = data.map(d => +d[yColumn]);
        const sizeValues = data.map(d => +d[sizeColumn]);
    
        const { q1: xQ1, q3: xQ3, iqr: xIQR } = calculateIQR(xValues);
        const { q1: yQ1, q3: yQ3, iqr: yIQR } = calculateIQR(yValues);
        const { q1: sizeQ1, q3: sizeQ3, iqr: sizeIQR } = calculateIQR(sizeValues);
    
        return data.filter(d => {
            const x = +d[xColumn];
            const y = +d[yColumn];
            const size = +d[sizeColumn];
            return (x >= xQ1 - 3 * xIQR && x <= xQ3 + 3 * xIQR) &&
                   (y >= yQ1 - 3 * yIQR && y <= yQ3 + 3 * yIQR) &&
                   (size >= sizeQ1 - 3 * sizeIQR && size <= sizeQ3 + 3 * sizeIQR);
        });
    }  

    // Close the sliding panel
    document.querySelector('.close-btn').addEventListener('click', function() {
        document.getElementById('player-info').classList.remove('show');
    });

    // Close the panel when clicking outside
    document.addEventListener('click', function(event) {
        const playerInfo = document.getElementById('player-info');
        if (!playerInfo.contains(event.target) && playerInfo.classList.contains('show')) {
            playerInfo.classList.remove('show');
        }
    });

    // Prevent panel close when clicking inside the panel
    document.getElementById('player-info').addEventListener('click', function(event) {
        event.stopPropagation();
    });

    function initializeSearchBox(data) {
        const playerSearchInput = document.getElementById('player-search');
        const searchResultsContainer = document.getElementById('search-results');

        playerSearchInput.addEventListener('input', function() {
            const query = playerSearchInput.value.toLowerCase();
            searchResultsContainer.innerHTML = '';

            if (query.length > 0) {
                const filteredPlayers = data.filter(player => player.short_name.toLowerCase().includes(query));
                filteredPlayers.forEach(player => {
                    const resultItem = document.createElement('div');
                    resultItem.classList.add('search-result-item');
                    resultItem.innerHTML = `<img src="${player.player_face_url}" alt="${player.short_name}" class="player-thumbnail">${player.short_name}`;
                    resultItem.style.width = playerSearchInput.offsetWidth - 40 + 'px'; // Set the width of the result item
                    resultItem.addEventListener('click', function() {
                        playerSearchInput.value = '';
                        searchResultsContainer.innerHTML = '';

                        // Display selected player tag
                        const playerTag = document.createElement('div');
                        playerTag.classList.add('player-tag');
                        playerTag.innerHTML = `<img src="${player.player_face_url}" alt="${player.short_name}" class="player-thumbnail">${player.short_name} <span class="remove-tag">x</span>`;
                        const selectedPlayerContainer = document.getElementById('selected-player');
                        selectedPlayerContainer.innerHTML = ''; // Clear previous player tags
                        selectedPlayerContainer.appendChild(playerTag);

                        // Add event listener to the player tag to display profile
                        playerTag.addEventListener('click', function(event) {
                            if (!event.target.classList.contains('remove-tag')) {
                                displayPlayerProfile(player, data);
                                document.getElementById('player-info').classList.add('show');
                            }
                        });

                        // Remove player tag on click of 'x'
                        playerTag.querySelector('.remove-tag').addEventListener('click', function() {
                            selectedPlayerContainer.innerHTML = '';
                            activePlayer = null; // Clear the active player
                            updateBubbleChart(data, currentX, currentY, currentSize);
                            updateHistogram(data, currentHistogram, null);
                        });

                        // Set the active player and update the histogram and heatmap
                        activePlayer = player;
                        updateHistogram(data, currentHistogram, activePlayer);
                    });
                    searchResultsContainer.appendChild(resultItem);
                });
            }
        });
    }
});
