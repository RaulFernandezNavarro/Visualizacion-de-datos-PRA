document.addEventListener("DOMContentLoaded", function() {
    const pitchImage = document.getElementById('pitch-image');
    const svgWidth = pitchImage.clientWidth;
    const svgHeight = pitchImage.clientHeight;
    const placeholderImage = '../../resources/img/no-pic.png'; // Path to the placeholder image

    // Add an SVG overlay
    const svg = d3.select(".overlay")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    // Define player positions in the 1-4-3-3 formation
    const formation = [
        {position: "GK", x: svgWidth / 2, y: svgHeight - 115},
        {position: "LB", x: svgWidth / 6, y: svgHeight / 1.5},
        {position: "CB1", x: svgWidth / 2.8, y: svgHeight / 1.4},
        {position: "CB2", x: svgWidth / 1.5, y: svgHeight / 1.4},
        {position: "RB", x: svgWidth / 1.2, y: svgHeight / 1.5},
        {position: "LM", x: svgWidth / 4, y: svgHeight / 2},
        {position: "CM", x: svgWidth / 2, y: svgHeight / 2},
        {position: "RM", x: svgWidth / 1.3, y: svgHeight / 2},
        {position: "LW", x: svgWidth / 6, y: svgHeight / 4},
        {position: "CF", x: svgWidth / 2, y: svgHeight / 6},
        {position: "RW", x: svgWidth / 1.2, y: svgHeight / 4}
    ];

    // Function to validate image URL and return appropriate src
    function validateImageUrl(url, callback) {
        const img = new Image();
        img.onload = () => callback(url);
        img.onerror = () => callback(placeholderImage);
        img.src = url;
    }

    // Function to update the visualization
    function updateVisualization(filteredData) {
        console.log("Updating visualization with filtered data:", filteredData);

        // Reset assigned positions
        formation.forEach(p => p.player = null);

        filteredData.forEach(d => {
            // Assign player to position if it's not already assigned
            if (d.player_positions.includes("GK") && !formation.find(p => p.position === "GK").player) {
                d.position = "GK";
            } else if (d.player_positions.includes("LB") && !formation.find(p => p.position === "LB").player) {
                d.position = "LB";
            } else if (d.player_positions.includes("CB") && !formation.find(p => p.position === "CB1").player) {
                d.position = "CB1";
            } else if (d.player_positions.includes("CB") && !formation.find(p => p.position === "CB2").player) {
                d.position = "CB2";
            } else if (d.player_positions.includes("RB") && !formation.find(p => p.position === "RB").player) {
                d.position = "RB";
            } else if (d.player_positions.includes("LM") && !formation.find(p => p.position === "LM").player) {
                d.position = "LM";
            } else if (d.player_positions.includes("CM") && !formation.find(p => p.position === "CM").player) {
                d.position = "CM";
            } else if (d.player_positions.includes("RM") && !formation.find(p => p.position === "RM").player) {
                d.position = "RM";
            } else if (d.player_positions.includes("LW") && !formation.find(p => p.position === "LW").player) {
                d.position = "LW";
            } else if ((d.player_positions.includes("CF") || d.player_positions.includes("ST")) && !formation.find(p => p.position === "CF").player) {
                d.position = "CF";
            } else if (d.player_positions.includes("RW") && !formation.find(p => p.position === "RW").player) {
                d.position = "RW";
            } else {
                return; // Skip if no position available
            }

            // Assign player data to formation
            const position = formation.find(p => p.position === d.position);
            if (position) {
                position.player = d;
            }
        });

        console.log("Formation after assignment:", formation);

        // Reverse animation for existing players
        svg.selectAll("text")
            .transition()
            .duration(500)
            .style("opacity", 0)
            .remove();

        svg.selectAll("image")
            .transition()
            .duration(1000)
            .attr("x", svgWidth / 2)
            .attr("y", svgHeight / 2)
            .attr("width", 0)
            .attr("height", 0)
            .remove();

        // Delay the next steps until the reverse animation is complete
        setTimeout(() => {
            // Update visualization
            svg.selectAll("*").remove();

            // Define clip paths for each player to make images circular
            svg.selectAll("defs")
                .data(formation)
                .enter()
                .append("defs")
                .append("clipPath")
                .attr("id", d => `clip-${d.position}`)
                .append("circle")
                .attr("cx", d => d.x)
                .attr("cy", d => d.y)
                .attr("r", 40);

            // Add player images with transitions
            formation.forEach(playerData => {
                if (playerData.player) {
                    validateImageUrl(playerData.player.player_face_url, (src) => {
                        const playerImage = svg.append("image")
                            .attr("xlink:href", src)
                            .attr("x", svgWidth / 2)
                            .attr("y", svgHeight / 2)
                            .attr("width", 0)
                            .attr("height", 0)
                            .attr("clip-path", `url(#clip-${playerData.position})`)
                            .style("cursor", "pointer");

                        playerImage.transition()
                            .duration(1000)
                            .attr("x", playerData.x - 40)
                            .attr("y", playerData.y - 40)
                            .attr("width", 80)
                            .attr("height", 80);

                        playerImage.on("click", () => displayPlayerProfile(playerData.player));
                    });
                }
            });

            // Add player names with fade-in effect
            svg.selectAll("text")
                .data(formation)
                .enter()
                .append("text")
                .attr("x", d => d.x)
                .attr("y", d => d.y + 60)
                .attr("fill", "white")
                .attr("text-anchor", "middle")
                .style("opacity", 0)
                .text(d => d.player ? d.player.short_name : '')
                .transition()
                .delay(1000)
                .duration(500)
                .style("opacity", 1)
                .style("cursor", "pointer")
                .on("click", d => {
                    if (d.player) {
                        displayPlayerProfile(d.player);
                    }
                });
        }, 700); // Delay to allow reverse animation to complete
    }

    // Load and parse the CSV data
    let data = [];
    d3.csv("../../resources/data/merged_df_2.csv").then(function(csvData) {
        data = csvData;

        // Convert necessary columns to integers
        data.forEach(d => {
            d.Age = parseInt(d.Age, 10);
            d.Goals = parseInt(d.Goals, 10);
            d.Min = parseInt(d.Min, 10);
        });

        // Sort the data by short_name
        data.sort((a, b) => a.short_name.localeCompare(b.short_name));

        // Extract unique leagues from data
        const leagues = Array.from(new Set(data.map(d => d.Comp)));

        // Initialize filters
        initFilters(leagues, data, updateVisualization);

        updateVisualization(data);
    }).catch(function(error) {
        console.error('Error al cargar o analizar datos:', error);
    });
});
