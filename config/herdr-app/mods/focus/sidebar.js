import { div } from "gpui-kit";
import { h_flex, v_flex, Input } from "gpui-base";
import { spaces, theme, run } from "herdr";
import { owner, panelSpaces, viewOf, foldKey, LABEL } from "./model.js";
import { location } from "./git.js";
import { SPACE_ROW_HEIGHT, icon, stock, status, label, tool, inputStyle } from "./ui.js";

const shortPath = path => (path || "Home directory").replace(/^\/(?:home|Users)\/[^/]+/, "~");
const age = since => `${Math.max(1, Math.floor((Date.now() - since) / 60000))}m`;

function panelButton(view, panel, index) {
  const data = view.renderData, t = theme(), id = panel?.id ?? "all";
  const members = panelSpaces(data, view.live.spaces, id);
  const attention = members.reduce((n, s) => n + view.info(s).attention, 0);
  const blocked = members.some(s => view.info(s).status === "blocked");
  const counts = members.reduce((sum, s) => {
    const info = view.info(s);
    for (const state of ["blocked", "done", "working"]) sum[state] += info.counts[state] || Number(info.status === state);
    return sum;
  }, { blocked: 0, done: 0, working: 0 });
  const active = (view.preview ?? data.active) === id, over = view.drag?.moving && view.over?.panel === id;
  return h_flex().id(`focus-panel-${id}`).relative().size(34).flex_none().items_center().justify_center().rounded(8)
    .border_1().border_color(over ? t.accent : "#00000000").bg(active ? t.selected : t.chrome)
    .text_color(active ? t[panel?.color] ?? t.foreground : t.muted).cursor_pointer().hover(el => el.bg(t.hover))
    .tooltip(`${panel?.name ?? "All spaces"} · ${members.length} spaces\n${counts.blocked} need input · ${counts.done} new results · ${counts.working} working${id === data.defaultPanel ? "\nDefault panel" : ""}`)
    .on_mouse_move((e, cx) => view.hoverDrop(e, { panel: id }, cx))
    .on_mouse_up("left", (e, cx) => {
      cx.stop_propagation();
      if (view.drag) view.release(null, e, cx, { panel: id });
      else view.selectPanel(id, cx);
    })
    .on_mouse_down("right", (_e, cx) => { cx.stop_propagation(); if (panel) view.openPanel(id); })
    .child(icon(panel?.icon ?? "all", 18))
    .when(active, el => el.child(div().absolute().bottom(0).left(12).right(12).h(2).rounded(1).bg(t[panel?.color] ?? t.accent)))
    .when(view.panelPicking && index < 9, el => el.child(h_flex().id(`focus-panel-number-${id}`).absolute().bottom(-2).right(-2)
      .size(16).rounded(4).border_1().border_color(t.chrome).items_center().justify_center().text_center()
      .bg(t.foreground).text_color(t.background).font_family("DejaVu Sans").text_size(11).line_height("12px").font_bold().child(String(index + 1))))
    .when(attention > 0, el => el.child(h_flex().id(`focus-panel-alert-${id}`).absolute().top(-2).right(-2)
      .min_w(16).h(16).px(3).rounded(8).border_1().border_color(t.chrome).bg(blocked ? t.blocked : t.done).text_color(t.background)
      .font_family("DejaVu Sans").text_size(11).line_height("12px").font_bold().items_center().justify_center().text_center().cursor_pointer()
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
      .on_click((_e, cx) => {
        cx.stop_propagation(); view.selectPanel(id, cx);
        const target = members.find(s => view.info(s).status === "blocked") ?? members.find(s => view.info(s).attention);
        if (target) view.jumpAttention(target);
      }).child(attention > 9 ? "9+" : String(attention))));
}

