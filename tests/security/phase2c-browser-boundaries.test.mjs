import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
const root=fileURLToPath(new URL('../..',import.meta.url));
const walk=dir=>readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(join(dir,entry.name)):/\.(ts|tsx)$/.test(entry.name)?[join(dir,entry.name)]:[]);
const files=walk(join(root,'src'));
const read=path=>readFileSync(path,'utf8');
const resolveImport=(file,spec)=>{
 if(!spec.startsWith('@/')&&!spec.startsWith('.'))return null;
 const base=spec.startsWith('@/')?join(root,'src',spec.slice(2)):resolve(dirname(file),spec);
 return [base,base+'.ts',base+'.tsx',join(base,'index.ts'),join(base,'index.tsx')].find(p=>existsSync(p)&&/\.(ts|tsx)$/.test(p));
};
const guardedRoutes=files.filter(file=>/[/\\]api[/\\].*[/\\]route\.ts$/.test(file)&&/getAuthUser|getWebUser|verifiedAppSession|resolveUserPlan/.test(read(file))).map(file=>'/api/'+file.replaceAll('\\','/').split('/api/')[1].replace('/route.ts','').replace(/\[[^\]]+\]/g,'[^/]+'));
const guarded=url=>guardedRoutes.some(route=>new RegExp('^'+route+'(?:[/?]|$)').test(url));
const roots=files.filter(file=>/^\s*['"]use client['"]/.test(read(file)));
const seen=new Set();
function visit(file){
 if(seen.has(file))return;seen.add(file);
 assert(!/server-auth-session|server-session-store|supabase-server|api-security|distributed-rate-limit/.test(file),`Server credentials entered client graph: ${file}`);
 const text=read(file),ast=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true);
 assert(!/\.(access_token|refresh_token)\b|auth\.setSession\(|exchangeCodeForSession\(/.test(text),`Reusable Auth credential consumption: ${file}`);
 const checkFetch=node=>{
  if(ts.isCallExpression(node)&&node.expression.getText(ast)==='fetch'){
   const arg=node.arguments[0],prefix=arg&&ts.isStringLiteral(arg)?arg.text:arg&&ts.isTemplateExpression(arg)?arg.head.text:'';
   if(prefix.startsWith('/api/')&&guarded(prefix))assert(node.getText(ast).includes('X-LingoPro-Request'),`Guarded browser call needs authFetch/proof: ${file}`);
  }
  ts.forEachChild(node,checkFetch);
 };
 checkFetch(ast);
 for(const node of ast.statements){
  if(!ts.isImportDeclaration(node)&&!ts.isExportDeclaration(node))continue;
  if(node.isTypeOnly||node.importClause?.isTypeOnly||!node.moduleSpecifier||!ts.isStringLiteral(node.moduleSpecifier))continue;
  const bindings=node.importClause?.namedBindings;
  if(bindings&&ts.isNamedImports(bindings)&&bindings.elements.length&&bindings.elements.every(e=>e.isTypeOnly))continue;
  const target=resolveImport(file,node.moduleSpecifier.text);if(target)visit(target);
 }
}
roots.forEach(visit);
const client=read(join(root,'src/lib/app-auth-client.ts'));
assert(!/storage\.setItem|localStorage\.setItem|sessionStorage\.setItem/.test(client));
const browser=read(join(root,'src/lib/supabase.ts'));
for(const marker of ['persistSession: false','autoRefreshToken: false','detectSessionInUrl: false','/api/auth/data/'])assert(browser.includes(marker));
assert(!browser.includes('createBrowserClient'));assert(!browser.includes('createBrowserSupabaseClient'));
const dto=read(join(root,'src/lib/app-session-types.ts'));assert(!/access_token|refresh_token/.test(dto));
console.log(`[P2C] ${roots.length} browser roots / ${seen.size} reachable source files: no server credentials, SDK sessions or reusable token consumers PASS`);
