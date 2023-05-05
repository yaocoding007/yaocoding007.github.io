/**
 * @file 
 */
import React, { useEffect, useState } from 'react'
import ICON_LIGHT from './icon/theme-light.svg'
import ICON_DARK from './icon/theme-dark.svg'


const ToggleTheme = () => {
  const themeLocal = localStorage.getItem('theme')
  const preTheme = themeLocal ?? 'dark'
  const [theme, setTheme] = useState(preTheme)

  const changeTheme = (type) => {
    const html = document.querySelector('html')
    setTheme(type)
    if(type === 'light') {
        html.classList.add('light')
        localStorage.setItem('theme', 'light')
    }else {
        html.classList.remove('light')
        localStorage.setItem('theme', 'dark')
    }
  }
  const toggle = () => {
    if(theme === 'dark') {
        changeTheme('light')
    } else {
        changeTheme('dark')
    }
  }
  useEffect(() => {
    changeTheme(theme)
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
      theme === 'dark'
      ? <img src={ICON_LIGHT} alt="ICON_LIGHT"></img>
      : <img src={ICON_DARK} alt="ICON_DARK"></img>
    }
  </span>
}

export default ToggleTheme

