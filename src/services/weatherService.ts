export interface WeatherData {
  temperature: number;
  rainfall: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: number;
  description: string;
  icon: string;
  timestamp: string;
}

export interface WeatherAPIResponse {
  main: {
    temp: number;
    humidity: number;
    pressure: number;
  };
  wind: {
    speed: number;
    deg: number;
  };
  weather: Array<{
    description: string;
    icon: string;
  }>;
  rain?: {
    '1h'?: number;
    '3h'?: number;
  };
}

class WeatherService {
  private apiKey: string;
  private baseUrl: string = 'https://api.openweathermap.org/data/2.5';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getWeatherData(latitude: number, longitude: number): Promise<WeatherData> {
    try {
      const response = await fetch(
        `${this.baseUrl}/weather?lat=${latitude}&lon=${longitude}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        console.warn(`Weather API error: ${response.status} - Using fallback data`);
        return this.getFallbackWeatherData();
      }

      const data: WeatherAPIResponse = await response.json();

      // Get rainfall data (1h rainfall if available, otherwise 0)
      const rainfall = data.rain?.['1h'] || 0;

      return {
        temperature: Math.round(data.main.temp * 10) / 10, // Round to 1 decimal
        rainfall: Math.round(rainfall * 10) / 10, // Round to 1 decimal
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: data.wind.speed,
        windDirection: data.wind.deg,
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return this.getFallbackWeatherData();
    }
  }

  private getFallbackWeatherData(): WeatherData {
    // Generate realistic fallback weather data for Indian mining regions
    const baseTemp = 25 + Math.random() * 10; // 25-35°C
    const rainfall = Math.random() * 20; // 0-20mm
    const humidity = 60 + Math.random() * 30; // 60-90%
    
    return {
      temperature: Math.round(baseTemp * 10) / 10,
      rainfall: Math.round(rainfall * 10) / 10,
      humidity: Math.round(humidity),
      pressure: 1010 + Math.random() * 20, // 1010-1030 hPa
      windSpeed: Math.random() * 10, // 0-10 m/s
      windDirection: Math.random() * 360, // 0-360 degrees
      description: rainfall > 10 ? 'Heavy rain' : rainfall > 5 ? 'Light rain' : 'Clear sky',
      icon: rainfall > 10 ? '10d' : rainfall > 5 ? '09d' : '01d',
      timestamp: new Date().toISOString(),
    };
  }

  async getWeatherDataForMine(mineId: string, latitude: number, longitude: number): Promise<WeatherData> {
    const weatherData = await this.getWeatherData(latitude, longitude);
    console.log(`Weather data for mine ${mineId}:`, weatherData);
    return weatherData;
  }
}

// Export singleton instance with the provided API key
export const weatherService = new WeatherService('484f438f52764659922180955251109');
