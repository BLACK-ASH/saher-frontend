"use client";
import { SearchBox } from "@/components/search-box";
import { ArrowLeft, ArrowRight, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AddSession from "./add-session";
import RoleAccess from "@/components/role-access";

function SessionHeader() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page") ?? "1");

  const updatePage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());

    if (newPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(newPage));
    }

    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    });
  };
  const refresh = () => {
    queryClient.invalidateQueries({
      queryKey: ["sessions"],
    });
  };

  return (
    <div className="flex flex-col sm:flex-row my-4 gap-2">
      <div className="flex-1">
        <SearchBox
          queryName="keyword"
          placeholder="Search Sessions ..."
          debounce={700}
        />
      </div>
      <div className="flex gap-2">
        <Button
          variant={"outline"}
          className="flex gap-2"
          onClick={() => refresh()}
        >
          <RotateCw />
          <span>Refresh</span>
        </Button>
        <Button
          variant={"outline"}
          onClick={() => updatePage(page - 1)}
          disabled={page <= 1}
        >
          <ArrowLeft />
        </Button>
        <Button variant={"outline"} onClick={() => updatePage(page + 1)}>
          <ArrowRight />
        </Button>
      </div>
      <RoleAccess allow={(r) => r === "manager" || r === "admin"}>
        <AddSession />
      </RoleAccess>
    </div>
  );
}

export default SessionHeader;
