import { Genre, Media, Status, UserMedia } from "@prisma/client";

export type TMedia = Pick<Media, "id" | "title" | "mediaType" | "posterPath"> &
  Pick<UserMedia, "order" | "status"> & { genres: Genre[] };
