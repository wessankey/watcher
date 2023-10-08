import { Genre, Media, Status, UserMedia } from "@prisma/client";
import { produce } from "immer";

export const ActionType = {
  ADD_MOVIE: "ADD_MOVIE",
  MOVE_MOVIE: "MOVE_MOVIE",
  DELETE_MOVIE: "DELETE_MOVIE",
  HYDRATE_FROM_DB: "HYDRATE_FROM_DB",
} as const;

export type TMedia = Pick<Media, "id" | "title" | "mediaType" | "posterPath"> &
  Pick<UserMedia, "order" | "status"> & { genres: Genre[] };

export type TLane = {
  id: string;
  name: string;
  cards: TMedia[];
};

type TDashboardState = {
  WANT_TO_WATCH: TLane;
  WATCHING: TLane;
  WATCHED: TLane;
};

type TAction =
  | {
      type: typeof ActionType.ADD_MOVIE;
      payload: Pick<
        TMedia,
        "id" | "title" | "mediaType" | "posterPath" | "genres"
      > & {
        status: Status;
      };
    }
  | {
      type: typeof ActionType.MOVE_MOVIE;
      payload: {
        movieId: number;
        fromStatus: Status;
        toStatus: Status;
      };
    }
  | {
      type: typeof ActionType.DELETE_MOVIE;
      payload: {
        movieId: number;
        fromStatus: Status;
      };
    }
  | {
      type: typeof ActionType.HYDRATE_FROM_DB;
      payload: {
        data: (UserMedia & {
          Media: Media & {
            genres: Genre[];
          };
        })[];
      };
    };

export const reducer = (
  state: TDashboardState,
  action: TAction
): TDashboardState => {
  switch (action.type) {
    case ActionType.HYDRATE_FROM_DB: {
      const { data } = action.payload;

      return produce(state, (draft) => {
        const transformedData: TMedia[] = data.map((userMedia) => {
          return {
            id: userMedia.Media.id,
            title: userMedia.Media.title,
            mediaType: userMedia.Media.mediaType,
            posterPath: userMedia.Media.posterPath,
            genres: userMedia.Media.genres,
            status: userMedia.status,
            order: userMedia.order,
          };
        });

        draft.WANT_TO_WATCH.cards = transformedData.filter(
          (c) => c.status === Status.WANT_TO_WATCH
        );

        draft.WATCHING.cards = transformedData.filter(
          (c) => c.status === Status.WATCHING
        );

        draft.WATCHED.cards = transformedData.filter(
          (c) => c.status === Status.WATCHED
        );
      });
    }
    case ActionType.ADD_MOVIE: {
      const { id, genres, mediaType, posterPath, status, title } =
        action.payload;

      return produce(state, (draft) => {
        const newCard: TMedia = {
          id,
          genres,
          mediaType,
          posterPath,
          status,
          title,
          order: draft[status].cards.length - 1,
        };

        draft[status].cards = [...draft[status].cards, newCard];
      });
    }
    case ActionType.MOVE_MOVIE: {
      const { movieId, fromStatus, toStatus } = action.payload;

      return produce(state, (draft) => {
        const cardToMove = draft[fromStatus].cards.find(
          (c) => c.id === movieId
        );

        if (!cardToMove) return;

        draft[fromStatus].cards = draft[fromStatus].cards.filter(
          (c) => c.id !== movieId
        );

        const toStatusCards = draft[toStatus].cards || [];
        draft[toStatus].cards = [
          ...toStatusCards,
          { ...cardToMove, status: toStatus },
        ];
      });
    }
    case ActionType.DELETE_MOVIE: {
      const { movieId, fromStatus } = action.payload;

      return produce(state, (draft) => {
        draft[fromStatus].cards = draft[fromStatus].cards.filter(
          (c) => c.id !== movieId
        );
      });
    }
  }
};
