import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Delete, Check, Pause, Play, Share2, Volume2, VolumeX, X } from 'lucide-react';
import { config } from './config/birthdayConfig.js';

const stages = ['unlock', 'balloons', 'memories', 'birthday', 'letter', 'final'];
const popText = ['A special feeling', 'Her smile', 'A promise', 'A wish'];
const colors = ['#d83f59', '#ed78a7', '#9770b9', '#c88972'];
const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -12 }, transition: { duration: .55 } };

function Ambient({ count = 20 }) {
  const reduced = useReducedMotion();
  const pieces = useMemo(() => Array.from({ length: count }, (_, i) => ({ left: `${(i * 47 + 9) % 100}%`, delay: `${(i % 9) * -.8}s`, duration: `${6 + i % 8}s`, size: `${7 + i % 11}px`, icon: i % 4 === 0 ? '✦' : i % 3 === 0 ? '♥' : '·' })), []);
  return <div className="ambient" aria-hidden="true">{pieces.map((p, i) => <span key={i} style={{ left: p.left, animationDelay: reduced ? '0s' : p.delay, animationDuration: reduced ? '12s' : p.duration, fontSize: p.size }}>{p.icon}</span>)}</div>;
}

function Progress({ stage }) {
  const idx = stages.indexOf(stage);
  return <div className="progress" aria-label={`Story step ${idx + 1} of 6`}>{stages.map((s, i) => <span key={s} className={i <= idx ? 'active' : ''} aria-hidden="true">♥</span>)}</div>;
}

