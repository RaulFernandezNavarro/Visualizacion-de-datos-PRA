document.addEventListener("DOMContentLoaded", function() {
    const allowedColumns = ["TklW", "AerWon%", "Min", "Goals"]; // Columns allowed for customization
    const defaultX = "TklW";
    const defaultY = "AerWon%";
    const defaultSize = "Min";

    const margin = { top: 50, right: 30, bottom: 70, left: 60 };
    let bubbleWidth, bubbleHeight;

    function updateDimensions() {
        bubbleWidth = window.innerWidth - margin.left - margin.right;
        bubbleHeight = window.innerHeight - margin.top - margin.bottom - document.querySelector('.select-container').offsetHeight - 20;
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

    function createMatrixSvg(width, height) {
        return d3.select("#matrix")
            .append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("display", "block")
            .style("margin", "0 auto")
            .append("g")
            .attr("transform", `translate(${(width - matrixWidth) / 2},0)`);
    }

    function createBubbleSvg(width, height) {
        return d3.select("#bubble-chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);
    }

    function resize() {
        updateDimensions();

        d3.select("#bubble-chart").select("svg").remove();
        d3.select("#matrix").select("svg").remove();

        // Redraw everything with new dimensions
        createMatrixSvg(bubbleWidth, matrixHeight);
        createBubbleChart(data, defaultX, defaultY, defaultSize);

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

    // Matrix dimensions and settings
    const matrixRows = 4;
    const matrixCols = 15;
    const matrixCellSize = 100; // Increased the cell size for more spacing
    const matrixWidth = matrixCols * matrixCellSize;
    const matrixHeight = matrixRows * matrixCellSize;

    // Append the svg object to the body of the page for the matrix
    const matrixSvg = createMatrixSvg(bubbleWidth, matrixHeight);

    // Load the CSV data
    let data;
    d3.csv("merged_df.csv").then(function(csvData) {
        data = csvData.filter(d => d.player_positions === "CB").sort((a, b) => d3.descending(+a.Min, +b.Min));

        // Generate matrix data
        const matrixData = [];
        for (let row = 0; row < matrixRows; row++) {
            for (let col = 0; col < matrixCols; col++) {
                const player = data.shift();
                matrixData.push({ row, col, player });
            }
        }

        // Create circles for the matrix
        matrixSvg.selectAll("circle")
            .data(matrixData)
            .enter()
            .append("circle")
            .attr("cx", d => d.col * matrixCellSize + matrixCellSize / 2)
            .attr("cy", d => d.row * matrixCellSize + matrixCellSize / 2)
            .attr("r", matrixCellSize / 2.5) // Circle radius
            .attr("fill", "#1a1a1a"); // Slightly lighter gray color

        // Add player images to circles
        matrixSvg.selectAll("image")
            .data(matrixData.filter(d => d.player))
            .enter()
            .append("image")
            .attr("xlink:href", d => d.player.player_face_url || "no-pic.png")
            .attr("x", d => d.col * matrixCellSize + (matrixCellSize / 2 - matrixCellSize / 2.5))
            .attr("y", d => d.row * matrixCellSize + (matrixCellSize / 2 - matrixCellSize / 2.5))
            .attr("width", matrixCellSize / 1.25)
            .attr("height", matrixCellSize / 1.25)
            .attr("clip-path", "circle(50%)")
            .on("click", function(event, d) {
                displayPlayerProfile(d.player); // Call the displayPlayerProfile function
                document.getElementById('player-info').classList.add('show'); // Show the panel
                event.stopPropagation();
            });

        // Validate image URLs and use fallback if broken
        matrixSvg.selectAll("image").each(function(d) {
            const img = d3.select(this);
            const url = img.attr("xlink:href");
            validateImageUrl(url, (src) => {
                img.attr("xlink:href", src);
            });
        });

        // Create bubble chart
        createBubbleChart(data, defaultX, defaultY, defaultSize);

        // Update bubble chart on dropdown change
        d3.select("#x-axis-select").on("change", function() {
            const x = d3.select("#x-axis-select").property("value");
            const y = d3.select("#y-axis-select").property("value");
            const size = d3.select("#size-select").property("value");
            d3.select("#bubble-chart").select("svg").remove();
            createBubbleChart(data, x, y, size);
        });

        d3.select("#y-axis-select").on("change", function() {
            const x = d3.select("#x-axis-select").property("value");
            const y = d3.select("#y-axis-select").property("value");
            const size = d3.select("#size-select").property("value");
            d3.select("#bubble-chart").select("svg").remove();
            createBubbleChart(data, x, y, size);
        });

        d3.select("#size-select").on("change", function() {
            const x = d3.select("#x-axis-select").property("value");
            const y = d3.select("#y-axis-select").property("value");
            const size = d3.select("#size-select").property("value");
            d3.select("#bubble-chart").select("svg").remove();
            createBubbleChart(data, x, y, size);
        });
    });

    function createBubbleChart(data, xColumn, yColumn, sizeColumn) {
        const svg = createBubbleSvg(bubbleWidth, bubbleHeight);

        const x = d3.scaleLinear()
            .domain([0, d3.max(data, d => +d[xColumn])])
            .range([0, bubbleWidth]);
        const xAxis = svg.append("g")
            .attr("transform", `translate(0,${bubbleHeight})`)
            .call(d3.axisBottom(x));

        const y = d3.scaleLinear()
            .domain([0, d3.max(data, d => +d[yColumn])])
            .range([bubbleHeight, 0]);
        const yAxis = svg.append("g")
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

        const node = svg.selectAll("g")
            .data(nodes)
            .enter().append("g")
            .attr("transform", d => `translate(${d.xPos},${d.yPos})`);

        node.append("circle")
            .attr("r", d => d.radius)
            .attr("fill", d => colorScale(d.league_name))
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2);

        node.append("image")
            .attr("xlink:href", d => d.player_face_url || "no-pic.png")
            .attr("x", d => -d.radius)
            .attr("y", d => -d.radius)
            .attr("width", d => d.radius * 2)
            .attr("height", d => d.radius * 2)
            .attr("clip-path", "circle()")
            .each(function(d) {
                const img = d3.select(this);
                const url = img.attr("xlink:href");
                validateImageUrl(url, (src) => {
                    img.attr("xlink:href", src);
                });
            })
            .on("click", function(event, d) {
                displayPlayerProfile(d); // Call the displayPlayerProfile function
                document.getElementById('player-info').classList.add('show'); // Show the panel
                event.stopPropagation();
            });

        // Add zoom functionality
        const zoom = d3.zoom()
            .scaleExtent([0.5, 10])
            .extent([[0, 0], [bubbleWidth, bubbleHeight]])
            .on("zoom", (event) => {
                const transform = event.transform;
                const newX = transform.rescaleX(x);
                const newY = transform.rescaleY(y);

                xAxis.call(d3.axisBottom(newX));
                yAxis.call(d3.axisLeft(newY));

                node.attr("transform", d => `translate(${newX(d[xColumn])},${newY(d[yColumn])})`);

                const zoomLevel = transform.k;
                node.selectAll("circle")
                    .attr("r", d => d.radius / zoomLevel);

                node.selectAll("image")
                    .attr("x", d => -d.radius / zoomLevel)
                    .attr("y", d => -d.radius / zoomLevel)
                    .attr("width", d => d.radius * 2 / zoomLevel)
                    .attr("height", d => d.radius * 2 / zoomLevel);
            });

        svg.call(zoom);

        // Add reset zoom button functionality
        d3.select("#reset-zoom").on("click", function() {
            svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
        });
    }

    function validateImageUrl(url, callback) {
        const img = new Image();
        img.onload = function() {
            callback(url);
        };
        img.onerror = function() {
            callback("no-pic.png");
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
