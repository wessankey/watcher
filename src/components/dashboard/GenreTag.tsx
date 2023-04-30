export const GenreTag = ({ name, color }: { name: string; color: string }) => {
  return (
    <div
      style={{ backgroundColor: color }}
      className={`inline-block rounded-full px-2 py-1 text-xs font-semibold text-white`}
    >
      {name}
    </div>
  );
};
