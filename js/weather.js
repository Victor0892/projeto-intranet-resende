// js/weather.js - Widget e sistema de clima
class WeatherWidget {
    constructor() {
        // A API Key é fixa no código, mas em produção deve ser carregada de forma segura
        this.apiKey = '26a5cb001fa9f083249a5c2436a15b33';
        this.city = 'Resende,RJ,BR';
        this.cityName = 'Resende';
        this.units = 'metric';
        this.language = 'pt_br';
    }

    // Buscar dados do clima atual
    async getCurrentWeather() {
        try {
            const response = await fetch(
                // Corrigido para usar "q" (query) corretamente e as variáveis da classe
                `https://api.openweathermap.org/data/2.5/weather?q=${this.city}&units=${this.units}&lang=${this.language}&appid=${this.apiKey}`
            );

            if (!response.ok) {
                // Lança um erro com o status para melhor debug
                throw new Error(`Erro ao buscar dados do clima: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            // Usa 'this.cityName' no log para contexto
            console.error(`Erro no widget de clima para ${this.cityName}:`, error);
            return null;
        }
    }

    // Buscar previsão de 5 dias (intervalos de 3 horas)
    async get5DayForecast() {
        try {
            const response = await fetch(
                // Corrigido para usar "q" (query) corretamente e as variáveis da classe
                `https://api.openweathermap.org/data/2.5/forecast?q=${this.city}&units=${this.units}&lang=${this.language}&appid=${this.apiKey}`
            );

            if (!response.ok) {
                // Lança um erro com o status para melhor debug
                throw new Error(`Erro ao buscar previsão: ${response.status} ${response.statusText}`);
            }

            // Não precisa de const data = await response.json(); porque o retorno é direto
            return await response.json();
        } catch (error) {
            console.error('Erro na previsão do tempo:', error);
            return null;
        }
    }

    // Buscar previsões FUTURAS para hoje (não incluir horas que já passaram)
    // Corrigido: Se não houver previsões futuras para hoje, usa min/max de AMANHÃ.
    async getTodayForecast() {
        try {
            const forecastData = await this.get5DayForecast();
            if (!forecastData) return null;

            const now = new Date();
            // Corrigido: Usar a hora atual para o filtro de futuro
            const nowTime = now.getTime(); 
            const today = now.toDateString();

            // Filtrar apenas previsões FUTURAS para hoje
            const futureTodayForecasts = forecastData.list.filter(item => {
                const itemDate = new Date(item.dt * 1000);
                // itemDate > now (ou itemDate.getTime() > nowTime) é mais seguro que toDateString()
                return itemDate.toDateString() === today && itemDate.getTime() > nowTime;
            });

            if (futureTodayForecasts.length > 0) {
                // Calcular min e max das previsões futuras de HOJE
                const temps = futureTodayForecasts.map(item => item.main.temp);
                const minTemp = Math.min(...temps);
                const maxTemp = Math.max(...temps);

                return {
                    min: minTemp,
                    max: maxTemp,
                    forecasts: futureTodayForecasts
                };
            }

            // Se não há previsões futuras para hoje, encontra as min/max de amanhã
            const tomorrow = new Date(now);
            tomorrow.setDate(tomorrow.getDate() + 1);
            const tomorrowString = tomorrow.toDateString();

            const tomorrowForecasts = forecastData.list.filter(item => {
                const itemDate = new Date(item.dt * 1000);
                return itemDate.toDateString() === tomorrowString;
            });

            if (tomorrowForecasts.length > 0) {
                // Calcular min e max das previsões de AMANHÃ
                const temps = tomorrowForecasts.map(item => item.main.temp);
                return {
                    min: Math.min(...temps),
                    max: Math.max(...temps),
                    forecasts: tomorrowForecasts
                };
            }

            return null; // Não há previsões futuras (nem hoje nem amanhã)
        } catch (error) {
            console.error('Erro ao buscar previsão do dia:', error);
            return null;
        }
    }

    // Converter código do clima para ícone e descrição (Bootstrap Icons)
    getWeatherIcon(weatherCode) {
        const iconMap = {
            // Clear
            '01d': 'bi-brightness-high', '01n': 'bi-moon',
            // Clouds
            '02d': 'bi-cloud-sun', '02n': 'bi-cloud-moon',
            '03d': 'bi-cloud', '03n': 'bi-cloud',
            '04d': 'bi-clouds', '04n': 'bi-clouds',
            // Rain
            '09d': 'bi-cloud-rain', '09n': 'bi-cloud-rain',
            '10d': 'bi-cloud-rain-heavy', '10n': 'bi-cloud-rain-heavy',
            // Thunderstorm
            '11d': 'bi-cloud-lightning-rain', '11n': 'bi-cloud-lightning-rain', // Corrigido para um ícone mais adequado
            // Snow
            '13d': 'bi-snow', '13n': 'bi-snow',
            // Mist
            '50d': 'bi-cloud-haze', '50n': 'bi-cloud-haze'
        };

        return iconMap[weatherCode] || 'bi-cloud';
    }

    // Formatar temperatura
    formatTemperature(temp) {
        // Corrigido para sempre retornar um número arredondado
        return `${Math.round(temp)}°C`;
    }

    // Renderizar widget na navbar
    async renderWidget() {
        const [currentWeather, todayForecast] = await Promise.all([
            this.getCurrentWeather(),
            this.getTodayForecast()
        ]);

        if (!currentWeather) {
            this.renderError();
            return;
        }

        // Se todayForecast for nulo, usa as temps min/max do 'currentWeather'
        const tempMin = todayForecast ? todayForecast.min : currentWeather.main.temp_min;
        const tempMax = todayForecast ? todayForecast.max : currentWeather.main.temp_max;
        
        // --- CORREÇÃO DO LINK DO GITHUB ---
        // Verifica se já estamos dentro da pasta 'pages'
        const isPagesFolder = window.location.pathname.includes('/pages/');
        
        // Se estiver na pasta pages, o link é direto 'clima.html'. 
        // Se estiver na raiz (index), o link é 'pages/clima.html'.
        // IMPORTANTE: Removemos a barra "/" do início para respeitar o repositório do GitHub.
        const linkPath = isPagesFolder ? 'clima.html' : 'pages/clima.html';
        // ----------------------------------

        const widgetHTML = `
            <div class="weather-widget-content" 
                 onclick="window.location.href='${linkPath}'" 
                 title="Ver detalhes do clima em ${this.cityName}"
                 style="cursor: pointer;">

                <div class="weather-icon">
                    <i class="bi ${this.getWeatherIcon(currentWeather.weather[0].icon)}"></i>
                </div>
                <div class="weather-info">
                    <div class="weather-city">${this.cityName}</div>
                    <div class="weather-temp">${this.formatTemperature(currentWeather.main.temp)}</div>
                    <div class="weather-desc">${currentWeather.weather[0].description}</div>
                    <div class="weather-minmax">
                        <span class="max">${this.formatTemperature(tempMax)}</span>
                        <span class="separator">•</span>
                        <span class="min">${this.formatTemperature(tempMin)}</span>
                    </div>
                </div>
            </div>
        `;

        const widgetContainer = document.getElementById('weather-widget-container');
        if (widgetContainer) {
            widgetContainer.innerHTML = widgetHTML;
        }
    }

    // Renderizar erro
    renderError() {
        const errorHTML = `
            <div class="weather-widget-content error" title="Clima indisponível">
                <div class="weather-icon">
                    <i class="bi bi-cloud-slash"></i>
                </div>
                <div class="weather-info">
                    <div class="weather-city">${this.cityName}</div> <div class="weather-temp">--°C</div>
                    <div class="weather-desc">Indisponível</div>
                </div>
            </div>
        `;

        const widgetContainer = document.getElementById('weather-widget-container');
        if (widgetContainer) {
            widgetContainer.innerHTML = errorHTML;
        }
    }

    // Inicializar widget
    init() {
        this.renderWidget();
        // Corrigido: O intervalo de 30 minutos estava correto, mas convertido para ms
        setInterval(() => this.renderWidget(), 30 * 60 * 1000); 
    }
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', function() {
    // Verifica se o container existe antes de inicializar o widget principal
    if (document.getElementById('weather-widget-container')) {
        const weatherWidget = new WeatherWidget();
        weatherWidget.init();
    }

    // Inicializar a função detalhada se estiver na página correta
    if (document.getElementById('weather-content')) {
        loadDetailedWeather();
    }
});

