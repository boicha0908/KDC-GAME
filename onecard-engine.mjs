// 교사 기기에서만 실행하는 규칙 엔진. 학생은 행동 요청만 보냅니다.
export const NAMES = ['총류','철학','종교','사회과학','자연과학','기술과학','예술','언어','문학','역사'];
export const codeOf = c => c?.type === 'normal' ? String(c.code).padStart(3,'0') : (c?.code ?? '—');
export function buildDeck(random = Math.random) {
  const counts = [6,6,5,6,6,6,5,5,6,5];
  const cards = [];
  counts.forEach((count,h) => { for(let t=0;t<count;t++) cards.push({id:`n${h}${t}`,type:'normal',code:h*100+t*10,label:NAMES[h]}); });
  [['plus',6,2],['plus',4,3],['reverse',4,0],['skip',4,0],['joker',6,0]].forEach(([type,count,value],group) => {
    for(let i=0;i<count;i++) cards.push({id:`s${group}${i}`,type,value,code:type==='plus'?`+${value}`:type==='reverse'?'↺':type==='skip'?'⊘':'★',label:type==='plus'?`플러스 ${value}`:type==='reverse'?'유턴':type==='skip'?'스킵':'조커'});
  });
  for(let i=cards.length-1;i>0;i--) {const j=Math.floor(random()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}
  return cards;
}
export function newRoom(mode='individual',minutes=30,kind='onecard',maxPlayers=null) {
  const capacity=kind==='quiz'?20:maxPlayers||(mode==='team'?10:5);
  return {kind,mode,maxPlayers:capacity,captainUid:'',phase:'lobby',players:[],deck:[],discard:[],target:0,turn:0,direction:1,attack:0,attackLevel:0,version:0,turnNo:0,minutes,deadline:0,onePending:null,winner:'',logs:[],processed:{},answers:{},questionIndex:0,quizQuestions:[]};
}
export function normalize(g) {
  for(const key of ['players','deck','discard','logs']) g[key] ||= [];
  g.players.forEach(p=>p.hand ||= []);
  g.maxPlayers ||= g.kind==='quiz'?20:g.mode==='team'?10:5;
  g.captainUid ||= g.players[0]?.uid||'';
  g.processed ||= {};
  return g;
}
export function log(g,text,now) { g.logs.unshift({text,time:now});g.logs=g.logs.slice(0,40); }
export function playable(g,c) {
  if(c.type==='joker') return true;
  if(g.attack) return c.type==='plus' && c.value>=g.attackLevel;
  if(c.type!=='normal') return true; // 特殊 카드에는 분류번호가 없어 자유 제출
  return Math.floor(c.code/100)===Math.floor(g.target/100) || Math.floor(c.code/10)%10===Math.floor(g.target/10)%10;
}
function advance(g,skip=false) {g.turn=(g.turn+g.direction*(skip?2:1)+g.players.length*2)%g.players.length;g.turnNo++;}
function finishByCount(g,why,now) {
  const totals={A:0,B:0};g.players.forEach(p=>totals[p.team]+=p.hand.length);
  if(g.mode==='team') g.winner=totals.A===totals.B?'무승부':`${totals.A<totals.B?'A':'B'}팀 승리`;
  else { const min=Math.min(...g.players.map(p=>p.hand.length));g.winner=g.players.filter(p=>p.hand.length===min).map(p=>p.name).join(', ')+' 승리'; }
  g.phase='finished';g.onePending=null;log(g,`${why} · ${g.winner}`,now);
}
function draw(g,p,count,now) {
  let n=0;while(n<count&&g.deck.length) {p.hand.push(g.deck.pop());n++;}
  log(g,`${p.name} 카드 ${n}장 받음`,now);
  if(!g.deck.length) finishByCount(g,'드로우 덱 소진',now);
}
export function tick(g,now) {
  if(g.kind==='quiz') {
    if(g.phase==='quiz'&&now>=g.deadline) {g.phase='quizResult';log(g,'답안 제출 종료 · 정답 공개',now);return true;}
    return false;
  }
  if(g.phase!=='match') return false;
  if(now>=g.deadline) {finishByCount(g,'제한 시간 종료',now);return true;}
  if(g.onePending && now>=g.onePending.until) {
    const pending=g.onePending;const p=g.players[g.turn];g.onePending=null;
    log(g,`${p.name} 원카드 미호출 · 벌칙 1장`,now);draw(g,p,1,now);
    if(g.phase==='match') advance(g,pending.skip);
    return true;
  }
  return false;
}
export function apply(g,uid,a,now=Date.now()) {
  normalize(g);
  if(a.type==='join') {
    const existing=g.players.find(p=>p.uid===uid);if(existing) return;
    if(g.phase!=='lobby') throw Error('이미 시작된 방입니다.');
    if(g.players.length >= g.maxPlayers) throw Error('방이 가득 찼어요.');
    const name=String(a.name||'').trim();if(!name||name.length>10) throw Error('별명은 1~10자로 입력하세요.');
    if(!['A','B'].includes(a.team)) throw Error('팀을 선택하세요.');
    if(g.players.filter(p=>p.team===a.team).length>=(g.kind==='quiz'?10:5) && g.mode==='team') throw Error('팀 인원이 가득 찼습니다.');
    g.players.push({uid,name,team:a.team,hand:[],score:0,correct:0});
    if(!g.captainUid)g.captainUid=uid;
    log(g,`${name} 입장${g.captainUid===uid?' · 학생 방장':''}`,now);return;
  }
  const p=g.players.find(p=>p.uid===uid);if(!p) throw Error('먼저 방에 입장하세요.');
  if(a.type==='team') {
    if(g.phase!=='lobby'||g.mode!=='team') throw Error('대기실에서만 팀을 변경할 수 있어요.');
    if(!['A','B'].includes(a.team)) throw Error('팀을 선택하세요.');
    if(g.players.filter(q=>q.uid!==uid&&q.team===a.team).length>=(g.kind==='quiz'?10:5)) throw Error('팀 인원이 가득 찼습니다.');
    p.team=a.team;log(g,`${p.name} ${a.team}팀으로 변경`,now);return;
  }
  if(g.kind==='quiz') {
    if(a.type!=='answer'||g.phase!=='quiz'||now>=g.deadline||a.questionIndex!==g.questionIndex) throw Error('답안 제출 시간이 지났습니다.');
    g.answers ||= {};if(g.answers[uid])throw Error('이미 답안을 제출했습니다.');
    const q=g.quizQuestions[g.questionIndex];if(!q.options.includes(a.answer))throw Error('선택지를 확인하세요.');
    const correct=a.answer===q.answer;g.answers[uid]={answer:a.answer,correct};
    if(correct){p.score+=100+Math.max(0,Math.floor((g.deadline-now)/1000)*2);p.correct++;}
    return;
  }
  if(g.phase!=='match') throw Error('진행 중인 경기가 아닙니다.');
  if(a.turnNo!==g.turnNo||g.players[g.turn].uid!==uid) throw Error('차례가 바뀌었습니다. 현재 차례를 확인하세요.');
  if(a.type==='one') {
    if(!g.onePending||now>=g.onePending.until) throw Error('원카드 호출 시간이 지났어요.');
    const skip=g.onePending.skip;g.onePending=null;log(g,`${p.name} 원카드!`,now);advance(g,skip);return;
  }
  if(g.onePending) throw Error('원카드 호출을 먼저 완료하세요.');
  if(a.type==='draw') {
    if(!g.attack&&p.hand.some(c=>playable(g,c))) throw Error('낼 수 있는 카드가 있습니다. 카드를 먼저 내세요.');
    draw(g,p,g.attack||1,now);g.attack=0;g.attackLevel=0;if(g.phase==='match') advance(g);return;
  }
  if(a.type!=='play') throw Error('알 수 없는 행동입니다.');
  const index=p.hand.findIndex(c=>c.id===a.cardId);const c=p.hand[index];
  if(!c||!playable(g,c)) throw Error('낼 수 없는 카드입니다.');
  if(c.type==='joker'&&(!Number.isInteger(a.target)||a.target<0||a.target>990||a.target%10!==0)) throw Error('조커 번호는 000~990 중 십 단위로 선택하세요.');
  p.hand.splice(index,1);g.discard.push(c);log(g,`${p.name} ${codeOf(c)} (${c.label}) 제출`,now);
  if(c.type==='normal') g.target=c.code;
  if(c.type==='plus') {g.attack+=c.value;g.attackLevel=c.value;}
  if(c.type==='reverse') g.direction*=-1;
  if(c.type==='joker') {g.attack=0;g.attackLevel=0;g.target=a.target;log(g,`조커 지정 번호 ${String(a.target).padStart(3,'0')}`,now);}
  if(!p.hand.length) {g.winner=g.mode==='team'?`${p.team}팀 승리 (${p.name})`:`${p.name} 승리`;g.phase='finished';log(g,g.winner,now);return;}
  const skip=c.type==='skip';
  if(p.hand.length===1) {g.onePending={until:now+3000,skip};log(g,`${p.name} 손패 1장 · 3초 안에 원카드!`,now);}
  else advance(g,skip);
}
export function start(g,deck,now=Date.now()) {
  if(g.phase!=='lobby') throw Error('대기실에서 시작하세요.');
  if(g.players.length<2||g.players.length>g.maxPlayers) throw Error('참가 인원을 확인하세요.');
  if(g.mode==='team') {const a=g.players.filter(p=>p.team==='A').length,b=g.players.length-a;if(a<2||b<2||a>5||b>5) throw Error('각 팀 2~5명이 필요합니다.');}
  g.deck=[...deck];g.players.forEach(p=>{p.hand=g.deck.splice(-6);});
  const first=g.deck.findIndex(c=>c.type==='normal');g.discard=[g.deck.splice(first,1)[0]];g.target=g.discard[0].code;
  g.phase='match';g.turn=0;g.turnNo++;g.direction=1;g.attack=0;g.attackLevel=0;g.onePending=null;g.winner='';g.deadline=now+g.minutes*60000;
  log(g,`게임 시작 · ${g.players.length}명에게 6장 배분`,now);
}
export function publicState(g) {
  const {deck,discard,processed,quizQuestions,answers,...pub}=g;
  const q=quizQuestions?.[g.questionIndex];
  let question=null;if(q){const {answer,explanation,...visible}=q;question=g.phase==='quiz'?visible:q;}
  return {...pub,question,totalQuestions:quizQuestions?.length||0,top:discard.at(-1)||null,drawCount:deck.length,players:g.players.map(({hand,...p})=>({...p,count:hand.length,answered:!!answers?.[p.uid]})),target:g.target};
}
export function startQuiz(g,questions,now=Date.now()) {
  if(g.phase!=='lobby'||g.players.length<2)throw Error('2명 이상 입장하면 시작할 수 있습니다.');
  if(g.mode==='team'&&(!g.players.some(p=>p.team==='A')||!g.players.some(p=>p.team==='B')))throw Error('A팀과 B팀에 참가자가 필요합니다.');
  g.quizQuestions=structuredClone(questions);g.questionIndex=0;g.answers={};g.players.forEach(p=>{p.score=0;p.correct=0;});g.phase='quiz';g.deadline=now+20000;g.winner='';
}
export function nextQuiz(g,now=Date.now()) {
  if(g.phase!=='quizResult')throw Error('답안 마감 후 다음 문제로 넘어갈 수 있습니다.');
  if(g.questionIndex+1>=g.quizQuestions.length){
    g.phase='finished';
    if(g.mode==='team'){const a=g.players.filter(p=>p.team==='A').reduce((n,p)=>n+p.score,0),b=g.players.filter(p=>p.team==='B').reduce((n,p)=>n+p.score,0);g.winner=a===b?'무승부':`${a>b?'A':'B'}팀 승리`;}
    else {const top=Math.max(...g.players.map(p=>p.score));g.winner=g.players.filter(p=>p.score===top).map(p=>p.name).join(', ')+' 승리';}
  }else {g.questionIndex++;g.phase='quiz';g.answers={};g.deadline=now+20000;}
}
