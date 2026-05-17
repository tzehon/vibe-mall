import { pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const PASSWORD_ALGORITHM = "pbkdf2_sha256";
const PASSWORD_ITERATIONS = 210000;
const PASSWORD_KEY_LENGTH = 32;

type HashPasswordOptions = {
  salt?: string;
};

function derivePasswordDigest(password: string, salt: string, iterations: number) {
  return pbkdf2Sync(password, salt, iterations, PASSWORD_KEY_LENGTH, "sha256").toString("hex");
}

export function hashPassword(password: string, options: HashPasswordOptions = {}) {
  const salt = options.salt ?? randomBytes(16).toString("hex");
  const digest = derivePasswordDigest(password, salt, PASSWORD_ITERATIONS);

  return `${PASSWORD_ALGORITHM}$${PASSWORD_ITERATIONS}$${salt}$${digest}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, iterationsValue, salt, expectedDigest] = passwordHash.split("$");
  const iterations = Number(iterationsValue);

  if (
    algorithm !== PASSWORD_ALGORITHM ||
    !Number.isInteger(iterations) ||
    iterations <= 0 ||
    !salt ||
    !expectedDigest
  ) {
    return false;
  }

  const actualDigest = derivePasswordDigest(password, salt, iterations);
  const expectedBuffer = Buffer.from(expectedDigest, "hex");
  const actualBuffer = Buffer.from(actualDigest, "hex");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, actualBuffer);
}
