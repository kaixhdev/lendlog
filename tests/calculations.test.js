const { test, describe } = require("node:test");
const assert = require("node:assert/strict");

function round2(val) {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

function parseRecordDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split("/");
  if (parts.length === 3) {
    const d = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const y = Number(parts[2]);
    if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
      return new Date(y, m, d);
    }
  }
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function createRecord({ id, name, amount, type, date, dueDate }) {
  const trimmedName = (name || "").trim() || "Unknown";
  const validAmount = round2(Math.max(0, amount));
  return {
    id: id || "rec_1",
    type: type === "borrowed" ? "borrowed" : "lent",
    name: trimmedName,
    amount: validAmount,
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
  const validAmount = round2(amount);
  if (isNaN(validAmount) || validAmount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }
  const payment = { id: `p_${Date.now()}`, amount: validAmount, date: date || "01/01/2026", note: note || "" };
  const newPaid = round2(record.paid_amount + validAmount);
  const autoSettle = newPaid >= record.amount;
  return {
    ...record,
    paid_amount: newPaid,
    payments: [...record.payments, payment],
    settled: autoSettle ? true : record.settled,
    settled_date: autoSettle && !record.settled ? (date || "01/01/2026") : record.settled_date,
    updated: new Date().toISOString(),
  };
}

function deletePayment(record, paymentId) {
  const payments = record.payments.filter(p => p.id !== paymentId);
  const paid_amount = round2(payments.reduce((sum, p) => sum + p.amount, 0));
  const settled = paid_amount >= record.amount && record.amount > 0;
  return {
    ...record,
    payments,
    paid_amount,
    settled,
    settled_date: settled ? record.settled_date : "",
    updated: new Date().toISOString(),
  };
}

function markSettled(record) {
  const isSettling = !record.settled;
  const paymentsSum = round2(record.payments.reduce((sum, p) => sum + p.amount, 0));
  return {
    ...record,
    settled: isSettling,
    paid_amount: isSettling ? record.amount : paymentsSum,
    settled_date: isSettling ? "01/01/2026" : "",
    updated: new Date().toISOString(),
  };
}

function settleAllFor(records, name) {
  return records.map(r =>
    r.name.toLowerCase() === name.toLowerCase() && !r.settled
      ? { ...r, settled: true, paid_amount: r.amount, settled_date: "01/01/2026", updated: new Date().toISOString() }
      : r
  );
}

function calculateSummary(records) {
  let totalLent = 0;
  let totalBorrowed = 0;
  let pendingReceivable = 0;
  let pendingPayable = 0;
  let settledCount = 0;

  for (const r of records) {
    if (r.type === "lent") {
      totalLent = round2(totalLent + r.amount);
      if (!r.settled) pendingReceivable = round2(pendingReceivable + (r.amount - r.paid_amount));
    } else {
      totalBorrowed = round2(totalBorrowed + r.amount);
      if (!r.settled) pendingPayable = round2(pendingPayable + (r.amount - r.paid_amount));
    }
    if (r.settled) settledCount++;
  }

  return {
    totalLent,
    totalBorrowed,
    netBalance: round2(pendingReceivable - pendingPayable),
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
      const remaining = round2(r.amount - r.paid_amount);
      if (r.type === "lent") p.totalLent = round2(p.totalLent + remaining);
      else p.totalBorrowed = round2(p.totalBorrowed + remaining);
    }
  }
  for (const p of map.values()) {
    p.netBalance = round2(p.totalLent - p.totalBorrowed);
  }
  return Array.from(map.values()).sort((a, b) => Math.abs(b.netBalance) - Math.abs(a.netBalance));
}

