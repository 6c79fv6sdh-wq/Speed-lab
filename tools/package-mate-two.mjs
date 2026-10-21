import fs from 'node:fs';
import {execFileSync} from 'node:child_process';
const pack = JSON.parse(fs.readFileSync('data/mate-in-2-100.json', 'utf8'));
const dir = '/tmp/mate-in-2-100';
fs.mkdirSync(dir,{recursive:true});
fs.writeFileSync(`${dir}/mate-in-2-100.json`,JSON.stringify(pack,null,2)+'\n');
const pgn=pack.puzzles.map(p=>{
  const s=p.solution;
  const variations=s.branches.map(b=>`1... ${b.replySan} 2. ${b.winningSans[0]} ${b.winningSans.slice(1).map(m=>`(2. ${m})`).join(' ')}`);
  return `[Event "Mate in 2: ${p.id}"]\n[Site "ScienceChess Lab"]\n[Date "????.??.??"]\n[Round "?"]\n[White "?"]\n[Black "?"]\n[Result "*"]\n[SetUp "1"]\n[FEN "${p.fen}"]\n[Orientation "${p.boardOrientation}"]\n\n${p.sideToMove==='white'?'1.':'1...'} ${s.firstSan} { All defences and mating finishes are in JSON. } ${variations.length ? (p.sideToMove==='white'?variations[0]:`2. ${s.branches[0].replySan} 2... ${s.branches[0].winningSans[0]}`):''} *`;
}).join('\n\n');
fs.writeFileSync(`${dir}/mate-in-2-100.pgn`,pgn+'\n');
fs.writeFileSync(`${dir}/README.txt`, `Мат в 2 — 100 задач\n\nУчебные составленные позиции, не атрибутированные партии.\nХод указан в FEN; доску ориентировать за решающую сторону.\nКаждая позиция проверена Stockfish 18 Lite, глубина 16, оценка mate 2.\nПолным перебором проверены все легальные первые ходы, защиты и маты.\nМат в один исключён. Первый ход решения единственный.\nJSON содержит ВСЕ ответы соперника и ВСЕ допустимые завершающие маты.\nPGN показывает один иллюстративный вариант; полное дерево — в JSON.\nНа сайте ответ соперника выбирается случайно; любой мат из этого положения засчитывается.\n`);
fs.mkdirSync('public/packs',{recursive:true});
execFileSync('python',['-c',`import zipfile,pathlib\np=pathlib.Path('${dir}')\nwith zipfile.ZipFile('public/packs/mate-in-2-100.zip','w',zipfile.ZIP_DEFLATED) as z:\n for f in sorted(p.iterdir()): z.write(f,f.name)\n`]);
