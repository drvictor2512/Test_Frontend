import React, { useState } from 'react'
import './App.css'
import AuthPage from './AuthPage'
import Home from './Home'

function App() {
  const [loggedIn, setLoggedIn] = useState(!!localStorage.getItem('token'))

  return (
    <div>
      {loggedIn ? <Home onLogout={() => setLoggedIn(false)} /> : <AuthPage onLogin={() => setLoggedIn(true)} />}
    </div>
  )
}

export default App
