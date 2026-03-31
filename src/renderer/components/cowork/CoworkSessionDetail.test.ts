import { test, expect, describe } from 'vitest';
import { buildDisplayItems, buildConversationTurns } from './CoworkSessionDetail';
import type { CoworkMessage } from '../../types/cowork';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let _id = 0;
function makeMsg(overrides: Partial<CoworkMessage> & { type: CoworkMessage['type'] }): CoworkMessage {
  return {
    id: `msg-${++_id}`,
    content: '',
    timestamp: Date.now(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('CoworkSessionDetail pure functions', () => {
  test('buildDisplayItems returns empty array for empty messages', () => {
    const result = buildDisplayItems([]);
    expect(result).toEqual([]);
  });

  test('buildDisplayItems groups tool_use + tool_result into single ToolGroupItem', () => {
    const toolUse = makeMsg({
      type: 'tool_use',
      metadata: { toolUseId: 'tu-1', toolName: 'bash' },
    });
    const toolResult = makeMsg({
      type: 'tool_result',
      metadata: { toolUseId: 'tu-1' },
    });

    const result = buildDisplayItems([toolUse, toolResult]);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('tool_group');
    const group = result[0] as { type: 'tool_group'; toolUse: CoworkMessage; toolResult?: CoworkMessage | null };
    expect(group.toolUse).toBe(toolUse);
    expect(group.toolResult).toBe(toolResult);
  });

  test('buildDisplayItems preserves user and assistant messages as MessageItems', () => {
    const user = makeMsg({ type: 'user', content: 'hello' });
    const assistant = makeMsg({ type: 'assistant', content: 'hi there' });

    const result = buildDisplayItems([user, assistant]);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ type: 'message', message: user });
    expect(result[1]).toEqual({ type: 'message', message: assistant });
  });

  test('buildDisplayItems assigns orphan tool_result when no toolUseId match', () => {
    // tool_result with no matching toolUseId and no adjacent tool_use → treated as a plain message
    const toolResult = makeMsg({
      type: 'tool_result',
      metadata: { toolUseId: 'nonexistent-id' },
    });

    const result = buildDisplayItems([toolResult]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ type: 'message', message: toolResult });
  });

  test('buildConversationTurns groups user message with following assistant items into a turn', () => {
    const user = makeMsg({ type: 'user', content: 'do something' });
    const assistant = makeMsg({ type: 'assistant', content: 'done' });

    const displayItems = buildDisplayItems([user, assistant]);
    const turns = buildConversationTurns(displayItems);

    expect(turns).toHaveLength(1);
    expect(turns[0].userMessage).toBe(user);
    expect(turns[0].assistantItems).toHaveLength(1);
    expect(turns[0].assistantItems[0]).toEqual({ type: 'assistant', message: assistant });
  });

  test('buildConversationTurns creates orphan turn for assistant without preceding user message', () => {
    const assistant = makeMsg({ type: 'assistant', content: 'initial response' });

    const displayItems = buildDisplayItems([assistant]);
    const turns = buildConversationTurns(displayItems);

    expect(turns).toHaveLength(1);
    expect(turns[0].userMessage).toBeNull();
    expect(turns[0].id).toMatch(/^orphan-/);
    expect(turns[0].assistantItems).toHaveLength(1);
    expect(turns[0].assistantItems[0]).toEqual({ type: 'assistant', message: assistant });
  });
});
