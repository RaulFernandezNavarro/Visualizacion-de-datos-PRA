document.addEventListener("DOMContentLoaded", function() {
    const allowedColumns = ["TklW", "AerWon%", "Min", "Goals"]; // Columns allowed for customization
    const allowedHistogramColumns = ["TklW", "AerWon%", "Min", "Goals"]; // Columns allowed for histogram
    const defaultX = "TklW";
    const defaultY = "AerWon%";
    const defaultSize = "Min";
    const defaultHistogram = "Goals";

    const margin = { top: 50, right: 30, bottom: 70, left: 60 };
    let bubbleWidth, bubbleHeight, histogramWidth, histogramHeight;
    let currentX = defaultX;
    let currentY = defaultY;
    let currentSize = defaultSize;
    let currentHistogram = defaultHistogram;

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
        createHistogram(data, currentHistogram);

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
    d3.csv("../../resources/data/merged_df.csv").then(function(csvData) {
        data = csvData.filter(d => (d.player_positions === "LB" || d.player_positions === "RB")).sort((a, b) => d3.descending(+a.Min, +b.Min));

        // Add a unique id to each data point
        data.forEach((d, i) => d.id = i);

        // Create bubble chart
        createBubbleChart(data, currentX, currentY, currentSize);
        createHistogram(data, currentHistogram);

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
            updateHistogram(data, currentHistogram);
        });
    });

    function createBubbleChart(data, xColumn, yColumn, sizeColumn) {
        const svg = createBubbleSvg(bubbleWidth, bubbleHeight);

        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => +d[xColumn])])
            .range([0, bubbleWidth - margin.right]);
        const xAxis = svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${bubbleHeight})`)
            .call(d3.axisBottom(x));

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => +d[yColumn])])
            .range([bubbleHeight, 0]);
        const yAxis = svg.append("g")
            .attr("class", "y-axis")
            .call(d3.axisLeft(y));

        const size = d3.scaleSqrt()
            .domain([0, d3.max(data, d => +d[sizeColumn])])
            .range([0, 50]);

        const colorScale = d3.scaleOrdinal(d3.schemeCategory10);

        const nodes = data.map(d => ({
            ...d,
            xPos: x(d[xColumn]),
            yPos: y(d[yColumn]),
            radius: size(+d[sizeColumn])
        }));

        const node = svg.selectAll("g.node")
            .data(nodes, d => d.id);

        const nodeEnter = node.enter().append("g")
            .attr("class", "node")
            .attr("transform", d => `translate(${d.xPos},${d.yPos})`);

        nodeEnter.append("circle")
            .attr("r", 0)
            .attr("fill", d => colorScale(d.league_name))
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2)
            .transition()
            .duration(1000)
            .attr("r", d => d.radius);

        nodeEnter.append("image")
            .attr("xlink:href", d => d.player_face_url || "../../resources/img/no-pic.png")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 0)
            .attr("height", 0)
            .transition()
            .duration(1000)
            .attr("x", d => -d.radius)
            .attr("y", d => -d.radius)
            .attr("width", d => d.radius * 2)
            .attr("height", d => d.radius * 2)
            .attr("clip-path", "circle()");

        const nodeUpdate = node.merge(nodeEnter);

        nodeUpdate.transition()
            .duration(1000)
            .attr("transform", d => `translate(${x(d[xColumn])},${y(d[yColumn])})`);

        nodeUpdate.select("circle")
            .transition()
            .duration(1000)
            .attr("r", d => d.radius);

        nodeUpdate.select("image")
            .transition()
            .duration(1000)
            .attr("x", d => -d.radius)
            .attr("y", d => -d.radius)
            .attr("width", d => d.radius * 2)
            .attr("height", d => d.radius * 2);

        node.exit().transition()
            .duration(1000)
            .attr("r", 0)
            .remove();
    }

    function updateBubbleChart(data, xColumn, yColumn, sizeColumn) {
        const svg = d3.select("#bubble-chart").select("svg");

        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => +d[xColumn])])
            .range([0, bubbleWidth - margin.right]);
        const xAxis = svg.select(".x-axis")
            .transition()
            .duration(1000)
            .call(d3.axisBottom(x));

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => +d[yColumn])])
            .range([bubbleHeight, 0]);
        const yAxis = svg.select(".y-axis")
            .transition()
            .duration(1000)
            .call(d3.axisLeft(y));

        const size = d3.scaleSqrt()
            .domain([0, d3.max(data, d => +d[sizeColumn])])
            .range([0, 50]);

        const nodes = data.map(d => ({
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

        nodeEnter.append("image")
            .attr("xlink:href", d => d.player_face_url || "../../resources/img/no-pic.png")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 0)
            .attr("height", 0)
            .transition()
            .duration(1000)
            .attr("x", d => -d.radius)
            .attr("y", d => -d.radius)
            .attr("width", d => d.radius * 2)
            .attr("height", d => d.radius * 2)
            .attr("clip-path", "circle()");

        const nodeUpdate = node.merge(nodeEnter);

        nodeUpdate.transition()
            .duration(1000)
            .attr("transform", d => `translate(${x(d[xColumn])},${y(d[yColumn])})`);

        nodeUpdate.select("circle")
            .transition()
            .duration(1000)
            .attr("r", d => d.radius);

        nodeUpdate.select("image")
            .transition()
            .duration(1000)
            .attr("x", d => -d.radius)
            .attr("y", d => -d.radius)
            .attr("width", d => d.radius * 2)
            .attr("height", d => d.radius * 2);

        node.exit().transition()
            .duration(1000)
            .attr("r", 0)
            .remove();
    }

    

    function createHistogram(data, column) {
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
            

        svg.selectAll("rect")
            .data(bins)
            .enter().append("rect")
            .attr("x", 1)
            .attr("transform", d => `translate(${x(d.x0)},${y(d.length)})`)
            .attr("width", d => x(d.x1) - x(d.x0) - 1)
            .attr("height", d => histogramHeight - y(d.length))
            .style("fill", "#69b3a2");
    }

    function updateHistogram(data, column) {
        const svg = d3.select("#histogram-chart").select("svg");
        // Remove previous labels
        svg.selectAll("text").remove();

        // Add x-axis label
        svg.append("text")             
            .attr("transform", `translate(${histogramWidth / 2} ,${histogramHeight + 90})`) // Adjust these values as needed
            .style("text-anchor", "middle")
            .style("fill", "white") // Change the color to white
            .text(column); // Use the variable name as the label

        // Add y-axis label
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - 40) // Adjust this value as needed
            .attr("x",0 - (histogramHeight / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("fill", "white") // Change the color to white
            .text("Y-axis label"); 

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

        const rect = svg.selectAll("rect")
            .data(bins);

        rect.enter().append("rect")
            .attr("x", 1)
            .attr("transform", d => `translate(${x(d.x0)},${y(d.length)})`)
            .attr("width", d => x(d.x1) - x(d.x0) - 1)
            .attr("height", d => histogramHeight - y(d.length))
            .style("fill", "#69b3a2")
            .merge(rect)
            .transition()
            .duration(1000)
            .attr("x", 1)
            .attr("transform", d => `translate(${x(d.x0)},${y(d.length)})`)
            .attr("width", d => x(d.x1) - x(d.x0) - 1)
            .attr("height", d => histogramHeight - y(d.length));

        rect.exit().remove();
    }

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
});
