import { Action, ActionPanel, Icon, List } from "@raycast/api";
import { useFetch } from "@raycast/utils";
import { useCallback, useEffect, useState } from "react";

interface Extension {
  title: string;
  description: string;
  download_count: number;
  readme_url: string;
  icons: {
    light?: string;
    dark?: string;
  };
  store_url: string;
  source_url: string;
  commands?: {
    title: string;
    description: string;
    icons: {
      light?: string;
      dark?: string;
    };
  }[];
}

interface ApiResponse {
  data: Extension[];
  total_results: number;
}

export default function Command() {
  const [page, setPage] = useState(1);
  const [allData, setAllData] = useState<Extension[]>([]);
  const { data, isLoading } = useFetch<ApiResponse>(
    `https://www.raycast.com/frontend_api/extensions/recently_added?page=${page}`,
    { keepPreviousData: true },
  );

  const updateAllData = useCallback((newData: Extension[]) => {
    setAllData((prevData) => {
      return [...prevData, ...newData].filter(
        (item, index, self) => index === self.findIndex((t) => t.title === item.title),
      );
    });
  }, []);

  useEffect(() => {
    if (data?.data) {
      updateAllData(data.data);
    }
  }, [data, updateAllData]);

  const handleSelectionChange = (id: string | null) => {
    if (!id) {
      return;
    }
    if (allData.length >= (data?.total_results || 0)) {
      return;
    }
    const selectedIndex = parseInt(id, 10);
    if (selectedIndex + 2 > allData.length) {
      setPage((prevPage) => prevPage + 1);
    }
  };

  return (
    <List isLoading={isLoading} onSelectionChange={handleSelectionChange} isShowingDetail>
      {allData.map((item, index) => (
        <List.Item
          id={index.toString()}
          icon={item.icons.light || item.icons.dark}
          key={`${item.title}-${index}`}
          title={item.title}
          detail={
            <List.Item.Detail
              markdown={item.description}
              metadata={
                <List.Item.Detail.Metadata>
                  <List.Item.Detail.Metadata.Label
                    key="Download"
                    title="Download"
                    icon={Icon.Download}
                    text={(item.download_count || 0).toString()}
                  />
                  <List.Item.Detail.Metadata.Separator />
                  <List.Item.Detail.Metadata.Label key="Command" title="Command" />
                  {(item.commands || []).map((command) => (
                    <List.Item.Detail.Metadata.Label
                      key={command.title}
                      title={command.title}
                      icon={command.icons.light || command.icons.dark || item.icons.light || item.icons.dark}
                      text={command.description}
                    />
                  ))}
                </List.Item.Detail.Metadata>
              }
            />
          }
          actions={
            <ActionPanel>
              <Action.OpenInBrowser title="Open on Raycast Store" url={item.store_url} />
              <Action.OpenInBrowser title="Open on GitHub" url={item.source_url} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}
