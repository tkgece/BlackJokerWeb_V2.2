import random
import time


class BlackjackRoom:

    SUITS = [
        "hearts",
        "diamonds",
        "clubs",
        "spades"
    ]

    RANKS = [
        "2", "3", "4", "5", "6", "7",
        "8", "9", "10", "J", "Q", "K", "A"
    ]

    CHIP_VALUES = [
        1, 5, 25, 50, 100, 200, 500, 1000
    ]

    # =====================================================
    # MAÇ AYARLARI
    # =====================================================

    STARTING_BALANCE = 5000

    # Oyuncu bu bakiyeye ulaştığında maçı kazanır.
    WINNING_BALANCE = 10000

    def __init__(self, nicknames, balance=None):

        if balance is None:
            balance = self.STARTING_BALANCE

        self.players = []

        for nickname in nicknames[:2]:

            self.players.append({
                "nickname": nickname,

                "balance": balance,

                "current_bet": 0,

                "bet_chips": [],

                "hand": [],

                "game_over": False,

                "result": "",

                "result_type": "",

                "stand": False,

                "deal_requested": False
            })

        self.deck = []

        # betting / playing / finished
        self.phase = "betting"

        self.started = False

        # İlk oynayacak oyuncu P1
        self.current_player = 0

        self.deal_requests = set()

        self.finished_at = None

        # =================================================
        # MAÇ DURUMU
        # =================================================

        self.match_over = False

        # 0 veya 1
        self.match_winner = None

    # =====================================================
    # DESTE
    # =====================================================

    def create_deck(self):

        deck = []

        for suit in self.SUITS:

            for rank in self.RANKS:

                deck.append({
                    "suit": suit,
                    "rank": rank
                })

        random.shuffle(deck)

        return deck

    def draw_card(self):

        if not self.deck:
            return None

        return self.deck.pop()

    # =====================================================
    # KART DEĞERİ
    # =====================================================

    def card_value(self, card):

        rank = card["rank"]

        if rank in ["J", "Q", "K"]:
            return 10

        if rank == "A":
            return 11

        return int(rank)

    def hand_value(self, hand):

        total = 0
        aces = 0

        for card in hand:

            total += self.card_value(card)

            if card["rank"] == "A":
                aces += 1

        while total > 21 and aces > 0:

            total -= 10
            aces -= 1

        return total

    def is_blackjack(self, hand):

        return (
            len(hand) == 2
            and self.hand_value(hand) == 21
        )

    # =====================================================
    # OYUNCU BUL
    # =====================================================

    def player_index(self, nickname):

        for index, player in enumerate(self.players):

            if player["nickname"] == nickname:
                return index

        return None

    # =====================================================
    # BAHİS
    # =====================================================

    def add_chip(self, nickname, value):

        index = self.player_index(nickname)

        if index is None:
            return False

        if self.phase != "betting":
            return False

        if self.match_over:
            return False

        if value not in self.CHIP_VALUES:
            return False

        player = self.players[index]

        # Oyuncu elindeki gerçek bakiyeden
        # daha fazla para masaya koyamaz.
        if player["balance"] < value:
            return False

        # =================================================
        # ÖNEMLİ:
        #
        # MAX_BET YOK.
        #
        # Oyuncu isterse 5000$ bakiyesinin tamamını
        # tek ele basabilir.
        # =================================================

        player["balance"] -= value

        player["current_bet"] += value

        player["bet_chips"].append(value)

        return True

    # =====================================================
    # BAHİS ÇİPİ GERİ AL
    # =====================================================

    def remove_bet_chip(self, nickname, chip_index):

        index = self.player_index(nickname)

        if index is None:
            return False

        if self.phase != "betting":
            return False

        if self.match_over:
            return False

        player = self.players[index]

        if (
            chip_index < 0
            or chip_index >= len(player["bet_chips"])
        ):
            return False

        value = player["bet_chips"].pop(chip_index)

        player["balance"] += value

        player["current_bet"] -= value

        return True

    # =====================================================
    # DEAL İSTEĞİ
    # =====================================================

    def request_deal(self, nickname):

        index = self.player_index(nickname)

        if index is None:
            return False

        if self.phase != "betting":
            return False

        if self.match_over:
            return False

        player = self.players[index]

        if player["current_bet"] <= 0:
            return False

        if player["deal_requested"]:
            return True

        player["deal_requested"] = True

        self.deal_requests.add(index)

        if (
            len(self.players) == 2
            and len(self.deal_requests) == 2
        ):
            return self.start_round()

        return True

    # =====================================================
    # EL BAŞLAT
    # =====================================================

    def start_round(self):

        if self.phase != "betting":
            return False

        if self.match_over:
            return False

        if len(self.players) != 2:
            return False

        for player in self.players:

            if player["current_bet"] <= 0:
                return False

            if not player["deal_requested"]:
                return False

        self.deck = self.create_deck()

        for player in self.players:

            player["hand"] = []

            player["game_over"] = False

            player["result"] = ""

            player["result_type"] = ""

            player["stand"] = False

        # =================================================
        # P1 → P2 → P1 → P2
        # =================================================

        for _ in range(2):

            for player in self.players:

                card = self.draw_card()

                if card:
                    player["hand"].append(card)

        self.started = True

        self.phase = "playing"

        self.current_player = 0

        self.finished_at = None

        self.skip_finished_players()

        return True

    # =====================================================
    # BİTMİŞ OYUNCULARI ATLAMA
    # =====================================================

    def skip_finished_players(self):

        while self.current_player < len(self.players):

            player = self.players[
                self.current_player
            ]

            if player["game_over"]:

                self.current_player += 1

                continue

            # =================================================
            # DOĞAL BLACKJACK
            # =================================================

            if self.is_blackjack(player["hand"]):

                player["game_over"] = True

                player["stand"] = True

                self.current_player += 1

                continue

            break

        if self.current_player >= len(self.players):

            self.resolve_results()

    # =====================================================
    # SIRA
    # =====================================================

    def is_player_turn(self, nickname):

        index = self.player_index(nickname)

        if index is None:
            return False

        return (
            self.phase == "playing"
            and not self.match_over
            and index == self.current_player
            and not self.players[index]["game_over"]
        )

    # =====================================================
    # HIT
    # =====================================================

    def player_hit(self, nickname):

        index = self.player_index(nickname)

        if index is None:
            return False

        if not self.is_player_turn(nickname):
            return False

        player = self.players[index]

        card = self.draw_card()

        if card is None:
            return False

        player["hand"].append(card)

        if self.hand_value(player["hand"]) > 21:

            player["game_over"] = True

            self.next_player()

        return True

    # =====================================================
    # STAND
    # =====================================================

    def player_stand(self, nickname):

        index = self.player_index(nickname)

        if index is None:
            return False

        if not self.is_player_turn(nickname):
            return False

        player = self.players[index]

        player["stand"] = True

        player["game_over"] = True

        self.next_player()

        return True

    # =====================================================
    # DOUBLE
    # =====================================================

    def double_bet(self, nickname):

        index = self.player_index(nickname)

        if index is None:
            return False

        if not self.is_player_turn(nickname):
            return False

        player = self.players[index]

        if len(player["hand"]) != 2:
            return False

        # İkinci bahis için gereken para
        if player["balance"] < player["current_bet"]:
            return False

        # =================================================
        # ARTIK MAXIMUM BET YOK
        # =================================================

        player["balance"] -= player["current_bet"]

        player["current_bet"] *= 2

        player["bet_chips"].append(
            player["current_bet"] // 2
        )

        card = self.draw_card()

        if card is None:
            return False

        player["hand"].append(card)

        player["game_over"] = True

        player["stand"] = True

        self.next_player()

        return True

    # =====================================================
    # SONRAKİ OYUNCU
    # =====================================================

    def next_player(self):

        self.current_player += 1

        if self.current_player >= len(self.players):

            self.resolve_results()

            return

        self.skip_finished_players()

    # =====================================================
    # EL SONUCU
    # =====================================================

    def resolve_results(self):

        if self.phase != "playing":
            return

        if len(self.players) != 2:
            return

        p1 = self.players[0]
        p2 = self.players[1]

        v1 = self.hand_value(p1["hand"])
        v2 = self.hand_value(p2["hand"])

        bj1 = self.is_blackjack(p1["hand"])
        bj2 = self.is_blackjack(p2["hand"])

        # =================================================
        # İKİSİ DE BATTI
        # =================================================

        if v1 > 21 and v2 > 21:

            self.finish_draw()

            return

        # =================================================
        # P1 BATTI
        # =================================================

        if v1 > 21:

            self.finish_player_win(
                winner_index=1,
                loser_index=0
            )

            return

        # =================================================
        # P2 BATTI
        # =================================================

        if v2 > 21:

            self.finish_player_win(
                winner_index=0,
                loser_index=1
            )

            return

        # =================================================
        # İKİSİ DE BLACKJACK
        # =================================================

        if bj1 and bj2:

            self.finish_draw()

            return

        # =================================================
        # P1 BLACKJACK
        # =================================================

        if bj1:

            self.finish_player_win(
                winner_index=0,
                loser_index=1,
                blackjack=True
            )

            return

        # =================================================
        # P2 BLACKJACK
        # =================================================

        if bj2:

            self.finish_player_win(
                winner_index=1,
                loser_index=0,
                blackjack=True
            )

            return

        # =================================================
        # NORMAL
        # =================================================

        if v1 > v2:

            self.finish_player_win(
                winner_index=0,
                loser_index=1
            )

        elif v2 > v1:

            self.finish_player_win(
                winner_index=1,
                loser_index=0
            )

        else:

            self.finish_draw()

    # =====================================================
    # OYUNCU KAZANDI
    # =====================================================

    def finish_player_win(
        self,
        winner_index,
        loser_index,
        blackjack=False
    ):

        winner = self.players[winner_index]
        loser = self.players[loser_index]

        winner_bet = winner["current_bet"]

        # =================================================
        # ÖNCE ELİ ÖDE
        #
        # KRİTİK NOKTA:
        #
        # Oyuncu bütün parasını bahse koymuşsa balance = 0
        # olabilir.
        #
        # BU HENÜZ KAYBETTİĞİ ANLAMINA GELMEZ.
        #
        # Önce sonuç belirlenir ve kazananın parası ödenir.
        # =================================================

        if blackjack:

            winner["balance"] += (
                winner_bet * 2.5
            )

        else:

            winner["balance"] += (
                winner_bet * 2
            )

        winner["balance"] = round(
            winner["balance"],
            2
        )

        loser["balance"] = round(
            loser["balance"],
            2
        )

        # =================================================
        # BAHİSLERİ TEMİZLE
        # =================================================

        winner["current_bet"] = 0
        winner["bet_chips"].clear()

        loser["current_bet"] = 0
        loser["bet_chips"].clear()

        winner["game_over"] = True
        loser["game_over"] = True

        # =================================================
        # MAÇ SONU KONTROLÜ
        #
        # ÖDEME YAPILDIKTAN SONRA!
        # =================================================

        match_finished = False

        # Kazanan hedefe ulaştı
        if winner["balance"] >= self.WINNING_BALANCE:

            winner["balance"] = round(
                winner["balance"],
                2
            )

            self.match_over = True

            self.match_winner = winner_index

            match_finished = True

        # Kaybedenin gerçek bakiyesi 0 oldu
        elif loser["balance"] <= 0:

            loser["balance"] = 0

            self.match_over = True

            self.match_winner = winner_index

            match_finished = True

        # =================================================
        # SONUÇ YAZILARI
        # =================================================

        if match_finished:

            # Kazanan ekranı
            winner["result"] = (
                "TEBRİKLER! OYUNU SİZ KAZANDINIZ!"
                f"|{winner['nickname']} "
                "maçı kazandı."
            )

            winner["result_type"] = "win"

            # Kaybeden ekranı
            loser["result"] = (
                f"KAYBETTİNİZ! "
                f"{winner['nickname']} KAZANDI!"
            )

            loser["result_type"] = "loss"

        else:

            # Normal round
            if blackjack:

                winner["result"] = (
                    "BLACKJACK!"
                )

                winner["result_type"] = (
                    "blackjack"
                )

            else:

                winner["result"] = (
                    "KAZANDIN!"
                )

                winner["result_type"] = (
                    "win"
                )

            loser["result"] = (
                "KAYBETTİN!"
            )

            loser["result_type"] = (
                "loss"
            )

        self.finish_phase()

    # =====================================================
    # BERABERE
    # =====================================================

    def finish_draw(self):

        p1 = self.players[0]
        p2 = self.players[1]

        # =================================================
        # Bahisleri geri ver
        # =================================================

        p1["balance"] += p1["current_bet"]

        p2["balance"] += p2["current_bet"]

        p1["balance"] = round(
            p1["balance"],
            2
        )

        p2["balance"] = round(
            p2["balance"],
            2
        )

        p1["current_bet"] = 0
        p2["current_bet"] = 0

        p1["bet_chips"].clear()
        p2["bet_chips"].clear()

        p1["game_over"] = True
        p2["game_over"] = True

        # =================================================
        # BERABERLİK
        # =================================================

        p1["result"] = (
            "BERABERE!"
        )

        p2["result"] = (
            "BERABERE!"
        )

        p1["result_type"] = "draw"
        p2["result_type"] = "draw"

        self.finish_phase()

    # =====================================================
    # ELİ BİTİR
    # =====================================================

    def finish_phase(self):

        self.phase = "finished"

        self.started = False

        self.current_player = -1

        self.finished_at = time.time()

    # =====================================================
    # ELİ TEMİZLE
    # =====================================================

    def clear_finished_hand(self):

        if self.phase != "finished":
            return False

        # Maç bittiyse yeni el yok.
        if self.match_over:
            return False

        for player in self.players:

            player["hand"] = []

            player["game_over"] = False

            player["result"] = ""

            player["result_type"] = ""

            player["stand"] = False

            player["deal_requested"] = False

        self.deck = []

        self.deal_requests.clear()

        self.phase = "betting"

        self.started = False

        self.current_player = 0

        self.finished_at = None

        return True

    # =====================================================
    # RESTART
    #
    # ARTIK KULLANILMIYOR.
    # Bakiye hiçbir şekilde sıfırlanmaz.
    # =====================================================

    def restart_player(self, nickname):

        return False

    # =====================================================
    # STATE
    # =====================================================

    def get_state(self, nickname):

        index = self.player_index(nickname)

        if index is None:

            return {
                "success": False,
                "message": "Oyuncu bulunamadı."
            }

        # =================================================
        # NORMAL EL BİTTİYSE 5 SANİYE SONRA
        # YENİ BAHİS TURUNA GEÇ
        #
        # MAÇ BİTTİYSE ASLA TEMİZLEME.
        # =================================================

        if (
            self.phase == "finished"
            and not self.match_over
            and self.finished_at is not None
            and time.time() - self.finished_at >= 5
        ):

            self.clear_finished_hand()

        player = self.players[index]

        players_state = []

        for other_index, other in enumerate(self.players):

            players_state.append({

                "nickname":
                    other["nickname"],

                "balance":
                    round(
                        other["balance"],
                        2
                    ),

                "current_bet":
                    round(
                        other["current_bet"],
                        2
                    ),

                "bet_chips":
                    list(
                        other["bet_chips"]
                    ),

                "hand":
                    list(
                        other["hand"]
                    ),

                "player_value":
                    self.hand_value(
                        other["hand"]
                    ),

                "game_over":
                    other["game_over"],

                "result":
                    other["result"],

                "result_type":
                    other["result_type"],

                "stand":
                    other["stand"],

                "deal_requested":
                    other["deal_requested"],

                "is_current_player":
                    (
                        self.phase == "playing"
                        and not self.match_over
                        and self.current_player
                        == other_index
                        and not other["game_over"]
                    )
            })

        return {

            "success": True,

            "nickname":
                player["nickname"],

            "players":
                players_state,

            "my_player_index":
                index,

            "balance":
                round(
                    player["balance"],
                    2
                ),

            "current_bet":
                round(
                    player["current_bet"],
                    2
                ),

            "bet_chips":
                list(
                    player["bet_chips"]
                ),

            "player_hand":
                list(
                    player["hand"]
                ),

            "player_value":
                self.hand_value(
                    player["hand"]
                ),

            "game_started":
                self.started,

            "game_over":
                self.phase == "finished",

            "phase":
                self.phase,

            "current_player":
                self.current_player,

            "my_turn":
                (
                    self.phase == "playing"
                    and not self.match_over
                    and self.current_player == index
                    and not player["game_over"]
                ),

            "result":
                player["result"],

            "result_type":
                player["result_type"],

            "deal_requested":
                player["deal_requested"],

            "deal_count":
                len(self.deal_requests),

            # =================================================
            # MAÇ BİLGİLERİ
            # =================================================

            "match_over":
                self.match_over,

            "match_winner":
                (
                    self.players[
                        self.match_winner
                    ]["nickname"]
                    if self.match_winner is not None
                    else None
                ),

            "winning_balance":
                self.WINNING_BALANCE,

            "starting_balance":
                self.STARTING_BALANCE,

            # Eski JS uyumluluğu için bırakıldı.
            # Artık maksimum bahis sınırı yok.
            "maximum_bet":
                player["balance"] +
                player["current_bet"]
        }