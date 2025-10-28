import React from 'react'
import Layout from './pages/3_1_layout/Layout'
import { Outlet } from 'react-router-dom'

export default function App(): React.ReactElement {
  return React.createElement(Layout, null, React.createElement(Outlet, null))
}
