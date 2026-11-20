import { createInterface } from "node:readline";
import { createClient } from "@supabase/supabase-js";

const MIN_LENGTH = 12;

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_KEY;
if (!url || !key) {
  console.error("SUPABASE_URL and SUPABASE_KEY must be set (run via `pnpm set-password`).");
  process.exit(1);
}
if (!process.stdin.isTTY) {
  console.error("Run this in PowerShell or the VS Code terminal so the password can be typed hidden.");
  process.exit(1);
}

function ask(question, { hidden = false } = {}) {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  if (hidden) {
    rl._writeToOutput = (text) => {
      if (text.startsWith(question)) rl.output.write(question);
    };
  }
  return new Promise((resolve) =>
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    }),
  );
}

const admin = createClient(url, key, { auth: { persistSession: false } }).auth.admin;

const email = (await ask("Account email: ")).trim().toLowerCase();
const { data, error } = await admin.listUsers({ perPage: 1000 });
if (error) throw error;
const user = data.users.find((candidate) => candidate.email?.toLowerCase() === email);
if (!user) {
  console.error(`No account found for ${email}.`);
  process.exit(1);
}

const password = await ask(`New password (min ${MIN_LENGTH} characters): `, { hidden: true });
if (password.length < MIN_LENGTH) {
  console.error(`Password must be at least ${MIN_LENGTH} characters.`);
  process.exit(1);
}
if ((await ask("Type it again: ", { hidden: true })) !== password) {
  console.error("Passwords didn't match. Nothing was changed.");
  process.exit(1);
}

const { error: updateError } = await admin.updateUserById(user.id, { password });
if (updateError) {
  console.error(`Couldn't update the password: ${updateError.message}`);
  process.exit(1);
}
console.log(`Password updated for ${email}. You can sign in at /login now.`);
