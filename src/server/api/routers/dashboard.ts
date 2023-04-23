import { z } from "zod";
import axios from "axios";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

type TSearchResult = {
  id: number;
  title: string;
  posterPath: string;
};

const buildSearchUrl = (text: string) => {
  const url = `${process.env.NEXT_PUBLIC_MOVIEDB_URL}/search/movie`;
  const apiSegment = `?api_key=${process.env.NEXT_PUBLIC_MOVIEDB_API_KEY}`;
  const querySegment = `&query=${encodeURIComponent(text)}`;

  return `${url}${apiSegment}${querySegment}`;
};

export const dashboardRouter = createTRPCRouter({
  search: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(async ({ input }) => {
      if (input) {
        return axios.get(buildSearchUrl(input.text)).then((res) => {
          const transformed: TSearchResult[] = res.data.results.map(
            (searchResult) => ({
              id: searchResult.id,
              title: searchResult.title,
              posterPath: searchResult.poster_path,
            })
          );

          return transformed;
        });
      }

      return [];
    }),
});
