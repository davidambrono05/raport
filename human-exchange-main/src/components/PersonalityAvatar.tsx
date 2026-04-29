import { useState } from "react";

type Props = {
  name: string;
  avatarUrl?: string | null;
  size?: number;
  className?: string;
  textClassName?: string;
};

export function PersonalityAvatar({ name, avatarUrl, size = 48, className = "", textClassName = "" }: Props) {
  const [errored, setErrored] = useState(false);
  const initials = name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
  const showImg = avatarUrl && !errored;

  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-full border border-border bg-surface-elevated ${className}`}
      style={{ width: size, height: size }}
    >
      {showImg ? (
        <img
          src={avatarUrl}
          alt={name}
          loading="lazy"
          onError={() => setErrored(true)}
          className="absolute inset-0 h-full w-full object-cover object-center"
          style={{ objectPosition: "center top" }}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          <span className={`font-display font-bold text-gold ${textClassName || "text-base"}`}>{initials}</span>
        </div>
      )}
    </div>
  );
}
