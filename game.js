const cv=document.getElementById('c'),g=cv.getContext('2d');cv.width=320;cv.height=180;
const isT='ontouchstart' in window||navigator.maxTouchPoints>0;if(isT)document.body.classList.add('t');
function fit(){const ph=isT?document.getElementById('pad').offsetHeight:0;let s=Math.min(innerWidth/320,(innerHeight-ph)/180);if(s>=1)s=Math.floor(s);cv.style.width=320*s+'px';cv.style.height=180*s+'px'}
addEventListener('resize',fit);fit();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),hyp=Math.hypot;
let S,D,pops=[],parts=[],bub=null,AC;
const K={};
let playerName='';
const nameScreen=document.getElementById('nameScreen'),nameInput=document.getElementById('nameInput'),startBtn=document.getElementById('startBtn'),nameError=document.getElementById('nameError');
function openNameScreen(){nameScreen.style.display='flex';nameInput.value=playerName;nameError.textContent='';setTimeout(()=>nameInput.focus(),50)}
function startGameWithName(){const n=nameInput.value.replace(/\s+/g,' ').trim();if(n.length<2){nameError.textContent='Digite um nome com pelo menos 2 caracteres.';nameInput.focus();return}playerName=n.slice(0,16);nameScreen.style.display='none';init();S.mode='play';load('room');say([[playerName,'Onde eu estou?'],['Voz','Você está dentro de você mesmo.'],[playerName,'Isso não faz sentido...'],['Voz','Então descubra.']])}
function normalizeLines(lines){return lines.map(a=>[a[0]==='Lucas'?playerName:a[0],String(a[1]).replace(/\bLucas\b/g,playerName)])}
/* ---------- áudio ---------- */
let soundOn=true;
function beep(f=440,d=.06,v=.03,ty='square'){if(!soundOn)return;try{AC=AC||new(window.AudioContext||window.webkitAudioContext)();const o=AC.createOscillator(),n=AC.createGain();o.type=ty;o.frequency.value=f;n.gain.value=v;o.connect(n);n.connect(AC.destination);o.start();n.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+d);o.stop(AC.currentTime+d)}catch(e){}}
const PEN=[196,220,262,294,330,392,440];
setInterval(()=>{if(!S||S.mode==='title')return;const sc=S.scene;if(sc==='forest'||sc==='shadow')beep(PEN[Math.random()*4|0]/2,2,.02,'sine');else if(sc==='garden')beep(PEN[Math.random()*7|0]*2,1.2,.015,'sine');else if(sc==='city')beep(PEN[Math.random()*3|0]/2,2.5,.015,'sine')},2600);
/* ---------- estado ---------- */
function init(){S={mode:'title',name:'Lucas',scene:'room',eq:50,en:100,t:0,p:{x:160,y:112,d:'d',f:1,ft:0,mov:0,it:0,ht:0},cam:0,done:{},items:{},frag:{},expl:{},sel:0,fade:0,fd:0,fcb:null,cd:0,sh:100,W:320,ymin:58,objs:[],solids:[],lights:[],duv:null,obj:'',flags:{},dis:0,endingTitle:'',endingText:'',score:0};pops=[];parts=[];bub=null;D=null}
function chg(n){if(!n)return;S.eq=clamp(S.eq+n,0,100);pops.push({t:(n>0?'+':'')+n,x:S.p.x,y:S.p.y-26,l:70,c:n>0?'#8fffa0':'#ff8a8a'});beep(n>0?660:180,.12,.04)}
function upd(){const s=S.scene,n=o=>Object.keys(o).length;
if(s==='room')S.obj=S.flags.door?'Atravesse a porta.':'Explore o quarto ('+Math.min(4,n(S.expl))+'/4).';
else if(s==='forest')S.obj=n(S.frag)<3?'Ache os 3 fragmentos ('+n(S.frag)+'/3).':'Siga para a direita.';
else if(s==='city')S.obj=S.flags.bridge?'Encontre Pedro.':'Ajude os moradores ('+n(S.items)+'/3).';
else if(s==='garden')S.obj='Faça atividades ('+Math.min(4,n(S.done))+'/4).';
else if(s==='shadow')S.obj='Enfrente a Sombra.';else S.obj='';}
/* ---------- salvar / carregar ---------- */
function saveGame(show=true){
  try{
    const data={name:playerName,scene:S.scene,eq:S.eq,en:S.en,p:{x:S.p.x,y:S.p.y,d:S.p.d},done:S.done,items:S.items,frag:S.frag,expl:S.expl,flags:S.flags,endingTitle:S.endingTitle||'',endingText:S.endingText||'',savedAt:new Date().toLocaleString('pt-BR')};
    localStorage.setItem('dentroDaMenteSave',JSON.stringify(data));
    if(show)say([['Sistema','Progresso salvo com sucesso.']]);
    return true;
  }catch(e){if(show)say([['Sistema','Não foi possível salvar neste navegador.']]);return false}
}
function hasSave(){try{return !!localStorage.getItem('dentroDaMenteSave')}catch(e){return false}}
function loadGame(){
  try{
    const data=JSON.parse(localStorage.getItem('dentroDaMenteSave')||'null');
    if(!data)return false;
    playerName=data.name||'Jogador';
    init();
    S.mode='play';S.name=playerName;S.eq=data.eq??50;S.en=data.en??100;S.done=data.done||{};S.items=data.items||{};S.frag=data.frag||{};S.expl=data.expl||{};S.flags=data.flags||{};S.endingTitle=data.endingTitle||'';S.endingText=data.endingText||'';
    load(data.scene||'room',data.p?.x,data.p?.y);
    S.p.d=data.p?.d||'d';S.eq=clamp(S.eq,0,100);S.en=clamp(S.en,0,100);upd();
    say([['Sistema','Progresso carregado. Bem-vindo de volta, '+playerName+'.']]);
    return true;
  }catch(e){return false}
}
function deleteSave(){try{localStorage.removeItem('dentroDaMenteSave')}catch(e){}}
/* ---------- diálogo ---------- */
function say(lines,cb){D={l:normalizeLines(lines),i:0,sh:0,cb,ch:null,sel:0};S.mode='dialog';beep(520,.05)}
function ask(who,text,opts,cb){D={l:normalizeLines([[who,text]]),i:0,sh:0,cb:null,ch:opts,sel:0,chcb:cb};S.mode='dialog'}
function choose(i){if(S.mode!=='dialog'||!D||!D.ch||D.sh<D.l[D.i][1].length||i<0||i>=D.ch.length)return;const o=D.ch[i],cb=D.chcb;S.mode='play';chg(o.eq||0);cb(i)}
function press(){const m=S.mode;
if(m==='title'){beep(660,.1);openNameScreen();return}
if(m==='end'){S.mode='credits';S.t=0;beep(660,.12);return}
if(m==='credits'){init();return}
if(m==='menu'){
 if(S.sel===0){S.mode='play';return}
 if(S.sel===1){saveGame(true);return}
 if(S.sel===2){if(!loadGame())say([['Sistema','Ainda não existe um progresso salvo.']]);return}
 if(S.sel===3){soundOn=!soundOn;return}
 if(S.sel===4){S.mode='credits';S.t=0;return}
 if(S.sel===5){init();S.mode='title';return}
}

if(m==='dialog'){const L=D.l[D.i][1];if(D.sh<L.length){D.sh=L.length;return}
if(D.ch)return choose(D.sel);beep(520,.04);D.i++;if(D.i>=D.l.length){S.mode='play';D.cb&&D.cb()}return}
if(m==='play'&&!S.fd){const o=near();if(o){S.p.it=20;beep(400,.05);o.act()}}}
function menu(){if(S.mode==='play'){S.mode='menu';S.sel=0}else if(S.mode==='menu')S.mode='play'}
const KM={w:'u',arrowup:'u',s:'d',arrowdown:'d',a:'l',arrowleft:'l',d:'r',arrowright:'r'};
startBtn.addEventListener('click',startGameWithName);nameInput.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();startGameWithName()}});
addEventListener('keydown',e=>{if(e.target===nameInput||e.target===startBtn||e.target instanceof HTMLInputElement||e.target instanceof HTMLTextAreaElement)return;const k=e.key.toLowerCase();
if(S.mode==='dialog'&&D&&D.ch&&(k==='w'||k==='arrowup'||k==='s'||k==='arrowdown')){D.sel=(D.sel+(k==='w'||k==='arrowup'?-1:1)+D.ch.length)%D.ch.length;e.preventDefault();return}
if(S.mode==='menu'&&(k==='w'||k==='arrowup'||k==='s'||k==='arrowdown')){const dir=(k==='w'||k==='arrowup')?-1:1;S.sel=(S.sel+dir+6)%6;e.preventDefault();return}
if(KM[k]){K[KM[k]]=1;e.preventDefault();return}
if(k==='e'||k===' '||k==='enter'){e.preventDefault();if(!K.a){K.a=1;press()}return}
if(k==='escape'){menu();return}
if(k==='1'||k==='2'||k==='3')choose(+k-1)});
addEventListener('keyup',e=>{const k=e.key.toLowerCase();if(KM[k])K[KM[k]]=0;if(k==='e'||k===' '||k==='enter')K.a=0});
document.querySelectorAll('[data-k]').forEach(b=>{const k=b.dataset.k;b.addEventListener('pointerdown',e=>{e.preventDefault();K[k]=1});['pointerup','pointerleave','pointercancel'].forEach(ev=>b.addEventListener(ev,()=>K[k]=0))});
const ea=document.getElementById('ea');ea.addEventListener('pointerdown',e=>{e.preventDefault();K.a=1;press()});['pointerup','pointerleave','pointercancel'].forEach(ev=>ea.addEventListener(ev,()=>K.a=0));
document.getElementById('mn').addEventListener('pointerdown',e=>{e.preventDefault();menu()});
cv.addEventListener('pointerdown',e=>{if(nameScreen.style.display!=='none')return;const r=cv.getBoundingClientRect(),y=(e.clientY-r.top)/r.height*180;
if(S.mode==='dialog'&&D.ch&&D.sh>=D.l[D.i][1].length){const i=Math.floor((y-D.oy)/10);if(i>=0&&i<D.ch.length){D.sel=i;choose(i)}return}
if(S.mode==='play')return;if(S.mode==='breath'){K.a=1;return}press()});
addEventListener('pointerup',()=>{if(S.mode==='breath')K.a=0});
/* ---------- cenas ---------- */
function near(){
 let b=null,bd=1e9;
 for(const o of S.objs){
  if(!o.act||(o.vis&&!o.vis()))continue;
  const p=S.p;
  const cx=clamp(p.x,o.x,o.x+o.w);
  const cy=clamp(p.y,o.y,o.y+o.h);
  const d=hyp(p.x-cx,p.y-cy);
  const radius=o.radius||24;
  if(d<=radius){
   const centerD=hyp(p.x-(o.x+o.w/2),p.y-(o.y+o.h/2));
   if(centerD<bd){bd=centerD;b=o}
  }
 }
 return b;
}
function seed(n){let s=n;return()=>(s=s*16807%2147483647)/2147483647}
function load(sc,px,py){S.scene=sc;S.objs=[];S.solids=[];S.lights=[];S.duv=null;const O=S.objs,Sd=S.solids;parts=[];
const ob=(x,y,w,h,act,o)=>O.push(Object.assign({x,y,w,h,act,radius:24},o||{}));
if(sc==='room'){S.W=320;S.ymin=62;S.p.x=px||160;S.p.y=py||112;
Sd.push([0,0,320,58],[14,52,56,34],[112,44,64,18],[262,22,40,60]);
const ex=(id,txt,n)=>()=>{say(txt,()=>{if(n&&!S.expl[id]){S.expl[id]=242;chg(140);if(Object.keys(S.expl).length>=4&&!S.flags.door){S.flags.door=1;say([['Voz','Uma porta apareceu. Talvez seja hora de sair daqui e entender o que está acontecendo.']])}upd()}})};
ob(14,52,56,34,ex('cama',[['Lucas','Passei horas aqui, mas minha cabeça não me deixou descansar.']],1));
ob(122,28,22,18,ex('pc',[['COMPUTADOR','Há várias notificações. Algumas parecem importantes.'],['Lucas','Parece que todo mundo está vivendo melhor do que eu.'],['Lucas','Talvez eu esteja me comparando demais com o que vejo dos outros.']],1),{radius:32,id:'pc'});
ob(158,46,10,10,ex('cel',[['Lucas','Tenho várias mensagens que ainda não respondi. Nem sei por onde começar.']],1));
ob(198,6,44,32,ex('jan',[['JANELA','Lá fora, tudo parece normal.'],['Lucas','Pessoas caminham, carros passam... e ninguém sabe o que acontece por dentro.'],['Lucas','Não dá para saber o que alguém está enfrentando só olhando de fora.'],['Lucas','Talvez eu também não precise fingir que está tudo bem o tempo todo.']],1),{radius:32,id:'jan'});
ob(262,22,40,60,ex('arm',[['Lucas','Roupas que quase não uso mais. Acho que estou guardando coisas demais.']]));
ob(30,140,14,14,ex('moc',[['Lucas','Minha mochila está cheia de coisas que eu sinto que deveria ter feito.']]));
ob(80,6,24,30,ex('pos',[['Lucas','Minha banda favorita. Faz tempo que não paro para ouvir uma música com calma.']]));
ob(168,8,28,40,()=>{beep(300,.2);go('forest')},{vis:()=>S.flags.door,door:1})}
else if(sc==='forest'){S.W=480;S.ymin=40;S.p.x=20;S.p.y=100;S.lights=[[110,100,30],[250,85,30],[370,125,30]];
const r=seed(11),keep=[[20,100],[150,45],[270,150],[400,60],[110,100],[250,85],[370,125],[470,100],[300,100]];S.trees=[];
for(let i=0;i<30;i++){const x=20+r()*450,y=44+r()*130;if(keep.some(k=>hyp(k[0]-x,k[1]-y)<34))continue;S.trees.push([x|0,y|0]);Sd.push([x-4,y-5,8,7])}
Sd.push([476,0,10,180]);
const fr=[['real','REALIDADE',150,45,'#6ff3ff','Lucas','Nem tudo que penso é verdade. A realidade é maior que a minha cabeça.'],['cora','CORAGEM',270,150,'#ffb347','Lucas','Dá medo, mas eu posso dar um passo de cada vez.'],['apoio','APOIO',400,60,'#ff8ad0','Lucas','Sempre há alguém disposto a ouvir. Eu só preciso deixar.']];
fr.forEach(f=>ob(f[2]-7,f[3]-7,14,14,()=>{S.frag[f[0]]=1;chg(10);say([['Item','Você encontrou o FRAGMENTO DA '+f[1]+'!'],[f[5],f[6]]],()=>{if(Object.keys(S.frag).length===3)say([['Voz','Os fragmentos brilham juntos. O caminho à direita se abriu.']]);upd()})},{vis:()=>!S.frag[f[0]],frag:f}));
[['Eu não sou bom o suficiente.',60,60],['Ninguém vai entender.',200,140],['Talvez seja melhor ficar sozinho.',330,75]].forEach((t,i)=>ob(t[1]-8,t[2]-8,16,16,()=>{ask('Pensamento','"'+t[0]+'"',[{t:'Talvez seja verdade...',eq:-5},{t:'É só um pensamento, não um fato.',eq:5}],k=>{S.expl['t'+i]=1;say(k?[['Lucas','Pensamentos passam. Eu não preciso acreditar em todos.']]:[['Lucas','Isso pesa... mas talvez eu esteja sendo duro demais comigo.']])})},{vis:()=>!S.expl['t'+i],th:t[0]}));
S.duv={x:300,y:100};
setTimeout(()=>{if(S.scene==='forest'&&S.mode==='play')say([['Lucas','Quanta neblina... Esses pensamentos estão por toda parte.'],['Voz','Onde há luz, você está seguro. Procure os 3 fragmentos.']])},500)}
else if(sc==='city'){S.W=480;S.ymin=76;S.p.x=20;S.p.y=120;S.p.d='r';
Sd.push([0,0,480,72],[400,72,32,120]);S.flags.bridge=S.flags.bridge||0;
const np=(id,x,y,c,hr,fn,nm)=>ob(x-8,y-14,16,18,fn,{npc:{x,y,c,hr},id,nm});
np('n1',90,112,'#8a5a8a','#c9a35a',()=>{if(S.items.palavra)return say([['Homem','Obrigado por ficar aqui comigo.']]);
ask('Homem','Eu digo que está tudo bem porque não quero preocupar ninguém.',[{t:'Você pode conversar comigo.',eq:15},{t:'Todo mundo tem problemas.',eq:0}],i=>{if(!i)say([['Homem','...Eu não esperava que alguém perguntasse. Obrigado.'],['Item','Você recebeu: PALAVRA']],()=>{S.items.palavra=1;upd()});else say([['Homem','É... talvez. Mas isso não ajuda muito.'],['Lucas','(Talvez eu devesse ter escutado primeiro.)']])})});
np('n2',220,110,'#4a9a7a','#3a2a1a',()=>{if(S.items.mao)return say([['Garoto','Vou parar de me comparar tanto. Valeu.']]);
ask('Garoto','Parece que todo mundo é mais feliz do que eu.',[{t:'Às vezes a gente só vê o que as pessoas mostram.',eq:15},{t:'Talvez você tenha razão.',eq:-5}],i=>{if(!i)say([['Garoto','Nunca tinha pensado assim... Aqui, pegue.'],['Item','Você recebeu: MÃO']],()=>{S.items.mao=1;upd()});else say([['Garoto','Pois é... isso só me deixa pior.'],['Lucas','(Não foi isso que eu quis dizer...)']])})});
np('n3',345,120,'#c9604a','#222',()=>{if(S.items.coracao)return say([['Mulher','Pedir ajuda foi o primeiro passo. Obrigada.']]);
ask('Mulher','Eu achei que precisava resolver tudo sozinha.',[{t:'Talvez ninguém precise fazer isso sozinho.',eq:15},{t:'Boa sorte com isso, então.',eq:-10}],i=>{if(!i)say([['Mulher','Eu vou procurar alguém de confiança. Leve isto com você.'],['Item','Você recebeu: CORAÇÃO']],()=>{S.items.coracao=1;upd()});else say([['Mulher','...Entendo. Vou ficar aqui, então.'],['Lucas','(Eu não devia ter ignorado ela.)']])})});
ob(360,90,40,40,()=>{if(S.flags.bridge)return say([['Lucas','A ponte está firme.']]);const f=[['palavra','PALAVRA'],['mao','MÃO'],['coracao','CORAÇÃO']].filter(a=>!S.items[a[0]]).map(a=>a[1]);
if(f.length)return say([['Lucas','A ponte quebrada... Preciso de PALAVRA, MÃO e CORAÇÃO.'],['Lucas','Faltam: '+f.join(', ')+'. Vou ajudar os moradores.']]);
S.flags.bridge=1;Sd.splice(Sd.findIndex(a=>a[0]===400),1);chg(10);say([['Lucas','Palavra, mão e coração... Cada um ajudou a construir a ponte.'],['Item','A ponte foi reconstruída!']],upd)},{vis:()=>true,bridge:1});
np('pedro',458,112,'#3a8a3a','#5a3a1a',()=>{if(!S.flags.bridge)return say([['Pedro','Lucas! Consegue atravessar? Eu espero aqui!']]);talkPedro()},{});
setTimeout(()=>{if(S.scene==='city'&&S.mode==='play')say([['Lucas','Uma cidade vazia... Todos estão sozinhos aqui.'],['Voz','Cada pessoa aqui carrega algo. Escute.']])},500)}
else if(sc==='garden'){S.W=320;S.ymin=60;S.p.x=40;S.p.y=100;Sd.push([0,0,320,52],[142,76,36,22],[34,112,32,12]);
const act=(id,x,y,w,h,fn)=>ob(x,y,w,h,()=>{if(S.done[id])return say([['Lucas','Já fiz isso. Foi bom.']]);fn()},{});
const fin=()=>{upd();if(Object.keys(S.done).length>=4&&!S.flags.sh){S.flags.sh=1;say([['Lucas','Eu me sinto mais leve... mas o céu está escurecendo.'],['Voz','Ela está chegando. Lembre-se: você não está sozinho.']],()=>go('shadow'))}};
act('mus',244,100,16,16,()=>{S.done.mus=1;chg(5);say([['Lucas','Essa música me acalma. Fazia tempo que eu não ouvia.']],fin)});
act('cam',52,66,16,16,()=>{S.done.cam=1;chg(5);say([['Lucas','Caminhar sem pressa também é cuidar de mim.']],fin)});
act('con',194,112,16,22,()=>{S.done.con=1;chg(10);say([['Lucas','Obrigado por estar aqui, Pedro.'],['Pedro','Sempre. Amigos são para isso.']],fin)});
act('des',34,112,32,12,()=>{S.done.des=1;chg(5);say([['Lucas','Descansar não é desistir. É recuperar as forças.']],fin)});
act('res',140,74,40,28,()=>{S.done.res=1;breath(()=>{chg(S.score>.55?10:5);say([['Lucas',S.score>.55?'Respirar devagar ajuda a mente a desacelerar.':'Foi difícil, mas cada respiração conta.']],fin)})});
setTimeout(()=>{if(S.scene==='garden'&&S.mode==='play')say([['Pedro','Escolha o que te faz bem. Sem pressa.']])},400)}
else if(sc==='shadow'){S.W=320;S.ymin=60;S.p.x=70;S.p.y=140;S.sh=100;S.dis=0;S.flags.sh2=0;setTimeout(()=>round(0),600)}
else if(sc==='wake'){S.W=320;S.ymin=62;S.p.x=130;S.p.y=100;Sd.push([0,0,320,58],[14,52,56,34],[112,44,64,18],[262,22,40,60]);
setTimeout(()=>say([['Narrador',playerName+' acorda novamente em seu quarto. Tudo parece normal.'],['Lucas','Foi só um sonho... mas parece tão real.'],['Lucas','Hoje eu vou responder aquelas mensagens. E chamar o Pedro.'],['Voz','Pedir ajuda não é fraqueza.']],()=>{S.fd=0;S.fade=0;S.fcb=null;S.endingTitle=S.eq>=75?'CAMINHO DO APOIO':S.eq>=45?'CAMINHO DO EQUILÍBRIO':'CAMINHO DO PRIMEIRO PASSO';S.endingText=S.eq>=75?'Você percebeu que não precisa enfrentar tudo sozinho. Ouvir, falar e aceitar apoio também são formas de coragem.':S.eq>=45?'Você encontrou maneiras de cuidar de si e entendeu que equilíbrio não significa estar bem o tempo todo.':'Você ainda tem muito a descobrir, mas deu um passo importante: reconheceu o que sente e percebeu que pode pedir ajuda.';S.mode='end';saveGame(false)}),900)}
S.cam=0;upd()}
function go(sc,px,py){S.fd=1;S.fcb=()=>load(sc,px,py)}
function talkPedro(){ask('Pedro','Lucas, o que aconteceu?',[{t:'Nada.',eq:-5},{t:'Eu não sei explicar.',eq:0},{t:'Eu acho que não estou bem.',eq:20}],i=>{
if(i===0)say([['Pedro','Tem certeza? Eu estou aqui se quiser falar.']],talkPedro);
else if(i===1)say([['Pedro','Tudo bem não saber explicar. Tente me dizer como você se sente.']],talkPedro);
else say([['Lucas','Eu acho que não estou bem.'],['Pedro','Obrigado por me contar. Tudo bem não saber explicar.'],['Pedro','Você não precisa passar por isso sozinho.'],['Voz','Pedir ajuda não é fraqueza. O mundo começa a ganhar cor...']],()=>go('garden'))})}
/* ---------- respiração ---------- */
function breath(cb){S.mode='breath';S.bt=0;S.pr=14;S.ok=0;S.fr=0;S.bcb=cb;S.score=0;K.a=0}
function gr(t){const c=t%480;return c<180?14+28*c/180:c<300?42:42-28*(c-300)/180}
/* ---------- batalha ---------- */
const R=[['Você não consegue.',[['Talvez você tenha razão...',-5,0],['Eu posso pedir ajuda.',0,1],['Vou ficar quieto, é mais seguro.',-5,0]]],
['Ninguém se importa.',[['Eu não estou sozinho.',0,1],['Respirar fundo (autocuidado).',0,2],['Então não vou falar com ninguém.',-10,0]]],
['É melhor desistir.',[['Ok... eu desisto.',-10,0],['Meus pensamentos não definem quem eu sou.',0,1],['Vou me isolar um pouco mais.',-5,0]]]];
const WK=['Isso... está começando a incomodar...','Sua voz está ficando mais alta que a minha...','Eu estou... ficando pequena...'];
function round(n){if(n>=3)return climax();const r=R[n];
ask('A SOMBRA',r[0],r[1].map(o=>({t:o[0],eq:o[1]})),i=>{const o=r[1][i];
if(!o[2])return say([['A SOMBRA','Viu? Até você concorda comigo.']],()=>round(n));
const after=()=>{S.sh-=30;chg(10);say([['A SOMBRA',WK[n]]],()=>round(n+1))};
if(o[2]===2)say([['Lucas','Vou respirar. Um passo de cada vez.']],()=>breath(after));else say([['Lucas',o[0]]],after)})}
function climax(){S.sh=18;say([['A SOMBRA','Você realmente acha que tudo vai ficar bem?'],['Lucas','Talvez nem sempre.'],['Lucas','...'],['Lucas','Mas agora eu sei que não preciso enfrentar tudo sozinho.']],()=>{S.dis=1;beep(880,1,.04,'sine');setTimeout(()=>go('wake'),2200)})}
/* ---------- sprites ---------- */
function person(x,y,d,f,st,t,pal){pal=pal||{};const sk='#f0c39a',hr=pal.hr||'#2a1d2e',sh=pal.sh||'#3a7bd5',pk=pal.pk,hurt=st==='hurt'&&t%6<3;
g.save();g.translate(Math.round(x),Math.round(y));
const C=(c,a,b,w,h)=>{g.fillStyle=hurt?'#ff6a6a':c;g.fillRect(a,b,w,h)};
g.fillStyle='rgba(0,0,0,.34)';g.fillRect(-7,-1,14,3);g.fillStyle='rgba(0,0,0,.14)';g.fillRect(-9,2,18,2);
const sad=st==='sad',hy=sad?1:0,side=d==='l'||d==='r',sx=d==='r'?1:-1;
let lo=0,ro=0;if(st==='walk'){lo=f===0?-2:0;ro=f===2?-2:0}
if(side){const o=f===0?2:f===2?-2:0;C('#2d3250',-3+o*(st==='walk'),-5,3,5);C('#2d3250',0-o*(st==='walk'),-5,3,5)}else{C('#2d3250',-3,-5+lo,3,5-lo);C('#2d3250',0,-5+ro,3,5-ro)}
C('#e8e8f0',-3,-1,3,1);C('#e8e8f0',0,-1,3,1);
if(pk&&d!=='d'){if(side)C(pk,-sx*5-(sx<0?1:0)+(sx>0?-1:0)-1+1,-11,3,7);else C(pk,-4,-12,8,8)}
C(sh,-4,-11+hy,8,6);
if(st==='interact')C(sh,sx>0||d==='d'||d==='u'?4:-6,-14,2,5);else{C(sh,-6,-10+hy,2,4);C(sh,4,-10+hy,2,4)}
C(sk,-6,-6+hy,2,1);C(sk,4,-6+hy,2,1);
if(st==='interact'){C(sk,d==='l'?-6:4,-15,2,1)}
if(pk&&d==='d'){C(pk,-6,-10+hy,1,5);C(pk,5,-10+hy,1,5)}
C(sk,-4,-19+hy,8,8);
C(hr,-5,-20+hy,10,4);
if(d==='u'){C(hr,-4,-19+hy,8,8)}else if(d==='d'){C(hr,-5,-17+hy,1,3);C(hr,4,-17+hy,1,3);C('#222',-2,-15+hy,1,2);C('#222',1,-15+hy,1,2);if(sad)C('#7ab8ff',-2,-13+hy,1,2)}
else{C(hr,sx>0?-5:3,-18+hy,2,5);C('#222',sx>0?2:-3,-15+hy,1,2)}
g.restore()}
function duvida(x,y,t){g.save();g.translate(Math.round(x),Math.round(y));const w=Math.sin(t/12)*1.5;g.globalAlpha=.88;g.fillStyle='#120a1e';
g.fillRect(-9,-18+w,18,16);g.fillRect(-11,-14+w,22,10);g.fillRect(-9,-2,4,4);g.fillRect(-2,-2+w,4,5);g.fillRect(5,-2,4,3);g.fillRect(-4,-21+w,8,4);
g.globalAlpha=1;g.fillStyle='#fff';g.fillRect(-6,-14+w,4,4);g.fillRect(2,-14+w,4,4);g.fillStyle='#ff4a6a';g.fillRect(-4,-13+w,2,2);g.fillRect(4,-13+w,2,2);g.restore()}

