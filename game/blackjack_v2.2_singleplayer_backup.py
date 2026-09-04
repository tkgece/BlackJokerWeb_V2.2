import random


class BlackjackGame:

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

    def __init__(self, balance=200):

        self.starting_balance = balance

        self.balance = balance
        self.current_bet = 0

        self.player_hand = []
        self.dealer_hand = []
        self.deck = []

        self.game_started = False
        self.game_over = False

        self.result = ""

        self.bet_chips = []

        self.zero_balance_count = 0

        # Web için kurpiyer animasyonu
        self.dealer_playing = False

    # =========================================================
    # DESTE
    # =========================================================

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

    # =========================================================
    # KART ÇEK
    # =========================================================

    def draw_card(self):

        if not self.deck:
            return None

        return self.deck.pop()

    # =========================================================
    # KART DEĞERİ
    # =========================================================

    def card_value(self, card):

        rank = card["rank"]

        if rank in ["J", "Q", "K"]:
            return 10

        if rank == "A":
            return 11

        return int(rank)

    # =========================================================
    # EL DEĞERİ
    # =========================================================

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

    # =========================================================
    # BLACKJACK
    # =========================================================

    def is_blackjack(self, hand):

        return (
            len(hand) == 2
            and
            self.hand_value(hand) == 21
        )

    # =========================================================
    # BAHİS EKLE
    # =========================================================

    def add_chip(self, value):

        if self.game_started:
            return False

        if value not in self.CHIP_VALUES:
            return False

        if self.balance < value:
            return False

        self.balance -= value
        self.current_bet += value

        self.bet_chips.append(value)

        return True

    # =========================================================
    # BAHİS ÇİPİNİ GERİ AL
    # =========================================================

    def remove_bet_chip(self, index):

        if self.game_started:
            return False

        if index < 0:
            return False

        if index >= len(self.bet_chips):
            return False

        value = self.bet_chips.pop(index)

        self.balance += value
        self.current_bet -= value

        if self.current_bet < 0:
            self.current_bet = 0

        return True

    # =========================================================
    # OYUNU BAŞLAT
    # =========================================================

    def start_game(self):

        if self.current_bet <= 0:
            return False

        if self.game_started:
            return False

        self.deck = self.create_deck()

        self.player_hand = [
            self.draw_card(),
            self.draw_card()
        ]

        self.dealer_hand = [
            self.draw_card(),
            self.draw_card()
        ]

        self.game_started = True
        self.game_over = False
        self.result = ""
        self.dealer_playing = False

        # Oyuncu blackjack
        if self.is_blackjack(self.player_hand):

            if self.is_blackjack(self.dealer_hand):

                self.finish_game("BERABERE!")

            else:

                self.finish_game("BLACKJACK!")

        return True

    # =========================================================
    # DEAL
    # =========================================================

    def new_deal(self):

        if self.game_started:
            return False

        if self.current_bet <= 0:
            return False

        self.player_hand = []
        self.dealer_hand = []
        self.result = ""

        return self.start_game()

    # =========================================================
    # HIT
    # =========================================================

    def player_hit(self):

        if not self.game_started:
            return False

        if self.game_over:
            return False

        if self.dealer_playing:
            return False

        if not self.deck:
            self.deck = self.create_deck()

        card = self.draw_card()

        if card is None:
            return False

        self.player_hand.append(card)

        if self.hand_value(self.player_hand) > 21:

            self.finish_game("KAYBETTİN!")

        return True

    # =========================================================
    # STAND
    # =========================================================

    def player_stand(self):

        if not self.game_started:
            return False

        if self.game_over:
            return False

        if self.dealer_playing:
            return False

        # Kurpiyer animasyonunu başlat
        self.dealer_playing = True

        return True

    # =========================================================
    # DOUBLE
    # =========================================================

    def double_bet(self):

        if not self.game_started:
            return False

        if self.game_over:
            return False

        if self.dealer_playing:
            return False

        if self.balance < self.current_bet:
            return False

        self.balance -= self.current_bet
        self.current_bet *= 2

        if not self.deck:
            self.deck = self.create_deck()

        card = self.draw_card()

        if card is None:
            return False

        self.player_hand.append(card)

        if self.hand_value(self.player_hand) > 21:

            self.finish_game("KAYBETTİN!")

            return True

        # Double sonrası da kurpiyer sırayla oynar
        self.dealer_playing = True

        return True

    # =========================================================
    # KURPİYER ANİMASYON ADIMI
    # =========================================================

    def dealer_step(self):

        if not self.game_started:
            return False

        if self.game_over:
            return False

        if not self.dealer_playing:
            return False

        # Kurpiyer 17 veya üzerindeyse artık kart çekmez.
        if self.hand_value(self.dealer_hand) >= 17:

            self.dealer_playing = False
            self.determine_winner()

            return True

        if not self.deck:
            self.deck = self.create_deck()

        card = self.draw_card()

        if card is None:

            self.dealer_playing = False
            self.determine_winner()

            return True

        self.dealer_hand.append(card)

        # Kart çekildikten sonra hâlâ 17 altındaysa
        # bir sonraki 500ms adımında devam eder.
        if self.hand_value(self.dealer_hand) >= 17:

            self.dealer_playing = False
            self.determine_winner()

        return True

    # =========================================================
    # NORMAL KURPİYER OYUNU
    # =========================================================

    def dealer_play(self):

        self.dealer_playing = True

        while self.dealer_playing:

            self.dealer_step()

    # =========================================================
    # KAZANAN
    # =========================================================

    def determine_winner(self):

        player_value = self.hand_value(
            self.player_hand
        )

        dealer_value = self.hand_value(
            self.dealer_hand
        )

        if player_value > 21:

            self.finish_game("KAYBETTİN!")

        elif dealer_value > 21:

            self.finish_game("KAZANDIN!")

        elif player_value > dealer_value:

            self.finish_game("KAZANDIN!")

        elif player_value < dealer_value:

            self.finish_game("KAYBETTİN!")

        else:

            self.finish_game("BERABERE!")

    # =========================================================
    # OYUNU BİTİR
    # =========================================================

    def finish_game(self, result):

        if self.game_over:
            return

        self.dealer_playing = False

        self.game_over = True
        self.result = result

        # =====================================================
        # ÖDEME SİSTEMİ
        # =====================================================

        if result == "BLACKJACK!":

            # Blackjack = 3:2
            #
            # Örnek:
            # 25$ bahis
            # 25 / 2 * 3 = 37.50$ kâr
            #
            # Bahis zaten bakiyeden düşürüldüğü için
            # toplam geri dönüş:
            # 25$ + 37.50$ = 62.50$
            #
            self.balance += self.current_bet * 2.5

        elif result == "KAZANDIN!":

            # Normal kazanma = 1:1
            #
            # Örnek:
            # 25$ bahis -> 25$ kâr
            # toplam geri dönüş = 50$
            #
            self.balance += self.current_bet * 2

        elif result == "BERABERE!":

            # Bahis geri verilir
            self.balance += self.current_bet

        elif result == "KAYBETTİN!":

            if self.balance <= 0:

                self.balance = 0
                self.zero_balance_count += 1

        self.current_bet = 0
        self.bet_chips.clear()

    # =========================================================
    # BİTMİŞ ELİ TEMİZLE
    # =========================================================

    def clear_finished_hand(self):

        self.player_hand = []
        self.dealer_hand = []

        self.deck = []

        self.game_started = False
        self.game_over = False

        self.result = ""
        self.dealer_playing = False

    # =========================================================
    # RESTART
    # =========================================================

    def restart_game(self):

        self.balance = self.starting_balance

        self.current_bet = 0

        self.player_hand = []
        self.dealer_hand = []

        self.deck = []

        self.game_started = False
        self.game_over = False

        self.result = ""

        self.bet_chips.clear()

        self.dealer_playing = False

        # Sayaç main.py'deki gibi korunur.

        return True

    # =========================================================
    # STATE
    # =========================================================

    def get_state(self):

        player_value = self.hand_value(
            self.player_hand
        )

        dealer_value = self.hand_value(
            self.dealer_hand
        )

        dealer_visible_value = 0

        if self.dealer_hand:

            dealer_visible_value = self.hand_value(
                [self.dealer_hand[0]]
            )

        return {

            "balance": self.balance,

            "current_bet": self.current_bet,

            "player_hand": self.player_hand,

            "dealer_hand": self.dealer_hand,

            "player_value": player_value,

            "dealer_value": dealer_value,

            "dealer_visible_value":
                dealer_visible_value,

            "game_started":
                self.game_started,

            "game_over":
                self.game_over,

            "dealer_playing":
                self.dealer_playing,

            "result":
                self.result,

            "bet_chips":
                self.bet_chips,

            "zero_balance_count":
                self.zero_balance_count
        }

