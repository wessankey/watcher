import axios from "axios";
import fs from "fs";
import { z } from "zod";
import { Status } from "@prisma/client";
import { createTRPCRouter, privateProcedure } from "~/server/api/trpc";

type TWatchProvider = {
  name: string;
  logoPath: string;
};

export type TTvSearchResult = {
  id: number;
  name: string;
  overview: string;
  posterPath: string;
};

export type TTvShow = {
  id: number;
  name: string;
  genres: { id: number; name: string }[];
  posterPath: string;
  firstAirDate: string;
  overview: string;
  watchProviders: TWatchProvider[];
};

const buildSearchUrl = (text: string) => {
  const url = `${process.env.NEXT_PUBLIC_MOVIEDB_URL}/search/tv`;
  const apiSegment = `?api_key=${process.env.NEXT_PUBLIC_MOVIEDB_API_KEY}`;
  const querySegment = `&query=${encodeURIComponent(text)}`;

  return `${url}${apiSegment}${querySegment}`;
};

const buildGetShowByIdUrl = (id: number, path?: string) => {
  const url = `${process.env.NEXT_PUBLIC_MOVIEDB_URL}/tv/${id}/${path}`;
  const apiSegment = `?api_key=${process.env.NEXT_PUBLIC_MOVIEDB_API_KEY}`;

  return `${url}${apiSegment}`;
};

const buildGetWatchProvidersUrl = (id: number) => {
  return buildGetShowByIdUrl(id, "watch/providers");
};

const getShow = privateProcedure.query(async ({ ctx }) => {
  return await ctx.prisma.userShow.findMany({
    where: {
      userId: ctx.userId,
    },
    include: {
      Show: {
        include: {
          genres: true,
        },
      },
    },
  });
});

const transformTvSearchResult = (data: any): TTvShow[] => {
  return data.results.map((searchResult: any) => ({
    id: searchResult.id,
    name: searchResult.name,
    genres: "",
    posterPath: searchResult.poster_path,
    firstAirDate: "",
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

const getWatchProviders = async (showId: number): Promise<TWatchProvider[]> => {
  // return axios.get(buildGetWatchProvidersUrl(showId)).then((res) => {
  //   const usProviders = res.data.results["US"];

  //   if (usProviders && "flatrate" in usProviders) {
  //     // @ts-ignore
  //     return usProviders.flatrate.map((provider) => ({
  //       name: provider.provider_name,
  //       logoPath: provider.logo_path,
  //     }));
  //   }

  //   return [];
  // });

  const mockFilePath = `${process.env.PWD}/src/mock/watch-providers.json`;

  return readFile(mockFilePath)
    .then((data) => JSON.parse(data.toString()))
    .then((data) => {
      // @ts-ignore
      return data.results["US"].flatrate.map((provider) => ({
        name: provider.provider_name,
        logoPath: provider.logo_path,
      }));
    });
};

const getTvShowById = async (id: number): Promise<TTvShow> => {
  const watchProviders = await getWatchProviders(id);

  // return axios.get(buildGetMovieByIdUrl(id)).then((res) => {
  //   return {
  //     id: res.data.id,
  //     title: res.data.title,
  //     genres: res.data.genres,
  //     last_updated: new Date(),
  //     posterPath: res.data.poster_path,
  //     runtime: res.data.runtime,
  //     releaseDate: res.data.release_date,
  //     overview: res.data.overview,
  //     watchProviders,
  //   };
  // });

  const mockFilePath = `${process.env.PWD}/src/mock/tv-show.json`;

  return readFile(mockFilePath)
    .then((data) => JSON.parse(data.toString()))
    .then((data) => {
      return {
        id: data.id,
        name: data.name,
        genres: data.genres,
        posterPath: data.poster_path,
        firstAirDate: data.first_air_date,
        overview: data.overview,
        watchProviders,
      };
    });
};

const findTvShowById = privateProcedure
  .input(z.object({ tvShowId: z.number() }))
  .query(async ({ input }) => {
    return await getTvShowById(input.tvShowId);
  });

const changeCardStatus = privateProcedure
  .input(
    z.object({
      showId: z.number(),
      fromStatus: z.enum([
        Status.WATCHING,
        Status.WANT_TO_WATCH,
        Status.WATCHED,
      ]),
      toStatus: z.enum([Status.WATCHING, Status.WANT_TO_WATCH, Status.WATCHED]),
    })
  )
  .mutation(async ({ ctx, input }) => {
    const updated = await ctx.prisma.userShow.update({
      where: {
        userId_showId: {
          showId: input.showId,
          userId: ctx.userId,
        },
      },
      data: {
        status: input.toStatus,
      },
    });

    return updated;
  });

const deleteShow = privateProcedure
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
    await ctx.prisma.userShow.delete({
      where: {
        userId_showId: {
          showId: input.id,
          userId: ctx.userId,
        },
      },
    });

    return true;
  });

const tvShowSearch = privateProcedure
  .input(z.object({ text: z.string() }))
  .query(async ({ input }) => {
    if (input.text) {
      // return axios.get(buildSearchUrl(input.text)).then((res) => {
      //   return transformMovieSearchResult(res.data);
      // });
      const mockFilePath = `${process.env.PWD}/src/mock/tv-search.json`;

      return readFile(mockFilePath).then((data) => {
        return transformTvSearchResult(JSON.parse(data.toString())).slice(0, 5);
      });
    }

    return [];
  });

const addTvShow = privateProcedure
  .input(
    z.object({
      id: z.number(),
      status: z.enum([Status.WATCHING, Status.WANT_TO_WATCH, Status.WATCHED]),
      name: z.string(),
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
    // Check if show exists
    let show = await ctx.prisma.show.findUnique({
      where: {
        id: input.id,
      },
    });

    // If the show doesn't exist in the DB, persist it
    if (!show) {
      show = await ctx.prisma.show.create({
        data: {
          id: input.id,
          title: input.name,
          genres: {
            connectOrCreate: input.genres.map((genre) => ({
              where: { id: genre.id },
              create: { id: genre.id, name: genre.name },
            })),
          },
          posterPath: input.posterPath,
        },
      });
    }

    const res = await ctx.prisma.userShow.create({
      data: {
        showId: show.id,
        userId: ctx.userId,
        order: 0,
        status: input.status,
      },
      include: {
        Show: {
          include: {
            genres: true,
          },
        },
      },
    });

    return res;
  });

export const dashboardRouter = createTRPCRouter({
  tvShowSearch,
  findTvShowById,
  changeCardStatus,
  deleteShow,
  addTvShow,
  getShow,
});