/* ---------- acabamento visual ---------- */
function glow(x,y,r,c,a=.25){
 const q=g.createRadialGradient(x,y,1,x,y,r);
 q.addColorStop(0,c.replace('ALPHA',a));
 q.addColorStop(1,c.replace('ALPHA',0));
 g.fillStyle=q;g.fillRect(x-r,y-r,r*2,r*2);
}
function roomDetails(day){
 const t=S.t;
 if(day) glow(220,28,55,'rgba(255,240,180,ALPHA)',.22);
 else glow(225,25,48,'rgba(100,120,255,ALPHA)',.16);
 g.fillStyle='rgba(255,255,255,.035)';
 for(let y=64;y<180;y+=12)g.fillRect(0,y,320,1);
 /* pequenos detalhes de decoração */
 g.fillStyle='#b7a68c';g.fillRect(119,47,27,3);
 for(let i=0;i<7;i++)g.fillRect(121+i*3,48,2,1);
 g.fillStyle='rgba(0,0,0,.16)';g.fillRect(10,85,65,3);g.fillRect(259,81,46,3);
}

/* ---------- cenário ---------- */
function drawRoom(day){g.fillStyle=day?'#9a8bc8':'#3b2f5c';g.fillRect(0,0,320,58);g.fillStyle=day?'#c4a684':'#5b4a7a';g.fillRect(0,58,320,122);
g.fillStyle='rgba(0,0,0,.12)';for(let y=66;y<180;y+=12)g.fillRect(0,y,320,1);g.fillStyle='#2a2040';g.fillRect(0,54,320,4);
g.fillStyle='#d9c9a0';g.fillRect(198,6,44,32);g.fillStyle=day?'#8fd0ff':'#0f1a4a';g.fillRect(201,9,38,26);
if(day){g.fillStyle='#fff7a8';g.fillRect(226,12,8,8)}else{g.fillStyle='#fff6c8';g.fillRect(226,13,6,6);g.fillStyle='#cfd8ff';[[206,14],[212,26],[236,28],[208,30]].forEach(a=>g.fillRect(a[0],a[1],1,1))}
g.fillStyle='#d9c9a0';g.fillRect(219,9,2,26);g.fillRect(201,21,38,2);
g.fillStyle='#c4506a';g.fillRect(80,6,24,30);g.fillStyle='#ffd24a';g.fillRect(84,10,16,6);g.fillStyle='#222';g.fillRect(84,20,16,12);g.fillStyle='#4a9ae0';g.fillRect(110,14,14,20);g.fillStyle='#e0e0ff';g.fillRect(113,18,8,8);
g.fillStyle='#d8d0f0';g.fillRect(14,52,56,34);g.fillStyle=day?'#5a9ad0':'#3a4a9a';g.fillRect(14,64,56,22);g.fillStyle='#fff';g.fillRect(16,54,16,10);g.fillStyle='rgba(0,0,0,.2)';g.fillRect(14,84,56,2);
g.fillStyle='#8a5a3a';g.fillRect(112,44,64,18);g.fillStyle='#6a4228';g.fillRect(112,58,64,4);g.fillRect(114,60,4,10);g.fillRect(170,60,4,10);
g.fillStyle='#222';g.fillRect(122,28,22,16);g.fillStyle=day?'#334':'#4af0d0';g.fillRect(124,30,18,11);g.fillStyle='#555';g.fillRect(130,44,6,2);
g.fillStyle='#111';g.fillRect(158,47,7,9);g.fillStyle='#8ad';g.fillRect(159,48,5,6);
g.fillStyle='#5a3e2a';g.fillRect(262,22,40,60);g.fillStyle='#46301f';g.fillRect(281,24,2,56);g.fillStyle='#d4b060';g.fillRect(277,50,2,4);g.fillRect(285,50,2,4);
g.fillStyle='#c0562a';g.fillRect(30,140,14,14);g.fillStyle='#a04520';g.fillRect(30,146,14,2);g.fillStyle='#e8c050';g.fillRect(35,150,4,3);
 roomDetails(day)}
