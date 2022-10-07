import { Buffer } from "buffer";
import { Base64 } from "../../base-types";
import {
  getTransactionVersion,
  TransactionVersion,
} from "../transaction-utils";

const TestData: Array<[TransactionVersion, Base64]> = [
  [
    "legacy",
    "AUzawhRvQoFaeRhdcxpgS1J9MSCCY3+1Su+lIrmSdPqMzyVFWQ3OmUyOate16qFqrxaO057yZmLubyfLXczFHgIBAAQIPtgAs76l9rprtE5Q5YTW9Q2nwM9H7Nr5p8IWavzngmMqPWLxHd9O+8OhaYF0nTEPuqZrluLhtMiyB/IF4t6CImClDomIGZRbzcENQHna3dQs9W2jOjRGkTP5Hnfw2LuwsUxFz89vVR79B7ZCixj4pajCBgZUOApOw66uCwQkGkEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB1qFhtKgdUm7Dw0HMNAN6vXM1OnSN0JJRLBF+/v+ckMnAi2+wc/rYbks3949hmXGkPqZAzOAnsFfblw30+NNonxS/Za1WvSunFeRXQsIx8n1jYhz1t3jzfBokiVHRdWAo8qVmeFQtlMx60uUjXEUR/6UV35H1UnaynGnlzpIpyhAQYHAAMCAQcFBAhdoWxHnHXvOg==",
  ],
  [
    0,
    "ATi76PGbrz0K+1uiJiVIxfsXg5SE+zj9ZR/TKbTwtU6pPV84Qg5ZR4AaUjaef0uhFEw+XO8vkSwk7FaP9XO5JwWAAQABAn9ga/qYhdDgSftxl4CLVlBlRooyjZnabjgnerV4N1a5AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACmD6HHzY+RDvqxAZFPxVgCE7P6K8K2XJ1HTY4zWQ8dMgEBAgACDAIAAAABAAAAAAAAAAEfiZ3FeBS8m76OgSDN784WBijZvYu2yDuiOw5JxtU5cQEBAA==",
  ],
];

describe("getTransactionVersion", () => {
  test("get transaction versions", () => {
    for (const [expectedVersion, base64] of TestData) {
      const version = getTransactionVersion({
        buffer: Buffer.from(base64, "base64"),
      });
      expect(version).toBe(expectedVersion);
    }
  });
});
