import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"

type NoDataProps = React.ComponentProps<"div"> & {
  title: string
  description: string
}

export function NoData({
  className,
  children,
  title,
  description,
  ...props
}: NoDataProps) {
  return (
    <Empty className={cn("border border-dashed", className)} {...props} >
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        {children}
      </EmptyContent>
    </Empty>
  )
}

