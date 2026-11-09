extends Area2D

func _ready() -> void:
	add_to_group("muntjes")

func _on_body_entered(body: Node2D) -> void:
	Global.score += 1
	print("Score: ", Global.score)
	queue_free()
	if get_tree().get_nodes_in_group("muntjes").size() <= 1:
		print("Je hebt gewonnen!")
