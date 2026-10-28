#!/usr/bin/env node
// Wiki Stage A — read-only inventory / normalized catalog / missing-source audit.
// No game values are inferred. Nothing is deployed into the Wiki interface.
import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";
const TYPES=["weapons","attachments","vehicles","maps"];
const COLUMNS={
 weapons:["name","category","ammo","fireMode"],
 attachments:["name","category","description"],
 vehicles:["name","category","seats","availability","description"],
 maps:["name","size","description","mode"]
};
const args=process.argv.slice(2),ri=args.indexOf("--runtime"),oi=args.indexOf("--out");
const runtimeFile=ri<0?null:args[ri+1],out=oi<0?"wiki-stage-a-artifacts":args[oi+1];
if(!out||(ri>=0&&!runtimeFile))throw Error("Use --runtime snapshot.json --out output-directory");
const sourcePath=fs.existsSync("public/wiki.html")?"public/wiki.html":"overrides/wiki.html";
const html=fs.readFileSync(sourcePath,"utf8");
function extractSource(){
 const at=html.indexOf("const DATA=");
 if(at<0)throw Error("Wiki inline DATA not found");
 const start=html.indexOf("{",at);
 let depth=0,quote=false,escape=false,end=-1;
 for(let i=start;i<html.length;i++){
  const ch=html[i];
  if(quote){if(escape)escape=false;else if(ch==="\\")escape=true;else if(ch==='"')quote=false;continue;}
  if(ch==='"'){quote=true;continue;}
  if(ch==="{")depth++;
  if(ch==="}"&&--depth===0){end=i+1;break;}
 }
 if(end===-1)throw Error("Invalid DATA literal");
 return JSON.parse(html.slice(start,end));
}
const baseline=extractSource();
const runtime=runtimeFile?JSON.parse(fs.readFileSync(runtimeFile,"utf8")):null;
const current=runtime?.data||baseline;
for(const k of TYPES){
 assert(Array.isArray(baseline[k]),"Missing original "+k);
 assert(Array.isArray(current[k]),"Missing effective "+k);
}
function norm(s){return String(s??"").normalize("NFKD").replace(/[\u0300-\u036f]/g,"").replace(/đ/g,"d").replace(/Đ/g,"D").trim().replace(/\s+/g," ").toLowerCase();}
function slug(s){return norm(s).replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"unnamed";}
const records=[],issues=[],summary={};
for(const k of TYPES){
 const seen=new Map(),stats={baseline:baseline[k].length,effective:current[k].length,duplicates:0,missing:0,placeholders:0,imagesUnvalidated:0,noImage:0};
 summary[k]=stats;
 for(let i=0;i<current[k].length;i++){
  const row=current[k][i],cols=COLUMNS[k];
  if(!Array.isArray(row)){issues.push({severity:"error",kind:k,index:i,code:"invalid_row"});continue;}
  const name=String(row[0]??"").trim(),key=norm(name),missing=[],placeholders=[],fields={};
  for(let j=0;j<cols.length;j++){
   const v=row[j]??null,empty=v===null||String(v).trim()==="";
   const placeholder=!empty&&/^(chưa xác minh|chưa rõ|n\/a|unknown|—|-)$/.test(norm(v));
   fields[cols[j]]={value:empty||placeholder?null:v,unit:null,status:"unverified",sourceTitle:null,sourceUrl:null,gameVersion:null,checkedAt:null,note:placeholder?"Placeholder in source":null};
   if(empty)missing.push(cols[j]);
   if(placeholder)placeholders.push(cols[j]);
  }
  const old=baseline[k].find(r=>norm(r[0])===key);
  const changed=old?cols.filter((x,j)=>JSON.stringify(old[j]??null)!==JSON.stringify(row[j]??null)):cols;
  const foundImage=runtime?.images?.[k]?.[name];
  const image={url:foundImage?.url||null,origin:foundImage?.url?.startsWith("http")?"external":foundImage?.url?"site":null,verificationStatus:foundImage?.url?"not_validated":"unknown"};
  if(image.url)stats.imagesUnvalidated++;else stats.noImage++;
  records.push({id:k+"-"+slug(name),kind:k,name,category:String(row[1]??""),aliases:[],fields,rawFields:row,image,
    provenance:{baselineFile:sourcePath,patchedAtRuntime:!!runtime,changedFromBaseline:changed,sourceIdentifiers:["trainingbot-wiki-inline"]},
    review:{status:"needs_source",notes:[]}});
  if(seen.has(key)){stats.duplicates++;issues.push({severity:"error",kind:k,name,code:"duplicate_name",first:seen.get(key),index:i});}
  else seen.set(key,i);
  if(missing.length){stats.missing++;issues.push({severity:"warning",kind:k,name,code:"missing_required",fields:missing});}
  if(placeholders.length){stats.placeholders+=placeholders.length;issues.push({severity:"review",kind:k,name,code:"placeholder",fields:placeholders});}
  if(changed.length){issues.push({severity:"review",kind:k,name,code:old?"patched_fields":"added_at_runtime",fields:changed});}
 }
}
if(runtime?.badges){
 for(const kind of TYPES){
  const badge=runtime.badges[kind],actual=current[kind].length;
  if(badge!==undefined&&badge!==actual)
   issues.push({severity:"warning",kind,code:"stale_display_count",displayed:badge,effective:actual,
    note:"The rendered category badge differs from the actual number of records. Preserve as Stage B UI issue."});
 }
}
const v147="overrides/wiki_catalog_verified_v147.js",v149="overrides/wiki_audit_v149.js";
if(fs.existsSync(v147)&&fs.existsSync(v149)&&fs.readFileSync(v147,"utf8").includes("p90[2]='9mm'")&&fs.readFileSync(v149,"utf8").includes("p90[2]='5.7mm'"))
 issues.push({severity:"review",kind:"weapons",name:"P90",code:"conflicting_patch_layers",
  note:"v147 sets 9mm; v149 overrides 5.7mm. This is a code-order issue, not independent gameplay verification.",sourceFiles:[v147,v149]});
