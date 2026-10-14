type EnemyConfigMonoBehaviour = AssetMonoBehaviour<EnemyConfig>;

interface EnemyConfig {
	"<AssetId>k__BackingField":  string;
	BaseHealth:                  number;
	LevelScaleMultiplier:        number;
	Xp:                          number;
	KnockbackResistance:         number;
	DisarmResistance:            number;
	AllowInTemplate:             number;
	Prefab:                      AssetSource;
	_idleAnimation:              AssetSource;
	_deathAnimation:             AssetSource;
	_spriteMaterial:             AssetSource;
	_spriteMaterialFar:          AssetSource;
	_enableSeparateShadow:       number;
	EnemyDifficulty:             number;
	InstakillResist:             number;
	IsBoss:                      number;
	PossibleChestTiers:          number;
	OutlineColor:                OutlineColor;
	_dungeonTags:                AssetSource[];
	_enemyTypeTags:              AssetSource[];
	_audioData:                  AssetSource;
	_maxHit:                     number;
	_maxArmor:                   number;
	_woundChance:                number;
	DebugId:                     string;
	_intentLevelScaleMultiplier: number;
	_totalChance:                number;
}

interface OutlineColor {
	r: number;
	g: number;
	b: number;
	a: number;
}
