extends CharacterBody2D

const SPEED = 450.0
var sprongkracht = -1100.0

var opgeraapt = {}
var levens = ["hart", "hart", "hart"]


func _physics_process(delta: float) -> void:
	if not is_on_floor():
		velocity += get_gravity() * delta

	if Input.is_action_just_pressed("duiken") and is_on_floor():
		velocity.y = sprongkracht

	var richting := Input.get_axis("ui_left", "ui_right")
	velocity.x = richting * SPEED
	kies_animatie(richting)
	move_and_slide()


func kies_animatie(richting: float) -> void:
	if not is_on_floor():
		$AnimatedSprite2D.play("zwemmen")
	elif richting == 0:
		$AnimatedSprite2D.play("drijven")
	else:
		$AnimatedSprite2D.play("run")


func verzamel(soort: String) -> void:
	if not opgeraapt.has(soort):
		opgeraapt[soort] = 0
	opgeraapt[soort] += 1
	Global.score += 1
	for schelp in get_tree().get_nodes_in_group("schelpen"):
		schelp.glim()


func tel_op() -> void:
	Global.score += 1
	for soort in opgeraapt:
		Global.beste_score = max(Global.beste_score, opgeraapt[soort])


func knipper() -> void:
	var tween = create_tween()
	tween.tween_property($AnimatedSprite2D, "modulate:a", 0.2, 0.2)
	tween.tween_property($AnimatedSprite2D, "modulate:a", 1.0, 0.2)
