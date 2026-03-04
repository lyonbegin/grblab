// src/components/MobilePpeLedgerCards.jsx
import { useMemo, useState } from 'react'
import { Input, Modal } from 'antd'

const PPE_ITEMS = [
  { key: 'helmet', label: '안전모' },
  { key: 'shoes', label: '안전화' },
  { key: 'goggles', label: '보안경' },
  { key: 'gloves', label: '안전장갑' },
  { key: 'belt', label: '안전대' },
  { key: 'mask', label: '마스크' },
  { key: 'earplug', label: '귀마개' },
  { key: 'vest', label: '조끼' },
  { key: 'etc', label: '기타' },
]

const CSS = `
  .mpc-wrap { padding: 2px 0 4px; }
  .mpc-grid { display: flex; flex-direction: column; gap: 12px; }

  .mpc-card {
    background:#fff;
    border:1px solid rgba(15,23,42,0.08);
    border-radius:16px;
    box-shadow:0 2px 10px rgba(15,23,42,0.06);
    overflow:hidden;
  }
  .mpc-card-hd{
    padding:12px 12px 10px;
    display:flex;
    align-items:flex-start;
    justify-content:space-between;
    gap:10px;
    border-bottom:1px solid rgba(15,23,42,0.06);
  }
  .mpc-card-title{
    font-weight:900;
    color:#0f172a;
    font-size:13px;
    letter-spacing:-0.2px;
    line-height:1.25;
  }
  .mpc-card-sub{
    margin-top:4px;
    color:#94a3b8;
    font-size:11px;
    font-weight:900;
  }
  .mpc-card-actions{
    display:flex;
    gap:6px;
    flex-shrink:0;
  }
  .mpc-btn{
    height:30px;
    padding:0 10px;
    border-radius:10px;
    border:1px solid rgba(15,23,42,0.12);
    background:#fff;
    font-weight:900;
    font-size:12px;
    color:#334155;
    cursor:pointer;
  }
  .mpc-btn.primary{
    background:#2563eb;
    border-color:#2563eb;
    color:#fff;
  }
  .mpc-btn.danger{
    background:rgba(239,68,68,0.10);
    border-color:rgba(239,68,68,0.25);
    color:#ef4444;
  }

  .mpc-body { padding: 10px 12px 12px; }

  .mpc-chips {
    display:flex;
    flex-wrap:wrap;
    gap:8px;
    margin-top:10px;
  }
  .mpc-chip{
    height:28px;
    padding:0 12px;
    border-radius:999px;
    border:1px solid rgba(15,23,42,0.10);
    background:#fff;
    color:#475569;
    font-size:12px;
    font-weight:900;
    display:inline-flex;
    align-items:center;
    cursor:pointer;
    user-select:none;
  }
  .mpc-chip.on{
    background:rgba(37,99,235,0.10);
    border-color:rgba(37,99,235,0.25);
    color:#2563eb;
  }

  .mpc-form-grid{
    display:grid;
    grid-template-columns: 1fr 1fr;
    gap:10px;
  }
  .mpc-field .lbl{
    font-size:11px;
    font-weight:900;
    color:#64748b;
    margin-bottom:6px;
  }

  .mpc-3x3{
    margin-top:12px;
    display:grid;
    grid-template-columns: repeat(3, 1fr);
    gap:8px;
  }
  .mpc-toggle{
    height:40px;
    border-radius:12px;
    border:1px solid rgba(15,23,42,0.12);
    background:#fff;
    font-weight:900;
    font-size:12px;
    color:#334155;
    cursor:pointer;
  }
  .mpc-toggle.on{
    background:rgba(37,99,235,0.10);
    border-color:rgba(37,99,235,0.25);
    color:#2563eb;
  }

  .mpc-add{
    border-radius:16px;
    border:2px dashed rgba(37,99,235,0.35);
    background: rgba(37,99,235,0.04);
    height:64px;
    display:flex;
    align-items:center;
    justify-content:center;
    gap:8px;
    font-weight:900;
    color:#2563eb;
    cursor:pointer;
    user-select:none;
  }
`

function uid() {
  return Math.random().toString(36).slice(2, 10)
}

/**
 * ✅ 핵심: id가 없으면 "매 렌더마다 새 uid"를 만들면 저장 매칭이 깨집니다.
 * 그래서 id가 없을 때는 index 기반의 안정 id를 부여합니다.
 */
function normalizeRow(r, idx) {
  const stableId = (r && r.id) ? r.id : `idx_${idx}`
  return {
    id: stableId,
    receiverName: r?.receiverName || '',
    giverName: r?.giverName || '',
    giveDate: r?.giveDate || '',
    signName: r?.signName || '',
    selected: r?.selected || {},
  }
}

