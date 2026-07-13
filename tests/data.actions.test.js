'use strict';
/**
 * Tests for the movement-history delete actions (delPO, delSOLine) in src/data.jsx.
 *
 * This project has no build step or test framework (plain browser + Babel-in-browser
 * script tags, no package.json originally). These tests run directly under Node using
 * a small hand-rolled React hooks shim (useState/useEffect/useMemo/useRef) plus a
 * mocked Supabase client, so the real useStore() code from src/data.jsx executes
 * unmodified.
 *
 * Run with:  node tests/data.actions.test.js   (or: npm test)
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

// ---------- tiny assert helpers ----------
let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log('  ok - ' + msg); }
  else { fail++; console.error('  FAIL - ' + msg); }
}
function eq(a, b, msg) {
  ok(JSON.stringify(a) === JSON.stringify(b), msg + ` (got ${JSON.stringify(a)}, want ${JSON.stringify(b)})`);
}

// ---------- minimal React hooks shim ----------
function makeHookRuntime() {
  let cells = [];
  let idx = 0;
  let rerender = null;
  function reset() { idx = 0; }
  function useState(initial) {
    const i = idx++;
    if (!(i in cells)) cells[i] = { value: typeof initial === 'function' ? initial() : initial };
    const cell = cells[i];
    return [cell.value, (updater) => {
      cell.value = typeof updater === 'function' ? updater(cell.value) : updater;
      if (rerender) rerender();
    }];
  }
  function useEffect(fn, deps) {
    const i = idx++;
    if (!(i in cells)) cells[i] = { deps: undefined };
    const cell = cells[i];
    const changed = !cell.deps || !deps || deps.length !== cell.deps.length || deps.some((d, k) => d !== cell.deps[k]);
    if (changed) { cell.deps = deps; fn(); }
  }
  function useMemo(fn, deps) {
    const i = idx++;
    if (!(i in cells)) cells[i] = { deps: undefined };
    const cell = cells[i];
    const changed = !cell.deps || !deps || deps.length !== cell.deps.length || deps.some((d, k) => d !== cell.deps[k]);
    if (changed) { cell.value = fn(); cell.deps = deps; }
    return cell.value;
  }
  function useRef(initial) {
    const i = idx++;
    if (!(i in cells)) cells[i] = { current: initial };
    return cells[i];
  }
  return { useState, useEffect, useMemo, useRef, reset, setRerender: (fn) => { rerender = fn; } };
}

// ---------- mocked Supabase ----------
function makeSupabase(seed, failTables = {}) {
  const calls = [];
  function from(table) {
    return {
      select: () => {
        // Real Supabase .select() is itself awaitable (used bare for sale_order_lines)
        // and also chains with .order(...) (used for items/customers/pos/sos).
        const p = Promise.resolve({ data: seed[table] || [], error: null });
        p.order = () => p;
        return p;
      },
      insert: (row) => {
        calls.push({ table, op: 'insert', row });
        return Promise.resolve(failTables[table] ? { error: { message: table + ' insert failed' } } : { error: null });
      },
      update: (patch) => ({
        eq: (col, val) => {
          calls.push({ table, op: 'update', patch, col, val });
          return Promise.resolve(failTables[table] ? { error: { message: table + ' update failed' } } : { error: null });
        },
      }),
      delete: () => ({
        eq: (col, val) => {
          calls.push({ table, op: 'delete', col, val });
          return Promise.resolve(failTables[table] ? { error: { message: table + ' delete failed' } } : { error: null });
        },
      }),
    };
  }
  return { from, calls };
}

// ---------- load the real src/data.jsx into a sandboxed VM context ----------
function loadStore({ supabase, toastLog }) {
  const src = fs.readFileSync(path.join(__dirname, '..', 'src', 'data.jsx'), 'utf8');
  const hooks = makeHookRuntime();
  const sandboxWindow = { ZG_SUPABASE: supabase };
  const sandbox = {
    window: sandboxWindow,
    React: { useRef: hooks.useRef },
    useState: hooks.useState,
    useEffect: hooks.useEffect,
    useMemo: hooks.useMemo,
    Toast: { push: (msg, tone) => toastLog.push({ msg, tone }) },
    Object, Promise, console,
  };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: 'data.jsx' });

  let latest = null;
  const rerender = () => { hooks.reset(); latest = sandbox.useStore(); };
  hooks.setRerender(rerender);
  rerender(); // initial render — kicks off loadAll() via useEffect
  return {
    get: () => latest,
    flush: () => new Promise((r) => setImmediate(r)), // let pending promises settle
  };
}

async function run() {
  console.log('delPO — success');
  {
    const toastLog = [];
    const seed = {
      items: [], customers: [],
      purchase_orders: [{ id: 'PO10001', date: '2026-07-01', item_code: 'ITM-1001', item_name: 'Test Item', unit: 'pcs', price: 100, qty: 5 }],
      sale_orders: [], sale_order_lines: [],
    };
    const supabase = makeSupabase(seed);
    const store = loadStore({ supabase, toastLog });
    await store.flush();

    const result = await store.get().actions.delPO('PO10001');
    ok(result === true, 'delPO resolves true on success');
    eq(store.get().state.pos, [], 'PO removed from state immediately');
    ok(supabase.calls.some(c => c.table === 'purchase_orders' && c.op === 'delete' && c.val === 'PO10001'), 'supabase delete called with correct id');
  }

  console.log('delPO — failure rolls back');
  {
    const toastLog = [];
    const seed = {
      items: [], customers: [],
      purchase_orders: [{ id: 'PO10002', date: '2026-07-01', item_code: 'ITM-1001', item_name: 'Test Item', unit: 'pcs', price: 100, qty: 5 }],
      sale_orders: [], sale_order_lines: [],
    };
    const supabase = makeSupabase(seed, { purchase_orders: true });
    const store = loadStore({ supabase, toastLog });
    await store.flush();

    const result = await store.get().actions.delPO('PO10002');
    ok(result === false, 'delPO resolves false on failure');
    eq(store.get().state.pos.map(p => p.id), ['PO10002'], 'PO restored to state on failure');
    ok(toastLog.some(t => t.tone === 'danger'), 'error toast shown on failure');
  }

  console.log('delSOLine — removes one line, keeps SO when others remain');
  {
    const toastLog = [];
    const seed = {
      items: [], customers: [],
      purchase_orders: [],
      sale_orders: [{ id: 'SO10001', date: '2026-07-01', cust_code: 'CUST0001', shipping: 0, discount: 0, has_sig: false }],
      sale_order_lines: [
        { id: 1, so_id: 'SO10001', item_code: 'ITM-1001', qty: 2, price: 100 },
        { id: 2, so_id: 'SO10001', item_code: 'ITM-1002', qty: 3, price: 50 },
      ],
    };
    const supabase = makeSupabase(seed);
    const store = loadStore({ supabase, toastLog });
    await store.flush();

    const result = await store.get().actions.delSOLine('SO10001', 1);
    ok(result === true, 'delSOLine resolves true on success');
    const so = store.get().state.sos.find(s => s.id === 'SO10001');
    ok(!!so, 'SO still present (other line remains)');
    eq(so.lines.map(l => l.id), [2], 'only the targeted line was removed');
    ok(supabase.calls.some(c => c.table === 'sale_order_lines' && c.op === 'delete' && c.val === 1), 'supabase deleted the correct line row');
    ok(!supabase.calls.some(c => c.table === 'sale_orders' && c.op === 'delete'), 'SO header was not deleted');
  }

  console.log('delSOLine — deletes SO header when it was the last line');
  {
    const toastLog = [];
    const seed = {
      items: [], customers: [],
      purchase_orders: [],
      sale_orders: [{ id: 'SO10002', date: '2026-07-01', cust_code: 'CUST0001', shipping: 0, discount: 0, has_sig: false }],
      sale_order_lines: [{ id: 3, so_id: 'SO10002', item_code: 'ITM-1001', qty: 1, price: 100 }],
    };
    const supabase = makeSupabase(seed);
    const store = loadStore({ supabase, toastLog });
    await store.flush();

    const result = await store.get().actions.delSOLine('SO10002', 3);
    ok(result === true, 'delSOLine resolves true');
    ok(!store.get().state.sos.find(s => s.id === 'SO10002'), 'empty SO header removed from state');
    ok(supabase.calls.some(c => c.table === 'sale_orders' && c.op === 'delete' && c.val === 'SO10002'), 'supabase deleted the SO header');
  }

  console.log('delSOLine — failure rolls back');
  {
    const toastLog = [];
    const seed = {
      items: [], customers: [],
      purchase_orders: [],
      sale_orders: [{ id: 'SO10003', date: '2026-07-01', cust_code: 'CUST0001', shipping: 0, discount: 0, has_sig: false }],
      sale_order_lines: [
        { id: 4, so_id: 'SO10003', item_code: 'ITM-1001', qty: 2, price: 100 },
        { id: 5, so_id: 'SO10003', item_code: 'ITM-1002', qty: 1, price: 50 },
      ],
    };
    const supabase = makeSupabase(seed, { sale_order_lines: true });
    const store = loadStore({ supabase, toastLog });
    await store.flush();

    const result = await store.get().actions.delSOLine('SO10003', 4);
    ok(result === false, 'delSOLine resolves false on failure');
    const so = store.get().state.sos.find(s => s.id === 'SO10003');
    eq(so.lines.map(l => l.id), [4, 5], 'lines restored to original state on failure');
    ok(toastLog.some(t => t.tone === 'danger'), 'error toast shown on failure');
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail > 0) process.exit(1);
}

run();
