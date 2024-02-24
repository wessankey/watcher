import { Genre, Show, Status, UserShow } from "@prisma/client";
import { produce } from "immer";
import { TShow } from "../types";

export const ActionType = {
  ADD_SHOW: "ADD_SHOW",
  MOVE_SHOW: "MOVE_SHOW",
  DELETE_SHOW: "DELETE_SHOW",
  HYDRATE_FROM_DB: "HYDRATE_FROM_DB",
} as const;

export type TLane = {
  id: string;
  name: string;
  cards: TShow[];
};

type TDashboardState = {
  WANT_TO_WATCH: TLane;
  WATCHING: TLane;
  WATCHED: TLane;
};

type TAction =
  | {
      type: typeof ActionType.ADD_SHOW;
      payload: Pick<TShow, "id" | "title" | "posterPath" | "genres"> & {
        status: Status;
      };
    }
  | {
      type: typeof ActionType.MOVE_SHOW;
      payload: {
        showId: number;
        fromStatus: Status;
        toStatus: Status;
      };
    }
  | {
      type: typeof ActionType.DELETE_SHOW;
      payload: {
        showId: number;
        fromStatus: Status;
      };
    }
  | {
      type: typeof ActionType.HYDRATE_FROM_DB;
      payload: {
        data: (UserShow & {
          Show: Show & {
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
        const transformedData: TShow[] = data.map((userMedia) => {
          return {
            id: userMedia.Show.id,
            title: userMedia.Show.title,
            posterPath: userMedia.Show.posterPath,
            genres: userMedia.Show.genres,
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
    case ActionType.ADD_SHOW: {
      const { id, genres, posterPath, status, title } = action.payload;

      return produce(state, (draft) => {
        const newCard: TShow = {
          id,
          genres,
          posterPath,
          status,
          title,
          order: draft[status].cards.length - 1,
        };

        draft[status].cards = [...draft[status].cards, newCard];
      });
    }
    case ActionType.MOVE_SHOW: {
      const { showId, fromStatus, toStatus } = action.payload;

      return produce(state, (draft) => {
        const cardToMove = draft[fromStatus].cards.find((c) => c.id === showId);

        if (!cardToMove) return;

        draft[fromStatus].cards = draft[fromStatus].cards.filter(
          (c) => c.id !== showId
        );

        const toStatusCards = draft[toStatus].cards || [];
        draft[toStatus].cards = [
          ...toStatusCards,
          { ...cardToMove, status: toStatus },
        ];
      });
    }
    case ActionType.DELETE_SHOW: {
      const { showId, fromStatus } = action.payload;

      return produce(state, (draft) => {
        draft[fromStatus].cards = draft[fromStatus].cards.filter(
          (c) => c.id !== showId
        );
      });
    }
  }
};