// Funções para a página de clima detalhado - GLOBAIS
const weatherVideos = {
    '01d': { video: '../imagens/ceu_limpo.mp4', summary: 'Tempo limpo e ensolarado.' },
    '01n': { video: '../imagens/noite_limpa.mp4', summary: 'Noite limpa, sem nuvens.' },
    '02d': { video: '../imagens/dia_parcialmente_nublado.mp4', summary: 'Parcialmente nublado durante o dia.' },
    '02n': { video: '../imagens/noite_parcialmente_nublada.mp4', summary: 'Parcialmente nublado durante a noite.' },
    '03d': { video: '../imagens/ceu_nublado.mp4', summary: 'Dia nublado, com muitas nuvens.' },
    '03n': { video: '../imagens/ceu_nublado.mp4', summary: 'Noite nublada.' },
    '04d': { video: '../imagens/dia_nublado.mp4', summary: 'Céu totalmente encoberto.' },
    '04n': { video: '../imagens/dia_nublado.mp4', summary: 'Céu totalmente encoberto.' },
    '09d': { video: '../imagens/dia_chuva_fraca.mp4', summary: 'Dia com chuva fraca.' },
    '09n': { video: '../imagens/noite_chuva_fraca.mp4', summary: 'Noite com chuva fraca.' },
    '10d': { video: '../imagens/dia_chuva_forte.mp4', summary: 'Chuva moderada a forte durante o dia.' },
    '10n': { video: '../imagens/noite_chuva_forte.mp4', summary: 'Chuva moderada a forte durante a noite.' },
    '11d': { video: '../imagens/tempestade_com_raios.mp4', summary: 'Tempestade com raios e trovões.' },
    '11n': { video: '../imagens/tempestade_com_raios.mp4', summary: 'Tempestade com raios e trovões.' },
    '13d': { video: '../imagens/ceu_nublado.mp4', summary: 'Tempo com neve.' },
    '13n': { video: '../imagens/ceu_nublado.mp4', summary: 'Noite com neve.' },
    '50d': { video: '../imagens/ceu_nublado.mp4', summary: 'Névoa ou neblina.' },
    '50n': { video: '../imagens/ceu_nublado.mp4', summary: 'Névoa ou neblina.' },
};

