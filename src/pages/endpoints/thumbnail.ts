import {
  id,
} from "@/lib/server/schema/id";

import type {
  audio,
} from "@/lib/server/types/audio";

import {
  audio_get_file_path_thumbnail,
  audio_thumbnail_sizes,
} from "@/lib/server/types/audio";

import type {
  APIRoute,
} from "astro";

import {
  z,
} from "astro:schema";

import {
  s3,
} from "bun";

export const GET: APIRoute =
  //
  async ({
    url,

    locals,
  }) => {
    let params;

    try {
      params =
        //
        z
          //
          .object({
            id,

            size:
              //
              z.enum(audio_thumbnail_sizes),
          })
          //
          .parse(
            //
            Object.fromEntries(
              //
              new URL(url).searchParams.entries(),
            ),
          );
    } catch (e) {
      return new Response(
        //
        null,
        //
        {
          status: 400,
        },
      );
    }

    const audio =
      //
      locals.context.database
        //
        .query(`
          select

            kind,

            has_thumbnail

          from 

            audio

          where 

            id = ?1;
        `)
        //
        .get(params.id) as
          | Pick<
            //
            audio,
            //
            | "kind"
            //
            | "has_thumbnail"
          >
          | null;

    if (audio?.has_thumbnail !== 1) {
      return (
        new Response(
          //
          null,
          //
          {
            status: 404,
          },
        )
      );
    }

    switch (audio.kind) {
      case 0:
        return serve_local_thumbnail(params.id, params.size);

      case 1:
        return serve_remote_thumbnail(params.id, params.size);

      default:
        throw new Error("unreachable");
    }
  };

function serve_local_thumbnail(
  //
  id:
    //
    string,
  //
  size:
    //
    typeof audio_thumbnail_sizes[number],
): Response {
  const path =
    //
    audio_get_file_path_thumbnail(
      //
      { id },
      //
      size,
    );

  return (
    new Response(
      //
      Bun.file(path),
      //
      {
        headers:
          //
          {
            "content-type":
              //
              "image/avif",

            "cache-control":
              //
              "public, max-age=31536000, immutable",
          },
      },
    )
  );
}

function serve_remote_thumbnail(
  //
  id:
    //
    string,
  //
  size:
    //
    typeof audio_thumbnail_sizes[number],
): Response {
  return new Response(s3.file(`${id}-${size}.avif`));
}
