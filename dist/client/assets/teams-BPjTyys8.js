async function o(a,r){const{data:t,error:e}=await a.from("teams").select(`
      *,
      team_members(
        *,
        profile:profiles(display_name, role, avatar_url)
      )
    `).eq("tenant_id",r).order("name");if(e)throw e;return t||[]}export{o as l};
