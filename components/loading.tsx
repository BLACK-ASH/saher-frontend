import { Skeleton } from "./ui/skeleton"


type DefaultLoaderProps = React.ComponentProps<"div"> & {}

export function DefaultLoader({
  className,
  children,
  ...props
}: DefaultLoaderProps) {
  return (
    <Skeleton className={className} {...props}>
    </Skeleton>
  )
}

