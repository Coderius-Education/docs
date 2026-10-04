extends Node2D

const MUNTJE = preload("res://muntje.tscn")

func _ready() -> void:
	spawn_muntje(200, 100)

func spawn_muntje(x: float, y: float) -> void:
	var nieuw_muntje = MUNTJE.instantiate()
	nieuw_muntje.position = Vector2(x, y)
	add_child(nieuw_muntje)

func _on_timer_timeout() -> void:
	spawn_muntje(randf_range(50, 1000), 100)
