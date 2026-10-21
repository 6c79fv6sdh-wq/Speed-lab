// Mine actual consecutive capture/recapture pairs from complete standard games.
import {readFileSync,writeFileSync} from 'node:fs';
import {parsePgn,startingPosition} from 'chessops/pgn';
import {parseSan} from 'chessops/san';
import {makeFen} from 'chessops/fen';
import {makeUci} from 'chessops/util';
const out=[];
for(const game of parsePgn(readFileSync(new URL('../data/premove-source-games.pgn',import.meta.url),'utf8'))){
 const pos=startingPosition(game.headers).unwrap();
 const moves=[...game.moves.mainline()];
 for(let i=0;i<moves.length;i++){
  const move=parseSan(pos,moves[i].san);
  if(!move)throw Error(`Invalid source game move ${i+1}: ${moves[i].san}`);
  const target=pos.board.get(move.to);
  if(i+1<moves.length && !pos.isCheck() && target && target.color!==pos.turn && !move.promotion){
   const after=pos.clone();after.play(move);
   const answer=parseSan(after,moves[i+1].san);
   if(answer && answer.to===move.to && !answer.promotion){
    const id=`game-${game.headers.get('SourceFile').replace('.pgn','')}-${game.headers.get('SourceGame')}-${i+1}`;
    out.push({id,poolId:`fc-${id}`,startFen:makeFen(pos.toSetup()),userColor:after.turn,
     expectedOpponentMove:makeUci(move),premove:makeUci(answer),
     source:{white:game.headers.get('White')??'Unknown',black:game.headers.get('Black')??'Unknown',event:game.headers.get('Event')??'Unknown',date:game.headers.get('Date')??'????.??.??',ply:i+1,url:game.headers.get('SourceURL')}});
   }
  }
  pos.play(move);
 }
}
writeFileSync(new URL('./premove-game-candidates.json',import.meta.url),JSON.stringify(out,null,2)+'\n');
console.log(`${out.length} real-game capture/recapture pairs extracted; still require Stockfish verification`);
