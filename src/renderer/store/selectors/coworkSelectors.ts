import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../index';

// Base selector — returns entire cowork slice
const selectCoworkSlice = (state: RootState) => state.cowork;
const selectSkillSlice = (state: RootState) => state.skill;

// Memoized — returns same reference when currentSession unchanged
export const selectCurrentSession = createSelector(
  selectCoworkSlice,
  (cowork) => cowork.currentSession
);

// Primitives — no memoization needed (already stable references)
export const selectIsStreaming = (state: RootState): boolean => state.cowork.isStreaming;
export const selectRemoteManaged = (state: RootState): boolean => state.cowork.remoteManaged;
export const selectCurrentSessionId = (state: RootState) => state.cowork.currentSessionId;
export const selectAgentEngine = (state: RootState): string => state.cowork.config.agentEngine;
export const selectCoworkConfig = (state: RootState) => state.cowork.config;
export const selectUnreadSessionIds = (state: RootState) => state.cowork.unreadSessionIds;
export const selectPendingPermissions = (state: RootState) => state.cowork.pendingPermissions;

// Memoized — stabilizes array reference for skills
export const selectSkills = createSelector(
  selectSkillSlice,
  (skill) => skill.skills
);

export const selectActiveSkillIds = (state: RootState) => state.skill.activeSkillIds;
