import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, Save, Check } from 'lucide-react';

const GOLD = '#c9a860';
const NAVY_BG = '#0b1220';
const NAVY_PANEL = '#141f38';
const NAVY_LINE = '#26314f';

const DEFAULTS = {
  rent: 67429,
  electricity: '',
  water: '',
  gas: '',
  food: '',
  futsal: 8000,
  nisa: 30000,
  carLoan: 28381,
  misc: 60000,
  income: '',
};

const DEFAULT_TARGETS = {
  rent: 67429,
  electricity: 7000,
  water: 2000,
  gas: 3000,
  food: 30000,
  futsal: 8000,
  nisa: 30000,
  carLoan: 28381,
  misc: 60000,
};

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(date) {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

function addMonths(date, n) {
  return new Date(date.getFullYear(), date.getMonth() + n, 1);
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function yen(n) {
  return `¥${Math.round(n).toLocaleString('ja-JP')}`;
}

function computeTotals(f) {
  const utilities = toNum(f.electricity) + toNum(f.water) + toNum(f.gas);
  const fixedTotal = toNum(f.rent) + utilities + toNum(f.carLoan) + toNum(f.futsal) + toNum(f.nisa);
  const totalExpense = fixedTotal + toNum(f.food) + toNum(f.misc);
  const balance = toNum(f.income) - totalExpense;
  return { utilities, fixedTotal, totalExpense, balance };
}

function Diff({ current, previous, invert }) {
  if (previous === null || previous === undefined) {
    return <span style={{ color: '#4a5578', fontSize: 12 }}>ー</span>;
  }
  const d = current - previous;
  if (d === 0) {
    return (
      <span style={{ color: '#4a5578', fontSize: 12, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Minus size={11} /> 変化なし
      </span>
    );
  }
  const isUp = d > 0;
  const good = invert ? !isUp : isUp;
  const color = good ? '#7fbf8f' : '#d97a7a';
  return (
    <span style={{ color, fontSize: 12, display: 'flex', alignItems: 'center', gap: 2, whiteSpace: 'nowrap' }}>
      {isUp ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
      {isUp ? '+' : ''}{Math.round(d).toLocaleString('ja-JP')}
    </span>
  );
}

function TargetCell({ target, onTargetChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef(null);

  const startEdit = () => {
    setDraft(target === '' || target === undefined ? '' : String(target));
    setEditing(true);
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    setEditing(false);
    onTargetChange(draft === '' ? 0 : draft);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        inputMode="decimal"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
        style={{
          background: '#0e1730',
          border: `1px solid ${NAVY_LINE}`,
          borderRadius: 6,
          color: '#8892b0',
          padding: '4px 6px',
          fontSize: 12.5,
          textAlign: 'right',
          width: '100%',
          minWidth: 0,
        }}
      />
    );
  }

  return (
    <button
      onClick={startEdit}
      style={{
        background: 'transparent',
        border: 'none',
        padding: '2px 0',
        fontSize: 12.5,
        color: '#8892b0',
        textAlign: 'right',
        width: '100%',
        cursor: 'pointer',
      }}
    >
      {yen(target)}
    </button>
  );
}

function Row({ label, value, onChange, editable, previous, diffInvert, bold, tint, target, onTargetChange }) {
  const hasTarget = target !== undefined && target !== null;
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 78px 100px 84px',
        alignItems: 'center',
        padding: '10px 4px',
        borderBottom: `1px solid ${NAVY_LINE}`,
        gap: 6,
      }}
    >
      <span style={{ color: tint || '#e6e9f2', fontWeight: bold ? 700 : 400, fontSize: 14.5 }}>{label}</span>
      {hasTarget && onTargetChange ? (
        <TargetCell target={target} onTargetChange={onTargetChange} />
      ) : (
        <span style={{ textAlign: 'right', fontSize: 12.5, color: hasTarget ? '#8892b0' : 'transparent' }}>
          {hasTarget ? yen(target) : '-'}
        </span>
      )}
      {editable ? (
        <input
          type="number"
          inputMode="decimal"
          value={value === '' ? '' : value}
          placeholder="0"
          onChange={(e) => onChange(e.target.value)}
          style={{
            background: '#0e1730',
            border: `1px solid ${NAVY_LINE}`,
            borderRadius: 6,
            color: GOLD,
            padding: '6px 6px',
            fontSize: 13.5,
            textAlign: 'right',
            width: '100%',
            minWidth: 0,
          }}
        />
      ) : (
        <span style={{ textAlign: 'right', color: bold ? GOLD : '#c7ceDE', fontWeight: bold ? 700 : 400, fontSize: 14.5 }}>
          {yen(value)}
        </span>
      )}
      <div style={{ textAlign: 'right' }}>
        <Diff current={toNum(value)} previous={previous} invert={diffInvert} />
      </div>
    </div>
  );
}

export default function BudgetApp() {
  const [current, setCurrent] = useState(() => new Date());
  const [fields, setFields] = useState(DEFAULTS);
  const [prevFields, setPrevFields] = useState(null);
  const [targets, setTargets] = useState(DEFAULT_TARGETS);
  const [loaded, setLoaded] = useState(false);
  const [saveState, setSaveState] = useState('idle');
  const saveTimer = useRef(null);
  const targetSaveTimer = useRef(null);

  const key = monthKey(current);
  const prevKey = monthKey(addMonths(current, -1));

  const load = useCallback(async (mKey) => {
    try {
      const raw = localStorage.getItem(`budget:${mKey}`);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoaded(false);
    (async () => {
      const cur = await load(key);
      const prev = await load(prevKey);
      let savedTargets = null;
      try {
        const raw = localStorage.getItem('budget:targets');
        savedTargets = raw ? JSON.parse(raw) : null;
      } catch (e) {
        savedTargets = null;
      }
      if (cancelled) return;
      setFields(cur || DEFAULTS);
      setPrevFields(prev);
      setTargets(savedTargets ? { ...DEFAULT_TARGETS, ...savedTargets } : DEFAULT_TARGETS);
      setLoaded(true);
    })();
    return () => { cancelled = true; };
  }, [key, prevKey, load]);

  const persist = useCallback((mKey, data) => {
    setSaveState('saving');
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(`budget:${mKey}`, JSON.stringify(data));
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 1200);
      } catch (e) {
        setSaveState('idle');
      }
    }, 500);
  }, []);

  const updateField = (name, value) => {
    setFields((f) => {
      const next = { ...f, [name]: value === '' ? '' : Number(value) };
      persist(key, next);
      return next;
    });
  };

  const updateTarget = (name, value) => {
    setTargets((t) => {
      const next = { ...t, [name]: Number(value) || 0 };
      setSaveState('saving');
      if (targetSaveTimer.current) clearTimeout(targetSaveTimer.current);
      targetSaveTimer.current = setTimeout(() => {
        try {
          localStorage.setItem('budget:targets', JSON.stringify(next));
          setSaveState('saved');
          setTimeout(() => setSaveState('idle'), 1200);
        } catch (e) {
          setSaveState('idle');
        }
      }, 400);
      return next;
    });
  };

  const totals = computeTotals(fields);
  const prevTotals = prevFields ? computeTotals(prevFields) : null;

  const prevVal = (name) => (prevFields ? toNum(prevFields[name]) : null);

  if (!loaded) {
    return (
      <div style={{ background: NAVY_BG, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: GOLD, fontFamily: 'system-ui' }}>
        読み込み中...
      </div>
    );
  }

  return (
    <div style={{ background: NAVY_BG, minHeight: '100vh', fontFamily: "'Hiragino Sans', system-ui, sans-serif", color: '#e6e9f2', paddingBottom: 40 }}>
      <div style={{ padding: '20px 16px 12px', borderBottom: `1px solid ${NAVY_LINE}`, position: 'sticky', top: 0, background: NAVY_BG, zIndex: 10 }}>
        <div style={{ fontSize: 12, letterSpacing: 2, color: GOLD, opacity: 0.75, marginBottom: 4 }}>MONTHLY BUDGET</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={() => setCurrent((d) => addMonths(d, -1))}
            style={{ background: NAVY_PANEL, border: `1px solid ${NAVY_LINE}`, borderRadius: 8, padding: 8, color: GOLD }}
          >
            <ChevronLeft size={18} />
          </button>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#f2f4f9' }}>{monthLabel(current)}</div>
          <button
            onClick={() => setCurrent((d) => addMonths(d, 1))}
            style={{ background: NAVY_PANEL, border: `1px solid ${NAVY_LINE}`, borderRadius: 8, padding: 8, color: GOLD }}
          >
            <ChevronRight size={18} />
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6, height: 16 }}>
          {saveState === 'saving' && <span style={{ fontSize: 11, color: '#8892b0', display: 'flex', alignItems: 'center', gap: 4 }}><Save size={11} />保存中...</span>}
          {saveState === 'saved' && <span style={{ fontSize: 11, color: '#7fbf8f', display: 'flex', alignItems: 'center', gap: 4 }}><Check size={11} />保存済み</span>}
        </div>
      </div>

      <div style={{ padding: '8px 14px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 78px 100px 84px', gap: 6, padding: '6px 4px', color: '#6b7494', fontSize: 11 }}>
          <span>項目</span>
          <span style={{ textAlign: 'right' }}>目標額</span>
          <span style={{ textAlign: 'right' }}>金額</span>
          <span style={{ textAlign: 'right' }}>前月比</span>
        </div>

        <div style={{ marginTop: 8, marginBottom: 4, fontSize: 12, color: GOLD, opacity: 0.85, letterSpacing: 1 }}>固定費</div>
        <div style={{ background: NAVY_PANEL, borderRadius: 10, padding: '2px 10px', border: `1px solid ${NAVY_LINE}` }}>
          <Row label="家賃" value={fields.rent} editable onChange={(v) => updateField('rent', v)} previous={prevVal('rent')} diffInvert target={targets.rent} onTargetChange={(v) => updateTarget('rent', v)} />
          <Row label="電気代" value={fields.electricity} editable onChange={(v) => updateField('electricity', v)} previous={prevVal('electricity')} diffInvert target={targets.electricity} onTargetChange={(v) => updateTarget('electricity', v)} />
          <Row label="水道代" value={fields.water} editable onChange={(v) => updateField('water', v)} previous={prevVal('water')} diffInvert target={targets.water} onTargetChange={(v) => updateTarget('water', v)} />
          <Row label="ガス代" value={fields.gas} editable onChange={(v) => updateField('gas', v)} previous={prevVal('gas')} diffInvert target={targets.gas} onTargetChange={(v) => updateTarget('gas', v)} />
          <Row label="光熱費 計" value={totals.utilities} previous={prevTotals ? prevTotals.utilities : null} diffInvert tint={GOLD} target={targets.electricity + targets.water + targets.gas} />
          <Row label="フットサル" value={fields.futsal} editable onChange={(v) => updateField('futsal', v)} previous={prevVal('futsal')} diffInvert target={targets.futsal} onTargetChange={(v) => updateTarget('futsal', v)} />
          <Row label="NISA" value={fields.nisa} editable onChange={(v) => updateField('nisa', v)} previous={prevVal('nisa')} diffInvert={false} target={targets.nisa} onTargetChange={(v) => updateTarget('nisa', v)} />
          <Row label="車(ローン)" value={fields.carLoan} editable onChange={(v) => updateField('carLoan', v)} previous={prevVal('carLoan')} diffInvert target={targets.carLoan} onTargetChange={(v) => updateTarget('carLoan', v)} />
          <div style={{ height: 1 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 78px 100px 84px', padding: '10px 14px', marginTop: 4, background: '#16233f', borderRadius: 10, border: `1px solid ${NAVY_LINE}` }}>
          <span style={{ fontWeight: 700, color: GOLD, fontSize: 14.5 }}>固定費合計</span>
          <span style={{ textAlign: 'right', fontSize: 12.5, color: '#8892b0' }}>
            {yen(targets.rent + targets.electricity + targets.water + targets.gas + targets.carLoan + targets.futsal + targets.nisa)}
          </span>
          <span style={{ textAlign: 'right', fontWeight: 700, color: GOLD, fontSize: 14.5 }}>{yen(totals.fixedTotal)}</span>
          <div style={{ textAlign: 'right' }}>
            <Diff current={totals.fixedTotal} previous={prevTotals ? prevTotals.fixedTotal : null} invert />
          </div>
        </div>

        <div style={{ marginTop: 20, marginBottom: 4, fontSize: 12, color: GOLD, opacity: 0.85, letterSpacing: 1 }}>変動費</div>
        <div style={{ background: NAVY_PANEL, borderRadius: 10, padding: '2px 10px', border: `1px solid ${NAVY_LINE}` }}>
          <Row label="食費" value={fields.food} editable onChange={(v) => updateField('food', v)} previous={prevVal('food')} diffInvert target={targets.food} onTargetChange={(v) => updateTarget('food', v)} />
          <Row label="雑費" value={fields.misc} editable onChange={(v) => updateField('misc', v)} previous={prevVal('misc')} diffInvert target={targets.misc} onTargetChange={(v) => updateTarget('misc', v)} />
        </div>

        <div style={{ marginTop: 20, marginBottom: 4, fontSize: 12, color: GOLD, opacity: 0.85, letterSpacing: 1 }}>合計</div>
        <div style={{ background: NAVY_PANEL, borderRadius: 10, padding: '2px 10px', border: `1px solid ${NAVY_LINE}` }}>
          <Row label="月出費合計" value={totals.totalExpense} previous={prevTotals ? prevTotals.totalExpense : null} diffInvert bold />
          <Row label="収入" value={fields.income} editable onChange={(v) => updateField('income', v)} previous={prevVal('income')} diffInvert={false} bold />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 78px 100px 84px',
            padding: '14px',
            marginTop: 6,
            background: totals.balance >= 0 ? '#16302a' : '#33191c',
            borderRadius: 10,
            border: `1px solid ${totals.balance >= 0 ? '#2f5c47' : '#5c2f33'}`,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 15.5, color: totals.balance >= 0 ? '#8fd6ab' : '#e08a8a' }}>収支</span>
          <span />
          <span style={{ textAlign: 'right', fontWeight: 700, fontSize: 15.5, color: totals.balance >= 0 ? '#8fd6ab' : '#e08a8a' }}>
            {totals.balance >= 0 ? '+' : ''}{yen(totals.balance)}
          </span>
          <div style={{ textAlign: 'right' }}>
            <Diff current={totals.balance} previous={prevTotals ? prevTotals.balance : null} />
          </div>
        </div>
      </div>
    </div>
  );
}
