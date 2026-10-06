const categories = [
  { code: "000", name: "총류", hint: "백과사전 · 컴퓨터" },
  { code: "100", name: "철학", hint: "심리학 · 윤리" },
  { code: "200", name: "종교", hint: "기독교 · 불교" },
  { code: "300", name: "사회과학", hint: "법 · 경제 · 교육" },
  { code: "400", name: "자연과학", hint: "수학 · 생명과학" },
  { code: "500", name: "기술과학", hint: "의학 · 공학" },
  { code: "600", name: "예술", hint: "음악 · 미술" },
  { code: "700", name: "언어", hint: "국어 · 외국어" },
  { code: "800", name: "문학", hint: "소설 · 시" },
  { code: "900", name: "역사", hint: "지리 · 여행" },
];

const questions = {
  card: [
    { type: "card", prompt: "주제 카드와 가장 알맞은 KDC를 짝지어 보세요.", topic: "조선 시대의 역사", answer: "900", options: ["200", "300", "800", "900"], explanation: "역사·지리·전기는 KDC 900에 모여 있어요." },
    { type: "card", prompt: "주제 카드와 가장 알맞은 KDC를 짝지어 보세요.", topic: "청소년의 마음과 심리", answer: "100", options: ["000", "100", "400", "700"], explanation: "철학·심리학·윤리는 KDC 100입니다." },
    { type: "card", prompt: "주제 카드와 가장 알맞은 KDC를 짝지어 보세요.", topic: "우리 몸을 건강하게 지키는 법", answer: "500", options: ["300", "400", "500", "600"], explanation: "의학·생활 기술은 기술과학 500에 속해요." },
    { type: "card", prompt: "주제 카드와 가장 알맞은 KDC를 짝지어 보세요.", topic: "세계 여러 나라의 말 배우기", answer: "700", options: ["100", "300", "700", "800"], explanation: "언어와 국어·외국어는 KDC 700입니다." },
    { type: "card", prompt: "주제 카드와 가장 알맞은 KDC를 짝지어 보세요.", topic: "별과 행성, 우주의 비밀", answer: "400", options: ["200", "400", "500", "900"], explanation: "수학·물리·천문·생명과학은 자연과학 400입니다." },
    { type: "card", prompt: "주제 카드와 가장 알맞은 KDC를 짝지어 보세요.", topic: "오케스트라와 미술 감상", answer: "600", options: ["300", "500", "600", "800"], explanation: "음악·미술·공연은 예술 600에 모여요." },
    { type: "card", prompt: "주제 카드와 가장 알맞은 KDC를 짝지어 보세요.", topic: "기후 변화와 지속 가능한 사회", answer: "300", options: ["000", "300", "400", "900"], explanation: "사회 문제·정치·경제·교육은 사회과학 300입니다." },
    { type: "card", prompt: "주제 카드와 가장 알맞은 KDC를 짝지어 보세요.", topic: "판타지 소설 속 모험", answer: "800", options: ["100", "600", "700", "800"], explanation: "소설·시·희곡 같은 문학은 KDC 800입니다." },
    { type: "card", prompt: "주제 카드와 가장 알맞은 KDC를 짝지어 보세요.", topic: "컴퓨터 코딩을 처음 시작하기", answer: "000", options: ["000", "400", "500", "700"], explanation: "총류에는 컴퓨터·정보 일반 도서가 포함돼요." },
    { type: "card", prompt: "주제 카드와 가장 알맞은 KDC를 짝지어 보세요.", topic: "세계 지도와 여행 안내", answer: "900", options: ["300", "400", "800", "900"], explanation: "지리·여행·역사는 900에 해당합니다." },
    { type: "card", prompt: "주제 카드와 가장 알맞은 KDC를 짝지어 보세요.", topic: "우리 동네의 민주주의", answer: "300", options: ["100", "300", "700", "900"], explanation: "정치·사회·법은 사회과학 300입니다." },
    { type: "card", prompt: "주제 카드와 가장 알맞은 KDC를 짝지어 보세요.", topic: "도자기 만들기와 공예", answer: "600", options: ["500", "600", "700", "900"], explanation: "미술·공예·예술 활동은 600입니다." },
  ],
  book: [
    { type: "book", title: "시간을 달리는 소녀", subtitle: "청소년 문학 큐레이션", answer: "800", options: ["100", "500", "800", "900"], explanation: "소설과 시처럼 문학 작품은 800에 분류합니다." },
    { type: "book", title: "하루 한 장, 세계 지도", subtitle: "지리로 만나는 여행", answer: "900", options: ["300", "400", "700", "900"], explanation: "세계 지리·여행은 900에 해당해요." },
    { type: "book", title: "나의 첫 코딩 노트", subtitle: "컴퓨터와 정보 활용", answer: "000", options: ["000", "300", "400", "500"], explanation: "컴퓨터와 정보 일반은 000에서 찾아볼 수 있어요." },
    { type: "book", title: "우리 몸 사용 설명서", subtitle: "건강·의학 상식", answer: "500", options: ["200", "400", "500", "600"], explanation: "의학과 건강에 관한 책은 500입니다." },
    { type: "book", title: "왜 우리는 함께 살아갈까?", subtitle: "사회와 시민 생활", answer: "300", options: ["100", "300", "800", "900"], explanation: "사회·정치·경제·법은 300에 모여 있어요." },
    { type: "book", title: "밤하늘 관찰 일지", subtitle: "별과 우주의 과학", answer: "400", options: ["000", "400", "600", "900"], explanation: "자연과학과 천문학은 400입니다." },
    { type: "book", title: "말의 지도", subtitle: "우리말과 세계의 언어", answer: "700", options: ["100", "300", "700", "800"], explanation: "국어·외국어·언어학은 700입니다." },
    { type: "book", title: "색으로 읽는 미술관", subtitle: "미술·예술 감상", answer: "600", options: ["400", "500", "600", "800"], explanation: "미술·음악·예술은 600에서 찾습니다." },
    { type: "book", title: "생각의 탄생", subtitle: "철학과 심리의 질문", answer: "100", options: ["100", "200", "400", "700"], explanation: "철학·심리학·윤리는 100입니다." },
    { type: "book", title: "세계 종교 이야기", subtitle: "다양한 믿음과 문화", answer: "200", options: ["100", "200", "300", "900"], explanation: "종교 일반과 각 종교는 200입니다." },
    { type: "book", title: "백과사전 속 별별 지식", subtitle: "지식을 연결하는 총류", answer: "000", options: ["000", "400", "700", "900"], explanation: "여러 분야를 아우르는 총류는 000입니다." },
    { type: "book", title: "도시를 만드는 기술", subtitle: "건축·공학·기술과학", answer: "500", options: ["300", "400", "500", "900"], explanation: "건축·공학·기술 분야는 500입니다." },
  ],
};

