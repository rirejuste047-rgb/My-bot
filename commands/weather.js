import axios from 'axios';

export default async function weatherCommand(message, client, { args }) {
  const remoteJid = message.key.remoteJid;
  
  if (!args[0]) {
    return await client.sendMessage(remoteJid, { 
      text: "⚠️ Please specify a city!\nUsage: .weather [city name]" 
    });
  }
  
  const city = args.join(' ');
  
  try {
    await client.sendMessage(remoteJid, { text: `🌤️ Checking weather for ${city}...` });
    
    // Using OpenWeatherMap API (you need to get your own API key)
    const apiKey = 'YOUR_API_KEY_HERE'; // Replace with your API key
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`
    );
    
    const data = response.data;
    const weatherText = `
🌍 *WEATHER REPORT*

*City:* ${data.name}, ${data.sys.country}
*Temperature:* ${data.main.temp}°C
*Feels like:* ${data.main.feels_like}°C
*Condition:* ${data.weather[0].description}
*Humidity:* ${data.main.humidity}%
*Wind:* ${data.wind.speed} m/s
*Pressure:* ${data.main.pressure} hPa
*Visibility:* ${(data.visibility / 1000).toFixed(1)} km

*Sunrise:* ${new Date(data.sys.sunrise * 1000).toLocaleTimeString()}
*Sunset:* ${new Date(data.sys.sunset * 1000).toLocaleTimeString()}
`;

    await client.sendMessage(remoteJid, { text: weatherText });
    
  } catch (error) {
    if (error.response?.status === 404) {
      await client.sendMessage(remoteJid, { text: "❌ City not found!" });
    } else {
      await client.sendMessage(remoteJid, { 
        text: `❌ Weather service error: ${error.message}` 
      });
    }
  }
}
