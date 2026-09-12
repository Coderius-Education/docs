extends Node

var score = 0
var beste_score = 0


func bewaar() -> void:
	var bestand = FileAccess.open("user://score.json", FileAccess.WRITE)
	bestand.store_string(JSON.stringify({"beste": beste_score}))
	bestand.close()


func laad() -> void:
	if not FileAccess.file_exists("user://score.json"):
		return
	var bestand = FileAccess.open("user://score.json", FileAccess.READ)
	var gegevens = JSON.parse_string(bestand.get_as_text())
	beste_score = gegevens["beste"]
