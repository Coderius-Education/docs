---
sidebar_position: 3
---

# Leerdoelen per hoofdstuk

### Hoofdstuk 1 — Vormen
Na afloop kan de leerling:
- Vormen op het scherm tekenen met `play.new_circle`, `play.new_box`, `play.new_text` en `play.new_image`.
- Kleur, positie, grootte en transparantie van een vorm aanpassen.
- Informatie over een bestaande vorm opvragen voor debugging.

### Hoofdstuk 2 — Fysica
- Een vorm laten bewegen met `start_physics()` en de begrippen `x_speed`, `y_speed`, `obeys_gravity`.
- Het verschil tussen **dynamic**, **static** en **kinematic** fysica uitleggen en in een spel toepassen.
- Fysica-eigenschappen `bounciness`, `mass` en `sensor` gebruiken om gedrag te tunen.

### Hoofdstuk 3 — Acties
- Het verschil tussen een **functie** en een **methode** benoemen.
- Methodes zoals `clone()`, `hide()`, `show()`, `remove()`, `distance_to()` toepassen.
- Willekeurige waarden gebruiken (`random_number`, `random_position`, `random_color`).

### Hoofdstuk 4 — Gebeurtenissen
- Reageren op toetsenbord, muis en botsingen met decorator-functies (`@play.when_key_pressed`, `@play.when_mouse_clicked`, `@vorm.when_touching`).
- Het verschil tussen "één keer reageren" (`when_…`) en "elk frame" (`while_…`) uitleggen.
- Een score bijhouden met het `global` keyword.

### Hoofdstuk 5 — Tijd
- Begrijpen waarom `time.sleep()` een spel blokkeert.
- `async`/`await` gebruiken in combinatie met `play.timer()`.
- Animaties maken met `@play.repeat_forever`.

### Hoofdstuk 6 — Opslaan van gegevens
- Een JSON-database aanmaken met `play.new_database()`.
- Gegevens opslaan en ophalen met `set_data()` en `get_data()`.
- Een high-score systeem en eenvoudige instellingen-opslag maken.

### Hoofdstuk 7 — Pygame-ce (gevorderd)
- Een eigen game-loop schrijven met `pygame.init()` en `pygame.display.flip()`.
- Vormen tekenen, tekst tonen, op toetsen reageren in raw pygame-ce.
- Botsingen en fysica met `pymunk` toepassen.

### Eindproject
- Een werkend spel ontwerpen, plannen en bouwen (Pong of eigen idee).
- De geleerde concepten zelfstandig combineren.
- Bugs zelf oplossen met behulp van de cheatsheet en [foutmeldingen-pagina](/er_gaat_iets_mis).