function gitTail(view, space) {
  const t = theme(), git = view.git.get(space, view.live.panes), branch = git?.branch ?? space.branch;
  const showBranch = branch && branch !== space.name && branch !== "main" && branch !== "master";
  const hint = git?.stale ? `Git unavailable: ${git.error}` : git?.repo
    ? `${branch || "Detached HEAD"}${git.upstream ? ` → ${git.upstream}` : " · no upstream"}\n${git.staged} staged · ${git.unstaged} unstaged · ${git.untracked} untracked\nLast checked ${new Date(git.checked).toLocaleTimeString()}` : branch ?? "Checking Git…";
  const badge = (text, color = t.dim) => div().flex_none().text_color(color).child(text);
  return h_flex().min_w(0).flex_shrink(1).max_w(170).gap(5).items_center().text_size(10.5).tooltip(hint)
    .when(showBranch, el => el.child(div().min_w(0).max_w(90).truncate().text_color(t.muted).child(branch)))
    .when(git?.ahead > 0, el => el.child(badge(`↑${git.ahead}`, t.ansi2)))
    .when(git?.behind > 0, el => el.child(badge(`↓${git.behind}`, t.ansi3)))
    .when(git?.dirty > 0, el => el.child(badge(`Δ${git.dirty}`, git.conflicts ? t.blocked : t.muted)))
    .when(git?.stale, el => el.child(badge("?", t.ansi3)));
}

function spaceRow(view, space, compact, displayed) {
  const data = view.renderData, t = theme(), info = view.info(space);
  const active = space.active && data.active === displayed;
  const selected = view.selected.has(space.id), place = location(space, view.live.panes);
  const ownerPanel = data.panels.find(p => p.id === owner(data, space.id));
  const over = view.drag?.moving && view.over?.id === space.id && !view.drag.ids.includes(space.id);
  const target = { panel: displayed, id: space.id, machineSpecified: true, machine: space.machine ?? null, reorderOnly: displayed === "all" };
  return h_flex().id(`focus-space-${displayed}-${space.id}`).relative().h(SPACE_ROW_HEIGHT).px(compact ? 4 : 6).gap(6)
    .flex_none().items_center().rounded(6).bg(active ? t.selected : selected ? t.raised : t.chrome)
    .cursor_pointer().hover(el => el.bg(active ? t.selected : t.hover))
    .tooltip(`${space.name}\n${place.cwd || "Home directory"}\n${space.machine ?? "This computer"} · ${ownerPanel?.name ?? ""}`)
    .when(active, el => el.child(div().absolute().left(0).top(6).bottom(6).w(2).rounded(1).bg(t.accent)))
    .when(view.drag?.moving && view.drag.ids.includes(space.id), el => el.opacity(0.4))
    .when(over, el => el.child(div().absolute().left(5).right(5).h(2).bg(t.accent)
      .when(view.over.after, el => el.bottom(0)).when(!view.over.after, el => el.top(0))))
    .on_mouse_down("left", (e, cx) => view.press(space, e, cx))
    .on_mouse_move((e, cx) => view.hoverDrop(e, target, cx))
    .on_mouse_up("left", (e, cx) => view.release(space, e, cx, target))
    .on_mouse_down("right", (_e, cx) => { cx.stop_propagation(); view.context(space, cx); })
    .on_hover((on, cx) => { if (view.hovered === space.id || on) { view.hovered = on ? space.id : null; cx.notify(); } })
    .when(compact, el => el.justify_center())
    .child(h_flex().id(`focus-status-${displayed}-${space.id}`).relative().size(18).flex_none().items_center().justify_center()
      .cursor_pointer().tooltip(`${LABEL[info.status] ?? "No agent"}${info.counts.working > 1 ? ` · ${info.counts.working} working` : ""}\nClick to focus the agent; right-click for all agents`)
      .on_mouse_down("left", (_e, cx) => cx.stop_propagation())
      .on_mouse_up("left", (_e, cx) => cx.stop_propagation())
      .on_click((_e, cx) => { cx.stop_propagation(); view.jumpAttention(space); })
      .on_mouse_down("right", (_e, cx) => { cx.stop_propagation(); view.openAgents(space); })
      .child(status(info.status, 16))
      .when(info.counts.blocked > 1, el => el.child(div().absolute().right(-5).bottom(-4).text_size(8).text_color(t.blocked).child(String(info.counts.blocked)))))
    .when(!compact, el => el.child(h_flex().flex_1().gap(5).items_center().min_w(0)
      .child(div().flex_1().min_w(0).truncate().font_medium().text_size(12.8).text_color(t.foreground).child(space.name))
      .when(data.active === "all" || view.query && view.searchAll, el => el.child(h_flex().flex_none().tooltip(ownerPanel?.name ?? "")
        .child(icon(ownerPanel?.icon ?? "folder", 11).text_color(t[ownerPanel?.color] ?? t.dim))))
      .child(gitTail(view, space))
      .when(info.status === "working" && info.since, el => el.child(div().flex_none().text_size(10).text_color(t.dim).child(age(info.since))))));
}

