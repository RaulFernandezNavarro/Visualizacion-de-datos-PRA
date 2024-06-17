function initFilters(leagues, data, updateVisualization) {
    const leagueFiltersContainer = document.getElementById('league-filters');
    const activeLeagues = new Set();
    const selectedPlayerContainer = document.getElementById('selected-player');
    let activeSorter = null; // Track the active sorter

    leagues.forEach(league => {
        const button = document.createElement('div');
        button.classList.add('filter-button');
        button.textContent = league;
        button.addEventListener('click', function() {
            if (activeLeagues.has(league)) {
                activeLeagues.delete(league);
                button.classList.remove('active');
            } else {
                activeLeagues.add(league);
                button.classList.add('active');
            }

            console.log("Ligas activas:", Array.from(activeLeagues));

            // Clear the selected player card
            selectedPlayerContainer.innerHTML = '';

            // Update visualization with filtered and sorted data
            updateVisualizationWithFiltersAndSorters();
        });
        leagueFiltersContainer.appendChild(button);
    });

    // Search box logic
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
                resultItem.addEventListener('click', function() {
                    playerSearchInput.value = '';
                    searchResultsContainer.innerHTML = '';

                    // Display selected player tag
                    const playerTag = document.createElement('div');
                    playerTag.classList.add('player-tag');
                    playerTag.innerHTML = `<img src="${player.player_face_url}" alt="${player.short_name}" class="player-thumbnail">${player.short_name} <span class="remove-tag">x</span>`;
                    selectedPlayerContainer.innerHTML = '';
                    selectedPlayerContainer.appendChild(playerTag);

                    // Remove player tag on click
                    playerTag.querySelector('.remove-tag').addEventListener('click', function() {
                        selectedPlayerContainer.innerHTML = '';
                        updateVisualization(data);
                    });

                    // Filter the data to include only the selected player
                    const filteredData = [player];
                    updateVisualization(filteredData);
                });
                searchResultsContainer.appendChild(resultItem);
            });
        }
    });

    // Sorting logic
    const sortingColumns = ['Age', 'Goals', 'Min', 'SoT%'];
    const sortOrders = {}; // Keeps track of sorting order for each column

    // Initialize sortOrders to default to null
    sortingColumns.forEach(col => {
        sortOrders[col] = null;
    });

    // Ensure sorting columns are converted to integers
    data.forEach(d => {
        sortingColumns.forEach(col => {
            d[col] = parseInt(d[col], 10);
        });
    });

    const sortersContainer = document.getElementById('sorters');
    sortingColumns.forEach(column => {
        const button = document.createElement('div');
        button.classList.add('sort-button');
        button.textContent = column;
        button.addEventListener('click', function() {
            if (activeSorter && activeSorter !== button) {
                sortOrders[activeSorter.textContent] = null; // Reset previous sorter
                updateSortButtonIcon(activeSorter, null);
            }

            if (sortOrders[column] === null || activeSorter !== button) {
                sortOrders[column] = 'desc'; // Default to descending order
            } else if (sortOrders[column] === 'desc') {
                sortOrders[column] = 'asc';
            } else {
                sortOrders[column] = null; // Remove sorting
                activeSorter = null;
            }

            activeSorter = button; // Set the new active sorter

            console.log(`Ordenando por ${column}: ${sortOrders[column]}`);

            // Update button icon
            updateSortButtonIcon(button, sortOrders[column]);

            // Clear the selected player card
            selectedPlayerContainer.innerHTML = '';

            // Update visualization with sorted data
            updateVisualizationWithFiltersAndSorters();
        });
        sortersContainer.appendChild(button);
    });

    function updateSortButtonIcon(button, sortOrder) {
        button.innerHTML = button.textContent.split(' ')[0]; // Remove existing arrow
        if (sortOrder === 'desc') {
            button.innerHTML += ' &#x25BC;'; // Down arrow
        } else if (sortOrder === 'asc') {
            button.innerHTML += ' &#x25B2;'; // Up arrow
        }
    }

    function updateVisualizationWithFiltersAndSorters() {
        // Filter data based on active leagues
        let filteredData = data;
        if (activeLeagues.size > 0) {
            filteredData = data.filter(d => activeLeagues.has(d.Comp));
        } else {
            filteredData = data.slice(); // Use a copy of the original data
        }

        // Apply sorting if there is an active sorter
        if (activeSorter) {
            const column = activeSorter.textContent.split(' ')[0];
            const sortOrder = sortOrders[column];
            filteredData.sort((a, b) => {
                if (sortOrder === 'desc') {
                    return b[column] - a[column];
                } else if (sortOrder === 'asc') {
                    return a[column] - b[column];
                }
                return 0;
            });
        }

        updateVisualization(filteredData);
    }
}
