// Function to display player profile
function displayPlayerProfile(player, allPlayersData) {
    const currentYear = new Date().getFullYear();
    const age = player.Born ? currentYear - player.Born : "N/A";
    const nation = player.nationality_name || "N/A";
    const born = player.Born || "N/A";

    const playerInfoContainer = document.getElementById('player-info');
    playerInfoContainer.innerHTML = ''; // Clear existing content

    const playerCard = document.createElement('div');
    playerCard.classList.add('player-card');

    // Header Section
    const headerSection = document.createElement('div');
    headerSection.classList.add('header-section');

    const playerImage = document.createElement('img');
    playerImage.src = player.player_face_url;
    playerImage.alt = player.long_name;
    playerImage.classList.add('player-profile-pic');

    const playerDetails = document.createElement('div');
    playerDetails.classList.add('player-details');

    const playerName = document.createElement('h3');
    playerName.textContent = player.long_name;
    playerName.classList.add('player-name');

    const playerInfo = document.createElement('p');
    playerInfo.textContent = `${born}, ${nation} (${age})`;
    playerInfo.classList.add('player-info');

    playerDetails.appendChild(playerName);
    playerDetails.appendChild(playerInfo);
    headerSection.appendChild(playerImage);
    headerSection.appendChild(playerDetails);

    // Info and Key Stats Section
    const infoStatsSection = document.createElement('div');
    infoStatsSection.classList.add('info-stats-section');

    // Info Section
    const infoSection = document.createElement('div');
    infoSection.classList.add('info-section');

    const infoData = {
        'Equipo': player.club_name,
        'Liga': player.league_name,
        'Posiciones': player.player_positions,
        'Altura': `${player.height_cm} cm`,
        'Peso': `${player.weight_kg} kg`,
        'Pierna hábil': player.preferred_foot
    };

    Object.keys(infoData).forEach(info => {
        const infoElement = document.createElement('div');
        infoElement.classList.add('info-element');

        const infoLabel = document.createElement('span');
        infoLabel.classList.add('info-label');
        infoLabel.textContent = `${info}: `;

        const infoValue = document.createElement('span');
        infoValue.classList.add('info-value');
        infoValue.textContent = infoData[info];

        infoElement.appendChild(infoLabel);
        infoElement.appendChild(infoValue);
        infoSection.appendChild(infoElement);
    });

    // Key Stats Section
    const keyStatsSection = document.createElement('div');
    keyStatsSection.classList.add('key-stats-section');

    const statsData = {
        'Partidos Jugados': player.MP,
        'Minutos Jugados': player.Min,
        'Goles': player.Goals,
        'Asistencias': player.Assists,
        'Tarjetas Amarillas': player.CrdY,
        'Tarjetas Rojas': player.CrdR + player['2CrdY']
    };

    Object.keys(statsData).forEach(stat => {
        const statElement = document.createElement('div');
        statElement.classList.add('stat-element');

        const statLabel = document.createElement('span');
        statLabel.classList.add('stat-label');
        statLabel.textContent = `${stat}: `;

        const statValue = document.createElement('span');
        statValue.classList.add('stat-value');
        statValue.textContent = statsData[stat];

        statElement.appendChild(statLabel);
        statElement.appendChild(statValue);
        keyStatsSection.appendChild(statElement);
    });

    // Append sections to infoStatsSection
    const infoStatsContainer = document.createElement('div');
    infoStatsContainer.classList.add('info-stats-container');
    infoStatsContainer.appendChild(infoSection);
    infoStatsContainer.appendChild(keyStatsSection);

    infoStatsSection.appendChild(infoStatsContainer);

    // Radar Chart
    const radarChartContainer = document.createElement('div');
    radarChartContainer.id = 'radar-chart';
    radarChartContainer.style.width = '300px';
    radarChartContainer.style.height = '300px';
    radarChartContainer.style.margin = '0 auto';
    playerCard.appendChild(radarChartContainer);

    playerCard.appendChild(headerSection);
    playerCard.appendChild(infoStatsSection);
    playerCard.appendChild(radarChartContainer);

    playerInfoContainer.appendChild(playerCard);

    // Create radar chart
    const radarChartFields = ['SoT%', 'PasTotCmp%', 'TklDri%', 'ToSuc%', 'AerWon%'];
    createRadarChart(player, radarChartFields);

    const availableStats = ['Min', 'Goals', 'Assists', 'MP', 'CrdY', 'CrdR'];
    createDropdownAndChart(player, allPlayersData, availableStats);
}

