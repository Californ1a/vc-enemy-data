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

async function loadYamlFile<T>(filePath: string) {
	try {
		const file = Bun.file(filePath);
		const content = await file.text();
		const data = Bun.YAML.parse(content) as T;
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

async function loadMetaGuids(mbPath: string) {
	const files = await loadProjectFiles(mbPath, true);
	const filteredFiles = files.filter(file => file.endsWith('.meta'));
	if (!filteredFiles || filteredFiles.length === 0) {
		throw new Error('No EnemyConfig files found');
	}

	const metaGuids: Record<string, string> = {};
	for (const file of filteredFiles) {
		try {
			const data = await loadYamlFile<AssetMeta>(path.join(mbPath, file));
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

async function loadSaveFile() {
	let SAVE_PATH = process.env.SAVE_PATH;
	const SAVE_SLOT = process.env.SAVE_SLOT || '0';
	if (!SAVE_PATH && process.env.APPDATA) {
		SAVE_PATH = path.join(process.env.APPDATA, 'LocalLow/Nosebleed Interactive/Vampire Crawlers/Save');
	}
	if (!SAVE_PATH) {
		throw new Error('Missing SAVE_PATH environment variable');
	}

	const SaveFilePath = path.join(SAVE_PATH, `SaveProfile${SAVE_SLOT}.save`);

	const saveFile = Bun.file(SaveFilePath);
	try {
		const save = await saveFile.json() as SaveFile;
		if (!save) {
			throw new Error('Failed to read save file');
		}
		return save;
	} catch (error) {
		throw new Error('Failed to read save file');
	}
}

async function loadMonoBehaviours<T extends AssetMonoBehaviour>(prefix: string, mbPath: string) {
	const files = await loadProjectFiles(mbPath);
	const filteredFiles = files.filter(file => file.startsWith(prefix+'_') && file.endsWith('.asset'));
	if (!filteredFiles || filteredFiles.length === 0) {
		throw new Error(`No ${prefix} files found`);
	}

	const assets: Record<string, T['MonoBehaviour']> = {};

	for (const filename of filteredFiles) {
		try {
			const filepath = path.join(mbPath, filename);
			const data = await loadYamlFile<T>(filepath);

			const [name, ext] = filename.split('.');
			if (!name || ext !== 'asset') continue;
			const regex = new RegExp(`^${prefix}_`);
			const id = name.replace(regex, '');

			if (assets[id]) {
				console.warn(`Duplicate ${prefix} ID found: ${id}. Skipping.`);
				continue;
			}
			if (data?.MonoBehaviour) {
				assets[id] = data.MonoBehaviour;
			}
		} catch (error) {
			console.error(`Failed to read file: ${filename}`);
			continue;
		}
	}

	return assets;
}

async function syncData(enemyName?: string, csv?: boolean) {
	const assetsPath = getAssetsPath();
	const mbPath = path.join(assetsPath, 'MonoBehaviour');
	const enemyConfigs = await loadMonoBehaviours<EnemyConfigMonoBehaviour>('EnemyConfig', mbPath);
	const guids = await loadMetaGuids(assetsPath);
	const saveFile = await loadSaveFile();

	const allTimeMetrics = saveFile.Data.MetricsSaveData.collectionData.find(c => c.collectionID === 0);
	const killedEnemies = allTimeMetrics?.dictionarySaveData.longMetrics.filter(m => m.ID.startsWith('EnemyConfig_') && m.ID.endsWith('_Killed')) || [];
	const killedEnemyIds = killedEnemies.map(m => m.ID.replace(/^EnemyConfig_/, '').replace(/_Killed$/, '')).sort();

	const sortedIds = Object.keys(enemyConfigs).sort();

	function getGuids(ids: AssetSource[] | AssetSource): string[] | string {
		if (!ids) return [];
		if (!Array.isArray(ids)) {
			if (typeof ids.guid !== 'string') return '';
			const guid = guids[ids.guid];
			if (typeof guid !== 'string') return '';
			return guid;
		}
		return ids.map(tag => {
				if (!tag.guid) return false;
				if (!guids[tag.guid]) return false;
				return guids[tag.guid]
			}).filter<string>(guid => typeof guid === 'string');
	}

	const formattedEnemyList = [];
	const idleAnims = await loadMonoBehaviours<EnemyIdleMonoBehaviour>('Anim_EnemyIdle', mbPath);
	// console.log(idleAnims);
	// console.log(guids);
	for (const id of sortedIds) {
		const config = enemyConfigs[id];
		if (!config) continue;

		const IdleAnimation = getGuids(config._idleAnimation);
		let SpriteTexture = '';
		if (Array.isArray(IdleAnimation)) {
			console.warn(`Multiple idle animations found for ${config.m_Name}`);
		} else if (IdleAnimation) {
			const enemyIdleName = IdleAnimation.replace(/^MonoBehaviour\\Anim_EnemyIdle_/, '');
			const idleAnim = idleAnims[enemyIdleName];
			if (idleAnim && idleAnim.Sprites) {
				const sprites = getGuids(idleAnim.Sprites);
				if (Array.isArray(sprites)) {
					const initialSprite = sprites[0];
					if (initialSprite) {
						SpriteTexture = initialSprite.replace(/^Texture2D\\/, '');
					}
				}
			}
		}

		let DungeonTags = getGuids(config._dungeonTags);
		let EnemyTypeTags = getGuids(config._enemyTypeTags);
		if (Array.isArray(DungeonTags)) {
			DungeonTags = DungeonTags.map(t => t.replace(/^MonoBehaviour\\/, ''));
		}
		if (Array.isArray(EnemyTypeTags)) {
			EnemyTypeTags = EnemyTypeTags.map(t => t.replace(/^MonoBehaviour\\/, ''));
		}

		const enemyData = {
			// Default fields
			m_Name: config.m_Name,
			BaseHealth: config.BaseHealth,
			LevelScaleMultiplier: config.LevelScaleMultiplier,
			Xp: config.Xp,
			KnockbackResistance: config.KnockbackResistance,
			DisarmResistance: config.DisarmResistance,
			EnemyDifficulty: config.EnemyDifficulty,
			InstakillResist: config.InstakillResist,
			IsBoss: config.IsBoss,
			PossibleChestTiers: config.PossibleChestTiers,
			_maxHit: config._maxHit,
			_maxArmor: config._maxArmor,
			_woundChance: config._woundChance,
			_totalChance: config._totalChance,
			
			// Csutom fields
			DungeonTags,
			EnemyTypeTags,
			AssetId: config['<AssetId>k__BackingField'],
			SpriteTexture,
			KillData: {} as Metric,

			// Extra defaults
			AllowInTemplate: config.AllowInTemplate,
			OutlineColor: config.OutlineColor,
			DebugId: config.DebugId,
		};
		const name = config.m_Name.replace(/^EnemyConfig_/, '');
		const backingName = config['<AssetId>k__BackingField'].replace(/^EnemyConfig_/, '');
		
		if (killedEnemyIds.includes(name) || killedEnemyIds.includes(backingName)) {
			enemyData.KillData = killedEnemies.find(m => m.ID === `EnemyConfig_${name}_Killed` || m.ID === `EnemyConfig_${backingName}_Killed`) || { ID: '', Value: 0 };
		}

		formattedEnemyList.push(enemyData);
	}

	if (enemyName) {
		enemyName = (enemyName.match(/^EnemyConfig_/)) ? enemyName : `EnemyConfig_${enemyName}`;
		const found = formattedEnemyList.find(e => e.m_Name === enemyName || e.m_Name === enemyName?.replace(/^EnemyConfig_/, ''));
		if (found) {
			const dungeonLinks = (Array.isArray(found.DungeonTags)) ? found.DungeonTags.map(t => {
				const dungeon = t.replace(/^DungeonConfig_/, '')
					.replace(/(?<=[a-z])([A-Z])/g, ' $1')
					.replace('Tiny Bridge_0', 'Teeny Bridge');
				return `[[Crawlers:${dungeon}|${dungeon}]]`;
			}).join(', ') : '';
			const template =
			`{{Infobox VC Enemy
			|name = ${found.m_Name.replace(/^EnemyConfig_/, '')}
			|image = 
			|release = 21 April 2026
			|update = Vampire Crawlers, the first-ever Vampire Survivors spin-off, is here!
			|hp = ${found.BaseHealth}
			|levelscale = ${found.LevelScaleMultiplier}
			|xp = ${found.Xp}
			|knockbackresist = ${found.KnockbackResistance}
			|disarmresist = ${found.DisarmResistance}
			|difficulty = ${found.EnemyDifficulty}
			|instakillresist = ${found.InstakillResist}
			|boss = ${found.IsBoss === 1 ? 'Yes' : 'No'}
			|chesttier = ${found.PossibleChestTiers}
			|maxhit = ${found._maxHit}
			|maxarmor = ${found._maxArmor}
			|woundchance = ${found._woundChance}
			|totalchance = ${found._totalChance}
			|types = ${(Array.isArray(found.EnemyTypeTags)) ? found.EnemyTypeTags.map(t => t?.replace(/^EnemyType_/, '')).join(', ') : ''}
			|dungeons = ${dungeonLinks}
			}}`.replace(/\t/g, '');
	
			console.log(template);
		} else {
			console.log(`Could not find ${enemyName}`);
		}
	}

	if (csv) {
		if (!formattedEnemyList[0]) return;
		const csvHeader = Object.keys(formattedEnemyList[0]).join(',');
		const csvStr = csvHeader + '\n' + formattedEnemyList.map(row => {
			const values = [];
			for (const val of Object.values(row)) {
				if (typeof val === 'string') {
					values.push(`"${val.replace(/^EnemyConfig_/, '').replace(/"/g, '""')}"`);
				} else if (typeof val === 'number') {
					values.push(`"${val.toString()}"`);
				} else if (typeof val === 'object') {
					values.push(`"${JSON.stringify(val).replace(/"/g, '""')}"`);
				} else {
					values.push('"--UNKNOWN--"');
				}
			}
			return values.join(',');
		}).join('\n');
		const filePath = path.join(__dirname, 'output', 'enemies.csv');
		await Bun.write(filePath, csvStr);
	
		console.log(`Wrote ${formattedEnemyList.length} enemies to ${filePath}`);
	}
}

const { values } = parseArgs({
  args: Bun.argv,
  options: {
    enemy: {
      type: "string",
    },
		csv: {
      type: "boolean",
    },
  },
  strict: true,
	allowPositionals: true,
});

syncData(values.enemy, values.csv);
