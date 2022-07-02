import { exec } from "child_process";
import { promisify } from "util";
import { ExecError } from "../Interfaces";

const execp = promisify(exec);

const getTopRamProcess = async () => {
  try {
    const output = await execp("/usr/bin/top -l 1 -o mem -n 5 -stats command,mem");
    let processList = output.stdout.trim().split("\n").slice(12, 17);
    processList.forEach((value, index) => {
      processList[index] = value.trim().split(" ");
      processList[index] = [processList[index].slice(0, -1).join(" "), processList[index].at(-1).slice(0, -1) + " MB"];
    });
    return processList;
  } catch (err) {
    const execErr = err as ExecError;
    if (execErr?.code === 1) {
      console.log(execErr.stderr);
      return [];
    } else {
      console.log(`${err}`);
      return [];
    }
  }
};

export { getTopRamProcess };
