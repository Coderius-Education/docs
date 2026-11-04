# Draait headless in CI: `godot --headless --path sites/godot/godot-tests`.
#
# Twee lagen:
#   1. compileren  — elk GDScript-blok uit de docs door de parser en analyzer.
#   2. gedrag      — de zeven tussenstanden van het bewegingsscript echt
#                    uitvoeren en controleren of ze doen wat de les belooft.
#
# Afsluitcode 0 als alles klopt, 1 zodra er iets misgaat.

extends Node2D

const EXTRACTED := "res://extracted"
# Een blok dat de wijziging niet raakt (`godot:extract -- --alleen changed.json`)
# staat in de index met `overslaan`; dan geen compileercheck, en de gedragstest
# die op dat blok leunt slaat zichzelf over.
const OVERGESLAGEN := "<overgeslagen>"

var fouten: Array[String] = []
var gedaan := 0
var foutvoorbeelden := 0
var runtime_voorbeelden := 0
# Hoeveel runtime-voorbeelden de index heeft en hoeveel er zijn afgehandeld.
# Breekt de laag halverwege af, dan blijven die twee verschillend, en dat is
# een fout: anders zei de run "Alles klopt." over voorbeelden die nooit
# draaiden.
var runtime_totaal := 0
var runtime_afgehandeld := 0

func _ready() -> void:
	var index := _lees_index()
	if index.is_empty():
		_faal("geen extracted/index.json gevonden — draai eerst `pnpm godot:extract`")
		_rapporteer()
		return

	_compileer_alles(index)
	await _draai_runtime_voorbeelden(index)
	await _gedrag_tests(index)
	_rapporteer()

# --- laag 1: compileren ------------------------------------------------------

func _lees_index() -> Array:
	if not FileAccess.file_exists(EXTRACTED + "/index.json"):
		return []
	var tekst := FileAccess.get_file_as_string(EXTRACTED + "/index.json")
	var data = JSON.parse_string(tekst)
	return data if data is Array else []

func _compileer_alles(index: Array) -> void:
	var overgeslagen := 0
	for item in index:
		if item.get("overslaan", false):
			overgeslagen += 1
			continue
		var pad: String = EXTRACTED + "/" + item["naam"] + ".gd"
		var bron: String = "%s:%d" % [item["bron"], int(item["regel"])]
		if not FileAccess.file_exists(pad):
			_faal("%s — bestand ontbreekt na extractie" % bron)
			continue
		# Niet via ResourceLoader.load: die geeft ook bij een parse-fout nog een
		# object terug, waardoor de check stil groen bleef. reload() geeft een
		# foutcode.
		var script := GDScript.new()
		script.source_code = FileAccess.get_file_as_string(pad)
		if item.has("verwacht_fout"):
			_compileer_foutvoorbeeld(script, bron, item["verwacht_fout"])
		elif script.reload() != OK:
			_faal("%s — compileert niet (zie de fout hierboven)" % bron)
		else:
			gedaan += 1
	var voorbeelden := index.filter(func(item): return item.has("verwacht_fout") and not item.get("overslaan", false)).size()
	print("Gecompileerd: %d van %d blokken." % [gedaan, index.size() - overgeslagen - voorbeelden])
	print("Foutvoorbeelden met de melding uit de les: %d van %d." % [foutvoorbeelden, voorbeelden])
	if overgeslagen > 0:
		print("Overgeslagen: %d blokken die de wijziging niet raakt (--alleen)." % overgeslagen)

# Vangt de meldingen die Godot bij het compileren geeft, zodat een
# foutvoorbeeld uit de les met zijn eigen melding vergeleken kan worden.
class Meldingen extends Logger:
	var regels: Array[String] = []

	func _log_error(_function: String, _file: String, _line: int, code: String, rationale: String, _editor_notify: bool, _error_type: int, _script_backtraces: Array[ScriptBacktrace]) -> void:
		regels.append(code + " " + rationale)

