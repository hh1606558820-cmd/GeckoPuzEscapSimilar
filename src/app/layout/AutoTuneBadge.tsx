/**
 * AutoTune 状态徽章：顶栏单行 + 可折叠详情，失败不撑爆布局
 */

import React, { useState, useCallback } from 'react';
import type { AutoTuneUIState } from '@/modules/auto-fill/autoTune';
import type { DifficultyDiagnostics } from '@/modules/difficulty/difficultyScore';

function diagnosticsToReadable(d: DifficultyDiagnostics): string {
  return [
    `FirstBreakSteps=${d.FirstBreakSteps}`,
    `KeyLockDepth=${d.KeyLockDepth}`,
    `InitialMovableCount=${d.InitialMovableCount}`,
    `FreeAheadRatio=${d.FreeAheadRatio.toFixed(2)}`,
    `EmptyRatio=${d.EmptyRatio.toFixed(2)}`,
  ].join('，');
}

function diagnosticsToJson(d: DifficultyDiagnostics): string {
  return JSON.stringify(
    {
      DifficultyScore: d.DifficultyScore,
      FirstBreakSteps: d.FirstBreakSteps,
      KeyLockDepth: d.KeyLockDepth,
      InitialMovableCount: d.InitialMovableCount,
      FreeAheadRatio: d.FreeAheadRatio,
      EmptyRatio: d.EmptyRatio,
      N: d.N,
      AvgLen: d.AvgLen,
      MaxLen: d.MaxLen,
      AvgBends: d.AvgBends,
    },
    null,
    2
  );
}

export const AutoTuneBadge: React.FC<{ state: AutoTuneUIState }> = ({ state }) => {
  const [detailsOpen, setDetailsOpen] = useState(false);

  const handleCopy = useCallback(() => {
    if (state.status === 'success' && state.diagnostics) {
      navigator.clipboard.writeText(diagnosticsToJson(state.diagnostics));
    } else if (state.status === 'fail' && state.diagnostics) {
      const text = [
        `Score=${state.score ?? ''}`,
        `target ${state.targetMin}~${state.targetMax}`,
        `Attempts=${state.attempts}`,
        state.reason,
        state.guardErrors?.[0] ?? '',
        diagnosticsToReadable(state.diagnostics),
      ]
        .filter(Boolean)
        .join('\n');
      navigator.clipboard.writeText(text);
    }
  }, [state]);

  if (state.status === 'idle' || state.status === 'running') {
    return (
      <div
        className="auto-tune-badge"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          fontSize: '12px',
          backgroundColor: state.status === 'running' ? 'rgba(33, 150, 243, 0.15)' : 'transparent',
          borderRadius: '4px',
        }}
      >
        {state.status === 'running' && <span style={{ color: '#1976d2' }}>AutoTune…</span>}
      </div>
    );
  }

  if (state.status === 'success') {
    const scoreStr = Math.round(state.score);
    const targetStr = `${state.targetMin}–${state.targetMax}`;
    return (
      <div
        className="auto-tune-badge"
        style={{
          display: 'inline-flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          fontSize: '12px',
          backgroundColor: 'rgba(76, 175, 80, 0.12)',
          borderRadius: '4px',
          border: '1px solid rgba(76, 175, 80, 0.35)',
        }}
      >
        <span style={{ color: '#2e7d32' }}>AutoTune ✓</span>
        <span>Score {scoreStr} ({targetStr}) Attempts {state.attempts}</span>
        <button
          type="button"
          onClick={() => setDetailsOpen((o) => !o)}
          style={{
            marginLeft: '4px',
            padding: '2px 8px',
            fontSize: '11px',
            border: '1px solid rgba(0,0,0,0.2)',
            borderRadius: '4px',
            cursor: 'pointer',
            background: '#fff',
          }}
        >
          {detailsOpen ? '收起详情' : '详情'}
        </button>
        {detailsOpen && (
          <div
            style={{
              width: '100%',
              marginTop: '6px',
              padding: '8px',
              background: 'rgba(0,0,0,0.04)',
              borderRadius: '4px',
              fontSize: '11px',
            }}
          >
            <div>Score={state.score.toFixed(1)}，target {state.targetMin}~{state.targetMax}，Attempts={state.attempts}</div>
            {state.guardErrors?.[0] && (
              <div style={{ color: '#d32f2f', marginTop: '4px' }}>{state.guardErrors[0]}</div>
            )}
            <div style={{ marginTop: '4px', opacity: 0.9 }}>{diagnosticsToReadable(state.diagnostics)}</div>
            <button
              type="button"
              onClick={handleCopy}
              style={{
                marginTop: '6px',
                padding: '2px 8px',
                fontSize: '11px',
                border: '1px solid rgba(0,0,0,0.2)',
                borderRadius: '4px',
                cursor: 'pointer',
                background: '#fff',
              }}
            >
              复制诊断信息
            </button>
          </div>
        )}
      </div>
    );
  }

  // fail
  return (
    <div
      className="auto-tune-badge"
      style={{
        display: 'inline-flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '4px',
        padding: '4px 10px',
        fontSize: '12px',
        backgroundColor: 'rgba(211, 47, 47, 0.08)',
        borderRadius: '4px',
        border: '1px solid rgba(211, 47, 47, 0.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
        <span style={{ color: '#c62828' }}>AutoTune ✗</span>
        <span>未收敛 (Attempts {state.attempts})</span>
        <button
          type="button"
          onClick={() => setDetailsOpen((o) => !o)}
          style={{
            padding: '2px 8px',
            fontSize: '11px',
            border: '1px solid rgba(0,0,0,0.2)',
            borderRadius: '4px',
            cursor: 'pointer',
            background: '#fff',
          }}
        >
          {detailsOpen ? '收起详情' : '详情'}
        </button>
      </div>
      {detailsOpen && (
        <div
          style={{
            width: '100%',
            padding: '8px',
            background: 'rgba(0,0,0,0.04)',
            borderRadius: '4px',
            fontSize: '11px',
          }}
        >
          <div>{state.reason}</div>
          {state.guardErrors?.[0] && (
            <div style={{ marginTop: '4px', color: '#c62828' }}>原因：{state.guardErrors[0]}</div>
          )}
          {state.diagnostics && (
            <div style={{ marginTop: '4px', opacity: 0.9 }}>{diagnosticsToReadable(state.diagnostics)}</div>
          )}
          <div style={{ marginTop: '6px', color: '#666' }}>已展示最后一次生成结果（可能偏难/偏锁）</div>
          {state.diagnostics && (
            <button
              type="button"
              onClick={handleCopy}
              style={{
                marginTop: '6px',
                padding: '2px 8px',
                fontSize: '11px',
                border: '1px solid rgba(0,0,0,0.2)',
                borderRadius: '4px',
                cursor: 'pointer',
                background: '#fff',
              }}
            >
              复制诊断信息
            </button>
          )}
        </div>
      )}
    </div>
  );
};
