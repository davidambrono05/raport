import{c as o}from"./index-t5CEPkLg.js";const s=[["path",{d:"M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0",key:"1r0f0z"}],["circle",{cx:"12",cy:"10",r:"3",key:"ilqhr7"}]],m=o("map-pin",s);async function f(e,r,a){let t=e.from("work_items").select(`
      *,
      contact:contacts(*),
      team:teams(*)
    `).eq("tenant_id",r).order("created_at",{ascending:!1});const{data:c,error:n}=await t;if(n)throw n;return c}async function d(e,r,a){const{data:t,error:c}=await e.from("work_items").select(`
      *,
      contact:contacts(*),
      team:teams(*)
    `).eq("tenant_id",r).eq("id",a).single();if(c)throw c;return t}async function l(e,r){const{data:a,error:t}=await e.from("work_items").insert(r).select().single();if(t)throw t;return a}export{m as M,l as c,d as g,f as l};
