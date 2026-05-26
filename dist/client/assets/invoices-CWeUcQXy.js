async function s(t){const{data:a,error:e}=await t.rpc("get_tenant_dashboard_stats");if(e)throw e;return a?.[0]}async function i(t,a,e){let n=t.from("invoices").select(`
      *,
      contact:contacts(name, phone, email),
      work_item:work_items(title)
    `).eq("tenant_id",a).order("created_at",{ascending:!1});const{data:o,error:r}=await n;if(r)throw r;return o}export{s as g,i as l};
