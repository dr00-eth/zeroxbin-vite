import { ethers } from 'ethers';

export function generateEncryptionKey() {
  const privateKey = ethers.randomBytes(32);
  const publicKey = ethers.hexlify(privateKey);
  return { privateKey, publicKey };
}

export async function encryptContent(content, encryptionKey) {
  console.log('Encrypting content');
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(content);

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await crypto.subtle.importKey(
      'raw',
      encryptionKey.privateKey,
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

export async function decryptContent(encryptedContent, decryptionKey) {
  console.log('Decrypting content');
  console.log('Encrypted content:', encryptedContent);
  console.log('Decryption key:', decryptionKey);
  try {
    const encryptedData = ethers.getBytes(encryptedContent);
    console.log('Encrypted data length:', encryptedData.length);
    const iv = encryptedData.slice(0, 12);
    const data = encryptedData.slice(12);

    console.log('IV:', ethers.hexlify(iv));
    console.log('Data length:', data.length);

    const key = await crypto.subtle.importKey(
      'raw',
      ethers.getBytes(decryptionKey),
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
    return decoder.decode(decryptedContent);
  } catch (error) {
    console.error('Error in decryptContent:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    throw error;
  }
}

export async function deriveDecryptionKey(publicKey, signature) {
  console.log('Deriving decryption key');
  console.log('Public key:', publicKey);
  console.log('Signature:', signature);
  
  // In this case, we're using the public key directly as the decryption key
  // This assumes that the public key is actually the private key used for encryption
  return publicKey;
}

export async function testEncryptDecrypt(content) {
  const encryptionKey = generateEncryptionKey();
  console.log('Generated encryption key:', encryptionKey);

  const encryptedContent = await encryptContent(content, encryptionKey);
  console.log('Encrypted content:', encryptedContent);

  // Simulate the signature process (not actually used in this simplified version)
  const signature = ethers.randomBytes(65);
  const derivedKey = await deriveDecryptionKey(encryptionKey.publicKey, ethers.hexlify(signature));
  
  console.log('Derived key:', derivedKey);

  const decryptedContent = await decryptContent(encryptedContent, derivedKey);
  console.log('Decrypted content:', decryptedContent);

  return decryptedContent === content;
}