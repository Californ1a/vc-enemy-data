import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { parseArgs } from 'util';

function getAssetsPath() {
	if (!process.env.UNITY_PROJECT_PATH) {
		throw new Error('Missing UNITY_PROJECT_PATH environment variable');
	}
	const AssetsPath = path.join(process.env.UNITY_PROJECT_PATH, 'ExportedProject/Assets');
	return AssetsPath;
}

async function loadYamlFile(filePath: string) {
	try {
		const file = Bun.file(filePath);
		const content = await file.text();
		const data = Bun.YAML.parse(content);
		return data;
	} catch (error) {
		throw new Error(`Failed to read file: ${filePath}`);
	}
}

async function loadProjectFiles(mbPath: string, recursive = false) {
	console.log(`Loading project files from ${mbPath}...`);
	try {
		let files;
		if (recursive) {
			console.log('Reading files recursively...');
			files = await readdir(mbPath, { recursive: true });
		} else {
			console.log('Reading files...');
			files = await readdir(mbPath);
		}
		if (!files) {
			throw new Error('Failed to read files');
		}
		return files;
	} catch (error) {
		console.error(`Failed to read directory: ${mbPath}`);
		throw new Error('Failed to read files');
	}
}

async function loadMetaGuids(mbPath: string, files: string[]) {
	const filteredFiles = files.filter(file => file.endsWith('.meta'));
	if (!filteredFiles || filteredFiles.length === 0) {
		throw new Error('No .meta files found');
	}

	const metaGuids: Record<string, string> = {};
	for (const file of filteredFiles) {
		try {
			const data: any = await loadYamlFile(path.join(mbPath, file));
			const [name] = file.split('.');
			if (!name || !data.guid) continue;
			metaGuids[data.guid] = name;
		} catch (error) {
			console.error(`Failed to read file: ${file}`);
			continue;
		}
	}
	return metaGuids;
}

async function loadMonoBehaviour(mbPath: string, files: string[], name?: string) {
	if (!name) {
		throw new Error('Missing name');
	}
	const filteredFiles = files.filter(file => file.match(name) && file.endsWith('.asset'));
	if (!filteredFiles || filteredFiles.length === 0) {
		throw new Error(`No file with name ${name} found`);
	} else if (filteredFiles.length > 1) {
		console.warn(`Multiple files with name ${name} found, using the first one`);
	}

	const filename = filteredFiles[0];
	if (!filename) {
		throw new Error(`No file with name ${name} found`);
	}
	try {
		const filepath = path.join(mbPath, filename);
		const data: any = await loadYamlFile(filepath);

		const [fname, ext] = filename.split('.');
		if (!fname || ext !== 'asset') return;
		if (data?.MonoBehaviour) {
			return data.MonoBehaviour;
		}
	} catch (error) {
		console.error(`Failed to read file: ${filename}`);
	}
}

const { values } = parseArgs({
	args: Bun.argv,
	options: {
		file: {
			type: "string",
		},
	},
	strict: true,
	allowPositionals: true,
});

const assetsPath = getAssetsPath();
const files = await loadProjectFiles(assetsPath, true);
const metaGuids = await loadMetaGuids(assetsPath, files);
const assetFile = await loadMonoBehaviour(assetsPath, files, values.file);

if (!assetFile || typeof assetFile !== 'object') {
	throw new Error('Failed to load MonoBehaviour asset');
}
for (const key of Object.keys(assetFile)) {
	if (typeof assetFile[key] !== 'object') continue;
	if (assetFile[key]?.guid) {
		const guid = assetFile[key].guid;
		const name = metaGuids[guid];
		if (typeof name === 'string') {
			assetFile[key] = name;
		}
	} else if (Array.isArray(assetFile[key])) {
		assetFile[key] = assetFile[key].map((item: any) => {
			if (typeof item !== 'object') return item;
			if (item?.guid) {
				const guid = item.guid;
				const name = metaGuids[guid];
				if (typeof name === 'string') {
					return name;
				}
			} else {
				// TODO: This should be recursive, but for now we only go one level deep
				for (const subKey of Object.keys(item)) {
					if (typeof item[subKey] !== 'object') continue;
					if (item[subKey]?.guid) {
						const guid = item[subKey].guid;
						const name = metaGuids[guid];
						if (typeof name === 'string') {
							item[subKey] = name;
						}
					}
				}
			}
			return item;
		});
	}
}

console.log(JSON.stringify(assetFile, null, 2));
