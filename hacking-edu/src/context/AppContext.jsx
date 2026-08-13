import { createContext, useContext, useState } from 'react'

const AppContext = createContext()

export function AppProvider({ children }) {
  // Locked to Arabic + light theme. Language and theme switching were removed,
  // but the toggle functions are kept as no-ops so existing consumers that
  // still call them don't break.
  const lang = 'ar'
  const theme = 'light'
  const toggleLang = () => {}
  const toggleTheme = () => {}
  const [cipherShift, setCipherShift] = useState(0)

  return (
    <AppContext.Provider value={{ lang, toggleLang, cipherShift, setCipherShift, theme, toggleTheme }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
