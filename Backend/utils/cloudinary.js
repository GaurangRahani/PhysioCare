import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Keep trying to grab env variables (important for when user adds them after server start)
const configureCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
};

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        console.log(`[DEBUG] Cloudinary uploading file: ${file.originalname} (Field: ${file.fieldname})`);
        configureCloudinary(); // Refresh config in case it was just added
        
        let folder = 'physiocare/exercises';
        let resource_type = 'auto'; // Auto detects if it's image or video

        // Allowed formats
        const formats = ['jpeg', 'png', 'jpg', 'webp', 'mp4', 'mov'];

        return {
            folder: folder,
            resource_type: resource_type,
            allowed_formats: formats,
            // Cloudinary auto-generates a unique public_id
        };
    },
});

export const upload = multer({ storage: storage });
