type EnemyIdleMonoBehaviour = AssetMonoBehaviour<EnemyIdle>;

interface EnemyIdle {
	Duration: number;
	FPS:      number;
	Loop:     0 | 1;
	Sprites:  AssetSource[];
}
