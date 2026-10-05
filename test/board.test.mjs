import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BONUS, bonusFlat, BONUS_MAP, SIZE, rcToIdx, idxToRc } from '../src/core/board.mjs';

test('标准加成格数量正确', () => {
  const f = bonusFlat();
  const count = (v) => f.filter((x) => x === v).length;
  assert.equal(f.length, 225);
  assert.equal(count(BONUS.TW), 8,  'TW 应为 8');
  assert.equal(count(BONUS.DW), 17, 'DW 应为 17（含中心星位）');
  assert.equal(count(BONUS.TL), 12, 'TL 应为 12');
  assert.equal(count(BONUS.DL), 24, 'DL 应为 24');
});

test('加成布局左右上下对称', () => {
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) {
    assert.equal(BONUS_MAP[r][c], BONUS_MAP[r][SIZE - 1 - c], `水平对称失败 @${r},${c}`);
    assert.equal(BONUS_MAP[r][c], BONUS_MAP[SIZE - 1 - r][c], `垂直对称失败 @${r},${c}`);
  }
});

test('中心格是双单词', () => assert.equal(BONUS_MAP[7][7], BONUS.DW));

test('索引换算可逆', () => {
  for (const i of [0, 1, 14, 15, 112, 224]) {
    const [r, c] = idxToRc(i);
    assert.equal(rcToIdx(r, c), i);
  }
});