# Een foutvoorbeeld uit "Er gaat iets mis" hoort níét te compileren, en Godot
# hoort de melding te geven die de les citeert. De melding zelf verschijnt
# hierboven ook als SCRIPT ERROR; dat is hier de bedoeling.
func _compileer_foutvoorbeeld(script: GDScript, bron: String, verwacht: String) -> void:
	print("Foutvoorbeeld %s, verwacht: %s" % [bron, verwacht])
	var meldingen := Meldingen.new()
	OS.add_logger(meldingen)
	var resultaat := script.reload()
	OS.remove_logger(meldingen)
	if resultaat == OK:
		_faal("%s — foutvoorbeeld compileert, maar de les zegt dat Godot het weigert" % bron)
		return
	for regel in meldingen.regels:
		if _past(verwacht, regel):
			foutvoorbeelden += 1
			return
	_faal("%s — Godot geeft niet de melding uit de les ('%s') maar: %s" % [bron, verwacht, " | ".join(meldingen.regels)])

# --- meldingen tijdens het spelen --------------------------------------------

# Een citaat met "..." erin staat voor iets wat per keer verschilt (een
# node-id); de delen eromheen moeten in die volgorde in de melding staan.
func _past(citaat: String, melding: String) -> bool:
	var vanaf := 0
	for deel in citaat.replace("…", "...").split("..."):
		var plek := melding.find(deel, vanaf)
		if plek == -1:
			return false
		vanaf = plek + deel.length()
	return true

# Een runtime-voorbeeld uit "Er gaat iets mis" draait echt: het script komt aan
# een node van zijn eigen soort, _ready() maakt de fout, en de melding moet die
# uit de les zijn. Noemt de melding een object ("in object "Muntje:…"), dan
# krijgt de node die naam.
func _draai_runtime_voorbeelden(index: Array) -> void:
	var soort_regex := RegEx.create_from_string("(?m)^extends\\s+(\\w+)")
	var naam_regex := RegEx.create_from_string("in object \"(\\w+):")
	for item in index:
		if item.has("verwacht_runtime_fout") and not item.get("overslaan", false):
			runtime_totaal += 1
	for item in index:
		if not item.has("verwacht_runtime_fout") or item.get("overslaan", false):
			continue
		runtime_afgehandeld += 1
		var bron: String = "%s:%d" % [item["bron"], int(item["regel"])]
		var verwacht: String = item["verwacht_runtime_fout"]
		var code := FileAccess.get_file_as_string(EXTRACTED + "/" + item["naam"] + ".gd")
		var soort := soort_regex.search(code)
		if soort == null or not ClassDB.can_instantiate(soort.get_string(1)):
			_faal("%s — runtime-voorbeeld zonder bruikbare extends" % bron)
			continue
		var script := GDScript.new()
		script.source_code = code
		if script.reload() != OK:
			_faal("%s — runtime-voorbeeld compileert niet" % bron)
			continue
		var node: Node = ClassDB.instantiate(soort.get_string(1))
		var objectnaam := naam_regex.search(verwacht)
		if objectnaam != null:
			node.name = objectnaam.get_string(1)
		node.set_script(script)
		print("Runtime-voorbeeld %s, verwacht: %s" % [bron, verwacht])
		var meldingen := Meldingen.new()
		OS.add_logger(meldingen)
		add_child(node)
		await _stap(3)
		OS.remove_logger(meldingen)
		# Een voorbeeld kan zichzelf al hebben vrijgegeven.
		if is_instance_valid(node):
			remove_child(node)
			node.queue_free()
		var gezien := false
		for regel in meldingen.regels:
			if _past(verwacht, regel):
				gezien = true
		if gezien:
			runtime_voorbeelden += 1
		else:
			_faal("%s — Godot geeft tijdens het draaien niet de melding uit de les ('%s') maar: %s" % [bron, verwacht, " | ".join(meldingen.regels)])
	print("Meldingen tijdens het spelen zoals de les ze citeert: %d van %d." % [runtime_voorbeelden, runtime_totaal])

# --- laag 2: gedrag ----------------------------------------------------------

