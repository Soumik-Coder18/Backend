import { asyncHandler } from "../utils/asyncHandler.js";
import {apiErrors} from "../utils/apiErrors.js";
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {apiResponse} from "../utils/apiResponse.js"

const registerUser = asyncHandler(async(req,res)=>{
    // get user details
    // validation - not empty
    // check if user already exist or not : username & email
    // check for images
    // check for avtar
    // uplodad in cloudnary
    // create user object : create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return response

    const {userName, email, fullName, password} = req.body
    console.log("email :",email);
    console.log("userName:",userName);
    
    // if (fullName === ""){
    //     throw new apiErrors(400,"full name is required");
    // }

    if (
        [userName, email, fullName, password].some((field)=>field?.trim()=== "")
    ) {
        throw new apiErrors(400,"all fields are required required");
    }

    const existedUser = User.findOne({
        $or: [{ userName }, { email }]
    })

    if (existedUser){
        throw new apiErrors(409,"user with email or username already exists");
    }

    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.avatar[0]?.path;

    if (!avatarLocalPath) {
        throw new apiErrors(400,"Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new apiErrors(400,"Avatar is required");
    }

    const newUser = User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        userName : userName.toLowerCase()
    })

    const createdUser = await User.findById(newUser._id).select(
        "-password -refreshToken"
    )
    if (!createdUser){
        throw new apiErrors(500,"Something went wrong during the registrations");
    }
    // Response
    return res.status(201).json(
        new apiResponse(200,createdUser,"User Registered Successfully")
    )
    
})

export {registerUser};