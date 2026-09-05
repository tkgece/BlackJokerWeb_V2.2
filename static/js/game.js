/* =========================================================
   BOJACK - MULTIPLAYER V2.2
   2 PLAYER - NO DEALER
   MATCH SYSTEM
   ========================================================= */

const lobby = {
    nickname: "",
    roomCode: "",
    inGame: false
};


/* =========================================================
   LOBBY ELEMENTLERİ
   ========================================================= */

const nicknameInput =
    document.getElementById("nickname-input");

const nicknameContinue =
    document.getElementById("nickname-continue");

const nicknameScreen =
    document.getElementById("nickname-screen");

const menuScreen =
    document.getElementById("menu-screen");

const roomScreen =
    document.getElementById("room-screen");

const joinScreen =
    document.getElementById("join-screen");

const welcomeText =
    document.getElementById("welcome-text");

const createRoomBtn =
    document.getElementById("create-room-btn");

const joinRoomBtn =
    document.getElementById("join-room-btn");

const roomCodeElement =
    document.getElementById("room-code");

const copyRoomCodeBtn =
    document.getElementById("copy-room-code-btn");

const roomPlayer1 =
    document.getElementById("room-player-1");

const roomPlayer2 =
    document.getElementById("room-player-2");

const roomStatus =
    document.getElementById("room-status");

const roomInfo =
    document.getElementById("room-info");

const startGameBtn =
    document.getElementById("start-game-btn");

const roomCodeInput =
    document.getElementById("room-code-input");

const joinConfirmBtn =
    document.getElementById("join-confirm-btn");

const joinBackBtn =
    document.getElementById("join-back-btn");

const lobbyElement =
    document.getElementById("lobby");

const gameElement =
    document.getElementById("game");


/* =========================================================
   ODA KODU KOPYALA
   ========================================================= */

if (copyRoomCodeBtn) {

    copyRoomCodeBtn.addEventListener(
        "click",
        async () => {

            if (!lobby.roomCode) return;

            try {

                await navigator.clipboard.writeText(
                    lobby.roomCode
                );

                copyRoomCodeBtn.textContent =
                    "KOPYALANDI!";

                setTimeout(
                    () => {

                        copyRoomCodeBtn.textContent =
                            "KOPYALA";

                    },
                    1500
                );

            } catch (error) {

                console.error(error);
            }
        }
    );
}


/* =========================================================
   NICKNAME
   ========================================================= */

nicknameContinue.addEventListener(
    "click",
    () => {

        const nickname =
            nicknameInput.value.trim();

        if (!nickname) {

            nicknameInput.focus();

            return;
        }

        lobby.nickname = nickname;

        nicknameScreen.style.display =
            "none";

        menuScreen.style.display =
            "block";

        welcomeText.textContent =
            `HOŞ GELDİN ${lobby.nickname}`;
    }
);


nicknameInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            nicknameContinue.click();
        }
    }
);


nicknameInput.addEventListener(
    "input",
    () => {

        nicknameInput.value =
            nicknameInput.value.slice(
                0,
                16
            );
    }
);


/* =========================================================
   ODA OLUŞTUR
   ========================================================= */

createRoomBtn.addEventListener(
    "click",
    async () => {

        if (!lobby.nickname) return;

        createRoomBtn.disabled = true;

        createRoomBtn.textContent =
            "ODA OLUŞTURULUYOR...";

        try {

            const response =
                await fetch(
                    "/api/room/create",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                nickname:
                                    lobby.nickname
                            })
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {

                alert(
                    data.message ||
                    "Oda oluşturulamadı."
                );

                return;
            }

            lobby.roomCode =
                data.room_code;

            menuScreen.style.display =
                "none";

            roomScreen.style.display =
                "block";

            roomCodeElement.textContent =
                lobby.roomCode;

            roomPlayer1.textContent =
                lobby.nickname;

            roomPlayer2.textContent =
                "🟡 OYUNCU BEKLENİYOR...";

            roomPlayer2.classList.add(
                "waiting"
            );

            roomStatus.textContent =
                "🟡 1/2 OYUNCU";

            roomInfo.textContent =
                "Oda sahibi sensin";

            startGameBtn.style.display =
                "none";

            startRoomPolling();

        } catch (error) {

            console.error(error);

            alert(
                "Sunucuya bağlanılamadı."
            );

        } finally {

            createRoomBtn.disabled =
                false;

            createRoomBtn.textContent =
                "ODA OLUŞTUR";
        }
    }
);


