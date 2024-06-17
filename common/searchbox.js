function initSearchBox(data, updateVisualization) {
    const playerSearchInput = document.getElementById('player-search');
    const searchResultsContainer = document.getElementById('search-results');
    const selectedPlayerContainer = document.getElementById('selected-player');

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
}

export { initSearchBox };
