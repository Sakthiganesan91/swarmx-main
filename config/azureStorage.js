const { BlobServiceClient } = require("@azure/storage-blob");

require("dotenv").config();

const { StorageSharedKeyCredential } = require("@azure/storage-blob");

const azureStore = async (blobName, data) => {
  try {
    const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
    const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;
    if (!accountName || !accountKey)
      throw Error("Azure Storage credentials not found");

    const sharedKeyCredential = new StorageSharedKeyCredential(
      accountName,
      accountKey
    );

    const blobServiceClient = new BlobServiceClient(
      `https://${accountName}.blob.core.windows.net`,
      sharedKeyCredential
    );

    const containerClient =
      blobServiceClient.getContainerClient("swarmxwebappdoc");

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const uploadBlobResponse = await blockBlobClient.upload(data, data.length);
    console.log(
      `Blob was uploaded successfully. requestId: ${uploadBlobResponse}`
    );
    return blockBlobClient.url;
  } catch (err) {
    throw err;
  }
};

module.exports = { azureStore };

