document.addEventListener('DOMContentLoaded', function() {
    // ===============================================================
    // --- PAINEL DE CONTROLE: Atualize SOMENTE ESTE BLOCO ---
    // ===============================================================

    // Verifica se estamos na página principal (index.html ou raiz /)
    // Se a URL NÃO tiver a pasta "/pages/", assume que é a raiz.
    const isRoot = !window.location.pathname.includes('/pages/');
    
    // Se for raiz (index), usa "./" (procura aqui mesmo).
    // Se for página interna (pages), usa "../" (volta uma pasta).
    const pathPrefix = isRoot ? './' : '../';



    const globalAlert = {
        // Mude para 'false' para desativar o alerta em todas as páginas (controle do administrador)
        isActive: true,

        
        // Cor do alerta (Bootstrap classes)
        //alert-danger	Vermelho forte (ou cores quentes) - Usado para erros, avisos críticos.
        //alert-warning	Amarelo/Laranja - Usado para avisos que não são críticos, mas importantes.
        //alert-info	Azul ciano/claro - Usado para informações neutras ou dicas.
        //alert-success	Verde - Usado para confirmações ou ações bem-sucedidas.
        //alert-primary	Azul escuro (Cor primária do tema) - Usado para informações gerais. 
        type: 'alert-warning', 
        
        // Pode ser um <img>, um ícone Bootstrap (bi bi-*) ou um emoji.
        // Exemplo: <img src="../imagens/alerta.png" alt="Alerta" style="height: 20px; vertical-align: middle;">
        // Exemplo: '🎉' ou '<i class="bi bi-calendar-check-fill me-2"></i>'
        iconHtml: '<img id="alert-icon" src="${pathPrefix}imagens/dia_do_servidor.png" alt="Alerta de Ponto Facultativo" style="height: 150px;">', 
        
        title: 'ATENÇÃO: Ponto Facultativo!',
        
        message: 'A Prefeitura de Resende publicou o Decreto nº Nº 17.901 de 03 de Outubro de 2025, que estabelece ponto facultativo nos dias 27 e 28 de outubro, Dia do Servidor Público Municipal. A medida vale para todas as repartições públicas municipais, com exceção das repartições cujas atividades não possam ser suspensas, em virtude de exigências técnicas ou por motivo de interesse público.',
        //Define se o alerta pode ser fechado pelo usuário. Digite false se desejar que o alerta não possa ser fechado pelo usuário.
        isDismissible: true 
    };
    // ===============================================================

    // Novo local de injeção: Dentro do container fixo (.navbar-wrapper)
    const navbarWrapper = document.querySelector('.navbar-wrapper');
    const decorativeNavbar = document.querySelector('.decorative-navbar'); 
    
    // Altura Padrão do Body (definida no styles.css)
    const initialPaddingTop = 180; 
    
    let observer; 

    // Função de ajuste para ser reutilizada
    function updateLayout() {
        const banner = document.getElementById('global-fixed-alert');
        if (banner && navbarWrapper) {
            // 1. CALCULA A ALTURA DO ALERTA E DO WRAPPER
            const bannerHeight = banner.getBoundingClientRect().height;
            const wrapperHeight = navbarWrapper.getBoundingClientRect().height;
            
            // 2. AJUSTA O PADDING-TOP DO BODY
            // O padding do body deve ser a altura do wrapper FIXO + a altura do alerta.
            const totalBodyPadding = initialPaddingTop + bannerHeight;
            document.body.style.paddingTop = `${totalBodyPadding}px`;
            
            // 3. TORNA O ALERTA VISÍVEL
            // Oculto inicialmente no CSS para evitar o FOUC
            banner.style.visibility = 'visible'; 
        } else {
            // Se o banner não existir, volta para o padding inicial
            document.body.style.paddingTop = `${initialPaddingTop}px`;
        }
    }

    if (globalAlert.isActive && navbarWrapper && decorativeNavbar) {
        // 1. Cria o elemento do banner
        const banner = document.createElement('div');
        banner.id = 'global-fixed-alert'; 
        
        // NOTA: Removida a classe 'fixed-top' e 'z-3000' do JS,
        // pois a posição será controlada pelo CSS (.global-fixed-alert)
        let classes = `alert ${globalAlert.type} mb-0 rounded-0 global-fixed-alert`; 
        
        if (globalAlert.isDismissible) {
             classes += ' alert-dismissible fade show';
        }
        
        banner.className = classes;
        banner.role = 'alert';

        // 2. Monta o conteúdo HTML
        // Adicionado d-block ao strong para melhor semântica
        let contentHTML = `
            <div class="d-flex align-items-center justify-content-center">
                <div class="flex-shrink-0 me-3">
                    ${globalAlert.iconHtml} 
                </div>
                <div class="flex-grow-1 text-start">
                    <strong id="alert-title" class="d-block">${globalAlert.title}</strong> 
                    <p class="mb-0 small">${globalAlert.message.replace(/\n/g, '<br>')}</p>
                </div>
            </div>
        `;
        
        if (globalAlert.isDismissible) {
            // Botão de fechar fora da div flex
            contentHTML += `<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Fechar alerta"></button>`;
        }

        banner.innerHTML = contentHTML;

        // 3. Injeta o banner DENTRO DO WRAPPER, depois da navbar decorativa
        navbarWrapper.appendChild(banner);
        
        
        // *****************************************************************
        // *** SOLUÇÃO DO PROBLEMA DE POSICIONAMENTO INICIAL (FOUC) ***
        // *****************************************************************
        const iconElement = banner.querySelector('img');
        
        const finalizeInjection = () => {
            // 4. FORÇA O RE-LAYOUT IMEDIATO E INICIA O OBSERVER
            updateLayout();
            if (!observer) {
                observer = new ResizeObserver(updateLayout);
                observer.observe(banner);
                observer.observe(navbarWrapper);
            }
        };

        // 5. Espera o carregamento da imagem ou executa imediatamente
        if (iconElement && iconElement.tagName === 'IMG' && !iconElement.complete) {
            iconElement.addEventListener('load', finalizeInjection);
        } else {
            // Se não houver imagem, ou se já estiver carregada (cache)
            // Usa setTimeout(0) para garantir que o DOM tenha se estabelecido antes de medir
            setTimeout(finalizeInjection, 0); 
        }
        

        // 6. Remover o padding-top extra quando o alerta for fechado
        banner.addEventListener('closed.bs.alert', () => {
             document.body.style.paddingTop = `${initialPaddingTop}px`;
             if (observer) {
                 observer.unobserve(banner); 
                 observer.unobserve(navbarWrapper);
             }
        });
        // *****************************************************************
    }
});