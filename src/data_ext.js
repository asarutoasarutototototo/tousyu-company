'use strict';
/* ============ 章の拡張(第6〜80幕)・採掘の拡張(〜Lv400) ============ */
const CH_COUNT = 80;
const KN = '〇一二三四五六七八九';
const kanjiNum = n => n < 10 ? KN[n] : n < 20 ? '十' + (n % 10 ? KN[n % 10] : '') : n < 100 ? KN[Math.floor(n / 10)] + '十' + (n % 10 ? KN[n % 10] : '') : String(n);
const bossLvOf = k => k <= 5 ? [5, 10, 16, 22, 28][k - 1] : Math.round(28 + (k - 5) * 372 / 75);
(function () {
  const CH_ADJ = ['霧', '灰', '硝子', '鐘', '硫黄', '白磁', '深紅', '蒼', '銀', '黒曜', '琥珀', '翡翠', '白金', '錆', '紫紺'];
  const CH_PLACE = ['運河', '劇場', '温室', '工房', '墓所'];
  const BOSS_ADJ = ['燻る', '凍える', '叫ぶ', '微笑む', '崩れた', '眠れる', '嘆きの', '歪んだ', '焦がれる', '囁く', '軋む', '穢れた', '輝く', '忘れられた', '終わらぬ'];
  const BASES = ['gatekeeper', 'chorus', 'clock', 'mira', 'dawnclock'];
  const STG = ['外郭', '回廊', '広間', '裏路地', '螺旋階段', '中庭', '地下水路', '鐘楼', '渡り橋', '奥の間', '屋根裏', '格納庫'];
  const THEMES = ['station', 'library', 'clock', 'mirror'];
  const HINT = ['空気が、少し重たいですね。', '灯りを絶やさないでください。', '足跡が、先へ続いています。', '夜の底は、まだ深いようです。', 'ここの住人は気が立っています。', '道が、勝手に組み変わっています。', '遠くで鐘が鳴っています。', '油の匂いがします。近いですよ。', '影が、こちらを見ています。', '慎重に進みましょう。', 'まだ誰も戻ってきていません。', 'あなたの灯が、頼りです。'];
  const VOICE = ['零: 「行きましょう。時間は待ってくれないわ。」', '紅: 「ふふ、血が騒ぐわね。」', '恋: 「ねえ、怖くなったらいつでも言ってね?」', '暁: 「準備はいい?燃やしにいくよ!」', '雷: 「ぶっ飛ばす。それだけだ。」', '鉄: 「……前に出る。」', '凪: 「静かに、斬る。」'];
  const QUOTE = ['「ここから先へは、行かせない。」', '「灯りを、よこせ……」', '「夜は、終わらない。終わらせない。」', '「お前の灯も、いずれ消える。」', '「ようこそ。そして、さようなら。」', '「まだ、足りない……もっと、もっと。」', '「名を、置いていけ。」', '「針は、止まったままだ。」', '「歌え。それが、お前の最期の仕事だ。」', '「この鏡に、お前は映らない。」'];
  const NORMAL = Object.keys(ENEMIES).filter(k => !ENEMIES[k].boss);
  const rotRt = (rt, n) => { const ks = ['slash', 'pierce', 'blunt'], vs = ks.map(k => rt[k] == null ? 1 : rt[k]); const o = {}; ks.forEach((k, i) => { o[k] = vs[(i + n) % 3]; }); return o; };
  const lcg = seed => { let s = seed >>> 0; return n => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return Math.floor(s / 4294967296 * n); }; };
  for (let k = 6; k <= CH_COUNT; k++) {
    const i = Math.floor((k - 6) / 5), j = (k - 6) % 5, rnd = lcg(k * 7919);
    const title = `${CH_ADJ[i % 15]}の${CH_PLACE[j]}`, bLv = bossLvOf(k);
    const bkey = 'b' + k, base = ENEMIES[BASES[j]];
    ENEMIES[bkey] = Object.assign({}, base, { n: `${BOSS_ADJ[i % 15]}${base.n}`, rt: rotRt(base.rt, k % 3) });
    CHAPTERS.push({ id: k, n: `第${kanjiNum(k)}幕「${title}」`, theme: THEMES[k % 4], lv: [bLv - 4, bLv], intro: [`ルーメン: 「${title}に到着しました。${HINT[rnd(HINT.length)]}」`, VOICE[rnd(VOICE.length)]] });
    const kinds = [NORMAL[rnd(NORMAL.length)], NORMAL[rnd(NORMAL.length)], NORMAL[rnd(NORMAL.length)]];
    for (let s = 1; s <= 5; s++) {
      const lv = bLv - (5 - s), boss = s === 5, en = [];
      if (boss) { en.push(E(bkey, lv)); en.push(E(kinds[rnd(3)], lv - 1)); en.push(E(kinds[rnd(3)], lv - 1)); }
      else { const n = s <= 2 ? 3 : 4; for (let q = 0; q < n; q++) en.push(E(kinds[rnd(3)], lv)); }
      const st = { id: `${k}-${s}`, ch: k, n: boss ? ENEMIES[bkey].n : `${CH_ADJ[i % 15]}の${STG[(k * 5 + s * 3) % STG.length]}`, lv, en };
      if (boss) { st.boss = 1; st.story = [`${ENEMIES[bkey].n}: ${QUOTE[rnd(QUOTE.length)]}`, 'ルーメン: 「強い反応です。ご注意を、指揮者さま。」']; }
      STAGES.push(st);
    }
  }
  /* 採掘: Lv40〜Lv400 の段階を追加(券は段階ごとに+1枚) */
  const EXTRA = [40, 50, 60, 70, 80, 90, 100, 120, 140, 160, 180, 200, 220, 240, 260, 280, 300, 320, 340, 360, 380, 400];
  LUX.forEach(d => {
    const top = d.rows[d.rows.length - 1];
    EXTRA.forEach((L, x) => {
      const r = d.id === 'thread' ? { thread: Math.round(lvCost(L) * 2.2 / 10) * 10 } : d.id === 'shard' ? { shards: 1000 + 6 * (L - 30) } : { tickets: 7 + x };
      d.rows.push({ n: 'Lv' + L, lv: L, en: top.en.map(e => E(e.k, L)), r });
    });
  });
})();