const state = {
  screen: "setup",
  mode: "individual",
  deck: "card",
  rounds: 8,
  players: [],
  currentQuestion: 0,
  currentAnswer: null,
  timer: 20,
  timerId: null,
  paused: false,
};
window.kdcQuestionBank = questions;
window.kdcQuizSettings = () => ({deck:state.deck,rounds:state.rounds});

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

function setScreen(screen) {
  state.screen = screen;
  $$(".screen").forEach((el) => el.classList.toggle("active", el.id === `${screen}Screen`));
  $$(".nav-item").forEach((el) => el.classList.toggle("active", el.dataset.screen === screen));
  if (screen === "play") renderQuestion();
  if (screen === "onecard") { if (window.kdcOnline) window.kdcOnline.render(); }
  if (screen === "results") renderResults();
}

async function openTeacherDashboard() {
  if (!window.kdcOnline?.enterTeacherMode) return showToast("Firebase 연결을 준비 중입니다. 잠시 후 다시 눌러 주세요.");
  try {
    const entered = await window.kdcOnline.enterTeacherMode();
    if (entered === false) return;
    $("#studentJoinModal").hidden = true;
    $("#roleToggle").textContent = "교사";
    $("#connectionText").textContent = "교사 화면 · Firebase";
  } catch (error) { showToast(error.message || "교사 화면을 열지 못했습니다."); }
}

function renderPlayers() {
  const list = $("#playerList");
  list.innerHTML = state.players.length ? state.players.map((player, index) => `<div class="player-chip"><span>${String(index + 1).padStart(2, "0")}</span><strong title="${escapeHtml(player.name)}">${escapeHtml(player.name)}</strong><button class="player-chip-remove" data-remove-player="${index}" type="button" aria-label="${escapeHtml(player.name)} 내보내기">×</button></div>`).join("") : '<p class="player-list-empty">아직 참가자가 없습니다. 아래에서 이름을 추가하거나 온라인 학생은 방 코드로 입장하세요.</p>';
  $("#playerCount").textContent = state.players.length;
  $("#readyCount").textContent = state.players.length;
  $("#readyTeamCount").textContent = state.mode === "team" ? `${Math.max(2, Math.min(6, Number($("#teamCount").value)))}팀` : "개인전";
  $("#readyRoundCount").textContent = state.rounds;
  $("#startButton").disabled = state.players.length < 2;
}

function renderScoreboard() {
  const sorted = [...state.players].sort((a, b) => b.score - a.score);
  $("#scoreboardRows").innerHTML = sorted.slice(0, 10).map((player, index) => `<div class="score-row"><span>${index + 1}</span><span class="score-name">${player.name}</span><strong class="score-value">${player.score}</strong></div>`).join("");
}

function currentDeckQuestions() { return questions[state.deck]; }

function renderQuestion() {
  const deckQuestions = currentDeckQuestions();
  const question = deckQuestions[state.currentQuestion % deckQuestions.length];
  $("#playModeLabel").textContent = state.mode === "team" ? "단체전" : "개인전";
  $("#questionTotal").textContent = String(state.rounds).padStart(2, "0");
  $("#questionNumber").textContent = String(state.currentQuestion + 1).padStart(2, "0");
  $("#questionTypeLabel").textContent = state.deck === "book" ? "책 표지 퀴즈" : "카드 매칭";
  $("#progressBar").style.width = `${((state.currentQuestion + 1) / state.rounds) * 100}%`;
  $("#questionHint").textContent = "가장 알맞은 분류를 골라 주세요.";
  $("#nextButton").disabled = true;
  $("#nextButton").classList.remove("enabled");
  state.currentAnswer = null;
  if (question.type === "book") {
    $("#questionContent").innerHTML = `<div class="book-preview"><div class="book-cover"><b>KDC ARENA</b><strong>${question.title.split(" ").slice(0, 2).join(" ")}</strong><span>BOOK QUIZ</span></div><div class="book-copy"><div class="question-prompt">이 책이 가장 가까운 주제는?</div><strong>${question.title}</strong><p>${question.subtitle}</p></div></div>`;
  } else {
    $("#questionContent").innerHTML = `<div><div class="question-prompt">${question.prompt}</div><div class="question-topic">${highlightTopic(question.topic)}</div></div>`;
  }
  $("#answerGrid").innerHTML = question.options.map((code) => {
    const category = categories.find((item) => item.code === code);
    return `<button class="answer-button" data-answer="${code}" type="button"><strong>${code}</strong></button>`;
  }).join("");
  $$(".answer-button").forEach((button) => button.addEventListener("click", () => answerQuestion(button.dataset.answer, question)));
  startTimer();
}

