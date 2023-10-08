import axios from "axios";
import fs from "fs";
import { z } from "zod";
import { MediaType, Status } from "@prisma/client";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";

type TWatchProvider = {
  name: string;
  logoPath: string;
};

export type TMovieSearchResult = {
  id: number;
  title: string;
  overview: string;
  posterPath: string;
};

export type TMovie = {
  id: number;
  title: string;
  genres: { id: number; name: string }[];
  posterPath: string;
  runtime: string;
  release_date: string;
  overview: string;
  watchProviders: TWatchProvider[];
};

const buildSearchUrl = (text: string) => {
  const url = `${process.env.NEXT_PUBLIC_MOVIEDB_URL}/search/movie`;
  const apiSegment = `?api_key=${process.env.NEXT_PUBLIC_MOVIEDB_API_KEY}`;
  const querySegment = `&query=${encodeURIComponent(text)}`;

  return `${url}${apiSegment}${querySegment}`;
};

const buildGetMovieByIdUrl = (id: number, path?: string) => {
  const urlPath = path ? `/${path}` : "";
  const url = `${process.env.NEXT_PUBLIC_MOVIEDB_URL}/movie/${id}${urlPath}`;
  const apiSegment = `?api_key=${process.env.NEXT_PUBLIC_MOVIEDB_API_KEY}`;

  return `${url}${apiSegment}`;
};

const buildGetMovieWatchProvidersUrl = (id: number) => {
  return buildGetMovieByIdUrl(id, "watch/providers");
};

const getMedia = privateProcedure.query(async ({ ctx }) => {
  return await ctx.prisma.userMedia.findMany({
    where: {
      userId: ctx.userId,
    },
    include: {
      Media: {
        include: {
          genres: true,
        },
      },
    },
  });
});

const transformSearchResult = (data: any): TMovie[] => {
  return data.results.map((searchResult: any) => ({
    id: searchResult.id,
    title: searchResult.title,
    genres: "",
    posterPath: searchResult.poster_path,
    runtime: "",
    release_date: "",
    overview: searchResult.overview,
    watchProviders: "",
  }));
};

function readFile(path: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    fs.readFile(path, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

const getWatchProviders = async (id: number): Promise<TWatchProvider[]> => {
  return axios.get(buildGetMovieWatchProvidersUrl(id)).then((res) => {
    const usProviders = res.data.results["US"];

    if (usProviders && "flatrate" in usProviders) {
      // @ts-ignore
      return usProviders.flatrate.map((provider) => ({
        name: provider.provider_name,
        logoPath: provider.logo_path,
      }));
    }

    return [];
  });

  // const mockFilePath = `${process.env.PWD}/src/mock/watchProviders.json`;

  // return readFile(mockFilePath)
  //   .then((data) => JSON.parse(data.toString()))
  //   .then((data) => {
  //     // @ts-ignore
  //     return data.results["US"].flatrate.map((provider) => ({
  //       name: provider.provider_name,
  //       logoPath: provider.logo_path,
  //     }));
  //   });
};

const getMediaById = async (id: number): Promise<TMovie> => {
  const watchProviders = await getWatchProviders(id);

  return axios.get(buildGetMovieByIdUrl(id)).then((res) => {
    return {
      id: res.data.id,
      title: res.data.title,
      genres: res.data.genres,
      last_updated: new Date(),
      posterPath: res.data.poster_path,
      runtime: res.data.runtime,
      release_date: res.data.release_date,
      overview: res.data.overview,
      watchProviders,
    };
  });

  // const mockFilePath = `${process.env.PWD}/src/mock/movie.json`;

  // return readFile(mockFilePath)
  //   .then((data) => JSON.parse(data.toString()))
  //   .then((data) => {
  //     return {
  //       id: data.id,
  //       title: data.title,
  //       genres: data.genres,
  //       last_updated: new Date(),
  //       posterPath: data.poster_path,
  //       runtime: data.runtime,
  //       release_date: data.release_date,
  //       overview: data.overview,
  //       watchProviders,
  //     };
  //   });
};

const findMovieById = privateProcedure
  .input(z.object({ movieId: z.number() }))
  .query(async ({ input }) => {
    return await getMediaById(input.movieId);
  });

const changeCardStatus = privateProcedure
  .input(
    z.object({
      mediaId: z.number(),
      fromStatus: z.enum([
        Status.WATCHING,
        Status.WANT_TO_WATCH,
        Status.WATCHED,
      ]),
      toStatus: z.enum([Status.WATCHING, Status.WANT_TO_WATCH, Status.WATCHED]),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const updated = await ctx.prisma.userMedia.update({
      where: {
        userId_mediaId: {
          mediaId: input.mediaId,
          userId: ctx.userId,
        },
      },
      data: {
        status: input.toStatus,
      },
    });

    return updated;
  });

const deleteMedia = privateProcedure
  .input(
    z.object({
      id: z.number(),
      fromStatus: z.enum([
        Status.WATCHING,
        Status.WANT_TO_WATCH,
        Status.WATCHED,
      ]),
    })
  )
  .mutation(async ({ ctx, input }) => {
    await ctx.prisma.userMedia.delete({
      where: {
        userId_mediaId: {
          mediaId: input.id,
          userId: ctx.userId,
        },
      },
    });

    return true;
  });

const search = privateProcedure
  .input(z.object({ text: z.string() }))
  .query(async ({ input }) => {
    if (input.text) {
      // return axios.get(buildSearchUrl(input.text)).then((res) => {
      //   return transformSearchResult(res.data);
      // });

      const mockFilePath = `${process.env.PWD}/src/mock/tv-search.json`;

      return readFile(mockFilePath).then((data) => {
        return transformSearchResult(JSON.parse(data.toString())).slice(0, 5);
      });
    }

    return [];
  });

const addMedia = privateProcedure
  .input(
    z.object({
      id: z.number(),
      // TODO: is there a way to generate this enum programmatically?
      status: z.enum([Status.WATCHING, Status.WANT_TO_WATCH, Status.WATCHED]),
      title: z.string(),
      posterPath: z.string(),
      genres: z.array(
        z.object({
          id: z.number(),
          name: z.string(),
        })
      ),
    })
  )
  .mutation(async ({ ctx, input }) => {
    // Check if media exists
    let media = await ctx.prisma.media.findUnique({
      where: {
        id: input.id,
      },
    });

    // If the media doesn't exist in the DB, persist it
    if (!media) {
      media = await ctx.prisma.media.create({
        data: {
          id: input.id,
          title: input.title,
          genres: {
            connectOrCreate: input.genres.map((genre) => ({
              where: { id: genre.id },
              create: { id: genre.id, name: genre.name },
            })),
          },
          posterPath: input.posterPath,
          mediaType: MediaType.MOVIE,
        },
      });
    }

    const res = await ctx.prisma.userMedia.create({
      data: {
        mediaId: media.id,
        userId: ctx.userId,
        order: 0,
        status: input.status,
      },
      include: {
        Media: {
          include: {
            genres: true,
          },
        },
      },
    });

    return res;
  });

export const dashboardRouter = createTRPCRouter({
  search,
  getMedia,
  findMovieById,
  changeCardStatus,
  deleteMedia,
  addMedia,
});
