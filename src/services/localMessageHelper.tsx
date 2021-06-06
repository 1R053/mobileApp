import * as SecureStore from 'expo-secure-store';
import { Message } from '@types';
import { signing } from './authorization/signing';

export async function getLocalMessage(p_senderPublicKey: string, p_recipientPublicKey: string, p_timeStampNanos: number) {
    const key = p_senderPublicKey + '_' + p_recipientPublicKey + '_' + p_timeStampNanos;

    return SecureStore.getItemAsync(key);
}

export async function setLocalMessage(p_senderPublicKey: string, p_recipientPublicKey: string, p_timeStampNanos: number, p_message: string) {
    const key = p_senderPublicKey + '_' + p_recipientPublicKey + '_' + p_timeStampNanos;

    return SecureStore.setItemAsync(key, p_message);
}

export async function getMessageText(p_message: Message): Promise<string> {
    let returnValue = 'Encrypted message';

    try {
        if (p_message.IsSender && p_message.DecryptedText) {
            return p_message.DecryptedText;
        }

        if (p_message.IsSender) {
            const localMessage = await getLocalMessage(
                p_message.SenderPublicKeyBase58Check, p_message.RecipientPublicKeyBase58Check, p_message.TstampNanos
            );

            if (localMessage) {
                returnValue = localMessage;
            }
        } else {
            const decryptedMessage = await signing.decryptData(p_message.EncryptedText);
            return decryptedMessage;
        }
    } catch { }

    return returnValue;
}