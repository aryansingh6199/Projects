const API_KEY = "71a9cdc68407f0284bc178e7adc6d23f";

function updateBackground(condition) {
  const body = document.getElementById("appBody");
  if (condition.includes("rain")) {
    body.style.background = "linear-gradient(to right, #3a6186, #89253e)";
  } else if (condition.includes("cloud")) {
    body.style.background = "linear-gradient(to right, #bdc3c7, #2c3e50)";
  } else if (condition.includes("clear")) {
    body.style.background = "linear-gradient(to right, #56ccf2, #2f80ed)";
  } else if (condition.includes("snow")) {
    body.style.background = "linear-gradient(to right, #e6dada, #274046)";
  } else {
    body.style.background = "#4facfe";
  }
}

function saveSearch(city) {
  let history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  if (!history.includes(city)) {
    history.unshift(city);
    if (history.length > 5) history.pop();
    localStorage.setItem("weatherHistory", JSON.stringify(history));
  }
  showHistory();
}

function showHistory() {
  const history = JSON.parse(localStorage.getItem("weatherHistory")) || [];
  const historyDiv = document.getElementById("searchHistory");
  historyDiv.innerHTML = '';
  history.forEach(city => {
    const btn = document.createElement("button");
    btn.innerText = city;
    btn.onclick = () => {
      document.getElementById("cityInput").value = city;
      getWeather();
    };
    historyDiv.appendChild(btn);
  });
}

function showMap(lat, lon) {
  const mapDiv = document.getElementById("map");
  mapDiv.style.display = "block";
  mapDiv.innerHTML = `
    <iframe 
      width="100%" 
      height="100%" 
      frameborder="0" 
      src="https://maps.google.com/maps?q=${lat},${lon}&z=10&output=embed">
    </iframe>
  `;
}

async function getWeather() {
  const city = document.getElementById("cityInput").value.trim();
  const currentDiv = document.getElementById("currentWeather");
  const forecastDiv = document.getElementById("forecast");
  const errorDiv = document.getElementById("error");

  currentDiv.innerHTML = '';
  forecastDiv.innerHTML = '';
  errorDiv.textContent = '';

  if (!city) {
    errorDiv.textContent = "Please enter a city name.";
    return;
  }

  try {
    const currentResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${API_KEY}`);
    const forecastResponse = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${API_KEY}`);

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    if (currentData.cod !== 200 || forecastData.cod !== "200") {
      errorDiv.textContent = "City not found or API error.";
      return;
    }

    const { name, sys, main, weather, wind, coord } = currentData;
    const condition = weather[0].main.toLowerCase();

    updateBackground(condition);
    saveSearch(name);
    showMap(coord.lat, coord.lon);

    currentDiv.innerHTML = `
      <h3>${name}, ${sys.country}</h3>
      <img src="https://openweathermap.org/img/wn/${weather[0].icon}@2x.png" class="weather-icon" />
      <p><strong>${weather[0].description}</strong></p>
      <p>🌡️ Temp: ${main.temp}°C | Feels: ${main.feels_like}°C</p>
      <p>💧 Humidity: ${main.humidity}% | 🌬️ Wind: ${wind.speed} m/s</p>
      <p>🔽 Pressure: ${main.pressure} hPa</p>
    `;

    const dailyForecast = {};
    forecastData.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0];
      if (!dailyForecast[date] && item.dt_txt.includes("12:00:00")) {
        dailyForecast[date] = item;
      }
    });

    for (let date in dailyForecast) {
      const day = new Date(date).toDateString().split(' ')[0];
      const forecast = dailyForecast[date];
      forecastDiv.innerHTML += `
        <div class="day">
          <h4>${day}</h4>
          <img src="https://openweathermap.org/img/wn/${forecast.weather[0].icon}.png" alt="">
          <p>${forecast.weather[0].main}</p>
          <p>${forecast.main.temp}°C</p>
        </div>
      `;
    }

  } catch (error) {
    errorDiv.textContent = "Failed to fetch data.";
    console.error(error);
  }
}

showHistory();
