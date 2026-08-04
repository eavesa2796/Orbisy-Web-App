import Image from "next/image";

export function OrbisyLogo({
  className,
  priority = false,
}: {
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      alt="Orbisy"
      className={className}
      height={411}
      priority={priority}
      sizes="(max-width: 680px) 128px, 168px"
      src="/orbisy-horizontal-color.png"
      width={883}
    />
  );
}
