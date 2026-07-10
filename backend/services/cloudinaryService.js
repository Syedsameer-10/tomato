import crypto from "crypto";

const getCloudinaryConfig = () => ({
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_API_KEY,
  apiSecret: process.env.CLOUDINARY_API_SECRET,
});

const isImageDataUrl = (value) =>
  typeof value === "string" && /^data:image\/(png|jpe?g|webp|gif);base64,/i.test(value);

const signCloudinaryParams = (params, apiSecret) => {
  const signaturePayload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return crypto
    .createHash("sha1")
    .update(`${signaturePayload}${apiSecret}`)
    .digest("hex");
};

export const uploadImageToCloudinary = async ({ file, folder }) => {
  const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();

  if (!cloudName || !apiKey || !apiSecret) {
    const error = new Error("Cloudinary is not configured");
    error.status = 500;
    throw error;
  }

  if (!isImageDataUrl(file)) {
    const error = new Error("Upload a PNG, JPG, WEBP, or GIF image");
    error.status = 400;
    throw error;
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = {
    folder: folder || "tomato",
    timestamp,
  };
  const signature = signCloudinaryParams(paramsToSign, apiSecret);
  const body = new URLSearchParams({
    ...paramsToSign,
    file,
    api_key: apiKey,
    signature,
  });

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });
  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data?.error?.message || "Cloudinary upload failed");
    error.status = response.status;
    throw error;
  }

  return data;
};
