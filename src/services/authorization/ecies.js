/**
 * Browser ecies-parity implementation.
 *
 * This is based of the eccrypto js module
 *
 * Imported from https://github.com/sigp/ecies-parity with some changes:
 * - Remove PARITY_DEFAULT_HMAC
 * - Use const instead of var/let
 * - Use node: crypto instead of subtle
 * - User pure javascript libraries to support react-native expo
 */

const EC = require("elliptic").ec;
const ec = new EC("secp256k1");
const jsSHA = require("jssha");
var aesjs = require('aes-js');

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

// The KDF as implemented in Parity
const kdf = function (secret, outputLength) {
  let ctr = 1;
  let written = 0;
  let result = Buffer.from('');
  while (written < outputLength) {
    const ctrs = Buffer.from([ctr >> 24, ctr >> 16, ctr >> 8, ctr]);

    const shaObj = new jsSHA("SHA-256", "UINT8ARRAY", { encoding: "UTF8" });
    shaObj.update(Buffer.concat([ctrs, secret]));
    const hashResult = new Buffer(shaObj.getHash("UINT8ARRAY"));

    result = Buffer.concat([result, hashResult])
    written += 32;
    ctr += 1;
  }
  return result;
}

// AES-128-CTR is used in the Parity implementation
// Get the AES-128-CTR browser implementation
export const aesCtrEncrypt = function (counter, key, data) {
  var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(counter));
  var encryptedBytes = aesCtr.encrypt(data);
  var encryptedText = aesjs.utils.hex.fromBytes(encryptedBytes);
  return encryptedText;
}

export const aesCtrDecrypt = function (counter, key, data) {
  var aesCtr = new aesjs.ModeOfOperation.ctr(key, new aesjs.Counter(counter));
  var decryptedBytes = aesCtr.decrypt(data);
  var decryptedText = aesjs.utils.utf8.fromBytes(decryptedBytes);
  return decryptedText;
}

function hmacSha256Sign(key, msg) {
  const shaObj = new jsSHA("SHA-256", "UINT8ARRAY", {
    hmacKey: { value: key, format: "UINT8ARRAY" },
  });
  shaObj.update(msg);
  const hmac = shaObj.getHash("UINT8ARRAY");
  return new Buffer(hmac);
}

//ECDH
const derive = function (privateKeyA, publicKeyB) {
  assert(Buffer.isBuffer(privateKeyA), "Bad input");
  assert(Buffer.isBuffer(publicKeyB), "Bad input");
  assert(privateKeyA.length === 32, "Bad private key");
  assert(publicKeyB.length === 65, "Bad public key");
  assert(publicKeyB[0] === 4, "Bad public key");
  const keyA = ec.keyFromPrivate(privateKeyA);
  const keyB = ec.keyFromPublic(publicKeyB);
  const Px = keyA.derive(keyB.getPublic());  // BN instance
  return new Buffer(Px.toArray());
};


// Encrypt AES-128-CTR and serialise as in Parity
// Serialization: <ephemPubKey><IV><CipherText><HMAC>
export const encrypt = function (publicKeyTo, msg, opts) {
  opts = opts || {};
  const ephemPrivateKey = opts.ephemPrivateKey || randomBytes(32);
  const ephemPublicKey = getPublic(ephemPrivateKey);

  const sharedPx = derive(ephemPrivateKey, publicKeyTo);
  const hash = kdf(sharedPx, 32);
  const iv = opts.iv || randomBytes(16);
  const encryptionKey = hash.slice(0, 16);

  // Generate hmac
  const shaObj = new jsSHA("SHA-256", "UINT8ARRAY", { encoding: "UTF8" });
  shaObj.update(hash.slice(16));
  const macKey = new Buffer(shaObj.getHash("UINT8ARRAY"));

  const ciphertext = aesCtrEncrypt(iv, encryptionKey, msg);
  const dataToMac = Buffer.from([...iv, ...ciphertext]);
  const HMAC = hmacSha256Sign(macKey, dataToMac);

  return Buffer.from([...ephemPublicKey, ...iv, ...ciphertext, ...HMAC]);
};

// Decrypt serialised AES-128-CTR
export const decrypt = function (privateKey, encrypted) {
  const metaLength = 1 + 64 + 16 + 32;
  assert(encrypted.length > metaLength, "Invalid Ciphertext. Data is too small")
  assert(encrypted[0] >= 2 && encrypted[0] <= 4, "Not valid ciphertext.")

  // deserialize
  const ephemPublicKey = encrypted.slice(0, 65);
  const cipherTextLength = encrypted.length - metaLength;
  const iv = encrypted.slice(65, 65 + 16);
  const cipherAndIv = encrypted.slice(65, 65 + 16 + cipherTextLength);
  const ciphertext = cipherAndIv.slice(16);
  const msgMac = encrypted.slice(65 + 16 + cipherTextLength);

  // check HMAC
  const px = derive(privateKey, ephemPublicKey);
  const hash = kdf(px, 32);
  const encryptionKey = hash.slice(0, 16);

  const shaObj = new jsSHA("SHA-256", "UINT8ARRAY", { encoding: "UTF8" });
  shaObj.update(hash.slice(16));
  const macKey = new Buffer(shaObj.getHash("UINT8ARRAY"));

  const dataToMac = Buffer.from(cipherAndIv);
  const hmacGood = hmacSha256Sign(macKey, dataToMac);
  assert(hmacGood.equals(msgMac), "Incorrect MAC");
  const decrypted = aesCtrDecrypt(iv, encryptionKey, ciphertext);
  return decrypted;
};
