export type PlantPhoto = {
  id: string
  plant_id: string
  storage_path: string
  is_cover: boolean
  created_at: string
  url: string
}

export type Plant = {
  id: string
  user_id: string
  name: string
  species: string | null
  location: string | null
  planted_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  plant_photos?: PlantPhoto[]
}

export type SortOption = 'newest' | 'alphabetical'
