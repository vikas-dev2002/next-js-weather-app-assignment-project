"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Cloud,
  Droplets,
  Thermometer,
  Wind,
  Gauge,
  Sun,
  CloudRain,
  CloudSnow,
  CloudFog,
  CloudLightning,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface WeatherDisplayProps {
  city: string
  lat: number
  lon: number
}

interface CurrentWeather {
  temp: number
  feels_like: number
  temp_min: number
  temp_max: number
  humidity: number
  pressure: number
  wind_speed: number
  description: string
  icon: string
  main: string
}

interface ForecastDay {
  date: string
  day: string
  temp_max: number
  temp_min: number
  description: string
  icon: string
  main: string
  humidity: number
  wind_speed: number
  precipitation: number
}

export function WeatherDisplay({ city, lat, lon }: WeatherDisplayProps) {
  const [currentWeather, setCurrentWeather] = useState<CurrentWeather | null>(null)
  const [forecast, setForecast] = useState<ForecastDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    async function fetchWeatherData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch current weather
        const currentResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=e5b888c72e9570148c2e37df4fa7c137`,
        )

        if (!currentResponse.ok) {
          throw new Error("Failed to fetch current weather data")
        }

        const currentData = await currentResponse.json()

        setCurrentWeather({
          temp: currentData.main.temp,
          feels_like: currentData.main.feels_like,
          temp_min: currentData.main.temp_min,
          temp_max: currentData.main.temp_max,
          humidity: currentData.main.humidity,
          pressure: currentData.main.pressure,
          wind_speed: currentData.wind.speed,
          description: currentData.weather[0].description,
          icon: currentData.weather[0].icon,
          main: currentData.weather[0].main,
        })

        // Fetch 5-day forecast
        const forecastResponse = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=e5b888c72e9570148c2e37df4fa7c137`,
        )

        if (!forecastResponse.ok) {
          throw new Error("Failed to fetch forecast data")
        }

        const forecastData = await forecastResponse.json()

        // Process forecast data to get daily forecasts
        const dailyForecasts: Record<string, ForecastDay> = {}

        forecastData.list.forEach((item: any) => {
          const date = new Date(item.dt * 1000)
          const dateStr = date.toISOString().split("T")[0]
          const dayName = date.toLocaleDateString("en-US", { weekday: "long" })

          if (!dailyForecasts[dateStr]) {
            dailyForecasts[dateStr] = {
              date: dateStr,
              day: dayName,
              temp_max: item.main.temp_max,
              temp_min: item.main.temp_min,
              description: item.weather[0].description,
              icon: item.weather[0].icon,
              main: item.weather[0].main,
              humidity: item.main.humidity,
              wind_speed: item.wind.speed,
              precipitation: item.pop * 100, // Probability of precipitation as percentage
            }
          } else {
            // Update max/min temperatures if needed
            if (item.main.temp_max > dailyForecasts[dateStr].temp_max) {
              dailyForecasts[dateStr].temp_max = item.main.temp_max
            }
            if (item.main.temp_min < dailyForecasts[dateStr].temp_min) {
              dailyForecasts[dateStr].temp_min = item.main.temp_min
            }
          }
        })

        setForecast(Object.values(dailyForecasts))

        // Update the cities table with weather data
        updateCitiesTableWithWeather({
          temp: currentData.main.temp,
          high: currentData.main.temp_max,
          low: currentData.main.temp_min,
          description: currentData.weather[0].description,
        })
      } catch (err) {
        console.error("Error fetching weather data:", err)
        setError("Failed to load weather data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    fetchWeatherData()
  }, [lat, lon, city])

  const updateCitiesTableWithWeather = (weatherData: {
    temp: number
    high: number
    low: number
    description: string
  }) => {
    // This function would ideally use a global state management solution
    // For now, we'll use localStorage to persist the data between pages
    try {
      const citiesWithWeather = JSON.parse(localStorage.getItem("citiesWithWeather") || "{}")
      citiesWithWeather[city] = weatherData
      localStorage.setItem("citiesWithWeather", JSON.stringify(citiesWithWeather))
    } catch (err) {
      console.error("Error updating cities table with weather:", err)
    }
  }

  const getWeatherIcon = (main: string) => {
    switch (main.toLowerCase()) {
      case "clear":
        return <Sun className="h-8 w-8 text-yellow-500" />
      case "clouds":
        return <Cloud className="h-8 w-8 text-gray-500" />
      case "rain":
      case "drizzle":
        return <CloudRain className="h-8 w-8 text-blue-500" />
      case "snow":
        return <CloudSnow className="h-8 w-8 text-blue-200" />
      case "thunderstorm":
        return <CloudLightning className="h-8 w-8 text-purple-500" />
      case "mist":
      case "fog":
      case "haze":
        return <CloudFog className="h-8 w-8 text-gray-400" />
      default:
        return <Cloud className="h-8 w-8 text-gray-500" />
    }
  }

  const getBackgroundClass = () => {
    if (!currentWeather) return "bg-gradient-to-b from-blue-100 to-blue-50"

    const main = currentWeather.main.toLowerCase()

    switch (main) {
      case "clear":
        return "bg-gradient-to-b from-blue-400 to-blue-100"
      case "clouds":
        return "bg-gradient-to-b from-gray-300 to-gray-100"
      case "rain":
      case "drizzle":
        return "bg-gradient-to-b from-blue-700 to-blue-300"
      case "snow":
        return "bg-gradient-to-b from-blue-100 to-white"
      case "thunderstorm":
        return "bg-gradient-to-b from-purple-700 to-purple-300"
      case "mist":
      case "fog":
      case "haze":
        return "bg-gradient-to-b from-gray-400 to-gray-200"
      default:
        return "bg-gradient-to-b from-blue-100 to-blue-50"
    }
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-8">
      {currentWeather && (
        <div className={`rounded-xl p-6 text-white ${getBackgroundClass()}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h2 className="text-4xl font-bold">{city}</h2>
              <p className="text-xl capitalize">{currentWeather.description}</p>
            </div>

            <div className="flex items-center">
              {getWeatherIcon(currentWeather.main)}
              <span className="ml-2 text-5xl font-bold">{Math.round(currentWeather.temp)}°C</span>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="flex items-center">
              <Thermometer className="mr-2 h-5 w-5" />
              <div>
                <p className="text-sm">Feels Like</p>
                <p className="font-medium">{Math.round(currentWeather.feels_like)}°C</p>
              </div>
            </div>

            <div className="flex items-center">
              <Wind className="mr-2 h-5 w-5" />
              <div>
                <p className="text-sm">Wind</p>
                <p className="font-medium">{currentWeather.wind_speed} m/s</p>
              </div>
            </div>

            <div className="flex items-center">
              <Droplets className="mr-2 h-5 w-5" />
              <div>
                <p className="text-sm">Humidity</p>
                <p className="font-medium">{currentWeather.humidity}%</p>
              </div>
            </div>

            <div className="flex items-center">
              <Gauge className="mr-2 h-5 w-5" />
              <div>
                <p className="text-sm">Pressure</p>
                <p className="font-medium">{currentWeather.pressure} hPa</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="forecast" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="forecast">5-Day Forecast</TabsTrigger>
          <TabsTrigger value="details">Weather Details</TabsTrigger>
        </TabsList>

        <TabsContent value="forecast" className="mt-4">
          <div className="grid gap-4 md:grid-cols-5">
            {forecast.slice(0, 5).map((day, index) => (
              <Card key={index} className="overflow-hidden">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium">{index === 0 ? "Today" : day.day}</CardTitle>
                  <CardDescription className="text-xs">{new Date(day.date).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex justify-between items-center mb-2">
                    {getWeatherIcon(day.main)}
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {Math.round(day.temp_max)}° / {Math.round(day.temp_min)}°
                      </p>
                      <p className="text-xs capitalize">{day.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Precipitation:</span>
                      <span>{day.precipitation.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Humidity:</span>
                      <span>{day.humidity}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Wind:</span>
                      <span>{day.wind_speed} m/s</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Weather Details</CardTitle>
              <CardDescription>Detailed information about the current weather in {city}</CardDescription>
            </CardHeader>
            <CardContent>
              {currentWeather && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="font-medium">Temperature</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-sm font-medium">Current</p>
                        <p className="text-2xl">{currentWeather.temp.toFixed(1)}°C</p>
                      </div>
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-sm font-medium">Feels Like</p>
                        <p className="text-2xl">{currentWeather.feels_like.toFixed(1)}°C</p>
                      </div>
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-sm font-medium">Min</p>
                        <p className="text-2xl">{currentWeather.temp_min.toFixed(1)}°C</p>
                      </div>
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-sm font-medium">Max</p>
                        <p className="text-2xl">{currentWeather.temp_max.toFixed(1)}°C</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Conditions</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-sm font-medium">Wind Speed</p>
                        <p className="text-2xl">{currentWeather.wind_speed} m/s</p>
                      </div>
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-sm font-medium">Humidity</p>
                        <p className="text-2xl">{currentWeather.humidity}%</p>
                      </div>
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-sm font-medium">Pressure</p>
                        <p className="text-2xl">{currentWeather.pressure} hPa</p>
                      </div>
                      <div className="rounded-lg bg-muted p-3">
                        <p className="text-sm font-medium">Weather</p>
                        <p className="text-2xl capitalize">{currentWeather.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
