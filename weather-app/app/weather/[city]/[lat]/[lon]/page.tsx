import { Suspense } from "react"
import Link from "next/link"
import { ChevronLeft } from "lucide-react"
import { WeatherDisplay } from "@/components/weather-display"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface WeatherPageProps {
  params: {
    city: string
    lat: string
    lon: string
  }
}

export default function WeatherPage({ params }: WeatherPageProps) {
  const { city, lat, lon } = params
  const decodedCity = decodeURIComponent(city)

  return (
    <main className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/" className="flex items-center gap-1">
            <ChevronLeft className="h-4 w-4" />
            Back to Cities
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-6">Weather for {decodedCity}</h1>

      <Suspense fallback={<WeatherSkeleton />}>
        <WeatherDisplay city={decodedCity} lat={Number.parseFloat(lat)} lon={Number.parseFloat(lon)} />
      </Suspense>
    </main>
  )
}

function WeatherSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <Skeleton className="h-12 w-[300px]" />
        <Skeleton className="h-6 w-[200px]" />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-[180px] w-full rounded-xl" />
        ))}
      </div>

      <Skeleton className="h-[300px] w-full rounded-xl" />
    </div>
  )
}
