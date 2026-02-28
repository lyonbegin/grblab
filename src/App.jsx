import { Routes, Route } from 'react-router-dom'
import InputPage      from './pages/InputPage'
import ResultPage     from './pages/ResultPage'
import FormInputPage  from './pages/FormInputPage'   // ← 추가

export default function App() {
  return (
    <Routes>
      <Route path="/"       element={<InputPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/form"   element={<FormInputPage />} />  {/* ← 추가 */}
    </Routes>
  )
}