function drawDoor(){const t=S.t;g.fillStyle='rgba(255,230,150,'+(.3+.15*Math.sin(t/10))+')';g.fillRect(164,4,36,46);g.fillStyle='#6a4a8a';g.fillRect(168,8,28,40);g.fillStyle='#ffe28a';g.fillRect(170,10,24,36);g.fillStyle='#fff';g.fillRect(172,12,20,32);g.fillStyle='#c9a0ff';g.fillRect(188,28,3,3)}
function drawForest(){const t=S.t;const gr=g.createLinearGradient(0,0,0,180);gr.addColorStop(0,'#0c1a22');gr.addColorStop(1,'#14301f');g.fillStyle=gr;g.fillRect(0,0,480,180);
g.fillStyle='rgba(255,255,255,.04)';for(let i=0;i<20;i++)g.fillRect((i*47)%480,40+(i*29)%130,18,1);
S.trees.slice().sort((a,b)=>a[1]-b[1]).forEach(([x,y])=>{g.fillStyle='rgba(0,0,0,.35)';g.fillRect(x-8,y,16,3);g.fillStyle='#2a1c14';g.fillRect(x-3,y-14,6,15);g.fillStyle='#0f2a1a';g.fillRect(x-12,y-30,24,18);g.fillRect(x-8,y-38,16,10);g.fillStyle='#173d26';g.fillRect(x-10,y-28,8,6);g.fillRect(x-4,y-36,6,4)});
S.objs.forEach(o=>{if(o.vis&&!o.vis())return;if(o.frag){const f=o.frag,b=Math.sin(t/12)*2;g.fillStyle=f[4];g.globalAlpha=.3;g.fillRect(o.x-3,o.y-3+b,20,20);g.globalAlpha=1;g.fillRect(o.x+3,o.y+b,8,14);g.fillRect(o.x,o.y+3+b,14,8);g.fillStyle='#fff';g.fillRect(o.x+5,o.y+4+b,4,4)}
if(o.th){g.fillStyle='rgba(180,170,255,'+(.5+.3*Math.sin(t/20))+')';g.font='7px monospace';g.textBaseline='top';const w=g.measureText(o.th).width;g.fillText(o.th,o.x+8-w/2,o.y-8);g.fillRect(o.x+4,o.y+4,8,8)}})}
function drawCity(){const g2=S.flags.bridge?0:1;g.fillStyle='#4a4e66';g.fillRect(0,0,480,180);g.fillStyle='#363a52';g.fillRect(0,50,480,26);
for(let i=0;i<9;i++){const x=i*56+8,h=30+(i*13)%20;g.fillStyle='#2a2d42';g.fillRect(x,60-h,44,h+14);g.fillStyle='#1a1c2a';for(let a=0;a<3;a++)for(let b=0;b<2;b++)g.fillRect(x+6+a*13,66-h+b*14,7,8)}
g.fillStyle='#5a5e78';g.fillRect(0,72,480,108);g.fillStyle='#6a6e88';for(let x=0;x<480;x+=24)g.fillRect(x,100+(x%48?0:0),12,2);
g.fillStyle='#2a2d42';g.fillRect(70,100,36,6);g.fillRect(72,106,3,6);g.fillRect(101,106,3,6);
g.fillStyle='#1d3a5a';g.fillRect(400,72,32,108);g.fillStyle='#2f5a8a';for(let y=76;y<180;y+=10)g.fillRect(402+((y/10+S.t/20|0)%3)*8,y,10,2);
if(S.flags.bridge){g.fillStyle='#b88a52';g.fillRect(396,104,40,16);g.fillStyle='#8a6232';for(let x=398;x<436;x+=6)g.fillRect(x,104,1,16);g.fillStyle='#ffe28a';g.fillRect(404,100,4,4);g.fillRect(420,100,4,4)}
else{g.fillStyle='#8a6232';g.fillRect(392,104,10,16);g.fillRect(430,104,10,16);g.fillStyle='#ffd24a';g.fillRect(384,92,12,3)}
S.objs.forEach(o=>{if(o.npc){const n=o.npc;person(n.x,n.y,'d',1,o.id==='pedro'?'idle':'sad',S.t,{hr:n.hr,sh:n.c});if(S.items[o.id==='n1'?'palavra':o.id==='n2'?'mao':'coracao']){g.fillStyle='#ffe28a';g.fillRect(n.x-1,n.y-26,3,3)}}})}
function drawGarden(){g.fillStyle='#62c470';g.fillRect(0,0,320,180);g.fillStyle='#4aa85a';g.fillRect(0,0,320,52);for(let x=0;x<320;x+=16){g.fillStyle='#3a9048';g.fillRect(x,40,12,12)}
g.fillStyle='#7dd88a';for(let i=0;i<40;i++)g.fillRect((i*37)%320,56+(i*53)%124,3,2);
g.fillStyle='#e8d29a';g.fillRect(0,100,320,14);g.fillRect(150,52,20,50);
const cl=['#ff7ab8','#ffd24a','#fff','#9a8aff'];for(let i=0;i<30;i++){const x=(i*61)%320,y=60+(i*43)%118;if(y>96&&y<118)continue;g.fillStyle=cl[i%4];g.fillRect(x,y,2,2)}
g.fillStyle='#9aa8c8';g.fillRect(142,76,36,22);g.fillStyle='#4ac8f0';g.fillRect(146,80,28,14);g.fillStyle='#bff';g.fillRect(158,70+(S.t>>3)%3,4,8);for(let i=0;i<3;i++)g.fillRect(148+((S.t/6+i*9)%24|0),82+i*4,2,1);
g.fillStyle='#8a5a3a';g.fillRect(34,112,32,8);g.fillRect(34,106,32,4);g.fillRect(36,120,3,5);g.fillRect(61,120,3,5);
g.fillStyle='#d0402a';g.fillRect(244,100,16,16);g.fillStyle='#222';g.fillRect(247,104,8,8);g.fillStyle='#ffd24a';g.fillRect(250,102,6,1);if(S.t%40<20){g.fillStyle='#ff7ab8';g.fillRect(262,96,3,3);g.fillRect(266,92,3,3)}
g.fillStyle='#8a5a3a';g.fillRect(58,70,3,12);g.fillStyle='#d8b070';g.fillRect(52,62,16,9);
if(S.mode!=='end'&&S.scene==='garden'){const x=194,y=134;person(x,y,'l',1,'idle',S.t,{hr:'#5a3a1a',sh:'#3a8a3a'})}}
function drawShadow(){const t=S.t,sh=S.sh/100;const gr=g.createLinearGradient(0,0,0,180);gr.addColorStop(0,'#150a28');gr.addColorStop(1,'#2a1448');g.fillStyle=gr;g.fillRect(0,0,320,180);
g.fillStyle='#3a2468';g.fillRect(0,128,320,52);
const cx=220,cy=76,R=18+42*sh,w=Math.sin(t/14)*3;g.globalAlpha=S.dis?Math.max(0,sh):.92;g.fillStyle='#08040f';
g.fillRect(cx-R,cy-R*.8+w,R*2,R*1.6);g.fillRect(cx-R*1.15,cy-R*.4,R*2.3,R*.9+w);g.fillRect(cx-R*.6,cy-R*1.1+w,R*1.2,R*.4);
for(let i=0;i<5;i++)g.fillRect(cx-R+i*R*.5,cy+R*.7,R*.3,R*.5+Math.sin(t/9+i)*4);g.globalAlpha=1;
const ey=Math.max(3,R*.2);g.fillStyle='#fff';g.fillRect(cx-R*.5,cy-R*.3+w,ey*1.6,ey);g.fillRect(cx+R*.2,cy-R*.3+w,ey*1.6,ey);g.fillStyle='#ff3a5a';g.fillRect(cx-R*.5+ey*.5,cy-R*.3+w+1,ey*.6,ey-2);g.fillRect(cx+R*.2+ey*.5,cy-R*.3+w+1,ey*.6,ey-2);
if(S.dis){S.sh=Math.max(0,S.sh-.5);if(S.t%2===0)parts.push({x:cx+(Math.random()-.5)*R*2,y:cy+Math.random()*R,vy:-.6,l:80,c:'#d8c8ff'})}
person(70,150,'r',1,S.eq<25?'sad':'idle',t)}
/* ---------- partículas ---------- */
function spawnAmb(){const sc=S.scene;if(sc==='forest'&&parts.length<40&&Math.random()<.2)parts.push({x:S.cam+Math.random()*320,y:40+Math.random()*130,vy:-.1,l:200,c:'#ffeea0',tw:1});
if(sc==='garden'&&parts.length<30&&Math.random()<.1)parts.push({x:Math.random()*320,y:-4,vy:.3,l:400,c:'#ffb8d8'});
if(sc==='city'&&S.flags.bridge&&parts.length<30&&Math.random()<.15)parts.push({x:S.cam+Math.random()*320,y:Math.random()*100,vy:-.1,l:200,c:'#ffe28a',tw:1})}
/* ---------- HUD / UI ---------- */
function txt(s,x,y,c,sz){g.font='bold '+(sz||7)+'px Arial, Helvetica, sans-serif';g.textBaseline='top';g.fillStyle='#000';g.fillText(s,x+1,y+1);g.fillStyle=c||'#fff';g.fillText(s,x,y)}
function wrap(t,w){const o=[];let l='';for(const wd of t.split(' ')){const tt=l?l+' '+wd:wd;if(g.measureText(tt).width>w&&l){o.push(l);l=wd}else l=tt}o.push(l);return o}
function bar(x,y,w,v,c){g.fillStyle='#000';g.fillRect(x,y,w,5);g.fillStyle='#2a2a3a';g.fillRect(x+1,y+1,w-2,3);g.fillStyle=c;g.fillRect(x+1,y+1,Math.round((w-2)*v/100),3)}
function hud(){g.fillStyle='rgba(8,6,20,.82)';g.fillRect(3,3,128,45);g.strokeStyle='rgba(164,145,255,.9)';g.strokeRect(3.5,3.5,127,44);g.fillStyle='rgba(255,255,255,.04)';g.fillRect(5,5,124,1);
txt((S.name||'Lucas').toUpperCase(),7,6,'#ffe28a');g.fillStyle='#ff5a7a';g.fillRect(7,17,2,1);g.fillRect(10,17,2,1);g.fillRect(7,18,5,2);g.fillRect(8,20,3,1);bar(16,16,60,S.en,'#ff5a7a');
g.fillStyle='#ffa0e0';g.fillRect(7,26,5,4);g.fillRect(8,25,3,1);bar(16,25,60,S.eq,S.eq<30?'#ff8a5a':'#6fe0a0');txt(Math.round(S.eq)+'%',80,24,'#fff');
g.font='7px monospace';const l=wrap('Objetivo: '+S.obj,118);l.slice(0,2).forEach((s,i)=>txt(s,7,33+i*7,'#cfe'))}
function dialogBox(){
const ln=D.l[D.i],L=ln[1];
D.sh=Math.min(L.length,D.sh+1.05);
const ch=D.ch&&D.sh>=L.length;

// Caixa de diálogo maior e mais contrastada para facilitar a leitura.
g.font='9px monospace';
const textW=276;
const lines=wrap(L.slice(0,Math.floor(D.sh)),textW);
const full=wrap(L,textW).length;
const choiceH=ch?D.ch.length*11+4:0;
const h=Math.max(64,22+full*11+choiceH);
const y=Math.max(82,176-h);

// sombra externa
g.fillStyle='rgba(0,0,0,.72)';
g.fillRect(5,y+3,310,h);

// painel principal
g.fillStyle='rgba(5,7,20,.98)';
g.fillRect(6,y,308,h);

// borda externa e interna
g.strokeStyle='#b8aaff';
g.lineWidth=1;
g.strokeRect(6.5,y+.5,307,h-1);
g.strokeStyle='rgba(255,226,138,.65)';
g.strokeRect(9.5,y+3.5,301,h-7);

// faixa do personagem
if(ln[0]){
 const c={'Lucas':'#7ab8ff','Voz':'#ffe28a','A SOMBRA':'#ff6a8a','Pedro':'#8aff8a','Item':'#ffd24a','Pensamento':'#c8b8ff','Narrador':'#d8d8e8'}[ln[0]]||'#ffb8d0';
 g.fillStyle='rgba(255,255,255,.06)';
 g.fillRect(12,y+7,296,15);
 txt(ln[0],16,y+9,c,9);
}

// texto maior, com mais espaço entre as linhas
lines.forEach((s,i)=>txt(s,16,y+27+i*11,'#ffffff',9));

if(ch){
 D.oy=y+27+full*11+2;
 D.ch.forEach((o,i)=>{
   const sel=i===D.sel;
   if(sel){
     g.fillStyle='rgba(255,226,138,.10)';
     g.fillRect(13,D.oy+i*11-1,294,11);
   }
   txt((sel?'▶ ':'  ')+(i+1)+'. '+o.t,17,D.oy+i*11,sel?'#ffe28a':'#e8e8f2',9);
 });
}else if(D.sh>=L.length&&S.t%40<28){
 txt('▼',296,y+h-13,'#ffe28a',9);
}
}
/* ---------- loop ---------- */
function mv(dx,dy){const p=S.p,x=p.x+dx,y=p.y+dy;if(x<6||x>S.W-6||y<S.ymin||y>176)return;for(const s of S.solids)if(x+4>s[0]&&x-4<s[0]+s[2]&&y+1>s[1]&&y-3<s[1]+s[3])return;p.x=x;p.y=y}
function update(){S.t++;const p=S.p;if(S.mode==='play'&&S.t%900===0)saveGame(false);
if(S.fd){S.fade+=S.fd*.04;if(S.fade>=1&&S.fd>0){S.fade=1;S.fd=-1;S.fcb&&S.fcb();S.fcb=null;S.cam=0}else if(S.fade<=0&&S.fd<0){S.fade=0;S.fd=0}}
if(S.mode==='play'&&!S.fd){let dx=(K.r?1:0)-(K.l?1:0),dy=(K.d?1:0)-(K.u?1:0);p.mov=!!(dx||dy);
if(p.mov){const m=hyp(dx,dy)||1;dx=dx/m*1.1;dy=dy/m*1.1;if(dx)p.d=dx>0?'r':'l';else p.d=dy>0?'d':'u';mv(dx,0);mv(0,dy);p.ft++;if(p.ft%7===0)p.f=(p.f+1)%4}else p.f=1;
if(p.it>0)p.it--;if(p.ht>0)p.ht--;
if(S.cd>0)S.cd--;S.en=Math.min(100,S.en+.01);
if(S.eq<=0){S.eq=10;say([['Voz','Respire. Você não precisa enfrentar tudo sozinho.'],['Lucas','Um passo de cada vez...']])}
if(S.scene==='room'||S.scene==='forest'&&!S.duv);
if(S.scene==='forest'&&S.duv){const d=S.duv,inL=S.lights.some(l=>hyp(p.x-l[0],p.y-l[1])<l[2]),ds=hyp(p.x-d.x,p.y-d.y)||1;
if(inL)S.en=Math.min(100,S.en+.1);else{d.x+=(p.x-d.x)/ds*.38;d.y+=(p.y-d.y)/ds*.38}
S.lights.forEach(l=>{const q=hyp(d.x-l[0],d.y-l[1])||1;if(q<l[2]+8){d.x+=(d.x-l[0])/q*.7;d.y+=(d.y-l[1])/q*.7}});
if(ds<46&&!inL&&!bub&&S.t%90===0){bub={t:['Você tem certeza que consegue?','Isso não vai dar certo.','Por que tentar?'][Math.random()*3|0],l:120}}
if(ds<15&&!inL&&S.cd<=0){S.cd=160;chg(-5);S.en=Math.max(0,S.en-15);p.ht=30;bub={t:'Você não é capaz...',l:100};const q=ds;mv((p.x-d.x)/q*12,0);mv(0,(p.y-d.y)/q*12);
if(S.en<=0){S.en=60;p.x=S.lights[0][0];p.y=S.lights[0][1];say([['Voz','Respire. A luz é um lugar seguro.']])}}
if(p.x>466&&Object.keys(S.frag).length>=3){S.mode='play';go('city')}
else if(p.x>462&&Object.keys(S.frag).length<3&&S.t%120===0)pops.push({t:'Falta algo...',x:p.x-20,y:p.y-26,l:80,c:'#ffe28a'})}}
if(S.mode==='breath'){S.bt++;const t=S.bt,gR=gr(t);S.pr=clamp(S.pr+(K.a?.16:-.16),14,42);S.fr++;if(Math.abs(S.pr-gR)<7)S.ok++;
if(t>=960){S.score=S.ok/S.fr;S.mode='play';const cb=S.bcb;cb&&cb()}}
S.cam=clamp(Math.round(p.x-160),0,S.W-320);spawnAmb();
parts.forEach(a=>{a.y+=a.vy;a.l--;if(a.tw)a.x+=Math.sin(S.t/20+a.y)*.2});parts=parts.filter(a=>a.l>0);pops.forEach(a=>{a.y-=.3;a.l--});pops=pops.filter(a=>a.l>0);if(bub&&--bub.l<=0)bub=null}

