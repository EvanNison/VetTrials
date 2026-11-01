import { readFileSync } from 'node:fs';
import path from 'node:path';
import { NextResponse } from 'next/server';
import type { Trial, SourceStatus } from '@/types';
export const dynamic = 'force-dynamic';
const data = JSON.parse(readFileSync(path.join(process.cwd(), '../review/fixtures.json'), 'utf8')) as {
  records: Trial[]; stats: { data: unknown; error: string | null }; sources: { data: SourceStatus[]; error: string | null };
};
const records = data.records;
function facet(list: Trial[], key: 'species' | 'conditionCategory' | 'enrollmentStatus' | 'locationState') {
  const counts: Record<string, number> = {};
  for (const t of list) {
    const values = Array.isArray(t[key]) ? t[key] as string[] : [t[key]];
    for (const v of values) if(v) counts[v] = (counts[v] || 0) + 1;
  }
  return Object.entries(counts).map(([value,count])=>({value,count})).sort((a,b)=>b.count-a.count);
}
export function GET(request: Request) {
  const u=new URL(request.url); let result; let status=200;
  if(u.pathname==='/api/stats')result=data.stats;
  else if(u.pathname==='/api/sources')result=data.sources;
  else if(u.pathname==='/api/filters')result={data:{species:facet(records,'species'),conditions:facet(records,'conditionCategory'),statuses:facet(records,'enrollmentStatus'),states:facet(records,'locationState'),institutions:data.sources.data.map(s=>({id:s.id,name:s.name,shortName:s.shortName,count:s.trialCount}))},error:null};
  else if(/^\/api\/trials\/\d+$/.test(u.pathname)){const t=records.find(t=>t.id===Number(u.pathname.split('/').pop()));result={data:t||null,error:t?null:'Trial not found'};if(!t)status=404;}
  else if(u.pathname==='/api/trials'){
    const p=u.searchParams; let rows=records.filter(t=>t.isActive);
    for(const [param,key] of [['species','species'],['condition','conditionCategory'],['status','enrollmentStatus']] as const)if(p.get(param)){const values=p.get(param)!.split(',');rows=rows.filter(t=>Array.isArray(t[key])?t[key].some(v=>values.includes(v)):values.includes(t[key]));}
    if(p.get('q'))rows=rows.filter(t=>[t.title,t.conditionSpecific,t.eligibilitySummary].join(' ').toLowerCase().includes(p.get('q')!.toLowerCase()));
    if(p.get('institution'))rows=rows.filter(t=>t.sourceId===Number(p.get('institution')));
    if(p.get('state'))rows=rows.filter(t=>t.locationState===p.get('state'));
    const page=Math.max(1,Number(p.get('page')||1)), limit=Math.min(100,Number(p.get('limit')||20));
    result={data:{trials:rows.slice((page-1)*limit,page*limit),pagination:{page,limit,total:rows.length,totalPages:Math.ceil(rows.length/limit)}},error:null};
  }else{status=404;result={data:null,error:'Not in read-only snapshot'};}

  return NextResponse.json(result, {status});
}