// Função auxiliar para gerar a previsão de 5 dias corretamente
function generate5DayForecast(forecastData, weatherWidget) {
    const dailyForecasts = {};
    
    // Agrupar previsões por dia
    forecastData.list.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dateKey = date.toDateString();
        
        if (!dailyForecasts[dateKey]) {
            dailyForecasts[dateKey] = [];
        }
        
        dailyForecasts[dateKey].push(item);
    });
    
    // Obter os próximos 5 dias (excluindo hoje se já passou a maior parte do dia)
    const now = new Date();
    const nowTime = now.getTime(); // Corrigido para usar a hora atual
    const todayKey = now.toDateString();
    
    const forecastDays = Object.keys(dailyForecasts)
        .filter(dateKey => {
            // Incluir hoje apenas se ainda houver previsões futuras
            if (dateKey === todayKey) {
                // Filtra se existe pelo menos uma previsão futura para hoje
                const hasFutureForecasts = dailyForecasts[dateKey].some(item => 
                    new Date(item.dt * 1000).getTime() > nowTime
                );
                return hasFutureForecasts;
            }
            return true;
        })
        .sort((a, b) => new Date(a).getTime() - new Date(b).getTime()) // Corrigido: Garante que os dias estejam em ordem cronológica
        .slice(0, 5); // Pegar apenas 5 dias
    
    return forecastDays.map(dateKey => {
        const dayForecasts = dailyForecasts[dateKey];
        const date = new Date(dateKey);
        
        // Calcular min/max do dia
        const temps = dayForecasts.map(item => item.main.temp);
        const minTemp = Math.min(...temps);
        const maxTemp = Math.max(...temps);
        
        // Encontrar a previsão mais representativa (geralmente meio-dia)
        const representativeForecast = dayForecasts.find(item => {
            const hour = new Date(item.dt * 1000).getHours();
            return hour >= 11 && hour <= 14; // Preferir previsão do meio-dia (12h)
        }) || dayForecasts[0]; // Fallback para primeira previsão
        
        return `
            <div class="forecast-day">
                <h5>${date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })}</h5>
                <div class="forecast-icon">
                    <i class="bi ${weatherWidget.getWeatherIcon(representativeForecast.weather[0].icon)}"></i>
                </div>
                <div class="forecast-minmax">
                    <span class="max">${weatherWidget.formatTemperature(maxTemp)}</span>
                    <span class="separator">•</span>
                    <span class="min">${weatherWidget.formatTemperature(minTemp)}</span>
                </div>
                <p class="mb-0">${representativeForecast.weather[0].description.charAt(0).toUpperCase() + representativeForecast.weather[0].description.slice(1)}</p>
                <small class="text-muted">${dayForecasts.length} previsões</small>
            </div>
        `;
    });
}

