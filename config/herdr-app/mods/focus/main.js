import { View, div } from "gpui-kit";
import { h_flex, v_flex, InputState } from "gpui-base";
import { spaces, panes, agents, terminals, machines, shared, setShared, run, props, theme, openOverlay, nextCommand, window } from "herdr";
import { KEY, normalize, owner, panelSpaces, viewOf, foldKey, move, reorder, undoMove, creation, summary, RANK } from "./model.js";
import GitMetadata, { location } from "./git.js";
import { initDialog, renderDialog } from "./dialogs.js";
import { renderSidebar } from "./sidebar.js";
import { SPACE_ROW_HEIGHT, button, icon, stock } from "./ui.js";

export default class Focus extends View {
  init(_props, cx) {
    if (props()?.mode === "empty") return;
    if (props()?.mode) { initDialog(this, cx); return; }
    this.handle = cx.focus_handle();
    this.git = new GitMetadata();
    this.selected = new Set();
    this.anchor = null;
    this.drag = null;
    this.over = null;
    this.preview = null;
    this.panelPicking = false;
    this.searching = false;
    this.query = "";
    this.searchAll = false;
    this.statuses = {};
    this.locations = {};
    this.pendingCreations = [];
    this.lastActive = spaces().find(s => s.active)?.id ?? null;
    this.commit(normalize(shared(KEY), spaces()));
    this.observedPanel = this.data.active;
    this.input = InputState.new({ placeholder: "Search spaces, agents, branches…" });
    this.input.on("change", (_e, cx) => {
      this.query = this.input.value();
      this.updateView({ query: this.query });
      cx.notify();
    });
    this.input.on("submit", () => { const first = this.visible()[0]; if (first) this.selectSpace(first.id, true); });
    this.restoreSearch();
    cx.spawn(async cx => {
      for (;;) {
        const command = await nextCommand();
        this.command(command, cx);
        cx.notify();
      }
    });
    cx.timer.every(2000, cx => {
      if (window().active || this.git.invalid.size) this.git.refresh(spaces(), panes(), cx, this.current());
    });
    // Only labels showing elapsed minutes need a clock redraw.
    cx.timer.every(30000, cx => cx.notify());
  }

  get data() { return normalize(shared(KEY), spaces()); }
  commit(data) { setShared(KEY, data); }
  updateView(patch, panel = this.data.active) {
    const data = this.data;
    data.views[panel] = { ...viewOf(data, panel), ...patch };
    this.commit(data);
  }
  restoreSearch() {
    const saved = viewOf(this.data);
    this.query = saved.query ?? "";
    this.searchAll = saved.searchAll ?? false;
    this.searching = !!this.query;
    this.input.set_value(this.query);
  }
  current() {
    const data = this.data, allowed = panelSpaces(data, spaces());
    return allowed.find(s => s.active) ?? allowed.find(s => s.id === viewOf(data).last) ?? allowed[0];
  }
  info(space) { return this.summaries?.get(space.id) ?? summary(space, agents(), terminals()); }
  displayPanel() { return this.preview ?? this.data.active; }
  visible(panel = this.displayPanel(), query = this.preview ? "" : this.query, searchAll = this.searchAll) {
    const data = this.data;
    const list = panelSpaces(data, spaces(), query && searchAll ? "all" : panel);
    const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return list.filter(s => {
      const git = this.git.get(s, this.live?.panes ?? panes());
      const text = [s.name, s.machine ?? "local", s.folder, s.branch, git?.branch, data.notes[s.id],
        ...this.info(s).list.flatMap(a => [a.title, a.program?.name, a.app])].join(" ").toLowerCase();
      return words.every(word => text.includes(word));
    });
  }
  showContent(show) {
    const child = show ? "focus-terminal" : "focus-empty";
    if (this.content === child) return;
    this.content = child;
    run("layout.select", { stack: "focus-content", child });
  }