/* =========================================================
   ODAYA KATIL
   ========================================================= */

joinRoomBtn.addEventListener(
    "click",
    () => {

        menuScreen.style.display =
            "none";

        joinScreen.style.display =
            "block";

        roomCodeInput.value = "";

        roomCodeInput.focus();
    }
);


roomCodeInput.addEventListener(
    "input",
    () => {

        roomCodeInput.value =
            roomCodeInput.value
                .toUpperCase()
                .slice(0, 5);
    }
);


roomCodeInput.addEventListener(
    "keydown",
    event => {

        if (event.key === "Enter") {
            joinConfirmBtn.click();
        }
    }
);


joinConfirmBtn.addEventListener(
    "click",
    async () => {

        const code =
            roomCodeInput.value
                .trim()
                .toUpperCase();

        if (code.length !== 5) {

            roomCodeInput.focus();

            return;
        }

        if (!lobby.nickname) return;

        joinConfirmBtn.disabled = true;

        joinConfirmBtn.textContent =
            "KATILINIYOR...";

        try {

            const response =
                await fetch(
                    "/api/room/join",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                nickname:
                                    lobby.nickname,

                                room_code:
                                    code
                            })
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {

                alert(
                    data.message ||
                    "Odaya katılınamadı."
                );

                return;
            }

            lobby.roomCode =
                data.room_code;

            joinScreen.style.display =
                "none";

            roomScreen.style.display =
                "block";

            roomCodeElement.textContent =
                lobby.roomCode;

            updateRoomPlayers(
                data.players
            );

            roomInfo.textContent =
                "Odaya katıldın";

            startGameBtn.style.display =
                "none";

            startRoomPolling();

        } catch (error) {

            console.error(error);

            alert(
                "Sunucuya bağlanılamadı."
            );

        } finally {

            joinConfirmBtn.disabled =
                false;

            joinConfirmBtn.textContent =
                "KATIL";
        }
    }
);


/* =========================================================
   GERİ
   ========================================================= */

joinBackBtn.addEventListener(
    "click",
    () => {

        joinScreen.style.display =
            "none";

        menuScreen.style.display =
            "block";
    }
);


/* =========================================================
   ODA OYUNCULARI
   ========================================================= */

function updateRoomPlayers(players) {

    if (!players) return;

    if (players.length >= 1) {

        roomPlayer1.textContent =
            players[0];
    }

    if (players.length >= 2) {

        roomPlayer2.textContent =
            `🟢 ${players[1]}`;

        roomPlayer2.classList.remove(
            "waiting"
        );

        roomStatus.textContent =
            "🟢 2/2 OYUNCU";

        if (
            lobby.nickname === players[0]
        ) {

            startGameBtn.style.display =
                "block";

            roomInfo.textContent =
                "Oda hazır. Oyunu başlatabilirsin.";

        } else {

            startGameBtn.style.display =
                "none";

            roomInfo.textContent =
                "Oda sahibi oyunu başlatmayı bekliyor.";
        }

    } else {

        roomPlayer2.textContent =
            "🟡 OYUNCU BEKLENİYOR...";

        roomPlayer2.classList.add(
            "waiting"
        );

        roomStatus.textContent =
            "🟡 1/2 OYUNCU";

        startGameBtn.style.display =
            "none";
    }
}


/* =========================================================
   ODA POLLING
   ========================================================= */

let roomPolling = null;


function startRoomPolling() {

    if (roomPolling !== null) return;

    roomPolling =
        setInterval(
            async () => {

                if (
                    !lobby.roomCode ||
                    lobby.inGame
                ) {
                    return;
                }

                try {

                    const response =
                        await fetch(
                            `/api/room/${lobby.roomCode}`
                        );

                    const data =
                        await response.json();

                    if (
                        !response.ok ||
                        !data.success
                    ) {
                        return;
                    }

                    updateRoomPlayers(
                        data.players
                    );

                    if (
                        data.started &&
                        !lobby.inGame
                    ) {

                        enterGame();
                    }

                } catch (error) {

                    console.error(
                        "Oda kontrol hatası:",
                        error
                    );
                }

            },
            500
        );
}


