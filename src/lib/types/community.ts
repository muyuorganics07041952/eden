export type CommunityTip = {
  id: string
  user_id: string | null
  plant_name: string
  plant_species: string | null
  text: string
  photo_path: string | null
  photo_url?: string // derived, not in DB
  likes_count: number
  created_at: string
  // joined fields
  author_name: string // from user_metadata or "Gelöschter Nutzer"
  has_liked: boolean // whether the current user has liked this tip
  comments_count: number
}

export type CommunityTipComment = {
  id: string
  tip_id: string
  user_id: string | null
  text: string
  created_at: string
  author_name: string // from user_metadata or "Gelöschter Nutzer"
}
