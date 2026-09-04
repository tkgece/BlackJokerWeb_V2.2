from flask import Flask, render_template, jsonify, request

from game.blackjack import BlackjackRoom

import random
import string


app = Flask(__name__)


# =========================================================
# ODALAR
# =========================================================

rooms = {}


def generate_room_code():

    characters = string.ascii_uppercase + string.digits

    while True:

        code = "".join(
            random.choices(
                characters,
                k=5
            )
        )

        if code not in rooms:
            return code


# =========================================================
# ANA SAYFA
# =========================================================

@app.route("/")
def index():

    return render_template("index.html")


# =========================================================
# ODA OLUŞTUR
# =========================================================

@app.route(
    "/api/room/create",
    methods=["POST"]
)
def create_room():

    data = request.get_json(
        silent=True
    ) or {}

    nickname = data.get(
        "nickname",
        ""
    ).strip()

    if not nickname:

        return jsonify({
            "success": False,
            "message": "Nickname gerekli."
        }), 400

    room_code = generate_room_code()

    rooms[room_code] = {

        "players": [
            nickname
        ],

        "started": False,

        "game": None
    }

    return jsonify({

        "success": True,

        "room_code":
            room_code,

        "players":
            rooms[room_code]["players"],

        "started":
            False
    })


# =========================================================
# ODAYA KATIL
# =========================================================

@app.route(
    "/api/room/join",
    methods=["POST"]
)
def join_room():

    data = request.get_json(
        silent=True
    ) or {}

    nickname = data.get(
        "nickname",
        ""
    ).strip()

    room_code = data.get(
        "room_code",
        ""
    ).strip().upper()

    if not nickname:

        return jsonify({
            "success": False,
            "message": "Nickname gerekli."
        }), 400

    if not room_code:

        return jsonify({
            "success": False,
            "message": "Oda kodu gerekli."
        }), 400

    if room_code not in rooms:

        return jsonify({
            "success": False,
            "message": "Bu oda bulunamadı."
        }), 404

    room = rooms[room_code]

    if room.get("started", False):

        return jsonify({
            "success": False,
            "message": "Bu oyun zaten başladı."
        }), 400

    if len(room["players"]) >= 2:

        return jsonify({
            "success": False,
            "message": "Bu oda dolu."
        }), 400

    if nickname in room["players"]:

        return jsonify({
            "success": False,
            "message": "Bu nickname zaten odada."
        }), 400

    room["players"].append(nickname)

    return jsonify({

        "success": True,

        "room_code":
            room_code,

        "players":
            room["players"],

        "started":
            room["started"]
    })


# =========================================================
# ODA DURUMU
# =========================================================

@app.route(
    "/api/room/<room_code>",
    methods=["GET"]
)
def get_room(room_code):

    room_code = room_code.strip().upper()

    if room_code not in rooms:

        return jsonify({
            "success": False,
            "message": "Bu oda bulunamadı."
        }), 404

    room = rooms[room_code]

    return jsonify({

        "success": True,

        "room_code":
            room_code,

        "players":
            room["players"],

        "player_count":
            len(room["players"]),

        "max_players":
            2,

        "started":
            room.get(
                "started",
                False
            )
    })


# =========================================================
# OYUNU BAŞLAT
# =========================================================

@app.route(
    "/api/room/start",
    methods=["POST"]
)
def start_room():

    data = request.get_json(
        silent=True
    ) or {}

    room_code = data.get(
        "room_code",
        ""
    ).strip().upper()

    if not room_code:

        return jsonify({
            "success": False,
            "message": "Oda kodu gerekli."
        }), 400

    if room_code not in rooms:

        return jsonify({
            "success": False,
            "message": "Bu oda bulunamadı."
        }), 404

    room = rooms[room_code]

    if len(room["players"]) < 2:

        return jsonify({
            "success": False,
            "message":
                "Oyunu başlatmak için 2 oyuncu gerekli."
        }), 400

    if room.get("started", False):

        return jsonify({

            "success": True,

            "started": True,

            "room_code":
                room_code,

            "players":
                room["players"]
        })

    room["game"] = BlackjackRoom(
        room["players"]
    )

    room["started"] = True

    return jsonify({

        "success": True,

        "started": True,

        "room_code":
            room_code,

        "players":
            room["players"]
    })


# =========================================================
# OYUNCU / ODA KONTROLÜ
# =========================================================

def get_player_game():

    room_code = request.args.get(
        "room_code",
        ""
    ).strip().upper()

    nickname = request.args.get(
        "nickname",
        ""
    ).strip()

    if not room_code:

        return None, None, (
            jsonify({
                "success": False,
                "message": "Oda kodu gerekli."
            }),
            400
        )

    if not nickname:

        return None, None, (
            jsonify({
                "success": False,
                "message": "Nickname gerekli."
            }),
            400
        )

    if room_code not in rooms:

        return None, None, (
            jsonify({
                "success": False,
                "message": "Bu oda bulunamadı."
            }),
            404
        )

    room = rooms[room_code]

    if room.get("game") is None:

        return None, None, (
            jsonify({
                "success": False,
                "message": "Oyun henüz başlamadı."
            }),
            400
        )

    game = room["game"]

    if game.player_index(nickname) is None:

        return None, None, (
            jsonify({
                "success": False,
                "message": "Bu oyuncu odada değil."
            }),
            403
        )

    return room, game, None