/* =========================================================
   OYUNA BAŞLA
   ========================================================= */

startGameBtn.addEventListener(
    "click",
    async () => {

        if (!lobby.roomCode) return;

        startGameBtn.disabled = true;

        startGameBtn.textContent =
            "BAŞLATILIYOR...";

        try {

            const response =
                await fetch(
                    "/api/room/start",
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body:
                            JSON.stringify({
                                room_code:
                                    lobby.roomCode
                            })
                    }
                );

            const data =
                await response.json();

            if (
                !response.ok ||
                !data.success
            ) {

                alert(
                    data.message ||
                    "Oyun başlatılamadı."
                );

                startGameBtn.disabled =
                    false;

                startGameBtn.textContent =
                    "OYUNA BAŞLA";

                return;
            }

            enterGame();

        } catch (error) {

            console.error(error);

            alert(
                "Sunucuya bağlanılamadı."
            );

            startGameBtn.disabled =
                false;

            startGameBtn.textContent =
                "OYUNA BAŞLA";
        }
    }
);


/* =========================================================
   OYUNA GİR
   ========================================================= */

function enterGame() {

    if (lobby.inGame) return;

    lobby.inGame = true;

    if (roomPolling !== null) {

        clearInterval(
            roomPolling
        );

        roomPolling = null;
    }

    lobbyElement.style.display =
        "none";

    gameElement.style.display =
        "block";

    /*
       Müzik yalnızca oyuna girildiğinde başlar.
       LOBİDE MÜZİK YOK.
    */
    startMusic();

    loadState();
}


/* =========================================================
   GAME
   ========================================================= */

const game = {

    state: null,

    syncTimer: null,

    musicEnabled: true,

    previousHands: {},

    sounds: {

        chip:
            new Audio(
                "/static/assets/sounds/chip.wav"
            ),

        card:
            new Audio(
                "/static/assets/sounds/card.wav"
            ),

        win:
            new Audio(
                "/static/assets/sounds/win.wav"
            ),

        lose:
            new Audio(
                "/static/assets/sounds/lose.wav"
            ),

        applause:
            new Audio(
                "/static/assets/sounds/alkis.mp3"
            ),

        draw:
            new Audio(
                "/static/assets/sounds/draw.wav"
            ),

        music:
            new Audio(
                "/static/assets/sounds/music.mp3"
            )
    }
};


game.sounds.music.loop = true;
game.sounds.music.volume = 0.35;


/* =========================================================
   SES
   ========================================================= */

function playSound(name) {

    const sound =
        game.sounds[name];

    if (!sound) return;

    try {

        sound.currentTime = 0;

        sound.play().catch(
            () => {}
        );

    } catch (error) {

        console.log(error);
    }
}


/* =========================================================
   MÜZİK
   ========================================================= */

async function startMusic() {

    if (!game.musicEnabled) return;

    if (!lobby.inGame) return;

    try {

        await game.sounds.music.play();

    } catch (error) {

        console.log(
            "Müzik başlatılamadı:",
            error
        );
    }
}


async function toggleMusic() {

    if (!game.musicEnabled) {

        game.musicEnabled = true;

        await startMusic();

    } else {

        game.musicEnabled = false;

        game.sounds.music.pause();
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

            method,

            headers: {
                "Content-Type":
                    "application/json"
            }
        };

        let requestBody = {};

        if (body !== null) {

            requestBody = {
                ...body
            };
        }

        if (method !== "GET") {

            requestBody.room_code =
                lobby.roomCode;

            requestBody.nickname =
                lobby.nickname;

            options.body =
                JSON.stringify(
                    requestBody
                );
        }

        const requestUrl =
            method === "GET"

                ? `${url}?room_code=${encodeURIComponent(lobby.roomCode)}&nickname=${encodeURIComponent(lobby.nickname)}`

                : url;

        const response =
            await fetch(
                requestUrl,
                options
            );

        if (!response.ok) {

            let errorData = null;

            try {

                errorData =
                    await response.json();

            } catch {}

            console.error(
                "API ERROR:",
                response.status,
                errorData
            );

            return null;
        }

        return await response.json();

    } catch (error) {

        console.error(
            "API bağlantı hatası:",
            error
        );

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

    if (!data) return;

    game.state = data;

    saveHandLengths(data);

    render();

    startGameSync();
}


