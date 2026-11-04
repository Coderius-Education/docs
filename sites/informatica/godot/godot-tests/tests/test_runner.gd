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

func _ready() -> void:
	var index := _lees_index()
	if index.is_empty():
		_faal("geen extracted/index.json gevonden — draai eerst `pnpm godot:extract`")
		_rapporteer()
		return

	_compileer_alles(index)
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
		if regel.contains(verwacht):
			foutvoorbeelden += 1
			return
	_faal("%s — Godot geeft niet de melding uit de les ('%s') maar: %s" % [bron, verwacht, " | ".join(meldingen.regels)])

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

# --- rapportage --------------------------------------------------------------

# --- hoofdstuk 10: eigen functies ------------------------------------------

# Het script onder een kop in een les; OVERGESLAGEN bij --alleen, "" als het
# er niet is.
func _script_onder(index: Array, bron_bevat: String, kop_begint: String) -> String:
	for item in index:
		if item.has("verwacht_fout"):
			continue
		if String(item["bron"]).contains(bron_bevat) and String(item["kop"]).begins_with(kop_begint):
			if item.get("overslaan", false):
				return OVERGESLAGEN
			return EXTRACTED + "/" + item["naam"] + ".gd"
	return ""

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
	var frames := SpriteFrames.new()
	for naam in ["idle", "run", "jump"]:
		frames.add_animation(naam)
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

# Vallen, naar rechts lopen, springen en uitlopen: dezelfde invoer voor elk script.
func _speel_rondje(script_pad: String) -> Vector2:
	var karakter := _zet_neer(script_pad, Vector2(0, 100))
	await _stap(60)
	Input.action_press("ui_right")
	await _stap(30)
	Input.action_press("ui_accept")
	await _stap(2)
	Input.action_release("ui_accept")
	await _stap(30)
	Input.action_release("ui_right")
	await _stap(30)
	var plek := karakter.position
	_ruim_op(karakter)
	return plek

# 10.1 belooft: na het opknippen doet je spel precies hetzelfde.
func _test_opknippen(index: Array) -> void:
	var voor := _script_onder(index, "eigen_functies.md", "Je script als beginpunt")
	var na := _script_onder(index, "eigen_functies.md", "Opdracht 10.1.a")
	if voor == OVERGESLAGEN or na == OVERGESLAGEN:
		return
	if voor == "" or na == "":
		_faal("10.1: beginpunt of oplossing van 10.1.a niet gevonden")
		return
	var a: Vector2 = await _speel_rondje(voor)
	var b: Vector2 = await _speel_rondje(na)
	_verwacht(a.distance_to(b) < 0.01, "10.1: opgeknipt script eindigt op %s, het beginpunt op %s" % [b, a])
	_verwacht(a.x > 100.0, "10.1: het karakter hoort naar rechts gelopen te zijn, x=%s" % a.x)

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

# 10.1.b belooft: één extra sprong in de lucht, ook na een randje, en niet meer.
func _test_dubbel_springen(index: Array) -> void:
	var pad := _script_onder(index, "eigen_functies.md", "Opdracht 10.1.b")
	if pad == OVERGESLAGEN:
		return
	if pad == "":
		_faal("10.1.b: geen oplossing gevonden")
		return
	# Hoog boven de vloer: zoals van een randje gelopen, zonder te springen.
	var karakter := _zet_neer(pad, Vector2(0, -200))
	await _stap(5)
	_verwacht(await _sprong(karakter), "10.1.b: na een randje hoort één sprong in de lucht te lukken")
	await _stap(5)
	_verwacht(not await _sprong(karakter), "10.1.b: na een randje hoort maar één sprong in de lucht te lukken")
	await _stap(300)
	_verwacht(karakter.is_on_floor(), "10.1.b: het karakter hoort weer op de vloer te staan")
	_verwacht(await _sprong(karakter), "10.1.b: vanaf de grond hoort een sprong te lukken")
	await _stap(8)
	_verwacht(await _sprong(karakter), "10.1.b: na een sprong vanaf de grond hoort één extra sprong te lukken")
	await _stap(5)
	_verwacht(not await _sprong(karakter), "10.1.b: daarna hoort er geen sprong meer te lukken")
	_ruim_op(karakter)

func _verwacht(voorwaarde: bool, boodschap: String) -> void:
	if not voorwaarde:
		_faal(boodschap)

func _faal(boodschap: String) -> void:
	fouten.append(boodschap)

func _rapporteer() -> void:
	if fouten.is_empty():
		print("Alles klopt.")
		get_tree().quit(0)
		return
	printerr("%d probleem(en):" % fouten.size())
	for f in fouten:
		printerr("  - " + f)
	get_tree().quit(1)
