document.addEventListener('DOMContentLoaded', function () {
    const resultsContainer = document.getElementById('searchResultsBody');
    const urlParams = new URLSearchParams(window.location.search);
    const searchTerm = urlParams.get('q');
    const searchTitle = document.getElementById('searchResultsTitle');
    
    // 1. Verifica se há termo de busca na URL
    if (!searchTerm) {
        if (searchTitle) searchTitle.textContent = "Nenhum termo de busca fornecido.";
        return;
    }

    if (searchTitle) searchTitle.textContent = `Resultados para: "${searchTerm}"`;

    // 2. Carrega o índice JSON. O caminho '../js/search_index.json' é relativo a 'pages/pesquisa.html'
    fetch('../js/search_index.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Falha ao carregar o índice de busca: ' + response.statusText);
            }
            return response.json();
        })
        .then(index => {
            const query = searchTerm.toLowerCase();
            const results = index.filter(item => {
                // 3. Filtrar buscando no título OU no conteúdo (case insensitive)
                const titleMatch = item.title.toLowerCase().includes(query);
                const contentMatch = item.content.toLowerCase().includes(query);
                return titleMatch || contentMatch;
            });

            // 4. Exibir os resultados
            displayResults(results, resultsContainer);
        })
        .catch(error => {
            console.error('Erro ao processar a busca:', error);
            if (resultsContainer) {
                resultsContainer.innerHTML = `<p class="alert alert-danger" role="alert">Erro ao carregar o índice de busca. Detalhe: ${error.message}</p>`;
            }
        });
});

/**
 * Função para exibir os resultados da pesquisa no container.
 * @param {Array<Object>} results - Array de objetos do search_index.json
 * @param {HTMLElement} container - O elemento onde os resultados serão inseridos.
 */
function displayResults(results, container) {
    if (!container) return;

    if (results.length === 0) {
        container.innerHTML = '<p class="text-center">Nenhum resultado encontrado. Tente termos diferentes.</p>';
        return;
    }

    const ul = document.createElement('ul');
    ul.classList.add('list-group', 'list-group-flush');

    results.forEach(item => {
        const li = document.createElement('li');
        li.classList.add('list-group-item', 'd-flex', 'flex-column', 'py-3');
        
        // Criar o link do resultado
        const a = document.createElement('a');

        /* * Lógica de URL Corrigida: 
         * A página atual (pesquisa.html) está em /pages/.
         * - Se item.url é "index.html" (raiz), precisamos de "../index.html".
         * - Se item.url é "pages/betha.html", precisamos apenas de "betha.html" (mesma pasta).
         */
        let itemHref = item.url;
        if (item.url === "index.html") {
            itemHref = `../${item.url}`; // Sai da pasta 'pages'
        } else if (item.url.startsWith('pages/')) {
            // Remove "pages/" para criar um link direto dentro da pasta 'pages'
            itemHref = item.url.replace('pages/', '');
        } 

        a.href = itemHref;
        a.textContent = item.title;
        a.classList.add('h5', 'mb-1');

        // Adicionar o resumo do conteúdo
        const p = document.createElement('p');
        p.textContent = item.content.substring(0, 150) + '...'; 
        p.classList.add('mb-0', 'text-muted', 'text-truncate'); // Adicionado text-truncate para visual

        li.appendChild(a);
        li.appendChild(p);
        ul.appendChild(li);
    });

    container.appendChild(ul);
}