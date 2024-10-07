import { ethers } from 'ethers';

export function generateEncryptionKey() {
  const privateKey = ethers.randomBytes(32);
  const publicKey = ethers.hexlify(privateKey);
  console.log('Generated encryption key:', publicKey);
  return publicKey;
}

export async function encryptContent(content, publicKey) {
  console.log('Encrypting content');
  console.log('Content to encrypt:', content);
  console.log('Public key for encryption:', publicKey);
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const keyData = ethers.getBytes(publicKey);

    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt']
    );

    const encryptedContent = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    );

    const result = ethers.hexlify(
      ethers.concat([iv, new Uint8Array(encryptedContent)])
    );
    console.log('Encryption result:', result);
    return result;
  } catch (error) {
    console.error('Error in encryptContent:', error);
    throw error;
  }
}

export async function decryptContent(encryptedContent, publicKey, signature) {
  console.log('Decrypting content');
  console.log('Encrypted content:', encryptedContent);
  console.log('Public key:', publicKey);
  console.log('Signature:', signature);
  try {
    const encryptedData = ethers.getBytes(encryptedContent);
    const iv = encryptedData.slice(0, 12);
    const data = encryptedData.slice(12);

    // Derive the actual decryption key using both publicKey and signature
    const decryptionKey = await deriveDecryptionKey(publicKey, signature);

    const key = await crypto.subtle.importKey(
      'raw',
      decryptionKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );

    const decryptedContent = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    );

    const decoder = new TextDecoder();
    const result = decoder.decode(decryptedContent);
    console.log('Decrypted content:', result);
    return result;
  } catch (error) {
    console.error('Error in decryptContent:', error);
    throw error;
  }
}

export function generateMessageToSign(pasteId, address) {
  const message = ethers.solidityPackedKeccak256(["uint256", "address"], [pasteId, address]);
  console.log('Generated message to sign:', message);
  return message;
}

export function verifySignature(message, signature, expectedSigner) {
  try {
    const recoveredAddress = ethers.verifyMessage(ethers.getBytes(message), signature);
    console.log('Signature verification:', {
      message,
      signature,
      expectedSigner,
      recoveredAddress
    });
    return recoveredAddress.toLowerCase() === expectedSigner.toLowerCase();
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

export async function deriveDecryptionKey(publicKey, signature) {
  console.log('Deriving decryption key');
  console.log('Public key:', publicKey);
  console.log('Signature:', signature);
  
  // Use both publicKey and signature to derive the actual decryption key
  const combinedKey = ethers.keccak256(ethers.concat([ethers.getBytes(publicKey), ethers.getBytes(signature)]));
  return ethers.getBytes(combinedKey);
}