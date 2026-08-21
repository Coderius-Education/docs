# Autoload, zodat scripts uit hoofdstuk 7 die `Global.score` gebruiken
# compileren. Zelfde velden als in de les.
extends Node

var score = 0
var levens = 3

func reset() -> void:
    score = 0
    levens = 3

func is_game_over() -> bool:
    return levens <= 0
