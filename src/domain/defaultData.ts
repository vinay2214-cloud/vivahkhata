import { WeddingCategory } from '../types';

export const DEFAULT_CATEGORIES: WeddingCategory[] = [
  { id: 'venue', label: 'Venue & Mandapam', icon: 'Landmark' },
  { id: 'catering', label: 'Catering & Food', icon: 'UtensilsCrossed' },
  { id: 'decoration', label: 'Decoration & Flowers', icon: 'Flower2' },
  { id: 'photography', label: 'Photography & Video', icon: 'Camera' },
  { id: 'clothing', label: 'Clothing & Sarees', icon: 'Shirt' },
  { id: 'jewellery', label: 'Jewellery & Gold', icon: 'Gem' },
  { id: 'makeup', label: 'Makeup & Styling', icon: 'Sparkles' },
  { id: 'priest', label: 'Priest & Rituals', icon: 'Flame' },
  { id: 'invitations', label: 'Invitations & Cards', icon: 'Mail' },
  { id: 'music', label: 'Music & DJ / Nadaswaram', icon: 'Music' },
  { id: 'transport', label: 'Transport & Cars', icon: 'Car' },
  { id: 'accommodation', label: 'Rooms & Accommodation', icon: 'BedDouble' },
  { id: 'returnGifts', label: 'Return Gifts (Thamboolam)', icon: 'Gift' },
  { id: 'giftsGiven', label: 'Gifts Given', icon: 'HandHeart' },
  { id: 'travel', label: 'Travel & Tickets', icon: 'Plane' },
  { id: 'misc', label: 'Miscellaneous', icon: 'MoreHorizontal' },
];

export const DEFAULT_EVENT_TEMPLATES = [
  { type: 'engagement', name: 'Nischitartham (Engagement)', order: 1 },
  { type: 'haldi', name: 'Haldi / Pellikoothuru', order: 2 },
  { type: 'mehendi', name: 'Mehendi & Sangeet', order: 3 },
  { type: 'wedding', name: 'Muhurtham (Main Wedding)', order: 4 },
  { type: 'reception', name: 'Reception', order: 5 },
  { type: 'vratham', name: 'Satyanarayana Swamy Vratham', order: 6 },
];
