import Image from "next/image";
import { Modal } from "../common/Modal";
import { GenreTag } from "./GenreTag";
import { api } from "~/utils/api";
import { LoadingSpinner } from "../common/LoadingSpinner";

export const MovieDetailModal = ({
  id,
  onClose,
}: {
  id: number;
  onClose: () => void;
}) => {
  return (
    <Modal
      title="Details"
      open={true}
      onClose={onClose}
      body={
        <div className="h-full">
          <MovieDetail id={id} />
        </div>
      }
      footer={
        <div className="flex justify-end gap-5">
          <button
            onClick={onClose}
            className="rounded-md bg-red-700 px-3 py-1 text-white"
          >
            Close
          </button>
        </div>
      }
    ></Modal>
  );
};

export const MovieDetail = ({ id }: { id: number }) => {
  const { data, isLoading } = api.dashboard.findMovieById.useQuery({
    movieId: id,
  });

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isLoading && !data) {
    return <div>error</div>;
  }

  return (
    <div className="flex w-full flex-col rounded-md border border-zinc-200 bg-zinc-100 p-3 shadow-lg">
      <h3 className="text-xl font-medium tracking-wide">{data?.title}</h3>

      <div className="mt-3 grid flex-1 grid-cols-5 grid-rows-3 gap-x-8">
        <div className="col-span-3 row-span-2">
          <p className="line-clamp-[9] text-sm text-zinc-800">
            {data?.overview}
          </p>
        </div>

        <div className="col-span-2 row-span-4">
          <Image
            src={`${process.env.NEXT_PUBLIC_MOVIEDB_IMAGE_PREFIX}${data?.posterPath}`}
            alt="Poster"
            width={195}
            height="0"
            style={{ height: "auto" }}
            className="rounded-md"
          />
        </div>

        <div className="col-span-3">
          <p className="mt-3 text-sm text-zinc-600">
            Runtime: {data?.runtime} minutes
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Release Date: {data?.releaseDate}
          </p>
          <div className="mt-2 flex gap-1">
            {data?.genres.slice(0, 2).map((genre) => {
              return <GenreTag key={genre.id} name={genre.name} />;
            })}
          </div>
        </div>

        <div className="col-span-3 mt-4 flex gap-3 self-end">
          {data?.watchProviders && data.watchProviders.length > 0 ? (
            data?.watchProviders.map((provider) => {
              return (
                <Image
                  key={provider.name}
                  src={`${process.env.NEXT_PUBLIC_MOVIEDB_IMAGE_PREFIX}${provider.logoPath}`}
                  alt="Streaming provider"
                  width={45}
                  height="0"
                  style={{ height: "auto" }}
                  className="rounded-md"
                />
              );
            })
          ) : (
            <p className="text-sm text-zinc-600">
              Not available on streaming platforms
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
