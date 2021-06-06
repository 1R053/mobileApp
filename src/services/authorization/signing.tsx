import { crypto } from "./crypto";
import * as SecureStore from 'expo-secure-store';
import { SecureStoreAuthenticatedUserEncryptionKey, SecureStoreAuthenticatedUser } from '@types';

import KeyEncoder from "key-encoder";
import { constants } from "@globals/constants";
import { globals } from "@globals/globals";
const sha256 = require("sha256");
const ecies = require("./ecies");

var rs = require("jsrsasign");
var JWS = rs.jws.JWS;

var header = { alg: "ES256", typ: "JWT" };
var payload = { expire: "60" };

async function getSeedHex(): Promise<string> {
    const publicKey = globals.user.publicKey;

    const usersJson = await SecureStore.getItemAsync(constants.secureStore_authenticatedUsers);

    let users: SecureStoreAuthenticatedUser = {};
    if (usersJson) {
        users = JSON.parse(usersJson);
    }

    const keyJson = await SecureStore.getItemAsync(constants.secureStore_authenticatedUsersEncryptionKeys);
    let keys: SecureStoreAuthenticatedUserEncryptionKey = {};
    if (keyJson) {
        keys = JSON.parse(keyJson);
    }

    const user = users[publicKey];
    const userKey = keys[publicKey];

    const encryptedSeedHex = new Buffer(user.encryptedSeedHex, 'hex');
    const key = new Buffer(userKey.key, 'hex');
    const iv = new Buffer(userKey.iv, 'hex');

    let seedHex = ''
    seedHex = crypto.aesDecrypt(iv, key, encryptedSeedHex);

    return seedHex;
}

const signJWT = async (): Promise<string> => {
    const seedHex = await getSeedHex();
    const keyEncoder = new KeyEncoder("secp256k1");
    const encodedPrivateKey = keyEncoder.encodePrivate(seedHex, "raw", "pem");

    var signedJWT = JWS.sign(
        header.alg,
        JSON.stringify(header),
        JSON.stringify(payload),
        encodedPrivateKey
    );

    return signedJWT;
};

const signTransaction = async (transactionHex: string): Promise<string> => {
    const seedHex = await getSeedHex();

    const privateKey = crypto.seedHexToPrivateKey(seedHex);

    const transactionBytes = new Buffer(transactionHex, 'hex');
    const transactionHash = new Buffer(sha256.x2(transactionBytes), 'hex');
    const signature = privateKey.sign(transactionHash);
    const signatureBytes = new Buffer(signature.toDER());
    const signatureLength = crypto.uintToBuf(signatureBytes.length);

    const signedTransactionBytes = Buffer.concat(
        [
            transactionBytes.slice(0, -1),
            signatureLength,
            signatureBytes,
        ]
    );

    return signedTransactionBytes.toString("hex");
};

const decryptData = async (encryptedHex: string): Promise<string> => {
    const seedHex = await getSeedHex();

    const privateKey = crypto.seedHexToPrivateKey(seedHex);
    const privateKeyBuffer = privateKey.getPrivate().toArrayLike(Buffer);
    const encryptedBytes = new Buffer(encryptedHex, 'hex');

    const decryptedHex = ecies.decrypt(
        privateKeyBuffer,
        encryptedBytes
    );

    return decryptedHex;
}

export const signing = {
    signTransaction,
    decryptData,
    signJWT
};
