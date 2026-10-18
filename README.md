# Hase IQ Stove Home Assistant integration
Custom component to integrate [Hase IQ Stoves](https://www.hase.de/iq-technologie) into Home Assistant. 
This is a fork from (https://github.com/Xsez/haseiq)  
This allows you to monitor various states(current phase, temperature, performance) of the stove at all times and for example create a notification, when the stove needs to be refilled.

## Installation

### Requirements

- **Home Assistant**: Version 2024.11 or higher

### HACS Installation

1. **Install HACS** (if not already installed):
   - Follow the official [HACS installation guide](https://hacs.xyz/docs/installation/prerequisite).

2. **Add the custom repository**:
   - Go to **HACS** in the Home Assistant interface.
   - Add a Custom Repository with the following url
repository URL:
     ```
     https://github.com/Xsez/haseiq
     ```
   - Select type **Integration**
   - Click **Add**.
   - Search for **Hase IQ** 
   - **install**

3. **Restart Home Assistant**:
   - Go to **Settings** > **System** > **Restart** and restart Home Assistant.

### Manual Installation

1. **Clone the repository**:
   - Navigate to the `custom_components` directory of your Home Assistant installation:
     ```
     /config/custom_components/
     ```
   - Clone the repository:
     ```bash
     git clone https://github.com/Xsez/haseiq haseiq
     ```

2. **Restart Home Assistant**:
   - Go to **Settings** > **System** > **Restart** and restart Home Assistant.

## Configuration

This integration uses a **Config Flow**, so no manual `configuration.yaml` changes are necessary.

1. **Add the integration**:
   - Go to **Settings** > **Devices & Services** > **Integrations**.
   - Click the **+** icon at the bottom right.
   - Search for `Hase IQ` and select it.

2. **Enter connection details**:
   - Input the stove IP address.
   - Click **Submit**.

3. **Verify connection**:
   - If successful, the stove device and sensors will be automatically added.

## Available Sensors

![Screenshot of a haseiq device with all entities](images/haseiq%20entities.png)

### General Stove Information

- **Serial Number**
- **Firmware Version**
- **Hardware Model**
- **Model Designation**

### Current State Information

- **Temperature**
- **Performance**
- **Phase**
- **Error**
- **Heatup**

# Hase IQ Doppelring-Karte für Home Assistant

Eine Dashboard-Karte (Lovelace) für [Hase IQ Kaminöfen](https://www.hase.de/iq-technologie). Sie zeigt auf einen Blick, wie es deinem Ofen geht:

- **Außenring:** Temperatur, die Farbe wechselt von blau über orange nach rot
- **Innenring:** Leistung in Prozent
- **Phasen-Badge:** Anheizen, Abbrand, Holz nachlegen, Glut und Bereit
- **Anheiz-Fortschritt:** Fortschrittsbalken, solange der Ofen anheizt
- **Alarme:** Die Karte pulsiert amber, wenn Holz nachgelegt werden soll, und rot bei einer Störung
- **Foto:** Optionales Hintergrundfoto deines Ofens
- **Visueller Editor:** Alle Einstellungen sind ohne YAML möglich

<!-- Tipp: Screenshot ins Repository legen und hier einbinden -->
<!-- ![Screenshot der Karte](images/screenshot.png) -->

## Voraussetzungen

- Home Assistant mit Dashboard-Ressourcen (erweiterter Modus im Benutzerprofil aktiviert)
- Die Integration [haseiq](https://github.com/lighthousehh/haseiq) ist installiert und eingerichtet (Fork von [Xsez/haseiq](https://github.com/Xsez/haseiq))
- Die Integration liefert diese Entitäten, die Namen hängen vom Gerätenamen ab:

| Zweck | Beispiel-Entität |
| --- | --- |
| Temperatur | `sensor.wohnzimmer_hase_temperature` |
| Leistung | `sensor.wohnzimmer_hase_performance` |
| Phase | `sensor.wohnzimmer_hase_phase` |
| Fehler | `binary_sensor.wohnzimmer_hase_error` |
| Anheiz-Fortschritt (0 bis 100) | `sensor.wohnzimmer_hase_heating_up` |

Deine Entitäten findest du unter *Entwicklerwerkzeuge → Zustände*, wenn du nach `hase` filterst.

Entwickelt und getestet mit Home Assistant 2026.10.

## Installation

### 1. Datei kopieren

Lade `haseiq-ring-card.js` herunter und kopiere sie auf deinen Home-Assistant-Server in diesen Ordner:

```
/config/www/haseiq/haseiq-ring-card.js
```

Den Ordner `haseiq` legst du selbst an. Existiert `/config/www/` noch nicht, lege ihn an und starte Home Assistant einmal neu. Das Verzeichnis `/config/www/` ist im Browser unter `/local/` erreichbar.

Du kannst die Datei über Samba, das Add-on *File editor* oder *Studio Code Server* kopieren.

Prüfe danach im Browser, ob die Datei erreichbar ist:

```
http://<deine-home-assistant-adresse>:8123/local/haseiq/haseiq-ring-card.js
```

Dort muss der JavaScript-Code angezeigt werden.

### 2. Ressource hinzufügen

1. Öffne *Einstellungen → Dashboards*.
2. Klicke oben rechts auf die drei Punkte und wähle *Ressourcen*. Fehlt der Menüpunkt, aktiviere in deinem Benutzerprofil den *Erweiterten Modus*.
3. Klicke auf *Ressource hinzufügen* und trage ein:
   - **URL:** `/local/haseiq/haseiq-ring-card.js?v=1`
   - **Ressourcentyp:** *JavaScript-Modul*
4. Speichere und lade die Seite mit Strg+F5 (Mac: Cmd+Shift+R) neu.

Wenn dein Dashboard im reinen YAML-Modus läuft, trägst du die Ressource stattdessen in der Dashboard-Konfiguration ein:

```yaml
resources:
  - url: /local/haseiq/haseiq-ring-card.js?v=1
    type: module
```

### 3. Karte hinzufügen

1. Öffne das Dashboard und wechsle in den Bearbeitungsmodus.
2. Klicke auf *Karte hinzufügen* und suche nach `Hase IQ Doppelring`. Benutzerdefinierte Karten stehen in der Liste ganz unten.
3. Wähle im visuellen Editor deine Entitäten aus.

Alternativ wählst du ganz unten *Manuell* und fügst das YAML aus dem nächsten Abschnitt ein.

## Konfiguration

Beispiel mit allen üblichen Einstellungen:

```yaml
type: custom:haseiq-ring-card
name: Kamin
temperature: sensor.wohnzimmer_hase_temperature
performance: sensor.wohnzimmer_hase_performance
phase: sensor.wohnzimmer_hase_phase
error: binary_sensor.wohnzimmer_hase_error
heating_up: sensor.wohnzimmer_hase_heating_up
temp_min: 0
temp_max: 700
image: /local/haseiq/kamin.jpg
```

### Optionen

| Option | Pflicht | Standard | Beschreibung |
| --- | --- | --- | --- |
| `type` | ja | | Muss `custom:haseiq-ring-card` sein |
| `temperature` | ja | | Temperatur-Sensor, bestimmt den Außenring |
| `performance` | ja | | Leistungs-Sensor in Prozent, bestimmt den Innenring |
| `phase` | ja | | Phasen-Sensor |
| `error` | nein | | Fehler-Binärsensor, bei `on` erscheint die Störungsmeldung |
| `heating_up` | nein | | Anheiz-Fortschritt von 0 bis 100 |
| `name` | nein | `Kamin` | Titel der Karte |
| `temp_min` | nein | `0` | Temperatur, bei der der Außenring leer ist |
| `temp_max` | nein | `700` | Temperatur, bei der der Außenring voll ist |
| `image` | nein | | Pfad zu einem Hintergrundfoto, z. B. `/local/haseiq/kamin.jpg` |
| `tap_entity` | nein | `temperature` | Entität, deren Dialog beim Antippen der Karte öffnet |
| `labels` | nein | | Eigene Bezeichnungen für Phasen, siehe unten |

### Phasen

Der Phasen-Sensor liefert diese Werte, die Karte zeigt sie auf Deutsch an:

| Wert des Sensors | Anzeige | Verhalten der Karte |
| --- | --- | --- |
| `idle` | Bereit | Ring gedimmt |
| `heating up` | Anheizen | Fortschrittsbalken, falls `heating_up` gesetzt ist |
| `burning` | Abbrand | |
| `add wood` | Holz nachlegen | Karte pulsiert amber, Hinweis „Zeit zum Nachlegen" |
| `don't add wood` | Glut · nicht nachlegen | |

Eigene Bezeichnungen legst du mit `labels` fest:

```yaml
labels:
  add wood: Scheit rein!
  idle: Ofen aus
```

Bei einer Störung (`error` ist `on`) pulsiert die Karte rot, unabhängig von der Phase.

### Hintergrundfoto

1. Kopiere dein Foto nach `/config/www/haseiq/kamin.jpg`. Empfohlen wird ein Querformat von etwa 1200 × 800 Pixeln mit dem Ofen in der Mitte.
2. Trage in der Karte ein: `image: /local/haseiq/kamin.jpg`

Das Foto wird automatisch abgedunkelt, damit Ring und Text lesbar bleiben. Ohne `image` verwendet die Karte einen einfarbigen dunklen Hintergrund.

### Größe im Dashboard

Die Höhe passt sich dem Inhalt an. Falls du die Zeilenzahl im Reiter *Layout* der Karte von Hand gesetzt hast und etwas überlappt, stelle sie auf *Automatisch* oder auf einen höheren Wert. Auf schmalen Displays stehen Ring und Infos untereinander, ab etwa 440 Pixel Kartenbreite nebeneinander.

## Aktualisieren

1. Ersetze die Datei in `/config/www/haseiq/` durch die neue Version.
2. Erhöhe in den Ressourcen die Versionsnummer in der URL, z. B. von `?v=1` auf `?v=2`.
3. Lade die Seite neu. In der Companion-App leerst du zusätzlich den Frontend-Cache (*Einstellungen → Companion-App → Fehlerbehebung → Frontend-Cache leeren*) und startest die App neu.

## Fehlerbehebung

**Die Karte erscheint nicht in der Kartenauswahl oder zeigt „Custom element doesn't exist"**

- Prüfe, ob die Ressource unter *Ressourcen* mit dem Typ *JavaScript-Modul* eingetragen ist und die URL zum Ordner passt.
- Lade die Seite hart neu und erhöhe die Versionsnummer in der Ressource.
- Öffne die Browser-Konsole (F12). Dort sollte nach dem Neuladen `HASEIQ-RING-CARD v…` erscheinen. Mit diesem Befehl prüfst du, ob die Karte registriert ist:

  ```js
  customElements.get("haseiq-ring-card")
  ```

  Das Ergebnis muss eine Klasse sein, nicht `undefined`.
- In Safari und in der Companion-App hilft oft das Leeren des Caches (Safari: *Entwickler → Caches leeren*).
- Bei einem Dashboard im YAML-Modus muss die Ressource in der Dashboard-Konfiguration stehen.

**Die Karte zeigt „–" oder „Nicht verfügbar"**

Eine der Entitäten ist `unavailable` oder `unknown`. Prüfe in den Entwicklerwerkzeugen, ob die Haase-Integration verbunden ist und die Entitäten Werte liefern.

**Die Ringe sind zu voll oder zu leer**

Passe `temp_min` und `temp_max` an die Temperaturen deines Ofens an.

**Die Karte überlappt die Karte darunter**

Setze die Höhe im Reiter *Layout* der Karte auf *Automatisch*.

## Lizenz

Füge hier die gewünschte Lizenz ein, z. B. MIT.

