import { useState } from "react";
import { Color, Icon, List } from "@raycast/api";
import { getNetworkData } from "./NetworkUtils";
import { useInterval } from "usehooks-ts";
import { formatBytes, isObjectEmpty } from "../utils";
import { NetworkMonitorState } from "../Interfaces";

export default function NetworkMonitor() {
  const [state, setState] = useState<NetworkMonitorState>({
    upload: 0,
    download: 0,
    processList: [],
    prevProcess: {},
  });

  const sortFunction = (a: [string, number, number], b: [string, number, number]): number => {
    let minA = Math.min(a[1], a[2]);
    let maxA = Math.max(a[1], a[2]);
    let minB = Math.min(b[1], b[2]);
    let maxB = Math.max(b[1], b[2]);
    if (maxA > maxB) {
      return -1;
    } else if (maxB > maxA) {
      return 1;
    } else if (minA > minB) {
      return -1;
    } else if (minB > minA) {
      return 1;
    } else {
      return 0;
    }
  };
  const getTopProcess = (arr: [string, number, number][]): [string, number, number][] => {
    arr.sort(sortFunction);
    arr = arr.slice(0, 5);
    return arr;
  };

  useInterval(async () => {
    const currProcess: { [key: string]: number[] } = await getNetworkData();
    const prevProcess: { [key: string]: number[] } = state.prevProcess;
    let newUpload: number = 0;
    let newDownload: number = 0;
    let newProcessList: [string, number, number][] = [];
    if (!isObjectEmpty(prevProcess)) {
      for (const key in currProcess) {
        let down = currProcess[key][0] - (key in prevProcess ? prevProcess[key][0] : 0);
        if (down < 0) {
          down = 0;
        }
        let up = currProcess[key][1] - (key in prevProcess ? prevProcess[key][1] : 0);
        if (up < 0) {
          up = 0;
        }
        newDownload += down;
        newUpload += up;
        if (key in prevProcess) {
          newProcessList.push([key, down, up]);
        }
      }
      newProcessList = getTopProcess(newProcessList);
    }
    setState((prevState) => {
      return {
        ...prevState,
        upload: newUpload,
        download: newDownload,
        processList: newProcessList,
        prevProcess: currProcess,
      };
    });
  }, 1000);

  return (
    <>
      <List.Item
        title={`Network`}
        icon={{ source: "connection.png", tintColor: Color.PrimaryText }}
        accessoryTitle={
          state.processList.length
            ? "↓ " + formatBytes(state.download) + "/s ↑ " + formatBytes(state.upload) + " /s"
            : "Loading..."
        }
        detail={
          <List.Item.Detail
            metadata={
              <List.Item.Detail.Metadata>
                <List.Item.Detail.Metadata.Label
                  title="Upload Speed"
                  text={(state.processList.length === 0 ? "0 B" : formatBytes(state.upload)) + "/s"}
                />
                <List.Item.Detail.Metadata.Label
                  title="Download Speed"
                  text={(state.processList.length === 0 ? "0 B" : formatBytes(state.download)) + "/s"}
                />
                <List.Item.Detail.Metadata.Separator />
                <List.Item.Detail.Metadata.Label title="Process Name" />
                {state.processList &&
                  state.processList.map((value, index) => {
                    return (
                      <List.Item.Detail.Metadata.Label
                        key={index}
                        title={index + 1 + ".    " + value[0]}
                        text={"↓ " + formatBytes(value[1]) + "/s   ↑ " + formatBytes(value[2]) + " /s"}
                      />
                    );
                  })}
              </List.Item.Detail.Metadata>
            }
          />
        }
      />
    </>
  );
}
