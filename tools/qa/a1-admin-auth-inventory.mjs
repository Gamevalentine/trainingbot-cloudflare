// Read-only source inventory. No secrets, hashes, tokens or decoded HTML printed.
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
const read=path=>readFileSync(path,'utf8');
const html=read('overrides/admin.html');
const packed=[...new Set([...html.matchAll(/['"](\/admin-v2-runtime\/admin\.[^'"]+)['"]/g)].map(x=>x[1]))];
assert.equal(packed.length,16,'Admin packed runtime shape changed');
const body=gunzipSync(Buffer.from(packed.map(p=>read('overrides'+p).trim()).join(''),'base64')).toString('utf8');
const paths=[
 'functions/api/v49/admin/users.js',
 'functions/api/v71/admin/posts.js',
 'functions/api/v40/admin/[[path]].js',
 'functions/api/v71/admin/visitor-events.js',
 'functions/api/v71/admin/beta-versions.js'
];
const handlers=paths.map(path=>{
 const content=read(path);
 return {path,requiresSharedToken:/env\.ADMIN_TOKEN/.test(content),
   hasBearerToken:/Bearer|[Aa]uthorization/.test(content),
   namedAccountIdentityEvidence:/env\.ADMIN_(?:USERNAME|ACCOUNT_ID)|(?:SELECT|FROM)\s+admin_accounts\b|verifiedAdminUserId/i.test(content)};
});
for(const x of handlers)assert.equal(x.requiresSharedToken,true,'Unexpected Admin authentication contract at '+x.path);
assert.match(body,/id=["']adminToken["']/i,'Admin token input not present');
assert.match(body,/id=["']loginForm["']/i,'Admin login form not present');
const result={
 inspectedFrom:'GitHub source snapshot only',
 packedAdminBytes:Buffer.byteLength(body),packedParts:packed.length,
 adminLoginFormPresent:true,
 sharedTokenLoginFieldPresent:true,
 storageAPIsPresent:/sessionStorage|localStorage/.test(body),
 backendHandlers:handlers,
 historicTwoFactorSourceCurrentlyDeployed:existsSync('functions/_lib/admin_auth.js')&&existsSync('functions/api/admin-auth/[[path]].js'),
 productionPersonalAdminLoginVerified:false,
 personSpecificAdminSessionVerified:false,
 userRoleAuthorityVerified:false,
 note:'Shared ADMIN_TOKEN is not proof of person-specific Admin identity; historic fixed Admin 2FA is not current source.'
};
console.log('A1_ADMIN_AUTH_INVENTORY '+JSON.stringify(result));
assert.equal(result.historicTwoFactorSourceCurrentlyDeployed,false);
console.log('A.1 ADMIN SOURCE INVENTORY PASS; A.7 live individual Admin login still required');