function highlightTopic(topic) {
  const parts = topic.split(" ");
  const pivot = Math.max(1, Math.floor(parts.length / 2));
  return `${parts.slice(0, pivot).join(" ")} <em>${parts.slice(pivot).join(" ")}</em>`;
}

function startTimer() {
  window.clearInterval(state.timerId);
  state.timer = 20;
  $("#timer").textContent = "00:20";
  state.timerId = window.setInterval(() => {
    if (state.paused || state.currentAnswer !== null) return;
    state.timer -= 1;
    $("#timer").textContent = `00:${String(Math.max(0, state.timer)).padStart(2, "0")}`;
    if (state.timer <= 0) {
      window.clearInterval(state.timerId);
      answerQuestion("timeout", currentDeckQuestions()[state.currentQuestion % currentDeckQuestions().length]);
    }
  }, 1000);
}

function answerQuestion(answer, question) {
  if (state.currentAnswer !== null) return;
  state.currentAnswer = answer;
  window.clearInterval(state.timerId);
  const isCorrect = answer === question.answer;
  $$(".answer-button").forEach((button) => {
    button.disabled = true;
    if (button.dataset.answer === question.answer) button.classList.add("correct");
    if (button.dataset.answer === answer && !isCorrect) button.classList.add("incorrect");
  });
  $("#questionHint").textContent = isCorrect ? `정답이에요! ${question.explanation}` : `정답은 ${question.answer}번이에요. ${question.explanation}`;
  $("#nextButton").disabled = false;
  $("#nextButton").classList.add("enabled");
  const player = state.players[0];
  if (isCorrect) player.score += 100 + Math.max(0, state.timer * 2);
  renderScoreboard();
  if (state.currentQuestion + 1 >= state.rounds) $("#nextButton").textContent = "결과 보기  →";
}

function nextQuestion() {
  if (state.currentAnswer === null) return;
  if (state.currentQuestion + 1 >= state.rounds) {
    window.clearInterval(state.timerId);
    setScreen("results");
    return;
  }
  state.currentQuestion += 1;
  renderQuestion();
}

function renderResults() {
  const sorted = [...state.players].sort((a, b) => b.score - a.score);
  const winner = sorted[0];
  $("#winnerName").textContent = winner?.name || "민서";
  $("#winnerScore").textContent = `${winner?.score || 0}점 · ${state.rounds}문제 중 ${Math.round((winner?.score || 0) / 120)}문제 정답`;
  $("#resultsRows").innerHTML = sorted.slice(0, 10).map((player, index) => `<div class="result-row"><span class="result-rank">${String(index + 1).padStart(2, "0")}</span><strong class="result-player">${player.name}</strong><span class="result-accuracy">${Math.min(100, Math.round((player.score / (state.rounds * 140)) * 100))}%</span><strong class="result-score">${player.score}</strong></div>`).join("");
}

function resetGame() {
  window.clearInterval(state.timerId);
  state.currentQuestion = 0;
  state.currentAnswer = null;
  state.timer = 20;
  state.paused = false;
  state.players.forEach((player) => { player.score = 0; });
  $("#pauseButton").textContent = "Ⅱ 일시정지";
  setScreen("setup");
  renderPlayers();
  renderScoreboard();
}

function toggleChoice(group, attribute, value) {
  $$(group).forEach((item) => item.classList.toggle("selected", item.dataset[attribute] === value));
}

