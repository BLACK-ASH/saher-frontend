"use client";
import { SearchBox } from "@/components/search-box";
import { ArrowLeft, ArrowRight, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import AddProgram from "./add-program";
import RoleAccess from "@/components/role-access";

type Props = {};

function ProgramHeader({}: Props) {
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
      queryKey: ["program"],
    });
  };

  return (
    <div className="flex flex-col sm:flex-row my-4 gap-2">
      <div className="flex-1">
        <SearchBox
          queryName="keyword"
          placeholder="Search Programs ..."
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
      <RoleAccess roles={["admin"]}>
        <AddProgram />
      </RoleAccess>
    </div>
  );
}

export default ProgramHeader;