export default function MobilePpeLedgerCards({ value, onChange }) {
  const rows = useMemo(
    () => (Array.isArray(value) ? value.map((r, i) => normalizeRow(r, i)) : []),
    [value]
  )

  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(null)

  const openEdit = (row) => {
    const idx = rows.findIndex((x) => x.id === row.id)
    const r = normalizeRow(row, idx >= 0 ? idx : rows.length)
    setEditingId(r.id)
    setDraft(r)
  }

  const closeEdit = () => {
    setEditingId(null)
    setDraft(null)
  }

  const commitDraft = () => {
    if (!draft) return

    const idx = rows.findIndex((r) => r.id === draft.id)

    // ✅ 매칭되면 교체
    if (idx >= 0) {
      const next = rows.map((r) => (r.id === draft.id ? draft : r))
      onChange?.(next)
      closeEdit()
      return
    }

    // ✅ 매칭 실패(= id 깨짐/외부데이터)면 append
    const next = [...rows, { ...draft, id: draft.id || uid() }]
    onChange?.(next)
    closeEdit()
  }

  const removeRow = (id) => {
    const next = rows.filter((r) => r.id !== id)
    onChange?.(next)
  }

  const addRow = () => {
    const newRow = {
      id: `new_${uid()}`, // ✅ 신규는 고유 id
      receiverName: '',
      giverName: '',
      giveDate: '',
      signName: '',
      selected: {},
    }
    const next = [...rows, newRow]
    onChange?.(next)      // ✅ 먼저 리스트에 반영
    openEdit(newRow)      // ✅ 그리고 모달 오픈
  }

  const toggleItem = (key) => {
    setDraft((prev) => {
      const selected = { ...(prev?.selected || {}) }
      selected[key] = !selected[key]
      return { ...prev, selected }
    })
  }

  const selectedLabels = (r) => {
    const keys = Object.keys(r.selected || {}).filter((k) => r.selected?.[k])
    return keys
      .map((k) => PPE_ITEMS.find((x) => x.key === k)?.label)
      .filter(Boolean)
  }

  return (
    <>
      <style>{CSS}</style>

      <div className="mpc-wrap">
        <div className="mpc-grid">
          {rows.map((r, idx) => {
            const labels = selectedLabels(r)
            return (
              <div className="mpc-card" key={r.id}>
                <div className="mpc-card-hd">
                  <div style={{ minWidth: 0 }}>
                    <div className="mpc-card-title">
                      지급 #{idx + 1} · {r.receiverName || '수령자 미입력'}
                    </div>
                    <div className="mpc-card-sub">
                      {r.giveDate || '지급일 -'} · {r.giverName || '지급자 -'} · {r.signName || '서명 -'}
                    </div>
                  </div>

                  <div className="mpc-card-actions">
                    <button type="button" className="mpc-btn" onClick={() => openEdit(r)}>
                      수정
                    </button>
                    <button type="button" className="mpc-btn danger" onClick={() => removeRow(r.id)}>
                      삭제
                    </button>
                  </div>
                </div>

                <div className="mpc-body">
                  {labels.length === 0 ? (
                    <div style={{ color: '#94a3b8', fontWeight: 900, fontSize: 12 }}>
                      선택된 품목이 없습니다.
                    </div>
                  ) : (
                    <div className="mpc-chips">
                      {labels.map((t) => (
                        <span className="mpc-chip on" key={t}>{t} ✓</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          <div
            className="mpc-add"
            role="button"
            tabIndex={0}
            onClick={addRow}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') addRow() }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>+</span>
            <span>추가</span>
          </div>
        </div>
      </div>

      <Modal
        open={!!editingId}
        onCancel={closeEdit}
        onOk={commitDraft}
        okText="저장"
        cancelText="취소"
        okButtonProps={{ style: { borderRadius: 10, fontWeight: 900 } }}
        cancelButtonProps={{ style: { borderRadius: 10, fontWeight: 900 } }}
        title="지급대장 입력"
      >
        <div style={{ paddingTop: 6 }}>
          <div className="mpc-form-grid">
            <div className="mpc-field">
              <div className="lbl">수령자</div>
              <Input
                value={draft?.receiverName || ''}
                onChange={(e) => setDraft((p) => ({ ...p, receiverName: e.target.value }))}
                placeholder="예: 홍길동"
              />
            </div>
            <div className="mpc-field">
              <div className="lbl">지급일</div>
              <Input
                type="date"
                value={draft?.giveDate || ''}
                onChange={(e) => setDraft((p) => ({ ...p, giveDate: e.target.value }))}
              />
            </div>

            <div className="mpc-field">
              <div className="lbl">지급자</div>
              <Input
                value={draft?.giverName || ''}
                onChange={(e) => setDraft((p) => ({ ...p, giverName: e.target.value }))}
                placeholder="예: 안전관리자"
              />
            </div>
            <div className="mpc-field">
              <div className="lbl">서명</div>
              <Input
                value={draft?.signName || ''}
                onChange={(e) => setDraft((p) => ({ ...p, signName: e.target.value }))}
                placeholder="예: 수령자 서명"
              />
            </div>
          </div>

          <div style={{ marginTop: 14, fontSize: 12, fontWeight: 900, color: '#64748b' }}>
            지급 품목 (3×3 토글)
          </div>

          <div className="mpc-3x3">
            {PPE_ITEMS.map((x) => (
              <button
                key={x.key}
                type="button"
                className={`mpc-toggle ${draft?.selected?.[x.key] ? 'on' : ''}`}
                onClick={() => toggleItem(x.key)}
              >
                {x.label} {draft?.selected?.[x.key] ? '✓' : ''}
              </button>
            ))}
          </div>

          <div style={{ marginTop: 12, fontSize: 12, fontWeight: 900, color: '#64748b' }}>
            선택된 품목(칩)
          </div>

          <div className="mpc-chips">
            {Object.keys(draft?.selected || {}).filter((k) => draft?.selected?.[k]).length === 0 ? (
              <span style={{ color: '#94a3b8', fontWeight: 900, fontSize: 12 }}>
                선택 없음
              </span>
            ) : (
              Object.keys(draft?.selected || {})
                .filter((k) => draft?.selected?.[k])
                .map((k) => PPE_ITEMS.find((x) => x.key === k)?.label)
                .filter(Boolean)
                .map((t) => (
                  <span key={t} className="mpc-chip on">{t} ✓</span>
                ))
            )}
          </div>
        </div>
      </Modal>
    </>
  )
}