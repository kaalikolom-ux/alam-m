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

export function useMenuItems() {
  return useQuery({
    queryKey: ["menu_items"],
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("menu_items")
        .select("*")
        .order("sort_order", { ascending: true });
      return (data || []) as any[];
    },
  });
}

export const useMenu = useMenuItems;
