import type { LucideIcon } from "lucide-react";

export function IconButton({
  label,
  icon: Icon,
  onClick,
  active,
  disabled
}: {
  label: string;
  icon: LucideIcon;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button className={`icon-button${active ? " active" : ""}`} onClick={onClick} disabled={disabled} title={label} aria-label={label}>
      <Icon size={17} />
    </button>
  );
}