# De canonieke tussenstanden staan in de docs onder deze koppen.
func _stap_script(index: Array, bron_bevat: String) -> String:
	for item in index:
		var kop: String = item["kop"]
		if item.has("verwacht_fout"):
			continue
		if String(item["bron"]).contains(bron_bevat) and (kop.begins_with("Je script tot nu toe") or kop.begins_with("Je complete script")):
			if item.get("overslaan", false):
				return OVERGESLAGEN
			return EXTRACTED + "/" + item["naam"] + ".gd"
	return ""

func _maak_wereld() -> Node2D:
	var wereld := Node2D.new()
	var vloer := StaticBody2D.new()
	var vorm := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(4000, 40)
	vorm.shape = rect
	vloer.add_child(vorm)
	vloer.position = Vector2(0, 400)
	wereld.add_child(vloer)
	return wereld

func _maak_speler(script_pad: String) -> CharacterBody2D:
	var speler := CharacterBody2D.new()
	var vorm := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(20, 40)
	vorm.shape = rect
	speler.add_child(vorm)
	speler.position = Vector2(0, 100)
	var script := GDScript.new()
	script.source_code = _met_meting(FileAccess.get_file_as_string(script_pad))
	if script.reload() == OK:
		speler.set_script(script)
	else:
		_faal("kon %s niet compileren voor de gedragstest" % script_pad)
	return speler

# De les zet `print(velocity)` bóven move_and_slide(), en juist daar staat het
# interessante getal: daarna heeft move_and_slide() de verticale snelheid op de
# vloer alweer op nul gezet. Van buitenaf is dat moment niet te zien, dus zetten
# we er een meting op precies die plek bij.
func _met_meting(bron: String) -> String:
	var regels := bron.split("\n")
	var uit: Array[String] = []
	var eerste := true
	for regel in regels:
		if regel.strip_edges() == "move_and_slide()":
			var inspring := regel.substr(0, regel.length() - regel.strip_edges(true, false).length())
			uit.append(inspring + "gemeten_y = velocity.y")
		uit.append(regel)
		if eerste and regel.begins_with("extends"):
			uit.append("")
			uit.append("var gemeten_y := 0.0")
			eerste = false
	return "\n".join(uit)

func _stap(frames: int) -> void:
	for i in frames:
		await get_tree().physics_frame

# Zet een wereld met speler klaar, laat hem `frames` physics-stappen draaien en
# geeft de speler terug. De aanroeper ruimt op met `_ruim_op`.
func _draai(script_pad: String, frames: int) -> CharacterBody2D:
	var wereld := _maak_wereld()
	var speler := _maak_speler(script_pad)
	wereld.add_child(speler)
	add_child(wereld)
	await _stap(frames)
	return speler

func _ruim_op(speler: Node) -> void:
	var wereld := speler.get_parent()
	remove_child(wereld)
	wereld.queue_free()

func _gedrag_tests(index: Array) -> void:
	await _test_skelet(index)
	await _test_vallen(index)
	await _test_grond(index)
	await _test_lopen(index)
	await _test_remmen(index)
	await _test_springen(index)
	await _test_springvarianten(index)
	await _test_opknippen(index)
	await _test_dubbel_springen(index)

func _test_skelet(index: Array) -> void:
	var pad := _stap_script(index, "skelet.md")
	if pad == OVERGESLAGEN:
		return
	if pad == "":
		_faal("Deel 1: geen script gevonden onder 'Je script tot nu toe'")
		return
	var speler := await _draai(pad, 30)
	# Deel 1 belooft: de functie draait, maar er beweegt nog niets.
	_verwacht(is_equal_approx(speler.position.y, 100.0), "Deel 1: karakter hoort stil te staan, y=%s" % speler.position.y)
	_ruim_op(speler)