const counts=obj=>Object.fromEntries(TYPES.map(k=>[k,obj[k].length]));
const report={schemaVersion:"wiki-a.1",auditDate:"2026-10-29",mode:runtime?"runtime":"static",baselineCounts:counts(baseline),effectiveCounts:counts(current),summary,issues};
const catalog={schemaVersion:"wiki-a.1",auditDate:"2026-10-29",mode:report.mode,
 note:"Not gameplay-verified. No external source has been validated; null means unknown, never substitute 0.",
 records};
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,"issues.json"),JSON.stringify(report,null,2)+"\n");
fs.writeFileSync(path.join(out,"catalog.json"),JSON.stringify(catalog,null,2)+"\n");
const lines=["# TrainingBot Wiki Stage A — inventory","",
 "Mode: "+report.mode+" (read-only)","","| Collection | Original | Effective | Duplicates | Missing records | Placeholder fields | Unvalidated images |",
 "|---|---:|---:|---:|---:|---:|---:|"];
for(const k of TYPES){const v=summary[k];lines.push("| "+k+" | "+v.baseline+" | "+v.effective+" | "+v.duplicates+" | "+v.missing+" | "+v.placeholders+" | "+v.imagesUnvalidated+" |");}
lines.push("","## Source rules","- Internal code and filename 'verified' are NOT primary evidence.",
 "- Exact official URL, title, version and check date are required for 'verified_official'.",
 "- Remote image references are only URLs; no download, visual match or copyright assertion.",
 "- No frontend content, underlying DATA, API or persistence changes are made.",
 "","## Issues");
for(const x of issues)lines.push("- "+x.severity+" "+x.kind+"/"+(x.name||x.index||"")+": "+x.code+(x.fields?" ("+x.fields.join(", ")+")":""));
fs.writeFileSync(path.join(out,"README.md"),lines.join("\n")+"\n");
console.log("STAGE A INVENTORY "+JSON.stringify({baseline:report.baselineCounts,effective:report.effectiveCounts,summary,issues:issues.length}));
if(issues.some(x=>x.severity==="error"))process.exitCode=2;
