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
if (password.length < 10) {
  console.error("비밀번호가 너무 짧습니다. 10자 이상, 되도록 문장 형태로 정해주세요.");
  console.error("예: 민건축-양지면-2026-시공");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, 64);

console.log("\nADMIN_PASSWORD_HASH 에 아래 값을 그대로 넣으세요:\n");
console.log(`${salt.toString("hex")}:${hash.toString("hex")}\n`);
console.log("ADMIN_SESSION_SECRET 에는 아래 값을 쓰시면 됩니다:\n");
console.log(`${randomBytes(32).toString("hex")}\n`);