function machineRow(view, name, members, compact, panel) {
  const data = view.renderData, t = theme(), folded = viewOf(data, panel).folded?.[foldKey(name)];
  const machine = view.live.machines.find(m => m.name === name), attention = members.reduce((n, s) => n + view.info(s).attention, 0);
  return h_flex().id(`focus-machine-${panel}-${name === null ? "local" : `remote-${name}`}`).h(26).px(compact ? 0 : 4).gap(6).items_center()
    .text_size(10.5).text_color(t.dim).cursor_pointer().when(compact, el => el.justify_center())
    .tooltip(`${name ?? "This computer"} · ${members.length} spaces${machine?.layout === "unavailable" ? " · unavailable" : ""}`)
    .on_click(() => view.toggleMachine(name, panel)).child(stock(name ? "server" : "monitor", 12))
    .when(!compact, el => el.child(div().flex_1().truncate().child(name ?? "This computer"))
      .when(machine?.layout && machine.layout !== "ready", el => el.child(label(machine.layout)))
      .child(div().text_size(10).child(String(members.length)))
      .when(folded && attention, el => el.child(div().text_color(t.blocked).child(`● ${attention}`))))
    .when(panel === "all", el => el.child(tool(`focus-machine-new-${foldKey(name)}`, stock("plus", 11),
      machine?.layout === "ready" ? `New space on ${name ?? "this computer"}` : `${name ?? "This computer"} · ${machine?.layout ?? "unavailable"}`,
      () => view.newSpace(name)).size(18).when(machine?.layout !== "ready", el => el.cursor_default().opacity(0.35))))
    .when(!compact, el => el.child(stock(`chevron-${folded ? "right" : "down"}`, 10)));
}

function newSpaceControls(view, compact) {
  const t = theme();
  return h_flex().flex_none().items_center().rounded(6).border_1().border_color(t.border)
    .child(tool("focus-space-new", stock("plus"), `New space on ${spaces().find(s => s.active)?.machine ?? "this computer"}`,
      () => view.newSpace()).when(compact, el => el.w(22)))
    .child(div().w(1).h(14).bg(t.border))
    .child(tool("focus-space-new-machine", stock("chevron-down", 10), "Choose a machine for the new space",
      () => view.openNewSpaceMenu()).w(compact ? 16 : 18));
}

