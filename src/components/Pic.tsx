interface Props {
  icon: string;
  photo?: string;
  className?: string;
}

/** A step or reward picture: the parent's photo if there is one, otherwise an emoji. */
export function Pic({ icon, photo, className = "" }: Props) {
  if (photo) return <img src={photo} alt="" className={`pic pic-photo ${className}`} draggable={false} />;
  return (
    <span className={`pic pic-emoji ${className}`} aria-hidden="true">
      {icon}
    </span>
  );
}