function sanitizeRestoredRecords(rawRecords) {
  if (!Array.isArray(rawRecords)) return [];
  return rawRecords.filter(Boolean).map((item, idx) => {
    const id = item.id || `rec_${idx}`;
    const type = item.type === "borrowed" ? "borrowed" : "lent";
    const name = typeof item.name === "string" && item.name.trim() ? item.name.trim() : "Unknown";
    const amount = round2(Math.max(0, Number(item.amount) || 0));
    const payments = Array.isArray(item.payments) ? item.payments.map((p, pIdx) => ({
      id: p.id || `p_${pIdx}`,
      amount: round2(Math.max(0, Number(p.amount) || 0)),
      date: p.date || "01/01/2026",
      note: typeof p.note === "string" ? p.note : "",
    })) : [];
    const paymentsSum = round2(payments.reduce((s, p) => s + p.amount, 0));
    const paid_amount = round2(Math.max(paymentsSum, Number(item.paid_amount) || 0));
    const settled = Boolean(item.settled) || (amount > 0 && paid_amount >= amount);
    return {
      id,
      type,
      name,
      amount,
      paid_amount,
      note: typeof item.note === "string" ? item.note : "",
      date: item.date || "01/01/2026",
      due_date: item.due_date || "",
      settled,
      settled_date: item.settled_date || (settled ? "01/01/2026" : ""),
      payments,
      created: item.created || new Date().toISOString(),
      updated: item.updated || new Date().toISOString(),
    };
  });
}

