
/* =========================================================
   BLACKJOKER
   PYGAME WEB PORT
   ========================================================= */

const game = {

    state: null,

    resultTimer: null,

    musicEnabled: true,

    sounds: {

        chip: new Audio(
            "/static/assets/sounds/chip.wav"
        ),

        card: new Audio(
            "/static/assets/sounds/card.wav"
        ),

        win: new Audio(
            "/static/assets/sounds/win.wav"
        ),

        lose: new Audio(
            "/static/assets/sounds/lose.wav"
        ),

        music: new Audio(
            "/static/assets/sounds/music.mp3"
        )
    }
};


/* =========================================================
   SES
   ========================================================= */

game.sounds.music.loop = true;
game.sounds.music.volume = 0.35;


function playSound(name) {

    const sound = game.sounds[name];

    if (!sound) {
        return;
    }

    try {

        sound.currentTime = 0;

        sound.play().catch(() => {});

    } catch (error) {

        console.log(error);
    }
}


/* =========================================================
   MÜZİK
   ========================================================= */

async function startMusic() {

    if (!game.musicEnabled) {
        return;
    }

    try {

        await game.sounds.music.play();

    } catch (error) {

        // Tarayıcı autoplay engeli.
    }
}


async function toggleMusic() {

    if (game.musicEnabled) {

        game.musicEnabled = false;

        game.sounds.music.pause();

    } else {

        game.musicEnabled = true;

        await startMusic();
    }

    renderInfo();
}


/* =========================================================
   API
   ========================================================= */

async function api(
    url,
    method = "POST",
    body = null
) {

    try {

        const options = {

            method: method,

            headers: {
                "Content-Type": "application/json"
            }
        };

        if (body !== null) {

            options.body =
                JSON.stringify(body);
        }

        const response =
            await fetch(url, options);

        if (!response.ok) {

            throw new Error(
                "API error"
            );
        }

        return await response.json();

    } catch (error) {

        console.error(error);

        return null;
    }
}


/* =========================================================
   STATE
   ========================================================= */

async function loadState() {

    const data =
        await api(
            "/api/state",
            "GET"
        );

    if (!data) {
        return;
    }

    game.state = data;

    render();
}


/* =========================================================
   ANA RENDER
   ========================================================= */

function render() {

    if (!game.state) {
        return;
    }

    renderInfo();
    renderDealer();
    renderPlayer();
    renderBetChips();
    renderButtons();
    renderResult();
    renderRestart();
}


/* =========================================================
   BİLGİLER
   ========================================================= */

function renderInfo() {

    document
        .getElementById("balance")
        .textContent =
        `BAKİYE: $${game.state.balance}`;


    document
        .getElementById("zero-counter")
        .textContent =
        `X ${game.state.zero_balance_count}`;


    document
        .getElementById("bet")
        .textContent =
        `BAHİS: $${game.state.current_bet}`;


    const musicElement =
        document.getElementById(
            "music-status"
        );


    musicElement.textContent =
        game.musicEnabled
            ? "MÜZİK: AÇIK"
            : "MÜZİK: KAPALI";


    musicElement.style.color =
        game.musicEnabled
            ? "rgb(230, 190, 70)"
            : "rgb(180, 180, 180)";
}


/* =========================================================
   KART PATH
   ========================================================= */

function getCardPath(card) {

    return (
        `/static/assets/cards/` +
        `${card.suit}/${card.rank}.png`
    );
}


/* =========================================================
   KART DEĞERİ
   PUAN BACKEND'DEN GELMESE BİLE
   JS TARAFINDA HESAPLANIR.
   ========================================================= */

function getCardValue(card) {

    if (!card || !card.rank) {
        return 0;
    }

    const rank =
        String(card.rank).toUpperCase();


    if (
        rank === "J" ||
        rank === "Q" ||
        rank === "K" ||
        rank === "10"
    ) {

        return 10;
    }


    if (rank === "A") {

        return 11;
    }


    const value =
        parseInt(rank, 10);


    return Number.isNaN(value)
        ? 0
        : value;
}


