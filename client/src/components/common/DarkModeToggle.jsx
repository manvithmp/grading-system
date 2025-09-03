import useDarkMode from '../../hooks/useDarkMode.js';

export default function DarkModeToggle(){
  const [mode,setMode] = useDarkMode();
  return (
    <button className="btn ghost" onClick={()=>setMode(mode==='light'?'dark':'light')}>
      {mode==='light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}
