import { exec } from "herdr";
import { parseGit } from "./model.js";

export function location(space, panes) {
  const tabs = new Set(space.tabs?.map(t => t.id));
  const cwd = panes.find(p => tabs.has(p.tab) && p.cwd)?.cwd || space.folder;
  return { cwd, on: space.machine ?? null };
}
export const locationKey = place => JSON.stringify([place.on, place.cwd]);

export default class GitMetadata {
  constructor() { this.cache = {}; this.busy = new Set(); this.invalid = new Set(); }
  get(space, panes) { return this.cache[locationKey(location(space, panes))]; }
  invalidate(space, panes) { this.invalid.add(locationKey(location(space, panes))); }

  refresh(spaces, panes, cx, selected) {
    const now = Date.now();
    const unique = new Map(spaces.map(s => { const p = location(s, panes); return [locationKey(p), p]; }));
    for (const key of this.invalid) if (!unique.has(key)) this.invalid.delete(key);
    const selectedKey = selected ? locationKey(location(selected, panes)) : null;
    const due = [...unique].filter(([key, place]) => place.cwd && !this.busy.has(key)
      && (this.invalid.has(key) || now - (this.cache[key]?.checked ?? 0) > (key === selectedKey ? 15000 : 60000)))
      .sort(([a], [b]) => Number(b === selectedKey) - Number(a === selectedKey));
    // Bound subprocess fan-out, including when many remote spaces reconnect.
    for (const [key, place] of due.slice(0, Math.max(0, 3 - this.busy.size))) {
      this.busy.add(key);
      this.invalid.delete(key);
      cx.spawn(async cx => {
        try {
          const r = await exec("git", ["--no-optional-locks", "-c", "core.fsmonitor=false", "status", "--porcelain=v2", "-z", "--branch", "--no-renames", "--untracked-files=all"], { ...place, timeout: 10000 });
          if (r.code === 0) this.cache[key] = { ...parseGit(r.stdout), checked: Date.now(), repo: true };
          else if (/not a git repository/i.test(r.stderr)) this.cache[key] = { checked: Date.now(), repo: false };
          else throw new Error(r.stderr || "Git unavailable");
        } catch (e) {
          this.cache[key] = { ...this.cache[key], checked: Date.now(), stale: true, error: String(e.message ?? e) };
        } finally { this.busy.delete(key); cx.notify(); }
      });
    }
  }
}
