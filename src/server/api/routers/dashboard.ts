import { z } from "zod";
import axios from "axios";
import fs from "fs";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";

export type TSearchResult = {
  id: number;
  title: string;
  overview: string;
  posterPath: string;
};

const buildSearchUrl = (text: string) => {
  const url = `${process.env.NEXT_PUBLIC_MOVIEDB_URL}/search/movie`;
  const apiSegment = `?api_key=${process.env.NEXT_PUBLIC_MOVIEDB_API_KEY}`;
  const querySegment = `&query=${encodeURIComponent(text)}`;

  return `${url}${apiSegment}${querySegment}`;
};

const transformSearchResult = (data: any): TSearchResult[] => {
  return data.results.map((searchResult) => ({
    id: searchResult.id,
    title: searchResult.title,
    overview: searchResult.overview,
    posterPath: searchResult.poster_path,
  }));
};

function readFile(path: string) {
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

export const dashboardRouter = createTRPCRouter({
  search: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(async ({ input }) => {
      if (input.text) {
        // return axios.get(buildSearchUrl(input.text)).then((res) => {
        //   return transformSearchResult(res.data);
        // });

        const mockFilePath = `${process.env.PWD}/src/mock/search.json`;

        return readFile(mockFilePath).then((data) => {
          return transformSearchResult(JSON.parse(data.toString())).slice(0, 5);
        });
      }

      return [];
    }),
});
