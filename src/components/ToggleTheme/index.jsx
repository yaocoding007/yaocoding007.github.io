/**
 * @file 
 */
import React, { useRef } from 'react'
import ICON_LIGHT from './icon/theme-light.svg'
import ICON_DARK from './icon/theme-dark.svg'


const ToggleTheme = () => {
  const isDarkLocal = localStorage.getItem('isDark') 
  console.log('lly-log -- isDarkLocal --->', isDarkLocal);
  const isDark = useRef(isDarkLocal)

  const toggle = () => {
    const html = document.querySelector('html')
    if(isDark.current) {
      html.classList.remove('dark')
      localStorage.removeItem('isDark')
      isDark.current = false
    } else {
      html.classList.add('dark')
      localStorage.setItem('isDark', 'true')
      isDark.current = true
    }
  }

  return <span 
    style={{
      display: 'inline-flex',
      height: '20px',
      width: '20px',
      cursor: 'pointer',
    }} 
    onClick={toggle}
  >
    {
      isDark.current 
      ? <img src={ICON_LIGHT} alt="ICON_LIGHT"></img>
      : <img src={ICON_DARK} alt="ICON_DARK"></img>
    }
  </span>
}

export default ToggleTheme

