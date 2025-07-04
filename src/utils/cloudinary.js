import {v2 as cloudinary} from 'cloudinary';
import fs from 'fs';

// Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
    });

    const uploadOnCloudinary = async (filePath) => {
        try {
            if (!filePath) {
                throw new Error("File path is required for image upload");
            }
            const response = await cloudinary.uploader.upload(filePath, {
                resource_type: "auto",
            }
            )
            console.log("File uploaded successfully", response.url);
            return response;

        } catch (error) {
            fs.unlinkSync(filePath); // Delete the file if upload fails
            console.error("Error uploading file to Cloudinary:", error);
            return null;
        }
    }

export { uploadOnCloudinary };