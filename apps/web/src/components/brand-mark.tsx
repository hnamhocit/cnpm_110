import Image from "next/image";

export function BrandMark({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <Image
      src="/brand/cinegen.webp"
      alt=""
      width={size}
      height={size}
      className={className}
    />
  );
}
