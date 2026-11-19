// Chạy: node --test tests/
import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

globalThis.window = {};
const require = createRequire(import.meta.url);
require("../games/math-run/js/numbers.js");
require("../games/math-run/js/levels.js");
const MR = globalThis.window.MR;

test("đọc số tiếng Việt", () => {
  const cases = {
    "bảy": 7, "Bảy.": 7, "bằng bảy": 7, "mười": 10, "mười lăm": 15, "mười một": 11, "mười tư": 14,
    "hai mươi": 20, "hai mươi mốt": 21, "hai mươi một": 21, "hai mốt": 21, "ba lăm": 35,
    "năm mươi lăm": 55, "chín mươi chín": 99, "một trăm": 100, "một trăm linh năm": 105,
    "không": 0, "12": 12, "là 12": 12, "ba cộng bốn bằng 7": 7, "ba chục": 30, "sáu mươi tư": 64,
  };
  for (const [text, value] of Object.entries(cases)) {
    assert.equal(MR.lastNumber(text), value, text);
  }
});

test("câu không có số", () => {
  assert.equal(MR.lastNumber("ừm để con nghĩ"), null);
  assert.equal(MR.lastNumber(""), null);
});

test("phép tính của mọi màn đúng và nằm trong phạm vi", () => {
  MR.LEVELS.forEach((level, i) => {
    for (let n = 0; n < 300; n++) {
      const p = MR.makeProblem(level);
      const value = p.terms.reduce((sum, t, k) => (k === 0 ? t : p.ops[k - 1] === "+" ? sum + t : sum - t), 0);
      assert.equal(value, p.answer, `màn ${i + 1}: ${p.text}`);
      assert.ok(p.answer >= 0 && p.answer <= level.max, `màn ${i + 1}: ${p.text} = ${p.answer}`);
    }
  });
});