async function loadDetailedWeather() {
    const weatherWidget = new WeatherWidget();
    const weatherContent = document.getElementById('weather-content');
    const loadingSpinner = document.querySelector('.loading-spinner');
    const heroVideo = document.getElementById('weather-video-bg');
    const heroSummary = document.getElementById('current-weather-summary');
    const heroTitle = document.querySelector('#weather-hero h1');

    // Garante que o spinner e o conteúdo estejam na tela ou ocultos corretamente
    if (loadingSpinner) loadingSpinner.style.display = 'block';
    if (weatherContent) weatherContent.style.display = 'none';

    try {
        const currentWeather = await weatherWidget.getCurrentWeather();
        if (!currentWeather) {
            throw new Error('Não foi possível obter os dados do clima atual.');
        }

        const forecastData = await weatherWidget.get5DayForecast();
        if (!forecastData) {
            throw new Error('Não foi possível obter a previsão de 5 dias.');
        }

        const iconCode = currentWeather.weather[0].icon;
        const videoInfo = weatherVideos[iconCode] || { video: '../imagens/clima/nublado.mp4', summary: 'Condições do tempo não especificadas.' };

        // Atualiza o background da seção
        if (heroVideo) {
            const source = heroVideo.querySelector('source');
            if (source) {
                 source.src = videoInfo.video;
                 heroVideo.load();
                 // Tenta tocar o vídeo (pode ser bloqueado pelo navegador)
                 heroVideo.play().catch(e => console.warn("Autoplay bloqueado:", e));
            }
        }

        // Atualiza a descrição e o ícone do título (Hero Section)
        if (heroSummary) {
            const description = currentWeather.weather[0].description.charAt(0).toUpperCase() + currentWeather.weather[0].description.slice(1);
            heroSummary.textContent = `${description}, ${weatherWidget.formatTemperature(currentWeather.main.temp)}`;
        }

        if (heroTitle) {
            const currentIcon = heroTitle.querySelector('i');
            if (currentIcon) {
                currentIcon.className = `bi ${weatherWidget.getWeatherIcon(iconCode)} me-3`;
            }
        }

        const todayForecast = await weatherWidget.getTodayForecast();
        
        // Acesso seguro aos dados do todayForecast (min/max)
        const tempMin = todayForecast ? weatherWidget.formatTemperature(todayForecast.min) : 'N/A';
        const tempMax = todayForecast ? weatherWidget.formatTemperature(todayForecast.max) : 'N/A';


        // Construir todo o conteúdo de uma vez
        const mainTempHTML = `
            <div class="current-weather-card text-center mb-5">
                <div class="main-temp">
                    <i class="bi ${weatherWidget.getWeatherIcon(currentWeather.weather[0].icon)}"></i>
                    <div>
                        <span class="temperature">${weatherWidget.formatTemperature(currentWeather.main.temp)}</span>
                        <div class="min-max-today">Min: ${tempMin} / Max: ${tempMax}</div> </div>
                </div>
                <h4 class="mb-3">${currentWeather.weather[0].description.charAt(0).toUpperCase() + currentWeather.weather[0].description.slice(1)}</h4>
                <div class="weather-details">
                    <div class="detail-item">
                        <i class="bi bi-thermometer-half"></i>
                        <span>Sensação Térmica: <strong>${weatherWidget.formatTemperature(currentWeather.main.feels_like)}</strong></span>
                    </div>
                    <div class="detail-item">
                        <i class="bi bi-wind"></i>
                        <span>Vento: <strong>${Math.round(currentWeather.wind.speed * 3.6)} km/h</strong></span>
                    </div>
                    <div class="detail-item">
                        <i class="bi bi-water"></i>
                        <span>Umidade: <strong>${currentWeather.main.humidity}%</strong></span>
                    </div>
                    <div class="detail-item">
                        <i class="bi bi-droplet"></i>
                        <span>Pressão: <strong>${currentWeather.main.pressure} hPa</strong></span>
                    </div>
                    <div class="detail-item">
                        <i class="bi bi-sun"></i>
                        <span>Nascer do Sol: <strong>${new Date(currentWeather.sys.sunrise * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong></span>
                    </div>
                    <div class="detail-item">
                        <i class="bi bi-sunset"></i>
                        <span>Pôr do Sol: <strong>${new Date(currentWeather.sys.sunset * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</strong></span>
                    </div>
                </div>
            </div>
        `;

        // Renderizar a previsão de 5 dias CORRETAMENTE
        const forecastHTML = `
            <div class="forecast-section mt-5">
                <h2 class="mb-4 text-center">Previsão para ${weatherWidget.cityName}</h2> <div class="forecast-grid">
                    ${generate5DayForecast(forecastData, weatherWidget).join('')}
                </div>
            </div>
        `;

        // Juntar todo o conteúdo e inserir de uma vez
        if (weatherContent) {
            weatherContent.innerHTML = mainTempHTML + forecastHTML;
        }

        const lastUpdateElement = document.getElementById('last-update-time');
        if (lastUpdateElement) {
            lastUpdateElement.textContent = new Date().toLocaleString('pt-BR');
        }

        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (weatherContent) weatherContent.style.display = 'block';

        // Animar o scroll para a seção de previsão
        const scrollToForecastButton = document.getElementById('scroll-to-forecast');
        if (scrollToForecastButton) {
            scrollToForecastButton.addEventListener('click', () => {
                const forecastSection = document.querySelector('.forecast-section');
                if (forecastSection) {
                    forecastSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        }
    } catch (error) {
        console.error('Erro na renderização do clima detalhado:', error);
        
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (weatherContent) weatherContent.style.display = 'block';

        if (weatherContent) {
            weatherContent.innerHTML = `
                <div class="alert alert-danger text-center">
                    <i class="bi bi-exclamation-triangle"></i>
                    <h4>Erro ao carregar os dados do clima.</h4>
                    <p>Detalhes: ${error.message || 'Verifique sua conexão ou a API Key.'}</p>
                    <button onclick="location.reload()" class="btn btn-primary">
                        <i class="bi bi-arrow-clockwise"></i> Recarregar Página
                    </button>
                </div>
            `;
        }

        if (heroVideo) heroVideo.style.display = 'none';
        if (heroSummary) heroSummary.textContent = 'Dados indisponíveis.';
    }
}