function saveHandLengths(state) {

    if (!state.players) return;

    game.previousHands = {};

    state.players.forEach(
        player => {

            game.previousHands[
                player.nickname
            ] =
                (player.hand || []).length;
        }
    );
}


/* =========================================================
   SENKRONİZASYON
   ========================================================= */

function startGameSync() {

    if (game.syncTimer !== null) {
        return;
    }

    game.syncTimer =
        setInterval(
            async () => {

                if (!lobby.inGame) {
                    return;
                }

                const data =
                    await api(
                        "/api/state",
                        "GET"
                    );

                if (!data) return;

                const oldState =
                    game.state;

                /* =================================================
                   KART SESİ
                   ================================================= */

                if (
                    oldState &&
                    data.players
                ) {

                    data.players.forEach(
                        player => {

                            const oldLength =
                                game.previousHands[
                                    player.nickname
                                ] || 0;

                            const newLength =
                                (
                                    player.hand || []
                                ).length;

                            if (
                                newLength >
                                oldLength
                            ) {

                                playSound("card");
                            }
                        }
                    );
                }

                game.state = data;

                saveHandLengths(data);

                render();

                /* =================================================
                   YENİ EL BAŞLADI
                   ================================================= */

                if (
                    oldState &&
                    oldState.phase !==
                    "playing" &&
                    data.phase ===
                    "playing"
                ) {

                    playSound("card");

                    setTimeout(
                        () => {
                            playSound("card");
                        },
                        140
                    );

                    startMusic();
                }

                /* =================================================
                   EL / MAÇ SONUCU
                   ================================================= */

                if (
                    data.phase ===
                    "finished"
                ) {

                    checkResultSound();
                }

            },
            300
        );
}


/* =========================================================
   RENDER
   ========================================================= */

function render() {

    if (!game.state) return;

    renderInfo();

    renderPlayers();

    renderBetChips();

    renderButtons();

    renderResult();

    renderRestart();
}


/* =========================================================
   BİLGİ
   ========================================================= */

function formatMoney(value) {

    const number =
        Number(value);

    if (
        Number.isInteger(number)
    ) {

        return number.toLocaleString(
            "en-US"
        );
    }

    return number.toLocaleString(
        "en-US",
        {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }
    );
}


function renderInfo() {

    const balance =
        document.getElementById(
            "balance"
        );

    const bet =
        document.getElementById(
            "bet"
        );

    if (balance) {

        balance.textContent =
            `BAKİYE: $${formatMoney(
                game.state.balance
            )}`;
    }

    if (bet) {

        bet.textContent =
            `BAHİS: $${formatMoney(
                game.state.current_bet
            )}`;
    }

    const musicElement =
        document.getElementById(
            "music-status"
        );

    if (musicElement) {

        musicElement.textContent =
            game.musicEnabled
                ? "MÜZİK: AÇIK"
                : "MÜZİK: KAPALI";

        musicElement.style.color =
            game.musicEnabled
                ? "rgb(230,190,70)"
                : "rgb(180,180,180)";
    }

    const mobileMusicButton =
    document.getElementById(
        "mobile-music-btn"
    );

if (mobileMusicButton) {

    mobileMusicButton.textContent =
        game.musicEnabled
            ? "🔊"
            : "🔇";

    mobileMusicButton.setAttribute(
        "aria-label",
        game.musicEnabled
            ? "Müziği kapat"
            : "Müziği aç"
    );
}
    /*
       Eski zero counter artık kullanılmıyor.
       Varsa hedef bilgisini gösteriyoruz.
    */

    const zeroCounter =
        document.getElementById(
            "zero-counter"
        );

    if (zeroCounter) {

        zeroCounter.textContent =
            `HEDEF: $${formatMoney(
                game.state.winning_balance
            )}`;
    }
}


/* =========================================================
   KART PATH
   ========================================================= */

function getCardPath(card) {

    return `/static/assets/cards/${card.suit}/${card.rank}.png`;
}


/* =========================================================
   OYUNCULAR
   ========================================================= */

