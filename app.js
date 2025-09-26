/* ===== Game3.2 / app.js (fix) =====
   Ожидается HTML:
   <div id="board" class="board"></div>
   <div class="hud">
     <button id="newGame">Новая игра</button>
     <span id="moves">Ходы: 0</span>
     <span id="time">Время: 00:00</span>
   </div>
*/

(() => {
  const N = 4;
  const board = document.getElementById('board');
  const newGameBtn = document.getElementById('newGame');
  const movesEl = document.getElementById('moves');
  const timeEl  = document.getElementById('time');

  let state = goal();
  let moves = 0;
  let seconds = 0;
  let timerId = null;

  function goal(){ return [...Array(15).keys()].map(n => n + 1).concat(0); }
  function indexToRC(i){ return { r: Math.floor(i/N), c: i%N }; }
  function rcToIndex(r,c){ return r*N + c; }

  function isSolvable(a){
    const tiles = a.filter(x => x !== 0);
    let inv = 0;
    for (let i=0;i<tiles.length-1;i++){
      for (let j=i+1;j<tiles.length;j++){
        if (tiles[i] > tiles[j]) inv++;
      }
    }
    const blankIdx = a.indexOf(0);
    const blankRowFromTop = Math.floor(blankIdx / N);
    const blankRowFromBottom = N - blankRowFromTop;
    return ((inv + blankRowFromBottom) % 2) === 1;
  }

  function shuffleSolvable(){
    const a = goal();
    do {
      for (let i=a.length-1;i>0;i--){
        const k = Math.floor(Math.random()*(i+1));
        [a[i], a[k]] = [a[k], a[i]];
      }
    } while (!isSolvable(a) || isTriviallySolved(a));
    return a;
  }

  function isTriviallySolved(a){
    for (let i=0;i<16;i++) if (a[i] !== goal()[i]) return false;
    return true;
  }

  function canSwap(i,j){
    const A=indexToRC(i), B=indexToRC(j);
    return Math.abs(A.r-B.r)+Math.abs(A.c-B.c)===1;
  }

  function fmt(t){
    const m = Math.floor(t/60).toString().padStart(2,'0');
    const s = (t%60).toString().padStart(2,'0');
    return `${m}:${s}`;
  }

  function startTimer(){
    stopTimer();
    seconds = 0;
    timerId = setInterval(()=>{
      seconds++;
      timeEl && (timeEl.textContent = `Время: ${fmt(seconds)}`);
    }, 1000);
  }
  function stopTimer(){
    if (timerId) { clearInterval(timerId); timerId = null; }
  }

  function render(){
    board.innerHTML = '';
    state.forEach((n,i)=>{
      const {r,c} = indexToRC(i);
      const el = document.createElement('button');
      el.className = n===0 ? 'tile empty' : 'tile';
      el.style.gridRow = (r+1);
      el.style.gridColumn = (c+1);
      el.dataset.i = i;
      el.textContent = n===0 ? '' : n;
      el.addEventListener('click', onTileClick);
      addTouchHandlers(el);
      board.appendChild(el);
    });
    movesEl && (movesEl.textContent = `Ходы: ${moves}`);
    timeEl  && (timeEl.textContent  = `Время: ${fmt(seconds)}`);
  }

  function onTileClick(e){
    const i = Number(e.currentTarget.dataset.i);
    moveAt(i, true);
  }

  function animateSwap(i, blank){
    const tiles = board.querySelectorAll('.tile');
    const a = board.querySelector(`.tile[data-i="${i}"]`);
    const b = board.querySelector(`.tile[data-i="${blank}"]`);
    if (!a || !b) return;
    a.classList.add('swap');
    b.classList.add('swap');
    setTimeout(()=>{ a.classList.remove('swap'); b.classList.remove('swap'); }, 150);
  }

  function moveAt(i, withAnim=false){
    const blank = state.indexOf(0);
    if (!canSwap(i, blank)) return;
    if (withAnim) animateSwap(i, blank);
    [state[i], state[blank]] = [state[blank], state[i]];
    moves++;
    render();
    checkWin();
  }

  function checkWin(){
    for (let i=0;i<15;i++) if (state[i]!==i+1) return;
    if (state[15]!==0) return;
    stopTimer();
    board.classList.add('won');
    // alert(`Собрано за ${fmt(seconds)} с ${moves} ходами`);
  }

  // Тач-жест: свайп по пустой не нужен; по плитке — двигаем если рядом пустота.
  function addTouchHandlers(el){
    let sx=0, sy=0;
    el.addEventListener('touchstart', (e)=>{
      const t = e.touches[0];
      sx = t.clientX; sy = t.clientY;
    }, {passive:true});
    el.addEventListener('touchend', (e)=>{
      const dx = (e.changedTouches[0].clientX - sx);
      const dy = (e.changedTouches[0].clientY - sy);
      const i = Number(el.dataset.i);
      const blank = state.indexOf(0);
      const {r,c} = indexToRC(i);
      // Жесты нестрогие: определяем главный вектор
      if (Math.abs(dx) > Math.abs(dy)) {
        // горизонт
        if (dx > 20) {
          // свайп вправо: значит плитка идёт вправо → пустая должна быть справа
          const j = rcToIndex(r, c+1);
          if (j === blank) moveAt(i, true);
        } else if (dx < -20) {
          // влево
          const j = rcToIndex(r, c-1);
          if (j === blank) moveAt(i, true);
        }
      } else {
        // вертикаль
        if (dy > 20) {
          // вниз
          const j = rcToIndex(r+1, c);
          if (j === blank) moveAt(i, true);
        } else if (dy < -20) {
          // вверх
          const j = rcToIndex(r-1, c);
          if (j === blank) moveAt(i, true);
        }
      }
    }, {passive:true});
  }

  function newGame(){
    state = shuffleSolvable();
    moves = 0;
    board.classList.remove('won');
    render();
    startTimer();
  }

  newGameBtn && newGameBtn.addEventListener('click', newGame);

  // Старт
  render();
  newGame();
})();
