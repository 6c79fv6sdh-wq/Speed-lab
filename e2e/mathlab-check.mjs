import {spawnSync} from 'node:child_process';
const run=args=>{const result=spawnSync(args[0],args.slice(1),{stdio:'inherit'});if(result.error)throw result.error;return result.status??1;};
let status=run(['npm','run','build']);
if(status===0)try{status=run(['node','e2e/make-fixture.mjs']);if(status===0)status=run(['node','e2e/mathlab.mjs']);}finally{const restored=run(['npm','run','build']);if(restored)status=restored;}
process.exitCode=status;
