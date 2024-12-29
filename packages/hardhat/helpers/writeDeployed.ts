import { readFile, writeFile } from "fs/promises";
import * as path from 'path';

const filePath = path.resolve(__dirname, '../../../deployed.json');

async function writeDeployed (newDeployed: any) {
  try {
    const newJsonData = JSON.stringify(newDeployed, null, 2);

    await writeFile(filePath, newJsonData, { flag: 'w+' });
    console.log("Updated deployed.json");
  } catch (err) {
    console.log(err);
  }
}

export {
  writeDeployed
}
