import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {dirname,join} from 'node:path';
import ts from 'typescript';
import {expect,it} from 'vitest';

// These components render their children inside React Native Text.
const textComponents=new Set(['Text','Hand','Title','Copy','Note','Heading']);
function renderedText(raw:string){
 const lines=raw.split(/\r\n|\n|\r/);let lastNonEmpty=0;
 lines.forEach((line,i)=>{if(/[^ \t]/.test(line))lastNonEmpty=i;});
 return lines.map((line,i)=>{
  let value=line.replace(/\t/g,' ');
  if(i!==0)value=value.replace(/^ +/,'');
  if(i!==lines.length-1)value=value.replace(/ +$/,'');
  return value+(value&&i!==lastNonEmpty?' ':'');
 }).join('');
}
function rawTextChildren(source:string,file='screen.tsx'){
 const parsed=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX),errors:string[]=[];
 function visit(node:ts.Node){
  if(ts.isJsxText(node)&&renderedText(node.text)){
   let parent:ts.Node|undefined=node.parent;
   while(parent&&!ts.isJsxElement(parent))parent=parent.parent;
   const name=parent&&ts.isJsxElement(parent)?parent.openingElement.tagName.getText(parsed):'Fragment';
   if(!textComponents.has(name)){
    const line=parsed.getLineAndCharacterOfPosition(node.getStart(parsed)).line+1;
    errors.push(`${file}:${line} — raw text ${JSON.stringify(renderedText(node.text))} inside ${name}`);
   }
  }
  ts.forEachChild(node,visit);
 }
 visit(parsed);return errors;
}
function nativeFiles(folder:string):string[]{
 return readdirSync(folder,{withFileTypes:true}).flatMap(entry=>{
  if(['node_modules','ios','android','.expo'].includes(entry.name))return [];
  const file=join(folder,entry.name);
  return entry.isDirectory()?nativeFiles(file):file.endsWith('.tsx')?[file]:[];
 });
}

it('detects inline spaces and raw text outside Text, while allowing Text children and multiline formatting',()=>{
 expect(rawTextChildren('const Feed=()=> <Page><View/> <View/></Page>;')).toHaveLength(1);
 expect(rawTextChildren('const Feed=()=> <View><><Text/> text</></View>;')).toHaveLength(1);
 expect(rawTextChildren('const Feed=()=> <><View/> <View/></>;')).toHaveLength(1);
 expect(rawTextChildren('const Feed=()=> <Text>Fresh <><Text/> city</></Text>;')).toEqual([]);
 expect(rawTextChildren('const Feed=()=> <Page>\n  <View/>\n  <View/>\n</Page>;')).toEqual([]);
});

it('keeps native screens free of literal text children in View, ScrollView and other non-text containers',()=>{
 let repository=process.cwd();
 while(!existsSync(join(repository,'apps/mobile/App.tsx'))&&dirname(repository)!==repository)repository=dirname(repository);
 const root=join(repository,'apps/mobile');
 const errors=nativeFiles(root).flatMap(file=>rawTextChildren(readFileSync(file,'utf8'),file));
 expect(errors).toEqual([]);
});
