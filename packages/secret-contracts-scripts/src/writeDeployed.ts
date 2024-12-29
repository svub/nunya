import { readFile, writeFile } from "fs/promises";
import * as path from 'path';
// https://flaviocopes.com/fix-dirname-not-defined-es-module-scope/
import { fileURLToPath } from 'url';

// replicate the functionality of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const filePath = path.resolve(__dirname, '../../../deployed.json');
// console.log('File path:', filePath);

async function writeDeployed (newDeployed: any) {
  try {
    let newJsonData = JSON.stringify(newDeployed, null, 2);

    await writeFile(filePath, newJsonData, { flag: 'w+' });
    console.log("Updated deployed.json");
  } catch (err) {
    console.error(err);
  }
}

export {
  writeDeployed
}
