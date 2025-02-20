const User = require("../models/userModel");
const Company = require("../models/companyModel");
const azure = require("../config/azureStorage");

const {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
} = require("@azure/storage-blob");

const accountName = process.env.AZURE_STORAGE_ACCOUNT_NAME;
const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY;

const sharedKeyCredential = new StorageSharedKeyCredential(
  accountName,
  accountKey
);
const blobServiceClient = new BlobServiceClient(
  `https://${accountName}.blob.core.windows.net`,
  sharedKeyCredential
);

const getBlobUrlWithSasToken = async (containerName, blobName) => {
  const containerClient = blobServiceClient.getContainerClient(containerName);

  const sasToken = generateBlobSASQueryParameters(
    {
      containerName,
      blobName,
      permissions: "r",
      expiresOn: new Date(new Date().valueOf() + 3600 * 1000), // 1 hour expiry
    },
    sharedKeyCredential
  ).toString();

  const blobUrl = `${containerClient.url}/${blobName}?${sasToken}`;
  return blobUrl;
};

function extractContainerAndBlobName(blobUrl) {
  try {
    // Create a URL object
    const url = new URL(blobUrl);

    // Extract the path part of the URL (after the domain)
    const path = url.pathname; // e.g., "/container-name/blob-name.jpg"

    // Split the path to get container name and blob name
    const parts = path.split("/").filter(Boolean); // Removes empty parts
    if (parts.length < 2) {
      throw new Error("Invalid Blob URL: Missing container or blob name.");
    }

    const containerName = parts[0]; // First part is the container name
    const blobName = parts.slice(1).join("/"); // Rest is the blob name

    return { containerName, blobName };
  } catch (error) {
    console.error("Error extracting container and blob name:", error);
    return null;
  }
}

const getUserById = async (req, res) => {
  const _id = req.params.id;

  try {
    const user = await User.findById(_id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    let logoUrl = "";
    if (user.logoImage) {
      const { containerName, blobName } = extractContainerAndBlobName(
        user.logoImage
      );

      logoUrl = await getBlobUrlWithSasToken(containerName, blobName);
    }

    let bannerUrl = "";
    if (user.bannerImage) {
      const { containerName, blobName } = extractContainerAndBlobName(
        user.bannerImage
      );

      bannerUrl = await getBlobUrlWithSasToken(containerName, blobName);
    }

    res.status(200).json({
      user,
      logoUrl,
      bannerUrl,
    });
  } catch (error) {
    res.status(500).json({
      error: "Internal Server Error",
    });
  }
};

const updateuser = async (req, res) => {
  const userId = req.user._id;
  const _id = req.params.id;

  const {
    companyName,
    aboutUs,
    address,
    email,
    phoneNumber,
    orgType,
    industry,
    teamSize,
    establishYear,
    website,
    vision,
    pincode,
    city,
    state,
    country,
  } = req.body;

  // Construct the user object
  const userObject = {
    companyName,
    aboutUs,
    address,
    email,
    phoneNumber,
    website,
    establishYear,
    orgType,
    industry,
    teamSize,
    vision,
    pincode,
    city,
    state,
    country,
  };

  try {
    const user = await User.findOne({ _id });

    let url = "";

    if (req.files) {
      const logo = req.files["logo"] && req.files["logo"][0];
      const banner = req.files["banner"] && req.files["banner"][0];

      if (logo) {
        const logoName = `${logo.fieldname}${_id}${logo.originalname}`;

        let logoUrl = await azure.azureStore(logoName, logo.buffer);

        user.logoImage = logoUrl;
      }
      if (banner) {
        const bannerName = `${banner.fieldname}${_id}${banner.originalname}`;

        let bannerUrl = await azure.azureStore(bannerName, banner.buffer);

        user.bannerImage = bannerUrl;
      }

      const companyName = req.body.companyName;
      const aboutUs = req.body.aboutUs;

      if (companyName && aboutUs) {
        user.companyName = companyName;
        user.aboutUs = aboutUs;
        const company = await Company.findOne({ userId: _id });

        if (companyName !== company.company) {
          await Company.findOneAndUpdate(
            { _id: company._id },
            { company: companyName }
          );
        }

        await user.save();
      }
    }

    if (!user) {
      throw new Error("User not found");
    }

    // Update the user object with the new values
    await User.findOneAndUpdate({ _id }, userObject);

    // Update company name

    res.status(201).json({
      message: "Profile updated successfully",
      success: true,
    });
  } catch (error) {
    console.error(error); // Log the detailed error for debugging
    res.status(401).json({
      error: error.message,
    });
  }
};
const updateusersociallink = async (req, res) => {
  const userId = req.user._id;
  const _id = req.params.id;

  const { data: socialLinks } = req.body;

  // Initialize social media links with default values
  let linkedin = "";
  let instagram = "";
  let twitter = "";
  let youtube = "";
  let facebook = "";

  // Check if socialLinks is defined and is an array
  if (Array.isArray(socialLinks)) {
    // Update social media links based on provided data
    socialLinks.forEach((link) => {
      switch (link.selectValue) {
        case "linkedin":
          linkedin = link.textValue;
          break;
        case "instagram":
          instagram = link.textValue;
          break;
        case "twitter":
          twitter = link.textValue;
          break;
        case "youtube":
          youtube = link.textValue;
          break;
        case "facebook":
          facebook = link.textValue;
          break;
        default:
          // Handle other social media types if needed
          break;
      }
    });
  }

  // Construct the user object
  const userObject = {
    linkedin,
    facebook,
    instagram,
    twitter,
    youtube,
  };

  try {
    const user = await User.findOne({ _id });

    if (!user) {
      throw new Error("User not found");
    }

    // Update the user object with the new values
    await User.findOneAndUpdate({ _id }, userObject);

    res.status(201).json({
      message: "Profile updated successfully",
      success: true,
    });
  } catch (error) {
    console.error(error); // Log the detailed error for debugging
    res.status(401).json({
      error: error.message,
    });
  }
};

const checkProfile = async (req, res) => {
  const _id = req.params.id;
  try {
    const existingUser = await User.findOne({
      _id,
    });
    if (
      existingUser.orgType === null ||
      existingUser.industry === null ||
      existingUser.teamSize === null ||
      existingUser.website === null
    ) {
      res.status(201).json({
        message: true,
      });
    } else {
      res.status(201).json({
        message: false,
      });
    }
  } catch (error) {
    res.status(401).json({
      message: error,
    });
  }
};

module.exports = {
  getUserById,
  updateuser,
  updateusersociallink,
  checkProfile,
};
