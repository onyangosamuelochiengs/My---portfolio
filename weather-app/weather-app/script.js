const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const cityName = document.getElementById('cityName');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const details = document.getElementById('details');
const status = document.getElementById('status');
const forecastWrap = document.getElementById('forecastWrap');
const forecast = document.getElementById('forecast');

// WMO weather codes used by Open-Meteo
const WEATHER_CODES = {
    0: 'Clear sky',
    1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog',
    51: 'Light drizzle', 53: 'Drizzle', 55: 'Heavy drizzle',
    56: 'Freezing drizzle', 57: 'Freezing drizzle',
    61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
    66: 'Freezing rain', 67: 'Freezing rain',
    71: 'Light snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
    80: 'Light rain showers', 81: 'Rain showers', 82: 'Violent rain showers',
    85: 'Snow showers', 86: 'Heavy snow showers',
    95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail'
};

async function getWeather() {
    const city = cityInput.value.trim();
    if (city === '') {
        showStatus('Please type a city name.', true);
        return;
    }

    setLoading(true);
    showStatus('Loading...', false);

    try {
        // Step 1: turn the city name into coordinates
        const geoUrl = 'https://geocoding-api.open-meteo.com/v1/search'
            + '?name=' + encodeURIComponent(city) + '&count=1&language=en&format=json';
        const geoResponse = await fetch(geoUrl);
        if (!geoResponse.ok) throw new Error('Location service unavailable.');
        const geoData = await geoResponse.json();

        if (!geoData.results || geoData.results.length === 0) {
            clearResult();
            showStatus('City not found. Check the spelling and try again.', true);
            return;
        }

        const place = geoData.results[0];

        // Step 2: get current weather and a 5-day forecast for those coordinates
        const weatherUrl = 'https://api.open-meteo.com/v1/forecast'
            + '?latitude=' + place.latitude
            + '&longitude=' + place.longitude
            + '&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m'
            + '&daily=weather_code,temperature_2m_max,temperature_2m_min'
            + '&forecast_days=5&timezone=auto';
        const weatherResponse = await fetch(weatherUrl);
        if (!weatherResponse.ok) throw new Error('Weather service unavailable.');
        const data = await weatherResponse.json();

        // Step 3: show the results
        const label = place.country ? place.name + ', ' + place.country : place.name;
        cityName.textContent = label;
        temperature.textContent = Math.round(data.current.temperature_2m) + '°C';
        description.textContent = WEATHER_CODES[data.current.weather_code] || 'Unknown conditions';
        details.innerHTML = '';
        details.append(
            makeDetail('Humidity', data.current.relative_humidity_2m + '%'),
            makeDetail('Wind', Math.round(data.current.wind_speed_10m) + ' km/h')
        );
        renderForecast(data.daily);
        showStatus('Updated just now.', false);
    } catch (error) {
        clearResult();
        showStatus('Could not load weather. Check your internet connection and try again.', true);
    } finally {
        setLoading(false);
    }
}

function renderForecast(daily) {
    forecast.innerHTML = '';

    daily.time.forEach((date, i) => {
        const card = document.createElement('div');
        card.className = 'forecast-day';

        const day = document.createElement('strong');
        day.textContent = i === 0
            ? 'Today'
            : new Date(date + 'T00:00:00').toLocaleDateString('en', { weekday: 'short' });

        const desc = document.createElement('div');
        desc.className = 'desc';
        desc.textContent = WEATHER_CODES[daily.weather_code[i]] || 'Unknown';

        const range = document.createElement('div');
        range.className = 'range';
        range.textContent = Math.round(daily.temperature_2m_max[i]) + '° / '
            + Math.round(daily.temperature_2m_min[i]) + '°';

        card.append(day, desc, range);
        forecast.appendChild(card);
    });

    forecastWrap.hidden = false;
}

function makeDetail(label, value) {
    const span = document.createElement('span');
    span.innerHTML = '<strong>' + label + ':</strong> ' + value;
    return span;
}

function clearResult() {
    cityName.textContent = '';
    temperature.textContent = '';
    description.textContent = '';
    details.innerHTML = '';
    forecast.innerHTML = '';
    forecastWrap.hidden = true;
}

function showStatus(message, isError) {
    status.textContent = message;
    status.classList.toggle('error', isError);
}

function setLoading(isLoading) {
    searchBtn.disabled = isLoading;
    searchBtn.textContent = isLoading ? '...' : 'Search';
}

searchBtn.addEventListener('click', getWeather);
cityInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') getWeather();
});
