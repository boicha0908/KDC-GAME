import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';
import {getAuth,signInAnonymously} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js';
import {getDatabase,ref,get,set,update,onValue,push,runTransaction,onDisconnect} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js';
import {firebaseConfig} from './firebase-config.js';
import {newRoom,normalize,buildDeck,apply,start,startQuiz,nextQuiz,tick,publicState,playable,codeOf,NAMES,log} from './onecard-engine.mjs';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getDatabase(app);
let uid='',room='',role='',pub=null,hand=[],engine=null,connected=false,offset=0,working=false,claimed=false,hostReady=false;
let mode='individual',unsub=[],pending={},timer,busy=false;
const tabId=crypto.randomUUID();
const now=()=>Date.now()+offset;
const path=s=>ref(db,`rooms/${room}/${s}`);
const connection=$('#connectionText');
const toast=text=>window.showToast?window.showToast(text):alert(text);
const banner=document.createElement('article');banner.className='panel online-entry';
banner.innerHTML=`<div><span class="panel-kicker">ONLINE ROOM</span><h2>교사 방 생성 / 학생 입장</h2><p id="onlineStatus" role="status">Firebase 연결 준비 중…</p></div><div class="online-controls"><label>게임<select id="onlineKind"><option value="onecard">KDC 원카드</option><option value="quiz">KDC 실시간 퀴즈 (최대 20명)</option></select></label><button id="onlineCreate" class="primary-button" type="button">교사: 방 만들기</button><label>학생 방 코드<input id="onlineCode" placeholder="예: ONE-A7C9EF" maxlength="10" autocomplete="off"></label><button id="onlineLeave" class="secondary-button" type="button" hidden>방 나가기</button></div><p>교사는 이 화면을 열어두세요. 학생은 별명과 방 코드를 입력하고 아래 입장하기를 누릅니다. 실시간 퀴즈의 문제 유형과 문제 수는 기존 경기 설정에서 고릅니다.</p>`;
$('#onecardLobbyView').prepend(banner);
const quizView=document.createElement('article');quizView.className='panel online-quiz';quizView.hidden=true;$('#onecardScreen').append(quizView);
$('#ocJoinName').placeholder='학생 별명 (1~10자)';
$('#ocTeacherButton').hidden=true;
$('#ocMaxPlayers').disabled=true;$('#ocTeamSplit').disabled=true;
$('#ocJoinTeam').disabled=false;
$('#ocBackMatch').textContent='대기실로';
$('#ocBackLobby').textContent='대기실로';
$('#ocLobbyHint').textContent='방을 만든 뒤 학생들에게 코드를 알려주세요.';
$('#ocLobbyPlayers').innerHTML='';$('#ocLobbyCount').textContent='0';$('#ocRoomCode').textContent='방 생성 전';
$('#ocStartButton').disabled=true;
$('.active-player-select').hidden=true;
$('#roleToggle').title='상단 역할 버튼은 기존 로컬 퀴즈용입니다. 원카드는 방 생성/입장을 사용하세요.';
const status=text=>{$('#onlineStatus').textContent=text;};
function fail(e) {
  console.error(e);
  const code=e.code||'';
  const message=code.includes('operation-not-allowed')?'Firebase에서 Authentication → 로그인 방법 → 익명을 활성화하세요.':code.toLowerCase().includes('permission')?'데이터베이스 접근이 거부되었습니다. database.rules.json의 규칙을 Firebase에 게시하세요.':code.includes('network')?'인터넷 연결을 확인하세요.':e.message||'연결에 실패했습니다.';
  status(message);toast(message);
}
async function guard(fn) {if(busy) return;busy=true;try{await fn();}catch(e){fail(e);}finally{busy=false;}}
function screen() {
  $$('.screen').forEach(el=>el.classList.toggle('active',el.id==='onecardScreen'));
  $$('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.screen==='onecard'));
}
function view(name) {
  quizView.hidden=name!=='quiz';
  ['Lobby','Match','Spectator'].forEach(v=>{$(`#onecard${v}View`).hidden=v.toLowerCase()!==name;});
}
function renderLogs(selector) {
  $(selector).innerHTML=(pub?.logs||[]).map(l=>`<div class="onecard-log-entry"><time>${new Date(l.time).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</time><span>${escape(l.text)}</span></div>`).join('');
}
function render() {
  if(!pub) {view('lobby');return;}
  const host=role==='host', players=pub.players||[], me=players.find(p=>p.uid===uid);
  $('#ocRoomCode').textContent=room;
  $('#ocLobbyCount').textContent=players.length;$('#ocLobbyLimit').textContent=pub.kind==='quiz'?20:pub.mode==='team'?10:5;
  $('#ocJoinButton').hidden=host||!!me;
  $('#onlineCreate').hidden=!!room;$('#onlineLeave').hidden=!room;
  $('#ocCopyRoom').hidden=!room;
  $('#ocJoinTeam').disabled=pub.mode!=='team';
  $('#ocMaxPlayers').value=pub.mode==='team'?'10':'5';
  $$('.onecard-mode-card').forEach(el=>{el.disabled=!!room;el.classList.toggle('selected',el.dataset.onecardMode===pub.mode);});
  $('#ocStartButton').hidden=!host;
  $('#ocStartButton').disabled=!claimed||players.length<2;
  $('#ocLobbyHint').textContent=pub.kind==='quiz'?'실시간 퀴즈 · 최대 20명 · 팀 직접 선택':pub.mode==='team'?'각자 팀 버튼을 눌러 선택 · 각 팀 2~5명':'개인전 2~5명 · 교사는 관전만 합니다';
  $('#ocLobbyPlayers').innerHTML=players.map((p,i)=>`<div class="onecard-lobby-player" data-team="${p.team}"><span>${i+1}</span><strong>${escape(p.name)}</strong>${pub.mode==='team'?`<button type="button" class="team-toggle" data-team-uid="${p.uid}" ${p.uid!==uid&&!host?'disabled':''}>${p.team}팀 ↔</button>`:'<small>개인</small>'}</div>`).join('');
  $$('[data-team-uid]').forEach(b=>b.onclick=()=>guard(async()=>{
    const p=players.find(p=>p.uid===b.dataset.teamUid);
    if(host) await hostAction(g=>{if(g.phase!=='lobby')throw Error('경기 중에는 변경할 수 없습니다.');const q=g.players.find(q=>q.uid===p.uid);const target=q.team==='A'?'B':'A';if(g.players.filter(q=>q.team===target).length>=(g.kind==='quiz'?10:5))throw Error('팀 인원이 가득 찼습니다.');q.team=target;log(g,`${q.name} ${target}팀으로 변경`,now());});
    else await send({type:'team',team:p.team==='A'?'B':'A'});
  }));
  if(pub.phase==='lobby') {view('lobby');status(host?`교사 방장 · ${room} · ${claimed?'게임 진행 준비 완료':'다른 교사 탭이 진행 중입니다'}`:`학생 ${me?.name||''} · 교사가 시작하기를 기다립니다`);return;}
  if(pub.kind==='quiz') {renderQuiz();return;}
  const current=players[pub.turn];const ended=pub.phase==='finished';
  if(host) {
    view('spectator');$('#ocSpectatorTurn').textContent=ended?pub.winner:current?.name||'—';
    $('#ocSpectatorDiscard').textContent=`${codeOf(pub.top)} → ${String(pub.target).padStart(3,'0')}`;
    $('#ocSpectatorDraw').textContent=`${pub.drawCount}장`;
    $('#ocSpectatorAttack').textContent=pub.attack?`+${pub.attack}`:'없음';
    $('#ocSpectatorPlayerCount').textContent=`${players.length}명`;
    $('#ocSpectatorPlayers').innerHTML=players.map((p,i)=>{
      const cards=engine?.players?.find(q=>q.uid===p.uid)?.hand||[];
      return `<div class="spectator-player-row ${i===pub.turn?'active':''}"><span class="spectator-rank">${i+1}</span><div><strong>${escape(p.name)}</strong><small>${pub.mode==='team'?p.team+'팀 · ':''}${i===pub.turn?'현재 차례':'대기'}</small><div class="spectator-full-hand">${cards.map(c=>`<span title="${escape(c.label)}">${codeOf(c)}</span>`).join('')}</div></div><span class="spectator-hand-count">${p.count}장</span><span>${pub.onePending&&i===pub.turn?'원카드!':''}</span></div>`;
    }).join('');renderLogs('#ocSpectatorLog');
    $('#ocStopMatch').textContent=ended?'새 경기 대기실':'경기 종료';
  } else {
    view('match');$('#ocTurnName').textContent=ended?pub.winner:current?.name||'—';
    $('#ocMatchMode').textContent=pub.mode==='team'?'단체전':'개인전';
    $('#ocTurnPill').textContent=ended?'GAME OVER':`TURN ${pub.turnNo}`;
    $('#ocDirectionLabel').textContent=pub.direction===1?'시계 방향':'반시계 방향';
    $('#ocMatchPlayers').innerHTML=players.map((p,i)=>`<div class="oc-match-player ${i===pub.turn?'active':''}"><span>${i+1}</span><div><strong>${escape(p.name)}</strong><span class="team-label">${pub.mode==='team'?p.team+'팀':'개인'}</span></div><span class="hand-count">${p.count}</span></div>`).join('');
    $('#ocDiscardCard').className=`discard-card ${pub.top?.type==='normal'?'':'special'}`;
    $('#ocDiscardCard').innerHTML=`<span class="card-code">${codeOf(pub.top)}</span><span class="card-label">${escape(pub.top?.label)}</span>`;
    $('#ocDrawCount').textContent=pub.drawCount;$('#ocDrawPileCount').textContent=pub.drawCount;
    $('#ocCurrentTurnLabel').textContent=current?.name||'—';
    $('#ocAttackBadge').hidden=!pub.attack;$('#ocAttackBadge').textContent=`공격 +${pub.attack}`;
    $('#ocRuleHint').textContent=`맞출 번호 ${String(pub.target).padStart(3,'0')} · 백의 자리 또는 십의 자리`;
    const mine=current?.uid===uid&&!ended&&connected;
    $('#ocHand').innerHTML=hand.map(c=>`<button type="button" class="hand-card ${playable(pub,c)?'normal-match':''} ${c.type==='plus'?'plus':''}" data-card="${c.id}" ${!mine||pub.onePending||!playable(pub,c)?'disabled':''}><span class="hand-code">${codeOf(c)}</span><span class="hand-name">${escape(c.label)}</span></button>`).join('');
    $$('[data-card]').forEach(b=>b.onclick=()=>guard(async()=>{
      const c=hand.find(c=>c.id===b.dataset.card);let target=0;
      if(c.type==='joker') {const raw=prompt('조커 지정 번호 (000~990, 십 단위)','300');if(raw===null)return;target=Number(raw);if(!Number.isInteger(target)||target<0||target>990||target%10)throw Error('000~990 중 십 단위로 입력하세요.');}
      await send({type:'play',cardId:c.id,target,turnNo:pub.turnNo});
    }));
    $('#ocDrawButton').disabled=!mine||!!pub.onePending||(!pub.attack&&hand.some(c=>playable(pub,c)));
    $('#ocDrawButton small').textContent=pub.attack?`벌칙 ${pub.attack}장 받기`:'카드 1장 받기';
    $('#ocOneCardButton').disabled=!mine||!pub.onePending;
    $('#ocActionHint').textContent=ended?pub.winner:pub.onePending&&mine?'지금 원카드! 버튼을 누르세요 (3초)':mine?'밝은 카드를 선택하세요.':'다른 플레이어의 차례입니다.';
    $('#ocOpenSpectator').hidden=true;renderLogs('#ocGameLog');
  }
}
function renderQuiz() {
  view('quiz');const host=role==='host',me=(pub.players||[]).find(p=>p.uid===uid),q=pub.question,ended=pub.phase==='finished',open=pub.phase==='quiz';
  const title=q?.topic||q?.title||'KDC 실시간 퀴즈';
  quizView.innerHTML=`<span class="panel-kicker">LIVE QUIZ · ${escape(room)}</span><h2>${ended?escape(pub.winner):`${pub.questionIndex+1} / ${pub.totalQuestions} 문제`}</h2><p id="quizClock"></p><h3>${escape(title)}</h3><p>${escape(q?.subtitle||q?.prompt||'')}</p><div class="answer-grid">${(q?.options||[]).map(v=>`<button type="button" class="answer-button ${!open&&q.answer===v?'correct':''}" data-quiz-answer="${v}" ${host||!open||me?.answered||!connected?'disabled':''}><strong>${v}</strong></button>`).join('')}</div><p>${open?(host?'학생 답안을 기다립니다.':me?.answered?'답안을 제출했습니다.':'번호를 선택하세요.'):escape(q?.explanation||'')}</p><div class="online-quiz-ranking">${[...(pub.players||[])].sort((a,b)=>b.score-a.score).map((p,i)=>`<div><span>${i+1}. ${escape(p.name)} ${pub.mode==='team'?p.team+'팀':''}</span><strong>${p.score}점 · ${p.correct} 정답 ${p.answered?'✓':''}</strong></div>`).join('')}</div>${host?`<button id="quizNext" class="primary-button" ${pub.phase!=='quizResult'?'disabled':''}>${pub.questionIndex+1===pub.totalQuestions?'결과 보기':'다음 문제'}</button> <button id="quizStop" class="secondary-button">${ended?'대기실로':'종료'}</button>`:''}`;
  $$('[data-quiz-answer]').forEach(b=>b.onclick=()=>guard(()=>send({type:'answer',answer:b.dataset.quizAnswer,questionIndex:pub.questionIndex})));
  $('#quizNext')?.addEventListener('click',()=>guard(()=>hostAction(g=>nextQuiz(g,now()))));
  $('#quizStop')?.addEventListener('click',()=>guard(()=>hostAction(g=>{g.phase=ended?'lobby':'finished';g.winner=ended?'':'교사가 퀴즈를 종료했습니다.';})));
}
async function publish(next,commandId=null,response=null) {
  next.version=(engine?.version||0)+1;
  const writes={engine:next,public:publicState(next)};
  next.players.forEach(p=>{writes[`hands/${p.uid}`]=p.hand.length?p.hand:null;});
  if(commandId) {writes[`commands/${commandId}`]=null;writes[`responses/${response.uid}/${commandId}`]=response;}
  await update(path(''),writes);engine=next;pub=publicState(next);render();
}
async function acquire() {
  const token=await runTransaction(path('lease'),old=>{
    if(old&&old.tab!==tabId&&old.until>now())return;
    return {tab:tabId,until:now()+12000};
  });
  const changed=claimed!==token.committed;claimed=token.committed;if(changed)render();if(!claimed)return false;
  return true;
}
async function pump() {
  if(!hostReady||role!=='host'||working||!connected||!room)return;
  working=true;
  try {
    if(!await acquire()) {status('다른 교사 탭이 방을 진행하고 있습니다.');return;}
    engine=normalize((await get(path('engine'))).val());
    for(const [id,a] of Object.entries(pending)) {
      if(!a)continue;
      const next=normalize(structuredClone(engine));let error='';
      if(!next.processed[id]) {
        try {tick(next,now());apply(next,a.uid,a,now());} catch(e){error=e.message;}
        next.processed[id]=true;
        const keys=Object.keys(next.processed);if(keys.length>200)delete next.processed[keys[0]];
      }
      await publish(next,id,{uid:a.uid,ok:!error,message:error||'완료',time:now()});delete pending[id];
    }
    const next=normalize(structuredClone(engine));if(tick(next,now()))await publish(next);
  } catch(e){fail(e);}finally{working=false;}
}
async function hostAction(fn) {
  if(role!=='host'||!hostReady)throw Error('교사 방장만 진행할 수 있습니다.');
  if(working)throw Error('다른 요청을 처리 중입니다. 잠시 후 다시 눌러주세요.');
  working=true;
  try {
    if(!await acquire())throw Error('다른 교사 탭이 방을 진행하고 있습니다.');
    const next=normalize((await get(path('engine'))).val());fn(next);await publish(next);
  }finally{working=false;}
}
async function attach(code,asHost=false) {
  unsub.forEach(fn=>fn());unsub=[];clearInterval(timer);hostReady=false;pending={};hand=[];engine=null;pub=null;
  room=code;
  const meta=(await get(path('meta'))).val();
  if(!meta) {room='';throw Error('해당 방이 없습니다. 코드를 확인하세요.');}
  role=meta.host===uid?'host':'student';
  if(asHost&&role!=='host')throw Error('교사 권한이 없습니다.');
  sessionStorage.kdcRoom=room;
  $('#onlineCode').value=room;
  unsub.push(onValue(path('public'),s=>{pub=s.val();render();},fail));
  if(role==='host') {
    engine=normalize((await get(path('engine'))).val());
    unsub.push(onValue(path('engine'),s=>{if(s.exists()){engine=normalize(s.val());render();}},fail));
    hostReady=true;
    unsub.push(onValue(path('commands'),s=>{pending=s.val()||{};pump();},fail));
    timer=setInterval(pump,500);
    await pump();
  } else {
    unsub.push(onValue(path(`hands/${uid}`),s=>{hand=s.val()||[];render();},fail));
    unsub.push(onValue(path(`responses/${uid}`),s=>{
      for(const [id,response] of Object.entries(s.val()||{})) if(!seenResponses.has(id)) {seenResponses.add(id);if(!response.ok)toast(response.message);else if(response.time>now()-10000)status('학생 요청이 반영되었습니다.');}
    },fail));
    await set(path(`presence/${uid}`),true);await onDisconnect(path(`presence/${uid}`)).set(false);
  }
  screen();render();
}
const seenResponses=new Set();
async function send(action) {
  if(!connected)throw Error('인터넷 연결이 끊겼습니다. 다시 연결된 후 시도하세요.');
  if(!room||role==='host')throw Error('학생으로 입장하세요.');
  const request=push(path('commands'));
  await set(request,{...action,uid,time:now()});status('교사 화면에서 요청 처리 중…');
}
$('#onlineCreate').onclick=()=>guard(async()=>{
  if(!uid)throw Error('Firebase 연결 준비를 기다려 주세요.');
  const code='ONE-'+[...crypto.getRandomValues(new Uint8Array(3))].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
  room=code;
  const result=await runTransaction(path('meta'),old=>old?undefined:{host:uid,createdAt:now()});
  if(!result.committed)throw Error('방 코드가 겹쳤습니다. 다시 생성하세요.');
  const g=newRoom(mode,30,$('#onlineKind').value);await update(path(''),{engine:g,public:publicState(g)});
  await attach(code,true);status(`방 생성 완료: ${room}. 학생들에게 코드를 알려주세요.`);
});
$('#ocJoinButton').onclick=()=>guard(async()=>{
  const name=$('#ocJoinName').value.trim();const code=$('#onlineCode').value.trim().toUpperCase();
  if(!name||name.length>10)throw Error('별명을 1~10자로 입력하세요.');
  if(!/^ONE-[A-F0-9]{6}$/.test(code))throw Error('방 코드를 확인하세요. 예: ONE-A7C9EF');
  await attach(code);await send({type:'join',name,team:$('#ocJoinTeam').value});
});
$('#onlineLeave').onclick=()=>guard(async()=>{
  unsub.forEach(fn=>fn());unsub=[];clearInterval(timer);hostReady=false;room='';role='';pub=null;engine=null;hand=[];sessionStorage.removeItem('kdcRoom');
  $('#onlineCreate').hidden=false;$('#onlineLeave').hidden=true;$('#ocJoinButton').hidden=false;$('#ocStartButton').hidden=true;
  $('#ocLobbyPlayers').innerHTML='';$('#ocRoomCode').textContent='방 생성 전';
  $$('.onecard-mode-card').forEach(el=>el.disabled=false);view('lobby');status('방에서 나왔습니다. 진행 중인 방은 같은 코드로 다시 입장할 수 있습니다.');
});
$$('.onecard-mode-card').forEach(b=>b.onclick=()=>{mode=b.dataset.onecardMode;$$('.onecard-mode-card').forEach(el=>el.classList.toggle('selected',el===b));$('#ocMaxPlayers').value=mode==='team'?'10':'5';});
$('#ocStartButton').onclick=()=>guard(async()=>hostAction(g=>{
  if(g.kind==='quiz'){const settings=window.kdcQuizSettings();startQuiz(g,window.kdcQuestionBank[settings.deck].slice(0,settings.rounds),now());}
  else start(g,buildDeck(),now());
}));
$('#ocDrawButton').onclick=()=>guard(()=>send({type:'draw',turnNo:pub.turnNo}));
$('#ocOneCardButton').onclick=()=>guard(()=>send({type:'one',turnNo:pub.turnNo}));
$('#ocCopyRoom').onclick=()=>guard(async()=>{await navigator.clipboard.writeText(room);toast('방 코드를 복사했습니다.');});
$('#ocStopMatch').onclick=()=>guard(()=>hostAction(g=>{
  if(g.phase==='finished'){g.phase='lobby';g.players.forEach(p=>p.hand=[]);g.onePending=null;g.deck=[];g.discard=[];g.winner='';}
  else {g.phase='finished';g.winner='교사가 경기를 종료했습니다.';g.onePending=null;log(g,g.winner,now());}
}));
$('#ocBackMatch').onclick=()=>view('lobby');$('#ocBackLobby').onclick=()=>view('lobby');
$('#ocJoinName').onkeydown=e=>{if(e.key==='Enter')$('#ocJoinButton').click();};
window.kdcOnline={render};
setInterval(()=>{const clock=$('#quizClock');if(clock&&pub?.phase==='quiz')clock.textContent=`남은 시간 ${Math.max(0,Math.ceil((pub.deadline-now())/1000))}초`;},250);
onValue(ref(db,'.info/serverTimeOffset'),s=>{offset=s.val()||0;});
onValue(ref(db,'.info/connected'),s=>{connected=!!s.val();connection.textContent=connected?'Firebase 실시간 연결':'인터넷 연결 확인 중';if(pub)render();});
try {
  await auth.authStateReady();
  const credential=auth.currentUser|| (await signInAnonymously(auth)).user;uid=credential.uid;
  status('연결 준비 완료. 교사는 방 만들기, 학생은 방 코드와 별명을 입력하세요.');
  if(sessionStorage.kdcRoom)await attach(sessionStorage.kdcRoom);
}catch(e){fail(e);}
