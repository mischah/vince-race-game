Bitte erstelle ein Auto Rennspiel mit TypeScript auf Basis von Canvas.
Zu ersetllen sind grafische Assets und ddie Spiel logik

# Technische Details

- Typescript transpiling via vite
- Hot reloading und dev server via vite
- SOiel Renderiing mit 2d Canvas

# Layout / UI

- Spielfläche soll im hochformat sein. 
  - hintergrund für die erste strecke. siehe Bild src/media/Background-strecke.png
  - Das Bild nachzeichnen und danach verwerfen
- Streckenbegrenzung aus dem Bild (src/media/Background-strecke.png)  (weiße Linie) übernehmen 
- Start / Ziel Line mit Karierter Fläche (Schwarz Wei)
- darüber soll noch platz sein für folgende UI Elemente
  - Mittig der Timer für das Rennen: Start bei 0:00
  - Darunter der Rundenzähler: Zählt die gefahrenen runden
  - Rechts die aktuelle Rangliste Im Format: 
    1. Rennfahrer Name und Block für die Farbe des Autos
    2. Rennfahrer Name und Block für die Farbe des Autos
  - Links: Reset Button (Beschriftet mit Reset) 
  - In der Mitte der Rennstrecke:
    - Start Button 
    - Horizontale Ampel (Rot/ Gelb/ Grün)
    - Countdown unter der Ampel (Wechselt mit den Farben der Ampel: 3/2/1/Go)
    

# Darstellung der Autos

- 3 Rennwagen Im Ferrari Stil
  - Enzo (Farbe Rot)
  - F50 (Farbe Schwarz)
  - 360 Spider (Farbe Orange)

# Spiel Logik 

Ein Auto wird vom Spieler gesteuert. die beiden anderen Autos werden vom einem zu entwickletem Algorythmus gesteuert. Die beiden computer gegener sollen nicht konstant gleich gut fahren. sie eollenm sich auch mal überholen.

## Spiel starten und zurücksetzen

- Start button drücken
  - Start Button verschwindet
  - Ampel und Countdown erscheinen und starten
  - Autos auf Start-Linie setzen
    - Wichtig: Autos können erst losfahren wenn countdown abgelaufen ist
- Nach Ablauf des Countdowns (3/2/1/Go) 
  - start der Timer der die abgelaufene Zeit des Rennens misst.
  - Ampel und Countdown verschwinden
- Spiel zurücksetzen 
  - Bei Klick auf den Reset Button wird das Spiel wieeder in den Ursprungszustand zurückgesetzt.

## Steuerung

- Mit den Pfeiltasten (Cursortasten) der Tastatur
  - "Pfeil oben": Beschleunigt
  - "Pfeil Unten": Bremst ab
  - "Pfeil Links": Steuert das Auto nach Links
  - "Pfeil Rechts": Steuert das Auto nach rechts 

Die Steuerung soll sich sanft verhalten. Das heißt: Bei gedrückt halten der steuerung (vor allem: rechts / links) soll es mit einer easing funktion langsam anfangen zu reagieren. damit man nicht so einfach übersteuert.

## Runden 

- Ziel ist es 3 RUnden zu schaffen
- Eine RUnde ist erreicht wenn man nach dem start erneutr die Start-Linie Überquert
- Der Rundenzähler zählt nur die Runden des spielers der steuert

## Spielende

- Das SPiel ist vorbei wenn alle Autos drei runden geschafft sind
- Die Autos bleiben am Ziel stehen


## Rangliste

- Die Rangliste muss in echtzeit aktualisiert werden. unabhängig von den runden

## Kollisionen 

1. Kollisiionen mit der Streckenbegrenzung
  - Müssen erkannt werden. Man kann da nicht durchfahren. Sie hält den Wagen zurück.
  - Man verliert geschwindigkeit die sich erst wieder aufbauen lässt wenn man von der Streckenbegrenzung weglenkt.
2. Kollisionen mit anderen Fahrzeugen
  - Müssen erkannt werden. die fahzeuge dürfen nicht durcheinander durchfahren.





