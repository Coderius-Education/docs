extends Area2D

func _on_body_entered(body: Node2D) -> void:
	Global.score += 1
	print("Score: ", Global.score)
	queue_free()