  sync() {
    if (this.panelPicking && !this.handle.is_focused()) this.panelPicking = false;
    const sp = spaces(), raw = shared(KEY), data = normalize(raw, sp);
    let changed = !raw || data.active !== raw.active || data.defaultPanel !== raw.defaultPanel
      || data.order.length !== raw.order?.length || sp.some(s => data.members[s.id] !== raw.members?.[s.id]);
    const active = sp.find(s => s.active);
    this.pendingCreations = this.pendingCreations.filter(p => Date.now() - p.at < 60000);
    for (const fresh of sp.filter(s => !raw?.members?.[s.id])) {
      const at = this.pendingCreations.findIndex(p => p.machine === (fresh.machine ?? "") && !p.before.has(fresh.id));
      if (at >= 0) {
        const requested = this.pendingCreations.splice(at, 1)[0].panel;
        data.members[fresh.id] = data.panels.some(p => p.id === requested) ? requested : data.defaultPanel;
      }
      else if (fresh.active) data.members[fresh.id] = data.active === "all" ? owner(data, this.lastActive) : data.active;
      changed = true;
    }
    const waiting = this.awaitSelection && active?.id !== this.awaitSelection.id
      && (active?.id ?? null) === this.lastActive && Date.now() < this.awaitSelection.until;
    if (!waiting && (active?.id ?? null) !== this.lastActive) {
      const reveal = this.awaitSelection && this.awaitSelection.id === active?.id ? this.awaitSelection.reveal : true;
      this.lastActive = active?.id ?? null;
      this.awaitSelection = null;
      this.selected = new Set(active ? [active.id] : []);
      this.anchor = active?.id ?? null;
      if (active) {
        if (data.active !== "all" && owner(data, active.id) !== data.active) data.active = owner(data, active.id);
        const old = viewOf(data, data.active);
        data.views[data.active] = { ...old, last: active.id,
          folded: reveal ? { ...old.folded, [foldKey(active.machine)]: false } : old.folded };
        changed = true;
      }
    }
    if (changed) this.commit(data);
    if (data.active !== this.observedPanel) {
      this.observedPanel = data.active;
      this.restoreSearch();
      this.selected.clear();
    }
    if (!waiting) {
      const inside = panelSpaces(data, sp);
      for (const id of this.selected) if (!inside.some(s => s.id === id)) this.selected.delete(id);
      if (active && !inside.some(s => s.id === active.id) && inside.length) this.selectSpace(inside[0].id);
      this.showContent(inside.length > 0);
    }
    for (const s of sp) {
      const place = JSON.stringify(location(s, this.live.panes));
      if (this.locations[s.id] !== place) { this.locations[s.id] = place; this.git.invalidate(s, this.live.panes); }
      const status = this.info(s).status;
      if (this.statuses[s.id] === "working" && status !== "working") this.git.invalidate(s, panes());
      this.statuses[s.id] = status;
    }
  }

  selectPanel(id, cx) {
    const data = this.data;
    if (id !== "all" && !data.panels.some(p => p.id === id)) return;
    this.panelPicking = false;
    this.cancelDrag();
    data.active = id;
    this.commit(data);
    this.observedPanel = id;
    this.restoreSearch();
    this.selected.clear();
    const list = panelSpaces(data, spaces(), id);
    const target = list.find(s => s.id === viewOf(data, id).last) ?? list.find(s => s.active) ?? list[0];
    if (target) this.selectSpace(target.id, false, false);
    else { this.showContent(false); this.handle.focus(); }
    cx?.notify();
  }

  selectSpace(id, fromSearch = false, reveal = true) {
    const space = spaces().find(s => s.id === id);
    if (!space) return;
    this.panelPicking = false;
    const data = this.data;
    if (fromSearch && data.active !== "all") data.active = owner(data, id);
    const old = viewOf(data);
    data.views[data.active] = { ...old, last: id, folded: reveal ? { ...old.folded, [foldKey(space.machine)]: false } : old.folded };
    this.commit(data);
    this.selected = new Set([id]);
    this.anchor = id;
    this.awaitSelection = { id, reveal, until: Date.now() + 2000 };
    this.git.invalidate(space, panes());
    this.showContent(true);
    run("space.select", { id });
  }

  newSpace(machine) {
    const data = this.data, active = spaces().find(s => s.active);
    const destination = creation(data, active);
    if (machine !== undefined) {
      destination.machine = machine ?? "";
      if (!machines().some(m => (m.name ?? "") === destination.machine && m.layout === "ready")) return;
    }
    this.pendingCreations.push({ ...destination, before: new Set(spaces().map(s => s.id)), at: Date.now() });
    run("space.new", { machine: destination.machine });
  }