# =========================================================
# STATE
# =========================================================

@app.route(
    "/api/state",
    methods=["GET"]
)
def state():

    room, game, error = get_player_game()

    if error:
        return error

    nickname = request.args.get(
        "nickname"
    ).strip()

    return jsonify(
        game.get_state(nickname)
    )


# =========================================================
# ORTAK POST KONTROLÜ
# =========================================================

def get_post_game():

    data = request.get_json(
        silent=True
    ) or {}

    room_code = data.get(
        "room_code",
        ""
    ).strip().upper()

    nickname = data.get(
        "nickname",
        ""
    ).strip()

    if not room_code:

        return None, None, None, (
            jsonify({
                "success": False,
                "message": "Oda kodu gerekli."
            }),
            400
        )

    if not nickname:

        return None, None, None, (
            jsonify({
                "success": False,
                "message": "Nickname gerekli."
            }),
            400
        )

    if room_code not in rooms:

        return None, None, None, (
            jsonify({
                "success": False,
                "message": "Bu oda bulunamadı."
            }),
            404
        )

    room = rooms[room_code]

    game = room.get("game")

    if game is None:

        return None, None, None, (
            jsonify({
                "success": False,
                "message": "Oyun henüz başlamadı."
            }),
            400
        )

    if game.player_index(nickname) is None:

        return None, None, None, (
            jsonify({
                "success": False,
                "message": "Bu oyuncu odada değil."
            }),
            403
        )

    return room, game, nickname, None


# =========================================================
# BAHİS
# =========================================================

@app.route(
    "/api/bet",
    methods=["POST"]
)
def bet():

    room, game, nickname, error = get_post_game()

    if error:
        return error

    data = request.get_json(
        silent=True
    ) or {}

    try:
        value = int(
            data.get("value")
        )
    except (
        TypeError,
        ValueError
    ):
        return jsonify({
            "success": False,
            "message": "Geçersiz çip."
        }), 400

    game.add_chip(
        nickname,
        value
    )

    return jsonify(
        game.get_state(nickname)
    )


# =========================================================
# BAHİS ÇİPİ SİL
# =========================================================

@app.route(
    "/api/bet/remove",
    methods=["POST"]
)
def remove_bet():

    room, game, nickname, error = get_post_game()

    if error:
        return error

    data = request.get_json(
        silent=True
    ) or {}

    try:
        index = int(
            data.get("index")
        )
    except (
        TypeError,
        ValueError
    ):
        return jsonify({
            "success": False,
            "message": "Geçersiz çip."
        }), 400

    game.remove_bet_chip(
        nickname,
        index
    )

    return jsonify(
        game.get_state(nickname)
    )


# =========================================================
# DEAL
# =========================================================

@app.route(
    "/api/deal",
    methods=["POST"]
)
def deal():

    room, game, nickname, error = get_post_game()

    if error:
        return error

    game.request_deal(
        nickname
    )

    return jsonify(
        game.get_state(nickname)
    )


# =========================================================
# HIT
# =========================================================

@app.route(
    "/api/hit",
    methods=["POST"]
)
def hit():

    room, game, nickname, error = get_post_game()

    if error:
        return error

    game.player_hit(
        nickname
    )

    return jsonify(
        game.get_state(nickname)
    )


# =========================================================
# STAND
# =========================================================

@app.route(
    "/api/stand",
    methods=["POST"]
)
def stand():

    room, game, nickname, error = get_post_game()

    if error:
        return error

    game.player_stand(
        nickname
    )

    return jsonify(
        game.get_state(nickname)
    )


# =========================================================
# DOUBLE
# =========================================================

@app.route(
    "/api/double",
    methods=["POST"]
)
def double():

    room, game, nickname, error = get_post_game()

    if error:
        return error

    game.double_bet(
        nickname
    )

    return jsonify(
        game.get_state(nickname)
    )


# =========================================================
# ELİ TEMİZLE
# =========================================================

@app.route(
    "/api/clear",
    methods=["POST"]
)
def clear():

    room, game, nickname, error = get_post_game()

    if error:
        return error

    game.clear_finished_hand()

    return jsonify(
        game.get_state(nickname)
    )


# =========================================================
# RESTART
# =========================================================

@app.route(
    "/api/restart",
    methods=["POST"]
)
def restart():

    room, game, nickname, error = get_post_game()

    if error:
        return error

    game.restart_player(
        nickname
    )

    return jsonify(
        game.get_state(nickname)
    )


# =========================================================
# ÇALIŞTIR
# =========================================================

if __name__ == "__main__":

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )