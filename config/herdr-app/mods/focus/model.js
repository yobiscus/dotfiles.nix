export const KEY = "focus.workspace.v1";
export const ICONS = ["work", "star", "research", "blocked", "parked", "code", "folder", "coffee"];
export const COLORS = ["ansi4", "ansi6", "ansi5", "ansi3", "ansi1", "muted"];
export const RANK = { blocked: 4, done: 3, working: 2, idle: 1, unknown: 0 };
export const LABEL = { blocked: "Needs input", done: "New result", working: "Working", idle: "Idle", unknown: "Unknown" };
export const copy = value => JSON.parse(JSON.stringify(value));

export function initial() {
  return {
    panels: [
      { id: "priority", name: "Priority", icon: "star", color: "ansi3" },
      { id: "work", name: "Work", icon: "work", color: "ansi4" },
      { id: "research", name: "Research", icon: "research", color: "ansi5" },
      { id: "blocked", name: "Blocked", icon: "blocked", color: "ansi1" },
      { id: "parked", name: "Parked", icon: "parked", color: "muted" },
    ],
    active: "all", defaultPanel: "work", members: {}, notes: {}, order: [], views: {},
  };
}

export function normalize(value, spaces = []) {
  const data = { ...initial(), ...copy(value ?? {}) };
  if (!Array.isArray(data.panels) || !data.panels.length) data.panels = initial().panels;
  const ids = new Set(data.panels.map(p => p.id));
  if (!ids.has(data.defaultPanel)) data.defaultPanel = data.panels[0].id;
  if (data.active !== "all" && !ids.has(data.active)) data.active = "all";
  data.members = data.members ?? {};
  data.notes = data.notes ?? {};
  data.views = data.views ?? {};
  // Keep absent spaces: a remote machine being offline does not delete its work.
  for (const [id, panel] of Object.entries(data.members)) if (!ids.has(panel)) data.members[id] = data.defaultPanel;
  for (const s of spaces) data.members[s.id] ??= data.defaultPanel;
  data.order = [...new Set([...(data.order ?? []), ...spaces.map(s => s.id)])];
  return data;
}

export const owner = (data, id) => data.members[id] ?? data.defaultPanel;
export const panelSpaces = (data, spaces, panel = data.active) => {
  const order = new Map(data.order.map((id, i) => [id, i]));
  return spaces.filter(s => panel === "all" || owner(data, s.id) === panel)
    .sort((a, b) => {
      const hostA = a.machine ?? "", hostB = b.machine ?? "";
      return (hostA === hostB ? 0 : !hostA ? -1 : !hostB ? 1 : hostA.localeCompare(hostB))
        || (order.get(a.id) ?? Infinity) - (order.get(b.id) ?? Infinity);
    });
};
export const viewOf = (data, panel = data.active) => data.views[panel] ?? { folded: {} };
export const foldKey = machine => machine ?? "";

export function move(data, ids, panel, target = null, after = false) {
  if (!data.panels.some(p => p.id === panel)) throw new Error("Choose a real destination panel");
  const next = reorder(data, ids, target, after);
  for (const id of ids) next.members[id] = panel;
  return next;
}

export function reorder(data, ids, target = null, after = false) {
  const moving = new Set(ids);
  const next = copy(data);
  next.undo = [...(data.undo ?? []).slice(-19), { members: Object.fromEntries(ids.map(id => [id, owner(data, id)])), order: data.order }];
  // Assigning a panel preserves rank. Only a drop onto another row reorders.
  if (!target || moving.has(target) || !next.order.includes(target)) return next;
  next.order = next.order.filter(id => !moving.has(id));
  next.order.splice(next.order.indexOf(target) + Number(after), 0, ...ids);
  return next;
}

export function undoMove(data) {
  if (!data.undo?.length) return data;
  const next = copy(data), action = next.undo.pop();
  const valid = new Set(next.panels.map(p => p.id));
  for (const [id, panel] of Object.entries(action.members)) next.members[id] = valid.has(panel) ? panel : next.defaultPanel;
  next.order = [...new Set([...action.order, ...next.order])];
  return next;
}

export function removePanel(data, id, destination) {
  if (id === destination || !data.panels.some(p => p.id === destination)) throw new Error("Choose another panel");
  if (data.panels.length < 2) throw new Error("Keep at least one panel");
  const next = copy(data);
  next.panels = next.panels.filter(p => p.id !== id);
  for (const space of Object.keys(next.members)) if (next.members[space] === id) next.members[space] = destination;
  if (next.defaultPanel === id) next.defaultPanel = destination;
  if (next.active === id) next.active = destination;
  delete next.views[id];
  return next;
}

export function creation(data, active) {
  return { panel: data.active === "all" ? active ? owner(data, active.id) : data.defaultPanel : data.active,
    machine: active?.machine ?? "" };
}

export function summary(space, agents, terminals) {
  const list = agents.filter(a => a.space === space.id);
  const seen = new Set(list.map(a => a.address));
  for (let i = 0; i < list.length; i++) {
    for (const t of terminals) {
      if (t.parent !== list[i].address || t.state !== "live" || seen.has(t.address)) continue;
      seen.add(t.address);
      list.push({ ...t, child: true, status: t.status === "error" ? "blocked" : t.status === "done" ? "idle" : t.status });
    }
  }
  const counts = { blocked: 0, done: 0, working: 0, idle: 0, unknown: 0 };
  for (const a of list) counts[a.status in counts ? a.status : "unknown"]++;
  let status = space.status ?? (list.length ? "unknown" : "idle");
  for (const a of list) if ((RANK[a.status] ?? 0) > (RANK[status] ?? 0)) status = a.status;
  const since = Math.min(...(space.tabs ?? []).map(t => t.working_since).filter(Boolean));
  return { status, counts, list, since: Number.isFinite(since) ? since : null,
    attention: counts.blocked + counts.done || Number(status === "blocked" || status === "done") };
}

export function parseGit(text) {
  const info = { branch: "", upstream: "", ahead: 0, behind: 0, dirty: 0, staged: 0, unstaged: 0, untracked: 0, conflicts: 0 };
  for (const line of text.split("\0")) {
    if (line.startsWith("# branch.head ")) info.branch = line.slice(14).trim();
    else if (line.startsWith("# branch.upstream ")) info.upstream = line.slice(18).trim();
    else if (line.startsWith("# branch.ab ")) {
      const m = /\+(\d+) -(\d+)/.exec(line);
      if (m) { info.ahead = +m[1]; info.behind = +m[2]; }
    } else if (/^[1u] /.test(line)) {
      const xy = line.split(" ")[1];
      info.dirty++;
      if (xy[0] !== ".") info.staged++;
      if (xy[1] !== ".") info.unstaged++;
      if (line[0] === "u") info.conflicts++;
    } else if (line.startsWith("? ")) { info.dirty++; info.untracked++; }
  }
  return info;
}
