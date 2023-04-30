import debounce from "lodash.debounce";
import Image from "next/image";
import { useState } from "react";
import { TSearchResult } from "~/server/api/routers/dashboard";
import { api } from "~/utils/api";

export const MediaSearchModal = ({
  selectedResult,
  onResultClick,
}: {
  selectedResult?: TSearchResult;
  onResultClick: (result: TSearchResult | undefined) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const onUpdate = debounce((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedResult) {
      onResultClick(undefined);
    }

    setSearchTerm(e.target.value);
  }, 500);

  const onSelectResult = (result: TSearchResult) => {
    onResultClick(result);
  };

  const { data } = api.dashboard.search.useQuery({ text: searchTerm || "" });

  return (
    <div className="h-full overflow-auto">
      <input
        className="h-10 w-full rounded-md border border-gray-300 px-3"
        type="text"
        placeholder="Search for a movie or show"
        onChange={onUpdate}
      />
      <div className="h-full overflow-auto">
        {selectedResult ? (
          <SearchResultItem
            result={selectedResult}
            onSelectResult={onSelectResult}
          />
        ) : (
          <SearchResultList
            results={data || []}
            onSelectResult={onSelectResult}
          />
        )}
      </div>
    </div>
  );
};

const SearchResultList = ({
  results,
  onSelectResult,
}: {
  results: TSearchResult[];
  onSelectResult: (result: TSearchResult) => void;
}) => {
  return (
    <div className="mt-2 h-full">
      {results.map((r) => {
        return (
          <SearchResultItem
            key={r.id}
            result={r}
            onSelectResult={onSelectResult}
          />
        );
      })}
    </div>
  );
};

const SearchResultItem = ({
  result,
  onSelectResult,
}: {
  result: TSearchResult;
  onSelectResult: (result: TSearchResult) => void;
}) => {
  return (
    <div
      className="my-2 flex cursor-pointer justify-between rounded-md bg-zinc-200 px-3
      py-1 hover:bg-zinc-400"
      onClick={() => onSelectResult(result)}
    >
      <div>
        <p>{result.title}</p>

        <div className="w-5/6">
          <p className="line-clamp-2 text-sm">{result.overview}</p>
        </div>
      </div>
      <Image
        src={`${process.env.NEXT_PUBLIC_MOVIEDB_POSTER_PATH_PREFIX}${result.posterPath}`}
        alt="Poster"
        width={50}
        height={50}
      />
    </div>
  );
};