function calculateHandValue(cards) {

    let total = 0;
    let aces = 0;


    cards.forEach(card => {

        const value =
            getCardValue(card);

        total += value;


        if (
            String(card.rank).toUpperCase() ===
            "A"
        ) {

            aces++;
        }
    });


    /*
     * As 11 olarak başladı.
     *
     * 21'i geçiyorsa As'ları
     * 1'e çevir.
     */

    while (
        total > 21 &&
        aces > 0
    ) {

        total -= 10;

        aces--;
    }


    return total;
}


/* =========================================================
   KURPİYER
   ========================================================= */

function renderDealer() {

    const container =
        document.getElementById(
            "dealer-cards"
        );

    container.innerHTML = "";

    const cards =
        game.state.dealer_hand || [];


    cards.forEach(
        (card, index) => {

            const img =
                document.createElement(
                    "img"
                );

            img.className = "card";


            /*
             * Oyun devam ederken ikinci
             * dealer kartı kapalı.
             */

            if (
                index === 1 &&
                game.state.game_started &&
                !game.state.game_over &&
                !game.state.dealer_revealed
            ) {

                img.src =
                    "/static/assets/cards/back/back.png";

            } else {

                img.src =
                    getCardPath(card);
            }


            img.style.left =
                `${index * 70}px`;

            img.style.top =
                "0px";


            container.appendChild(img);
        }
    );


    const score =
        document.getElementById(
            "dealer-score"
        );


    if (!game.state.game_started) {

        score.textContent = "";

        return;
    }


    /*
     * Oyun devam ederken yalnızca
     * ilk açık kartın puanı gösterilir.
     */

    if (
        game.state.game_started &&
        !game.state.game_over &&
        cards.length >= 2
    ) {

        const visibleValue =
            game.state.dealer_visible_value ??
            calculateHandValue([cards[0]]);


        score.textContent =
            visibleValue;

    } else {

        const dealerValue =
            game.state.dealer_value ??
            calculateHandValue(cards);


        score.textContent =
            cards.length > 0
                ? dealerValue
                : "";
    }
}


/* =========================================================
   OYUNCU
   ========================================================= */

function renderPlayer() {

    const container =
        document.getElementById(
            "player-cards"
        );

    container.innerHTML = "";

    const cards =
        game.state.player_hand || [];


    const scoreElement =
        document.getElementById(
            "player-score"
        );


    if (cards.length === 0) {

        scoreElement.textContent = "";

        return;
    }


    const cardWidth = 100;
    const overlap = 70;


    const totalWidth =
        cardWidth +
        (cards.length - 1) * overlap;


    const startX =
        (700 - totalWidth) / 2;


    cards.forEach(
        (card, index) => {

            const img =
                document.createElement(
                    "img"
                );

            img.className = "card";

            img.src =
                getCardPath(card);


            img.style.left =
                `${startX + index * overlap}px`;

            img.style.top =
                "0px";


            container.appendChild(img);
        }
    );


    /*
     * Önce backend'den gelen puanı kullan.
     * Yoksa JS kendisi hesaplasın.
     */

    const playerValue =
        game.state.player_value ??
        calculateHandValue(cards);


    scoreElement.textContent =
        playerValue;
}


/* =========================================================
   BAHİS ÇİPLERİ
   ========================================================= */

function renderBetChips() {

    const container =
        document.getElementById(
            "bet-chips"
        );

    container.innerHTML = "";

    const chips =
        game.state.bet_chips || [];


    chips.forEach(
        (value, index) => {

            const img =
                document.createElement(
                    "img"
                );

            img.className =
                "bet-chip";

            img.src =
                `/static/assets/chips/${value}.png`;


            const row =
                Math.floor(index / 6);

            const column =
                index % 6;


            img.style.left =
                `${350 + column * 35}px`;

            img.style.top =
                `${500 - row * 18}px`;


            img.addEventListener(
                "click",
                async () => {

                    if (
                        game.state.game_started ||
                        game.state.dealer_playing
                    ) {
                        return;
                    }


                    const result =
                        await api(
                            "/api/bet/remove",
                            "POST",
                            {
                                index: index
                            }
                        );


                    if (result) {

                        playSound("chip");

                        game.state =
                            result;

                        render();
                    }
                }
            );


            container.appendChild(img);
        }
    );
}


