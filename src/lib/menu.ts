import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";

export function useMenu(location: "header" | "footer") {
  return useQuery({
    queryKey: ["menu", location],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, label_bn, label_en, url, sort_order")
        .eq("location", location)
        .eq("visible", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
