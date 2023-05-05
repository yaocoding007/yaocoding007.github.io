/**
 * @file 
 */
import React, { useEffect, useState } from 'react'


const ToggleTheme = () => {
  const preFlag = localStorage.getItem('themeFlag')
  console.log('lly-log -- preFlag --->', preFlag);
  const [isDarkFlag, setIsDarkFlag] = useState(preFlag)

  const toggle = (flag) => {
    const html = document.querySelector('html')
    if(flag) {
      html.classList.remove('dark')
      localStorage.removeItem('themeFlag')
    } else {
      html.classList.add('dark')
      localStorage.setItem('themeFlag', 'true')
    }
    setIsDarkFlag(!isDarkFlag)
  }

  useEffect(() => {
    toggle(isDarkFlag)
  }, [])

  return <span 
    style={{
      display: 'inline-flex',
      height: '20px',
      width: '20px',
      cursor: 'pointer',
    }} 
    onClick={() => toggle(isDarkFlag)}
  >
    {
      isDarkFlag 
      ? <img src="/icon/theme-light.svg" alt=""></img>
      : <img src="/icon/theme-dark.svg" alt=""></img>
    }
  </span>
}

export default ToggleTheme

