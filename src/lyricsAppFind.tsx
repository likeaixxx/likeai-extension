import { Action, ActionPanel, Detail, getPreferenceValues, Icon, LaunchProps, List, open, showHUD } from "@raycast/api";
import { useEffect, useState } from "react";
import { lyrics as getLyricsApi, confirm, LyricResponseItem } from "./helpers/lyricsApi";
import { setSpotifyClient } from "./helpers/withSpotifyClient";
import { getCurrentlyPlaying } from "./api/getCurrentlyPlaying";
import { TrackObject } from "./helpers/spotify.api";

const lyrics_api = getPreferenceValues().lyrics_api;

export interface Arg {
  refresh?: string;
}

export default function (props: LaunchProps<{ arguments: Arg }>) {
  const [lyrics, setLyrics] = useState<LyricResponseItem[]>([]);
  const [songInfo, setSongInfo] = useState<{ title: string; artist: string; album?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const refresh = props.arguments.refresh ? Boolean(props.arguments.refresh) : false;

  useEffect(() => {
    const fetchCurrentSongLyrics = async () => {
      try {
        setIsLoading(true);
        setError("");
        // Set up Spotify client
        await setSpotifyClient();
        // Get currently playing track
        const currentlyPlayingData = await getCurrentlyPlaying();
        if (!currentlyPlayingData) {
          setError("Unable to get playback information from Spotify");
          return;
        }
        if (!currentlyPlayingData.item) {
          setError("Nothing is currently playing on Spotify");
          return;
        }
        const { item } = currentlyPlayingData;
        const isTrack = currentlyPlayingData.currently_playing_type !== "episode";
        if (!isTrack) {
          setError("Lyrics are only available for music tracks, not podcasts or episodes");
          return;
        }
        const track = item as TrackObject;
        const songTitle = track.name;
        const artistName = track.artists?.[0]?.name;

        if (!songTitle || !artistName) {
          setError("Could not get song information from the currently playing track");
          return;
        }

        // Set song info
        setSongInfo({
          title: songTitle,
          artist: artistName,
          album: track.album?.name,
        });

        // Try Genius first
        try {
          console.log(`🔍 Searching Genius for: "${songTitle}" by "${artistName}"`);
          getLyricsApi(lyrics_api, {
            name: songTitle,
            singer: artistName,
            id: "spotify:track:" + track.id,
            refresh: refresh,
          }).then((lyrics) => {
            if (lyrics) {
              setLyrics(lyrics);
              console.log("✅ Using Genius lyrics");
            }
          });
        } catch (geniusError) {
          console.log("Genius lyrics not available, trying alternatives...", geniusError);
          const errorMessage =
            geniusError instanceof Error ? geniusError.message : "Failed to fetch lyrics. Please try again.";
          setError(errorMessage);
        }
      } catch (err: unknown) {
        console.error("Error fetching lyrics:", err);
        const errorMessage = err instanceof Error ? err.message : "Failed to fetch lyrics. Please try again.";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentSongLyrics();
  }, []);

  const markdown = (lyrics: string) => {
    lyrics = Buffer.from(lyrics, "base64").toString("utf8");
    if (error) {
      return `# Error\n\n${error}\n\n## Tips:\n- Try searching for a different version of the song\n- Check if the song is available on Genius\n- Some songs may not have lyrics available`;
    }
    if (!lyrics) {
      return `# Loading lyrics for "${songInfo?.title || "current song"}"\n\nPlease wait while we fetch the lyrics...`;
    }
    const formattedLyrics = lyrics
      .split("\n")
      .map((line: string) => line.trim())
      .map((line) => line.replace(/^(\s*\[[0-9:.]+\])+/, "").trim())
      .filter((line: string) => line.length > 0)
      .filter((line: string) => !(line.startsWith("[") && line.endsWith("]")))
      // .map(line => "<p>" + line + "</p")
      .join("\n\n"); // Each line gets double line breaks for proper verse spacing

    return `# ${songInfo?.title}\n\n**Artist:** ${songInfo?.artist}\n\n${songInfo?.album ? `**Album:** ${songInfo.album}\n\n` : ""}---\n\n${formattedLyrics}`;
  };

  if (isLoading || lyrics.length === 0) {
    return <Detail isLoading />;
  }

  if (lyrics.length === 1) {
    const lyric = lyrics[0];
    return (
      <Detail
        navigationTitle={songInfo ? `${songInfo.title} - ${songInfo.artist}` : "Find Lyrics"}
        markdown={markdown(lyric.lyrics)}
        actions={
          <ActionPanel>
            <Action.CopyToClipboard
              title="Copy Lyrics"
              content={markdown(lyric.lyrics)}
              shortcut={{ modifiers: ["cmd"], key: "c" }}
            />
            <Action
              icon={Icon.ArrowClockwise}
              title="Refresh"
              onAction={() =>
                open(
                  `raycast://extensions/mattisssa/spotify-player/lyricsAppFind?arguments=%7B%22refresh%22%3A%22true%22%7D`,
                )
              }
            />
          </ActionPanel>
        }
      />
    );
  }
  return (
    <List isShowingDetail navigationTitle={songInfo ? `${songInfo.title} - ${songInfo.artist}` : "Find Lyrics"}>
      {lyrics.map((lyric) => (
        <List.Item
          key={lyric.sid}
          title={lyric.name}
          subtitle={lyric.singer}
          detail={<List.Item.Detail markdown={markdown(lyric.lyrics)} />}
          actions={
            <ActionPanel>
              {refresh && (
                <Action
                  icon={Icon.Checkmark}
                  title="Confirm"
                  onAction={async () => {
                    await confirm(lyrics_api, { item: lyric });
                    await showHUD("Lyrics confirmed");
                    await open(
                      `raycast://extensions/mattisssa/spotify-player/lyricsAppFind?arguments=%7B%22refresh%22%3A%22%22%7D`,
                    );
                  }}
                />
              )}
              <Action
                icon={Icon.ArrowClockwise}
                title="Refresh"
                onAction={() =>
                  open(
                    `raycast://extensions/mattisssa/spotify-player/lyricsAppFind?arguments=%7B%22refresh%22%3A%22true%22%7D`,
                  )
                }
              />
              <Action.CopyToClipboard
                title="Copy Lyrics"
                content={markdown(lyric.lyrics)}
                shortcut={{ modifiers: ["cmd"], key: "c" }}
              />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
