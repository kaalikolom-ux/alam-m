import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { STATIC_CATEGORIES } from "@/lib/staticCategories";

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    initialData: STATIC_CATEGORIES as any,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("*").order("name_bn");
      return (data && data.length > 0 ? data : STATIC_CATEGORIES) as any[];
    },
  });
}

export function useMenuItems(location?: string) {
  return useQuery({
    queryKey: ["menu_items", location],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("menu_items")
        .select("*")
        .order("sort_order", { ascending: true });

      const rawList = (data || []) as any[];
      // Deduplicate by clean URL to prevent any duplicate menu items
      const seen = new Set<string>();
      const uniqueList: any[] = [];
      for (const item of rawList) {
        const cleanUrl = (item.url || "").trim();
        if (cleanUrl && !seen.has(cleanUrl)) {
          seen.add(cleanUrl);
          uniqueList.push(item);
        }
      }
      return uniqueList;
    },
  });
}

export const useMenu = useMenuItems;