func _test_vallen(index: Array) -> void:
	var pad := _stap_script(index, "motor.md")
	if pad == OVERGESLAGEN:
		return
	if pad == "":
		_faal("Deel 2: geen script gevonden")
		return
	var speler := await _draai(pad, 3)
	_verwacht(speler.position.y > 100.0, "Deel 2: karakter hoort te vallen, y=%s" % speler.position.y)

	# Deel 2 toont drie opeenvolgende prints die telkens 16.33 verder staan.
	# Dat getal is 980 gedeeld door zestig frames; hier meten we de stap zelf,
	# nog in de lucht.
	var eerste: float = speler.gemeten_y
	await _stap(1)
	var stap: float = speler.gemeten_y - eerste
	_verwacht(
		stap > 15.0 and stap < 18.0,
		"Deel 2: velocity.y hoort per frame ~16.33 op te lopen tijdens het vallen, is %s" % stap
	)
	await _stap(120)
	_verwacht(speler.position.y < 400.0, "Deel 2: karakter hoort op de vloer te blijven, y=%s" % speler.position.y)
	# Zonder de if uit Deel 4 staat er vlak vóór move_and_slide() één frame
	# zwaartekracht in velocity.y — het getal dat Deel 4 belooft (ongeveer 16).
	_verwacht(
		speler.gemeten_y > 10.0 and speler.gemeten_y < 25.0,
		"Deel 2: velocity.y hoort op de vloer rond 16 te staan vóór move_and_slide(), is %s" % speler.gemeten_y
	)
	_ruim_op(speler)

func _test_grond(index: Array) -> void:
	var pad := _stap_script(index, "grond.md")
	if pad == OVERGESLAGEN:
		return
	if pad == "":
		_faal("Deel 4: geen script gevonden")
		return
	var speler := await _draai(pad, 150)
	# Precies wat Deel 4 oplevert: op dezelfde plek staat nu 0 in plaats van 16.
	_verwacht(
		is_zero_approx(speler.gemeten_y),
		"Deel 4: velocity.y hoort op de vloer 0 te zijn vóór move_and_slide(), is %s" % speler.gemeten_y
	)
	_ruim_op(speler)

func _test_lopen(index: Array) -> void:
	var pad := _stap_script(index, "krachten.md")
	if pad == OVERGESLAGEN:
		return
	if pad == "":
		_faal("Deel 5: geen script gevonden")
		return
	var speler := await _draai(pad, 60)
	var x_voor: float = speler.position.x
	Input.action_press("ui_right")
	await _stap(30)
	Input.action_release("ui_right")
	_verwacht(speler.position.x > x_voor + 10.0, "Deel 5: karakter hoort naar rechts te lopen, dx=%s" % (speler.position.x - x_voor))
	_ruim_op(speler)

func _test_remmen(index: Array) -> void:
	var pad := _stap_script(index, "remmen.md")
	if pad == OVERGESLAGEN:
		return
	if pad == "":
		_faal("Deel 6: geen script gevonden")
		return
	var speler := await _draai(pad, 60)
	Input.action_press("ui_right")
	await _stap(20)
	Input.action_release("ui_right")
	await _stap(20)
	_verwacht(is_zero_approx(speler.velocity.x), "Deel 6: karakter hoort af te remmen naar 0, velocity.x=%s" % speler.velocity.x)
	_ruim_op(speler)

func _test_springen(index: Array) -> void:
	var pad := _stap_script(index, "afsluiter.md")
	if pad == OVERGESLAGEN:
		return
	if pad == "":
		_faal("Deel 7: geen script gevonden")
		return
	var speler := await _draai(pad, 90)
	var y_op_vloer: float = speler.position.y
	Input.action_press("ui_accept")
	await _stap(1)
	Input.action_release("ui_accept")
	await _stap(10)
	_verwacht(speler.position.y < y_op_vloer - 20.0, "Deel 7: karakter hoort te springen, dy=%s" % (speler.position.y - y_op_vloer))

	# En niet nog eens midden in de lucht.
	var y_in_lucht: float = speler.position.y
	Input.action_press("ui_accept")
	await _stap(1)
	Input.action_release("ui_accept")
	await _stap(1)
	_verwacht(
		speler.velocity.y > -300.0,
		"Deel 7: een tweede sprong in de lucht hoort niet te werken, velocity.y=%s (y was %s)" % [speler.velocity.y, y_in_lucht]
	)
	_ruim_op(speler)