/* =========================================================
   BUTONLAR
   ========================================================= */

function renderButtons() {

    const active =
        game.state.game_started &&
        !game.state.game_over &&
        !game.state.dealer_playing;


    const beforeGame =
        !game.state.game_started &&
        !game.state.dealer_playing &&
        game.state.current_bet > 0;


    document
        .getElementById("deal-btn")
        .disabled =
        !beforeGame;


    document
        .getElementById("double-btn")
        .disabled =
        !active ||
        game.state.balance <
            game.state.current_bet;


    document
        .getElementById("stand-btn")
        .disabled =
        !active;


    document
        .getElementById("hit-btn")
        .disabled =
        !active;
}


/* =========================================================
   SONUÇ
   ========================================================= */

function renderResult() {

    const element =
        document.getElementById(
            "result"
        );


    if (!game.state.result) {

        element.style.display =
            "none";

        return;
    }


    element.textContent =
        game.state.result;


    if (
        game.state.result ===
            "KAZANDIN!" ||
        game.state.result ===
            "BLACKJACK!"
    ) {

        element.style.color =
            "rgb(30, 240, 100)";

    } else if (
        game.state.result ===
            "KAYBETTİN!"
    ) {

        element.style.color =
            "rgb(245, 45, 45)";

    } else {

        element.style.color =
            "white";
    }


    element.style.display =
        "block";
}


/* =========================================================
   RESTART
   ========================================================= */

function renderRestart() {

    const button =
        document.getElementById(
            "restart-btn"
        );


    if (
        game.state.balance <= 0 &&
        !game.state.game_started
    ) {

        button.style.display =
            "block";

    } else {

        button.style.display =
            "none";
    }
}


/* =========================================================
   SONUÇ SONRASI 1.8 SANİYE
   ========================================================= */

function scheduleResultClear() {

    clearTimeout(
        game.resultTimer
    );


    game.resultTimer =
        setTimeout(
            async () => {

                if (
                    !game.state ||
                    !game.state.game_over
                ) {
                    return;
                }


                const result =
                    await api(
                        "/api/clear"
                    );


                if (result) {

                    game.state =
                        result;

                    render();
                }

            },
            1800
        );
}


/* =========================================================
   SONUÇ SESİ
   ========================================================= */

function checkResultSound() {

    if (
        !game.state ||
        !game.state.result
    ) {
        return;
    }


    if (
        game.state.result ===
            "KAZANDIN!" ||
        game.state.result ===
            "BLACKJACK!"
    ) {

        playSound("win");

    } else if (
        game.state.result ===
            "KAYBETTİN!"
    ) {

        playSound("lose");
    }
}


/* =========================================================
   KURPİYER ANİMASYONU
   ========================================================= */

async function dealerAnimation() {

    while (
        game.state &&
        game.state.dealer_playing &&
        !game.state.game_over
    ) {

        /*
         * PYGAME:
         * Her yeni dealer kartından önce 500ms.
         */

        await new Promise(
            resolve =>
                setTimeout(
                    resolve,
                    500
                )
        );


        if (
            !game.state ||
            !game.state.dealer_playing ||
            game.state.game_over
        ) {
            break;
        }


        const previousCardCount =
            (
                game.state.dealer_hand ||
                []
            ).length;


        const result =
            await api(
                "/api/dealer-step"
            );


        if (!result) {
            break;
        }


        game.state =
            result;


        render();


        const newCardCount =
            (
                game.state.dealer_hand ||
                []
            ).length;


        if (
            newCardCount >
            previousCardCount
        ) {

            playSound("card");
        }
    }


    if (
        game.state &&
        game.state.result
    ) {

        checkResultSound();

        scheduleResultClear();
    }
}


/* =========================================================
   CHIPLER
   ========================================================= */

document
    .querySelectorAll(".chip-button")
    .forEach(
        button => {

            button.addEventListener(
                "click",
                async () => {

                    if (
                        !game.state ||
                        game.state.game_started ||
                        game.state.dealer_playing
                    ) {
                        return;
                    }


                    const value =
                        Number(
                            button.dataset.value
                        );


                    if (
                        game.state.balance <
                        value
                    ) {
                        return;
                    }


                    const result =
                        await api(
                            "/api/bet",
                            "POST",
                            {
                                value: value
                            }
                        );


                    if (result) {

                        playSound("chip");

                        game.state =
                            result;

                        render();
                    }
                }
            );
        }
    );