function details(view) {
  const t = theme(), data = view.renderData, space = view.current();
  if (!space) return v_flex().px(16).py(14).border_t(1).border_color(t.border).child(label("Create a space or move one into this panel."));
  const place = location(space, view.live.panes), git = view.git.get(space, view.live.panes), info = view.info(space), text = data.notes[space.id] ?? "";
  return v_flex().id("focus-details").flex_none().px(16).pt(13).pb(15).gap(9).border_t(1).border_color(t.border)
    .child(h_flex().items_center().gap(6)
      .child(div().flex_1().min_w(0).truncate().text_size(11.5).font_semibold().text_color(t.foreground).child(space.name))
      .child(tool("focus-agent-details", status(info.status, 13), "Show this space's agents", () => view.openAgents(space)))
      .child(tool("focus-edit-note", icon("note", 13), "Edit note", () => view.openNote(space.id))))
    .child(div().id("focus-note-preview").max_h(50).overflow_hidden().text_size(11.5).text_color(text ? t.muted : t.dim).cursor_pointer()
      .on_click(() => view.openNote(space.id)).child(text || "Add a note for when you return…"))
    .child(h_flex().id("focus-path").min_w(0).gap(5).items_center()
      .child(div().flex_1().min_w(0).truncate().text_size(11).text_color(t.muted).tooltip(place.cwd ?? "Home directory").child(shortPath(place.cwd)))
      .child(tool("focus-copy-path", icon("copy", 12), "Copy full path", (_e, cx) => cx.write_to_clipboard(place.cwd ?? "")))
      .child(tool("focus-open-folder", icon("folder", 12), "Open folder in Herdr Files", () => {
        view.selectSpace(space.id); run("layout.select", { stack: "panel-body", child: "files" }); run("layout.show", { id: "panel" });
      })))
    .when(git?.repo || space.branch, el => el
      .child(h_flex().gap(7).items_center().text_size(10.5).text_color(t.dim).child(stock("branch", 12))
        .child(div().flex_1().min_w(0).truncate().tooltip(`${git?.branch ?? space.branch}${git?.upstream ? ` → ${git.upstream}` : ""}`).child(git?.branch ?? space.branch))
        .when(git?.ahead || git?.behind, el => el.child(div().child(`↑${git.ahead} ↓${git.behind}`))))
      .when(git?.repo, el => el.child(div().text_size(10.5).text_color(git.stale ? t.ansi3 : t.dim)
        .tooltip(git.error ?? "Counts may overlap when a file has both staged and unstaged changes.")
        .child(git.stale ? "Git unavailable · showing last known values" : `${git.staged} staged · ${git.unstaged} unstaged · ${git.untracked} untracked`))))
    .when(git?.stale && !git.repo, el => el.child(label("Git unavailable")));
}

