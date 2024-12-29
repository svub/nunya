import { readFile, writeFile } from "fs/promises";
import * as path from 'path';

const filePath = path.resolve(__dirname, '../../../deployed.json');
console.log('File path:', filePath);

async function loadDeployed () {
  try {
    const rawData = await readFile(filePath);
    if (!rawData.length) {
      console.log("empty file");
      process.exit()
    }
    const jsonData: any = JSON.parse(rawData.toString());
    console.log('jsonData: ', jsonData);

    return jsonData;
  } catch (err) {
    console.log(err);
  }
}

export {
  loadDeployed
}