# Deel 7 beschrijft wat er gebeurt met een variant van de springregel. Dat
# klopte niet: "hij komt nooit meer naar beneden" en "hij blijft aan het
# plafond plakken" bij is_action_pressed, terwijl hij landt en meteen weer
# springt. Hier speelt de runner elke variant na, op het complete script.
func _test_springvarianten(index: Array) -> void:
	var pad := _stap_script(index, "afsluiter.md")
	if pad == OVERGESLAGEN or pad == "":
		return
	var bron := FileAccess.get_file_as_string(pad)
	var regel := 'if Input.is_action_just_pressed("ui_accept") and is_on_floor():'
	if not bron.contains(regel) or not bron.contains("velocity.y = JUMP_VELOCITY"):
		_faal("Deel 7: de springregel staat niet meer zoals de varianten hem verwachten")
		return
	var gewoon := await _hoogste_sprong(pad)

	# Stap 5: met += is de sprong vanaf de grond even hoog.
	var plus := await _hoogste_sprong(_variant(bron, "velocity.y = JUMP_VELOCITY", "velocity.y += JUMP_VELOCITY"))
	_verwacht(absf(plus - gewoon) < 1.0, "Deel 7: met += hoort een sprong vanaf de grond even hoog te zijn (%s tegen %s)" % [plus, gewoon])

	# Stap 3: met is_action_pressed blijft hij stuiteren, niet hoger dan gewoon.
	var vast := _variant(bron, "is_action_just_pressed", "is_action_pressed")
	var speler := await _draai(vast, 90)
	var start: float = speler.position.y
	var hoogste := start
	var landingen := 0
	var was_op_grond := true
	Input.action_press("ui_accept")
	for i in 150:
		await _stap(1)
		hoogste = minf(hoogste, speler.position.y)
		if speler.is_on_floor() and not was_op_grond:
			landingen += 1
		was_op_grond = speler.is_on_floor()
	Input.action_release("ui_accept")
	_verwacht(landingen >= 2, "Deel 7: met is_action_pressed hoort hij te landen en opnieuw te springen, landingen=%s" % landingen)
	_verwacht(start - hoogste < gewoon + 2.0, "Deel 7: met is_action_pressed hoort hij niet hoger te komen dan een gewone sprong (%s tegen %s)" % [start - hoogste, gewoon])
	_ruim_op(speler)

	# Stap 4: zonder is_on_floor() lukt een sprong midden in de lucht.
	speler = await _draai(_variant(bron, " and is_on_floor()", ""), 90)
	_verwacht(await _sprong(speler), "Deel 7: zonder is_on_floor() hoort een sprong vanaf de grond te lukken")
	await _stap(10)
	_verwacht(not speler.is_on_floor() and await _sprong(speler), "Deel 7: zonder is_on_floor() hoort een sprong in de lucht te lukken, velocity.y=%s" % speler.velocity.y)
	_ruim_op(speler)

# Hoe hoog één druk op de spatie het karakter brengt, in pixels.
func _hoogste_sprong(script_pad: String) -> float:
	var speler := await _draai(script_pad, 90)
	var start: float = speler.position.y
	var hoogste := start
	Input.action_press("ui_accept")
	await _stap(1)
	Input.action_release("ui_accept")
	for i in 90:
		await _stap(1)
		hoogste = minf(hoogste, speler.position.y)
	_ruim_op(speler)
	return start - hoogste

var _varianten := 0

# Een kopie van een script met één stuk vervangen, als bestand voor _draai.
func _variant(bron: String, oud: String, nieuw: String) -> String:
	_varianten += 1
	var pad := "user://variant_%s.gd" % _varianten
	var f := FileAccess.open(pad, FileAccess.WRITE)
	f.store_string(bron.replace(oud, nieuw))
	f.close()
	return pad

# --- rapportage --------------------------------------------------------------

