'use client'
import { useState, useEffect } from 'react'

const ADMIN_PASSWORD = 'sow2025'
const SESSION_KEY    = 'sow-admin'

export function useAdminAuth() {
  const [authed,   setAuthed]  = useState(false)
  const [checked,  setChecked] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') setAuthed(true)
    setChecked(true)
  }, [])

  const login = (password: string): boolean => {
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      setAuthed(true)
      return true
    }
    return false
  }

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setAuthed(false)
  }

  return { authed, checked, login, logout }
}
