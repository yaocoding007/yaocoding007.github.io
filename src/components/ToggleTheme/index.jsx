/**
 * @file 
 */
import React, { useEffect, useState } from 'react'
import ICON_LIGHT from './icon/theme-light.svg'
import ICON_DARK from './icon/theme-dark.svg'


const ToggleTheme = () => {
  const isDarkLocal = !!localStorage.getItem('isDark')
  const [isDark, setIsDark] = useState(isDarkLocal)

  const changeTheme = (type) => {
    const html = document.querySelector('html')
    if(type === 'dark') {
        html.classList.add('dark')
        localStorage.setItem('isDark', 'true')
        setIsDark(true)
    }else {
        html.classList.remove('dark')
        localStorage.removeItem('isDark')
        setIsDark(false)
    }
  }
  const toggle = () => {
    if(isDark) {
        changeTheme('light')
    } else {
        changeTheme('dark')
    }
  }
  useEffect(() => {
    if(isDarkLocal) {
        changeTheme('dark')
    }
  }, [])

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
      isDark
      ? <img src={ICON_LIGHT} alt="ICON_LIGHT"></img>
      : <img src={ICON_DARK} alt="ICON_DARK"></img>
    }
  </span>
}

export default ToggleTheme