function drawCredits(){
  g.fillStyle='#070912';
  g.fillRect(0,0,320,180);

  for(let i=0;i<42;i++){
    const x=(i*83+17)%320, y=(i*47+11)%180;
    const a=.25+.35*Math.sin(S.t/18+i);
    g.fillStyle=`rgba(210,205,255,${a})`;
    g.fillRect(x,y,1,1);
  }

  g.fillStyle='rgba(20,16,42,.97)';
  g.fillRect(34,15,252,150);
  g.strokeStyle='#8f80d8';
  g.strokeRect(34.5,15.5,251,149);
  g.strokeStyle='rgba(255,226,138,.55)';
  g.strokeRect(38.5,19.5,243,141);

  txt('DENTRO DA MENTE',82,32,'#ffe28a',16);
  txt('CRÉDITOS',126,51,'#ffffff',11);
  txt('Criação e desenvolvimento',80,72,'#bdb6e8',8);
  txt('Kauã e Emanuel',108,85,'#ffffff',11);
  txt('História • Programação • Arte',83,103,'#bdb6e8',8);
  txt('Um jogo sobre emoções, coragem',70,119,'#e8e4f7',8);
  txt('e a importância de pedir ajuda.',68,131,'#e8e4f7',8);
  txt('Obrigado por jogar!',102,149,'#ffe28a',9);
  if(S.t%70<50) txt('PRESSIONE E PARA VOLTAR',91,174,'#ffffff',7);
}