function setupInteractions() {
  $$(".nav-item").forEach((button) => button.addEventListener("click", () => setScreen(button.dataset.screen)));
  $$(".choice-card").forEach((button) => button.addEventListener("click", () => {
    state.mode = button.dataset.mode;
    toggleChoice(".choice-card", "mode", state.mode);
    $("#teamCount").disabled = state.mode !== "team";
    renderPlayers();
  }));
  $$(".deck-card").forEach((button) => button.addEventListener("click", () => {
    state.deck = button.dataset.deck;
    toggleChoice(".deck-card", "deck", state.deck);
  }));
  $("#roundSlider").addEventListener("input", (event) => { state.rounds = Number(event.target.value); $("#roundValue").textContent = `${state.rounds}문제`; renderPlayers(); });
  $("#teamCount").addEventListener("change", renderPlayers);
  $("#startButton").addEventListener("click", () => {
    if (state.players.length < 2) return showToast("학생을 2명 이상 입장시켜 주세요.");
    state.currentQuestion = 0;
    state.players.forEach((player) => { player.score = 0; });
    renderScoreboard();
    setScreen("play");
  });
  $("#nextButton").addEventListener("click", nextQuestion);
  $("#pauseButton").addEventListener("click", () => {
    state.paused = !state.paused;
    $("#pauseButton").textContent = state.paused ? "▶ 계속하기" : "Ⅱ 일시정지";
    showToast(state.paused ? "경기를 잠시 멈췄어요." : "경기를 다시 시작합니다.");
  });
  $("#endButton").addEventListener("click", () => { window.clearInterval(state.timerId); setScreen("results"); showToast("경기를 종료하고 결과를 집계했어요."); });
  $("#restartButton").addEventListener("click", resetGame);
  $("#reflectionButton").addEventListener("click", () => showToast("왜 문학은 800일까? 옆 친구에게 30초 동안 설명해 보세요."));
  $("#autoFillButton").addEventListener("click", () => {
    while (state.players.length < 20) state.players.push({ name: `학생${String(state.players.length + 1).padStart(2, "0")}`, score: 0, team: (state.players.length % 5) + 1 });
    renderPlayers();
    showToast("20명 대기실을 준비했어요.");
  });
  $("#addPlayerButton").addEventListener("click", addPlayer);
  $("#playerNameInput").addEventListener("keydown", (event) => { if (event.key === "Enter") addPlayer(); });
  $("#playerList").addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-player]");
    if (!button) return;
    const [removed] = state.players.splice(Number(button.dataset.removePlayer), 1);
    if (!removed) return;
    renderPlayers();
    showToast(`${removed.name} 학생을 명단에서 내보냈어요.`);
  });
  $("#openTeacherRoomsButton").addEventListener("click", openTeacherDashboard);
  $("#helpButton").addEventListener("click", () => { $("#helpModal").hidden = false; });
  $("#closeHelp").addEventListener("click", closeHelp);
  $("#closeHelpButton").addEventListener("click", closeHelp);
  $("#helpModal").addEventListener("click", (event) => { if (event.target.id === "helpModal") closeHelp(); });
  $("#roleToggle").addEventListener("click", openTeacherDashboard);
  $("#studentEntryToggle").addEventListener("click", () => {
    $("#studentJoinModal").hidden = false;
    $("#studentRoomInput").focus();
  });
  $("#closeStudentJoin").addEventListener("click", () => { $("#studentJoinModal").hidden = true; });
  $("#studentJoinModal").addEventListener("click", (event) => { if (event.target.id === "studentJoinModal") $("#studentJoinModal").hidden = true; });
  $("#studentJoinButton").addEventListener("click", async () => {
    const room = $("#studentRoomInput").value.trim().normalize("NFC").toUpperCase();
    const name = $("#studentNameInput").value.trim();
    if (!room) return showToast("교사가 알려준 방 코드를 입력해 주세요.");
    if (!name) return showToast("이름을 입력해 주세요.");
    if (!window.kdcOnline?.joinRoom) return showToast("Firebase 연결을 준비 중입니다. 잠시 후 다시 눌러 주세요.");
    const button = $("#studentJoinButton");
    button.disabled = true;
    try {
      const joined = await window.kdcOnline.joinRoom({ code: room, name });
      if (joined === false) return;
      $("#studentJoinModal").hidden = true;
      $("#roleToggle").textContent = "학생";
      $("#connectionText").textContent = "Firebase 실시간 연결";
      showToast(`${name} 학생으로 ${room} 방에 입장 요청을 보냈어요.`);
    } catch (error) { showToast(error.message || "방에 입장하지 못했습니다."); }
    finally { button.disabled = false; }
  });
  $("#downloadButton").addEventListener("click", () => {
    const rows = [...document.querySelectorAll(".result-row")].map((row) => [...row.children].map((cell) => cell.textContent.trim()).join(","));
    const blob = new Blob(["순위,이름,정확도,점수\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "kdc-arena-result.csv"; link.click(); URL.revokeObjectURL(url); showToast("결과 파일을 저장했어요.");
  });
}

function addPlayer() {
  const input = $("#playerNameInput");
  const name = input.value.trim();
  if (!name) return showToast("학생 이름을 입력해 주세요.");
  if (state.players.length >= 20) return showToast("한 방에는 최대 20명까지 입장할 수 있어요.");
  state.players.push({ name, score: 0, team: (state.players.length % 5) + 1 });
  input.value = "";
  renderPlayers();
  showToast(`${name} 학생을 대기실에 추가했어요.`);
}

function closeHelp() { $("#helpModal").hidden = true; }

setupInteractions();
renderPlayers();
renderScoreboard();
// 원카드 온라인 화면은 online.js에서 초기화합니다.

/* KDC One Card */
const oneCardCategories = {
  "0": "총류", "1": "철학", "2": "종교", "3": "사회과학", "4": "자연과학",
  "5": "기술과학", "6": "예술", "7": "언어", "8": "문학", "9": "역사",
};

const oneCardState = {
  mode: "individual",
  maxPlayers: 5,
  teamSplit: "manual",
  roomCode: "ONE-7F3A",
  phase: "lobby",
  players: [],
  activePlayerIndex: 0,
  turnIndex: 0,
  direction: 1,
  drawPile: [],
  discardPile: [],
  pendingAttack: 0,
  wildCode: null,
  oneCardWindow: false,
  oneCardTimer: null,
  winner: null,
  logs: [{ time: "00:00", html: "방이 생성되었습니다. 학생들이 입장하면 경기를 시작하세요." }],
};

function ocShuffle(cards) {
  const copy = [...cards];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function ocBuildDeck() {
  const normalCodes = [
    ...[0, 10, 20, 30, 40, 50], ...[100, 110, 120, 130, 140, 150],
    ...[200, 210, 220, 230, 240], ...[300, 310, 320, 330, 340, 350],
    ...[400, 410, 420, 430, 440, 450], ...[500, 510, 520, 530, 540, 550],
    ...[600, 610, 620, 630, 640], ...[700, 710, 720, 730, 740],
    ...[800, 810, 820, 830, 840, 850], ...[900, 910, 920, 930, 940],
  ];
  const normal = normalCodes.map((code, index) => ({ id: `n-${index}`, type: "normal", code, label: oneCardCategories[String(Math.floor(code / 100))] }));
  const special = [
    ...Array.from({ length: 6 }, (_, i) => ({ id: `p2-${i}`, type: "plus", value: 2, code: "+2", label: "플러스 2" })),
    ...Array.from({ length: 4 }, (_, i) => ({ id: `p3-${i}`, type: "plus", value: 3, code: "+3", label: "플러스 3" })),
    ...Array.from({ length: 4 }, (_, i) => ({ id: `r-${i}`, type: "reverse", code: "↺", label: "유턴" })),
    ...Array.from({ length: 4 }, (_, i) => ({ id: `s-${i}`, type: "skip", code: "⊘", label: "스킵" })),
    ...Array.from({ length: 6 }, (_, i) => ({ id: `j-${i}`, type: "joker", code: "★", label: "조커" })),
  ];
  return ocShuffle([...normal, ...special]);
}

function ocNormalCode(card) { return card && card.type === "normal" ? String(card.code).padStart(3, "0") : card?.code || "—"; }
function ocTopCard() { return oneCardState.discardPile[oneCardState.discardPile.length - 1]; }
function ocCurrentPlayer() { return oneCardState.players[oneCardState.turnIndex]; }
function ocPlayerName(player) { return player?.name || "플레이어"; }

function ocAddLog(html) {
  const seconds = Math.max(0, Math.floor((Date.now() - (oneCardState.startedAt || Date.now())) / 1000));
  const time = `00:${String(seconds % 60).padStart(2, "0")}`;
  oneCardState.logs.unshift({ time, html });
  oneCardState.logs = oneCardState.logs.slice(0, 24);
}

function ocLogMarkup() {
  return oneCardState.logs.map((log) => `<div class="onecard-log-entry"><time>${log.time}</time><span>${log.html}</span></div>`).join("");
}

function ocTeamForIndex(index) { return oneCardState.teamSplit === "manual" ? (oneCardState.players[index]?.team || (index % 2 ? "B" : "A")) : (index % 2 ? "B" : "A"); }

function ocRenderLobbyPlayers() {
  $("#ocLobbyCount").textContent = oneCardState.players.length;
  $("#ocLobbyLimit").textContent = oneCardState.maxPlayers;
  $("#ocRoomCode").textContent = oneCardState.roomCode;
  $("#ocLobbyHint").textContent = oneCardState.mode === "team" ? "단체전은 4명 이상, A팀과 B팀으로 시작해요." : "개인전은 2명 이상이면 시작할 수 있어요.";
  $("#ocLobbyPlayers").innerHTML = oneCardState.players.map((player, index) => `<div class="onecard-lobby-player" data-team="${player.team}"><span>${String(index + 1).padStart(2, "0")}</span><strong>${player.name}</strong>${oneCardState.mode === "team" ? `<button class="team-toggle" data-oc-team-index="${index}" type="button" aria-label="${player.name} 팀 변경">${player.team}팀 <span>↔</span></button>` : "<small>개인</small>"}<button class="player-remove-button" data-oc-remove-index="${index}" type="button" aria-label="${player.name} 명단에서 삭제">삭제</button></div>`).join("");
  $$("[data-oc-team-index]").forEach((button) => button.addEventListener("click", () => {
    const index = Number(button.dataset.ocTeamIndex);
    const player = oneCardState.players[index];
    if (!player) return;
    player.team = player.team === "A" ? "B" : "A";
    ocAddLog(`<b>${player.name}</b>님이 ${player.team}팀으로 이동했습니다.`);
    ocRenderLobbyPlayers();
  }));
  $$('[data-oc-remove-index]').forEach((button) => button.addEventListener("click", () => {
    const index = Number(button.dataset.ocRemoveIndex);
    const [removed] = oneCardState.players.splice(index, 1);
    if (!removed) return;
    const lastIndex = Math.max(0, oneCardState.players.length - 1);
    oneCardState.activePlayerIndex = Math.min(oneCardState.activePlayerIndex > index ? oneCardState.activePlayerIndex - 1 : oneCardState.activePlayerIndex, lastIndex);
    oneCardState.turnIndex = Math.min(oneCardState.turnIndex > index ? oneCardState.turnIndex - 1 : oneCardState.turnIndex, lastIndex);
    ocAddLog(`<b>${removed.name}</b>님을 대기 명단에서 삭제했습니다.`);
    ocRenderLobbyPlayers();
  }));
  $("#ocMaxPlayers").value = String(oneCardState.maxPlayers);
  $("#ocJoinTeam").disabled = oneCardState.mode !== "team";
  const startButton = $("#ocStartButton");
  if (startButton) startButton.disabled = oneCardState.players.length < (oneCardState.mode === "team" ? 4 : 2);
}

function ocSetView(view) {
  $("#onecardLobbyView").hidden = view !== "lobby";
  $("#onecardMatchView").hidden = view !== "match";
  $("#onecardSpectatorView").hidden = view !== "spectator";
}

function renderOneCard() {
  if (oneCardState.phase === "lobby") { ocSetView("lobby"); renderOneCardLobby(); }
  else if (oneCardState.phase === "finished") { ocSetView("spectator"); renderOneCardSpectator(); }
  else { ocSetView("match"); renderOneCardMatch(); }
}

function renderOneCardLobby() {
  ocSetView("lobby");
  ocRenderLobbyPlayers();
}

function ocDealCards() {
  oneCardState.drawPile = ocBuildDeck();
  oneCardState.players.forEach((player) => { player.hand = []; });
  oneCardState.players.forEach((player) => { for (let i = 0; i < 6; i += 1) player.hand.push(oneCardState.drawPile.pop()); });
  let first = oneCardState.drawPile.pop();
  while (first && first.type !== "normal") { oneCardState.drawPile.unshift(first); first = oneCardState.drawPile.pop(); }
  oneCardState.discardPile = first ? [first] : [];
  oneCardState.pendingAttack = 0;
  oneCardState.wildCode = null;
  oneCardState.turnIndex = 0;
  oneCardState.activePlayerIndex = 0;
  oneCardState.direction = 1;
  oneCardState.oneCardWindow = false;
  oneCardState.startedAt = Date.now();
  oneCardState.winner = null;
  oneCardState.logs = [];
  ocAddLog(`게임이 시작되었습니다. ${oneCardState.players.length}명에게 카드 6장씩 배분했습니다.`);
  ocAddLog(`첫 바닥 카드는 <b>${ocNormalCode(first)}</b> · ${first?.label || "총류"}입니다.`);
}

function ocCardPlayable(card) {
  if (!card) return false;
  if (card.type === "joker") return true;
  if (oneCardState.pendingAttack > 0) return card.type === "plus" && card.value >= oneCardState.pendingAttack;
  if (card.type === "plus" || card.type === "reverse" || card.type === "skip") return true;
  const top = ocTopCard();
  if (!top) return true;
  const targetCode = top.type === "joker" && oneCardState.wildCode !== null ? oneCardState.wildCode : top.code;
  if (top.type !== "normal" && top.type !== "joker") return true;
  if (typeof targetCode !== "number") return true;
  return Math.floor(card.code / 100) === Math.floor(targetCode / 100) || Math.floor(card.code / 10) % 10 === Math.floor(targetCode / 10) % 10;
}

function ocDraw(count = 1) {
  const player = ocCurrentPlayer();
  let amount = 0;
  for (let i = 0; i < count; i += 1) {
    if (!oneCardState.drawPile.length) {
      const top = oneCardState.discardPile.pop();
      const recycle = oneCardState.discardPile.splice(0);
      if (top) oneCardState.discardPile.push(top);
      oneCardState.drawPile = ocShuffle(recycle);
    }
    const card = oneCardState.drawPile.pop();
    if (!card) break;
    player.hand.push(card); amount += 1;
  }
  return amount;
}

function ocAdvanceTurn(skip = false) {
  const total = oneCardState.players.length;
  let next = (oneCardState.turnIndex + oneCardState.direction + total) % total;
  if (skip) next = (next + oneCardState.direction + total) % total;
  oneCardState.turnIndex = next;
  oneCardState.activePlayerIndex = next;
}

function ocFinish(winner) {
  oneCardState.winner = winner;
  oneCardState.phase = "finished";
  oneCardState.oneCardWindow = false;
  window.clearTimeout(oneCardState.oneCardTimer);
  ocAddLog(`<b>${winner.name}</b>님이 카드를 모두 내려 <span class="log-special">승리</span>했습니다.`);
  showToast(`${winner.name}님이 KDC 원카드에서 승리했어요!`);
  ocSetView("spectator");
  renderOneCardSpectator();
}

function ocStartOneCard() {
  const min = oneCardState.mode === "team" ? 4 : 2;
  if (oneCardState.players.length < min) return showToast(`${oneCardState.mode === "team" ? "단체전은 4명" : "개인전은 2명"} 이상 입장해 주세요.`);
  if (oneCardState.mode === "team" && oneCardState.players.length > 10) return showToast("단체전은 최대 10명까지 참여할 수 있어요.");
  oneCardState.players = oneCardState.players.slice(0, oneCardState.maxPlayers);
  oneCardState.players.forEach((player, index) => { player.team = ocTeamForIndex(index); });
  ocDealCards();
  oneCardState.phase = "match";
  ocSetView("match");
  renderOneCardMatch();
}

function ocRenderMatchPlayers() {
  $("#ocMatchPlayers").innerHTML = oneCardState.players.map((player, index) => `<div class="oc-match-player ${index === oneCardState.turnIndex ? "active" : ""}"><span class="rank">${index + 1}</span><div><strong>${player.name}</strong><span class="team-label">${oneCardState.mode === "team" ? `${player.team}팀` : "개인전"}</span></div><span class="hand-count">${player.hand.length}</span></div>`).join("");
  $("#ocActivePlayer").innerHTML = oneCardState.players.map((player, index) => `<option value="${index}" ${index === oneCardState.activePlayerIndex ? "selected" : ""}>${player.name} 화면</option>`).join("");
}

function ocRenderDiscard() {
  const card = ocTopCard();
  const extra = card?.type === "joker" ? "joker" : card?.type !== "normal" ? "special" : "";
  $("#ocDiscardCard").className = `discard-card ${extra}`;
  $("#ocDiscardCard").innerHTML = `<span class="card-code">${ocNormalCode(card)}</span><span class="card-label">${card?.label || "바닥 카드"}</span>`;
  $("#ocDrawCount").textContent = oneCardState.drawPile.length;
  $("#ocDrawPileCount").textContent = oneCardState.drawPile.length;
  $("#ocCurrentTurnLabel").textContent = ocPlayerName(ocCurrentPlayer());
  $("#ocTurnName").textContent = ocPlayerName(ocCurrentPlayer());
  $("#ocTurnPill").textContent = `TURN ${String(oneCardState.turnIndex + 1).padStart(2, "0")}`;
  $("#ocDirectionLabel").textContent = oneCardState.direction === 1 ? "시계 방향" : "반시계 방향";
  $("#ocMatchMode").textContent = oneCardState.mode === "team" ? "단체전" : "개인전";
  const badge = $("#ocAttackBadge"); badge.hidden = oneCardState.pendingAttack === 0; badge.innerHTML = `공격 +<b>${oneCardState.pendingAttack}</b>`;
}

function ocRenderHand() {
  const player = oneCardState.players[oneCardState.activePlayerIndex];
  const canAct = oneCardState.turnIndex === oneCardState.activePlayerIndex && !oneCardState.oneCardWindow && oneCardState.phase === "match";
  $("#ocHand").innerHTML = player?.hand.map((card, index) => {
    const playable = ocCardPlayable(card);
    const kind = card.type === "plus" ? "plus" : card.type === "joker" ? "joker" : card.type === "normal" ? (playable ? "normal-match" : "") : "action";
    return `<button class="hand-card ${kind}" data-oc-card-index="${index}" type="button" ${!playable || !canAct ? "disabled" : ""}><span class="hand-code">${ocNormalCode(card)}</span><span class="hand-name">${card.label}</span></button>`;
  }).join("") || "<span class=\"muted-empty\">손패가 없습니다.</span>";
  $$("[data-oc-card-index]").forEach((button) => button.addEventListener("click", () => ocPlayCard(Number(button.dataset.ocCardIndex))));
  $("#ocOneCardButton").disabled = !(oneCardState.oneCardWindow && oneCardState.activePlayerIndex === oneCardState.turnIndex);
  $("#ocActionHint").textContent = oneCardState.oneCardWindow ? "지금 바로 원카드!를 눌러 주세요." : (canAct ? "밝게 표시된 카드를 선택해 제출하세요." : `${ocPlayerName(ocCurrentPlayer())}님의 차례를 관전 중입니다.`);
}

function renderOneCardMatch() {
  ocRenderMatchPlayers(); ocRenderDiscard(); ocRenderHand();
  $("#ocGameLog").innerHTML = ocLogMarkup();
}

function renderOneCardSpectator() {
  const top = ocTopCard();
  $("#ocSpectatorTurn").textContent = ocPlayerName(ocCurrentPlayer());
  $("#ocSpectatorDiscard").textContent = top?.type === "joker" && oneCardState.wildCode !== null ? `★ → ${String(oneCardState.wildCode).padStart(3, "0")}` : ocNormalCode(top);
  $("#ocSpectatorDraw").textContent = `${oneCardState.drawPile.length}장`;
  $("#ocSpectatorAttack").textContent = oneCardState.pendingAttack ? `+${oneCardState.pendingAttack}` : "없음";
  $("#ocSpectatorPlayerCount").textContent = `${oneCardState.players.length}명`;
  $("#ocSpectatorPlayers").innerHTML = oneCardState.players.map((player, index) => `<div class="spectator-player-row ${index === oneCardState.turnIndex ? "active" : ""}"><span class="spectator-rank">${String(index + 1).padStart(2, "0")}</span><div><strong>${player.name}</strong><small>${oneCardState.mode === "team" ? `${player.team}팀 · ${index === oneCardState.turnIndex ? "현재 차례" : "대기"}` : (index === oneCardState.turnIndex ? "현재 차례" : "플레이어")}</small></div><span class="spectator-hand-count">${player.hand.length}장</span><span class="spectator-card-dots">${Array.from({ length: Math.min(8, player.hand.length) }, () => "<i></i>").join("")}</span></div>`).join("");
  $("#ocSpectatorLog").innerHTML = ocLogMarkup();
}

function ocPlayCard(cardIndex) {
  if (oneCardState.activePlayerIndex !== oneCardState.turnIndex || oneCardState.oneCardWindow) return showToast("현재 차례의 플레이어 화면을 선택해 주세요.");
  const player = ocCurrentPlayer();
  const card = player.hand[cardIndex];
  if (!ocCardPlayable(card)) return showToast("지금 바닥 카드와 맞지 않는 카드예요.");
  player.hand.splice(cardIndex, 1);
  oneCardState.discardPile.push(card);
  if (card.type === "normal") ocAddLog(`<b>${player.name}</b>님이 <b>${ocNormalCode(card)}</b> 카드를 냈습니다.`);
  else ocAddLog(`<b>${player.name}</b>님이 <span class="log-special">${card.label}</span> 카드를 냈습니다.`);
  if (card.type === "plus") oneCardState.pendingAttack += card.value;
  if (card.type === "reverse") { oneCardState.direction *= -1; ocAddLog(`진행 방향이 <b>${oneCardState.direction === 1 ? "시계" : "반시계"}</b> 방향으로 바뀌었습니다.`); }
  if (card.type === "joker") {
    const requested = window.prompt("조커가 지정할 KDC 분류번호를 입력하세요. (예: 300, 800)", "300");
    const numeric = Number.parseInt(requested || "300", 10);
    oneCardState.wildCode = Number.isFinite(numeric) ? Math.max(0, Math.min(999, Math.floor(numeric / 10) * 10)) : 300;
    oneCardState.pendingAttack = 0;
    ocAddLog(`조커가 플러스 공격을 무효화하고 바닥 번호를 <b>${String(oneCardState.wildCode).padStart(3, "0")}</b>으로 지정했습니다.`);
  }
  if (player.hand.length === 0) return ocFinish(player);
  if (player.hand.length === 1) {
    oneCardState.oneCardWindow = true;
    ocAddLog(`<b>${player.name}</b>님 손패가 1장입니다. 지금 원카드!를 외쳐야 합니다.`);
    window.clearTimeout(oneCardState.oneCardTimer);
    oneCardState.oneCardTimer = window.setTimeout(() => {
      if (!oneCardState.oneCardWindow) return;
      oneCardState.oneCardWindow = false;
      ocDraw(1); ocAddLog(`<b>${player.name}</b>님이 원카드를 놓쳐 벌칙 카드 1장을 받았습니다.`); ocAdvanceTurn(card.type === "skip"); renderOneCardMatch();
    }, 2400);
    renderOneCardMatch(); return;
  }
  const skip = card.type === "skip";
  ocAdvanceTurn(skip);
  renderOneCardMatch();
}

function ocCallOneCard() {
  if (!oneCardState.oneCardWindow) return;
  const player = ocCurrentPlayer();
  oneCardState.oneCardWindow = false;
  window.clearTimeout(oneCardState.oneCardTimer);
  ocAddLog(`<b>${player.name}</b>님이 <span class="log-special">원카드!</span>를 외쳤습니다.`);
  ocAdvanceTurn(false);
  renderOneCardMatch();
  showToast("원카드 성공! 다음 플레이어의 차례입니다.");
}

function ocDrawButton() {
  if (oneCardState.activePlayerIndex !== oneCardState.turnIndex || oneCardState.oneCardWindow) return showToast("현재 차례의 플레이어 화면을 선택해 주세요.");
  const player = ocCurrentPlayer();
  const amount = oneCardState.pendingAttack || 1;
  const drawn = ocDraw(amount);
  ocAddLog(`<b>${player.name}</b>님이 드로우 덱에서 <b>${drawn}장</b>을 받았습니다.`);
  oneCardState.pendingAttack = 0;
  ocAdvanceTurn(false);
  renderOneCardMatch();
}

function setupOneCardInteractions() {
  $$(".onecard-mode-card").forEach((button) => button.addEventListener("click", () => {
    oneCardState.mode = button.dataset.onecardMode;
    oneCardState.maxPlayers = oneCardState.mode === "team" ? 10 : 5;
    toggleChoice(".onecard-mode-card", "onecardMode", oneCardState.mode);
    $("#ocJoinTeam").disabled = oneCardState.mode !== "team";
    ocRenderLobbyPlayers();
  }));
  $("#ocMaxPlayers").addEventListener("change", (event) => { oneCardState.maxPlayers = Number(event.target.value); ocRenderLobbyPlayers(); });
  $("#ocTeamSplit").addEventListener("change", (event) => { oneCardState.teamSplit = event.target.value; $("#ocJoinTeam").disabled = oneCardState.mode !== "team"; });
  $("#ocJoinButton").addEventListener("click", () => {
    const name = $("#ocJoinName").value.trim();
    if (!name) return showToast("플레이어 이름을 입력해 주세요.");
    if (oneCardState.players.length >= oneCardState.maxPlayers) return showToast("이 방은 설정된 인원으로 가득 찼어요.");
    const index = oneCardState.players.length;
    const team = oneCardState.mode === "team" ? $("#ocJoinTeam").value : "A";
    oneCardState.players.push({ id: `oc-${Date.now()}`, name, team, hand: [] });
    $("#ocJoinName").value = "";
    ocAddLog(`<b>${name}</b>님이 ${oneCardState.mode === "team" ? `${team}팀으로 ` : ""}방에 입장했습니다.`);
    ocRenderLobbyPlayers();
  });
  $("#ocCopyRoom").addEventListener("click", async () => { try { await navigator.clipboard.writeText(oneCardState.roomCode); showToast("원카드 방 코드를 복사했어요."); } catch { showToast(`방 코드: ${oneCardState.roomCode}`); } });
  $("#ocStartButton")?.addEventListener("click", ocStartOneCard);
  $("#ocTeacherButton").addEventListener("click", () => { if (oneCardState.phase === "lobby") { ocSetView("spectator"); renderOneCardSpectator(); } else { ocSetView("spectator"); renderOneCardSpectator(); } });
  $("#ocBackLobby").addEventListener("click", () => { oneCardState.phase = "lobby"; renderOneCardLobby(); });
  $("#ocOpenSpectator").addEventListener("click", () => { ocSetView("spectator"); renderOneCardSpectator(); });
  $("#ocBackMatch").addEventListener("click", () => { if (oneCardState.phase === "finished") return showToast("경기가 종료되었습니다. 새 방을 만들어 주세요."); if (oneCardState.phase === "lobby") return renderOneCardLobby(); ocSetView("match"); renderOneCardMatch(); });
  $("#ocStopMatch").addEventListener("click", () => { window.clearTimeout(oneCardState.oneCardTimer); oneCardState.phase = "lobby"; oneCardState.players.forEach((player) => { player.hand = []; }); ocAddLog("교사가 경기를 종료하고 대기실로 돌아왔습니다."); renderOneCardLobby(); });
  $("#ocActivePlayer").addEventListener("change", (event) => { oneCardState.activePlayerIndex = Number(event.target.value); renderOneCardMatch(); });
  $("#ocDrawButton").addEventListener("click", ocDrawButton);
  $("#ocOneCardButton").addEventListener("click", ocCallOneCard);
  $("#ocJoinName").addEventListener("keydown", (event) => { if (event.key === "Enter") $("#ocJoinButton").click(); });
}
