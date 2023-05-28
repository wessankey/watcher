export const GenreTag = ({ name }: { name: string }) => {
  return (
    <div
      className={`inline-block rounded-full bg-[#ebab34] px-2 py-1 text-xs font-semibold text-white `}
    >
      {name}
    </div>
  );
};