function render(){const t=S.t;
if(S.mode==='credits'){drawCredits();return}g.setTransform(1,0,0,1,0,0);g.fillStyle='#000';g.fillRect(0,0,320,180);
if(S.mode==='title'){g.fillStyle='#0b0816';g.fillRect(0,0,320,180);for(let i=0;i<50;i++){g.fillStyle=`rgba(255,255,255,${.3+.5*Math.sin(t/20+i)})`;g.fillRect((i*67)%320,(i*41)%180,1,1)}
g.fillStyle='rgba(110,82,190,.18)';g.fillRect(88,43,144,76);
 g.fillStyle='#241a42';g.fillRect(98,48,124,66);g.fillStyle='#493b82';g.fillRect(104,54,112,54);
 g.fillStyle='rgba(255,226,138,.12)';g.fillRect(110,60,100,1);
txt('DENTRO DA MENTE',58,32,'#ffe28a',18);txt('Uma jornada sobre emoções, coragem e apoio',55,120,'#cfc8ff',8);
person(160,100+Math.sin(t/20)*2,'d',1,'idle',t,{pk:'#c0562a'});
if(t%60<40)txt(isT?'TOQUE PARA COMEÇAR':'PRESSIONE E OU TOQUE PARA COMEÇAR',68,141,'#ffffff',9);
txt('WASD / SETAS: MOVER    E: INTERAGIR    ESC: MENU',39,156,'#b8b0e8',8);txt('Um jogo de narrativa; não substitui ajuda profissional.',45,167,'#9188bd',7);return}
g.save();g.translate(-S.cam,0);const sc=S.scene;
if(sc==='room'||sc==='wake'){drawRoom(sc==='wake');if(S.flags.door&&sc==='room')drawDoor()}else if(sc==='forest')drawForest();else if(sc==='city')drawCity();else if(sc==='garden')drawGarden();else if(sc==='shadow')drawShadow();
if(sc!=='shadow'){const p=S.p,st=p.ht>0?'hurt':p.it>0?'interact':p.mov?'walk':S.eq<25?'sad':'idle',ents=[{y:p.y,f:()=>person(p.x,p.y,p.d,p.f,st,t,{pk:'#c0562a'})}];
if(S.duv)ents.push({y:S.duv.y,f:()=>duvida(S.duv.x,S.duv.y,t)});ents.sort((a,b)=>a.y-b.y).forEach(e=>e.f());
if(S.mode==='play'){
 const n=near();
 if(n){
  const bx=n.x+n.w/2;
  const label=n.door?'[E] ENTRAR':n.id==='pc'?'[E] USAR COMPUTADOR':n.id==='jan'?'[E] OLHAR PELA JANELA':'[E] INTERAGIR';
  txt(label,bx-g.measureText(label).width/2,n.y-(n.door||n.bridge?10:14)+Math.sin(t/6)*1.5,'#ffe28a',7);
   g.strokeStyle='rgba(255,226,138,'+(0.22+0.18*Math.sin(t/7))+')';g.strokeRect(n.x-2,n.y-2,n.w+4,n.h+4);
 }
}}
if(sc==='forest'){g.globalCompositeOperation='lighter';S.lights.forEach(l=>{const r=g.createRadialGradient(l[0],l[1],2,l[0],l[1],l[2]+10);r.addColorStop(0,'rgba(255,240,170,.45)');r.addColorStop(1,'rgba(255,240,170,0)');g.fillStyle=r;g.fillRect(l[0]-l[2]-10,l[1]-l[2]-10,(l[2]+10)*2,(l[2]+10)*2)});g.globalCompositeOperation='source-over';
g.fillStyle='rgba(200,220,230,.07)';for(let i=0;i<5;i++)g.fillRect(((t/3+i*110)%560)-40,50+i*28,110,14)}
parts.forEach(a=>{g.fillStyle=a.c;g.globalAlpha=a.tw?.4+.5*Math.abs(Math.sin(t/15+a.x)):.8;g.fillRect(a.x,a.y,2,2);g.globalAlpha=1});
if(bub&&S.duv){g.font='7px monospace';const w=g.measureText(bub.t).width;g.fillStyle='rgba(20,10,40,.9)';g.fillRect(S.duv.x-w/2-3,S.duv.y-36,w+6,11);g.fillStyle='#ff9ab0';g.textBaseline='top';g.fillText(bub.t,S.duv.x-w/2,S.duv.y-34)}
pops.forEach(a=>txt(a.t,a.x-8,a.y,a.c,8));g.restore();
if(S.eq<25){const v=g.createRadialGradient(160,90,60,160,90,200);v.addColorStop(0,'rgba(10,10,40,0)');v.addColorStop(1,'rgba(10,10,40,.55)');g.fillStyle=v;g.fillRect(0,0,320,180)}
if(S.mode==='breath'){g.fillStyle='rgba(20,14,50,.94)';g.fillRect(0,0,320,180);const gR=gr(S.bt),ph=S.bt%480<180?'Inspire...':S.bt%480<300?'Segure...':'Expire...';
txt('RESPIRE',130,12,'#ffe28a',12);const o=g.createRadialGradient(160,92,2,160,92,gR+8);o.addColorStop(0,'rgba(140,200,255,.5)');o.addColorStop(1,'rgba(140,200,255,0)');g.fillStyle=o;g.beginPath();g.arc(160,92,gR+8,0,7);g.fill();
g.strokeStyle='#8fd0ff';g.lineWidth=2;g.beginPath();g.arc(160,92,gR,0,7);g.stroke();g.strokeStyle=Math.abs(S.pr-gR)<7?'#8fffa0':'#ff9a9a';g.beginPath();g.arc(160,92,S.pr,0,7);g.stroke();g.lineWidth=1;
txt(ph,130,146,'#fff',10);txt(isT?'Segure o botão E ao inspirar, solte ao expirar':'Segure E/ESPAÇO ao inspirar e segurar; solte ao expirar',isT?42:30,162,'#cfc8ff',7);bar(110,172,100,S.bt/9.6,'#8fd0ff')}
else if(S.mode!=='end'&&S.mode!=='menu'||S.mode==='menu')hud();
if(S.mode==='dialog')dialogBox();
if(S.mode==='menu'){g.fillStyle='rgba(4,4,14,.94)';g.fillRect(54,18,212,148);g.strokeStyle='#9a8aff';g.strokeRect(54.5,18.5,211,147);g.strokeStyle='rgba(255,226,138,.45)';g.strokeRect(58.5,22.5,203,139);txt('PAUSA',136,31,'#ffe28a',13);txt((S.name||playerName).toUpperCase(),72,44,'#cfc8ff',8);txt('Equilíbrio '+Math.round(S.eq)+'%',174,44,'#8fffa0',8);const mi=['Continuar','Salvar progresso','Carregar progresso','Som: '+(soundOn?'LIGADO':'DESLIGADO'),'Créditos','Tela inicial'];mi.forEach((a,i)=>{const yy=59+i*15;g.fillStyle=S.sel===i?'rgba(255,226,138,.12)':'rgba(255,255,255,.02)';g.fillRect(68,yy-8,184,13);txt((S.sel===i?'▶ ':'  ')+a,74,yy,S.sel===i?'#ffe28a':'#e7e4f2',8)});txt('W/S ou ▲▼ • E confirma • ESC fecha',77,158,'#9188bd',6)}
if(S.mode==='end'){g.fillStyle='rgba(5,4,18,.96)';g.fillRect(0,0,320,180);txt('FIM DA JORNADA',92,18,'#ffe28a',13);txt(S.endingTitle||'UM NOVO COMEÇO',82,40,'#8fffa0',10);txt('Equilíbrio final: '+Math.round(S.eq)+'%',105,55,'#fff',8);wrap(S.endingText||'Você deu um passo importante.',276).forEach((s,i)=>txt(s,22,73+i*10,'#e8e4f7',8));g.fillStyle='rgba(143,208,255,.08)';g.fillRect(18,117,284,28);wrap('Se você estiver passando por um momento difícil, converse com alguém de confiança ou procure ajuda profissional.',260).forEach((s,i)=>txt(s,30,123+i*8,'#bdb6e8',7));if(t%60<40)txt(isT?'TOQUE PARA VER OS CRÉDITOS':'PRESSIONE E PARA VER OS CRÉDITOS',72,158,'#fff',7)}
const vg=g.createRadialGradient(160,90,55,160,90,190);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.30)');g.fillStyle=vg;g.fillRect(0,0,320,180);
 if(S.fade>0){g.fillStyle='rgba(0,0,0,'+S.fade+')';g.fillRect(0,0,320,180)}}
init();
(function loop(){update();render();requestAnimationFrame(loop)})();