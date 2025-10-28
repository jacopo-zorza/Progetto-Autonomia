import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import Home from './pages/3_2_home/Home'
import Login from './pages/3_3_auth/Login'
import Register from './pages/3_3_auth/Register'
import Dashboard from './pages/3_8_profile/Dashboard'
import About from './pages/3_2_home/About'
import ItemsList from './pages/3_5_items/ItemsList'
import ItemDetail from './pages/3_6_itemDetail/ItemDetail'
import CreateItem from './pages/3_4_createItem/CreateItem'
import Chat from './pages/3_7_chat/Chat'
import Profile from './pages/3_8_profile/Profile'
import NotFound from './pages/3_2_home/NotFound'
import PrivateRoute from './components/PrivateRoute'

export default function Router(): React.ReactElement {
  return React.createElement(
    BrowserRouter,
    null,
    React.createElement(
      Routes,
      null,
      React.createElement(
        Route,
        { path: '/', element: React.createElement(App, null) },
  React.createElement(Route, { index: true, element: React.createElement(Home, null) }),
  React.createElement(Route, { path: 'about', element: React.createElement(About, null) }),
  React.createElement(Route, { path: 'login', element: React.createElement(Login, null) }),
  React.createElement(Route, { path: 'register', element: React.createElement(Register, null) }),
  React.createElement(Route, { path: 'items', element: React.createElement(ItemsList, null) }),
  React.createElement(Route, { path: 'items/:id', element: React.createElement(ItemDetail, null) }),
  React.createElement(Route, { path: 'create', element: React.createElement(PrivateRoute, null, React.createElement(CreateItem, null)) }),
  React.createElement(Route, { path: 'dashboard', element: React.createElement(PrivateRoute, null, React.createElement(Dashboard, null)) }),
  React.createElement(Route, { path: 'chat', element: React.createElement(PrivateRoute, null, React.createElement(Chat, null)) }),
  React.createElement(Route, { path: 'profile', element: React.createElement(PrivateRoute, null, React.createElement(Profile, null)) }),
  React.createElement(Route, { path: '*', element: React.createElement(NotFound, null) })
      )
    )
  )
}
