import {useEffect,useState} from 'react';

export default function useDarkMode(){
  const [mode,setMode]=useState(()=>localStorage.getItem('theme')||'light');
  useEffect(()=>{
    document.documentElement.dataset.theme=mode;
    localStorage.setItem('theme',mode);
  },[mode]);
  return [mode,setMode];
}
