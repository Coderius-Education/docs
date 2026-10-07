extends Label

func _process(_delta: float) -> void:
	text = "Score: " + str(Global.score)
