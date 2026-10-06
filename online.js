import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-app.js';
import {getAuth,signInAnonymously,GoogleAuthProvider,signInWithPopup,linkWithPopup,signInWithRedirect,linkWithRedirect,getRedirectResult,signOut} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-auth.js';
import {getDatabase,ref,get,set,update,onValue,push,runTransaction,onDisconnect} from 'https://www.gstatic.com/firebasejs/12.3.0/firebase-database.js';
import {firebaseConfig} from './firebase-config.js';
import {newRoom,normalize,buildDeck,apply,start,startQuiz,nextQuiz,tick,publicState,playable,codeOf,NAMES,CLASS_ICONS,log} from './onecard-engine.mjs';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const app=initializeApp(firebaseConfig),auth=getAuth(app),db=getDatabase(app);
let uid='',room='',role='',pub=null,hand=[],engine=null,connected=false,offset=0,claimed=false,hostReady=false,hasTeacherAccess=false,teacherMode=false,teacherRoomUnsub=null;
let mode='individual',unsub=[],busy=false,authInitialization=Promise.resolve();
const roomWorkers=new Map(),roomCatalog=new Map();
const tabId=crypto.randomUUID();
const now=()=>Date.now()+offset;
const path=s=>ref(db,`rooms/${room}/${s}`);
const connection=$('#connectionText');
const toast=text=>window.showToast?window.showToast(text):alert(text);
const banner=document.createElement('article');banner.className='panel online-entry';
banner.innerHTML=`<div><span class="panel-kicker">ONLINE ROOM</span><h2>온라인 게임 방 만들기</h2><p id="onlineStatus" role="status">Firebase 연결 준비 중…</p></div><div class="online-controls"><label class="teacher-only-control">게임<select id="onlineKind"><option value="onecard">KDC 원카드</option><option value="quiz">KDC 실시간 퀴즈 (최대 20명)</option></select></label><label class="teacher-only-control">경기 방식<select id="onlineMode"><option value="individual">개인전</option><option value="team">단체전</option></select></label><label class="teacher-only-control">직접 방 코드 (선택)<input id="onlineCreateCode" placeholder="예: KDC-7F3A" maxlength="20" autocomplete="off"></label><button id="onlineCreate" class="primary-button" type="button">새 방 만들기</button></div><p>학생은 오른쪽 위 <b>학생 입장</b>에서 방 코드와 이름을 입력합니다. 교사 화면에서는 여러 방의 진행을 독립적으로 관리하고 관전할 수 있습니다.</p><input id="onlineCode" type="hidden" value="">`;
$('#teacherRoomEntry').append(banner);
const roomManager=document.createElement('section');roomManager.className='panel room-manager';roomManager.innerHTML='<div class="room-manager-heading"><div><span class="panel-kicker">TEACHER ROOM MONITOR</span><h3>진행 중인 방</h3><p>방을 선택하면 학생들의 실제 게임 화면이 아래에 표시됩니다.</p></div><div class="room-manager-tools"><span id="roomManagerCount">0개 방</span><div class="room-manager-actions"><label>새 방 게임<select id="managerKind"><option value="onecard">KDC 원카드</option><option value="quiz">KDC 실시간 퀴즈</option></select></label><label>경기 방식<select id="managerMode"><option value="individual">개인전</option><option value="team">단체전</option></select></label><label>정원<select id="managerCapacity"></select></label><label>직접 방 코드<input id="managerCreateCode" placeholder="자동 생성 가능" maxlength="20" autocomplete="off"></label><button id="managerCreateRoom" class="primary-button" type="button">+ 새 방 만들기</button></div><button id="deleteCompletedRooms" class="danger-button" type="button">완료된 방 모두 삭제</button></div></div><div class="teacher-room-list" id="teacherRoomList"></div>';$('#teacherRoomManagerArea').append(roomManager);roomManager.hidden=true;
const quizView=document.createElement('article');quizView.className='panel online-quiz';quizView.hidden=true;
$('#ocJoinName').placeholder='학생 별명 (1~10자)';
$('#ocTeacherButton').hidden=true;
$('#ocMaxPlayers').disabled=false;$('#ocTeamSplit').disabled=true;
$('#ocJoinTeam').disabled=false;
$('#ocBackMatch').textContent='대기실로';
$('#ocBackLobby').textContent='대기실로';
$('#ocLobbyHint').textContent='방을 만든 뒤 학생들에게 코드를 알려주세요.';
$('#ocLobbyPlayers').innerHTML='';$('#ocLobbyCount').textContent='0';$('#ocRoomCode').textContent='방 생성 전';
const teacherRosterTools=document.createElement('div');teacherRosterTools.className='teacher-roster-tools';teacherRosterTools.innerHTML='<label>학생 이름<input id="teacherAddPlayerName" type="text" maxlength="10" placeholder="학생 이름 입력"></label><label id="teacherAddTeamWrap">팀<select id="teacherAddPlayerTeam"><option value="A">A팀</option><option value="B">B팀</option></select></label><button id="teacherAddPlayer" class="secondary-button" type="button">명단에 추가</button><small>추가한 학생은 방 코드와 같은 이름으로 접속하면 이 자리를 사용합니다.</small>';$('#ocLobbyPlayers').after(teacherRosterTools);teacherRosterTools.hidden=true;
$('.active-player-select').hidden=true;
$('#roleToggle').title='교사 대시보드 열기';
const status=text=>{$('#onlineStatus').textContent=text;};
function isGoogleAccount(user=auth.currentUser) {return !!user?.email&&user.providerData?.some(item=>item.providerId==='google.com')===true;}
function renderTeacherAuth() {
  const signedIn=isGoogleAccount();
  $('#teacherLoginCard').hidden=signedIn;
  $('#teacherDashboardContent').hidden=!signedIn;
  $('#teacherAccountEmail').textContent=signedIn?auth.currentUser.email:'Google 계정 로그인 필요';
  $('#teacherLogout').hidden=!signedIn;
  if(!signedIn)roomManager.hidden=true;
}
function placeOnlineViews() {
  const destination=(teacherMode||role==='host')?$('#teacherRoomStage'):$('#onecardScreen');
  [$('#onecardLobbyView'),$('#onecardMatchView'),$('#onecardSpectatorView'),quizView].forEach(node=>destination.append(node));
}
function fail(e) {
  console.error(e);
  const code=e.code||'';
  const message=code.includes('operation-not-allowed')?'Firebase Console → Authentication → 로그인 방법에서 Google 로그인을 사용 설정하세요.':code.includes('unauthorized-domain')?'Firebase Console → Authentication → 설정 → 승인된 도메인에 현재 사이트 도메인을 추가하세요.':code.toLowerCase().includes('permission')?'데이터베이스 접근이 거부되었습니다. 최신 database.rules.json 규칙을 Firebase에 게시하세요.':code.includes('network')?'인터넷 연결을 확인하세요.':e.message||'연결에 실패했습니다.';
  status(message);toast(message);
}
async function guard(fn) {if(busy) return;busy=true;try{await fn();}catch(e){fail(e);}finally{busy=false;}}
function screen() {
  const teacher=teacherMode||role==='host';
  placeOnlineViews();
  $$('.screen').forEach(el=>el.classList.toggle('active',el.id===(teacher?'teacherScreen':'onecardScreen')));
  $$('.nav-item').forEach(el=>el.classList.toggle('active',el.dataset.screen==='onecard'&&!teacher));
  renderTeacherAuth();
}
function view(name) {
  placeOnlineViews();
  const teacher=teacherMode||role==='host';
  const emptyTeacher=teacher&&isGoogleAccount()&&!room;
  $('#teacherNoRoom').hidden=!emptyTeacher;
  quizView.hidden=name!=='quiz';
  ['Lobby','Match','Spectator'].forEach(v=>{$(`#onecard${v}View`).hidden=emptyTeacher||v.toLowerCase()!==name;});
  renderRoomManager();
}
function renderLogs(selector) {
  $(selector).innerHTML=(pub?.logs||[]).map(l=>`<div class="onecard-log-entry"><time>${new Date(l.time).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})}</time><span>${escape(l.text)}</span></div>`).join('');
}
function cardIcon(card) {
  if(card?.type==='normal')return card.icon||CLASS_ICONS[Math.floor((Number(card.code)||0)/100)]||'📚';
  return ({plus:'➕',reverse:'↩️',skip:'⏭️',joker:'🃏'})[card?.type]||'🃏';
}
function cardFaceMarkup(card) {
  if(!card)return '<span class="kdc-card-art" aria-hidden="true">📚</span><span class="kdc-card-major">KDC 카드</span><strong class="kdc-card-number">—</strong><span class="kdc-card-subject">카드 대기 중</span>';
  const normal=card.type==='normal';
  const major=Math.floor((Number(card.code)||0)/100);
  const icon=cardIcon(card);
  const majorTag=normal?`${String(major*100).padStart(3,'0')} ${card.label||NAMES[major]||'KDC'}`:'특수 카드';
  return `<span class="kdc-card-art" aria-hidden="true">${escape(icon)}</span><span class="kdc-card-major">${escape(majorTag)}</span><strong class="kdc-card-number">${escape(codeOf(card))}</strong><span class="kdc-card-subject">${escape(normal?(card.subject||card.label):card.label||'특수 기능')}</span>`;
}
function render() {
  screen();
  if(!pub) {$('#ocJoinButton').hidden=true;$('#ocStartButton').hidden=true;view('lobby');return;}
  const host=role==='host', players=pub.players||[], me=players.find(p=>p.uid===uid);
  const capacity=pub.maxPlayers||(pub.kind==='quiz'?20:pub.mode==='team'?10:5);
  const studentCaptain=pub.kind==='onecard'&&!!me&&me.uid===pub.captainUid;
  const teamA=players.filter(p=>p.team==='A').length,teamB=players.length-teamA;
  const teamsReady=pub.mode!=='team'||(teamA>=2&&teamB>=2&&teamA<=5&&teamB<=5);
  const pendingCount=players.filter(p=>p.pendingJoin).length;
  $('#ocRoomCode').textContent=room;
  $('#ocLobbyCount').textContent=players.length;$('#ocLobbyLimit').textContent=capacity;
  $('#ocJoinButton').hidden=host||!!me||pub.phase!=='lobby'||players.length>=capacity;
  $('#onlineCreate').hidden=!isGoogleAccount();
  $$('.teacher-only-control').forEach(el=>el.hidden=!isGoogleAccount());
  $('#ocCopyRoom').hidden=!room;
  $('#ocJoinTeam').disabled=pub.mode!=='team';
  $$('.onecard-mode-card').forEach(el=>{el.disabled=!!room;el.classList.toggle('selected',el.dataset.onecardMode===$('#onlineMode').value);});
  teacherRosterTools.hidden=!(host&&pub.phase==='lobby');$('#teacherAddTeamWrap').hidden=pub.mode!=='team';
  $('#ocStartButton').hidden=!(host||studentCaptain);
  $('#ocStartButton').disabled=host?(!claimed||players.length<2||!teamsReady||pendingCount>0):(!connected||pub.phase!=='lobby'||players.length<capacity||!teamsReady||pendingCount>0);
  $('#ocStartButton').innerHTML=pub.kind==='quiz'?'퀴즈 경기 시작 <span>→</span>':studentCaptain?'방장 시작 <span>→</span>':'원카드 경기 시작 <span>→</span>';
  $('#ocLobbyHint').textContent=pendingCount?`교사가 추가한 학생 ${pendingCount}명이 방 코드와 같은 이름으로 입장하면 시작할 수 있습니다.`:pub.kind==='quiz'?'실시간 퀴즈 · 최대 20명 · 교사가 시작합니다':studentCaptain?players.length>=capacity?(teamsReady?'정원이 찼습니다. 방장인 내가 시작할 수 있어요.':'정원이 찼습니다. A/B팀에 각각 2명 이상 배정해 주세요.'):`학생 방장 · ${capacity-players.length}명 더 입장하면 시작할 수 있어요`:host?pub.mode==='team'?'팀을 직접 나눠 주세요 · 첫 학생이 방장 · 팀당 2~5명':'개인전 · 첫 입장 학생이 방장':pub.mode==='team'?'팀을 직접 선택하세요 · 첫 학생이 방장':'개인전 1:1부터 가능 · 첫 입장 학생이 방장';
  $('#ocLobbyPlayers').innerHTML=players.map((p,i)=>`<div class="onecard-lobby-player" data-team="${p.team}"><span>${i+1}</span><strong>${escape(p.name)}</strong>${p.pendingJoin?'<small class="pending-seat-tag">접속 대기</small>':''}${pub.mode==='team'?`<button type="button" class="team-toggle" data-team-uid="${escape(p.uid)}" ${p.uid!==uid&&!host?'disabled':''}>${p.team}팀 ↔</button>`:'<small>개인</small>'}${p.uid===pub.captainUid?'<span class="captain-tag">방장</span>':''}${host&&pub.phase==='lobby'?`<button type="button" class="room-player-remove" data-kick-uid="${escape(p.uid)}">삭제</button>`:''}</div>`).join('');
  $$('[data-team-uid]').forEach(b=>b.onclick=()=>guard(async()=>{
    const p=players.find(p=>p.uid===b.dataset.teamUid);
    if(host) await hostAction(g=>{if(g.phase!=='lobby')throw Error('경기 중에는 변경할 수 없습니다.');const q=g.players.find(q=>q.uid===p.uid);const target=q.team==='A'?'B':'A';if(g.players.filter(q=>q.team===target).length>=(g.kind==='quiz'?10:5))throw Error('팀 인원이 가득 찼습니다.');q.team=target;log(g,`${q.name} ${target}팀으로 변경`,now());});
    else await send({type:'team',team:p.team==='A'?'B':'A'});
  }));
  $$('[data-kick-uid]').forEach(b=>b.onclick=()=>guard(async()=>{
    const target=players.find(p=>p.uid===b.dataset.kickUid);
    if(!target||!confirm(`${target.name} 학생을 대기실에서 삭제할까요? 이 학생은 다시 방 코드로 입장할 수 있습니다.`))return;
    await hostAction(g=>{
      if(g.phase!=='lobby')throw Error('경기 중에는 참가자를 삭제할 수 없습니다.');
      if(!g.players.some(p=>p.uid===target.uid))return;
      apply(g,target.uid,{type:'leave'},now());
    });
  }));
  $('#teacherAddPlayer').onclick=()=>guard(async()=>{
    const name=$('#teacherAddPlayerName').value.trim();
    const team=$('#teacherAddPlayerTeam').value;
    if(!name||name.length>10)throw Error('학생 이름을 1~10자로 입력하세요.');
    await hostAction(g=>{
      if(g.phase!=='lobby')throw Error('대기실에서만 참가자를 추가할 수 있습니다.');
      if(g.players.length>=g.maxPlayers)throw Error(`방 정원은 ${g.maxPlayers}명입니다.`);
      const normalizedName=name.normalize('NFC').toLocaleLowerCase('ko-KR');
      if(g.players.some(p=>String(p.name||'').normalize('NFC').toLocaleLowerCase('ko-KR')===normalizedName))throw Error('같은 이름이 이미 명단에 있습니다. 이름을 구분해 주세요.');
      if(g.mode==='team'&&g.players.filter(p=>p.team===team).length>=(g.kind==='quiz'?10:5))throw Error(`${team}팀 정원이 가득 찼습니다.`);
      const reservedUid=`reserved_${crypto.randomUUID()}`;
      g.players.push({uid:reservedUid,name,team:g.mode==='team'?team:'A',hand:[],score:0,correct:0,pendingJoin:true});
      if(!g.captainUid)g.captainUid=reservedUid;
      log(g,`교사가 ${name} 학생의 참가 자리를 추가했습니다.`,now());
    });
    $('#teacherAddPlayerName').value='';toast(`${name} 학생 자리를 추가했습니다. 학생은 방 코드와 같은 이름으로 입장하면 됩니다.`);
  });
  if(pub.phase==='lobby') {view('lobby');status(host?`교사 방장 · ${room} · ${claimed?'게임 진행 준비 완료':'다른 교사 탭이 진행 중입니다'}`:studentCaptain?`학생 방장 ${me.name} · 정원이 차면 직접 시작할 수 있습니다`:`학생 대기실 · ${me?.name||'별명을 입력하고 입장하세요'}`);return;}
  if(pub.kind==='quiz') {renderQuiz();return;}
  const current=players[pub.turn];const ended=pub.phase==='finished';
  if(host) {
    view('spectator');$('#ocSpectatorTurn').textContent=ended?pub.winner:current?.name||'—';$('#ocSpectatorTableTurn').textContent=ended?pub.winner:current?.name||'—';
    $('#ocSpectatorDiscard').textContent=`${codeOf(pub.top)} → ${String(pub.target).padStart(3,'0')}`;
    $('#ocSpectatorDraw').textContent=`${pub.drawCount}장`;
    $('#ocSpectatorAttack').textContent=pub.attack?`+${pub.attack}`:'없음';
    $('#ocSpectatorRoom').textContent=room;
    $('#ocSpectatorTopCode').textContent=codeOf(pub.top);
    $('#ocSpectatorTopLabel').textContent=pub.top?.subject||pub.top?.label||'KDC 분류';
    $('#ocSpectatorTopIcon').textContent=cardIcon(pub.top);
    $('#ocSpectatorTopMajor').textContent=pub.top?.type==='normal'?`${String(Math.floor(pub.top.code/100)*100).padStart(3,'0')} ${pub.top.label}`:'특수 카드';
    $('#ocSpectatorDirection').textContent=pub.direction===1?'시계 방향':'반시계 방향';
    $('#ocSpectatorRule').textContent=`맞출 분류 ${String(pub.target).padStart(3,'0')} · 백의 자리 또는 십의 자리`;
    $('#ocSpectatorPileCount').textContent=pub.drawCount;
    $('#ocSpectatorTopCard').className=`spectator-discard-card ${pub.top?.type==='normal'?`major-${Math.floor(pub.top.code/100)}`:`special ${pub.top?.type||''}`}`;
    $('#ocSpectatorPlayerCount').textContent=`${players.length}명`;
    $('#ocSpectatorPlayers').innerHTML=players.map((p,i)=>{
      const cards=engine?.players?.find(q=>q.uid===p.uid)?.hand||[];
      return `<div class="spectator-player-row ${i===pub.turn?'active':''}"><span class="spectator-rank">${i+1}</span><div><strong>${escape(p.name)}</strong><small>${pub.mode==='team'?p.team+'팀 · ':''}${i===pub.turn?'현재 차례':'대기'}</small><div class="spectator-full-hand">${cards.map(c=>`<span class="spectator-card-mini" title="${escape(c.subject||c.label)}"><i>${escape(cardIcon(c))}</i><b>${codeOf(c)}</b></span>`).join('')}</div></div><span class="spectator-hand-count">${p.count}장</span><span>${pub.onePending&&i===pub.turn?'원카드!':''}</span></div>`;
    }).join('');renderLogs('#ocSpectatorLog');
    $('#ocStopMatch').textContent=ended?'새 경기 대기실':'경기 종료';
  } else {
    view('match');$('#ocTurnName').textContent=ended?pub.winner:current?.name||'—';
    $('#ocMatchMode').textContent=pub.mode==='team'?'단체전':'개인전';
    $('#ocTurnPill').textContent=ended?'GAME OVER':`TURN ${pub.turnNo}`;
    $('#ocDirectionLabel').textContent=pub.direction===1?'시계 방향':'반시계 방향';
    $('#ocMatchPlayers').innerHTML=players.map((p,i)=>`<div class="oc-match-player ${i===pub.turn?'active':''}"><span>${i+1}</span><div><strong>${escape(p.name)}</strong><span class="team-label">${pub.mode==='team'?p.team+'팀':'개인'}</span></div><span class="hand-count">${p.count}</span></div>`).join('');
    $('#ocDiscardCard').className=`discard-card ${pub.top?.type==='normal'?`major-${Math.floor(pub.top.code/100)}`:`special ${pub.top?.type||''}`}`;
    $('#ocDiscardCard').innerHTML=cardFaceMarkup(pub.top);
    $('#ocDrawCount').textContent=pub.drawCount;$('#ocDrawPileCount').textContent=pub.drawCount;
    $('#ocCurrentTurnLabel').textContent=current?.name||'—';
    $('#ocAttackBadge').hidden=!pub.attack;$('#ocAttackBadge').textContent=`공격 +${pub.attack}`;
    $('#ocRuleHint').textContent=`맞출 번호 ${String(pub.target).padStart(3,'0')} · 백의 자리 또는 십의 자리`;
    const mine=current?.uid===uid&&!ended&&connected;
    $('#ocHand').innerHTML=hand.map(c=>`<button type="button" class="hand-card kdc-card ${c.type==='normal'?`major-${Math.floor(c.code/100)}`:'special'} ${playable(pub,c)?'normal-match':''} ${c.type==='plus'?'plus':''} ${['reverse','skip'].includes(c.type)?'action':''} ${c.type==='joker'?'joker':''}" data-card="${c.id}" aria-label="${escape(`${codeOf(c)} ${c.subject||c.label}`)}" ${!mine||pub.onePending||!playable(pub,c)?'disabled':''}>${cardFaceMarkup(c)}</button>`).join('');
    $('#ocLeaveMatch').hidden=role!=='student';
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
  renderRoomManager();
}
function renderRoomManager() {
  const teacher=isGoogleAccount()&&(teacherMode||role==='host');roomManager.hidden=!teacher;
  if(!teacher)return;
  $('.room-manager-actions').hidden=$('#onecardLobbyView').hidden;
  const rows=[...roomCatalog.entries()].map(([code,data])=>({code,...data})).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0));
  $('#roomManagerCount').textContent=`${rows.length}개 방`;
  $('#deleteCompletedRooms').disabled=!rows.some(item=>item.state?.phase==='finished');
  $('#teacherRoomList').innerHTML=rows.length?rows.map(item=>{
    const g=item.state||{},live=['match','quiz','quizResult'].includes(g.phase),ended=g.phase==='finished';
    const detail=g.kind==='quiz'?`${g.players?.length||0}/${g.maxPlayers||20}명 · ${(g.questionIndex||0)+1}/${g.totalQuestions||0}문제`:`${g.players?.length||0}/${g.maxPlayers||5}명 · ${g.players?.[g.turn]?.name||'차례 대기'}`;
    return `<article class="teacher-room-card ${item.code===room?'selected':''}"><button class="teacher-room-open" type="button" data-watch-room="${escape(item.code)}"><span class="room-state-dot ${live?'live':ended?'ended':''}"></span><span class="teacher-room-copy"><strong>${g.kind==='quiz'?'실시간 퀴즈':'KDC 원카드'} · ${escape(item.code)}</strong><small>${g.mode==='team'?'단체전':'개인전'} · ${escape(detail)}</small></span><span class="room-phase">${live?'진행 중':ended?'종료':'대기'}</span></button><div class="room-card-actions"><button type="button" data-rename-room="${escape(item.code)}" ${ended?'disabled':''}>코드 수정</button><button type="button" data-reset-room="${escape(item.code)}">기록 리셋</button><button type="button" class="room-delete-action" data-delete-room="${escape(item.code)}">삭제</button></div></article>`;
  }).join(''):'<div class="room-empty">아직 생성된 방이 없습니다. 위에서 방을 만들면 여기에 표시됩니다.</div>';
  $$('[data-watch-room]').forEach(button=>button.onclick=()=>guard(()=>attach(button.dataset.watchRoom,true)));
  $$('[data-rename-room]').forEach(button=>button.onclick=()=>guard(()=>renameRoom(button.dataset.renameRoom)));
  $$('[data-reset-room]').forEach(button=>button.onclick=()=>guard(()=>resetRoomRecords(button.dataset.resetRoom)));
  $$('[data-delete-room]').forEach(button=>button.onclick=()=>guard(()=>deleteRoom(button.dataset.deleteRoom)));
}
function renderQuiz() {
  view('quiz');const host=role==='host',me=(pub.players||[]).find(p=>p.uid===uid),q=pub.question,ended=pub.phase==='finished',open=pub.phase==='quiz';
  const title=q?.topic||q?.title||'KDC 실시간 퀴즈';
  quizView.innerHTML=`<span class="panel-kicker">LIVE QUIZ · ${escape(room)}</span><h2>${ended?escape(pub.winner):`${pub.questionIndex+1} / ${pub.totalQuestions} 문제`}</h2><p id="quizClock"></p><h3>${escape(title)}</h3><p>${escape(q?.subtitle||q?.prompt||'')}</p><div class="answer-grid">${(q?.options||[]).map(v=>`<button type="button" class="answer-button ${!open&&q.answer===v?'correct':''}" data-quiz-answer="${v}" ${host||!open||me?.answered||!connected?'disabled':''}><strong>${v}</strong></button>`).join('')}</div><p>${open?(host?'학생 답안을 기다립니다.':me?.answered?'답안을 제출했습니다.':'번호를 선택하세요.'):escape(q?.explanation||'')}</p><div class="online-quiz-ranking">${[...(pub.players||[])].sort((a,b)=>b.score-a.score).map((p,i)=>`<div><span>${i+1}. ${escape(p.name)} ${pub.mode==='team'?p.team+'팀':''}</span><strong>${p.score}점 · ${p.correct} 정답 ${p.answered?'✓':''}</strong></div>`).join('')}</div>${host?`<button id="quizNext" class="primary-button" ${pub.phase!=='quizResult'?'disabled':''}>${pub.questionIndex+1===pub.totalQuestions?'결과 보기':'다음 문제'}</button> <button id="quizStop" class="secondary-button">${ended?'대기실로':'종료'}</button>`:`<button id="quizLeaveRoom" class="secondary-button">다른 방 접속</button>`}`;
  $$('[data-quiz-answer]').forEach(b=>b.onclick=()=>guard(()=>send({type:'answer',answer:b.dataset.quizAnswer,questionIndex:pub.questionIndex})));
  $('#quizNext')?.addEventListener('click',()=>guard(()=>hostAction(g=>nextQuiz(g,now()))));
  $('#quizStop')?.addEventListener('click',()=>guard(()=>hostAction(g=>{g.phase=ended?'lobby':'finished';g.winner=ended?'':'교사가 퀴즈를 종료했습니다.';})));
  $('#quizLeaveRoom')?.addEventListener('click',()=>guard(()=>leaveStudentRoom()));
}
async function publish(next,commandId=null,response=null,targetRoom=room) {
  next.version=(next.version||0)+1;
  const writes={engine:next,public:publicState(next)};
  next.players.forEach(p=>{writes[`hands/${p.uid}`]=p.hand.length?p.hand:null;});
  const previousPlayers=roomWorkers.get(targetRoom)?.engine?.players||[];
  const currentUids=new Set(next.players.map(p=>p.uid));
  previousPlayers.forEach(p=>{if(!currentUids.has(p.uid))writes[`hands/${p.uid}`]=null;});
  if(commandId) {writes[`commands/${commandId}`]=null;writes[`responses/${response.uid}/${commandId}`]=response;}
  await update(ref(db,`rooms/${targetRoom}`),writes);
  const worker=roomWorkers.get(targetRoom);if(worker)worker.engine=next;
  if(worker)scheduleWorkerDeadline(worker);
  const snapshot=publicState(next);roomCatalog.set(targetRoom,{...(roomCatalog.get(targetRoom)||{}),state:snapshot,updatedAt:Date.now()});
  if(targetRoom===room){engine=next;pub=snapshot;render();}
}
async function pumpWorker(worker) {
  if(worker.redirected)return;
  if(worker.renaming){worker.pendingCommands=true;return;}
  if(worker.running){worker.pendingCommands=true;return;}
  if(!connected)return;
  worker.running=true;
  worker.pendingCommands=false;
  try {
    const lease=await runTransaction(ref(db,`rooms/${worker.code}/lease`),old=>{
      if(old&&old.tab!==tabId&&old.until>now())return;
      return {tab:tabId,until:now()+12000};
    });
    worker.claimed=lease.committed;
    if(worker.code===room&&claimed!==worker.claimed){claimed=worker.claimed;render();}
    if(!worker.claimed) {if(worker.code===room)status('다른 교사 화면이 이 방을 진행하고 있습니다.');return;}
    worker.engine=normalize((await get(ref(db,`rooms/${worker.code}/engine`))).val());
    const requests=(await get(ref(db,`rooms/${worker.code}/commands`))).val()||{};
    for(const [id,a] of Object.entries(requests)) {
      if(!a)continue;
      const next=normalize(structuredClone(worker.engine));let error='';
      if(!next.processed[id]) {
        try {
          tick(next,now());
          if(a.type==='start') {
            if(next.kind!=='onecard'||a.uid!==next.captainUid)throw Error('원카드 방장만 시작할 수 있습니다.');
            if(next.phase!=='lobby')throw Error('이미 시작했거나 시작할 수 없는 방입니다.');
            if(next.players.length<next.maxPlayers)throw Error(`정원 ${next.maxPlayers}명이 모두 입장한 뒤 시작할 수 있습니다.`);
            beginGame(next);
          } else apply(next,a.uid,a,now());
        } catch(e){error=e.message;}
        next.processed[id]=true;
        const keys=Object.keys(next.processed);if(keys.length>200)delete next.processed[keys[0]];
      }
      await publish(next,id,{uid:a.uid,ok:!error,message:error||'완료',time:now()},worker.code);
    }
    const next=normalize(structuredClone(worker.engine));if(tick(next,now()))await publish(next,null,null,worker.code);
  } catch(e){if(worker.code===room)fail(e);else console.error(e);}finally{
    worker.running=false;scheduleWorkerDeadline(worker);
    if(worker.pendingCommands){worker.pendingCommands=false;setTimeout(()=>pumpWorker(worker),0);}
  }
}
function scheduleWorkerDeadline(worker) {
  clearTimeout(worker.wakeTimer);worker.wakeTimer=null;
  const g=worker.engine;if(!g)return;
  const deadlines=[];
  if(g.kind==='quiz'&&g.phase==='quiz'&&g.deadline)deadlines.push(g.deadline);
  if(g.kind!=='quiz'&&g.phase==='match'){
    if(g.deadline)deadlines.push(g.deadline);
    if(g.onePending?.until)deadlines.push(g.onePending.until);
  }
  if(deadlines.length)worker.wakeTimer=setTimeout(()=>pumpWorker(worker),Math.max(100,Math.min(...deadlines)-now()+40));
}
function ensureRoomWorker(code) {
  if(roomWorkers.has(code))return roomWorkers.get(code);
  const worker={code,engine:null,claimed:false,running:false,heartbeat:null,wakeTimer:null,pendingCommands:false,unsub:[]};roomWorkers.set(code,worker);
  worker.unsub.push(onValue(ref(db,`rooms/${code}/public`),s=>{
    const state=s.val();if(state)roomCatalog.set(code,{...(roomCatalog.get(code)||{}),state,updatedAt:Date.now()});
    renderRoomManager();if(code===room&&state){pub=state;render();}
  },e=>console.error(e)));
  worker.unsub.push(onValue(ref(db,`rooms/${code}/engine`),s=>{if(s.exists()){worker.engine=normalize(s.val());scheduleWorkerDeadline(worker);}},e=>console.error(e)));
  worker.unsub.push(onValue(ref(db,`rooms/${code}/commands`),s=>{if(s.exists())void pumpWorker(worker);},e=>console.error(e)));
  worker.heartbeat=setInterval(()=>pumpWorker(worker),4000);
  if(connected)void pumpWorker(worker);
  return worker;
}
function syncTeacherRooms(list) {
  hasTeacherAccess=isGoogleAccount();
  const codes=new Set(Object.keys(list||{}));
  for(const code of codes)ensureRoomWorker(code);
  for(const [code,worker] of roomWorkers)if(!codes.has(code)){
    worker.unsub.forEach(fn=>fn());clearInterval(worker.heartbeat);clearTimeout(worker.wakeTimer);roomWorkers.delete(code);roomCatalog.delete(code);
  }
  renderRoomManager();
}
function watchTeacherRooms() {
  teacherRoomUnsub?.();teacherRoomUnsub=null;
  if(!isGoogleAccount()) {hasTeacherAccess=false;syncTeacherRooms({});renderTeacherAuth();return;}
  uid=auth.currentUser.uid;hasTeacherAccess=true;
  teacherRoomUnsub=onValue(ref(db,`teachers/${uid}`),s=>syncTeacherRooms(s.val()||{}),fail);
  renderTeacherAuth();renderRoomManager();
}
async function signInTeacherWithGoogle() {
  await authInitialization;
  if(isGoogleAccount()) {teacherMode=true;uid=auth.currentUser.uid;watchTeacherRooms();screen();view(pub?(pub.kind==='quiz'?'quiz':pub.phase==='match'?'spectator':'lobby'):'lobby');return true;}
  const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
  try {
    const mobileBrowser=/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    if(mobileBrowser) {
      if(auth.currentUser?.isAnonymous)await linkWithRedirect(auth.currentUser,provider);
      else await signInWithRedirect(auth,provider);
      return true;
    }
    const result=auth.currentUser?.isAnonymous?await linkWithPopup(auth.currentUser,provider):await signInWithPopup(auth,provider);
    uid=result.user.uid;teacherMode=true;role='';hasTeacherAccess=true;watchTeacherRooms();screen();view('lobby');
    if(sessionStorage.kdcRoom)await attach(sessionStorage.kdcRoom,true);
    status(`Google 계정 로그인 완료: ${result.user.email||'교사'}`);
    return true;
  } catch(error) {
    if(error.code==='auth/operation-not-allowed')throw Error('Firebase Console → Authentication → 로그인 방법에서 Google 제공업체를 사용 설정한 뒤 다시 시도하세요.');
    if(error.code==='auth/unauthorized-domain')throw Error('Firebase Console → Authentication → 설정 → 승인된 도메인에 현재 사이트 주소를 추가하세요.');
    if(error.code==='auth/credential-already-in-use'||error.code==='auth/provider-already-linked')throw Error('이 Google 계정은 다른 Firebase 계정에 이미 연결되어 있습니다. 기존 익명 방은 자동 이전되지 않으니, 기존 교사 계정 소유권을 확인해야 합니다.');
    throw error;
  }
}
async function signOutTeacher() {
  if(!confirm('교사 Google 계정에서 로그아웃할까요? 진행 중인 방은 삭제되지 않지만, 이 화면의 관전·진행 연결은 종료됩니다.'))return false;
  unsub.forEach(fn=>fn());unsub=[];room='';pub=null;engine=null;hand=[];role='';teacherMode=false;hostReady=false;claimed=false;
  sessionStorage.removeItem('kdcRoom');
  await signOut(auth);uid='';watchTeacherRooms();screen();view('lobby');
  status('로그아웃했습니다. 학생은 학생 입장에서 방 코드로 입장할 수 있습니다.');return true;
}
function hostRoomState(code,fn) {
  return runWorkerAction(roomWorkers.get(code),fn);
}
async function runWorkerAction(worker,fn) {
  if(!worker)throw Error('방 진행기를 찾을 수 없습니다.');
  if(worker.renaming)throw Error('방 코드를 변경 중입니다. 잠시 후 다시 시도하세요.');
  if(!worker.claimed)await pumpWorker(worker);
  if(worker.running)throw Error('방 상태를 동기화 중입니다. 잠시 후 다시 눌러주세요.');
  worker.running=true;
  try {
    const lease=await runTransaction(ref(db,`rooms/${worker.code}/lease`),old=>old&&old.tab!==tabId&&old.until>now()?undefined:{tab:tabId,until:now()+12000});
    if(!lease.committed)throw Error('다른 교사 화면이 이 방을 진행 중입니다.');
    worker.claimed=true;if(worker.code===room){claimed=true;render();}
    const g=normalize((await get(ref(db,`rooms/${worker.code}/engine`))).val());fn(g);await publish(g,null,null,worker.code);
  }finally{worker.running=false;}
}
const roomCodePattern=/^(?=.{3,20}$)[\p{L}\p{N}]+(?:[-_][\p{L}\p{N}]+)*$/u;
function clearRoomSelection(message) {
  unsub.forEach(fn=>fn());unsub=[];hostReady=false;claimed=false;room='';pub=null;engine=null;hand=[];
  sessionStorage.removeItem('kdcRoom');$('#onlineCode').value='';$('#ocJoinButton').hidden=true;$('#ocStartButton').hidden=true;
  $('#ocLobbyPlayers').innerHTML='';$('#ocLobbyCount').textContent='0';$('#ocRoomCode').textContent='방을 목록에서 선택하세요';
  $$('.onecard-mode-card').forEach(el=>el.disabled=false);role=hasTeacherAccess?'host':'';teacherMode=hasTeacherAccess;view('lobby');screen();renderRoomManager();status(message);
}
async function deleteRoomData(code) {
  await update(ref(db),{[`rooms/${code}`]:null,[`teachers/${uid}/${code}`]:null});
  roomCatalog.delete(code);
  if(room===code&&role==='host')clearRoomSelection(`${code} 방을 삭제했습니다. 다른 방을 선택하거나 새 방을 만드세요.`);
  renderRoomManager();
}
async function deleteRoom(code) {
  const state=roomCatalog.get(code)?.state||{};
  const message=['match','quiz','quizResult'].includes(state.phase)?`${code} 방은 진행 중입니다. 플레이어 연결이 끊기며 방을 삭제할까요?`:`${code} 방을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`;
  if(!confirm(message))return;
  await deleteRoomData(code);toast(`${code} 방을 삭제했습니다.`);
}
async function deleteCompletedRooms() {
  const registered=(await get(ref(db,`teachers/${uid}`))).val()||{};
  const states=await Promise.all(Object.keys(registered).map(async code=>[code,(await get(ref(db,`rooms/${code}/public`))).val()]));
  const codes=states.filter(([,state])=>state?.phase==='finished').map(([code])=>code);
  if(!codes.length){toast('삭제할 완료된 방이 없습니다.');return;}
  if(!confirm(`완료된 방 ${codes.length}개를 모두 삭제할까요? 방과 기록은 복구할 수 없습니다.`))return;
  for(const code of codes)await deleteRoomData(code);
  toast(`완료된 방 ${codes.length}개를 삭제했습니다.`);
}
async function resetRoomRecords(code) {
  if(!confirm(`${code} 방의 점수·승패·손패·진행 로그를 초기화하고 대기실로 되돌릴까요? 참가자 명단과 팀 배정은 유지됩니다.`))return;
  const worker=ensureRoomWorker(code);
  await runWorkerAction(worker,g=>{
    g.phase='lobby';g.players.forEach(p=>{p.hand=[];p.score=0;p.correct=0;p.wins=0;p.losses=0;p.draws=0;});
    g.deck=[];g.discard=[];g.target=0;g.turn=0;g.direction=1;g.attack=0;g.attackLevel=0;g.turnNo=0;g.deadline=0;g.onePending=null;g.winner='';
    g.logs=[];g.processed={};g.answers={};g.questionIndex=0;g.quizQuestions=[];
  });
  await update(ref(db,`rooms/${code}`),{responses:null,commands:null});
  toast(`${code} 방의 경기 기록을 초기화했습니다.`);
}
async function renameRoom(oldCode) {
  const raw=prompt('새 방 코드를 입력하세요 (한글·영문·숫자, 하이픈·밑줄 사용 가능, 3~20자).',oldCode);
  if(raw===null)return;
  const newCode=raw.trim().toUpperCase();
  if(!roomCodePattern.test(newCode))throw Error('방 코드는 한글·영문·숫자와 하이픈·밑줄만 사용해 3~20자로 입력하세요.');
  if(newCode===oldCode)return;
  const worker=roomWorkers.get(oldCode)||ensureRoomWorker(oldCode);
  let waitCount=0;
  while(worker.running&&waitCount<40){await new Promise(resolve=>setTimeout(resolve,50));waitCount++;}
  if(worker.running)throw Error('해당 방을 처리 중입니다. 잠시 후 다시 시도하세요.');
  worker.renaming=true;
  try {
    if(worker) {
      const lease=await runTransaction(ref(db,`rooms/${oldCode}/lease`),old=>old&&old.tab!==tabId&&old.until>now()?undefined:{tab:tabId,until:now()+12000});
      if(!lease.committed)throw Error('다른 교사 화면이 이 방을 진행 중이어서 코드를 변경할 수 없습니다.');
      worker.claimed=true;
    }
    const source=(await get(ref(db,`rooms/${oldCode}`))).val();
    if(!source?.meta||source.meta.host!==uid)throw Error('교사 소유의 방을 찾을 수 없습니다.');
    const destination=(await get(ref(db,`rooms/${newCode}`))).val();
    if(destination)throw Error('이미 사용 중인 방 코드입니다.');
    const newMeta={host:uid,createdAt:source.meta.createdAt||now(),mode:source.meta.mode,kind:source.meta.kind};
    const reserved=await runTransaction(ref(db,`rooms/${newCode}/meta`),old=>old?undefined:newMeta);
    if(!reserved.committed)throw Error('이미 사용 중인 방 코드입니다.');
    try {
      await update(ref(db),{
        [`rooms/${newCode}`]:source,
        [`rooms/${oldCode}`]:{meta:{...newMeta,redirect:newCode}},
        [`teachers/${uid}/${oldCode}`]:null,
        [`teachers/${uid}/${newCode}`]:true,
      });
      worker.redirected=true;
    } catch(error) {
      await set(ref(db,`rooms/${newCode}/meta`),null).catch(()=>{});
      throw error;
    }
    roomCatalog.delete(oldCode);
    roomCatalog.set(newCode,{state:source.public||publicState(normalize(source.engine)),updatedAt:Date.now()});
    if(room===oldCode)await attach(newCode,true);
    renderRoomManager();toast(`방 코드가 ${oldCode}에서 ${newCode}(으)로 변경되었습니다.`);
  } finally {
    worker.renaming=false;if(worker.pendingCommands&&!worker.redirected){worker.pendingCommands=false;setTimeout(()=>pumpWorker(worker),0);}
  }
}
async function hostAction(fn) {
  if(role!=='host'||!hostReady)throw Error('교사 방장만 진행할 수 있습니다.');
  return hostRoomState(room,fn);
}
async function attach(code,asHost=false) {
  unsub.forEach(fn=>fn());unsub=[];hostReady=false;claimed=false;hand=[];engine=null;pub=null;
  room=code;
  const meta=(await get(ref(db,`rooms/${code}/meta`))).val();
  if(room!==code)return;
  if(!meta) {room='';role='student';sessionStorage.removeItem('kdcRoom');$('#onlineCode').value='';$('#onlineCreate').hidden=true;$('#ocJoinButton').hidden=false;$$('.teacher-only-control').forEach(el=>el.hidden=true);throw Error('해당 방이 없습니다. 코드를 확인하세요.');}
  if(meta.redirect)return attach(meta.redirect,asHost);
  const owner=meta.host===uid;
  if(owner&&!isGoogleAccount()) {teacherMode=true;screen();throw Error('이 방은 이 기기에서 만든 교사 소유 방입니다. 교사 대시보드에서 Google 계정으로 로그인한 뒤 다시 선택하세요.');}
  role=owner?'host':'student';
  if(role==='host')teacherMode=true;
  else if(!asHost)teacherMode=false;
  if(asHost&&role!=='host')throw Error('교사 권한이 없습니다.');
  sessionStorage.kdcRoom=room;
  $('#onlineCode').value=room;
  unsub.push(onValue(ref(db,`rooms/${code}/public`),s=>{
    const state=s.val();
    if(!state) {
      void get(ref(db,`rooms/${code}/meta`)).then(snapshot=>{
        if(room!==code)return;
        const latest=snapshot.val();
        if(latest?.redirect)void attach(latest.redirect,role==='host');
        else if(role==='student')void leaveStudentRoom(false,false);
        else if(role==='host')clearRoomSelection('이 방이 삭제되었습니다. 다른 방을 선택하세요.');
      }).catch(console.error);
      return;
    }
    pub=state;roomCatalog.set(code,{...(roomCatalog.get(code)||{}),state:pub,updatedAt:Date.now()});render();renderRoomManager();
  },fail));
  if(role==='host') {
    hasTeacherAccess=true;
    await set(ref(db,`teachers/${uid}/${code}`),true);
    const worker=ensureRoomWorker(code);
    engine=normalize((await get(ref(db,`rooms/${code}/engine`))).val());worker.engine=engine;
    unsub.push(onValue(ref(db,`rooms/${code}/engine`),s=>{if(s.exists()){engine=normalize(s.val());worker.engine=engine;render();}},fail));
    hostReady=true;
    await pumpWorker(worker);
  } else {
    unsub.push(onValue(ref(db,`rooms/${code}/hands/${uid}`),s=>{hand=s.val()||[];render();},fail));
    unsub.push(onValue(ref(db,`rooms/${code}/responses/${uid}`),s=>{
      for(const [id,response] of Object.entries(s.val()||{})) if(!seenResponses.has(id)) {seenResponses.add(id);if(!response.ok)toast(response.message);else if(response.time>now()-10000)status('학생 요청이 반영되었습니다.');}
    },fail));
    const presenceRef=ref(db,`rooms/${code}/presence/${uid}`);await set(presenceRef,true);await onDisconnect(presenceRef).set(false);
  }
  if(room!==code)return;
  if(role==='student'){roomManager.hidden=true;}
  screen();render();renderRoomManager();
}
const seenResponses=new Set();
async function send(action) {
  if(!connected)throw Error('인터넷 연결이 끊겼습니다. 다시 연결된 후 시도하세요.');
  if(!room||role==='host')throw Error('학생으로 입장하세요.');
  const request=push(path('commands'));
  await set(request,{...action,uid,time:now()});status('교사 화면에서 요청 처리 중…');
}
async function createRoom(kind,selectedMode,selectedCapacity,requestedCode='') {
  if(!isGoogleAccount())throw Error('방을 만들려면 먼저 Google 계정으로 교사 로그인해 주세요.');
  if(!uid)throw Error('Firebase 연결 준비를 기다려 주세요.');
  const customCode=String(requestedCode||'').trim().normalize('NFC').toUpperCase();
  if(customCode&&!roomCodePattern.test(customCode))throw Error('방 코드는 한글·영문·숫자와 하이픈·밑줄만 사용해 3~20자로 입력하세요.');
  const code=customCode||'ONE-'+[...crypto.getRandomValues(new Uint8Array(3))].map(v=>v.toString(16).padStart(2,'0')).join('').toUpperCase();
  const previousRoom=room;room=code;
  mode=selectedMode;
  try {
    const result=await runTransaction(path('meta'),old=>old?undefined:{host:uid,createdAt:now(),mode,kind});
    if(!result.committed)throw Error('이미 사용 중인 방 코드입니다. 다른 코드를 입력하세요.');
    const capacity=kind==='quiz'?20:Number(selectedCapacity);
    const g=newRoom(mode,30,kind,capacity);await update(path(''),{engine:g,public:publicState(g)});
    await set(ref(db,`teachers/${uid}/${code}`),true);
    hasTeacherAccess=true;
    roomCatalog.set(code,{state:publicState(g),updatedAt:Date.now()});
    $('#onlineCreateCode').value='';$('#managerCreateCode').value='';await attach(code,true);status(`방 생성 완료: ${room}. 학생들에게 코드를 알려주세요.`);
  } catch(e) {if(room===code)room=previousRoom;throw e;}
}
$('#onlineCreate').onclick=()=>guard(()=>createRoom($('#onlineKind').value,$('#onlineMode').value,$('#ocMaxPlayers').value,$('#onlineCreateCode').value));
$('#managerCreateRoom').onclick=()=>guard(()=>createRoom($('#managerKind').value,$('#managerMode').value,$('#managerCapacity').value,$('#managerCreateCode').value));
$('#ocJoinButton').onclick=()=>guard(async()=>{
  const name=$('#ocJoinName').value.trim();const code=$('#onlineCode').value.trim().toUpperCase();
  if(!name||name.length>10)throw Error('별명을 1~10자로 입력하세요.');
  if(!roomCodePattern.test(code))throw Error('방 코드는 한글·영문·숫자와 하이픈·밑줄을 사용해 3~20자로 입력하세요.');
  await attach(code);await send({type:'join',name,team:$('#ocJoinTeam').value});
});
async function leaveStudentRoom(sendRequest=true,confirmLeave=true) {
  if(role!=='student')return;
  if(confirmLeave&&pub&&['match','quiz','quizResult'].includes(pub.phase)&&!confirm('진행 중인 게임에서 나가면 다시 입장해야 합니다. 방을 나갈까요?'))return;
  const previous=room;
  if(sendRequest&&previous&&pub?.phase!=='finished')await send({type:'leave'});
  if(previous)await set(ref(db,`rooms/${previous}/presence/${uid}`),false).catch(()=>{});
  unsub.forEach(fn=>fn());unsub=[];hostReady=false;claimed=false;room='';pub=null;engine=null;hand=[];role='student';sessionStorage.removeItem('kdcRoom');
  $('#onlineCode').value='';$('#onlineCreate').hidden=true;$('#ocJoinButton').hidden=false;$('#ocStartButton').hidden=true;
  $('#ocLeaveMatch').hidden=true;
  $('#ocLobbyPlayers').innerHTML='';$('#ocLobbyCount').textContent='0';$('#ocRoomCode').textContent='새 방 코드를 입력하세요';
  $$('.onecard-mode-card').forEach(el=>el.disabled=false);screen();view('lobby');renderRoomManager();status('방에서 나왔습니다. 새 방 코드를 입력해 다른 방에 접속할 수 있습니다.');
}
async function enterTeacherMode() {
  await authInitialization;
  if(role==='student'&&room) {
    if(!confirm('현재 참가 중인 방에서 나가고 이 기기를 교사 화면으로 전환할까요?'))return false;
    await leaveStudentRoom(true,false);
  }
  if(role==='student')role='';
  teacherMode=true;
  screen();
  if(pub)render();else view('lobby');
  renderRoomManager();
  status(isGoogleAccount()?'교사 화면입니다. 온라인 방을 만들거나 진행 중인 방을 선택하세요.':'교사 기능은 Google 계정 로그인 후 사용할 수 있습니다.');
  return true;
}
async function joinRoomFromModal({code,name}) {
  await authInitialization;
  const roomCode=String(code||'').trim().normalize('NFC').toUpperCase();
  const studentName=String(name||'').trim();
  if(!roomCodePattern.test(roomCode))throw Error('방 코드를 확인하세요. 한글·영문·숫자와 하이픈·밑줄을 사용해 3~20자로 입력할 수 있습니다.');
  if(!studentName||studentName.length>10)throw Error('이름을 1~10자로 입력하세요.');
  if(role==='host'&&room)throw Error('이 기기는 교사 화면에서 방을 관리 중입니다. 학생은 다른 기기나 시크릿 창에서 입장하세요.');
  if(role==='student'&&room) {
    if(room===roomCode&&pub?.players?.some(p=>p.uid===uid)){screen();render();return true;}
    if(!confirm('현재 참가 중인 방에서 나가고 새 방에 입장할까요?'))return false;
    await leaveStudentRoom(true,false);
  }
  teacherMode=false;
  if(!auth.currentUser) {
    try {const credential=await signInAnonymously(auth);uid=credential.user.uid;}
    catch(error) {if(error.code==='auth/operation-not-allowed')throw Error('학생 입장을 위해 Firebase Authentication에서 익명 로그인을 사용 설정하세요.');throw error;}
  } else uid=auth.currentUser.uid;
  await attach(roomCode);
  if(role==='host')throw Error('이 코드는 현재 교사로 로그인된 방입니다. 학생은 다른 기기에서 입장하세요.');
  $('#ocJoinTeam').value='A';
  await send({type:'join',name:studentName,team:'A'});
  return true;
}
function setCapacityOptions(value,preferred=null) {
  const choices=value==='team'?[4,5,6,7,8,9,10]:[2,3,4,5];
  const fallback=value==='team'?10:5;
  const selected=choices.includes(Number(preferred))?Number(preferred):fallback;
  [$('#ocMaxPlayers'),$('#managerCapacity')].forEach(select=>{
    select.innerHTML=choices.map(n=>`<option value="${n}">${n}명${value==='individual'&&n===2?' (1:1)':''}</option>`).join('');
    select.value=String(selected);
  });
}
function setCreateMode(value) {
  mode=value;$('#onlineMode').value=value;$('#managerMode').value=value;
  $$('.onecard-mode-card').forEach(el=>el.classList.toggle('selected',el.dataset.onecardMode===value));
  setCapacityOptions(value);
}
setCapacityOptions(mode,5);
$$('.onecard-mode-card').forEach(b=>b.onclick=()=>setCreateMode(b.dataset.onecardMode));
$('#onlineMode').onchange=()=>setCreateMode($('#onlineMode').value);
$('#managerMode').onchange=()=>setCreateMode($('#managerMode').value);
$('#onlineKind').onchange=()=>$('#managerKind').value=$('#onlineKind').value;
$('#managerKind').onchange=()=>$('#onlineKind').value=$('#managerKind').value;
$('#ocMaxPlayers').onchange=()=>$('#managerCapacity').value=$('#ocMaxPlayers').value;
$('#managerCapacity').onchange=()=>$('#ocMaxPlayers').value=$('#managerCapacity').value;
function beginGame(g) {
  if(g.kind==='quiz'){const settings=window.kdcQuizSettings();startQuiz(g,window.kdcQuestionBank[settings.deck].slice(0,settings.rounds),now());}
  else start(g,buildDeck(),now());
}
$('#ocStartButton').onclick=()=>guard(async()=>{
  if(role==='host')await hostAction(beginGame);
  else await send({type:'start'});
});
$('#ocDrawButton').onclick=()=>guard(()=>send({type:'draw',turnNo:pub.turnNo}));
$('#ocOneCardButton').onclick=()=>guard(()=>send({type:'one',turnNo:pub.turnNo}));
$('#ocCopyRoom').onclick=()=>guard(async()=>{await navigator.clipboard.writeText(room);toast('방 코드를 복사했습니다.');});
$('#ocLeaveMatch').onclick=()=>guard(()=>leaveStudentRoom());
$('#deleteCompletedRooms').onclick=()=>guard(()=>deleteCompletedRooms());
$('#ocStopMatch').onclick=()=>guard(()=>hostAction(g=>{
  if(g.phase==='finished'){g.phase='lobby';g.players.forEach(p=>p.hand=[]);g.onePending=null;g.deck=[];g.discard=[];g.winner='';}
  else {g.phase='finished';g.winner='교사가 경기를 종료했습니다.';g.onePending=null;log(g,g.winner,now());}
}));
$('#ocBackMatch').onclick=()=>view('lobby');$('#ocBackLobby').onclick=()=>view('lobby');
$('#ocJoinName').onkeydown=e=>{if(e.key==='Enter')$('#ocJoinButton').click();};
$('#teacherGoogleLogin').onclick=()=>guard(signInTeacherWithGoogle);
$('#teacherLogout').onclick=()=>guard(signOutTeacher);
window.kdcOnline={render,enterTeacherMode,joinRoom:joinRoomFromModal,signInTeacherWithGoogle};
setInterval(()=>{const clock=$('#quizClock');if(clock&&pub?.phase==='quiz')clock.textContent=`남은 시간 ${Math.max(0,Math.ceil((pub.deadline-now())/1000))}초`;},250);
onValue(ref(db,'.info/serverTimeOffset'),s=>{offset=s.val()||0;});
onValue(ref(db,'.info/connected'),s=>{connected=!!s.val();connection.textContent=connected?'Firebase 실시간 연결':'인터넷 연결 확인 중';if(pub)render();if(connected)for(const worker of roomWorkers.values())void pumpWorker(worker);});
authInitialization=(async()=>{
  await auth.authStateReady();
  try {await getRedirectResult(auth);} catch(error) {status(error.message||'Google 로그인 완료를 확인하지 못했습니다.');}
  uid=auth.currentUser?.uid||'';teacherMode=isGoogleAccount();
  watchTeacherRooms();renderTeacherAuth();
  status('연결 준비 완료. 교사는 Google 계정으로 로그인하고, 학생은 방 코드와 이름으로 입장하세요.');
  if(sessionStorage.kdcRoom&&auth.currentUser) {
    try {await attach(sessionStorage.kdcRoom);}
    catch(error) {status(error.message||'저장된 방에 다시 연결하지 못했습니다.');console.warn(error);}
  }
  if(teacherMode)screen();
})();
authInitialization.catch(fail);
