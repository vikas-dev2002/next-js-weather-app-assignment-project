"use client"

import type React from "react"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, ArrowUpDown, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

interface City {
  geoname_id: number
  name: string
  cou_name_en: string
  timezone: string
  coordinates: [number, number]
  population: number
  weather?: {
    temp: number
    high: number
    low: number
    description: string
  }
}

type SortDirection = "asc" | "desc"

interface SortState {
  column: keyof City | ""
  direction: SortDirection
}

export function CitiesTable() {
  const [cities, setCities] = useState<City[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [sortState, setSortState] = useState<SortState>({ column: "", direction: "asc" })
  const observer = useRef<IntersectionObserver | null>(null)
  const router = useRouter()

  const lastCityElementRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (loading) return
      if (observer.current) observer.current.disconnect()

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1)
        }
      })

      if (node) observer.current.observe(node)
    },
    [loading, hasMore],
  )

  const fetchCities = useCallback(async () => {
    try {
      setLoading(true)
      const rows = 20
      const start = page * rows

      let url = `https://public.opendatasoft.com/api/records/1.0/search/?dataset=geonames-all-cities-with-a-population-1000&rows=${rows}&start=${start}&sort=name`

      if (searchQuery) {
        url += `&q=${encodeURIComponent(searchQuery)}`
      }

      const response = await fetch(url)
      const data = await response.json()

      if (data.records.length === 0) {
        setHasMore(false)
        setLoading(false)
        return
      }

      const newCities = data.records.map((record: any) => ({
        geoname_id: record.fields.geoname_id,
        name: record.fields.name,
        cou_name_en: record.fields.cou_name_en,
        timezone: record.fields.timezone,
        coordinates: record.fields.coordinates,
        population: record.fields.population,
      }))

      setCities((prev) => {
        if (page === 0) {
          return newCities
        }
        return [...prev, ...newCities]
      })
    } catch (error) {
      console.error("Error fetching cities:", error)
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery])

  useEffect(() => {
    fetchCities()
  }, [fetchCities])

  useEffect(() => {
    // Reset pagination when search query changes
    setPage(0)
    setHasMore(true)
    setCities([])
  }, [searchQuery])

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  const handleSort = (column: keyof City) => {
    setSortState((prev) => {
      if (prev.column === column) {
        return {
          column,
          direction: prev.direction === "asc" ? "desc" : "asc",
        }
      }
      return {
        column,
        direction: "asc",
      }
    })
  }

  const sortedCities = [...cities].sort((a, b) => {
    if (sortState.column === "") return 0

    const aValue = a[sortState.column]
    const bValue = b[sortState.column]

    if (aValue === undefined || bValue === undefined) return 0

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortState.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue)
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortState.direction === "asc" ? aValue - bValue : bValue - aValue
    }

    return 0
  })

  const handleCityClick = (city: City, event: React.MouseEvent) => {
    const url = `/weather/${encodeURIComponent(city.name)}/${city.coordinates[0]}/${city.coordinates[1]}`

    if (event.ctrlKey || event.metaKey || event.button === 1) {
      // Open in new tab if Ctrl/Cmd key is pressed or middle mouse button is clicked
      window.open(url, "_blank")
    } else {
      router.push(url)
    }
  }

  const handleContextMenu = (city: City, event: React.MouseEvent) => {
    event.preventDefault()
    const url = `/weather/${encodeURIComponent(city.name)}/${city.coordinates[0]}/${city.coordinates[1]}`
    window.open(url, "_blank")
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search cities..." className="pl-8" value={searchQuery} onChange={handleSearch} />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 p-0 hover:bg-transparent">
                      <span>City</span>
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => handleSort("name")}>
                      Sort {sortState.column === "name" && sortState.direction === "asc" ? "Z-A" : "A-Z"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 p-0 hover:bg-transparent">
                      <span>Country</span>
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => handleSort("cou_name_en")}>
                      Sort {sortState.column === "cou_name_en" && sortState.direction === "asc" ? "Z-A" : "A-Z"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 p-0 hover:bg-transparent">
                      <span>Timezone</span>
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => handleSort("timezone")}>
                      Sort {sortState.column === "timezone" && sortState.direction === "asc" ? "Z-A" : "A-Z"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 p-0 hover:bg-transparent">
                      <span>Population</span>
                      <ArrowUpDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem onClick={() => handleSort("population")}>
                      Sort{" "}
                      {sortState.column === "population" && sortState.direction === "asc" ? "High-Low" : "Low-High"}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableHead>
              <TableHead>Weather</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCities.length === 0 && !loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  No cities found.
                </TableCell>
              </TableRow>
            ) : (
              sortedCities.map((city, index) => (
                <TableRow
                  key={city.geoname_id}
                  ref={index === sortedCities.length - 1 ? lastCityElementRef : null}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => handleCityClick(city, e)}
                  onContextMenu={(e) => handleContextMenu(city, e)}
                >
                  <TableCell className="font-medium">{city.name}</TableCell>
                  <TableCell>{city.cou_name_en}</TableCell>
                  <TableCell>{city.timezone}</TableCell>
                  <TableCell>{city.population.toLocaleString()}</TableCell>
                  <TableCell>
                    {city.weather ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span>{city.weather.temp.toFixed(1)}°C</span>
                          <Badge variant="outline" className="text-xs">
                            {city.weather.description}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          H: {city.weather.high.toFixed(1)}° L: {city.weather.low.toFixed(1)}°
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Click to view</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}

            {loading &&
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  <TableCell>
                    <Skeleton className="h-4 w-[120px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[80px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[60px]" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-[100px]" />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