function renderPlayers() {

    if (!game.state.players) return;

    const myIndex =
        game.state.my_player_index;

    const opponentIndex =
        myIndex === 0
            ? 1
            : 0;

    const me =
        game.state.players[myIndex];

    const opponent =
        game.state.players[
            opponentIndex
        ];

    if (!me || !opponent) return;


    const myTitle =
        document.getElementById(
            "my-title"
        );

    const opponentTitle =
        document.getElementById(
            "opponent-title"
        );

    if (myTitle) {

        myTitle.textContent =
            me.nickname;
    }

    if (opponentTitle) {

        opponentTitle.textContent =
            opponent.nickname;
    }


    const myScore =
        document.getElementById(
            "my-score"
        );

    const opponentScore =
        document.getElementById(
            "opponent-score"
        );

    if (myScore) {

        myScore.textContent =
            me.hand.length
                ? me.player_value
                : "";
    }

    if (opponentScore) {

        opponentScore.textContent =
            opponent.hand.length
                ? opponent.player_value
                : "";
    }


    renderHand(
        document.getElementById(
            "my-cards"
        ),
        me.hand
    );

    renderHand(
        document.getElementById(
            "opponent-cards"
        ),
        opponent.hand
    );


    const myTurn =
        document.getElementById(
            "my-turn"
        );

    const opponentTurn =
        document.getElementById(
            "opponent-turn"
        );

    if (myTurn) {

        myTurn.classList.toggle(
            "active",
            game.state.my_turn
        );
    }

    if (opponentTurn) {

        opponentTurn.classList.toggle(
            "active",
            opponent.is_current_player
        );
    }
}


/* =========================================================
   ELİ RENDER
   ========================================================= */

function renderHand(
    container,
    cards
) {

    if (!container) return;

    container.innerHTML = "";

    if (!cards || !cards.length) {
        return;
    }

    const cardWidth = 100;

    const overlap = 70;

    const totalWidth =
        cardWidth +
        (cards.length - 1) *
        overlap;

    const startX =
        (700 - totalWidth) / 2;

    cards.forEach(
        (card, index) => {

            const img =
                document.createElement(
                    "img"
                );

            img.className =
                "card";

            img.src =
                getCardPath(card);

            img.style.left =
                `${startX + index * overlap}px`;

            img.style.top =
                "0px";

            container.appendChild(
                img
            );
        }
    );
}


/* =========================================================
   BAHİS ÇİPLERİ
   ========================================================= */

function renderBetChips() {

    const container =
        document.getElementById(
            "bet-chips"
        );

    if (!container) return;

    container.innerHTML = "";

    if (
        game.state.phase !==
        "betting"
        ||
        game.state.match_over
    ) {
        return;
    }

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
                Math.floor(
                    index / 6
                );

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
                        game.state.phase !==
                        "betting"
                    ) {
                        return;
                    }

                    const result =
                        await api(
                            "/api/bet/remove",
                            "POST",
                            {
                                index
                            }
                        );

                    if (!result) return;

                    playSound("chip");

                    game.state =
                        result;

                    render();
                }
            );

            container.appendChild(
                img
            );
        }
    );
}


/* =========================================================
   BUTONLAR
   ========================================================= */

function renderButtons() {

    if (!game.state) return;

    const betting =
        game.state.phase ===
        "betting"
        &&
        !game.state.match_over;

    const myTurn =
        game.state.phase ===
            "playing"
        &&
        game.state.my_turn === true
        &&
        !game.state.match_over;

    const dealBtn =
        document.getElementById(
            "deal-btn"
        );

    const doubleBtn =
        document.getElementById(
            "double-btn"
        );

    const standBtn =
        document.getElementById(
            "stand-btn"
        );

    const hitBtn =
        document.getElementById(
            "hit-btn"
        );


    /* =================================================
       DEAL
       ================================================= */

    if (dealBtn) {

        dealBtn.disabled =
            !betting ||
            game.state.current_bet <= 0 ||
            game.state.deal_requested;

        if (
            betting &&
            game.state.deal_requested
        ) {

            dealBtn.textContent =
                "BEKLE";

        } else {

            dealBtn.textContent =
                "DEAL";
        }
    }


    /* =================================================
       HIT
       ================================================= */

    if (hitBtn) {

        hitBtn.disabled =
            !myTurn;
    }


    /* =================================================
       STAND
       ================================================= */

    if (standBtn) {

        standBtn.disabled =
            !myTurn;
    }


    /* =================================================
       DOUBLE
       ================================================= */

    if (doubleBtn) {

        doubleBtn.disabled =
            !myTurn ||
            (
                game.state.player_hand ||
                []
            ).length !== 2 ||
            game.state.balance <
            game.state.current_bet;
    }
}


