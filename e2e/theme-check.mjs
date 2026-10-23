import {spawnSync} from 'node:child_process';
const run=args=>{const r=spawnSync(args[0],args.slice(1),{stdio:'inherit'});if(r.error)throw r.error;return r.status??1;};
let code=run(['npm','run','build']);
if(!code)try{code=run(['node','e2e/make-fixture.mjs']);if(!code)code=run(['node','e2e/themes.mjs',...process.argv.slice(2)]);}finally{const restore=run(['npm','run','build']);if(restore)code=restore;}
process.exitCode=code;
