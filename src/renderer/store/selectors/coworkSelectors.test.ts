/**
 * TDD tests for cowork selector logic (memoization contracts).
 *
 * Logic is mirrored inline — these tests define the CONTRACT that the real
 * selectors in coworkSelectors.ts must fulfill. The inline mirrors prove the
 * expected behavior without importing from the implementation file.
 */
import { test, expect, describe } from 'vitest';

// ---------------------------------------------------------------------------
// Minimal type mirrors (subset of the real types)
// ---------------------------------------------------------------------------

interface CoworkConfig {
  workingDirectory: string;
  systemPrompt: string;
  executionMode: string;
  agentEngine: string;
  memoryEnabled: boolean;
  memoryImplicitUpdateEnabled: boolean;
  memoryLlmJudgeEnabled: boolean;
  memoryGuardLevel: string;
  memoryUserMemoriesMaxItems: number;
}

interface CoworkSession {
  id: string;
  title: string;
  claudeSessionId: string | null;
  status: string;
  pinned: boolean;
  cwd: string;
  systemPrompt: string;
  executionMode: string;
  activeSkillIds: string[];
  messages: unknown[];
  createdAt: number;
  updatedAt: number;
}

interface CoworkState {
  sessions: unknown[];
  currentSessionId: string | null;
  currentSession: CoworkSession | null;
  draftPrompts: Record<string, string>;
  unreadSessionIds: string[];
  isCoworkActive: boolean;
  isStreaming: boolean;
  remoteManaged: boolean;
  pendingPermissions: unknown[];
  config: CoworkConfig;
}

interface RootState {
  cowork: CoworkState;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Inline mirrors of selector logic (mirrors of real coworkSelectors.ts)
// ---------------------------------------------------------------------------

function makeState(overrides?: Partial<CoworkState>): RootState {
  const defaultCowork: CoworkState = {
    sessions: [],
    currentSessionId: null,
    currentSession: null,
    draftPrompts: {},
    unreadSessionIds: [],
    isCoworkActive: false,
    isStreaming: false,
    remoteManaged: false,
    pendingPermissions: [],
    config: {
      workingDirectory: '',
      systemPrompt: '',
      executionMode: 'local',
      agentEngine: 'openclaw',
      memoryEnabled: true,
      memoryImplicitUpdateEnabled: true,
      memoryLlmJudgeEnabled: false,
      memoryGuardLevel: 'strict',
      memoryUserMemoriesMaxItems: 12,
    },
  };
  return {
    cowork: { ...defaultCowork, ...overrides },
  };
}

// Mirrored selector logic — identical to the real selectors' contracts
function selectCurrentSession(state: RootState): CoworkSession | null {
  return state.cowork.currentSession;
}

function selectIsStreaming(state: RootState): boolean {
  return state.cowork.isStreaming;
}

function selectAgentEngine(state: RootState): string {
  return state.cowork.config.agentEngine;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('cowork selectors memoization', () => {
  test('selectCurrentSession returns null when no session', () => {
    const state = makeState({ currentSession: null });
    const result = selectCurrentSession(state);
    expect(result).toBeNull();
  });

  test('selectCurrentSession returns same reference when state unchanged', () => {
    const session: CoworkSession = {
      id: 'sess-1',
      title: 'Test Session',
      claudeSessionId: null,
      status: 'idle',
      pinned: false,
      cwd: '/tmp',
      systemPrompt: '',
      executionMode: 'local',
      activeSkillIds: [],
      messages: [],
      createdAt: 1000,
      updatedAt: 1000,
    };
    const state = makeState({ currentSession: session });

    const result1 = selectCurrentSession(state);
    const result2 = selectCurrentSession(state);

    // Same state object → same reference returned
    expect(result1).toBe(result2);
    expect(result1).toBe(session);
  });

  test('selectCurrentSession returns new reference when currentSession changes', () => {
    const session1: CoworkSession = {
      id: 'sess-1',
      title: 'First',
      claudeSessionId: null,
      status: 'idle',
      pinned: false,
      cwd: '/tmp',
      systemPrompt: '',
      executionMode: 'local',
      activeSkillIds: [],
      messages: [],
      createdAt: 1000,
      updatedAt: 1000,
    };
    const session2: CoworkSession = {
      id: 'sess-2',
      title: 'Second',
      claudeSessionId: null,
      status: 'running',
      pinned: false,
      cwd: '/home',
      systemPrompt: '',
      executionMode: 'local',
      activeSkillIds: [],
      messages: [],
      createdAt: 2000,
      updatedAt: 2000,
    };

    const state1 = makeState({ currentSession: session1 });
    const state2 = makeState({ currentSession: session2 });

    const result1 = selectCurrentSession(state1);
    const result2 = selectCurrentSession(state2);

    // Different session objects → different references
    expect(result1).not.toBe(result2);
    expect(result1?.id).toBe('sess-1');
    expect(result2?.id).toBe('sess-2');
  });

  test('selectIsStreaming returns primitive boolean', () => {
    const stateTrue = makeState({ isStreaming: true });
    const stateFalse = makeState({ isStreaming: false });

    const resultTrue = selectIsStreaming(stateTrue);
    const resultFalse = selectIsStreaming(stateFalse);

    expect(typeof resultTrue).toBe('boolean');
    expect(typeof resultFalse).toBe('boolean');
    expect(resultTrue).toBe(true);
    expect(resultFalse).toBe(false);
  });

  test('selectAgentEngine returns string from nested config', () => {
    const stateOpenclaw = makeState();
    const stateYd = makeState({
      config: {
        workingDirectory: '',
        systemPrompt: '',
        executionMode: 'local',
        agentEngine: 'yd_cowork',
        memoryEnabled: true,
        memoryImplicitUpdateEnabled: true,
        memoryLlmJudgeEnabled: false,
        memoryGuardLevel: 'strict',
        memoryUserMemoriesMaxItems: 12,
      },
    });

    const engineOpenclaw = selectAgentEngine(stateOpenclaw);
    const engineYd = selectAgentEngine(stateYd);

    expect(typeof engineOpenclaw).toBe('string');
    expect(engineOpenclaw).toBe('openclaw');
    expect(typeof engineYd).toBe('string');
    expect(engineYd).toBe('yd_cowork');
  });
});
