document.addEventListener("DOMContentLoaded", function() {
    const width = document.getElementById("bubble-chart").clientWidth;
    const height = document.getElementById("bubble-chart").clientHeight;
    let activeCard = null; // To keep track of the currently displayed card

    const svg = d3.select("#bubble-chart")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Load the CSV data
    d3.csv("merged_df.csv").then(function(data) {

        data = data.filter(d => d.Pos === "GK");
        const leagues = Array.from(new Set(data.map(d => d.league_name)));
        // Define color scale for leagues
        const colorScale = d3.scaleOrdinal()
            .domain(leagues)
            .range(["#BED754", "#3795BD", "#3D0000", "#150050", "#950101"]);

        // Create legend
        const legend = d3.select("#legend").selectAll(".legend-item")
            .data(leagues)
            .enter()
            .append("div")
            .attr("class", "legend-item");

        legend.append("div")
            .attr("class", "legend-color")
            .style("background-color", d => colorScale(d));

        legend.append("span")
            .text(d => d);

        // Process the data
        const nodes = data.map(d => ({
            short_name: d.short_name,
            long_name: d.long_name,
            radius: Math.sqrt(d.Min) * 1.1,
            league_name: d.league_name,
            player_face_url: d.player_face_url,
            Min: d.Min,
            club_name: d.club_name,
            player_positions: d.player_positions,
            height_cm: d.height_cm,
            weight_kg: d.weight_kg,
            preferred_foot: d.preferred_foot,
            MP: d.MP,
            x: Math.random() * width,
            y: Math.random() * height
        }));

        console.log(nodes); // Log nodes to verify data

        // Create a simulation with forces
        const simulation = d3.forceSimulation(nodes)
            .force("charge", d3.forceManyBody().strength(20)) // Increased center force
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(d => d.radius + 2)) // Add padding to avoid overlap
            .on("tick", ticked);

        // Draw the bubbles
        const node = svg.selectAll("g")
            .data(nodes)
            .enter().append("g")
            .call(d3.drag()
                .on("start", dragStarted)
                .on("drag", dragged)
                .on("end", dragEnded))
            .on("click", (event, d) => {
                event.stopPropagation(); // Prevent the event from bubbling up
                displayPlayerProfile(d); // Call the displayPlayerProfile function
                document.getElementById('player-info').classList.add('show'); // Show the panel
            }); // Pass event and data

        node.append("circle")
            .attr("r", d => d.radius)
            .attr("fill", d => colorScale(d.league_name))
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 2);

        node.append("image")
            .attr("xlink:href", d => d.player_face_url || "no-pic.png") // Use fallback image if URL is missing
            .attr("x", d => -d.radius)
            .attr("y", d => -d.radius)
            .attr("width", d => d.radius * 2)
            .attr("height", d => d.radius * 2)
            .attr("clip-path", "circle()");

        function ticked() {
            node.attr("transform", d => `translate(${d.x},${d.y})`);
            node.each(keepInBounds);
        }

        function keepInBounds(d) {
            d.x = Math.max(d.radius, Math.min(width - d.radius, d.x));
            d.y = Math.max(d.radius, Math.min(height - d.radius, d.y));
        }

        function dragStarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragEnded(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
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
});