  openNewSpaceMenu() {
    openOverlay({ mod: "focus", kind: "popup", width: 260, height: Math.min(320, 38 + machines().length * 28),
      props: { mode: "new-space" } });
  }

  openPanel(id) {
    openOverlay({ mod: "focus", kind: "dialog", width: 420, height: 390, props: { mode: "panel", panel: id } });
  }
  openNote(id = this.current()?.id) {
    if (id) openOverlay({ mod: "focus", kind: "dialog", width: 520, height: 350, props: { mode: "note", space: id } });
  }
  openAgents(space) {
    this.selectSpace(space.id);
    openOverlay({ mod: "focus", kind: "popup", width: 400, height: 350, props: { mode: "agents", space: space.id } });
  }
  jumpAttention(space) {
    if (this.query) { this.query = ""; this.input.set_value(""); this.updateView({ query: "" }); }
    this.selectSpace(space.id);
    const list = this.info(space).list;
    const first = [...list].sort((a, b) => (RANK[b.status] ?? 0) - (RANK[a.status] ?? 0))[0];
    if (first) run(first.pane ? "pane.focus" : "terminal.peek", { terminal: first.address });
  }
  context(space, cx) {
    this.cancelDrag();
    if (!this.selected.has(space.id)) this.selected = new Set([space.id]);
    openOverlay({ mod: "focus", kind: "popup", width: 240, height: 300,
      props: { mode: "space-menu", space: space.id, ids: [...this.selected] } });
    cx.notify();
  }
  toggleMachine(name, panel = this.displayPanel()) {
    const data = this.data, old = viewOf(data, panel);
    this.updateView({ folded: { ...old.folded, [foldKey(name)]: !old.folded?.[foldKey(name)] } }, panel);
  }
  focusSearch(all, cx) {
    this.searching = true;
    if (all !== undefined) this.searchAll = all;
    this.updateView({ searchAll: this.searchAll });
    this.input.focus();
    cx.notify();
  }

  command(command, cx) {
    if (command === "focus") { this.handle.focus(); return; }
    this.panelPicking = command === "panel-pick";
    if (command === "new") this.newSpace();
    else if (command.startsWith("new:")) this.newSpace(command.slice(4));
    else if (command === "new-menu") this.openNewSpaceMenu();
    else if (command === "note") this.openNote();
    else if (command === "search") this.focusSearch(false, cx);
    else if (command === "search-all") this.focusSearch(true, cx);
    else if (command === "undo") this.commit(undoMove(this.data));
    else if (command === "panel-pick") {
      this.cancelDrag();
      run("layout.show", { id: "sidebar" });
      this.handle.focus();
    } else if (command.startsWith("panel-")) {
      const ids = ["all", ...this.data.panels.map(p => p.id)];
      const delta = command.endsWith("prev") ? -1 : 1;
      this.selectPanel(ids[(ids.indexOf(this.data.active) + delta + ids.length) % ids.length], cx);
    } else if (command.startsWith("space")) {
      const list = panelSpaces(this.data, spaces()), current = list.findIndex(s => s.active);
      if (!list.length) return;
      const at = /^space\d$/.test(command) ? +command.slice(5) - 1
        : current < 0 ? command.endsWith("prev") ? list.length - 1 : 0
          : (current + (command.endsWith("prev") ? -1 : 1) + list.length) % list.length;
      if (list[at]) this.selectSpace(list[at].id);
    }
  }

