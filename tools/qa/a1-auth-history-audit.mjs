// Git history inventory only; never print source, secrets, user records or passwords.
import {execFileSync} from 'node:child_process';
function git(args){return execFileSync('git',args,{encoding:'utf8',maxBuffer:30*1024*1024,timeout:120000});}
const names=git(['log','--all','--name-only','--format=']).split('\n').map(x=>x.trim()).filter(Boolean);
const matching=[...new Set(names)].filter(x=>/worker|wrangler|session|login|auth|v49|cloudflare|backup/i.test(x)).sort();
const ignored=matching.filter(x=>x.startsWith('source_parts/')||x.startsWith('overrides/'));
const candidates=matching.filter(x=>!ignored.includes(x));
const deleted=git(['log','--all','--diff-filter=D','--name-only','--format=']).split('\n').map(x=>x.trim()).filter(Boolean);
const relevantDeleted=[...new Set(deleted)].filter(x=>/worker|wrangler|auth|login|session|v49|cloudflare/i.test(x)).slice(0,50);
const commits=git(['log','--all','--format=%h %cs %s','--max-count=200']).split('\n')
 .filter(x=>/worker|login|authentication|auth|v49|session|cloudflare/i.test(x))
 .map(x=>x.slice(0,180)).slice(0,35);
console.log('HISTORICAL_SOURCE_FILE_CANDIDATES '+JSON.stringify(candidates.slice(0,100)));
console.log('HISTORICAL_DELETED_CANDIDATES '+JSON.stringify(relevantDeleted));
console.log('HISTORICAL_RELEVANT_COMMIT_SUBJECTS '+JSON.stringify(commits));
console.log('AUDIT_METADATA_ONLY; no content, credential or user record exported');
