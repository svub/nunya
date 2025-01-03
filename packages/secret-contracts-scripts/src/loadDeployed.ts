import { readFile, writeFile } from "fs/promises";
import * as path from 'path';
// https://flaviocopes.com/fix-dirname-not-defined-es-module-scope/
import { fileURLToPath } from 'url';

// replicate the functionality of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.resolve(__dirname, '../../../deployed.json');
// console.log('File path:', filePath);

async function loadDeployed () {
  try {
    const rawData = await readFile(filePath);
    if (!rawData.length) {
      console.error("Empty file");
      process.exit()
    }
    let jsonData: any = JSON.parse(rawData.toString());
    // console.log('jsonData: ', jsonData);

    return jsonData;
  } catch (err) {
    console.error(err);
  }
}

export {
  loadDeployed
}
