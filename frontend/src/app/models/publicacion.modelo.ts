export interface Publicacion {
  id:          number;
  user_id:     number;
  description: string;
  image_url:   string;
  status:      'PENDING' | 'APPROVED' | 'REJECTED';
  created_at:  string;
  hashtags?:   Hashtag[];
}

export interface Hashtag {
  id:   number;
  name: string;
}