import axios from "axios";
import fs from "fs";
import { z } from "zod";

import { MediaType, Status } from "@prisma/client";
import {
  createTRPCRouter,
  privateProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export type TSearchResult = {
  id: number;
  title: string;
  overview: string;
  posterPath: string;
};

type TMediaResult = {
  id: number;
  title: string;
  genres: { id: number; name: string }[];
  posterPath: string;
};

const buildSearchUrl = (text: string) => {
  const url = `${process.env.NEXT_PUBLIC_MOVIEDB_URL}/search/movie`;
  const apiSegment = `?api_key=${process.env.NEXT_PUBLIC_MOVIEDB_API_KEY}`;
  const querySegment = `&query=${encodeURIComponent(text)}`;

  return `${url}${apiSegment}${querySegment}`;
};

const buildGetMovieByIdUrl = (id: number) => {
  const url = `${process.env.NEXT_PUBLIC_MOVIEDB_URL}/movie/${id}`;
  const apiSegment = `?api_key=${process.env.NEXT_PUBLIC_MOVIEDB_API_KEY}`;

  return `${url}${apiSegment}`;
};

const transformSearchResult = (data: any): TSearchResult[] => {
  return data.results.map((searchResult) => ({
    id: searchResult.id,
    title: searchResult.title,
    overview: searchResult.overview,
    posterPath: searchResult.poster_path,
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

const getMediaById = async (id: number): Promise<TMediaResult> => {
  return axios.get(buildGetMovieByIdUrl(id)).then((res) => {
    return {
      id: res.data.id,
      title: res.data.title,
      genres: res.data.genres,
      last_updated: new Date(),
      posterPath: res.data.poster_path,
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
  //     };
  //   });
};

export const dashboardRouter = createTRPCRouter({
  search: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(async ({ input }) => {
      if (input.text) {
        return axios.get(buildSearchUrl(input.text)).then((res) => {
          return transformSearchResult(res.data);
        });

        // const mockFilePath = `${process.env.PWD}/src/mock/search.json`;

        // return readFile(mockFilePath).then((data) => {
        //   return transformSearchResult(JSON.parse(data.toString())).slice(0, 5);
        // });
      }

      return [];
    }),
  getMedia: privateProcedure.query(async ({ ctx }) => {
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
  }),
  changeCardStatus: privateProcedure
    .input(
      z.object({
        mediaId: z.number(),
        status: z.enum([Status.WATCHING, Status.WANT_TO_WATCH, Status.WATCHED]),
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
          status: input.status,
        },
      });

      return updated;
    }),

  deleteMedia: privateProcedure
    .input(z.object({ id: z.number() }))
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
    }),

  addMedia: privateProcedure
    .input(
      z.object({
        id: z.number(),
        // TODO: is there a way to generate this enum programmatically?
        status: z.enum([Status.WATCHING, Status.WANT_TO_WATCH, Status.WATCHED]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if media exists
      let media = await ctx.prisma.media.findUnique({
        where: {
          id: input.id,
        },
      });

      // If the media doesn't exist in the DB, pull it from the API and persist it
      if (!media) {
        const mediaData = await getMediaById(input.id);

        media = await ctx.prisma.media.create({
          data: {
            id: mediaData.id,
            title: mediaData.title,
            genres: {
              connectOrCreate: mediaData.genres.map((genre) => ({
                where: { id: genre.id },
                create: { id: genre.id, name: genre.name, tagColor: "orange" },
              })),
            },
            posterPath: mediaData.posterPath,
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
    }),
});
