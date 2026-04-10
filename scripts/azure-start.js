const { spawn, spawnSync } = require("child_process");

const port = process.env.PORT || "3000";

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

async function main() {
  run(process.platform === "win32" ? "npx.cmd" : "npx", ["prisma", "generate"]);
  run(process.platform === "win32" ? "npx.cmd" : "npx", ["prisma", "db", "push"]);

  const child = spawn(process.platform === "win32" ? "npx.cmd" : "npx", ["next", "start", "-p", port], {
    stdio: "inherit",
    env: process.env,
    shell: false,
  });

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });

  child.on("error", (error) => {
    console.error(error);
    process.exit(1);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});