/* =========================================================
   SONUÇ
   ========================================================= */

function renderResult() {

    const element =
        document.getElementById(
            "result"
        );

    if (!element) return;

    if (
        !game.state.result ||
        game.state.phase !==
            "finished"
    ) {

        element.style.display =
            "none";

        return;
    }

    const parts =
        game.state.result.split("|");

    const mainText =
        parts[0] || "";

    const subText =
        parts[1] || "";

    element.innerHTML = "";

    const main =
        document.createElement(
            "div"
        );

    main.textContent =
        mainText;

    const sub =
        document.createElement(
            "div"
        );

    sub.textContent =
        subText;

    sub.style.fontSize =
        "32px";

    sub.style.marginTop =
        "12px";

    sub.style.color =
        "white";

    element.appendChild(main);

    if (subText) {

        element.appendChild(sub);
    }


    /* =================================================
       MAÇ SONU
       ================================================= */

    if (
        game.state.match_over
    ) {

        if (
            game.state.match_winner ===
            game.state.nickname
        ) {

            element.style.color =
                "rgb(30,240,100)";

        } else {

            element.style.color =
                "rgb(245,45,45)";
        }

        /*
           Uzun final yazılarının ekrandan taşmaması
        */

        const textLength =
            (
                mainText +
                subText
            ).length;

        if (textLength > 55) {

            element.style.fontSize =
                "48px";

        } else if (textLength > 35) {

            element.style.fontSize =
                "65px";

        } else {

            element.style.fontSize =
                "110px";
        }

    } else if (
        mainText ===
        "KAZANDIN!"
        ||
        mainText ===
        "BLACKJACK!"
    ) {

        element.style.color =
            "rgb(30,240,100)";

        element.style.fontSize =
            "110px";

    } else if (
        mainText ===
        "KAYBETTİN!"
    ) {

        element.style.color =
            "rgb(245,45,45)";

        element.style.fontSize =
            "110px";

    } else {

        element.style.color =
            "white";

        element.style.fontSize =
            "110px";
    }

    element.style.display =
        "block";
}


/* =========================================================
   RESTART
   ARTIK TAMAMEN KAPALI
   ========================================================= */

function renderRestart() {

    const button =
        document.getElementById(
            "restart-btn"
        );

    if (!button) return;

    button.style.display =
        "none";

    button.disabled =
        true;
}


/* =========================================================
   SONUÇ SESİ
   ========================================================= */

let lastResultPlayed = "";


function checkResultSound() {

    if (
        !game.state ||
        !game.state.result
    ) {
        return;
    }

    const resultKey =
        `${game.state.phase}:` +
        `${game.state.result}:` +
        `${game.state.match_over}:` +
        `${game.state.match_winner}`;

    if (
        lastResultPlayed ===
        resultKey
    ) {
        return;
    }

    lastResultPlayed =
        resultKey;

    const resultType =
        game.state.result_type;

    /* =====================================================
       MAÇ TAMAMEN BİTTİ
       ===================================================== */

    if (
        game.state.match_over
    ) {

        /*
           KAZANAN:
           win.wav + alkis.mp3

           KAYBEDEN:
           lose.wav + alkis.mp3

           ALKIŞ İKİ OYUNCUDA DA ÇALAR.
        */

        if (
            game.state.match_winner ===
            game.state.nickname
        ) {

            playSound("win");

        } else {

            playSound("lose");
        }

        /*
           Biraz gecikmeli alkış.
           Böylece win/lose sesiyle üst üste binmez.
        */

        setTimeout(
            () => {
                playSound("applause");
            },
            350
        );

        return;
    }


    /* =====================================================
       NORMAL EL - BERABERE
       ===================================================== */

    if (
        resultType ===
        "draw"
    ) {

        playSound("draw");

        return;
    }


    /* =====================================================
       NORMAL EL - KAZANMA
       ===================================================== */

    if (
        resultType ===
            "win"
        ||
        resultType ===
            "blackjack"
    ) {

        playSound("win");

        return;
    }


    /* =====================================================
       NORMAL EL - KAYBETME
       ===================================================== */

    if (
        resultType ===
        "loss"
    ) {

        playSound("lose");

        return;
    }


    /*
       Eski backend ile geçici uyumluluk.
    */

    const mainText =
        game.state.result
            .split("|")[0];

    if (
        mainText ===
            "KAZANDIN!"
        ||
        mainText ===
            "BLACKJACK!"
    ) {

        playSound("win");

    } else if (
        mainText ===
        "KAYBETTİN!"
    ) {

        playSound("lose");

    } else if (
        mainText ===
        "BERABERE!"
    ) {

        playSound("draw");
    }
}


