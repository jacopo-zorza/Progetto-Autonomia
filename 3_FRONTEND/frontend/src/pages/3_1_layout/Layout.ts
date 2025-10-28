import React from 'react'
import Header from './Header'
import Footer from './Footer'

export default function Layout({ children }: { children: React.ReactNode }): React.ReactElement {
  return React.createElement(
    'div',
    { className: 'min-h-screen flex flex-col' },
    React.createElement(Header, null),
    React.createElement('main', { className: 'flex-1 container mx-auto p-4' }, children as any),
    React.createElement(Footer, null)
  )
}
