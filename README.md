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

This project was created using `bun init` in bun v1.3.13. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