# --- hoofdstuk 10: eigen functies ------------------------------------------

# Het script onder een kop in een les; OVERGESLAGEN bij --alleen, "" als het
# er niet is.
func _script_onder(index: Array, bron_bevat: String, kop_begint: String) -> String:
	var item := _item_onder(index, bron_bevat, kop_begint)
	if item.is_empty():
		return ""
	if item.get("overslaan", false):
		return OVERGESLAGEN
	return EXTRACTED + "/" + item["naam"] + ".gd"

func _item_onder(index: Array, bron_bevat: String, kop_begint: String) -> Dictionary:
	for item in index:
		if item.has("verwacht_fout") or item.has("verwacht_runtime_fout"):
			continue
		if String(item["bron"]).contains(bron_bevat) and String(item["kop"]).begins_with(kop_begint):
			return item
	return {}

# Een karakter zoals de leerling het na Animaties heeft, met een
# AnimatedSprite2D, zodat kies_animatie() niets mist.
func _maak_karakter(script_pad: String, positie: Vector2) -> CharacterBody2D:
	var karakter := CharacterBody2D.new()
	var vorm := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(20, 40)
	vorm.shape = rect
	karakter.add_child(vorm)
	var anim := AnimatedSprite2D.new()
	anim.name = "AnimatedSprite2D"
	# Een animatie zonder frames laat play() stil op "default" staan; met één
	# placeholder per animatie volgt animation wat het script kiest.
	var frames := SpriteFrames.new()
	for naam in ["idle", "run", "jump"]:
		frames.add_animation(naam)
		frames.add_frame(naam, PlaceholderTexture2D.new())
	anim.sprite_frames = frames
	karakter.add_child(anim)
	karakter.position = positie
	var script := GDScript.new()
	script.source_code = FileAccess.get_file_as_string(script_pad)
	if script.reload() == OK:
		karakter.set_script(script)
	else:
		_faal("kon %s niet compileren voor de gedragstest" % script_pad)
	return karakter

func _zet_neer(script_pad: String, positie: Vector2) -> CharacterBody2D:
	var wereld := _maak_wereld()
	var karakter := _maak_karakter(script_pad, positie)
	wereld.add_child(karakter)
	add_child(wereld)
	return karakter

# Vallen, naar rechts lopen, springen en uitlopen: dezelfde invoer voor elk
# script. Geeft de plek, en de animatie en spiegeling op het eind, zodat ook
# een vergeten kies_animatie() opvalt.
func _speel_rondje(script_pad: String) -> String:
	var karakter := _zet_neer(script_pad, Vector2(0, 100))
	await _stap(60)
	Input.action_press("ui_right")
	await _stap(30)
	Input.action_press("ui_accept")
	await _stap(2)
	Input.action_release("ui_accept")
	await _stap(30)
	Input.action_release("ui_right")
	await _stap(120)
	Input.action_press("ui_left")
	await _stap(5)
	var anim: AnimatedSprite2D = karakter.get_node("AnimatedSprite2D")
	var uitkomst := "plek %s, animatie %s, gespiegeld %s" % [karakter.position.round(), anim.animation, anim.flip_h]
	Input.action_release("ui_left")
	_ruim_op(karakter)
	return uitkomst

# 10.1 belooft: na het opknippen doet je spel precies hetzelfde. Bij --alleen
# draait de test zodra een van de twee blokken is veranderd; de .gd-bestanden
# worden altijd geschreven.
func _test_opknippen(index: Array) -> void:
	var voor := _item_onder(index, "eigen_functies.md", "Je script als beginpunt")
	var na := _item_onder(index, "eigen_functies.md", "Opdracht 10.1.a")
	if voor.is_empty() or na.is_empty():
		_faal("10.1: beginpunt of oplossing van 10.1.a niet gevonden")
		return
	if voor.get("overslaan", false) and na.get("overslaan", false):
		return
	var a: String = await _speel_rondje(EXTRACTED + "/" + voor["naam"] + ".gd")
	var b: String = await _speel_rondje(EXTRACTED + "/" + na["naam"] + ".gd")
	_verwacht(a == b, "10.1: opgeknipt script eindigt op %s, het beginpunt op %s" % [b, a])
	_verwacht(a.contains("animatie run") and a.contains("gespiegeld true"), "10.1: na naar links lopen hoort de loop-animatie gespiegeld te spelen: %s" % a)