/* =========================================================
   DEAL
   ========================================================= */

document
    .getElementById("deal-btn")
    .addEventListener(
        "click",
        async () => {

            if (!game.state) {
                return;
            }


            if (
                game.state.current_bet <= 0 ||
                game.state.game_started ||
                game.state.dealer_playing
            ) {
                return;
            }


            const result =
                await api(
                    "/api/deal"
                );


            if (result) {

                playSound("card");
                playSound("card");


                game.state =
                    result;

                render();


                if (
                    game.state.result
                ) {

                    checkResultSound();

                    scheduleResultClear();
                }
            }
        }
    );


/* =========================================================
   HIT
   ========================================================= */

document
    .getElementById("hit-btn")
    .addEventListener(
        "click",
        async () => {

            if (
                !game.state ||
                !game.state.game_started ||
                game.state.game_over ||
                game.state.dealer_playing
            ) {
                return;
            }


            const result =
                await api(
                    "/api/hit"
                );


            if (result) {

                playSound("card");

                game.state =
                    result;

                render();


                if (
                    game.state.result
                ) {

                    checkResultSound();

                    scheduleResultClear();
                }
            }
        }
    );


/* =========================================================
   STAND
   ========================================================= */

document
    .getElementById("stand-btn")
    .addEventListener(
        "click",
        async () => {

            if (
                !game.state ||
                !game.state.game_started ||
                game.state.game_over ||
                game.state.dealer_playing
            ) {
                return;
            }


            const result =
                await api(
                    "/api/stand"
                );


            if (!result) {
                return;
            }


            game.state =
                result;


            /*
             * STAND'a basıldığı anda
             * kapalı kart açılır.
             */

            render();


            if (
                game.state.dealer_playing
            ) {

                await dealerAnimation();

            } else if (
                game.state.result
            ) {

                checkResultSound();

                scheduleResultClear();
            }
        }
    );


/* =========================================================
   DOUBLE
   ========================================================= */

document
    .getElementById("double-btn")
    .addEventListener(
        "click",
        async () => {

            if (
                !game.state ||
                !game.state.game_started ||
                game.state.game_over ||
                game.state.dealer_playing
            ) {
                return;
            }


            if (
                game.state.balance <
                game.state.current_bet
            ) {
                return;
            }


            const result =
                await api(
                    "/api/double"
                );


            if (result) {

                playSound("chip");
                playSound("card");


                game.state =
                    result;


                render();


                if (
                    game.state.dealer_playing
                ) {

                    await dealerAnimation();

                } else if (
                    game.state.result
                ) {

                    checkResultSound();

                    scheduleResultClear();
                }
            }
        }
    );


/* =========================================================
   RESTART
   ========================================================= */

document
    .getElementById("restart-btn")
    .addEventListener(
        "click",
        async () => {

            const result =
                await api(
                    "/api/restart"
                );


            if (result) {

                clearTimeout(
                    game.resultTimer
                );

                game.state =
                    result;

                render();
            }
        }
    );


/* =========================================================
   İLK TIKLAMADA MÜZİK
   ========================================================= */

document.addEventListener(
    "click",
    () => {

        if (
            game.musicEnabled &&
            game.sounds.music.paused
        ) {

            startMusic();
        }

    },
    {
        once: true
    }
);


/* =========================================================
   M TUŞU
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "m" ||
            event.key === "M"
        ) {

            toggleMusic();
        }
    }
);


/* =========================================================
   F11
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (event.key !== "F11") {
            return;
        }

        event.preventDefault();


        if (!document.fullscreenElement) {

            document.documentElement
                .requestFullscreen()
                .catch(() => {});

        } else {

            document
                .exitFullscreen()
                .catch(() => {});
        }
    }
);


/* =========================================================
   ESC
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Escape" &&
            document.fullscreenElement
        ) {

            document
                .exitFullscreen()
                .catch(() => {});
        }
    }
);


/* =========================================================
   BAŞLAT
   ========================================================= */

loadState();

