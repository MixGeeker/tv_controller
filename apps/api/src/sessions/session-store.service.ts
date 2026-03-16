import { Injectable, NotFoundException } from '@nestjs/common';
import type { SessionInfo } from '@tv-controller/core';

@Injectable()
export class SessionStoreService {
  private readonly sessions = new Map<string, SessionInfo>();

  list(): SessionInfo[] {
    return [...this.sessions.values()].sort((left, right) => {
      const leftDate = left.updatedAt ?? '';
      const rightDate = right.updatedAt ?? '';
      return rightDate.localeCompare(leftDate);
    });
  }

  get(sessionId: string): SessionInfo {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundException(`Session ${sessionId} was not found`);
    }

    return session;
  }

  upsert(session: SessionInfo): SessionInfo {
    this.sessions.set(session.sessionId, session);
    return session;
  }

  upsertMany(sessions: SessionInfo[]): SessionInfo[] {
    sessions.forEach((session) => this.upsert(session));
    return sessions;
  }
}