# Druk één keer op spatie en geef terug of het karakter sprong. Zwaartekracht
# maakt velocity.y alleen groter; wordt hij kleiner, dan was dat een sprong.
# (Een vaste drempel miste een tweede sprong vlak na de eerste: dan daalt hij
# maar zo'n 50.)
func _sprong(karakter: CharacterBody2D) -> bool:
	var voor := karakter.velocity.y
	Input.action_press("ui_accept")
	await _stap(2)
	Input.action_release("ui_accept")
	await _stap(1)
	return karakter.velocity.y < voor

# Een platform van 200 breed op y=0, met de gewone vloer op y=400 eronder.
func _zet_op_platform(script_pad: String) -> CharacterBody2D:
	var wereld := _maak_wereld()
	var platform := StaticBody2D.new()
	var vorm := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(200, 20)
	vorm.shape = rect
	platform.add_child(vorm)
	platform.position = Vector2(0, 0)
	wereld.add_child(platform)
	var karakter := _maak_karakter(script_pad, Vector2(0, -40))
	wereld.add_child(karakter)
	add_child(wereld)
	return karakter

# 10.1.b belooft: één extra sprong in de lucht, ook na een randje, en niet
# meer. Eerst gebruikt het karakter zijn extra sprong al eens, landt, en
# loopt dan pas van het randje: een oplossing die de extra sprong alleen bij
# een sprong vanaf de grond teruggeeft, valt zo door de mand.
func _test_dubbel_springen(index: Array) -> void:
	var pad := _script_onder(index, "eigen_functies.md", "Opdracht 10.1.b")
	if pad == OVERGESLAGEN:
		return
	if pad == "":
		_faal("10.1.b: geen oplossing gevonden")
		return
	var karakter := _zet_op_platform(pad)
	await _stap(30)
	_verwacht(karakter.is_on_floor(), "10.1.b: het karakter hoort op het platform te staan")
	_verwacht(await _sprong(karakter), "10.1.b: vanaf de grond hoort een sprong te lukken")
	await _stap(8)
	_verwacht(await _sprong(karakter), "10.1.b: na een sprong vanaf de grond hoort één extra sprong te lukken")
	await _stap(5)
	_verwacht(not await _sprong(karakter), "10.1.b: daarna hoort er geen sprong meer te lukken")
	await _stap(120)
	_verwacht(karakter.is_on_floor(), "10.1.b: het karakter hoort weer op het platform te landen")
	Input.action_press("ui_right")
	while karakter.is_on_floor() and karakter.position.x < 400.0:
		await _stap(1)
	Input.action_release("ui_right")
	await _stap(3)
	_verwacht(not karakter.is_on_floor(), "10.1.b: het karakter hoort van het randje te zijn gelopen")
	_verwacht(await _sprong(karakter), "10.1.b: na een randje hoort één sprong in de lucht te lukken")
	await _stap(5)
	_verwacht(not await _sprong(karakter), "10.1.b: na een randje hoort maar één sprong in de lucht te lukken")
	_ruim_op(karakter)

func _verwacht(voorwaarde: bool, boodschap: String) -> void:
	if not voorwaarde:
		_faal(boodschap)

func _faal(boodschap: String) -> void:
	fouten.append(boodschap)

func _rapporteer() -> void:
	if runtime_afgehandeld != runtime_totaal:
		_faal("de runtime-voorbeelden braken af na %d van %d" % [runtime_afgehandeld, runtime_totaal])
	if fouten.is_empty():
		print("Alles klopt.")
		get_tree().quit(0)
		return
	printerr("%d probleem(en):" % fouten.size())
	for f in fouten:
		printerr("  - " + f)
	get_tree().quit(1)
