;(()=>{

    // ===== Utility helpers =====
    const qs = s => document.querySelector(s);
    const boardEl = qs('#board');
    const gridEl = qs('#grid');
    const scoreEl = qs('#score');
    const bestEl = qs('#best');
    const overlay = qs('#overlay');
    const overlayTitle = qs('#overlayTitle');
    const overlayMsg = qs('#overlayMsg');
    const toastEl = qs('#toast');

    const SIZE = 4;
    const GAP = (()=>{
      const v = getComputedStyle(document.documentElement).getPropertyValue('--gap').trim();
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : 10;
    })(); // px, must match CSS --gap

    const LS_BEST = 'game2048:best';
    const LS_SOUND = 'game2048:volume';
    const LS_GAME_STATE = 'game2048:state';

    let volume = parseInt(localStorage.getItem(LS_SOUND) || '20', 10) / 100;
    let best = parseInt(localStorage.getItem(LS_BEST) || '0', 10);
    bestEl.textContent = best;

    let hintTimeout;

    function resetHintTimer() {
      clearTimeout(hintTimeout);
      hideHints();
      hintTimeout = setTimeout(showHints, 4000);
    }

    function showHints() {
      const mergeable = new Map(); // id -> direction
      for(let r=0; r<SIZE; r++) for(let c=0; c<SIZE; c++) {
        const t = board[r][c];
        if(!t) continue;
        const dirs = [[0,-1,'left'],[0,1,'right'],[-1,0,'up'],[1,0,'down']];
        for(const [dr,dc,dir] of dirs) {
          const nr = r+dr, nc = c+dc;
          if(nr>=0 && nr<SIZE && nc>=0 && nc<SIZE) {
            const nt = board[nr][nc];
            if(nt && nt.value === t.value) {
              if(!mergeable.has(t.id)) mergeable.set(t.id, dir);
            }
          }
        }
      }
      for(const [id, dir] of mergeable) {
        const el = tiles.get(id);
        if(el) {
          el.classList.add('hint', `hint-${dir}`);
        }
      }
    }

    function hideHints() {
      for(const el of tiles.values()) {
        el.classList.remove('hint', 'hint-left', 'hint-right', 'hint-up', 'hint-down');
      }
    }
    let ac; // AudioContext lazy
    let audioUnlocked = false;
    function beep(value=2){
      if(volume === 0) return;
      // If audio isn't unlocked yet (common on mobile/WebView), skip quietly.
      if(!audioUnlocked) return;
      try{
        const o = ac.createOscillator();
        const g = ac.createGain();
        o.type = 'sine';
        o.frequency.value = 220 + Math.log2(value) * 60;

        const now = ac.currentTime;
        g.gain.setValueAtTime(0.0001 * volume, now);
        g.gain.exponentialRampToValueAtTime(1 * volume, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001 * volume, now + 0.12);

        o.connect(g).connect(ac.destination);
        o.start(now);
        o.stop(now + 0.13);
      }catch(e){/* ignore */}
    }


    let toastTimer;
    function showToast(msg, ms=1600){
      if(!toastEl) return;
      toastEl.textContent = msg;
      toastEl.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(()=>toastEl.classList.remove('show'), ms);
    }


    async function unlockAudio(){
      if(volume === 0) return;
      try{
        ac = ac || new (window.AudioContext||window.webkitAudioContext)();
        // Resume is async in many browsers. Must be called from a user gesture handler.
        if(ac.state === 'suspended') await ac.resume();

        // iOS/WebView sometimes needs a real playback to unlock. Use a tiny silent buffer.
        if(!audioUnlocked){
          const buffer = ac.createBuffer(1, 1, 22050);
          const src = ac.createBufferSource();
          src.buffer = buffer;
          src.connect(ac.destination);
          src.start(0);
          audioUnlocked = true;
        }
      }catch(e){
        // If unlock fails, keep audioUnlocked=false
      }
    }

    function initAudio(){
      // Fire-and-forget unlock. Called on user gestures.
      unlockAudio();
    }



    // ===== Game state =====
    let board, score, idCounter, animating;
    let canUndo = false;
    let hasWon = false;
    let prevState = null;
    let displayedScore = 0;

    function animateScore(target) {
      const start = displayedScore;
      const diff = target - start;
      if (diff <= 0) {
        scoreEl.textContent = target;
        displayedScore = target;
        return;
      }
      scoreEl.classList.add('score-bump');
      setTimeout(() => scoreEl.classList.remove('score-bump'), 300);
      const duration = 600; // ms
      const startTime = Date.now();
      function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease out cubic
        const current = start + diff * eased;
        scoreEl.textContent = Math.floor(current);
        if (progress < 1) requestAnimationFrame(update);
        else displayedScore = target;
      }
      update();
    }
    const tiles = new Map(); // id -> DOM element

    let tileSize = 0;

    function saveState(){
      prevState = {
        board: board.map(row => row.map(cell => cell ? {...cell} : null)),
        score,
        idCounter,
        tilesData: []
      };
      for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
        const t = board[r][c];
        if(t) prevState.tilesData.push({id: t.id, value: t.value, r, c});
      }
    }

    function saveGameState(){
      const state = {
        board: board.map(row => row.map(cell => cell ? {...cell} : null)),
        score,
        idCounter,
        hasWon,
        tilesData: []
      };
      for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++){
        const t = board[r][c];
        if(t) state.tilesData.push({id: t.id, value: t.value, r, c});
      }
      localStorage.setItem(LS_GAME_STATE, JSON.stringify(state));
    }

    function loadGameState(){
      const saved = localStorage.getItem(LS_GAME_STATE);
      if(!saved) return false;
      try{
        const state = JSON.parse(saved);
        emptyBoard();
        board = state.board.map(row => row.map(cell => cell ? {...cell} : null));
        score = state.score;
        idCounter = state.idCounter;
        hasWon = state.hasWon || false;
        scoreEl.textContent = score;
        displayedScore = score;
        for(const td of state.tilesData){
          mountTile(td.r, td.c, td.id, td.value);
        }
        canUndo = false;
        qs('#undoBtn').disabled = true;
        return true;
      }catch(e){
        console.warn('Failed to load game state', e);
        return false;
      }
    }

    function computeTileSize(){
      const innerW = boardEl.clientWidth - (GAP*2);
      const innerH = boardEl.clientHeight - (GAP*2);
      const inner = Math.max(0, (innerH > 0 ? Math.min(innerW, innerH) : innerW));
      tileSize = (inner - GAP*(SIZE-1)) / SIZE;
      return tileSize;
    }

    function applyTileSize(el){
      if(!tileSize) computeTileSize();
      el.style.width = tileSize + 'px';
      el.style.height = tileSize + 'px';
    }

    function relayoutAll(){
      computeTileSize();
      for(let r=0;r<SIZE;r++){
        for(let c=0;c<SIZE;c++){
          const t = board?.[r]?.[c];
          if(!t) continue;
          const el = tiles.get(t.id);
          if(!el) continue;
          applyTileSize(el);
          el.style.transform = posToTransform(r,c);
        }
      }
    }


    function emptyBoard(){
      board = Array.from({length:SIZE}, ()=>Array.from({length:SIZE}, ()=>null));
      score = 0; displayedScore = 0; idCounter = 1; animating = false;
      tiles.forEach(el=>el.remove());
      tiles.clear();
      scoreEl.textContent = '0';
      gridBuild();
    }

    function gridBuild(){
      gridEl.innerHTML = '';
      for(let i=0;i<SIZE*SIZE;i++){
        const cell = document.createElement('div');
        cell.className='cell';
        gridEl.appendChild(cell);
      }
    }

    function spawn(rand2only=false){
      const empty=[];
      for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++) if(!board[r][c]) empty.push([r,c]);
      if(!empty.length) return false;
      const [r,c] = empty[Math.floor(Math.random()*empty.length)];
      const value = rand2only?2 : (Math.random()<0.9?2:4);
      const id = idCounter++;
      board[r][c] = {id,value, merged:false};
      mountTile(r,c,id,value,true);
      return true;
    }

    function posToTransform(r,c){
      if(!tileSize) computeTileSize();
      const x = GAP + c*(tileSize + GAP);
      const y = GAP + r*(tileSize + GAP);
      return `translate(${x}px, ${y}px)`;
    }

    function posToTransform_UNUSED(){
      const w = boardEl.clientWidth - (GAP*2);
      const tileSize = (w - (GAP*3)) / 4; // legacy

      const x = GAP + c*(tileSize + GAP);
      const y = GAP + r*(tileSize + GAP);
      return `translate(${x}px, ${y}px)`;
    }

    function mountTile(r,c,id,value,newFlag=false){
      const el = document.createElement('div');
      el.className = 'tile';
      el.dataset.id = id;
      el.dataset.value = value;

      const inner = document.createElement('div');
      inner.className = 'tile-inner' + (newFlag ? ' tile-new' : '');
      inner.textContent = value;

      el.appendChild(inner);
      tiles.set(id, el);
      boardEl.appendChild(el);

      applyTileSize(el);
      el.style.transform = posToTransform(r,c);
    }

    function updateTile(id, r, c, value){
      const el = tiles.get(id);
      if(!el) return;
      applyTileSize(el);
      el.style.transform = posToTransform(r,c);
      if(el.dataset.value != value){
        el.dataset.value = value;
        el.firstChild.textContent = value;
      }
    }

    function removeTile(id){
      const el = tiles.get(id); if(!el) return; el.remove(); tiles.delete(id);
    }

    function setScore(s){
      score = s;
      animateScore(s);
      if(s>best){ best=s; bestEl.textContent=s; localStorage.setItem(LS_BEST, String(s)); }
    }

    function canMove(){
      for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++){
        const t=board[r][c]; if(!t) return true;
        if(r<SIZE-1 && board[r+1][c] && board[r+1][c].value===t.value) return true;
        if(c<SIZE-1 && board[r][c+1] && board[r][c+1].value===t.value) return true;
      }
      return false;
    }

    // ===== Movement logic =====
    const DIRS = {left:[0,-1], right:[0,1], up:[-1,0], down:[1,0]}

    async function move(dir){
      resetHintTimer();
      if(animating) return; animating=true;
      saveState();
      const [dr,dc]=DIRS[dir];
      let moved=false;

      // order of traversal matters
      const rows = [...Array(SIZE).keys()];
      const cols = [...Array(SIZE).keys()];
      if(dr>0) rows.reverse();
      if(dc>0) cols.reverse();

      for(const r of rows){
        for(const c of cols){
          const t = board[r][c]; if(!t) continue;
          let nr=r, nc=c; // next position
          while(true){
            const rr = nr+dr, cc = nc+dc;
            if(rr<0||rr>=SIZE||cc<0||cc>=SIZE) break;
            const ahead = board[rr][cc];
            if(!ahead){ nr=rr; nc=cc; moved=true; }
            else if(!ahead.merged && ahead.value===t.value){
              nr=rr; nc=cc; // merge destination
              break;
            }else break;
          }
          if(nr===r && nc===c) continue;
          moved = true; // any position change is a valid move
          // move or merge
          const dest = board[nr][nc];
          if(dest && dest.value===t.value){
            // merge
            removeTile(dest.id);
            board[nr][nc] = {id:t.id, value:t.value*2, merged:true};
            board[r][c]=null;
            updateTile(t.id,nr,nc,t.value*2);
            const el = tiles.get(t.id);
            const inner = el?.firstChild;
            inner?.classList.add('tile-merge');
            setTimeout(()=>inner?.classList.remove('tile-merge'),180);
            setScore(score + board[nr][nc].value);
            beep(board[nr][nc].value);
          }else{
            // move only
            board[nr][nc] = {id:t.id, value:t.value, merged:false};
            board[r][c]=null;
            updateTile(t.id,nr,nc,t.value);
          }
        }
      }
      // clear merged flags
      for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) if(board[r][c]) board[r][c].merged=false;

      if(moved){
        navigator.vibrate?.(50); // haptic feedback
        boardEl.classList.add('tilt');
        setTimeout(() => boardEl.classList.remove('tilt'), 150);
        await nextFrame();
        spawn();
        saveGameState();
        if(!canMove() && !hasEmpty()) endGame(false);
        canUndo = true;
        qs('#undoBtn').disabled = false;
      } else {
        navigator.vibrate?.([30, 50, 30]); // haptic feedback for invalid move
        showToast('No move that way', 700);
      }
      animating=false;
    }

    function hasEmpty(){
      for(let r=0;r<SIZE;r++) for(let c=0;c<SIZE;c++) if(!board[r][c]) return true; return false;
    }

    function nextFrame(){return new Promise(res=>requestAnimationFrame(()=>res()));}

    function endGame(win){
      overlayTitle.textContent = win? 'You Win! 🎉' : 'Game Over';
      overlayMsg.textContent = win? 'You reached 2048. Keep playing or start a new run.' : 'No moves left. Try again?';
      qs('#closeOverlay').textContent = 'Close';
      qs('#tryAgain').textContent = 'Try Again';
      qs('#tryAgain').onclick = () => { resetHintTimer(); initAudio(); reset(true); };
      qs('#closeOverlay').onclick = () => { resetHintTimer(); overlay.classList.remove('show'); };
      if(win) boardEl.classList.add('win');
      overlay.classList.add('show');
      showToast(win? '2048 reached!' : 'Game over', 1200);
    }

    function checkWin(){
      if(hasWon) return false;
      for(let r=0;r<SIZE;r++)for(let c=0;c<SIZE;c++) if(board[r][c]?.value===2048){ hasWon = true; endGame(true); return true; }
      return false;
    }

    function showConfirmation(title, msg, onConfirm){
      overlayTitle.textContent = title;
      overlayMsg.textContent = msg;
      qs('#closeOverlay').textContent = 'Cancel';
      qs('#tryAgain').textContent = 'New Game';
      qs('#tryAgain').onclick = () => { overlay.classList.remove('show'); onConfirm(); };
      qs('#closeOverlay').onclick = () => { overlay.classList.remove('show'); };
      overlay.classList.add('show');
    }

    function reset(newSession=true){
      emptyBoard();
      boardEl.classList.remove('win');
      canUndo = false;
      prevState = null;
      hasWon = false;
      qs('#undoBtn').disabled = true;
      spawn(true); spawn(true); // guaranteed 2s to begin
      if(newSession) {
        setScore(0);
        localStorage.removeItem(LS_GAME_STATE);
      }
      overlay.classList.remove('show');
      showToast('Swipe to begin', 2000);
    }

    // ===== Controls =====
    document.addEventListener('keydown', e=>{
      resetHintTimer();
      initAudio();
      const k=e.key.toLowerCase();
      if(k==='arrowleft'||k==='a') move('left');
      else if(k==='arrowright'||k==='d') move('right');
      else if(k==='arrowup'||k==='w') move('up');
      else if(k==='arrowdown'||k==='s') move('down');
    })

    // touch gestures
    let startX=0,startY=0,isTouch=false;
    boardEl.addEventListener('touchstart', e=>{ resetHintTimer(); initAudio(); isTouch=true; const t=e.changedTouches[0]; startX=t.clientX; startY=t.clientY; }, {passive:true});
    // pointer events (desktop + some mobile browsers)
    boardEl.addEventListener('pointerdown', ()=>{ resetHintTimer(); initAudio(); }, {passive:true});
    boardEl.addEventListener('touchend', e=>{
      if(!isTouch) return; const t=e.changedTouches[0];
      const dx=t.clientX - startX; const dy=t.clientY - startY; const adx=Math.abs(dx), ady=Math.abs(dy);
      const TH=24; // swipe threshold px
      if(adx<TH && ady<TH) return; // ignore taps
      if(adx>ady){ if(dx>0) move('right'); else move('left'); }
      else { if(dy>0) move('down'); else move('up'); }
      isTouch=false;
    }, {passive:true});

    // Buttons
    qs('#newGame').addEventListener('click', ()=>{
      resetHintTimer();
      initAudio();
      if(score > 0 || tiles.size > 2){
        showConfirmation('New Game', 'You\'ll lose your current progress. Start a new game?', () => reset(true));
      } else {
        reset(true);
      }
    });
    qs('#tryAgain').addEventListener('click', ()=>{ resetHintTimer(); initAudio(); reset(true); });
    qs('#closeOverlay').addEventListener('click', ()=>{ resetHintTimer(); overlay.classList.remove('show'); });
    qs('#undoBtn').addEventListener('click', ()=>{
      resetHintTimer();
      if(!canUndo || animating) return;
      initAudio();
      // restore
      emptyBoard();
      board = prevState.board.map(row => row.map(cell => cell ? {...cell} : null));
      score = prevState.score;
      idCounter = prevState.idCounter;
      scoreEl.textContent = score;
      for(const td of prevState.tilesData){
        mountTile(td.r, td.c, td.id, td.value);
      }
      canUndo = false;
      qs('#undoBtn').disabled = true;
      showToast('Undid last move', 1000);
    });

    const volumeControl = qs('#volumeControl');
    const soundBtn = qs('#soundBtn');
    const volumeSlider = qs('.volume-slider');
    let volumeTimeout;

    function updateSoundBtn() {
      soundBtn.textContent = `🔊 Sound ${Math.round(volume * 100)}%`;
    }

    volumeControl.value = Math.round(volume * 100);
    updateSoundBtn();

    soundBtn.addEventListener('click', () => {
      resetHintTimer();
      soundBtn.style.display = 'none';
      volumeSlider.style.display = 'flex';
      clearTimeout(volumeTimeout);
      volumeTimeout = setTimeout(() => {
        volumeSlider.style.display = 'none';
        soundBtn.style.display = 'block';
      }, 2000);
    });

    volumeControl.addEventListener('input', (e) => {
      resetHintTimer();
      volume = e.target.value / 100;
      localStorage.setItem(LS_SOUND, e.target.value);
      updateSoundBtn();
      if(volume > 0) initAudio();
      clearTimeout(volumeTimeout);
      volumeTimeout = setTimeout(() => {
        volumeSlider.style.display = 'none';
        soundBtn.style.display = 'block';
      }, 2000);
    });

    // Help modal reuse of overlay
    qs('#helpBtn').addEventListener('click', ()=>{
      resetHintTimer();
      overlayTitle.textContent='How to Play';
      overlayMsg.innerHTML = `
        <ul class="list">
          <li>Combine tiles with the same number to add them up.</li>
          <li>Swipe (mobile) or use arrow / WASD keys (desktop).</li>
          <li>Each move spawns a new tile. Plan ahead.</li>
          <li>Reach <b>2048</b> to win. Keep going for higher scores.</li>
        </ul>`;
      overlay.classList.add('show');
    });

    // Init
    computeTileSize();
    if(!loadGameState()){
      reset(true);
    }
    resetHintTimer();
    window.addEventListener('resize', ()=>{ relayoutAll(); });
    window.addEventListener('load', ()=>{ requestAnimationFrame(relayoutAll); });

    if('serviceWorker' in navigator){
      window.addEventListener('load', ()=>{
        navigator.serviceWorker.register('./sw.js').catch(()=>{});
      });
    }

    // Observe merges to check win
    const obs = new MutationObserver(()=>{ checkWin(); });
    obs.observe(boardEl, {subtree:true, attributes:true, attributeFilter:['data-value']});
  })();