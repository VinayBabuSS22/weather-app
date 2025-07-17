var cityInput = document.getElementById("searchCity");
var unit = "metric";

const defaultBackgrounds = ["nature1.jpg", "nature2.jpg", "nature3.jpg"];
function setDefaultBackground() {
  var randomBg = defaultBackgrounds[Math.floor(Math.random() * defaultBackgrounds.length)];
  document.querySelector('.weather-wrapper').style.background =
    "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('media/" + randomBg + "')";
}
setDefaultBackground();

function getWeatherBackground(weatherType, isDayTime) {
  const normalized = weatherType.toLowerCase();
  const map = {
    rain: { day: ["rainy1.jpg", "rainy2.jpg"], night: ["rainy3.jpg", "rainy4.jpg"] },
    clouds: { day: ["cloudy1.jpg", "cloudy2.jpg"], night: ["cloudy3.jpg", "cloudy4.jpg"] },
    clear: { day: ["day1.jpg", "day2.jpg"], night: ["night1.jpg", "night2.jpg"] }
  };
  if (normalized.includes("rain")) return isDayTime ? map.rain.day : map.rain.night;
  if (normalized.includes("cloud")) return isDayTime ? map.clouds.day : map.clouds.night;
  if (normalized.includes("clear")) return isDayTime ? map.clear.day : map.clear.night;
  return isDayTime ? map.clear.day : map.clear.night;
}

function preloadImages(weatherType, isDayTime) {
  const category = getWeatherBackground(weatherType, isDayTime);
  category.forEach(src => {
    const img = new Image();
    img.src = `media/${src}`;
  });
}

function updateBackground(weatherType, sunrise, sunset) {
  const now = Math.floor(Date.now() / 1000); // in seconds
  const isDayTime = now >= sunrise && now < sunset;
  const images = getWeatherBackground(weatherType, isDayTime);
  const randomBackground = images[Math.floor(Math.random() * images.length)];
  document.querySelector('.weather-wrapper').style.background =
    "linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('media/" + randomBackground + "')";
}

function convertTemperature(value) {
  return unit === "metric" ? value : value * 9 / 5 + 32;
}

function formatTemperature(value) {
  return `${Math.round(value)}<sup>o</sup>${unit === "metric" ? "C" : "F"}`;
}

function formatForecastDate(dateObj) {
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
  const date = dateObj.getDate();
  const month = dateObj.getMonth() + 1;
  return `${weekday}, ${date}/${month}`;
}

