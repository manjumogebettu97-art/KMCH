import { test } from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
const source = fs.readFileSync(new URL('../integration/Code.gs', import.meta.url), 'utf8');
test('Google adapter maps all answers, prevents duplicate rows and rejects unauthorized or invalid submissions', () => {
 const rows=[];const token='test-only-token-at-least-24-characters';let headers;
 const sheet={getRange:(row,col)=>({getValues:()=>[headers],createTextFinder:id=>({matchEntireCell:()=>({findNext:()=>rows.some(r=>r[17]===id)?{}:null})})}),getLastRow:()=>rows.length+1,appendRow:row=>rows.push(row)};
 const context=vm.createContext({PropertiesService:{getScriptProperties:()=>({getProperty:()=>token})},LockService:{getScriptLock:()=>({waitLock(){},hasLock:()=>true,releaseLock(){}})},SpreadsheetApp:{openById:()=>({getSheetByName:()=>sheet}),flush(){}},ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({setMimeType:()=>JSON.parse(text)})}});
 vm.runInContext(source,context);headers=vm.runInContext('HEADERS',context);
 const lead={token,name:'=FORMULA()',phone:'9000000000',fillingFor:'Friend',gender:'Female',city:'Salem',concern:'Hernia',surgeryAdvised:'Not Sure',duration:'More than 1 year',comfortable:'No',consent:true,requestId:'11111111-1111-4111-8111-111111111111',campaign:{utm_source:'google'}};
 const send=data=>context.doPost({postData:{contents:JSON.stringify(data)}});
 assert.equal(send({...lead,token:'wrong'}).ok,false);assert.equal(send({...lead,city:'Invalid'}).ok,false);assert.equal(rows.length,0);
 assert.equal(send(lead).ok,true);assert.equal(rows.length,1);assert.equal(rows[0].length,19);assert.equal(rows[0][1],"'=FORMULA()");assert.equal(rows[0][2],'Friend');assert.equal(rows[0][3],"'9000000000");assert.equal(rows[0][4],'Female');assert.equal(rows[0][5],'Salem');assert.equal(rows[0][6],'Hernia');assert.equal(rows[0][7],'Not Sure');assert.equal(rows[0][8],'More than 1 year');assert.equal(rows[0][9],'No');assert.equal(rows[0][10],'Yes');assert.equal(rows[0][11],'google');assert.equal(rows[0][17],lead.requestId);assert.equal(rows[0][18],'New');
 assert.equal(send(lead).ok,true);assert.equal(rows.length,1);
});
