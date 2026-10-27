import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const evidenceDirectory = resolve(root, "test-results/claim-mutations");
mkdirSync(evidenceDirectory, { recursive: true });

const commands = {
  fullUnit: ["npm", ["test"]],
  build: ["npm", ["run", "build"]],
  claims: ["npm", ["run", "test:claims"]],
};

const mutations = [
  {
    name: "field-reduction-polynomial",
    file: "src/rank/field.ts",
    from: "export const PRIMITIVE_POLYNOMIAL = 0b1_0011;",
    to: "export const PRIMITIVE_POLYNOMIAL = 0b1_1001;",
    command: [
      "npx",
      [
        "vitest",
        "run",
        "src/rank/field.test.ts",
        "-t",
        "matches an independently structured polynomial oracle",
      ],
    ],
  },
  {
    name: "binary-elimination-row-operation",
    file: "src/rank/matrix.ts",
    from: "matrix[row][entry] ^= matrix[rank][entry];",
    to: "matrix[row][entry] = matrix[rank][entry];",
    command: [
      "npx",
      ["vitest", "run", "src/rank/matrix.test.ts", "-t", "computes binary matrix rank"],
    ],
  },
  {
    name: "rank-weight-replaced-by-hamming",
    file: "src/rank/matrix.ts",
    from: "return binaryRank(vectorToBinaryMatrix(vector));",
    to: "return hammingWeight(vector);",
    command: [
      "npx",
      [
        "vitest",
        "run",
        "src/rank/matrix.test.ts",
        "-t",
        "distinguishes extension-symbol Hamming weight",
      ],
    ],
  },
  {
    name: "linearized-frobenius-term",
    file: "src/rank/gabidulin.ts",
    from: "multiply(message[1], square(point))",
    to: "multiply(message[1], point)",
    command: [
      "npx",
      ["vitest", "run", "src/rank/gabidulin.test.ts", "-t", "matches an independent encoder"],
    ],
  },
  {
    name: "unique-decoding-radius",
    file: "src/rank/gabidulin.ts",
    from: "Math.floor((MINIMUM_DISTANCE - 1) / 2);",
    to: "Math.floor((MINIMUM_DISTANCE - 1) / 3);",
    command: [
      "npx",
      ["vitest", "run", "src/rank/gabidulin.test.ts", "-t", "pins its declared parameters"],
    ],
  },
  {
    name: "radius-boundary-comparison",
    file: "src/rank/gabidulin.ts",
    from: ".filter((record) => record.distance <= DECODING_RADIUS);",
    to: ".filter((record) => record.distance < DECODING_RADIUS);",
    command: [
      "npx",
      [
        "vitest",
        "run",
        "src/rank/gabidulin.test.ts",
        "-t",
        "uses rank distance, not extension-symbol",
      ],
    ],
  },
  {
    name: "singleton-bound-exponent",
    file: "src/rank/gabidulin.ts",
    from: "FIELD_DEGREE * (LENGTH - MINIMUM_DISTANCE + 1);",
    to: "FIELD_DEGREE * (LENGTH - MINIMUM_DISTANCE);",
    command: [
      "npx",
      ["vitest", "run", "src/rank/gabidulin.test.ts", "-t", "recomputes the full MRD census"],
    ],
  },
  {
    name: "refusal-control-vector",
    file: "src/rank/scenarios.ts",
    from: "error: [10, 1, 0, 0] as Word,",
    to: "error: [2, 1, 0, 0] as Word,",
    command: [
      "npx",
      ["vitest", "run", "src/rank/scenarios.test.ts", "-t", "derives a rank-two refusal"],
    ],
  },
  {
    name: "miscorrection-control-vector",
    file: "src/rank/scenarios.ts",
    from: "error: [2, 1, 0, 0] as Word,",
    to: "error: [10, 1, 0, 0] as Word,",
    command: [
      "npx",
      ["vitest", "run", "src/rank/scenarios.test.ts", "-t", "derives a reproducible beyond-radius"],
    ],
  },
  {
    name: "learner-radius-claim",
    file: "src/main.ts",
    from: "The t = 1 guarantee has not been contradicted.",
    to: "The t = 1 guarantee was contradicted.",
    command: ["npm", ["run", "test:claims", "--", "--grep", "three decoder outcomes"]],
  },
];

const originals = new Map(
  [...new Set(mutations.map(({ file }) => file))].map((file) => [
    file,
    readFileSync(resolve(root, file)),
  ]),
);

function run(label, [command, args]) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, CI: "1" },
    maxBuffer: 32 * 1024 * 1024,
    timeout: 180_000,
  });
  const log = [`$ ${command} ${args.join(" ")}`, result.stdout ?? "", result.stderr ?? ""].join(
    "\n",
  );
  writeFileSync(resolve(evidenceDirectory, `${label}.log`), log);
  if (result.error) throw result.error;
  return result.status ?? 1;
}

function restoreAll() {
  for (const [file, bytes] of originals) writeFileSync(resolve(root, file), bytes);
}

function requirePassingBaseline(label) {
  for (const [name, command] of Object.entries(commands)) {
    if (run(`${label}-${name}`, command) !== 0) {
      throw new Error(`${label} ${name} gate failed; mutation results below it are invalid`);
    }
  }
}

let caught = 0;
const results = [];
try {
  requirePassingBaseline("baseline");
  console.log("baseline: unmutated copy PASSES");

  for (const mutation of mutations) {
    const path = resolve(root, mutation.file);
    const original = originals.get(mutation.file);
    if (!original) throw new Error(`no original captured for ${mutation.file}`);
    const source = original.toString("utf8");
    if (source.split(mutation.from).length !== 2) {
      throw new Error(`${mutation.name}: expected exactly one mutation target in ${mutation.file}`);
    }
    writeFileSync(path, source.replace(mutation.from, mutation.to));
    const status = run(`mutation-${mutation.name}`, mutation.command);
    writeFileSync(path, original);
    const killed = status !== 0;
    results.push({ name: mutation.name, killed });
    if (killed) {
      caught += 1;
      console.log(`caught: ${mutation.name}`);
    } else {
      console.error(`SURVIVED: ${mutation.name}`);
    }
  }
} finally {
  restoreAll();
}

for (const [file, original] of originals) {
  if (!readFileSync(resolve(root, file)).equals(original))
    throw new Error(`source restoration failed: ${file}`);
}

writeFileSync(
  resolve(evidenceDirectory, "summary.json"),
  `${JSON.stringify({ baseline: "passed", total: mutations.length, caught, results }, null, 2)}\n`,
);

if (caught !== mutations.length) {
  throw new Error(`${mutations.length - caught} of ${mutations.length} mutation(s) survived`);
}

if (run("restored-unit", commands.fullUnit) !== 0 || run("restored-build", commands.build) !== 0) {
  throw new Error("restored baseline failed after mutation campaign");
}
console.log(`all ${mutations.length} mutation(s) caught`);
