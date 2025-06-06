// Globale Konfiguration für das Rennspiel
export const DEBUG = false; // true = KI-Wegpunkte sichtbar, false = unsichtbar

// Verfügbare Auto-Farben
export const CAR_COLORS = [
  { name: 'Rot', value: 'red', cssClass: 'red' },
  { name: 'Schwarz', value: 'black', cssClass: 'black' },
  { name: 'Orange', value: 'orange', cssClass: 'orange' },
  { name: 'Blau', value: 'blue', cssClass: 'blue' },
  { name: 'Grün', value: 'green', cssClass: 'green' },
  { name: 'Gelb', value: 'yellow', cssClass: 'yellow' },
  { name: 'Lila', value: 'purple', cssClass: 'purple' },
  { name: 'Türkis', value: 'cyan', cssClass: 'cyan' }
] as const;
