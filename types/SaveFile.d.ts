interface SaveFile {
	Version:  number;
	Checksum: string;
	Data:     SaveData;
}

interface SaveData {
	ProfileId:           string;
	saveSystemVersion:   string;
	BuildSKU:            number;
	GameSaveData:        GameSaveData;
	ProfileSaveData:     ProfileSaveData;
	RunMetaSaveData:     RunMetaSaveData;
	ProgressionSaveData: ProgressionSaveData;
	MetricsSaveData:     MetricsSaveData;
}

interface GameSaveData {
	ProfileId:   string;
	SaveObjects: any[];
}

interface MetricsSaveData {
	collectionData: CollectionDatum[];
}

interface CollectionDatum {
	collectionID:       number;
	dictionarySaveData: DictionarySaveData;
}

interface DictionarySaveData {
	doubleMetrics: Metric[];
	longMetrics:   Metric[];
}

interface Metric {
	ID:    string;
	Value: number;
}

interface ProfileSaveData {
	ProfileId:       string;
	CurrentState:    number;
	TotalCoins:      number;
	MainCharacterId: string;
	SaveTimeStamp:   Date;
	PlayTime:        string;
	SaveSlotIdx:     number;
}

interface ProgressionSaveData {
	IsTutorialComplete:         boolean;
	IsWildCardTutorialComplete: boolean;
	TotalCoins:                 number;
	ChestsSpawned:              number;
	CharactersPurchased:        AchievementsUnlocked[];
	PowerUpLevelsUnlocked:      CardGemSlot[];
	PowerUpEnabled:             AchievementsUnlocked[];
	AchievementsUnlocked:       AchievementsUnlocked[];
	DiscoveredCards:            string[];
	BuildingsVisited:           AchievementsUnlocked[];
	DungeonsVisited:            AchievementsUnlocked[];
	CardGemSlots:               CardGemSlot[];
	GemFrequencies:             CardGemSlot[];
	SealedGems:                 any[];
	UnlocksHideCompleted:       boolean;
}

interface AchievementsUnlocked {
	Key:   string;
	Value: boolean;
}

interface CardGemSlot {
	Key:   string;
	Value: number;
}

interface RunMetaSaveData {
	SelectedDungeonID:   string;
	SelectedPartyFccIds: string[];
	ActiveArcanasIds:    string[];
	EquippedArcanaIds:   string[];
	EnabledRelics:       AchievementsUnlocked[];
	HurryModeActive:     boolean;
}