/* =========================================================
   CHIPLER
   ========================================================= */

document
    .querySelectorAll(
        ".chip-button"
    )
    .forEach(
        button => {

            button.addEventListener(
                "click",
                async () => {

                    if (!game.state) {
                        return;
                    }

                    if (
                        game.state.phase !==
                        "betting"
                    ) {
                        return;
                    }

                    if (
                        game.state.match_over
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
                                value
                            }
                        );

                    if (!result) {
                        return;
                    }

                    playSound("chip");

                    game.state =
                        result;

                    render();
                }
            );
        }
    );


/* =========================================================
   DEAL
   ========================================================= */

document
    .getElementById(
        "deal-btn"
    )
    .addEventListener(
        "click",
        async () => {

            if (!game.state) return;

            if (
                game.state.phase !==
                "betting"
                ||
                game.state.current_bet <=
                0
                ||
                game.state.deal_requested
                ||
                game.state.match_over
            ) {
                return;
            }

            const result =
                await api(
                    "/api/deal"
                );

            if (!result) return;

            game.state =
                result;

            render();

            if (
                game.state.phase ===
                "playing"
            ) {

                playSound("card");

                setTimeout(
                    () => {
                        playSound("card");
                    },
                    120
                );
            }
        }
    );


/* =========================================================
   HIT
   ========================================================= */

document
    .getElementById(
        "hit-btn"
    )
    .addEventListener(
        "click",
        async () => {

            if (!game.state) return;

            if (
                game.state.phase !==
                "playing"
                ||
                !game.state.my_turn
                ||
                game.state.match_over
            ) {
                return;
            }

            const result =
                await api(
                    "/api/hit"
                );

            if (!result) return;

            playSound("card");

            game.state =
                result;

            render();
        }
    );


/* =========================================================
   STAND
   ========================================================= */

document
    .getElementById(
        "stand-btn"
    )
    .addEventListener(
        "click",
        async () => {

            if (!game.state) return;

            if (
                game.state.phase !==
                "playing"
                ||
                !game.state.my_turn
                ||
                game.state.match_over
            ) {
                return;
            }

            const result =
                await api(
                    "/api/stand"
                );

            if (!result) return;

            game.state =
                result;

            render();
        }
    );


/* =========================================================
   DOUBLE
   ========================================================= */

document
    .getElementById(
        "double-btn"
    )
    .addEventListener(
        "click",
        async () => {

            if (!game.state) return;

            if (
                game.state.phase !==
                "playing"
                ||
                !game.state.my_turn
                ||
                game.state.match_over
            ) {
                return;
            }

            if (
                (
                    game.state.player_hand ||
                    []
                ).length !== 2
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

            if (!result) return;

            playSound("chip");

            playSound("card");

            game.state =
                result;

            render();
        }
    );


/* =========================================================
   M
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "m" ||
            event.key === "M"
        ) {

            if (!lobby.inGame) return;

            toggleMusic();
        }
    }
);

/* =========================================================
   MOBİL MÜZİK BUTONU
   ========================================================= */

const mobileMusicBtn =
    document.getElementById(
        "mobile-music-btn"
    );

if (mobileMusicBtn) {

    mobileMusicBtn.addEventListener(
        "click",
        () => {

            if (!lobby.inGame) {
                return;
            }

            toggleMusic();
        }
    );
}

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

        if (
            !document.fullscreenElement
        ) {

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