function formatTimeFromUnix(unixTimestamp) {
  const date = new Date(unixTimestamp * 1000);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function getWeather(cityInputValue) {
  try {
    const apiKey = "f413c72223465d4ab6ff9fc4881e9625";
    const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityInputValue}&appid=${apiKey}&units=${unit}`;
    loader();

    const response = await fetch(apiUrl);
    const data = await response.json();
    if (data.cod === 200) {
      const location = data.name;
      const temperature = data.main.temp;
      const realFeel = data.main.feels_like;
      const weatherType = data.weather[0].description;
      const windSpeed = unit === "metric" ? data.wind.speed : data.wind.speed * 1.60934;
      const windDirection = data.wind.deg;
      const visibility = data.visibility / 1000;
      const pressure = data.main.pressure;
      const humidity = data.main.humidity;
      const sunrise = data.sys.sunrise;
      const sunset = data.sys.sunset;

      const now = Math.floor(Date.now() / 1000);
      const isDayTime = now > sunrise && now < sunset;

      updateBackground(weatherType, sunrise, sunset);
      preloadImages(weatherType, isDayTime);

      const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
      const dirIndex = Math.round(windDirection / 45) % 8;
      const compassDir = directions[dirIndex];

      // forecast fetch
      fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${cityInputValue}&appid=${apiKey}&units=${unit}`)
        .then(res => res.json())
        .then(forecastData => {
          const forecastContainer = document.getElementById('forecast-container');
          forecastContainer.innerHTML = '';

          const dailyForecasts = {};
          forecastData.list.forEach(entry => {
            const dateTime = new Date(entry.dt * 1000);
            const dateKey = dateTime.toDateString();

            if (!dailyForecasts[dateKey]) {
              dailyForecasts[dateKey] = {
                date: formatForecastDate(dateTime),
                icon: `https://openweathermap.org/img/w/${entry.weather[0].icon}.png`,
                maxTemp: entry.main.temp_max,
                minTemp: entry.main.temp_min,
                weatherType: entry.weather[0].main
              };
            } else {
              dailyForecasts[dateKey].maxTemp = Math.max(dailyForecasts[dateKey].maxTemp, entry.main.temp_max);
              dailyForecasts[dateKey].minTemp = Math.min(dailyForecasts[dateKey].minTemp, entry.main.temp_min);
            }
          });

          Object.values(dailyForecasts).forEach(day => {
            const forecastCard = document.createElement('div');
            forecastCard.classList.add('daily-forecast-card');
            forecastCard.innerHTML = `
              <p class="daily-forecast-date">${day.date}</p>
              <div class="daily-forecast-logo"><img class="imgs-as-icons" src="${day.icon}" alt="Weather Icon"></div>
              <div class="max-min-temperature-daily-forecast">
                <span class="max-daily-forecast">${formatTemperature(day.maxTemp)}</span>
                <span class="min-daily-forecast">${formatTemperature(day.minTemp)}</span>
              </div>
              <p class="weather-type-daily-forecast">${day.weatherType}</p>
            `;
            forecastContainer.appendChild(forecastCard);
          });

          const todayDate = new Date().toDateString();
          if (dailyForecasts[todayDate]) {
            document.getElementById("maxTemperatureAdditionalValue").innerHTML = formatTemperature(dailyForecasts[todayDate].maxTemp);
            document.getElementById("minTemperatureAdditionalValue").innerHTML = formatTemperature(dailyForecasts[todayDate].minTemp);
          }
        });

      // Set Current Weather Values
      document.getElementById("locationName").innerHTML = location;
      document.getElementById("temperatureValue").innerHTML = temperature.toFixed(2) + "<sup>o</sup>" + (unit === "metric" ? "C" : "F");
      document.getElementById("weatherType").innerHTML = weatherType;
      document.getElementById("realFeelAdditionalValue").innerHTML = realFeel.toFixed(2) + "<sup>o</sup>" + (unit === "metric" ? "C" : "F");
      document.getElementById("windSpeedAdditionalValue").innerHTML = windSpeed.toFixed(2) + " km/h";
      document.getElementById("windDirectionAdditionalValue").innerHTML = `${windDirection}° (${compassDir})`;
      document.getElementById("visibilityAdditionalValue").innerHTML = visibility + " km";
      document.getElementById("pressureAdditionalValue").innerHTML = pressure;
      document.getElementById("humidityAdditionalValue").innerHTML = humidity + "%";
      document.getElementById("sunriseAdditionalValue").innerHTML = formatTimeFromUnix(sunrise);
      document.getElementById("sunsetAdditionalValue").innerHTML = formatTimeFromUnix(sunset);
    } else {
      document.getElementById("locationName").innerHTML = "City Not Found. <a href='#' onclick='cityInput.value=\"\";document.getElementById(\"locationName\").innerHTML=\"Search City...\";'>Try Again</a>";
    }
  } catch (err) {
    console.error("Fetch error:", err);
    document.getElementById("locationName").innerHTML = "Error fetching data. <a href='#' onclick='cityInput.value=\"\";document.getElementById(\"locationName\").innerHTML=\"Search City...\";'>Retry</a>";
  }
}

function loader() {
  document.getElementById("locationName").innerHTML = "";
  document.getElementById("temperatureValue").innerHTML = "";
  document.getElementById("weatherType").innerHTML = "";
  ["locationName", "temperatureValue", "weatherType"].forEach(id => {
    const loaderImg = document.createElement("img");
    loaderImg.src = "icons/loader.gif";
    loaderImg.className = "loader-img";
    document.getElementById(id).appendChild(loaderImg);
  });
}

cityInput.addEventListener("keyup", function (e) {
  if (e.key === "Enter") {
    if (cityInput.value !== "") getWeather(cityInput.value);
    else document.getElementById("locationName").innerHTML = "Enter a city name...";
  }
});

document.getElementById("toggleUnit").addEventListener("click", function () {
  unit = unit === "metric" ? "imperial" : "metric";
  if (cityInput.value) {
    loader();
    getWeather(cityInput.value);
  }
});

var cityInputMobile = document.getElementById("mobileSearchCity");
cityInputMobile.addEventListener("keyup", function (e) {
  if (e.key === "Enter") {
    if (cityInputMobile.value !== "") getWeather(cityInputMobile.value);
    else document.getElementById("locationName").innerHTML = "Enter a city name...";
  }
});
