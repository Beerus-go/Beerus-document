# Session Details

Two techniques are used, one is AES encryption and the other is JSON

## The principle of generating a token
- When the session.CreateToken function is called, it internally converts the parameters into a JSON string, and then stitches in a last valid time.
- The string obtained in the previous step is AES encrypted and returned as base64

## How token restoration works
- When the session.RestoreToken function is called, the token is decoded internally to base64, resulting in a []byte of encrypted data
- The encrypted data from the previous step is decrypted with AES to get the initial JSON string + the last valid time
- Cut the string from the previous step to get a JSON string and a timestamp, determine whether the current timestamp is greater than this timestamp, if it is greater than this timestamp, it means it has been invalidated, return the message directly
- If it is less than this timestamp, then convert the JSON string into struct

## Expiry principle
- When encrypting, Timeout + current timestamp, get a result, stitch the result to the JSON
- Before decrypting, determine if the timestamp in the previous step is greater than the current timestamp

[return the document just now](index.md)