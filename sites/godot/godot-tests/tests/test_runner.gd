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

var fouten: Array[String] = []
var gedaan := 0

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
	for item in index:
		var pad: String = EXTRACTED + "/" + item["naam"] + ".gd"
		var bron: String = "%s:%s" % [item["bron"], item["regel"]]
		if not FileAccess.file_exists(pad):
			_faal("%s — bestand ontbreekt na extractie" % bron)
			continue
		# Niet via ResourceLoader.load: die geeft ook bij een parse-fout nog een
		# object terug, waardoor de check stil groen bleef. reload() geeft een
		# foutcode.
		var script := GDScript.new()
		script.source_code = FileAccess.get_file_as_string(pad)
		if script.reload() != OK:
			_faal("%s — compileert niet (zie de fout hierboven)" % bron)
		else:
			gedaan += 1
	print("Gecompileerd: %d van %d blokken." % [gedaan, index.size()])

# --- laag 2: gedrag ----------------------------------------------------------

# De canonieke tussenstanden staan in de docs onder deze koppen.
func _stap_script(index: Array, bron_bevat: String) -> String:
	for item in index:
		var kop: String = item["kop"]
		if String(item["bron"]).contains(bron_bevat) and kop.begins_with("Je script tot nu toe"):
			return EXTRACTED + "/" + item["naam"] + ".gd"
		if String(item["bron"]).contains(bron_bevat) and kop.begins_with("Je complete script"):
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

func _test_skelet(index: Array) -> void:
	var pad := _stap_script(index, "skelet.md")
	if pad == "":
		_faal("Deel 1: geen script gevonden onder 'Je script tot nu toe'")
		return
	var speler := await _draai(pad, 30)
	# Deel 1 belooft: de functie draait, maar er beweegt nog niets.
	_verwacht(is_equal_approx(speler.position.y, 100.0), "Deel 1: karakter hoort stil te staan, y=%s" % speler.position.y)
	_ruim_op(speler)

func _test_vallen(index: Array) -> void:
	var pad := _stap_script(index, "motor.md")
	if pad == "":
		_faal("Deel 2: geen script gevonden")
		return
	var speler := await _draai(pad, 10)
	_verwacht(speler.position.y > 100.0, "Deel 2: karakter hoort te vallen, y=%s" % speler.position.y)
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
