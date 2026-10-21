// Import complete legal standard games as reproducible premove source material.
// Usage: node tools/import-premove-games.mjs FILE PINNED_SOURCE_URL UNIQUE_SOURCE_NAME
import {readFileSync,writeFileSync} from 'node:fs';
import {parsePgn,startingPosition} from 'chessops/pgn';
import {parseSan} from 'chessops/san';
const [file,url,name]=process.argv.slice(2);
if(!file||!url||!name)throw Error('Expected FILE PINNED_SOURCE_URL UNIQUE_SOURCE_NAME');
const output=new URL('../data/premove-source-games.pgn',import.meta.url);
let existing=readFileSync(output,'utf8');
if(existing.includes(`[SourceFile "${name}"]`))throw Error('Source already imported');
let accepted=0,rejected=0;
for(const [index,game] of parsePgn(readFileSync(file,'utf8')).entries()){
 if(game.headers.has('Variant')&&!['Standard','Chess'].includes(game.headers.get('Variant'))){rejected++;continue;}
 let pos;
 try{pos=startingPosition(game.headers).unwrap();for(const node of game.moves.mainline()){const move=parseSan(pos,node.san);if(!move)throw Error('Invalid SAN');pos.play(move);}}
 catch{rejected++;continue;}
 const headers=new Map([...game.headers].filter(([key])=>['Event','Site','Date','Round','White','Black','Result','SetUp','FEN'].includes(key)));
 headers.set('SourceFile',name);headers.set('SourceGame',String(index+1));headers.set('SourceURL',url);
 const escape=value=>value.replaceAll('\\','\\\\').replaceAll('"','\\"');
 const lines=[...headers].map(([key,value])=>`[${key} "${escape(value)}"]`).join('\n');
 const sans=[...game.moves.mainline()].map(node=>node.san);
 const start=startingPosition(game.headers).unwrap();let ply=(start.fullmoves-1)*2+(start.turn==='black'?1:0);
 const moves=sans.map(san=>{const prefix=ply%2===0?`${Math.floor(ply/2)+1}. `:ply===(start.fullmoves-1)*2+1?`${Math.floor(ply/2)+1}... `:'';ply++;return prefix+san;}).join(' ');
 existing+=`\n${lines}\n\n${moves} ${headers.get('Result')??'*'}\n`;
 accepted++;
}
writeFileSync(output,existing);console.log(`${accepted} complete legal games imported; ${rejected} rejected`);