  press(space, e, cx) {
    this.cancelDrag();
    this.drag = { id: space.id, start: e.position, ids: this.selected.has(space.id) ? [...this.selected] : [space.id], moving: false,
      modifiers: e.modifiers, source: this.data.active };
    this.handle.focus();
    cx.stop_propagation();
  }
  hoverDrop(e, target, cx) {
    if (!this.drag) return;
    cx.stop_propagation();
    if (!this.drag.moving && Math.hypot(e.position.x - this.drag.start.x, e.position.y - this.drag.start.y) < 5) return;
    const valid = !target.machineSpecified || this.drag.ids.every(id => (spaces().find(s => s.id === id)?.machine ?? null) === target.machine);
    const over = valid && (target.panel !== "all" || target.reorderOnly) ? { ...target, after: !!target.id && (e.local_position?.y ?? 0) > SPACE_ROW_HEIGHT / 2 } : null;
    const entering = over?.panel !== this.over?.panel;
    if (!this.drag.moving || JSON.stringify(this.over) !== JSON.stringify(over)) {
      this.drag.moving = true;
      this.over = over;
      cx.notify();
    }
    if (entering && over && !target.machineSpecified) {
      const panel = over.panel;
      cx.timer.after(650, cx => {
        if (this.drag?.moving && this.over?.panel === panel) { this.preview = panel; cx.notify(); }
      });
    }
  }
  release(space, e, cx, target) {
    cx.stop_propagation();
    if (!this.drag) return;
    if (target) this.hoverDrop(e, target, cx);
    const drag = this.drag, over = this.over;
    this.cancelDrag();
    if (drag.moving) {
      if (over && !drag.ids.includes(over.id)) this.commit(over.reorderOnly
        ? reorder(this.data, drag.ids, over.id, over.after) : move(this.data, drag.ids, over.panel, over.id, over.after));
    } else if (space?.id === drag.id) {
      if (drag.modifiers.control || drag.modifiers.platform) {
        this.selected.has(space.id) ? this.selected.delete(space.id) : this.selected.add(space.id);
        this.anchor = space.id;
      } else if (drag.modifiers.shift && this.anchor) {
        const list = this.visible(), a = list.findIndex(s => s.id === this.anchor), b = list.findIndex(s => s.id === space.id);
        if (a >= 0) this.selected = new Set(list.slice(Math.min(a, b), Math.max(a, b) + 1).map(s => s.id));
      } else this.selectSpace(space.id);
    }
    cx.notify();
  }
  cancelDrag() { this.drag = null; this.over = null; this.preview = null; }

  onKey(e, cx) {
    if (this.panelPicking) {
      cx.stop_propagation();
      const key = e.keystroke ?? e.key;
      if (/^[1-9]$/.test(key)) {
        const id = ["all", ...this.data.panels.map(p => p.id)][Number(key) - 1];
        if (id) this.selectPanel(id, cx);
      } else {
        this.panelPicking = false;
        const active = this.current();
        if (active?.active) run("space.select", { id: active.id });
      }
      cx.notify();
      return;
    }
    if (e.key === "escape") {
      if (this.drag) { this.cancelDrag(); cx.stop_propagation(); cx.notify(); return; }
      this.cancelDrag(); this.selected.clear(); this.query = ""; this.input.set_value(""); this.searching = false;
      this.updateView({ query: "" });
      const active = this.current(); if (active) this.selectSpace(active.id);
      cx.stop_propagation(); cx.notify();
    }
  }

  render(cx) {
    if (props()?.mode === "empty") {
      const t = theme(), data = this.data, panel = data.panels.find(p => p.id === data.active);
      return v_flex().size_full().items_center().justify_center().gap(14).bg(t.canvas).text_color(t.muted)
        .child(icon(panel?.icon ?? "all", 30).text_color(t[panel?.color] ?? t.dim))
        .child(div().text_size(20).font_semibold().text_color(t.foreground).child(panel?.name ?? "All spaces"))
        .child(div().text_size(13).child("Create a space here, or drag one onto this panel's icon."))
        .child(h_flex().gap(2)
          .child(button("empty-new-space", "New space", () => run("focus.new"), true))
          .child(button("empty-new-machine", stock("chevron-down", 12), () => run("focus.new-menu"), true)
            .tooltip("Choose a machine for the new space")));
    }
    if (props()?.mode) return renderDialog(this);
    this.live = { spaces: spaces(), panes: panes(), machines: machines() };
    const liveAgents = agents(), liveTerminals = terminals();
    this.summaries = new Map(this.live.spaces.map(s => [s.id, summary(s, liveAgents, liveTerminals)]));
    this.sync();
    this.renderData = this.data;
    return renderSidebar(this, cx);
  }
}
