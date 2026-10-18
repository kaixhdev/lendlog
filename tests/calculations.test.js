const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

// Pure logic implementations corresponding to StorageContext functions
function createRecord({ id, name, amount, type, date, dueDate }) {
  return {
    id,
    type,
    name: name.trim(),
    amount,
    paid_amount: 0,
    note: "",
    date: date || "01/01/2026",
    due_date: dueDate || "",
    settled: false,
    settled_date: "",
    payments: [],
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  };
}

function addPayment(record, amount, note, date) {
  const payment = { id: "p1", amount, date: date || "01/01/2026", note };
  const newPaid = record.paid_amount + amount;
  const autoSettle = newPaid >= record.amount;
  return {
    ...record,
    paid_amount: newPaid,
    payments: [...record.payments, payment],
    settled: autoSettle ? true : record.settled,
    settled_date: autoSettle && !record.settled ? "01/01/2026" : record.settled_date,
    updated: new Date().toISOString(),
  };
}

function markSettled(record) {
  const isSettling = !record.settled;
  return {
    ...record,
    settled: isSettling,
    paid_amount: isSettling ? record.amount : record.paid_amount,
    settled_date: isSettling ? "01/01/2026" : "",
    updated: new Date().toISOString(),
  };
}

function calculateSummary(records) {
  let totalLent = 0;
  let totalBorrowed = 0;
  let pendingReceivable = 0;
  let pendingPayable = 0;
  let settledCount = 0;

  for (const r of records) {
    if (r.type === "lent") {
      totalLent += r.amount;
      if (!r.settled) pendingReceivable += r.amount - r.paid_amount;
    } else {
      totalBorrowed += r.amount;
      if (!r.settled) pendingPayable += r.amount - r.paid_amount;
    }
    if (r.settled) settledCount++;
  }

  return {
    totalLent,
    totalBorrowed,
    netBalance: pendingReceivable - pendingPayable,
    pendingReceivable,
    pendingPayable,
    settlementRate: records.length > 0 ? Math.round((settledCount / records.length) * 100) : 0,
    totalRecords: records.length,
    settledRecords: settledCount,
  };
}

function calculatePeopleStats(records) {
  const map = new Map();
  for (const r of records) {
    const key = r.name.toLowerCase();
    if (!map.has(key)) {
      map.set(key, { name: r.name, totalLent: 0, totalBorrowed: 0, netBalance: 0, recordCount: 0 });
    }
    const p = map.get(key);
    p.recordCount++;
    if (!r.settled) {
      if (r.type === "lent") p.totalLent += r.amount - r.paid_amount;
      else p.totalBorrowed += r.amount - r.paid_amount;
    }
  }
  for (const p of map.values()) {
    p.netBalance = p.totalLent - p.totalBorrowed;
  }
  return Array.from(map.values()).sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance));
}

describe("LendLog Core Calculation Tests", () => {
  test("createRecord initializes with correct default values", () => {
    const rec = createRecord({ id: "1", name: " Alice ", amount: 500, type: "lent" });
    assert.equal(rec.name, "Alice");
    assert.equal(rec.amount, 500);
    assert.equal(rec.paid_amount, 0);
    assert.equal(rec.settled, false);
    assert.equal(rec.type, "lent");
  });

  test("addPayment updates paid_amount and auto-settles when fully paid", () => {
    let rec = createRecord({ id: "1", name: "Bob", amount: 1000, type: "lent" });
    
    // Partial payment
    rec = addPayment(rec, 400, "First payment");
    assert.equal(rec.paid_amount, 400);
    assert.equal(rec.settled, false);

    // Completing payment
    rec = addPayment(rec, 600, "Final payment");
    assert.equal(rec.paid_amount, 1000);
    assert.equal(rec.settled, true);
    assert.ok(rec.settled_date);
  });

  test("markSettled toggles settled status and updates paid_amount", () => {
    let rec = createRecord({ id: "1", name: "Charlie", amount: 750, type: "borrowed" });
    rec = markSettled(rec);
    assert.equal(rec.settled, true);
    assert.equal(rec.paid_amount, 750);

    // Toggle back
    rec = markSettled(rec);
    assert.equal(rec.settled, false);
    assert.equal(rec.settled_date, "");
  });

  test("calculateSummary accurately sums receivables, payables, and settlement rates", () => {
    const records = [
      createRecord({ id: "1", name: "Alice", amount: 1000, type: "lent" }),
      createRecord({ id: "2", name: "Bob", amount: 400, type: "borrowed" }),
      markSettled(createRecord({ id: "3", name: "Charlie", amount: 600, type: "lent" })),
    ];

    const summary = calculateSummary(records);
    assert.equal(summary.totalLent, 1600);
    assert.equal(summary.totalBorrowed, 400);
    assert.equal(summary.pendingReceivable, 1000);
    assert.equal(summary.pendingPayable, 400);
    assert.equal(summary.netBalance, 600); // 1000 - 400
    assert.equal(summary.totalRecords, 3);
    assert.equal(summary.settledRecords, 1);
    assert.equal(summary.settlementRate, 33); // 1/3 ~ 33%
  });

  test("calculatePeopleStats aggregates lent/borrowed balances correctly per person", () => {
    const records = [
      createRecord({ id: "1", name: "Alice", amount: 500, type: "lent" }),
      createRecord({ id: "2", name: "alice", amount: 200, type: "borrowed" }),
      createRecord({ id: "3", name: "Bob", amount: 300, type: "borrowed" }),
    ];

    const people = calculatePeopleStats(records);
    assert.equal(people.length, 2);
    
    const alice = people.find(p => p.name.toLowerCase() === "alice");
    assert.ok(alice);
    assert.equal(alice.recordCount, 2);
    assert.equal(alice.totalLent, 500);
    assert.equal(alice.totalBorrowed, 200);
    assert.equal(alice.netBalance, 300); // Alice owes net 300 to us

    const bob = people.find(p => p.name.toLowerCase() === "bob");
    assert.ok(bob);
    assert.equal(bob.recordCount, 1);
    assert.equal(bob.totalBorrowed, 300);
    assert.equal(bob.netBalance, -300); // We owe net 300 to Bob
  });
});
