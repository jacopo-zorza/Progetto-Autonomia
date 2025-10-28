import React from 'react'
import { Navigate } from 'react-router-dom'
import { isAuthenticated } from '../services/auth'

type Props = { children: React.ReactNode }

export default function PrivateRoute({ children }: Props): React.ReactElement | null {
  if (!isAuthenticated()) {
    return React.createElement(Navigate, { to: '/login' })
  }
  return React.createElement(React.Fragment, null, children as any)
}