// Function to create radar chart
function createRadarChart(player, fields) {
    const data = fields.map(field => ({axis: field, value: player[field] || 0}));
    const width = 250;
    const height = 250;
    const margin = {top: 40, right: 50, bottom: 40, left: 40};

    d3.select("#radar-chart").select("svg").remove(); // Remove existing svg if present

    const svg = d3.select("#radar-chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left + width / 2},${margin.top + height / 2})`);

    const radarRadius = Math.min(width / 2, height / 2);
    const angleSlice = Math.PI * 2 / fields.length;

    const rScale = d3.scaleLinear()
        .range([0, radarRadius])
        .domain([0, d3.max(data, d => d.value)]);

    const radarLine = d3.lineRadial()
        .radius(d => rScale(d.value))
        .angle((d, i) => i * angleSlice);

    svg.append("path")
        .datum(data)
        .attr("d", radarLine)
        .style("fill", "rgba(0, 123, 255, 0.5)")
        .style("stroke", "none");

    // Add axes
    const axisGrid = svg.append("g");
    axisGrid.selectAll(".levels")
        .data(d3.range(1, 6).reverse())
        .enter()
        .append("circle")
        .attr("r", d => radarRadius / 5 * d)
        .style("fill", "none")
        .style("stroke", "#CDCDCD")
        .style("stroke-dasharray", "3 3");

    axisGrid.selectAll(".axisLabel")
        .data(d3.range(1, 6).reverse())
        .enter()
        .append("text")
        .attr("x", 4)
        .attr("y", d => -d * radarRadius / 5)
        .attr("dy", "0.4em")
        .style("font-size", "10px")
        .attr("fill", "white")  // Updated text color
        .text(d => (rScale.domain()[1] * d / 5).toFixed(1));

    const axis = svg.selectAll(".axis")
        .data(fields)
        .enter()
        .append("g")
        .attr("class", "axis")
        .on("mouseover", function(event, d) {
            const tooltip = d3.select("#tooltip");
            const fullName = getFullName(d);
            const value = player[d] ? player[d].toFixed(1) : 0; // Limit decimals to one
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`${fullName}: ${value}%`)
                .style("left", (event.pageX + 5) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(d) {
            d3.select("#tooltip").transition().duration(500).style("opacity", 0);
        });

    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => rScale(d3.max(data, d => d.value)) * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y2", (d, i) => rScale(d3.max(data, d => d.value)) * Math.sin(angleSlice * i - Math.PI / 2))
        .style("stroke", "white")  // Updated line color
        .style("stroke-width", "2px");

    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "12px")
        .style("fill", "white")  // Updated text color
        .attr("text-anchor", "middle")
        .attr("dy", "0.35em")
        .attr("x", (d, i) => (rScale(d3.max(data, d => d.value)) + 15) * Math.cos(angleSlice * i - Math.PI / 2)) // Adjusted distance
        .attr("y", (d, i) => (rScale(d3.max(data, d => d.value)) + 15) * Math.sin(angleSlice * i - Math.PI / 2)) // Adjusted distance
        .text(d => d)
        .call(wrap, 60);

    // Add tooltip container
    d3.select("body").append("div")
        .attr("id", "tooltip")
        .attr("class", "tooltip")
        .style("opacity", 0);
}

// Function to get full name of the field
function getFullName(field) {
    const fullNames = {
        'SoT%': 'Tiros a puerta',
        'AerWon%': 'Percentage of aerials won',
        'PasTotCmp%': 'Pass completion percentage',
        'ToSuc%': 'Percentage of take-ons Completed Successfully',
        'TklDri%': 'Percentage of dribblers tackled'
    };
    return fullNames[field] || field;
}

// Function to wrap long text labels
function wrap(text, width) {
    text.each(function() {
        const text = d3.select(this);
        const words = text.text().split(/\s+/).reverse();
        let word;
        let line = [];
        let lineNumber = 0;
        const lineHeight = 1.1; // ems
        const y = text.attr("y");
        const x = text.attr("x");
        const dy = parseFloat(text.attr("dy"));
        let tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
    });
}

function updateBarChart(playersData, currentPlayer, selectedStat) {
    // Sort players based on the selected stat
    const sortedPlayers = playersData.sort((a, b) => a[selectedStat] - b[selectedStat]);

    // Find the value of the current player in the sorted list
    const currentPlayerValue = currentPlayer[selectedStat];

    // Debugging: Output the sorted list and the current player's value
    console.log("Sorted Players based on " + selectedStat + ":", sortedPlayers.map(p => p.long_name + ": " + p[selectedStat]));
    console.log("Current Player Value:", currentPlayerValue);

    // Create histogram data
    const histogramData = sortedPlayers.map(player => player[selectedStat]);

    // Clear previous chart
    d3.select('#bar-chart').select("svg").remove();
    const svg = d3.select('#bar-chart').append('svg')
        .attr('width', '100%')
        .attr('height', 300)
        .attr('viewBox', `0 0 600 300`)
        .attr('preserveAspectRatio', 'xMinYMin meet');

    const margin = { top: 20, right: 30, bottom: 40, left: 40 };
    const width = 600 - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Define x and y scales
    const x = d3.scaleLinear()
        .domain([0, d3.max(histogramData)])  // Ensure the x domain covers the full range
        .nice()  // Adds some padding to the domain
        .range([0, width]);

    const histogram = d3.histogram()
        .value(d => d)
        .domain(x.domain())
        .thresholds(x.ticks(20));  // Use 20 bins for the histogram

    const bins = histogram(histogramData);

    const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])  // Use bins to set the y domain
        .nice()  // Adds some padding to the domain
        .range([height, 0]);

    // Draw bars for histogram
    g.selectAll('.bar')
        .data(bins)
        .enter().append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.x0))
        .attr('y', d => y(d.length))
        .attr('width', d => Math.max(0, x(d.x1) - x(d.x0) - 1))
        .attr('height', d => height - y(d.length))
        .attr('fill', 'grey');

    // Highlight the current player's bar
    bins.forEach(bin => {
        if (currentPlayerValue >= bin.x0 && currentPlayerValue < bin.x1) {
            g.append('rect')
                .attr('x', x(bin.x0))
                .attr('y', y(bin.length))
                .attr('width', Math.max(0, x(bin.x1) - x(bin.x0) - 1))
                .attr('height', height - y(bin.length))
                .attr('fill', 'lightblue');
        }
    });

    // Add x-axis and y-axis
    g.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x).tickFormat(d3.format('d'))); // Format ticks as integers

    g.append('g')
        .call(d3.axisLeft(y));
}

// Function to create dropdown and initialize chart
function createDropdownAndChart(player, playersData, availableStats) {
    const dropdown = document.createElement('select');
    dropdown.id = 'stats-dropdown';
    availableStats.forEach(stat => {
        const option = document.createElement('option');
        option.value = stat;
        option.text = stat;
        dropdown.appendChild(option);
    });

    const barChartContainer = document.createElement('div');
    barChartContainer.id = 'bar-chart';

    document.getElementById('player-info').appendChild(dropdown);
    document.getElementById('player-info').appendChild(barChartContainer);

    dropdown.addEventListener('change', () => {
        updateBarChart(playersData, player, dropdown.value);
    });

    // Initialize chart with default stat
    updateBarChart(playersData, player, 'Min');
}