describe("LendLog Core Calculation & Financial Integrity Tests", () => {
  test("createRecord handles names, trimming, and zero/positive amounts", () => {
    const rec = createRecord({ id: "1", name: " Alice ", amount: 500.5, type: "lent" });
    assert.equal(rec.name, "Alice");
    assert.equal(rec.amount, 500.5);
    assert.equal(rec.paid_amount, 0);
    assert.equal(rec.settled, false);
    assert.equal(rec.type, "lent");

    // Empty name defaults to Unknown
    const recEmpty = createRecord({ id: "2", name: "   ", amount: 100, type: "borrowed" });
    assert.equal(recEmpty.name, "Unknown");
  });

  test("addPayment updates paid_amount with round2 precision and auto-settles when fully paid", () => {
    let rec = createRecord({ id: "1", name: "Bob", amount: 1000.75, type: "lent" });

    // Partial decimal payments
    rec = addPayment(rec, 400.25, "First partial");
    assert.equal(rec.paid_amount, 400.25);
    assert.equal(rec.settled, false);

    rec = addPayment(rec, 200.5, "Second partial");
    assert.equal(rec.paid_amount, 600.75);
    assert.equal(rec.settled, false);

    // Final settlement payment
    rec = addPayment(rec, 400, "Final payment");
    assert.equal(rec.paid_amount, 1000.75);
    assert.equal(rec.settled, true);
    assert.ok(rec.settled_date);
  });

  test("addPayment rejects zero or negative amounts", () => {
    const rec = createRecord({ id: "1", name: "Dave", amount: 500, type: "lent" });
    assert.throws(() => addPayment(rec, 0, "Zero payment"), /Payment amount must be greater than zero/);
    assert.throws(() => addPayment(rec, -50, "Negative payment"), /Payment amount must be greater than zero/);
    assert.throws(() => addPayment(rec, NaN, "Invalid payment"), /Payment amount must be greater than zero/);
  });

  test("deletePayment correctly recalculates paid_amount and auto-unsettles record", () => {
    let rec = createRecord({ id: "1", name: "Eva", amount: 300, type: "lent" });
    rec = addPayment(rec, 100, "P1");
    rec.payments[0].id = "pay_1";
    rec = addPayment(rec, 200, "P2");
    rec.payments[1].id = "pay_2";

    assert.equal(rec.paid_amount, 300);
    assert.equal(rec.settled, true);

    // Delete final payment pay_2 -> paid_amount drops to 100, record must become unsettled!
    rec = deletePayment(rec, "pay_2");
    assert.equal(rec.paid_amount, 100);
    assert.equal(rec.settled, false);
    assert.equal(rec.settled_date, "");
  });

  test("markSettled toggles settled status and restores actual payments on un-settle", () => {
    let rec = createRecord({ id: "1", name: "Frank", amount: 750, type: "borrowed" });
    // Record with an existing partial payment
    rec = addPayment(rec, 250, "Partial");
    assert.equal(rec.paid_amount, 250);
    assert.equal(rec.settled, false);

    // Manual settle
    rec = markSettled(rec);
    assert.equal(rec.settled, true);
    assert.equal(rec.paid_amount, 750);

    // Un-settle: paid_amount MUST revert to the actual 250 partial payment sum, not stay 750!
    rec = markSettled(rec);
    assert.equal(rec.settled, false);
    assert.equal(rec.paid_amount, 250);
    assert.equal(rec.settled_date, "");
  });

  test("settleAllFor marks all unsettled records for a person as settled with full paid_amount", () => {
    const records = [
      createRecord({ id: "1", name: "Grace", amount: 200, type: "lent" }),
      createRecord({ id: "2", name: "Grace", amount: 300, type: "lent" }),
      createRecord({ id: "3", name: "Harry", amount: 150, type: "borrowed" }),
    ];

    const settled = settleAllFor(records, "grace");
    assert.equal(settled[0].settled, true);
    assert.equal(settled[0].paid_amount, 200);
    assert.equal(settled[1].settled, true);
    assert.equal(settled[1].paid_amount, 300);
    assert.equal(settled[2].settled, false);
    assert.equal(settled[2].paid_amount, 0);
  });

  test("calculateSummary avoids floating point drift on decimals", () => {
    const records = [
      createRecord({ id: "1", name: "A", amount: 0.1, type: "lent" }),
      createRecord({ id: "2", name: "B", amount: 0.2, type: "lent" }),
      createRecord({ id: "3", name: "C", amount: 0.15, type: "borrowed" }),
    ];

    const summary = calculateSummary(records);
    assert.equal(summary.totalLent, 0.3); // avoids 0.30000000000000004
    assert.equal(summary.totalBorrowed, 0.15);
    assert.equal(summary.netBalance, 0.15);
  });

  test("calculatePeopleStats aggregates fractional and large balances correctly", () => {
    const records = [
      createRecord({ id: "1", name: "Ian", amount: 150000.5, type: "lent" }),
      createRecord({ id: "2", name: "ian", amount: 50000.25, type: "borrowed" }),
      createRecord({ id: "3", name: "Jane", amount: 10000, type: "borrowed" }),
    ];

    const people = calculatePeopleStats(records);
    assert.equal(people.length, 2);

    const ian = people.find(p => p.name.toLowerCase() === "ian");
    assert.ok(ian);
    assert.equal(ian.totalLent, 150000.5);
    assert.equal(ian.totalBorrowed, 50000.25);
    assert.equal(ian.netBalance, 100000.25);
  });

  test("sanitizeRestoredRecords safely sanitizes corrupted or missing fields in backups", () => {
    const corruptedBackup = [
      null,
      { amount: "250.5" }, // missing name, type, payments
      { name: "Kirk", amount: 500, payments: [{ amount: "100" }] },
    ];

    const sanitized = sanitizeRestoredRecords(corruptedBackup);
    assert.equal(sanitized.length, 2);

    assert.equal(sanitized[0].name, "Unknown");
    assert.equal(sanitized[0].amount, 250.5);
    assert.equal(sanitized[0].type, "lent");
    assert.deepEqual(sanitized[0].payments, []);

    assert.equal(sanitized[1].name, "Kirk");
    assert.equal(sanitized[1].amount, 500);
    assert.equal(sanitized[1].payments.length, 1);
    assert.equal(sanitized[1].payments[0].amount, 100);
    assert.equal(sanitized[1].paid_amount, 100);
  });

  test("parseRecordDate handles both DD/MM/YYYY and ISO formats", () => {
    const d1 = parseRecordDate("19/10/2026");
    assert.ok(d1);
    assert.equal(d1.getFullYear(), 2026);
    assert.equal(d1.getMonth(), 9); // October is 9 (0-indexed)
    assert.equal(d1.getDate(), 19);

    const d2 = parseRecordDate("2026-10-19");
    assert.ok(d2);
    assert.equal(d2.getFullYear(), 2026);

    const dInvalid = parseRecordDate("not-a-date");
    assert.equal(dInvalid, null);
  });
});
