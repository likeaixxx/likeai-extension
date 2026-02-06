import { useState, useEffect } from "react";
import { execSync } from "child_process";
import { confirm as conformApi, lyrics as getLyricsApi, LyricResponseItem } from "./helper/lyrics-api";
import {
  getPreferenceValues,
  showHUD,
  closeMainWindow,
  LaunchProps,
  Detail,
  ActionPanel,
  Action,
  Icon,
  List,
  open,
} from "@raycast/api";

const lyrics_api = getPreferenceValues().lyrics_api || "http://127.0.0.1:8331";

async function getSongInfo() {
  try {
    const script = `
      tell application "Spotify"
        if player state is playing then
          set trackName to name of current track
          set artistName to artist of current track
          set albumName to album of current track
          set trackId to id of current track
          set durationSec to (duration of current track) / 1000
          set positionSec to player position
          set json to "{"
          set json to json & "'track': '" & trackName & "', "
          set json to json & "'trackId': '" & trackId & "', "
          set json to json & "'artist': '" & artistName & "', "
          set json to json & "'album': '" & albumName & "', "
          set json to json & "'duration': " & durationSec & ", "
          set json to json & "'position': " & positionSec
          set json to json & "}"
          return json
        else
          return "{'error': '❌ Spotify is not playing.'}"
        end if
      end tell
    `;
    const result = JSON.parse(
      execSync(`osascript -e '${script.replace(/'/g, "'\\''")}'`)
        .toString()
        .replaceAll("'", '"')
        .trim(),
    );
    if (result && result.error) {
      await showHUD(result.error);
      await closeMainWindow();
    } else {
      console.log(result);
      return result;
    }
  } catch (error) {
    console.log(error);
    await showHUD("❌ Can't get song info from Spotify. Please try again later.");
    await closeMainWindow();
  }
}

// Component to show lyrics for the currently playing song
export default function (props: LaunchProps<{ arguments: Arguments.Refresh }>) {
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
        const result = await getSongInfo();
        if (!result) {
          setError("Failed to get song info.");
          setIsLoading(false);
          return;
        }
        const [songTitle, artistName, albumName, trackId] = [result.track, result.artist, result.album, result.trackId];
        // Set song info
        setSongInfo({
          title: songTitle,
          artist: artistName,
          album: albumName,
        });

        // Now fetch lyrics using the exact same logic from search-lyrics.tsx
        try {
          console.log(`🔍 Searching Genius for: "${songTitle}" by "${artistName}"`);
          getLyricsApi(lyrics_api, {
            name: songTitle,
            singer: artistName,
            id: trackId,
            refresh: refresh,
          }).then((lyrics: LyricResponseItem[]) => {
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
    return (
      <Detail
        markdown={`# Loading lyrics for "${songInfo?.title + "" + songInfo?.artist || "current song"}"...`}
        isLoading
      />
    );
  }

  if (lyrics && lyrics.length === 1) {
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
            <Action.OpenInBrowser
              title="Search Lyrics with Browser"
              url={`https://www.google.com/search?q=${songInfo?.title + " · " + songInfo?.artist}`}
            />
            <Action
              icon={Icon.ArrowClockwise}
              title="Refresh"
              onAction={() =>
                open(
                  `raycast://extensions/like-ai/likeai-extension/findLyrics?arguments=%7B%22refresh%22%3A%22true%22%7D`,
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
                    await conformApi(lyrics_api, { item: lyric });
                    await showHUD("Lyrics confirmed");
                    await open(
                      `raycast://extensions/like-ai/likeai-extension/findLyrics?arguments=%7B%22refresh%22%3A%22%22%7D`,
                    );
                  }}
                />
              )}
              <Action
                icon={Icon.ArrowClockwise}
                title="Refresh"
                onAction={() =>
                  open(
                    `raycast://extensions/like-ai/likeai-extension/findLyrics?arguments=%7B%22refresh%22%3A%22true%22%7D`,
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