function App() {
  const [stage, setStage] = useState('unlock');
  const [pin, setPin] = useState('');
  const [badPin, setBadPin] = useState(false);
  const [popped, setPopped] = useState([false, false, false, false]);
  const [openBalloon, setOpenBalloon] = useState(null);
  const [wish, setWish] = useState(false);
  const [letterOpen, setLetterOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState(0);
  const [musicOn, setMusicOn] = useState(false);
  const [musicAvailable, setMusicAvailable] = useState(true);
  const [photo, setPhoto] = useState(null);
  const [letterOpening, setLetterOpening] = useState(false);
  const [finalMessage, setFinalMessage] = useState('');
  const [shareState, setShareState] = useState('');
  const [spark, setSpark] = useState(0);
  const [countdown, setCountdown] = useState(null);
  const audioRef = useRef(null);
  const keyRef = useRef(null);
  const openingTimer = useRef(null);
  const letterText = config.loveLetter.map(p => p.text).join('\n\n');
  const totalChars = letterText.length;
  const progress = Math.min(typed, totalChars);

  useEffect(() => {
    if (!countdown) return;
    if (countdown === 'go') { const t = setTimeout(() => { setCountdown(null); setStage('final'); burst(); }, 650); return () => clearTimeout(t); }
    const t = setTimeout(() => setCountdown(v => v === 1 ? 'go' : v - 1), 850);
    return () => clearTimeout(t);
  }, [countdown]);

  useEffect(() => {
    if (!typing || showAll) return;
    const timer = setInterval(() => setTyped(n => {
      if (n >= totalChars) { setTyping(false); return totalChars; }
      return Math.min(totalChars, n + 5);
    }), 28);
    return () => clearInterval(timer);
  }, [typing, showAll, totalChars]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = config.music.volume;
    if (musicOn) audio.play().then(() => setMusicAvailable(true)).catch(() => { setMusicAvailable(false); setMusicOn(false); });
    else { audio.pause(); audio.currentTime = 0; }
  }, [musicOn]);

  useEffect(() => {
    if (stage === 'unlock') keyRef.current?.focus();
  }, [stage]);

  function burst() { setSpark(n => n + 1); }
  function unlock(value) {
    if (value.length !== 4) return;
    if (value === config.password) { setBadPin(false); burst(); setTimeout(() => setStage('balloons'), 500); }
    else { setBadPin(true); setPin(''); setTimeout(() => setBadPin(false), 1400); }
  }
  function digit(d) { if (pin.length >= 4) return; const next = pin + d; setPin(next); if (next.length === 4) unlock(next); }
  function balloon(i) {
    if (popped[i]) return;
    setPopped(old => old.map((v, n) => n === i ? true : v)); setOpenBalloon(i); burst();
  }
  function nextFromBalloons() { setStage(config.photos.length ? 'memories' : 'birthday'); }
  function openLetter() { setLetterOpen(true); setTyped(0); setShowAll(false); setTyping(true); }
  function startLetterOpening() {
    if (letterOpening) return;
    setLetterOpening(true);
    openingTimer.current = setTimeout(() => { setLetterOpening(false); openLetter(); }, 1150);
  }
  function fullLetter() { setShowAll(true); setTyping(false); setTyped(totalChars); }
  function finishLetter() { setCountdown(3); }
  function replay() {
    clearTimeout(openingTimer.current);
    setLetterOpening(false);
    setStage('unlock'); setPin(''); setBadPin(false); setPopped([false, false, false, false]); setOpenBalloon(null); setWish(false); setLetterOpen(false); setShowAll(false); setTyping(false); setTyped(0); setPhoto(null); setFinalMessage(''); setShareState(''); setCountdown(null); setMusicOn(false); burst();
  }
  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: 'A birthday surprise for Sandhya ❤️', url }); setShareState('Shared successfully ❤️'); }
      catch (e) { if (e.name !== 'AbortError') setShareState('Sharing was cancelled or unavailable.'); }
    } else {
      try { await navigator.clipboard.writeText(url); setShareState('Link copied ❤️'); }
      catch { setShareState(`Copy this link: ${url}`); }
    }
    setTimeout(() => setShareState(''), 3200);
  }
  const letterVisible = showAll ? letterText : letterText.slice(0, progress);
  const letterParagraphs = letterVisible.split('\n\n');
  let used = 0;
  const shownParagraphs = letterParagraphs.map((text, i) => {
    const source = config.loveLetter.find(p => letterText.indexOf(p.text) === used);
    used += text.length + 2;
    return <p key={i} className={source?.kind || ''}>{text}</p>;
  });

  return <main className={`app scene-${stage}`}>
    <Ambient count={stage === 'final' ? 34 : 22} />
    <div className="burst-layer" key={spark} aria-hidden="true">{spark>0&&Array.from({length:16},(_,i)=><i key={i} style={{'--angle':`${i*22.5}deg`,'--distance':`${45+(i%4)*18}px`}}>{i%3===0?'♥':'✦'}</i>)}</div>
    <audio ref={audioRef} src={config.music.src} loop preload="none" onError={() => { setMusicAvailable(false); setMusicOn(false); }} />
    <div className="topbar"><div className="brand"><span className="brand-heart">♥</span> a little love story</div><button className={`music-toggle ${!musicAvailable ? 'unavailable' : ''}`} onClick={() => musicAvailable && setMusicOn(v => !v)} aria-label={musicOn ? 'Turn music off' : 'Turn music on'} title={!musicAvailable ? 'Add a licensed audio file to public/audio/romantic-piano.mp3' : musicOn ? 'Turn music off' : 'Turn music on'}>{musicOn ? <Volume2 size={17}/> : <VolumeX size={17}/>}<span>{musicOn ? 'Music on' : 'Music off'}</span></button></div>
    <Progress stage={stage} />
    <AnimatePresence mode="wait">
      <motion.section key={stage} className="screen" {...fade}>
        {stage === 'unlock' && <div className="unlock scene-card">
          <div className={`hero-heart ${badPin ? 'shake' : ''}`} aria-hidden="true">♥</div>
          <p className="eyebrow">A private little moment</p><h1>A Little Surprise<br/>Just for You <span>❤️</span></h1>
          <p className="subtext">Someone very special deserves<br className="mobile-only"/> something magical...</p>
          <p className="prompt">Ready to unlock your little surprise, {config.recipient}?</p>
          <div className={`pin-dots ${badPin ? 'shake' : ''}`} aria-label={`${pin.length} of 4 digits entered`}>{[0,1,2,3].map(i => <span key={i} className={pin.length > i ? 'filled' : ''}>{pin.length > i ? '♥' : ''}</span>)}</div>
          <input ref={keyRef} className="sr-input" value={pin} inputMode="numeric" autoComplete="one-time-code" aria-label="Four digit surprise password" onChange={e => { const v=e.target.value.replace(/\D/g,'').slice(0,4); setPin(v); if(v.length===4) unlock(v); }} onKeyDown={e => { if(e.key==='Backspace') setPin(v=>v.slice(0,-1)); }} />
          <div className="keypad" role="group" aria-label="Password keypad">{['1','2','3','4','5','6','7','8','9','clear','0','back'].map(d => <button key={d} className={`key ${d==='clear'||d==='back'?'utility':''}`} onClick={() => d==='clear' ? setPin('') : d==='back' ? setPin(v=>v.slice(0,-1)) : digit(d)} aria-label={d==='back'?'Backspace':d==='clear'?'Clear':d}>{d==='back'?<Delete size={18}/>:d==='clear'?<X size={18}/>:d}</button>)}</div>
          {badPin ? <p className="error" role="alert">Oops! One more try, my love ❤️</p> : <p className="hint">{config.passwordHint}</p>}
        </div>}
        {stage === 'balloons' && <div className="story-wrap balloons-scene"><p className="eyebrow">A little something from my heart</p><h1>Four Balloons,<br/>Four Pieces of My Heart <span>❤️</span></h1><p className="subtext">Touch every balloon and discover<br className="mobile-only"/> what's inside...</p>
          <div className="balloon-grid">{colors.map((color,i)=><button key={i} className={`balloon ${popped[i]?'popped':''}`} style={{'--balloon':color,'--float-delay':`${i*.34}s`}} disabled={popped[i]} onClick={()=>balloon(i)} aria-label={`Open balloon ${i+1}: ${popText[i]}`}><span className="balloon-shine"/><span className="balloon-heart">♥</span><span className="balloon-knot"/><span className="string"/></button>)}</div>
          <div className="balloon-count">{popped.filter(Boolean).length} <span>of 4 opened</span></div>
          {popped.every(Boolean)&&<motion.div {...fade} className="all-popped"><h2>Four Little Surprises,<br/>One Big Birthday Wish 💌</h2><button className="button primary" onClick={nextFromBalloons}>Continue to Your Birthday Surprise <span>→</span></button></motion.div>}
        </div>}
        {stage === 'memories' && <div className="story-wrap"><p className="eyebrow">A little album of us</p><h1>Our Beautiful Memories <span>❤️</span></h1><p className="subtext">Some moments deserve to stay in our hearts forever.</p><div className="photo-grid">{config.photos.slice(0,5).map((p,i)=><button className="photo-card" key={p.src} onClick={()=>setPhoto(p)}><img src={p.src} alt={p.alt||p.caption||'A special memory'} onError={e=>{e.currentTarget.style.display='none'; e.currentTarget.parentElement.classList.add('photo-missing')}}/><span className="photo-fallback">✦</span><strong>{p.caption}</strong>{p.date&&<small>{p.date}</small>}</button>)}</div><button className="button primary" onClick={()=>setStage('birthday')}>Continue <span>→</span></button></div>}
        {stage === 'birthday' && <div className="story-wrap birthday-scene"><p className="eyebrow">Today is all about you</p><div className={`cake ${wish?'wished':''}`} aria-label="A birthday cake with candles"><div className="candle-row">{[0,1,2].map(n=><span className="candle" key={n}><i/></span>)}</div><div className="cake-top"/><div className="cake-body"><span>♥</span><span>♥</span><span>♥</span></div><div className="cake-base"/></div><h1 className="birthday-title">HAPPY BIRTHDAY,<br/> MY DEAR SANDHYA! <span>❤️</span></h1><p className="birthday-copy">Today is not just another day. It is the day someone truly special came into this world.<br/><br/>I hope your life is filled with happiness, beautiful memories, peaceful moments, endless smiles, and dreams that come true.</p>
          {!wish ? <button className="button primary" onClick={()=>{setWish(true);burst();}}>Make a Wish, My Love ✨</button> : <><p className="wish-copy">Close your eyes, make a beautiful wish, and believe in all the wonderful things waiting for you. ❤️</p><p className="eyebrow last-thing">One Last Thing... I Wrote This Just for You 💌</p><button className="button primary" onClick={()=>setStage('letter')}>Open My Heart</button></>}</div>}
        {stage === 'letter' && <div className="story-wrap letter-scene"><p className="eyebrow">A note from my heart</p><h1>Sandhya, there are some feelings<br className="desktop-only"/> my heart wants to tell you...</h1>
          {!letterOpen ? <div className={`envelope-wrap ${letterOpening?'opening':''}`}><div className="envelope"><div className="envelope-paper"/><div className="envelope-flap"/><div className="wax">♥</div></div><button className="button primary" disabled={letterOpening} onClick={startLetterOpening}>{letterOpening?'Opening your letter...':'Open My Heart ❤️'}</button></div> : <div className="letter-card">
            <div className="letter-controls">{progress<totalChars&&!showAll&&<button className="text-button" onClick={()=>setTyping(v=>!v)}>{typing?<><Pause size={16}/> Pause</>:<><Play size={16}/> Resume</>}</button>}<button className="text-button" onClick={fullLetter}><Check size={16}/> Show Full Letter</button></div>
            <article className="letter-paper" aria-live="polite">{shownParagraphs}{typing&&!showAll&&<span className="type-caret"/>}{progress>=totalChars&&<div className="letter-heart">♥</div>}</article>
            {progress>=totalChars&&<div className="letter-end"><p>Some feelings are too special to fit into a few words... ❤️</p><button className="button primary" onClick={finishLetter}>Read My Final Wish <span>→</span></button></div>}
          </div>}
        </div>}
        {stage === 'final' && <div className="story-wrap final-scene"><p className="eyebrow">For you, Sandhya</p><div className="final-heart" key={spark}>♥</div><div className="firework-field" key={`fw-${spark}`}>{Array.from({length:18},(_,i)=><i key={i} style={{'--i':i}}/>)}</div><h1>ONCE AGAIN, HAPPY BIRTHDAY,<br/> MY DEAR SANDHYA! <span>❤️🎂</span></h1><p className="telugu final-telugu">నీ జీవితం ఆనందంతో నిండిపోవాలి. నీ ప్రతి కల నిజం కావాలి. నీ ముఖంలో చిరునవ్వు ఎప్పటికీ ఇలాగే ఉండాలి. ❤️</p><p className="final-copy">No matter how many birthdays come and go, I hope every year brings you more happiness, more beautiful memories, and more reasons to smile.<br/><br/>You are special to me, Sandhya. I hope this little surprise makes your birthday unforgettable. ❤️</p><p className="signature">Forever Sending You Love ❤️</p><p className="dedication">{config.dedication}</p><div className="final-actions"><button className="button primary" onClick={()=>{setFinalMessage(config.finalMessages[Math.floor(Math.random()*config.finalMessages.length)]);burst();}}>Feel the Love ❤️</button><button className="button secondary" onClick={replay}>Replay Our Love Story 💕</button><button className="button ghost" onClick={share}><Share2 size={17}/> Share This Surprise</button></div>{finalMessage&&<motion.p {...fade} className="random-message">{finalMessage}</motion.p>}{shareState&&<p className="share-status" role="status">{shareState}</p>}</div>}
      </motion.section>
    </AnimatePresence>
    {openBalloon!==null&&<div className="modal-backdrop" onClick={()=>setOpenBalloon(null)}><motion.div {...fade} className="message-card" role="dialog" aria-modal="true" aria-label={popText[openBalloon]} onClick={e=>e.stopPropagation()}><button className="close" aria-label="Close message" onClick={()=>setOpenBalloon(null)}><X/></button><span className="tiny-heart">♥</span><p className="eyebrow">{popText[openBalloon]}</p><h2>{config.balloonMessages[openBalloon]}</h2><button className="button primary" onClick={()=>setOpenBalloon(null)}>Keep this in my heart</button></motion.div></div>}
    {photo&&<div className="modal-backdrop photo-modal" onClick={()=>setPhoto(null)}><div className="photo-view" role="dialog" aria-modal="true" aria-label="Memory photo" onClick={e=>e.stopPropagation()}><button className="close" aria-label="Close photo" onClick={()=>setPhoto(null)}><X/></button><img src={photo.src} alt={photo.alt||photo.caption||'A special memory'}/><div><strong>{photo.caption}</strong>{photo.note&&<p>{photo.note}</p>}</div></div></div>}
    {countdown!==null&&<div className="countdown-overlay" role="dialog" aria-modal="true" aria-label="Final birthday countdown"><p className="eyebrow">One final wish for you, Sandhya...</p><div className="countdown-number">{countdown==='go'?'❤️':countdown}</div><button className="button secondary" onClick={()=>{setCountdown(null);setStage('final');burst();}}>Skip countdown</button></div>}
  </main>;
}

export default App;
