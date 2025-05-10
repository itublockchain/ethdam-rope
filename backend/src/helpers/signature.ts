'use strict';

import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto-js';

class Signature {
    private apikey: string;
    private apiSecret: string;

    constructor(apiKey: string, apiSecret: string) {
        if (!apiKey || !apiSecret) {
            throw new Error('apikey and apiSecret must be suppiled to calculate signature');
        }
        this.apikey = apiKey;
        this.apiSecret = apiSecret;
    }

    calculate(nonce?: string, timestamp?: string): Result {
        if (!nonce) {
            nonce = uuidv4();
        }

        if (!timestamp) {
            timestamp = new Date().toUTCString();
        }

        // format raw signature
        const signature = `date: ${timestamp}\nx-mod-nonce: ${nonce}`;
        // console.debug(`Raw signature string is:\n-----------\n${signature}\n-----------`);
    
        // sign and encode signature
        const signatureSigned = crypto.HmacSHA1(signature, this.apiSecret);
        const signatureEncoded = encodeURIComponent(crypto.enc.Base64.stringify(signatureSigned));
        // console.debug(`Signed signature is [${signatureSigned}] and encoded is [${signatureEncoded}]`);
    
        return new Result(this.apikey, timestamp, nonce, signatureEncoded);
    }
}

class Result {
    private timestamp: string;
    private nonce: string;
    private encodedSignature: string;
    private authorisation: string;

    constructor(key: string, timestamp: string, nonce: string, encodedSignature: string) {
        this.timestamp = timestamp;
        this.nonce = nonce;
        this.encodedSignature = encodedSignature;
        this.authorisation = `Signature keyId="${key}",algorithm="hmac-sha1",headers="date x-mod-nonce",signature="${encodedSignature}"`;
    }

    getTimeStamp(): string {
        return this.timestamp;
    }

    getHTTPHeaders(): Record<string, string> {
        return {
            'Date': this.timestamp,
            'x-mod-nonce': this.nonce,
            'Authorization': this.authorisation
        };
    }

    getSignature(): string {
        return this.encodedSignature;
    }
}

export { Signature, Result }; 