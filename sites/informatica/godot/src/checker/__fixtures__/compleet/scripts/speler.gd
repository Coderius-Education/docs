extends CharacterBody2D

const SPEED = 300.0
var sprongkracht = -800.0

var score = 0
var op_de_grond
var staat_stil

func _physics_process(delta: float) -> void:
	if not is_on_floor():
		velocity += get_gravity() * delta

	if Input.is_action_just_pressed("ui_accept") and is_on_floor():
		velocity.y = sprongkracht

	var direction := Input.get_axis("ui_left", "ui_right")
	if direction == 0:
		velocity.x = move_toward(velocity.x, 0, SPEED)
	else:
		velocity.x = direction * SPEED

	staat_stil = velocity.x == 0
	op_de_grond = is_on_floor()
	if not op_de_grond:
		$AnimatedSprite2D.play('jump')
	elif staat_stil:
		$AnimatedSprite2D.play('idle')
	elif velocity.x > 0:
		$AnimatedSprite2D.play('run')
		$AnimatedSprite2D.flip_h = false
	elif velocity.x < 0:
		$AnimatedSprite2D.play('run')
		$AnimatedSprite2D.flip_h = true

	move_and_slide()


func geef_sprongboost() -> void:
	sprongkracht = -1300.0
	await get_tree().create_timer(5.0).timeout
	sprongkracht = -800.0
