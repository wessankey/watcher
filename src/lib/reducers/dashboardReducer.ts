import { Genre, Media, Status, UserMedia } from "@prisma/client";

export const ActionType = {
  ADD_CARD: "ADD_CARD",
  REMOVE_CARD: "REMOVE_CARD",
  CHANGE_CARD_STATUS: "CHANGE_CARD_STATUS",
  MOVE_CARD: "MOVE_CARD",
  HYDRATE_FROM_DB: "HYDRATE_FROM_DB",
} as const;

type TAction =
  | {
      type: typeof ActionType.ADD_CARD;
    }
  | {
      type: typeof ActionType.REMOVE_CARD;
      cardId: number;
    }
  | {
      type: typeof ActionType.CHANGE_CARD_STATUS;
      movedCardId: number;
      fromLaneId: string;
      toLaneId: string;
    }
  | {
      type: typeof ActionType.MOVE_CARD;
    }
  | {
      type: typeof ActionType.HYDRATE_FROM_DB;
      data: (UserMedia & { Media: Media & { genres: Genre[] } })[];
    };

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

export const DEFAULT_STATE: TDashboardState = {
  WANT_TO_WATCH: {
    id: Status.WANT_TO_WATCH,
    name: "Want to watch",
    cards: [],
  },
  WATCHING: {
    id: Status.WATCHING,
    name: "Watching",
    cards: [],
  },
  WATCHED: {
    id: Status.WATCHED,
    name: "Watched",
    cards: [],
  },
};

export const reducer = (
  state: Record<string, TLane>,
  action: TAction
): Record<string, TLane> => {
  switch (action.type) {
    case ActionType.HYDRATE_FROM_DB: {
      const updatedState = { ...DEFAULT_STATE };

      const transformedData: TMedia[] = action.data.map((userMedia) => {
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

      updatedState.WANT_TO_WATCH.cards = transformedData.filter(
        (c) => c.status === Status.WANT_TO_WATCH
      );

      updatedState.WATCHING.cards = transformedData.filter(
        (c) => c.status === Status.WATCHING
      );

      updatedState.WATCHED.cards = transformedData.filter(
        (c) => c.status === Status.WATCHED
      );

      return updatedState;
    }
    case ActionType.ADD_CARD:
      return state;
    case ActionType.REMOVE_CARD: {
      return {
        ...state,
      };
    }
    case ActionType.CHANGE_CARD_STATUS:
      const { movedCardId, fromLaneId, toLaneId } = action;

      const fromLane = state[fromLaneId];
      const toLane = state[toLaneId];
      const movedCard = fromLane?.cards.find((card) => card.id === movedCardId);

      if (!fromLane || !toLane || !movedCard) return state;

      const updatedToLaneCards = [...toLane.cards, movedCard];
      const updatedFromLaneCards = fromLane.cards.filter(
        (card) => card.id !== movedCardId
      );

      return {
        ...state,
        [toLaneId]: {
          ...toLane,
          cards: updatedToLaneCards,
        },
        [fromLaneId]: {
          ...fromLane,
          cards: updatedFromLaneCards,
        },
      };
    case ActionType.MOVE_CARD:
      return state;
    default:
      return state;
  }
};
