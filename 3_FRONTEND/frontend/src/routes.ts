import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App'
import Home from './pages/3_2_home/Home'
import Login from './pages/3_3_auth/Login'
import Register from './pages/3_3_auth/Register'
import Forgot from './pages/3_3_auth/Forgot'
import Dashboard from './pages/3_8_profile/Dashboard'
import About from './pages/3_2_home/About'
import Careers from './pages/3_2_home/Careers'
import ItemsList from './pages/3_5_items/ItemsList'
import ItemDetail from './pages/3_6_itemDetail/ItemDetail'
import CreateItem from './pages/3_4_createItem/CreateItem'
import EditItem from './pages/3_4_createItem/EditItem'
import Chat from './pages/3_7_chat/Chat'
import Profile from './pages/3_8_profile/Profile'
import Map from './pages/3_8_profile/Map'
import NotFound from './pages/3_2_home/NotFound'
import PrivateRoute from './components/PrivateRoute'
import Checkout from './pages/3_9_payment/Checkout'
import Support from './pages/3_10_support/Support'
import VirtualAssistant from './pages/3_10_support/VirtualAssistant'

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
  React.createElement(Route, { path: 'careers', element: React.createElement(Careers, null) }),
  React.createElement(Route, { path: 'login', element: React.createElement(Login, null) }),
  React.createElement(Route, { path: 'register', element: React.createElement(Register, null) }),
  React.createElement(Route, { path: 'forgot', element: React.createElement(Forgot, null) }),
  React.createElement(Route, { path: 'items', element: React.createElement(ItemsList, null) }),
  React.createElement(Route, { path: 'items/:id', element: React.createElement(ItemDetail, null) }),
  React.createElement(Route, { path: 'items/:id/edit', element: React.createElement(PrivateRoute, null, React.createElement(EditItem, null)) }),
  React.createElement(Route, { path: 'items/:id/checkout', element: React.createElement(PrivateRoute, null, React.createElement(Checkout, null)) }),
  React.createElement(Route, { path: 'create', element: React.createElement(PrivateRoute, null, React.createElement(CreateItem, null)) }),
  React.createElement(Route, { path: 'dashboard', element: React.createElement(PrivateRoute, null, React.createElement(Dashboard, null)) }),
  React.createElement(Route, { path: 'chat', element: React.createElement(PrivateRoute, null, React.createElement(Chat, null)) }),
  React.createElement(Route, { path: 'profile', element: React.createElement(PrivateRoute, null, React.createElement(Profile, null)) }),
  React.createElement(Route, { path: 'map', element: React.createElement(PrivateRoute, null, React.createElement(Map, null)) }),
  React.createElement(Route, { path: 'support', element: React.createElement(Support, null) }),
  React.createElement(Route, { path: 'support/assistant', element: React.createElement(VirtualAssistant, null) }),
  React.createElement(Route, { path: '*', element: React.createElement(NotFound, null) })
      )
    )
  )
}
