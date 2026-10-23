import type {Exercise,MathSettings,Task} from './logic';
export interface Answer {task:Task;correct:boolean;answer:string;responseMs:number;hint:boolean;transferComplete?:boolean;calculationCorrect?:boolean}
export interface MathResult {version:1;exercise:Exercise;completedAt:number;settings:MathSettings;answers:Answer[];correct:number;errors:number;hints:number}
/** One independently scored first answer per task; reviews never overwrite it. */
export class MathSeries {
  readonly answers:Answer[]=[];
  private answered=false;
  constructor(readonly exercise:Exercise,readonly settings:MathSettings){}
  begin():void{this.answered=false;}
  submit(answer:Answer):boolean{if(this.answered)return false;this.answered=true;this.answers.push(answer);return true;}
  get complete():boolean{return this.answers.length>=this.settings.count;}
  finish(now=Date.now()):MathResult {
    return {version:1,exercise:this.exercise,completedAt:now,settings:{...this.settings,numbers:[...this.settings.numbers]},answers:[...this.answers],correct:this.answers.filter(a=>a.correct).length,errors:this.answers.filter(a=>!a.correct).length,hints:this.answers.filter(a=>a.hint).length};
  }
}
