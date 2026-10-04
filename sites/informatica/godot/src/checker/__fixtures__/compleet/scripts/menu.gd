extends Control

func _ready() -> void:
	$VBoxContainer/Afsluiten.pressed.connect(_on_afsluiten_pressed)

func _on_start_pressed() -> void:
	Global.reset()
	get_tree().change_scene_to_file("res://level1.tscn")

func _on_afsluiten_pressed() -> void:
	get_tree().quit()
