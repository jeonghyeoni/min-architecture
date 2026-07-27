#!/usr/bin/env node
/**
 * 관리자 비밀번호 해시 생성기.
 *
 *   node scripts/hash-password.mjs '내가정한비밀번호'
 *
 * 출력된 값을 Vercel 환경변수 ADMIN_PASSWORD_HASH 에 넣는다.
 * 비밀번호 자체는 어디에도 저장되지 않는다.
 */
import { scryptSync, randomBytes } from "node:crypto";

const password = process.argv[2];

if (!password) {
  console.error("사용법: node scripts/hash-password.mjs '비밀번호'");
  process.exit(1);
}
// 로그인에 15분당 5회 시도 제한이 걸려 있어 짧은 비밀번호도 무차별 대입으로
// 뚫기는 어렵다. 다만 너무 짧으면 추측만으로도 맞을 수 있어 최소선은 남겨둔다.
const MIN_LENGTH = 8;

if (password.length < MIN_LENGTH) {
  console.error(`비밀번호가 너무 짧습니다. ${MIN_LENGTH}자 이상으로 정해주세요.`);
  process.exit(1);
}
if (password.length < 12) {
  console.warn(
    `\n※ ${password.length}자입니다. 쓰는 데는 문제없지만, 여유가 되시면\n` +
      `  "민건축-양지면-2026" 처럼 길게 잡는 편이 안전합니다.`,
  );
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);

console.log("\nADMIN_PASSWORD_HASH 에 아래 값을 그대로 넣으세요:\n");
console.log(`${salt.toString("hex")}:${hash.toString("hex")}\n`);
console.log("ADMIN_SESSION_SECRET 에는 아래 값을 쓰시면 됩니다:\n");
console.log(`${randomBytes(32).toString("hex")}\n`);
