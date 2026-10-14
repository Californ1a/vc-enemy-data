# vc-enemy-data

To install dependencies:

```bash
bun install
```

To run:

```bash
# Generate csv for all enemies in ./output/
bun run index.ts --csv

# Create infobox for specific enemy
# Enemy name is everything after `EnemyConfig_`
bun run index.ts --enemy Bat
```

Rename `.env.sameple` to `.env` and fill in the paths. Requires extracting Unity project data via [VampireUnpacker](https://github.com/SurvivatonsAndMore/VampireUnpacker) or [AssetRipper](https://github.com/AssetRipper/AssetRipper) before running.

## Generic
Any MonoBehaviour filename can be parsed to resolve guids into associated file names.
```bash
# Parse asset file to resolve guids to names
bun run generic.ts --file EnemyConfig_Bat
```

This project was created using `bun init` in bun v1.3.13. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
