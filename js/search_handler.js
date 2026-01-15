document.addEventListener('DOMContentLoaded', function () {
    const searchForm = document.getElementById('search-form');

    if (searchForm) {
        searchForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const searchInput = document.getElementById('search-input');
            const term = searchInput.value.trim();

            if (term) {
                let redirectPath;
                const currentPath = window.location.pathname;
                
                // Se a página atual está na pasta 'pages' (ex: bethta.html)
                if (currentPath.includes('/pages/')) {
                    // O caminho para pesquisa.html (que está na mesma pasta) é relativo
                    redirectPath = 'pesquisa.html?q=' + encodeURIComponent(term);
                } 
                // Se a página atual está na raiz (ex: index.html)
                else {
                    // O caminho para pesquisa.html precisa entrar na pasta 'pages'
                    redirectPath = 'pages/pesquisa.html?q=' + encodeURIComponent(term);
                }

                window.location.href = redirectPath;
            }
        });
    }
});