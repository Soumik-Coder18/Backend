import { asyncHandler } from "../utils/asyncHandler.js";
import { apiError } from "../utils/apiError.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {apiResponse} from "../utils/apiResponse.js"

const registerUser = asyncHandler(async(req,res)=>{
    // get user details
    // validation - not empty
    // check if user already exist or not : userName & email
    // check for images
    // check for avtar
    // uplodad in cloudnary
    // create user object : create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response

    let { userName, email, fullName, password } = req.body;

    if (!userName || !email || !fullName || !password) {
        throw new apiError(400, "All fields are required");
    }

    userName = userName.trim().toLowerCase();
    email = email.trim().toLowerCase();

    if ([userName, email, fullName, password].some(field => field.trim() === "")) {
        throw new apiError(400, "Fields cannot be empty");
    }

    console.log("email :",email);
    console.log("userName:",userName);
    
    const existedUser = await User.findOne({
        $or: [{ userName }, { email }]
    })

    if (existedUser){
        throw new apiError(409,"user with email or userName already exists");
    }
    console.log("FILES RECEIVED:", req.files);
    const avatarLocalPath = req?.files?.avatar?.[0]?.path;
    // const coverImageLocalPath = req?.files?.coverImage?.[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {
        throw new apiError(400,"Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new apiError(400,"Avatar is required");
    }
    
    

    const newUser = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        userName
    })

    const createdUser = await User.findById(newUser._id).select(
        "-password -refreshToken"
    )
    if (!createdUser){
        throw new apiError(500,"Something went wrong during the registrations");
    }
    // Response
    return res.status(201).json(
        new apiResponse(200,createdUser,"User Registered Successfully")
    )
    
})

export {registerUser};