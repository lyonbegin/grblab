// src/pages/BoardIndexPage.jsx
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import BoardListPage from './BoardListPage'
import BoardDetailPage from './BoardDetailPage'

const LS_KEY = 'kras_board_v2'

export default function BoardIndexPage() {
  const { siteId } = useParams()

  // siteId가 다른 데이터가 있으면 초기화
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (raw) {
      const db = JSON.parse(raw)
      const hasWrong = db.posts?.some(p => p.siteId !== siteId)
      if (hasWrong) localStorage.removeItem(LS_KEY)
    }
  } catch {
    localStorage.removeItem(LS_KEY)
  }

  return (
    <Routes>
      <Route index element={<BoardListPage />} />
      <Route path=":postId" element={<BoardDetailPage />} />
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  )
}