export function renderSidebar(view) {
  const data = view.renderData, t = theme(), compact = view.width !== undefined && view.width < 160, panel = view.preview ?? data.active;
  const named = data.panels.find(p => p.id === panel), visible = view.visible();
  // ponytail: keep each scroll area mounted, with inactive viewports clipped to zero.
  // Removing it discards GPUI's scroll state. All + exclusive panels costs
  // O(n) rows; switch to virtualization when Herdr supports item drag handlers.
  const lists = ["all", ...data.panels.map(p => p.id)].map(id => {
    const active = id === panel, saved = viewOf(data, id), folded = saved.folded ?? {};
    const members = active ? visible : view.visible(id, saved.query ?? "", saved.searchAll ?? false);
    const query = active ? (view.preview ? "" : view.query) : saved.query ?? "";
    const hosts = [...new Set([...members.map(s => s.machine ?? null),
      ...(id === "all" && !query ? view.live.machines.map(m => m.name) : [])])]
      .sort((a, b) => a === null ? -1 : b === null ? 1 : a.localeCompare(b));
    const elements = hosts.flatMap(name => {
      const mine = members.filter(s => (s.machine ?? null) === name);
      return [machineRow(view, name, mine, compact, id), ...(!folded[foldKey(name)] ? mine.map(s => spaceRow(view, s, compact, id)) : [])];
    });
    return div().id(`focus-list-holder-${id}`).w_full().relative()
      .when(active, el => el.flex_1().min_h(0))
      .when(!active, el => el.h(0).flex_none().overflow_hidden())
      .child(v_flex().id(`focus-list-${id}`).size_full().px(compact ? 3 : 4).overflow_y_scrollbar().children(elements));
  });
  return v_flex().id("focus-sidebar").size_full().min_h(0).bg(t.chrome).text_color(t.foreground)
    .track_focus(view.handle).on_key_down((e, cx) => view.onKey(e, cx))
    .on_size_change((size, cx) => { if (view.width !== size.width) { view.width = size.width; cx.notify(); } })
    .on_hover((on, cx) => { if (!on && view.drag) { view.cancelDrag(); cx.notify(); } })
    .on_mouse_down_out((_e, cx) => { if (view.drag) { view.cancelDrag(); cx.notify(); } })
    .on_mouse_up("left", (_e, cx) => { if (view.drag) { view.cancelDrag(); cx.notify(); } })
    .child(h_flex().id("focus-panels").h(compact ? 40 : 50).flex_none().px(compact ? 3 : 10).gap(4).items_center()
      .when(compact, el => el.overflow_x_scrollbar()).child(panelButton(view, null, 0))
      .when(!compact, el => el.child(div().w(1).h(18).mx(3).bg(t.border)))
      .child(h_flex().id("focus-panel-scroll").flex_1().min_w(0).h(42).gap(3).items_center().overflow_x_scrollbar()
        .children(data.panels.map((p, index) => panelButton(view, p, index + 1))))
      .when(!compact, el => el.child(tool("focus-panel-create", stock("plus"), "Create a panel", () => view.openPanel()))))
    .when(!compact, el => el.child(h_flex().h(32).px(12).gap(5).items_center()
      .child(div().flex_1().min_w(0).truncate().text_size(13).font_semibold().child(view.preview ? `${named?.name} · drop to move` : named?.name ?? "All spaces"))
      .child(label(view.query && !view.preview ? `${visible.length}/${panelSpaces(data, view.live.spaces, view.searchAll ? "all" : panel).length}` : String(visible.length)))
      .when(data.undo?.length, el => el.child(tool("focus-undo", icon("undo", 13), "Undo last move", (_e, cx) => view.command("undo", cx))))
      .child(tool("focus-search", stock("search"), "Search this panel", (_e, cx) => view.focusSearch(undefined, cx)))
      .child(newSpaceControls(view, false))))
    .when(compact, el => el.child(h_flex().h(32).flex_none().justify_center().items_center().child(newSpaceControls(view, true))))
    .when(!compact && !view.preview && (view.searching || view.query), el => el.child(h_flex().px(12).pb(8).gap(5).items_center()
      .child(inputStyle(Input.new(view.input), 31).flex_1().min_w(0))
      .child(div().id("focus-search-scope").px(8).py(6).rounded(6).text_size(10).text_color(view.searchAll ? t.accent : t.dim)
        .bg(view.searchAll ? t.selected : t.raised).cursor_pointer().tooltip("Search across every panel")
        .on_click((_e, cx) => view.focusSearch(!view.searchAll, cx)).child(view.searchAll ? "All" : "Here"))
      .child(tool("focus-search-clear", "×", "Clear search", (_e, cx) => view.onKey({ key: "escape" }, cx)))))
    .when(view.selected.size > 1 && !compact, el => el.child(h_flex().px(16).h(29).gap(6).items_center().text_size(11).text_color(t.muted)
      .child(div().flex_1().child(`${view.selected.size} spaces selected · drag onto a panel`))
      .child(div().id("focus-selection-clear").cursor_pointer().on_click((_e, cx) => { view.selected.clear(); cx.notify(); }).child("Clear"))))
    .child(v_flex().id("focus-lists").flex_1().min_h(0).w_full().relative().children(lists)
      .when(!visible.length && (panel !== "all" || !!view.query || !view.live.machines.length), el => el.child(v_flex().id("focus-list-empty").absolute().inset_0().items_center().justify_center().gap(9).px(18)
      .child(icon(view.query ? "search" : named?.icon ?? "all", 24).text_color(t.dim))
      .when(!compact, el => el.child(div().text_size(12).text_color(t.muted).child(view.query ? "No matching spaces" : "A little room to focus"))
        .child(div().text_size(11).text_color(t.dim).text_center().child(view.query ? "Try fewer words or search all panels." : "Create a space here, or drag one onto the icon."))))))
    .when(!compact, el => el.child(details(view)));
}
