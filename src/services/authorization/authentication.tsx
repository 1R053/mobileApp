import { crypto } from './crypto';
import randomBytes from 'randombytes-pure';
import { AuthenticatedUser, AuthenticatedUserEncryptionKey, AuthenticatedUserTypes, SecureStoreAuthenticatedUserEncryptionKey, SecureStoreAuthenticatedUser } from '@types';
import * as SecureStore from 'expo-secure-store';
import { constants } from '@globals/constants';

async function getAuthenticatedUserPublicKeys(): Promise<string[]> {
    let publicKeys: string[] = [];

    const usersJson = await SecureStore.getItemAsync(constants.secureStore_authenticatedUsers);

    let users: SecureStoreAuthenticatedUser = {};

    if (usersJson) {
        users = JSON.parse(usersJson);
        publicKeys = Object.keys(users);
    }

    return publicKeys;
}

function authenticateUser(
    mnemonic: string,
    extraText?: string,
): AuthenticatedUserTypes {
    const keychain = crypto.mnemonicToKeychain(mnemonic, extraText);
    const keychainNonStandard = crypto.mnemonicToKeychain(mnemonic, extraText, true);

    const keychainPublicKey = keychain.publicKey.toString("hex");
    const keychainNonStandardPublicKey = keychain.publicKey.toString("hex");

    const user: AuthenticatedUserTypes = {
        standard: generateUserCredentials(keychain),
        nonStandard: undefined
    };

    if (keychainPublicKey !== keychainNonStandardPublicKey) {
        user.nonStandard = generateUserCredentials(keychainNonStandard);
    }

    return user;
}

function generateUserCredentials(keychain: any): { authenticatedUser: AuthenticatedUser, key: AuthenticatedUserEncryptionKey } {
    const seedHex = crypto.keychainToSeedHex(keychain);

    const privateKey = crypto.seedHexToPrivateKey(seedHex);
    const publicKey = crypto.privateKeyToBitCloutPublicKey(privateKey);

    const randomKey = randomBytes(32);
    const iv = randomBytes(16);
    const seedHexBuffer = new Buffer(seedHex);
    const encryptedSeedHex = crypto.aesEncrypt(iv, randomKey, seedHexBuffer);

    const authenticatedUser: AuthenticatedUser = {
        publicKey: publicKey,
        encryptedSeedHex: encryptedSeedHex
    };

    const key: AuthenticatedUserEncryptionKey = {
        key: randomKey.toString('hex'),
        iv: iv.toString('hex')
    };

    return { authenticatedUser, key };
}

async function addAuthenticatedUser(user: AuthenticatedUser, key: AuthenticatedUserEncryptionKey) {
    const usersJson = await SecureStore.getItemAsync(constants.secureStore_authenticatedUsers);

    let users: SecureStoreAuthenticatedUser = {};

    if (usersJson) {
        users = JSON.parse(usersJson);
    }

    users[user.publicKey] = user;

    const newUsersJson = JSON.stringify(users);
    await SecureStore.setItemAsync(constants.secureStore_authenticatedUsers, newUsersJson);

    const keyJson = await SecureStore.getItemAsync(constants.secureStore_authenticatedUsersEncryptionKeys);

    let keys: SecureStoreAuthenticatedUserEncryptionKey = {};

    if (keyJson) {
        keys = JSON.parse(keyJson);
    }

    keys[user.publicKey] = key;

    const newKeysJson = JSON.stringify(keys);
    await SecureStore.setItemAsync(constants.secureStore_authenticatedUsersEncryptionKeys, newKeysJson);
}

async function removeAuthenticatedUser(publicKey: string) {
    const usersJson = await SecureStore.getItemAsync(constants.secureStore_authenticatedUsers);

    let users: SecureStoreAuthenticatedUser = {};

    if (usersJson) {
        users = JSON.parse(usersJson);
    }

    delete users[publicKey];

    const newUsersJson = JSON.stringify(users);
    await SecureStore.setItemAsync(constants.secureStore_authenticatedUsers, newUsersJson);

    const keyJson = await SecureStore.getItemAsync(constants.secureStore_authenticatedUsersEncryptionKeys);

    let keys: SecureStoreAuthenticatedUserEncryptionKey = {};

    if (keyJson) {
        keys = JSON.parse(keyJson);
    }

    delete keys[publicKey];

    const newKeysJson = JSON.stringify(keys);
    await SecureStore.setItemAsync(constants.secureStore_authenticatedUsersEncryptionKeys, newKeysJson);
}

export const authentication = {
    getAuthenticatedUserPublicKeys,
    authenticateUser,
    addAuthenticatedUser,
    removeAuthenticatedUser
};