import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import koKR from 'antd/locale/ko_KR'
import App from './App'
import './index.css'

const theme = {
  token: {
    colorPrimary: '#FF4D00',
    colorBgBase: '#0a0e1a',
    colorTextBase: '#ffffff',
    borderRadius: 12,
    fontFamily: "'Noto Sans KR', sans-serif",
  },
  components: {
    Button: {
      colorPrimary: '#FF4D00',
      defaultBg: 'transparent',
      defaultBorderColor: 'rgba(255,255,255,0.2)',
      defaultColor: '#ffffff',
    },
    Tabs: {
      colorBgContainer: 'transparent',
      inkBarColor: '#FF4D00',
      itemColor: 'rgba(255,255,255,0.5)',
      itemActiveColor: '#FF4D00',
      itemSelectedColor: '#FF4D00',
      titleFontSize: 13,
    },
    Card: {
      colorBgContainer: 'rgba(255,255,255,0.04)',
      colorBorderSecondary: 'rgba(255,255,255,0.08)',
    },
    Tag: {
      colorBgBase: 'rgba(255,77,0,0.15)',
    },
    Modal: {
      contentBg: '#111827',
      headerBg: '#111827',
    },
  },
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider locale={koKR} theme={theme}>
        <App />
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
)
