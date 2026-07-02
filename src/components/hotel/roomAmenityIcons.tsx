import {
  Wifi, Wind, Car, Waves, Tv, Sun, Flame,
  PawPrint, UtensilsCrossed,
} from 'lucide-react';

export type AmenityIconEntry = { icon: React.ElementType; label: string };

export const ROOM_AMENITY_ICONS: Record<string, AmenityIconEntry> = {
  'WiFi':                   { icon: Wifi,            label: 'Besplatni Wi-Fi' },
  'WLAN':                   { icon: Wifi,            label: 'Besplatni Wi-Fi' },
  'LCD TV':                 { icon: Tv,              label: 'LCD TV' },
  'Satelitski TV':          { icon: Tv,              label: 'SAT TV' },
  'SAT TV':                 { icon: Tv,              label: 'SAT TV' },
  'Klima':                  { icon: Wind,            label: 'Klima-uređaj' },
  'Air conditioning':         { icon: Wind,            label: 'Klima-uređaj' },
  'Klimaanlage':            { icon: Wind,            label: 'Klima-uređaj' },
  'Sauna':                  { icon: Waves,           label: 'Sauna' },
  'Privatna sauna':         { icon: Waves,           label: 'Privatna sauna' },
  'Jacuzzi':                { icon: Waves,           label: 'Jacuzzi' },
  'Terasa':                 { icon: Sun,             label: 'Terasa' },
  'Terrace':                { icon: Sun,             label: 'Terasa' },
  'Terrasse':               { icon: Sun,             label: 'Terasa' },
  'Parking':                { icon: Car,             label: 'Besplatno parkiralište' },
  'Parkplatz':              { icon: Car,             label: 'Besplatno parkiralište' },
  'Grijanje':               { icon: Flame,           label: 'Grijanje' },
  'Heating':                { icon: Flame,           label: 'Grijanje' },
  'Heizung':                { icon: Flame,           label: 'Grijanje' },
  'Posebna kuhinja':        { icon: UtensilsCrossed, label: 'Kuhinja' },
  'Separate kitchen':       { icon: UtensilsCrossed, label: 'Kuhinja' },
  'Separate Küche':         { icon: UtensilsCrossed, label: 'Kuhinja' },
  'Kućni ljubimci na upit': { icon: PawPrint,        label: 'Kućni ljubimci na upit' },
  'Pets on request':        { icon: PawPrint,        label: 'Kućni ljubimci na upit' },
  'Haustiere auf Anfrage':  { icon: PawPrint,        label: 'Kućni ljubimci na upit' },
};
